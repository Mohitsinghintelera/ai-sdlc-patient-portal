# API Contract: GET /api/v1/users/me

**Branch**: `045-backend-dob-apis` | **Date**: 2026-04-28  
**Controller**: `PatientPortal.Api/Controllers/UserController.cs` → `GetCurrentUser`  
**Auth**: Bearer token required (`[Authorize]`)

---

## Request

**Method**: `GET`  
**Path**: `/api/v1/users/me`  
**Authorization**: `Bearer <access_token>`

### Request — Unchanged

No request body. User identity resolved from JWT claim `NameIdentifier`.

---

## Response

### Success — 200 OK

**Before** (current response):

```json
{
  "success": true,
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "jane.doe@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "Patient",
    "isActive": true
  }
}
```

**After** (with DOB added):

```json
{
  "success": true,
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "email": "jane.doe@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "Patient",
    "isActive": true,
    "dateOfBirth": "01-15-1990"
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
| Missing / invalid token | 401 | `INVALID_TOKEN` |
| User not found | 404 | `USER_NOT_FOUND` |

---

## Change Summary

| What | Before | After |
|---|---|---|
| Request | Unchanged | Unchanged |
| Response `data` object | 6 fields | 7 fields — `dateOfBirth` (string\|null) added |
| `dateOfBirth` format | N/A | MM-DD-YYYY |
| Legacy account (no DOB) | N/A | `"dateOfBirth": null` |
| HTTP status codes | 200 / 401 / 404 | Unchanged |

---

## Implementation Path

`UserController.GetCurrentUser` builds `UserDto` inline (not via `CreateAuthResponse`).

The change needed: add `DateOfBirth = DateOfBirthMapper.Format(user.DateOfBirth)` when constructing `UserDto` in `GetCurrentUser`.

> This mirrors the login response change — both use `DateOfBirthMapper.Format` ensuring identical MM-DD-YYYY output.
