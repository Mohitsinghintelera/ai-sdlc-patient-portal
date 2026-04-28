# Feature Specification: Backend Date of Birth Support Across Register, Login, and Profile APIs

**Feature Branch**: `045-backend-dob-apis`  
**Created**: 2026-04-28  
**Status**: Draft  
**Input**: User description: "Backend only: Add Date of Birth field to User Registration API (register), User Login API (login), and User Profile (me) API. Date format MM-DD-YYYY. Validation: age must not exceed 200 years."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register with Date of Birth (Priority: P1)

A client system (or future frontend) sends a registration request that now includes the patient's date of birth. The backend accepts the DOB, validates it (not in the future, age ≤ 200 years, required), stores it with the user record, and returns a success response.

**Why this priority**: Registration is the entry point where DOB data is captured and persisted. Without this, no other API can return the value. All downstream APIs (login, profile) depend on DOB being stored at registration time.

**Independent Test**: Can be fully tested by sending a `POST /api/v1/auth/register` request with a valid DOB and verifying the registration succeeds, then separately verifying that an invalid DOB (future date, over 200 years, missing) is rejected with an appropriate error.

**Acceptance Scenarios**:

1. **Given** a registration request includes a valid DOB (past date, within 200 years), **When** the request is submitted, **Then** the registration succeeds and DOB is persisted to the user record
2. **Given** a registration request includes no DOB, **When** the request is submitted, **Then** the server returns a 400 validation error indicating DOB is required
3. **Given** a registration request includes a future date as DOB, **When** the request is submitted, **Then** the server returns a 400 validation error indicating DOB must be a past date
4. **Given** a registration request includes a DOB more than 200 years in the past, **When** the request is submitted, **Then** the server returns a 400 validation error indicating the maximum age limit is 200 years
5. **Given** a registration request includes a valid DOB, **When** the registration succeeds, **Then** the DOB stored in the database matches the submitted value

---

### User Story 2 - Login Response Includes Date of Birth (Priority: P2)

After a patient logs in successfully, the login response payload includes the patient's date of birth alongside their other profile data. The date is formatted as MM-DD-YYYY in the response.

**Why this priority**: Including DOB in the login response allows client applications to display or use the DOB immediately after authentication without a separate profile API call. This is a read-only change to the response contract — no new validation logic.

**Independent Test**: Can be fully tested by logging in with a registered account (that has a DOB stored) and verifying the `dateOfBirth` field appears in the response formatted as MM-DD-YYYY.

**Acceptance Scenarios**:

1. **Given** a patient with a stored DOB logs in with valid credentials, **When** the login request is submitted, **Then** the response includes a `dateOfBirth` field formatted as MM-DD-YYYY
2. **Given** a patient logs in successfully, **When** the response is returned, **Then** the `dateOfBirth` value matches the DOB recorded at registration
3. **Given** a patient account has no DOB stored (legacy record), **When** that patient logs in, **Then** the `dateOfBirth` field in the response is `null` (no error thrown)

---

### User Story 3 - Profile (me) Endpoint Returns Date of Birth (Priority: P2)

When an authenticated patient queries their own profile via the "me" endpoint, the response includes their date of birth formatted as MM-DD-YYYY.

**Why this priority**: The profile endpoint is the canonical source of user data for authenticated sessions. Including DOB here ensures client applications can always retrieve it independently of the login flow.

**Independent Test**: Can be fully tested by calling the profile endpoint with a valid auth token and verifying `dateOfBirth` is present and correctly formatted in the response.

**Acceptance Scenarios**:

1. **Given** an authenticated patient calls the profile endpoint, **When** the request is made with a valid token, **Then** the response includes `dateOfBirth` formatted as MM-DD-YYYY
2. **Given** an authenticated patient calls the profile endpoint, **When** the response is returned, **Then** the `dateOfBirth` value matches the DOB stored at registration
3. **Given** a legacy account with no DOB is authenticated, **When** the profile endpoint is called, **Then** `dateOfBirth` is returned as `null` without an error

---

## Quality Acceptance Criteria *(aligned with constitution)*

### Code Quality (Principle I: Code Quality Excellence)

- **QA-001**: MUST achieve min 80% code coverage for all DOB-related business logic (validation rules, mapping, persistence)
- **QA-002**: MUST pass linting/static analysis with zero errors and ≤5 warnings
- **QA-003**: MUST have ≤3% code duplication; shared DOB formatting logic must live in a single reusable location used by both the login and profile responses
- **QA-004**: MUST have cyclomatic complexity ≤5 per function for all DOB validation and mapping methods

### Test-Driven Development (Principle II: TDD)

- **QA-005**: MUST follow Red-Green-Refactor: DOB validation and mapping tests written first, then implementation
- **QA-006**: MUST include unit tests for: (a) DOB validation rules in the registration validator, (b) DOB formatting in response mappers
- **QA-007**: MUST include integration tests for all three API endpoints (register, login, me) verifying DOB is accepted/returned correctly
- **QA-008**: E2E tests are not required — this is a backend-only change with no UI
- **QA-009**: All acceptance scenarios above MUST have corresponding automated tests

### User Experience Consistency (Principle III: UX Consistency)

- **QA-010**: DOB MUST be formatted identically (MM-DD-YYYY) across all three API responses — no inconsistency between login and profile endpoints
- **QA-011**: Validation error messages MUST follow the existing error response format used by the registration API (error code + user-friendly message)

### Performance Requirements (Principle IV: Performance)

- **QA-015**: All three endpoints (register, login, me) MUST maintain their existing API response SLA: p95 ≤200ms, p99 ≤500ms — adding DOB must not cause measurable regression
- **QA-018**: DOB persistence query MUST complete in ≤100ms under standard load; no new unindexed query patterns introduced

**Edge Cases**:

- What happens when DOB is submitted as an invalid string that cannot be parsed as a date — server must return a 400 error with a clear parse failure message
- What happens when the date is exactly 200 years ago today — this is a valid DOB (boundary condition must be inclusive)
- What happens when a legacy user account (no DOB) calls the login or profile endpoint — `dateOfBirth` must be `null`, not an error
- How does the system handle leap-year DOBs (Feb 29) for non-leap years — must reject invalid calendar dates with a clear parse error

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The registration endpoint MUST accept a `dateOfBirth` field in the request body
- **FR-002**: The `dateOfBirth` field MUST be required in the registration request — registration must fail if it is absent
- **FR-003**: The system MUST reject a `dateOfBirth` that is today's date or any future date with a 400 validation error
- **FR-004**: The system MUST reject a `dateOfBirth` that results in an age greater than 200 years with a 400 validation error
- **FR-005**: The system MUST persist the validated `dateOfBirth` to the user record in the database
- **FR-006**: The login endpoint response MUST include the authenticated user's `dateOfBirth` formatted as MM-DD-YYYY
- **FR-007**: The profile ("me") endpoint response MUST include the authenticated user's `dateOfBirth` formatted as MM-DD-YYYY
- **FR-008**: For legacy user accounts where no DOB was recorded, all endpoints MUST return `dateOfBirth` as `null` without throwing an error
- **FR-009**: DOB formatting (MM-DD-YYYY) MUST be applied consistently in the same way across both the login and profile responses

### Key Entities

- **User**: The patient account record; gains a new optional `dateOfBirth` attribute (optional only for legacy records; required for all new registrations). Related to all three APIs as the single source of truth for the DOB value.
- **Registration Request**: The inbound payload for new account creation; now includes a required `dateOfBirth` field subject to validation rules.
- **Authentication Response**: The outbound payload from both the login and profile endpoints; now includes a `dateOfBirth` field formatted as MM-DD-YYYY (nullable for legacy accounts).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of new user registrations submitted with a valid DOB result in the DOB being persisted — zero silent data-loss failures
- **SC-002**: 100% of registration requests with an invalid DOB (future date, over 200 years, missing) are rejected with a 400 error and descriptive message
- **SC-003**: The `dateOfBirth` field appears in 100% of login and profile responses for accounts that have a DOB on record
- **SC-004**: DOB is formatted as MM-DD-YYYY in every login and profile API response — zero format inconsistencies across endpoints
- **SC-005**: All three affected endpoints maintain their existing response-time SLAs after the change — no measurable performance regression

## Assumptions

- This is a backend-only change; no frontend form or UI changes are in scope for this feature
- The "me" endpoint already exists as an authenticated route returning user profile data; adding `dateOfBirth` to its response is an additive change
- "Login" refers to including DOB in the login success response payload, not using DOB as an authentication credential
- The DOB is accepted from the client in MM-DD-YYYY format and stored internally in a standard date format; MM-DD-YYYY is both the input and output format for this API contract
- A database migration is required to add the `dateOfBirth` column to the existing users table; the column is nullable to support legacy accounts
- Existing registered users (seed data, any pre-existing records) will have `null` for `dateOfBirth` — this is acceptable and handled gracefully
- No age-based business rules beyond the 200-year maximum are in scope (e.g., no minimum age check, no age-based access control)
- The backend validation for "not in the future" is implied by a valid date of birth — a person cannot be born in the future; this is treated as a required validation even though not explicitly listed as a separate requirement
