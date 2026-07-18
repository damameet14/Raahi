# Module Documentation Standard

Each business module created under this skill should include a concise `MODULE.md`.

## Purpose

`MODULE.md` helps a maintainer or AI agent determine where to look without reading all source files.

## Required sections

### Module purpose

One or two sentences defining the business capability.

### Owned responsibilities

List behavior this module owns.

### Responsibilities not owned

State nearby behavior owned elsewhere. This prevents responsibility drift.

### Public operations

For each operation, list:

- operation name;
- request contract;
- possible result contracts or typed errors;
- side effects;
- security or permission requirements.

### Internal responsibility map

Map responsibilities to files or folders without explaining implementation line by line.

### Dependencies

List external modules, persistence boundaries, third-party services, clock, filesystem, queues, or other side effects.

### Allowed callers

Include when access should be restricted or orchestration ownership matters.

### Invariants

Document rules that must remain true, especially security, state transitions, money, and data integrity.

### Tests

Point to public behavior tests, contract tests, and important rule tests.

## Maintenance rule

Update `MODULE.md` when public operations, contracts, ownership, dependencies, or invariants change. Do not update it for an internal refactor that leaves the structural map accurate.

## Size rule

Keep the document concise enough to read before source inspection. Prefer a responsibility map over prose history.

## Registry Supplement

When `project-index` is active, the function registry (`.agents/context/function_registry.md`) acts as an always-current, auto-generated list of all symbols in a module. This allows `MODULE.md` to focus strictly on high-level responsibilities, boundaries, and architecture, without having to maintain a list of every single internal class or function.
