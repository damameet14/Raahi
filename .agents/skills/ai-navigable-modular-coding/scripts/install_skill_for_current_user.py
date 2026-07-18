#!/usr/bin/env python3
"""Install this extracted skill folder into the current user's Codex skill directory."""

from __future__ import annotations

import shutil
from pathlib import Path

SKILL_FOLDER_NAME = "ai-navigable-modular-coding"


def main() -> int:
    source_skill_path = Path(__file__).resolve().parent.parent
    target_skills_directory = Path.home() / ".agents" / "skills"
    target_skill_path = target_skills_directory / SKILL_FOLDER_NAME

    if target_skill_path.exists() and source_skill_path == target_skill_path.resolve():
        print(f"Skill is already installed at {target_skill_path}")
        return 0

    target_skills_directory.mkdir(parents=True, exist_ok=True)
    if target_skill_path.exists():
        shutil.rmtree(target_skill_path)
    shutil.copytree(source_skill_path, target_skill_path)

    print(f"Installed skill at {target_skill_path}")
    print("Restart Codex only if the skill does not appear automatically.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
