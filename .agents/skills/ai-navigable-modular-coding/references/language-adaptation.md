# Language Adaptation

Universal principles remain mandatory, but syntax and casing must be idiomatic.

## Python

- use `snake_case` for variables, functions, modules, and packages;
- use `PascalCase` for classes and public data types;
- use type annotations for public boundaries and significant workflows;
- use dataclasses, typed dictionaries, validation models, or equivalent explicit contracts as appropriate;
- expose public symbols through package `__init__.py` when useful;
- do not write camel-cased Python merely to satisfy a cross-language preference.

Examples:

```python
submitted_plain_text_password
AuthenticateUserCredentialsRequest
user_authentication_record_repository
```

## TypeScript and JavaScript

- use `camelCase` for variables and functions;
- use `PascalCase` for classes, interfaces, types, React components, and component files where project convention expects it;
- use explicit TypeScript types for public boundaries when TypeScript is available;
- use a module `index.ts` only as a deliberate public export surface, not as a file that hides vague organization;
- avoid barrel exports that create circular dependencies or expose internals.

Examples:

```typescript
submittedPlainTextPassword
AuthenticateUserCredentialsRequest
UserAuthenticationApiClient
```

## Java and C#

- use `PascalCase` for types;
- follow ecosystem convention for methods, properties, packages, and namespaces;
- prefer one primary public type per file;
- name interfaces and implementations by responsibility rather than generic technical suffix alone;
- use records or immutable request and result types where appropriate.

## Go

- follow Go package and exported-name conventions;
- keep package names concise but complete and meaningful; do not use clipped project-specific words;
- avoid Java-style over-layering;
- use small interfaces defined near consumers;
- return explicit typed values and errors.

## Rust

- use `snake_case` for functions, modules, and variables;
- use `PascalCase` for types and traits;
- use enums for explicit result variants and domain states;
- expose only intended public module members;
- avoid excessive trait abstraction without a real boundary.

## Databases

Follow the database and repository convention while retaining complete words. Prefer `user_authentication_records` over `usr_auth_tbl`.

## Framework conventions

Framework-mandated names and file locations may be used. Keep project-controlled names descriptive and place business logic outside framework-specific boundary files.

## Existing projects

Follow established casing and framework structure unless the user asks for migration. Improve descriptive wording in new or changed names without creating inconsistent casing.
