# Prohibited Patterns

## Vague dumping grounds

Do not create generic folders or files such as:

- `utils`;
- `utilities`;
- `helpers`;
- `common`;
- `misc`;
- `general`;
- `logic`;
- `functions`;
- `data`;
- `service.py`;
- `manager.ts`;
- `processor.js`.

Use a precise qualified responsibility. A shared folder is acceptable only when its contents have a narrow, documented purpose.

## Shortened names

Do not use clipped words such as `auth`, `repo`, `ref`, `req`, `res`, `cfg`, `ctx`, `pwd`, `usr`, `svc`, or `mgr` in project-controlled names.

## Meaningless forwarding

Do not create chains of functions that only pass identical arguments and return identical values without validation, adaptation, dependency construction, side-effect isolation, or boundary protection.

## Deep cross-module imports

Do not import another module's internal workflow, repository, rule, or adapter. Use its public interface.

## Business logic at boundaries

Do not place business decisions directly in:

- HTTP route handlers;
- controllers;
- React components;
- command-line argument parsers;
- database models;
- framework lifecycle hooks.

Boundaries should adapt and delegate.

## Raw persistence leakage

Do not return database records as public business results merely because it is convenient.

## Ambiguous values

Do not return:

- unexplained tuples;
- `status, data`;
- untyped dictionaries with implicit fields;
- arrays whose positions have business meaning;
- booleans that discard failure reason when the reason matters.

## Premature shared abstractions

Do not move code into shared packages because it might be reused later. Require demonstrated reuse and clear ownership.

## Generic base classes

Do not create base classes or inheritance hierarchies solely to reduce a few repeated lines. Prefer composition and explicit behavior unless polymorphism is real.

## Unrequested broad refactoring

Do not rename, reformat, reorganize, or upgrade unrelated code during a local change.

## Empty architecture

Do not create folders for transport, persistence, domain, integration, and contracts when the module does not contain those responsibilities.

## Comments replacing names

Do not retain a vague name and compensate with a comment. Rename the code unless external compatibility prevents it.
