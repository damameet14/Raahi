#!/usr/bin/env python3
"""Flag likely deep imports across business modules in Python and TypeScript projects."""

from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path

EXCLUDED_DIRECTORY_NAMES = {
    ".git",
    ".next",
    ".venv",
    "__pycache__",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "target",
    "venv",
}

MODULE_CONTAINER_NAMES = {"modules", "features"}
ALLOWED_PUBLIC_SEGMENT_NAMES = {
    "contracts",
    "public_interface",
    "public-interface",
}

PYTHON_IMPORT_PATTERN = re.compile(
    r"^\s*(?:from|import)\s+([A-Za-z_][A-Za-z0-9_\.]*)",
    re.MULTILINE,
)
TYPESCRIPT_IMPORT_PATTERN = re.compile(
    r"(?:from\s+|import\s*\(\s*)['\"]([^'\"]+)['\"]"
)


@dataclass(frozen=True)
class BoundaryFinding:
    source_path: Path
    imported_path: str
    reason: str


def parse_arguments() -> argparse.Namespace:
    argument_parser = argparse.ArgumentParser(
        description=(
            "Flag likely deep cross-module imports. Findings require human confirmation."
        )
    )
    argument_parser.add_argument("repository_path", nargs="?", default=".")
    argument_parser.add_argument(
        "--fail-on-findings",
        action="store_true",
        help="Return exit code 1 when findings exist.",
    )
    return argument_parser.parse_args()


def module_identity_for_path(path: Path) -> tuple[str, str] | None:
    path_parts = path.parts
    for part_index, path_part in enumerate(path_parts[:-1]):
        if path_part in MODULE_CONTAINER_NAMES and part_index + 1 < len(path_parts):
            return path_part, path_parts[part_index + 1]
    return None


def extract_import_module_identity(imported_path: str) -> tuple[str, str, list[str]] | None:
    normalized_path = imported_path.replace("\\", "/").replace(".", "/")
    path_segments = [segment for segment in normalized_path.split("/") if segment]

    for segment_index, path_segment in enumerate(path_segments[:-1]):
        if path_segment in MODULE_CONTAINER_NAMES and segment_index + 1 < len(path_segments):
            return (
                path_segment,
                path_segments[segment_index + 1],
                path_segments[segment_index + 2 :],
            )
    return None


def is_likely_allowed_public_import(remaining_segments: list[str]) -> bool:
    if not remaining_segments:
        return True
    first_remaining_segment = remaining_segments[0]
    return first_remaining_segment in ALLOWED_PUBLIC_SEGMENT_NAMES or first_remaining_segment in {
        "index",
        "__init__",
    }


def inspect_file(repository_path: Path, source_path: Path) -> list[BoundaryFinding]:
    source_module_identity = module_identity_for_path(source_path.relative_to(repository_path))
    if source_module_identity is None:
        return []

    try:
        source_text = source_path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return []

    if source_path.suffix == ".py":
        imported_paths = PYTHON_IMPORT_PATTERN.findall(source_text)
    elif source_path.suffix in {".js", ".jsx", ".ts", ".tsx"}:
        imported_paths = TYPESCRIPT_IMPORT_PATTERN.findall(source_text)
    else:
        return []

    findings: list[BoundaryFinding] = []
    for imported_path in imported_paths:
        imported_module_identity = extract_import_module_identity(imported_path)
        if imported_module_identity is None:
            continue

        imported_container_name, imported_module_name, remaining_segments = (
            imported_module_identity
        )
        source_container_name, source_module_name = source_module_identity

        if (
            imported_container_name == source_container_name
            and imported_module_name == source_module_name
        ):
            continue

        if not is_likely_allowed_public_import(remaining_segments):
            findings.append(
                BoundaryFinding(
                    source_path=source_path,
                    imported_path=imported_path,
                    reason=(
                        "appears to import another module below its public interface or "
                        "contract boundary"
                    ),
                )
            )

    return findings


def main() -> int:
    arguments = parse_arguments()
    repository_path = Path(arguments.repository_path).expanduser().resolve()

    if not repository_path.is_dir():
        print(f"Repository path is not a directory: {repository_path}")
        return 2

    findings: list[BoundaryFinding] = []
    for source_path in repository_path.rglob("*"):
        if not source_path.is_file():
            continue
        if any(parent.name in EXCLUDED_DIRECTORY_NAMES for parent in source_path.parents):
            continue
        findings.extend(inspect_file(repository_path, source_path))

    unique_findings = sorted(
        set(findings),
        key=lambda finding: (
            str(finding.source_path).casefold(),
            finding.imported_path.casefold(),
        ),
    )

    if not unique_findings:
        print("No likely deep cross-module imports were found.")
        return 0

    print(f"Found {len(unique_findings)} module-boundary review item(s):")
    for finding in unique_findings:
        relative_source_path = finding.source_path.relative_to(repository_path)
        print(
            f"- {relative_source_path}: import '{finding.imported_path}' "
            f"{finding.reason}"
        )

    return 1 if arguments.fail_on_findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
