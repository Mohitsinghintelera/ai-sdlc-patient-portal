# API Contract: POST /api/v1/auth/register

**Branch**: `045-backend-dob-apis` | **Date**: 2026-04-28  
**Controller**: `PatientPortal.Api/Controllers/AuthController.cs` → `Register`  
**Validator**: `PatientPortal.Api/Validators/AuthRequestValidator.cs`

---

## Request

**Method**: `POST`  
**Path**: `/api/v1/auth/register`  
**Content-Type**: `application/json`

### Request Body

```json
{
  "fullName": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "Str0ng!Pass",
  "confirmPassword": "Str0ng!Pass",
  "dateOfBirth": "01-15-1990"
}
```

### Field Definitions

| Field | Type | Required | Format / Constraints |
|---|---|---|---|
| `fullName` | string | Yes | 2–256 characters; letters, spaces, hyphens, apostrophes |
| `email` | string | Yes | Valid email; max 254 chars |
| `password` | string | Yes | 8–128 chars; must contain uppercase, lowercase, digit, special char |
| `confirmPassword` | string | Yes | Must match `password` |
| `dateOfBirth` | string | **Yes (new)** | MM-DD-YYYY format; past date; within last 200 years |

### DOB Validation Errors

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Field missing | 400 | `INVALID_INPUT` | `"dateOfBirth is required"` |
| Invalid format (not MM-DD-YYYY) | 400 | `INVALID_INPUT` | `"dateOfBirth must be in MM-DD-YYYY format"` |
| Today's date or future date | 400 | `INVALID_INPUT` | `"dateOfBirth must be a past date"` |
| More than 200 years ago | 400 | `INVALID_INPUT` | `"dateOfBirth must be within the last 200 years"` |

---

## Response

### Success — 201 Created

```json
{
  "success": true,
  "data": {
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "jane.doe@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "message": "Account created successfully"
  }
}
```

> **Note**: `dateOfBirth` is intentionally NOT included in the registration success response. It is returned via the login and profile endpoints.

### Validation Error — 400 Bad Request (existing format, unchanged)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "dateOfBirth must be in MM-DD-YYYY format"
  }
}
```

---

## Change Summary

| What | Before | After |
|---|---|---|
| Request body | No DOB field | `dateOfBirth` (string, MM-DD-YYYY) added — required |
| Validation | No DOB rules | 4 new rules: required, format, past date, max 200 years |
| Response body | Unchanged | Unchanged (DOB not in registration response) |
| HTTP status codes | 201 / 400 / 409 | Unchanged |
