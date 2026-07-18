# Architectural Principles

## Repository structure is an interface

Treat the repository tree as the first interface presented to a maintainer or AI agent. Folder and file names should reveal where a business capability lives before source code is opened.

A good tree reduces search cost. A poor tree forces broad content inspection.

## Organize by business capability

Prefer:

```text
modules/
├── user_authentication/
├── restaurant_order_management/
├── inventory_management/
└── employee_management/
```

Avoid a repository organized only by technical type:

```text
controllers/
services/
repositories/
models/
helpers/
```

Technical layers may exist inside a business module when needed.

## Stable exterior, replaceable interior

A module should expose stable public operations and contracts. Callers should not know which internal file verifies a password, queries a database, or creates a token.

The module interior may be reorganized or replaced while its public behavior remains stable.

## Explicit value flow

Important workflows should visibly pass descriptive values through boundaries:

```text
boundary input
    -> request contract
    -> public operation
    -> workflow coordination
    -> domain decision and dependencies
    -> result contract
    -> boundary output
```

Avoid invisible shared state, unexplained mutations, and unstructured result shapes.

## Side effects at the edges

Database access, network requests, file access, environment access, clock access, random generation, email delivery, and token signing are side effects. Isolate them behind descriptive boundaries so core decisions can be tested independently.

## Aggressive but meaningful modularity

Create a separate unit when it owns a responsibility, protects a boundary, isolates a dependency, or changes for a different reason.

Do not split code simply because another file is possible. Excessive forwarding creates navigation noise and hides the actual workflow.

## Change locality

A well-designed feature change should normally affect:

- the responsible module;
- its public or internal contract when necessary;
- directly dependent wiring;
- relevant tests;
- concise module documentation.

A local change that requires unrelated modules to change is evidence of leaked implementation detail or an unstable contract.

## Small projects remain small

Do not force a full enterprise directory structure onto a short script or tiny application. Preserve the same principles with fewer files:

- descriptive names;
- explicit responsibilities;
- isolated side effects;
- clear input and output;
- focused tests where valuable.
