---
name: ai-navigable-modular-coding
description: Design, create, modify, refactor, and review software using repository-tree-first navigation, fully descriptive names, business-feature modules, explicit public interfaces, input and output contracts, and tightly limited change scope. Use for coding tasks where an AI agent should identify and change only the relevant files. Do not use for prose-only tasks or code explanation that requires no design or repository change.
---

# AI-Navigable Modular Coding

Use this skill to create software that can be understood from its repository structure, changed through stable module boundaries, and maintained by humans or AI agents without broad, unnecessary file inspection.

## Required outcome

Produce code in which:

- the repository tree acts as a map of the system;
- business capabilities are easy to locate before opening files;
- every important name explains its purpose without surrounding context;
- each module exposes a small, stable public interface;
- callers pass explicit inputs and receive explicit results;
- internal implementation can change without forcing unrelated callers to change;
- modifications remain inside the smallest responsible area;
- tests prove the requested behavior and protect neighboring behavior.

## Non-negotiable rules

1. Organize code primarily by business capability or independently understandable feature, not only by technical type.
2. Separate independently deployable or independently running applications before organizing them by feature.
3. Use complete descriptive words in identifiers. Do not shorten `reference` to `ref`, `request` to `req`, `response` to `res`, `repository` to `repo`, `authentication` to `auth`, `configuration` to `config` or `cfg`, `context` to `ctx`, `password` to `pwd`, `service` to `svc`, or `manager` to `mgr`.
4. Permit standardized technical initialisms when the conventional form is clearer than expansion, including `API`, `HTTP`, `HTTPS`, `HTML`, `CSS`, `JSON`, `JWT`, `SQL`, `URL`, `URI`, `UUID`, `PDF`, `CSV`, `XML`, `TCP`, `UDP`, and framework names.
5. Follow the language's normal casing convention while retaining complete words. Use `user_authentication_record` in Python, `userAuthenticationRecord` in TypeScript, and `UserAuthenticationRecord` for public types where idiomatic.
6. Give each file one clear primary responsibility. Split by responsibility or change boundary, not merely to satisfy a line count.
7. Require all external callers to use a module's public interface. Do not import another module's internal implementation.
8. Use named input and output contracts for significant operations. Avoid unexplained tuples, positional booleans, loosely shaped dictionaries, and ambiguous primitive return values.
9. Keep business decisions separate from transport, persistence, user interface, filesystem, network, environment, and framework details.
10. Do not create a wrapper, class, interface, folder, or forwarding file unless it protects a meaningful boundary, adapts data, validates input, constructs dependencies, isolates a side effect, or owns a distinct rule.
11. Do not modify unrelated working code. Expand scope only when a confirmed dependency, public contract, schema, application wiring point, or directly dependent test requires it.
12. Prefer readability and future AI comprehension over terseness.

## Read only the references required for the task

Use progressive disclosure. Do not load every supporting file automatically.

- For architecture or repository layout, read `references/repository-and-module-organization.md` and `references/architectural-principles.md`.
- For names, read `references/descriptive-naming-standard.md`.
- For module entry points, imports, request contracts, result contracts, and dependency boundaries, read `references/module-contracts-and-boundaries.md`.
- For frontend and backend connection, read `references/frontend-backend-integration.md`.
- For repository inspection and modification scope, read `references/repository-navigation-and-change-workflow.md`.
- For tests and completion checks, read `references/testing-and-change-safety.md`.
- For language-specific adaptation, read `references/language-adaptation.md`.
- Before introducing generic folders or vague abstractions, read `references/prohibited-patterns.md`.
- When creating or updating module documentation, read `references/module-documentation-standard.md`.

## Classify the task

Classify the request as one or more of:

- create a new project;
- create a new business module;
- add a capability to an existing module;
- correct a defect;
- change a public contract;
- replace an internal implementation;
- connect frontend and backend;
- refactor repository organization;
- review code or architecture.

Use the workflow below that matches the request. Do not redesign the entire repository when the request only requires a local change.

## Mandatory repository-first navigation

Before opening many source files:

1. Locate and read repository instructions such as \`AGENTS.md\`.
2. If \`.agents/context/function_registry.md\` exists, read it to get a complete map of all symbols (functions, classes, interfaces, etc.) grouped by module.
3. Identify the module and symbol relevant to the task from the registry.
4. Run \`project-index query "<symbol_name>"\` to retrieve the exact file path and line number of the symbol declaration.
5. Open ONLY the returned file at the specific line. Do not search or browse directories speculatively.
6. If the registry or \`project-index\` query tool is not available, inspect the repository tree with an appropriate command (e.g. \`python scripts/inspect_repository_structure.py <repository-path>\`).
7. Exclude generated and dependency directories such as \`.git\`, \`node_modules\`, \`.next\`, \`dist\`, \`build\`, \`coverage\`, \`.venv\`, \`venv\`, \`target\`, \`bin\`, \`obj\`, and language caches.
8. Identify the independently running application involved.
9. Identify the business module that owns the requested behavior.
10. Read that module's \`MODULE.md\`, public interface, contracts, responsible implementation, and relevant tests.
11. Search outside the module only for confirmed callers, shared contracts, application wiring, schema definitions, or dependencies.
12. Establish the smallest expected change set before editing.

Do not recursively read unrelated modules merely to become familiar with the repository.

## Workflow: create a new project

1. Identify independently deployable applications, such as web application, backend application, mobile application, worker, or command-line application.
2. Separate those applications at the repository level.
3. Organize each application by business feature or capability.
4. Add project-level configuration only at the narrowest level where it applies.
5. Create shared packages only for genuinely shared contracts or infrastructure used by more than one application. Do not create a generic dumping ground.
6. Use `assets/templates/project-structure.template.md` as a starting point, adapting it to the technology and project size.
7. Start with the smallest architecture that preserves explicit responsibilities. Do not create empty ceremonial folders.
8. Add tests, formatting, static analysis, and type checking appropriate to the language.

## Workflow: create a new module

1. Name the module after the business capability, such as `user_authentication`, `restaurant_order_management`, or `inventory_adjustment`.
2. Create `MODULE.md` from `assets/templates/MODULE.template.md`.
3. Define the public operations before implementing internal details.
4. Define request, result, error, and event contracts as needed.
5. Separate transport, workflow coordination, domain decisions, persistence, and external integration when each responsibility exists.
6. Do not create folders for absent responsibilities.
7. Export only the public interface and public contracts.
8. Add focused tests for public behavior and important internal rules.
9. Run the new-module checklist in `references/checklists/new-module-checklist.md`.

## Workflow: modify existing code

1. Preserve the existing public contract unless the user explicitly requests a contract change or the change cannot be correct without one.
2. Trace the behavior from public entry point to the responsible implementation.
3. Identify the exact rule or boundary that must change.
4. Modify the smallest responsible file or set of files.
5. Update module documentation only when responsibility, public behavior, dependencies, or contracts change.
6. Add or update the narrowest useful tests.
7. Avoid opportunistic renaming, formatting, dependency upgrades, and unrelated refactoring.
8. If the existing repository conflicts with this skill, improve only the touched area unless the user requested a broader migration.
9. Run the existing-change checklist in `references/checklists/existing-change-checklist.md`.

## Public interfaces and entry points

Treat each business module as a small package.

A public entry point may:

- validate or normalize boundary input;
- construct or receive dependencies;
- adapt framework-specific data to module contracts;
- invoke the responsible workflow;
- convert internal results to public results;
- protect callers from internal file organization.

A public entry point must not exist merely to forward identical arguments to another function without protecting a boundary or adding responsibility.

External code must import only from the module's public interface. Internal files may import within the same module according to the module's dependency direction.

## Input and output contracts

For significant operations:

- accept a named request object, command, query, or clearly named parameter object;
- return a named result, response, value object, or explicit typed error;
- use descriptive field names;
- avoid `True, token`, `status, data`, untyped dictionaries, or arrays with positional meaning;
- keep contracts stable while allowing internal implementations to change;
- distinguish business failure from infrastructure failure;
- do not expose database records or framework objects as public business results unless that is the explicit contract.

Primitive arguments are acceptable for small, local, obvious functions when a request object would add no clarity.

## Backend operation style

Prefer backend workflows that visibly pass descriptive values through explicit boundaries:

`transport input -> request contract -> public operation -> workflow -> domain decision or dependency -> result contract -> transport output`

Keep side effects at the edges. Make core decisions deterministic where practical. Pass dependencies explicitly when doing so improves testability or replaceability.

## Frontend and backend connection

Treat the API contract as the plug between applications:

- keep raw network calls inside a dedicated backend communication boundary;
- keep user interface components free from transport details;
- define request, success response, and failure response shapes explicitly;
- use OpenAPI or an equivalent schema as the source of truth when practical;
- generate client types from the contract when reliable tooling is available;
- adapt API responses into frontend domain or state objects at the boundary;
- do not couple frontend components to backend persistence models.

## Naming procedure

For every new or changed name:

1. Identify what the thing represents or does.
2. Include the business subject when the name would otherwise be ambiguous.
3. Use a verb for actions and a noun for values or types.
4. Name boolean values as questions or statements, such as `is_submitted_password_valid`, `does_user_account_exist`, or `should_generate_access_token`.
5. Name collections with a plural noun that identifies the contained element.
6. Name errors after the failed rule or operation.
7. Remove shortened words and vague suffixes.
8. Apply the language's idiomatic casing.

Do not rely on comments to explain a poor name.

## File size and modularity

Use file length only as a diagnostic signal.

- Review files approaching approximately 300 lines for mixed responsibilities.
- Keep a longer cohesive file when splitting would create meaningless fragments.
- Split a shorter file when it contains responsibilities that change for different reasons.
- Prefer one primary public type or responsibility per file where idiomatic.
- Keep closely related small contracts together when separation would hurt navigation.

## Documentation for AI navigation

Create or maintain `MODULE.md` for business modules created under this skill. It must summarize:

- module purpose;
- owned responsibilities;
- responsibilities explicitly not owned;
- public operations and contracts;
- internal responsibility map;
- dependencies and side effects;
- allowed callers where relevant;
- invariants and security-sensitive rules;
- test locations.

Keep it concise and structural. Do not duplicate source code.

## Tool and script use

The included tools and scripts are optional helpers, not sources of truth.

- Run \`project-index query "<symbol_name>"\` to find the exact file and line number for a symbol. Add \`--fuzzy\` for fuzzy search, \`--module <module>\` to list a module's symbols, or \`--json\` for JSON output.
- Run \`python scripts/inspect_repository_structure.py <repository-path>\` to produce a compact tree.
- Run \`python scripts/validate_descriptive_names.py <repository-path>\` to flag likely shortened or vague names.
- Run \`python scripts/validate_module_boundaries.py <repository-path>\` to flag likely deep cross-module imports.

Treat findings as review prompts. Confirm context before changing code. Never mass-rename automatically from script output.

## Required completion report

When finishing a coding task, report:

- the responsible module;
- files changed;
- public contract changes, or state that none were made;
- tests or checks run and their results;
- any newly added or modified symbols, confirming they are reflected in the function registry;
- any remaining risks, assumptions, or unverified behavior.

Do not claim tests passed when they were not run.

## Final verification

Before completion:

1. Confirm names use complete descriptive words.
2. Confirm the repository tree still reveals where the behavior lives.
3. Confirm external modules use only public interfaces.
4. Confirm significant operations have explicit inputs and outputs.
5. Confirm internal implementation details did not leak into callers.
6. Confirm unrelated files were not modified.
7. Confirm tests cover the changed behavior.
8. Confirm documentation matches changed responsibilities and contracts.
9. Run `references/checklists/final-verification-checklist.md`.
