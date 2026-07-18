# Installation

This bundle contains one installable skill named `ai-navigable-modular-coding`.

## Codex user-level installation

Copy the entire extracted folder into your user skill directory:

### Windows PowerShell

```powershell
New-Item -ItemType Directory -Force "$HOME/.agents/skills" | Out-Null
Copy-Item -Recurse -Force ".\ai-navigable-modular-coding" "$HOME/.agents/skills/ai-navigable-modular-coding"
```

### macOS or Linux

```bash
mkdir -p "$HOME/.agents/skills"
cp -R ./ai-navigable-modular-coding "$HOME/.agents/skills/ai-navigable-modular-coding"
```

Restart Codex only if the skill does not appear automatically.

## Repository-level installation

Place the folder inside the repository:

```text
<repository-root>/.agents/skills/ai-navigable-modular-coding/
```

This makes the skill available when Codex works in that repository.

## ChatGPT or hosted skill upload

Upload the ZIP file directly when the product provides a skill upload control. The ZIP contains one top-level folder and one `SKILL.md` manifest.

## Suggested AGENTS.md instruction

```markdown
For code creation, modification, refactoring, architecture, naming, module design, and code review, use the `ai-navigable-modular-coding` skill. Treat its naming, module-boundary, repository-navigation, contract, and change-safety requirements as mandatory unless this repository contains a more specific rule.
```

## Explicit invocation in Codex

Mention the skill by name when needed:

```text
Use $ai-navigable-modular-coding to add user authentication without changing unrelated modules.
```
