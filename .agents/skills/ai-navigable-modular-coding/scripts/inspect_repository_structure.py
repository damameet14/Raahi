#!/usr/bin/env python3
"""Print a compact, cross-platform repository tree for targeted AI navigation."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable

DEFAULT_EXCLUDED_DIRECTORY_NAMES = {
    ".git",
    ".idea",
    ".next",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".turbo",
    ".venv",
    ".vscode",
    "__pycache__",
    "bin",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "obj",
    "target",
    "venv",
}


def parse_arguments() -> argparse.Namespace:
    argument_parser = argparse.ArgumentParser(
        description="Print a repository tree while excluding generated directories."
    )
    argument_parser.add_argument(
        "repository_path",
        nargs="?",
        default=".",
        help="Repository root. Defaults to the current directory.",
    )
    argument_parser.add_argument(
        "--maximum-depth",
        type=int,
        default=5,
        help="Maximum displayed depth below the repository root. Defaults to 5.",
    )
    argument_parser.add_argument(
        "--include-hidden",
        action="store_true",
        help="Include hidden files except explicitly excluded directories.",
    )
    argument_parser.add_argument(
        "--exclude-directory",
        action="append",
        default=[],
        help="Additional directory name to exclude. May be repeated.",
    )
    return argument_parser.parse_args()


def iter_visible_children(
    directory_path: Path,
    excluded_directory_names: set[str],
    include_hidden: bool,
) -> Iterable[Path]:
    try:
        child_paths = list(directory_path.iterdir())
    except PermissionError:
        return []

    visible_children = []
    for child_path in child_paths:
        if child_path.is_dir() and child_path.name in excluded_directory_names:
            continue
        if not include_hidden and child_path.name.startswith("."):
            continue
        visible_children.append(child_path)

    return sorted(
        visible_children,
        key=lambda path: (not path.is_dir(), path.name.casefold()),
    )


def print_tree(
    directory_path: Path,
    excluded_directory_names: set[str],
    include_hidden: bool,
    maximum_depth: int,
    current_depth: int = 0,
    prefix: str = "",
) -> None:
    if current_depth >= maximum_depth:
        return

    child_paths = list(
        iter_visible_children(
            directory_path=directory_path,
            excluded_directory_names=excluded_directory_names,
            include_hidden=include_hidden,
        )
    )

    for child_index, child_path in enumerate(child_paths):
        is_last_child = child_index == len(child_paths) - 1
        branch = "└── " if is_last_child else "├── "
        suffix = "/" if child_path.is_dir() else ""
        print(f"{prefix}{branch}{child_path.name}{suffix}")

        if child_path.is_dir():
            child_prefix = prefix + ("    " if is_last_child else "│   ")
            print_tree(
                directory_path=child_path,
                excluded_directory_names=excluded_directory_names,
                include_hidden=include_hidden,
                maximum_depth=maximum_depth,
                current_depth=current_depth + 1,
                prefix=child_prefix,
            )


def main() -> int:
    arguments = parse_arguments()
    repository_path = Path(arguments.repository_path).expanduser().resolve()

    if not repository_path.exists():
        print(f"Repository path does not exist: {repository_path}")
        return 2
    if not repository_path.is_dir():
        print(f"Repository path is not a directory: {repository_path}")
        return 2
    if arguments.maximum_depth < 1:
        print("Maximum depth must be at least 1.")
        return 2

    excluded_directory_names = DEFAULT_EXCLUDED_DIRECTORY_NAMES.union(
        arguments.exclude_directory
    )

    print(f"{repository_path.name}/")
    print_tree(
        directory_path=repository_path,
        excluded_directory_names=excluded_directory_names,
        include_hidden=arguments.include_hidden,
        maximum_depth=arguments.maximum_depth,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
