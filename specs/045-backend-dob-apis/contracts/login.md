# API Contract: POST /api/v1/auth/login

**Branch**: `045-backend-dob-apis` | **Date**: 2026-04-28  
**Controller**: `PatientPortal.Api/Controllers/AuthController.cs` → `Login`  
**Service**: `PatientPortal.Application/Services/AuthService.cs` → `LoginAsync` → `CreateAuthResponse`

---

## Request

**Method**: `POST`  
**Path**: `/api/v1/auth/login`  
**Content-Type**: `application/json`

### Request Body — Unchanged

```json
{
  "email": "jane.doe@example.com",
  "password": "Str0ng!Pass"
}
```

> The login request body does **not** change. `dateOfBirth` is not a login credential.

---

## Response

### Success — 200 OK

**Before** (current response):

```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<token>",
    "expiresIn": 3600,
    "user": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "email": "jane.doe@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "Patient",
      "isActive": true
    }
  }
}
```

**After** (with DOB added to `user` object):

```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<token>",
    "expiresIn": 3600,
    "user": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "email": "jane.doe@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "Patient",
      "isActive": true,
      "dateOfBirth": "01-15-1990"
    }
  }
}
```

### DOB field in response

| Field | Type | Format | Value when no DOB on record |
|---|---|---|---|
| `dateOfBirth` | string \| null | MM-DD-YYYY | `null` |

### Error Responses — Unchanged

| Scenario | HTTP Status | Error Code |
|---|---|---|
| Invalid credentials | 401 | `INVALID_CREDENTIALS` |
| Account inactive | 401 | `INVALID_CREDENTIALS` |

---

## Change Summary

| What | Before | After |
|---|---|---|
| Request body | Unchanged | Unchanged |
| Response `user` object | 6 fields | 7 fields — `dateOfBirth` (string\|null) added |
| `dateOfBirth` format | N/A | MM-DD-YYYY |
| Legacy account (no DOB) | N/A | `"dateOfBirth": null` |
| HTTP status codes | 200 / 401 | Unchanged |

---

## Implementation Path

`AuthController.Login` → `AuthService.LoginAsync` → `AuthService.CreateAuthResponse` → `UserDto`

The only code change needed: add `DateOfBirth = DateOfBirthMapper.Format(user.DateOfBirth)` inside `CreateAuthResponse` when building the `UserDto`.
