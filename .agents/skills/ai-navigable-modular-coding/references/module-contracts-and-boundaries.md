# Module Contracts and Boundaries

## Module as a package

A business module has:

- a public interface;
- public contracts;
- internal implementation;
- dependencies and side effects;
- tests proving public behavior.

External code may depend on the public interface and public contracts, not internal files.

## Public operations

A module may expose one or several cohesive operations. For example:

```text
User Authentication
- authenticate_user_credentials
- refresh_user_access_token
- revoke_user_session
```

Do not force all operations through one generic `execute` or `process` function.

## Entry point responsibilities

A public entry point may:

- validate public input;
- normalize values;
- construct or receive dependencies;
- map public contracts to internal workflow contracts;
- call the responsible workflow;
- map internal results to public results;
- protect callers from internal reorganization.

A forwarding file that merely repeats a call with the same values and no boundary purpose is not useful modularity.

## Request contracts

Use a named request object for significant operations:

```python
@dataclass(frozen=True)
class AuthenticateUserCredentialsRequest:
    user_identifier: str
    submitted_plain_text_password: str
```

Request objects are especially useful when:

- there are multiple related values;
- parameters are likely to evolve;
- values cross a module or application boundary;
- validation applies to the group;
- positional confusion is possible.

## Result contracts

Return explicit results:

```python
@dataclass(frozen=True)
class SuccessfulUserAuthenticationResult:
    authenticated_user_identifier: str
    access_token: str
    access_token_expiration_datetime: datetime
```

Use a distinct failure result or typed error where appropriate:

```python
@dataclass(frozen=True)
class FailedUserAuthenticationResult:
    failure_reason: UserAuthenticationFailureReason
```

Do not return `True, token`, `False, None`, or a dictionary whose fields are known only by convention.

## Business failure and infrastructure failure

A business failure is an expected outcome, such as invalid credentials or an order that cannot be cancelled. Represent it with a typed result or domain error appropriate to the language and application.

An infrastructure failure is an inability to perform the operation, such as database unavailability or network timeout. Preserve diagnostic context and map it at the appropriate boundary.

Do not expose sensitive authentication detail. Invalid user identifiers and invalid passwords should normally map to the same external failure.

## Dependency direction

Prefer dependency direction toward stable business contracts:

```text
transport -> public operation -> workflow -> domain rule
                                  -> dependency interface <- adapter
```

A workflow may depend on a repository interface. A database adapter implements that interface. The workflow should not depend directly on framework-specific database objects when avoidable.

## Cross-module communication

When one module needs another module:

1. call the other module's public operation;
2. pass its public request contract;
3. consume its public result contract;
4. do not query the other module's tables or import its internal rules directly;
5. avoid circular dependencies;
6. introduce orchestration at an application layer when a workflow spans multiple peer modules.

## Contract changes

Treat public contract changes as deliberate architectural changes.

Before changing a contract:

- identify all callers;
- determine backward compatibility;
- update schemas and generated clients where applicable;
- update module documentation;
- update contract tests;
- state the change explicitly in the completion report.

## Events

Use events when a completed business fact should be observed by multiple independent consumers, such as `RestaurantOrderConfirmed`.

Do not use events to obscure a direct required operation or to avoid defining ownership.
