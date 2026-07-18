# Testing and Change Safety

## Test the public behavior

Each module should have tests that call its public operations with public contracts and verify public results.

These tests protect callers while allowing internal refactoring.

## Test important internal rules

Add focused tests for security-sensitive, financial, permission, state-transition, and calculation rules.

Examples:

- password verification rejects invalid input;
- delivered orders cannot be cancelled;
- inventory cannot fall below the allowed threshold;
- an employee without permission cannot approve a refund;
- order totals use the correct tax and discount sequence.

## Contract tests

When frontend and backend communicate, verify request and response schemas. Use generated-schema checks, API tests, or consumer contract tests where appropriate.

## Regression tests

For a defect:

1. add a test that fails because of the defect when practical;
2. implement the smallest correction;
3. confirm the regression test passes;
4. run neighboring tests that could be affected.

## Change safety

Before changing a public operation or contract:

- locate all callers;
- identify compatibility requirements;
- update documentation and schema;
- update generated artifacts intentionally;
- run relevant integration tests.

## Static verification

Use the language's standard tools when available:

- formatter;
- linter;
- type checker;
- compiler;
- security scanner when relevant;
- dependency test or build command.

Do not introduce a tool solely for one small change unless the user requested it or the repository lacks essential verification.

## Completion honesty

Report exactly what was run. Distinguish:

- passed;
- failed;
- not run;
- unavailable;
- partially verified.

Do not infer success from code appearance.

## Risk-based depth

Increase verification for:

- authentication and authorization;
- payments and financial calculations;
- destructive actions;
- migrations;
- concurrent workflows;
- personal or sensitive information;
- external integrations;
- public API contract changes.
