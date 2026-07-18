# API Contract: <Descriptive Operation>

## Endpoint

`<METHOD> /api/v<version>/<descriptive-path>`

## Authentication

<Requirement or none>

## Request

```json
{
  "descriptiveFieldName": "value"
}
```

## Successful response

Status: `<status code>`

```json
{
  "descriptiveResultFieldName": "value"
}
```

## Expected failure responses

### <Failure name>

Status: `<status code>`

```json
{
  "errorCode": "DESCRIPTIVE_ERROR_CODE",
  "errorMessage": "Safe external message"
}
```

## Validation constraints

- <Constraint>

## Side effects

- <Side effect or none>

## Idempotency

<Expectation>

## Security notes

- <Sensitive-data, authorization, enumeration, or secret-handling rule>
