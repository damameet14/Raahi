# Repository and Module Organization

## Separate runtime applications first

Independently running or deployable applications should have separate roots.

```text
project_name/
├── applications/
│   ├── web_application/
│   ├── backend_application/
│   ├── mobile_application/
│   └── background_worker/
├── shared_packages/
├── project_documentation/
└── project-level configuration
```

Create only the applications the project actually needs.

## Organize each application by feature

```text
backend_application/
└── source/
    ├── application_startup/
    ├── modules/
    │   ├── user_authentication/
    │   ├── restaurant_order_management/
    │   └── inventory_management/
    └── shared_infrastructure/
```

Use `shared_infrastructure` only for infrastructure genuinely shared by multiple modules. A module-specific database adapter belongs inside that module.

## Standard module anatomy

Use only the responsibilities that exist:

```text
business_capability/
├── MODULE.md
├── public_interface/
├── contracts/
├── application_workflows/
├── domain_rules/
├── persistence/
├── external_integrations/
├── transport/
└── tests/
```

A smaller module may remain flat:

```text
user_authentication/
├── MODULE.md
├── public_interface.py
├── authentication_contracts.py
├── authenticate_user_credentials.py
├── retrieve_user_authentication_record.py
├── verify_submitted_password.py
├── create_user_access_token.py
└── tests/
```

Add subfolders when the flat module becomes hard to scan, not before.

## Responsibility placement

### Public interface

Exports supported operations and public contracts. Hides internal organization.

### Contracts

Contains request objects, result objects, public errors, events, and value objects used at boundaries.

### Application workflows

Coordinates a use case. It may call domain rules and dependencies but should not contain framework transport logic.

### Domain rules

Contains business decisions and invariants that should remain independent of databases and user interfaces.

### Persistence

Contains repository interfaces and implementations for module-owned data access.

### External integrations

Contains adapters for third-party services, message brokers, email providers, payment providers, and similar dependencies.

### Transport

Converts HTTP, command-line, queue, or other transport input into module contracts and maps results back to transport responses.

### Tests

Mirrors public behavior and important rules. Test names should state the behavior and condition.

## Shared packages

Create a shared package only when:

- at least two applications or modules genuinely consume the same stable contract or implementation;
- duplication would create correctness risk;
- ownership is clear;
- the shared unit has a descriptive purpose.

Do not move code to shared locations merely because it might be reused later.

## Application startup

Startup code should assemble modules, dependencies, routes, and configuration. It should not contain business rules.

## Configuration

Keep configuration close to the scope it controls. Project-wide configuration belongs at the root; application configuration belongs in the application; module-specific configuration belongs in the module.

## Sub-Module Boundaries and AI Scaffolding

When using `project-index`, logical modules and sub-modules are detected automatically.

1. **Sub-module Boundaries**: Any directory that contains an entry point (`index.ts`, `__init__.py`) or a `MODULE.md` file defines a sub-module boundary (e.g., `source/repository_scanning`).
2. **AI Scaffolding**: `project-index init` scaffolds a `.agents/` directory containing:
   - `AGENTS.md`: Orchestrates the AI workflow.
   - `skills/`: The bundled coding standards and checklists.
   - `context/function_registry.md`: The auto-generated listing of all symbols grouped by module, rebuilt incrementally on every scan/file change.
