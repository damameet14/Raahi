#!/usr/bin/env python3
"""Flag likely shortened or vague project-controlled names without modifying files."""

from __future__ import annotations

import argparse
import ast
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

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

PROHIBITED_SHORTENED_WORDS = {
    "auth": "authentication",
    "cfg": "configuration",
    "ctx": "context",
    "fn": "function or a responsibility-specific noun",
    "mgr": "manager or a more precise responsibility",
    "obj": "object or the represented business concept",
    "pwd": "password",
    "ref": "reference",
    "repo": "repository",
    "req": "request",
    "res": "response or result",
    "svc": "service or a more precise responsibility",
    "tmp": "temporary",
    "usr": "user",
    "util": "a precise responsibility",
    "utils": "a precise responsibility",
    "val": "value or the represented business concept",
}

VAGUE_COMPLETE_NAMES = {
    "common",
    "data",
    "general",
    "helper",
    "helpers",
    "item",
    "items",
    "logic",
    "manager",
    "misc",
    "processor",
    "service",
    "temp",
    "utility",
    "utilities",
}

SOURCE_FILE_SUFFIXES = {".py", ".js", ".jsx", ".ts", ".tsx"}
JAVASCRIPT_IDENTIFIER_PATTERN = re.compile(
    r"\b(?:class|function|const|let|var|interface|type|enum)\s+([A-Za-z_$][A-Za-z0-9_$]*)"
)


@dataclass(frozen=True)
class NamingFinding:
    path: Path
    line_number: int | None
    name: str
    reason: str


def parse_arguments() -> argparse.Namespace:
    argument_parser = argparse.ArgumentParser(
        description="Flag likely vague and shortened names. This script never renames code."
    )
    argument_parser.add_argument("repository_path", nargs="?", default=".")
    argument_parser.add_argument(
        "--fail-on-findings",
        action="store_true",
        help="Return exit code 1 when findings exist.",
    )
    return argument_parser.parse_args()


def split_identifier_words(identifier: str) -> list[str]:
    normalized_identifier = re.sub(r"[^A-Za-z0-9]+", " ", identifier)
    camel_case_separated = re.sub(
        r"(?<=[a-z0-9])(?=[A-Z])", " ", normalized_identifier
    )
    acronym_separated = re.sub(
        r"(?<=[A-Z])(?=[A-Z][a-z])", " ", camel_case_separated
    )
    return [word.casefold() for word in acronym_separated.split() if word]


def evaluate_name(path: Path, line_number: int | None, name: str) -> list[NamingFinding]:
    findings: list[NamingFinding] = []
    identifier_words = split_identifier_words(name)

    for identifier_word in identifier_words:
        replacement = PROHIBITED_SHORTENED_WORDS.get(identifier_word)
        if replacement is not None:
            findings.append(
                NamingFinding(
                    path=path,
                    line_number=line_number,
                    name=name,
                    reason=(
                        f"contains shortened word '{identifier_word}'; use '{replacement}' "
                        "when it matches the intended meaning"
                    ),
                )
            )

    if len(identifier_words) == 1 and identifier_words[0] in VAGUE_COMPLETE_NAMES:
        findings.append(
            NamingFinding(
                path=path,
                line_number=line_number,
                name=name,
                reason="is vague without a business subject or precise responsibility",
            )
        )

    return findings


def iter_repository_paths(repository_path: Path) -> Iterable[Path]:
    for path in repository_path.rglob("*"):
        if any(parent.name in EXCLUDED_DIRECTORY_NAMES for parent in path.parents):
            continue
        if path.name in EXCLUDED_DIRECTORY_NAMES:
            continue
        yield path


def inspect_python_file(file_path: Path) -> list[NamingFinding]:
    try:
        source_text = file_path.read_text(encoding="utf-8")
        syntax_tree = ast.parse(source_text)
    except (OSError, UnicodeDecodeError, SyntaxError):
        return []

    findings: list[NamingFinding] = []
    for syntax_node in ast.walk(syntax_tree):
        names_with_lines: list[tuple[str, int | None]] = []
        if isinstance(syntax_node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            names_with_lines.append((syntax_node.name, syntax_node.lineno))
            if isinstance(syntax_node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                function_arguments = (
                    list(syntax_node.args.posonlyargs)
                    + list(syntax_node.args.args)
                    + list(syntax_node.args.kwonlyargs)
                )
                if syntax_node.args.vararg:
                    function_arguments.append(syntax_node.args.vararg)
                if syntax_node.args.kwarg:
                    function_arguments.append(syntax_node.args.kwarg)
                names_with_lines.extend(
                    (function_argument.arg, getattr(function_argument, "lineno", syntax_node.lineno))
                    for function_argument in function_arguments
                )
        elif isinstance(syntax_node, ast.Name) and isinstance(syntax_node.ctx, ast.Store):
            names_with_lines.append((syntax_node.id, getattr(syntax_node, "lineno", None)))

        for name, line_number in names_with_lines:
            findings.extend(evaluate_name(file_path, line_number, name))

    return findings


def inspect_javascript_or_typescript_file(file_path: Path) -> list[NamingFinding]:
    try:
        source_lines = file_path.read_text(encoding="utf-8").splitlines()
    except (OSError, UnicodeDecodeError):
        return []

    findings: list[NamingFinding] = []
    for line_number, source_line in enumerate(source_lines, start=1):
        for identifier_match in JAVASCRIPT_IDENTIFIER_PATTERN.finditer(source_line):
            findings.extend(
                evaluate_name(file_path, line_number, identifier_match.group(1))
            )
    return findings


def main() -> int:
    arguments = parse_arguments()
    repository_path = Path(arguments.repository_path).expanduser().resolve()

    if not repository_path.is_dir():
        print(f"Repository path is not a directory: {repository_path}")
        return 2

    findings: list[NamingFinding] = []
    for path in iter_repository_paths(repository_path):
        findings.extend(evaluate_name(path, None, path.stem if path.is_file() else path.name))
        if path.is_file() and path.suffix in SOURCE_FILE_SUFFIXES:
            if path.suffix == ".py":
                findings.extend(inspect_python_file(path))
            else:
                findings.extend(inspect_javascript_or_typescript_file(path))

    unique_findings = sorted(
        set(findings),
        key=lambda finding: (
            str(finding.path).casefold(),
            finding.line_number or 0,
            finding.name.casefold(),
            finding.reason,
        ),
    )

    if not unique_findings:
        print("No likely descriptive-naming violations were found.")
        return 0

    print(f"Found {len(unique_findings)} naming review item(s):")
    for finding in unique_findings:
        location = str(finding.path.relative_to(repository_path))
        if finding.line_number is not None:
            location += f":{finding.line_number}"
        print(f"- {location}: '{finding.name}' {finding.reason}")

    return 1 if arguments.fail_on_findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
