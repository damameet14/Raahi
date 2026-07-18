# <Descriptive Module Name>

## Module purpose

<Define the business capability in one or two sentences.>

## Owned responsibilities

- <Responsibility owned by this module>

## Responsibilities not owned

- <Nearby responsibility and the module that owns it>

## Public operations

### `<descriptive_operation_name>`

- Request contract: `<DescriptiveRequestContract>`
- Success result: `<DescriptiveSuccessResult>`
- Failure result or typed error: `<DescriptiveFailureResultOrError>`
- Side effects: <None, database read, database write, network call, event publication, and so on>
- Permission or security requirements: <Requirements or none>

## Internal responsibility map

```text
<file-or-folder> — <single responsibility>
```

## Dependencies and side effects

- <Dependency and why it is required>

## Allowed callers

- <Application boundary or module allowed to call this module>

## Invariants

- <Rule that must remain true>

## Tests

- Public behavior: `<test location>`
- Contract tests: `<test location or not applicable>`
- Important rule tests: `<test location>`
