# AI Agent Navigation Guide

## Mandatory workflow: before writing or modifying code

1. Read `.agents/context/function_registry.md` to identify which module and symbol owns the behavior you need to change.
2. Run `project-index query "<symbol_name>"` to get the exact file path, line number, and signature.
3. Open ONLY the returned file at the returned line number.
4. Do NOT browse directories or read files speculatively.
5. Do NOT read `.project-index/` JSON files directly.

## Mandatory workflow: after modifying code

1. Run `project-index scan` if watch mode is not running.
2. Verify that `function_registry.md` reflects your changes.

## Skills

For code creation, modification, refactoring, architecture, naming, module design, and code review, use the `ai-navigable-modular-coding` skill. Treat its naming, module-boundary, repository-navigation, contract, and change-safety requirements as mandatory.
