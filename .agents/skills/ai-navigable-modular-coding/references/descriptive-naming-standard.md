# Descriptive Naming Standard

## Objective

A reader should understand what a name represents or does without reading the implementation or relying on nearby comments.

## Complete words

Use complete words in project-controlled names.

Avoid:

- `auth`, `repo`, `ref`, `req`, `res`, `cfg`, `ctx`, `pwd`, `usr`, `svc`, `mgr`, `util`, `temp`, `obj`, `val`, `fn`;
- single-letter names except conventional mathematical coordinates, tiny index scopes where the meaning is undeniable, or language-required placeholders;
- project-specific acronyms that are not documented domain terms.

Prefer:

- `user_authentication`;
- `user_authentication_record_repository`;
- `customer_reference`;
- `login_request`;
- `login_response`;
- `application_configuration`;
- `request_context`;
- `submitted_plain_text_password`;
- `temporary_uploaded_file`.

## Standard technical initialisms

Conventional technical forms may remain abbreviated when expansion would reduce recognition:

`API`, `HTTP`, `HTTPS`, `HTML`, `CSS`, `JSON`, `JWT`, `SQL`, `URL`, `URI`, `UUID`, `PDF`, `CSV`, `XML`, `TCP`, `UDP`.

Apply normal language casing, such as `api_client`, `ApiClient`, `APIClient`, or `apiClient` according to established project convention.

## Function names

Use a verb and a specific object.

Avoid:

- `process`;
- `handle`;
- `run`;
- `manage`;
- `check`;
- `get_data`;
- `do_login`.

Prefer:

- `authenticate_user_credentials`;
- `retrieve_user_authentication_record`;
- `verify_submitted_password`;
- `create_user_access_token`;
- `calculate_restaurant_order_total`;
- `send_customer_order_confirmation`.

A generic verb may be acceptable when qualified by a complete domain phrase and established interface semantics, but a more precise verb is preferred.

## Boolean names

Boolean names should read as a statement or question:

- `is_submitted_password_valid`;
- `does_user_account_exist`;
- `has_customer_accepted_terms`;
- `can_employee_approve_refund`;
- `should_generate_access_token`.

Avoid `valid`, `exists`, `status`, `flag`, and `check`.

## Collection names

Use plural names that identify the contained element:

- `authenticated_user_accounts`;
- `restaurant_order_line_items`;
- `inventory_adjustment_records`.

Avoid `items`, `data`, `list`, and `records` without a business subject.

## Class and type names

Name by responsibility or represented concept:

- `AuthenticateUserCredentialsRequest`;
- `SuccessfulUserAuthenticationResult`;
- `UserAuthenticationRecordRepository`;
- `SubmittedPasswordVerifier`;
- `UserAccessTokenGenerator`.

Avoid vague suffixes such as `Manager`, `Processor`, `Helper`, `Utility`, or `Service` unless the complete name still describes a precise responsibility and the suffix has established architectural meaning.

## Error names

Name errors after the failed operation or violated rule:

- `InvalidUserCredentialsError`;
- `InactiveUserAccountError`;
- `RestaurantOrderCannotBeCancelledError`;
- `InventoryQuantityWouldBecomeNegativeError`.

Avoid `GeneralError`, `ProcessingError`, and `ValidationError` without qualification.

## File names

A file name should identify its primary responsibility:

- `authenticate_user_credentials.py`;
- `UserAuthenticationApiClient.ts`;
- `restaurant_order_total_calculator.go`;
- `InventoryAdjustmentRepository.java`.

Avoid `service.py`, `logic.ts`, `helper.js`, `utils.py`, and `common.go`.

## Test names

State the behavior and condition:

- `test_authenticate_user_credentials_returns_access_token_when_password_is_valid`;
- `test_restaurant_order_cannot_be_cancelled_after_delivery`;
- `creates_authenticated_user_session_after_successful_login`.

## Naming review questions

For each name, ask:

1. Does it identify the business subject?
2. Does an action name contain a precise verb?
3. Is a boolean readable as a statement?
4. Is any word shortened?
5. Is the name vague outside its current file?
6. Would a tree listing help an AI identify this file's responsibility?
