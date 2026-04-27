# API Contract: User Registration

**Phase**: Phase 1 (Design & Contracts)  
**Date**: 2026-04-08  
**Status**: Backend implementation pending; frontend implements to this spec  
**Ratified**: Ready for backend team alignment

---

## Overview

This document defines the HTTP API contract for user registration. Both client and server must adhere to these specifications for successful integration.

**Endpoint**: `POST /api/auth/register`  
**Authentication**: None (public endpoint)  
**Rate Limiting**: TBD by backend (recommend: 5 attempts per minute per IP)  
**CORS**: Allowed from `http://localhost:3000` (dev), production domain (prod)

---

## Request Specification

### HTTP Method & Path

```http
POST /api/auth/register
```

### Headers

```http
Content-Type: application/json
```

### Body Schema

```typescript
interface RegisterRequest {
  fullName: string;      // Required. 2-256 characters.
  email: string;         // Required. Valid email format.
  password: string;      // Required. 8-128 characters with complexity.
  dateOfBirth: string;   // Required. ISO date format (YYYY-MM-DD). Must be past date, max 200 years ago.
}
```

### Body Example (Success Case)

```json
{
  "fullName": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "SecurePass123!",
  "dateOfBirth": "1990-06-15"
}
```

### Body Example (Validation Error Case)

```json
{
  "fullName": "",
  "email": "invalid-email",
  "password": "weak"
}
```

### Validation Rules (Server-Side)

The server MUST validate all fields before processing:

| Field | Rules | Error Code | HTTP Status |
|-------|-------|-----------|------------|
| fullName | Required, 2-256 chars, alphanumeric + spaces/hyphens/apostrophes | INVALID_INPUT | 400 |
| email | Required, valid email, max 254 chars, UNIQUE in database | INVALID_INPUT or EMAIL_EXISTS | 400 or 409 |
| password | Required, 8-128 chars, uppercase + lowercase + digit + special char | INVALID_INPUT | 400 |
| dateOfBirth | Required, valid ISO date (YYYY-MM-DD), must be in the past, max 200 years ago | INVALID_INPUT | 400 |

**Note**: Client performs initial validation via Zod; server performs authoritative validation.

---

## Response Specifications

### Success Response (201 Created)

**HTTP Status**: `201 Created`

**Headers**:
```http
Content-Type: application/json
Set-Cookie: (optional - deferred to login)
```

**Body Schema**:
```typescript
interface RegisterSuccessResponse {
  userId: string;    // Generated UUID or alphanumeric ID
  email: string;     // Echoed from request
  message: string;   // Fixed: "Account created successfully"
}
```

**Body Example**:
```json
{
  "userId": "usr_e7f4c2d9b1a5",
  "email": "jane.doe@example.com",
  "message": "Account created successfully"
}
```

**Client Behavior**:
- Parse response and extract `userId` (may be used for audit logging)
- Display success banner: "Account created successfully"
- Redirect to `/login?registered=true` after 2-second delay
- Pre-fill email field on login page with registered email

---

### Error Response - Validation Error (400 Bad Request)

**HTTP Status**: `400 Bad Request`

**Headers**:
```http
Content-Type: application/json
```

**Body Schema**:
```typescript
interface RegisterErrorResponse {
  error: string;      // User-friendly message (English)
  errorCode: string;  // Machine code: INVALID_INPUT
  field?: string;     // Optional: which field failed (fullName, email, password)
}
```

**Body Examples**:

**Missing required field**:
```json
{
  "error": "Full name is required",
  "errorCode": "INVALID_INPUT",
  "field": "fullName"
}
```

**Invalid email format**:
```json
{
  "error": "Invalid email address",
  "errorCode": "INVALID_INPUT",
  "field": "email"
}
```

**Password too weak** (note: client already validates this, but server must also):
```json
{
  "error": "Password must contain an uppercase letter, lowercase letter, number, and special character",
  "errorCode": "INVALID_INPUT",
  "field": "password"
}
```

**Client Behavior**:
- Parse `errorCode` and `field`
- Display error banner with `error` message
- If `field` provided, highlight that input with red border/accessible error announcement
- Allow user to fix and retry

---

### Error Response - Email Exists (409 Conflict)

**HTTP Status**: `409 Conflict`

**Headers**:
```http
Content-Type: application/json
```

**Body Schema**:
```typescript
interface RegisterConflictResponse {
  error: string;      // User-friendly message
  errorCode: string;  // Machine code: EMAIL_EXISTS
  field: string;      // Always "email"
}
```

**Body Example**:
```json
{
  "error": "Email already registered. Try login or use another email.",
  "errorCode": "EMAIL_EXISTS",
  "field": "email"
}
```

**Client Behavior**:
- Display error banner with message
- Highlight email input
- Suggest user navigate to `/login` (provide link)
- Allow retry with different email

---

### Error Response - Server Error (500 Internal Server Error)

**HTTP Status**: `500 Internal Server Error`

**Headers**:
```http
Content-Type: application/json
```

**Body Schema**:
```typescript
interface RegisterServerErrorResponse {
  error: string;      // Generic message (no stack traces or internal details)
  errorCode: string;  // Machine code: SERVER_ERROR
}
```

**Body Example**:
```json
{
  "error": "Unable to create account. Please try again later.",
  "errorCode": "SERVER_ERROR"
}
```

**Client Behavior**:
- Display error banner
- Show retry button (exponential backoff: immediate, 2s delay, 5s delay)
- After 3 failed attempts, suggest user contact support
- Log error to observability service (Sentry, DataDog, etc.) for debugging

---

### Error Response - Other Server Errors (500+)

The server MAY return other 5xx errors (e.g., 502, 503). Client treats all 5xx as transient server errors.

**Recommended Client Behavior**:
- Retry with exponential backoff (max 3 attempts)
- Display generic error message: "Service temporarily unavailable. Please try again."
- After retries exhausted, suggest user try again later

---

## Request/Response Examples

### Complete Happy Path

**Request**:
```http
POST /api/auth/register HTTP/1.1
Host: api.example.com
Content-Type: application/json

{
  "fullName": "John Smith",
  "email": "john.smith@example.com",
  "password": "MyPass2024!"
}
```

**Response (201)**:
```http
HTTP/1.1 201 Created
Content-Type: application/json
Content-Length: 110

{
  "userId": "usr_a1b2c3d4e5f6",
  "email": "john.smith@example.com",
  "message": "Account created successfully"
}
```

---

### Complete Error Path (Email Exists)

**Request**:
```http
POST /api/auth/register HTTP/1.1
Host: api.example.com
Content-Type: application/json

{
  "fullName": "Jane Doe",
  "email": "existing@example.com",
  "password": "NewPass2024!"
}
```

**Response (409)**:
```http
HTTP/1.1 409 Conflict
Content-Type: application/json
Content-Length: 115

{
  "error": "Email already registered. Try login or use another email.",
  "errorCode": "EMAIL_EXISTS",
  "field": "email"
}
```

---

## Security Considerations

### Password Handling

**Server MUST**:
- ✅ Hash password using bcrypt (cost factor ≥ 12) or Argon2
- ✅ Never store plain-text password
- ✅ Never log password (even hashed)
- ✅ Use constant-time comparison for verification (if needed)

**Client MUST**:
- ✅ Never log password to console (browser DevTools may expose)
- ✅ Only transmit password over HTTPS
- ✅ Memory-clear password field after submission (handled by React Hook Form)

### Email Validation

**Server MUST**:
- ✅ Validate email format on server (never trust client)
- ✅ Enforce unique email constraint in database
- ✅ Consider disposable email filtering (optional, Phase 2)
- ✅ Consider email domain allowlisting (optional, Phase 2)

**Client**:
- Validates email format via Zod (convenience; not security)

### CORS & CSRF Protection

**Server MUST**:
- ✅ Verify Origin header matches allowed domains
- ✅ Implement CSRF token validation (if using sessions)
- ✅ Validate Content-Type: application/json (reject form-data)

**Client**:
- Uses standard fetch/axios with automatic header handling

### Rate Limiting

**Server SHOULD**:
- ⚠️ Rate limit registration attempts (recommend: 5 per minute per IP)
- ⚠️ Implement CAPTCHA after N failed attempts (Phase 2)
- ⚠️ Log suspicious registration patterns for fraud detection (Phase 2)

---

## Error Codes Reference

| Error Code | HTTP Status | Meaning | Client Action |
|-----------|------------|---------|--------------|
| INVALID_INPUT | 400 | Validation failed | Show field error; allow retry |
| EMAIL_EXISTS | 409 | Email already registered | Highlight email; suggest login |
| SERVER_ERROR | 500 | Backend fault | Retry with backoff; suggest support |
| (other 5xx) | 500+ | Transient server error | Retry with backoff |

---

## Testing & Validation

### Backend Test Cases

**Positive Cases**:
- ✅ Valid registration → 201 + userId
- ✅ Valid email (various formats) → 201
- ✅ Password with special chars (!, @, #, $, %) → 201

**Negative Cases**:
- ❌ Missing fullName → 400 INVALID_INPUT
- ❌ fullName too short (<2 chars) → 400 INVALID_INPUT
- ❌ Invalid email → 400 INVALID_INPUT
- ❌ Duplicate email → 409 EMAIL_EXISTS
- ❌ Password too short (<8 chars) → 400 INVALID_INPUT
- ❌ Password without uppercase → 400 INVALID_INPUT
- ❌ Password without digit → 400 INVALID_INPUT
- ❌ Password without special char → 400 INVALID_INPUT

### Frontend Test Cases

**Happy Path**:
- ✅ Fill valid form → submit → show success → redirect to /login

**Validation Errors**:
- ❌ Empty field → error message below field
- ❌ Invalid email → error message below field
- ❌ Submit button disabled until all fields valid

**Server Errors**:
- ❌ 400 response → show error banner + highlight field
- ❌ 409 response (email exists) → show error banner + suggest login
- ❌ 500 response → show retry button + backoff

**Network Errors**:
- ⏱️ Request timeout → show retry button + message

---

## Versioning & Changes

### Current Version

**Version**: 1.0.0  
**Date**: 2026-04-08  
**Status**: Pre-implementation (awaiting backend sign-off)

### Breaking Changes

If backend needs to change this contract:
1. **MAJOR** (breaking): Change errorCode values, remove fields, change HTTP status
2. **MINOR** (additive): Add optional field, add new errorCode
3. **PATCH** (fix): Clarify wording, no contract changes

**Policy**: Frontend and backend must be deployed together for major version changes.

---

## Checklist for Backend Team

- [ ] Define database schema for users (id, fullName, email, passwordHash, created_at, updated_at)
- [ ] Implement POST /api/auth/register endpoint
- [ ] Validate all fields with error codes matching this spec
- [ ] Hash password using bcrypt/Argon2
- [ ] Enforce unique email constraint
- [ ] Return correct HTTP status codes (201, 400, 409, 500)
- [ ] Return JSON response matching this spec
- [ ] Test with client-side form validation errors (400)
- [ ] Test with duplicate email (409)
- [ ] Test with server error (500)
- [ ] Share endpoint URL with frontend team
- [ ] Confirm CORS origin and allowed domains

---

## Checklist for Frontend Team

- [ ] Implement RegistrationForm component
- [ ] Integrate Zod schema with React Hook Form
- [ ] Call POST /api/auth/register on form submit
- [ ] Handle 201 success → show banner → redirect to /login
- [ ] Handle 400 INVALID_INPUT → show error message + highlight field
- [ ] Handle 409 EMAIL_EXISTS → show error message + suggest login
- [ ] Handle 5xx SERVER_ERROR → show retry button + exponential backoff
- [ ] Handle network errors → show retry button + message
- [ ] Add skeleton loader during submission
- [ ] Verify WCAG 2.1 AA accessibility (screen reader, keyboard nav)
- [ ] Test on mobile (48px touch targets, responsive layout)
- [ ] Add E2E tests covering happy path + error cases
- [ ] Request design token export from Stitch project
- [ ] Add to Storybook with error states documented

---

## Appendix: Curl Examples

### Successful Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePass123!"
  }'

# Expected Response (201):
# {
#   "userId": "usr_xyz",
#   "email": "jane@example.com",
#   "message": "Account created successfully"
# }
```

### Validation Error

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "J",
    "email": "invalid",
    "password": "weak"
  }'

# Expected Response (400):
# {
#   "error": "Invalid email address",
#   "errorCode": "INVALID_INPUT",
#   "field": "email"
# }
```

### Email Already Exists

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Another User",
    "email": "existing@example.com",
    "password": "AnotherPass123!"
  }'

# Expected Response (409):
# {
#   "error": "Email already registered. Try login or use another email.",
#   "errorCode": "EMAIL_EXISTS",
#   "field": "email"
# }
```
