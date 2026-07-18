# Repository Navigation and Change Workflow

## Goal

Find the correct change location with the least unnecessary reading while still understanding every dependency required for correctness.

## Step 1: Read governing instructions

Locate and read repository-level instructions before editing:

- `AGENTS.md`;
- project-local skills;
- contribution guidance;
- formatting and test commands;
- module documentation.

More specific repository instructions override general conventions when they do not conflict with user requirements.

## Step 2: Inspect the registry (or the tree)

1. If `.agents/context/function_registry.md` exists, read it to get a complete map of all symbols (functions, classes, interfaces, etc.) grouped by module.
2. Identify the module and symbol relevant to the task.
3. If the registry doesn't exist, fall back to inspecting the repository tree using a compact layout:
   ```bash
   python scripts/inspect_repository_structure.py <repository-path> --maximum-depth 5
   ```

Identify:
- application roots;
- feature modules;
- public interfaces;
- contracts;
- tests;
- application wiring;
- schema or migration locations.

## Step 3: Form a location hypothesis and query

From the symbol registry or naming patterns, identify the most likely responsible module and files.
Confirm your hypothesis with `project-index query "<symbol_name>"` to get the exact file path and line number of the symbol.
Do not open unrelated files.

Example:
```text
user_authentication/
├── transport/user_authentication_http_route.py
├── application_workflows/authenticate_user_credentials.py
├── password_security/verify_submitted_password.py
└── access_token_generation/create_user_access_token.py
```

A password-policy change should begin with `verify_submitted_password.py` and its tests, not every authentication file.

## Step 4: Confirm responsibility and target read

Read only what is necessary:
1. Run `project-index query` on the target symbol to get the exact file and line number.
2. Open ONLY that file at that line range.
3. Read the responsible module's `MODULE.md` and public interfaces only if you need to understand broader module capabilities.
4. Inspect confirmed dependencies or callers only as needed.

## Step 5: Declare the smallest change set

Before editing, identify likely files and why each is necessary. Revise the set when evidence shows another dependency.

## Step 6: Implement narrowly

- preserve unrelated formatting;
- avoid broad renaming;
- avoid dependency upgrades unless required;
- do not reorganize neighboring modules;
- keep public contracts stable unless intentionally changed;
- add tests next to the changed behavior.

## Step 7: Verify impact

Search for:

- callers of changed public operations;
- imports of changed contracts;
- references to renamed identifiers;
- schema consumers;
- generated client dependencies;
- test fixtures that encode the previous behavior.

## When broader inspection is justified

Broaden scope when:

- a public contract changes;
- a database schema changes;
- application startup or dependency wiring changes;
- a security rule affects multiple boundaries;
- behavior is duplicated across modules;
- tests reveal hidden coupling;
- the requested change is explicitly architectural.

## Existing poor structure

When a repository is poorly organized:

- do not perform a full migration during a local feature request;
- improve the touched area only when safe;
- preserve compatibility through a public boundary;
- document remaining structural debt;
- propose a separate migration when broad restructuring is valuable.
