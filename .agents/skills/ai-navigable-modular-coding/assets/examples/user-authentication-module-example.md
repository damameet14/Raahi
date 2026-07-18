# User Authentication Module Example

## Repository location

```text
applications/
├── web_application/
│   └── source/features/user_authentication/
│       ├── MODULE.md
│       ├── public_interface/
│       │   └── user_authentication_feature.ts
│       ├── contracts/
│       │   ├── AuthenticateUserCredentialsRequest.ts
│       │   └── AuthenticateUserCredentialsResponse.ts
│       ├── user_interface/
│       │   ├── UserLoginPage.tsx
│       │   └── UserLoginCredentialsForm.tsx
│       ├── backend_communication/
│       │   └── UserAuthenticationApiClient.ts
│       └── tests/
└── backend_application/
    └── source/modules/user_authentication/
        ├── MODULE.md
        ├── public_interface/
        │   └── authenticate_user_credentials.py
        ├── contracts/
        │   └── authentication_contracts.py
        ├── application_workflows/
        │   └── authenticate_user_credentials_workflow.py
        ├── credential_persistence/
        │   └── user_authentication_record_repository.py
        ├── password_security/
        │   └── submitted_password_verifier.py
        ├── access_token_generation/
        │   └── user_access_token_generator.py
        ├── transport/
        │   └── user_authentication_http_route.py
        └── tests/
```

## Public backend operation

```python
@dataclass(frozen=True)
class AuthenticateUserCredentialsRequest:
    user_identifier: str
    submitted_plain_text_password: str


@dataclass(frozen=True)
class SuccessfulUserAuthenticationResult:
    authenticated_user_identifier: str
    access_token: str
    access_token_expiration_datetime: datetime


def authenticate_user_credentials(
    authentication_request: AuthenticateUserCredentialsRequest,
) -> SuccessfulUserAuthenticationResult | FailedUserAuthenticationResult:
    ...
```

## Value flow

```text
HTTP request
    -> AuthenticateUserCredentialsRequest
    -> authenticate_user_credentials
    -> retrieve user authentication record
    -> verify submitted password
    -> create user access token
    -> SuccessfulUserAuthenticationResult
    -> HTTP response
```

## Boundary protection

The route imports only the public operation and public contracts. It does not import the password verifier or token generator directly.

A future replacement of JWT with opaque session tokens can remain internal if the public `access_token` contract remains suitable.
