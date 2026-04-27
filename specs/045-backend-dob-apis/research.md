# Research: Backend Date of Birth — Register / Login / Me APIs

**Branch**: `045-backend-dob-apis` | **Phase**: 0 | **Date**: 2026-04-28

---

## 1. Date Type for Storage

**Decision**: Use `DateOnly` (C# / .NET 6+) on the `User` domain entity. EF Core maps `DateOnly` to a SQL `date` column automatically when targeting SQL Server.

**Rationale**:
- `DateOnly` carries no time-zone or time-of-day ambiguity — a birth date is a calendar date, not a moment in time.
- Avoids the classic bug of `DateTime` values shifting by hours across time zones (e.g., `1990-01-01T00:00:00Z` becoming `1989-12-31` in UTC-1).
- `DateOnly` is the idiomatic .NET 8 type for this use case and is already supported by EF Core 6+.
- SQL `date` column (not `datetime2`) is semantically correct and more space-efficient.

**Alternative rejected**: `DateTime` — carries unnecessary time component; prone to timezone issues; semantically wrong for a birth date.

---

## 2. Input Format (Registration Request)

**Decision**: Accept `dateOfBirth` as a `string` in `MM-DD-YYYY` format in `RegistrationRequest`. Parse it with `DateOnly.TryParseExact(value, "MM-dd-yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed)` inside `AuthRequestValidator`.

**Rationale**:
- The requirement explicitly states MM-DD-YYYY as the date format.
- Using `string` on the request model avoids coupling the JSON deserializer to a non-standard date format — no custom `JsonConverter` needed.
- Parsing in the FluentValidation validator keeps the controller and service clean; invalid format is caught before the service layer is called.
- `DateOnly.TryParseExact` with `"MM-dd-yyyy"` is exact and rejects ambiguous or out-of-range values (e.g., `02-30-1990`).

**Alternative rejected**: Configuring a global `DateOnly` JSON converter for `MM-dd-yyyy` — would affect all `DateOnly` fields project-wide and is harder to reason about. String + explicit parse in validator is localised and auditable.

---

## 3. Output Format (Login and Profile Responses)

**Decision**: Add `string DateOfBirth` to `UserDto`. Populate it by formatting the `User.DateOfBirth` (`DateOnly`) as `"MM-dd-yyyy"` using `DateOnly.ToString("MM-dd-yyyy")`. A shared static mapper method (`DateOfBirthMapper.Format`) is extracted to avoid duplication between `AuthService.CreateAuthResponse` and `UserController.GetCurrentUser`.

**Rationale**:
- `UserDto` is the single shared output type for both the login response and the profile response — fixing it here fixes both endpoints at once.
- Centralized formatting in `DateOfBirthMapper.Format` satisfies the QA-003 requirement (single reusable location) and makes it trivial to test the format logic in isolation.
- Returning `null` when `User.DateOfBirth` is `default(DateOnly)` (legacy accounts) ensures backward compatibility without throwing.

---

## 4. Validation Rules (FluentValidation)

**Decision**: Add three rules to `AuthRequestValidator` for `DateOfBirth`:

| Rule | FluentValidation expression | Error message |
|---|---|---|
| Required | `NotEmpty()` | `"dateOfBirth is required"` |
| Valid MM-DD-YYYY | `Must(value => DateOnly.TryParseExact(...))` | `"dateOfBirth must be in MM-DD-YYYY format"` |
| Past date | parsed date < today | `"dateOfBirth must be a past date"` |
| Max 200 years | today.Year − parsed.Year ≤ 200 | `"dateOfBirth must be within the last 200 years"` |

**Rationale**:
- All four rules are independent and should produce distinct, actionable error messages.
- The 200-year check uses `today.Year - parsed.Year` (simple, no ambiguity at boundary — a DOB exactly 200 years ago is valid).
- Chaining with `.DependentRules()` ensures parse-dependent checks (past/200-year) only run when the format is valid.

---

## 5. Service Layer Changes

**Decision**: Update `IAuthService.RegisterAsync` signature to add `DateOnly dateOfBirth`. Update `AuthService.RegisterAsync` to accept and assign it to the new `User.DateOfBirth` property. Update `CreateAuthResponse` to map `User.DateOfBirth` → `UserDto.DateOfBirth` via `DateOfBirthMapper.Format`.

**Rationale**:
- `RegisterAsync` already takes individual fields (`fullName`, `email`, `password`, `confirmPassword`) — adding `dateOfBirth` is consistent with this pattern.
- The DOB arrives already parsed (as `DateOnly`) from the controller; the service does not need to parse again.
- The existing `CreateAuthResponse` private method is the single place where `UserDto` is built for the login (and refresh) response — updating it covers both login and refresh.

---

## 6. Database Migration

**Decision**: Add migration `AddDateOfBirthToUsers` with a nullable `date` column on the `Users` table. Also add a `DateOfBirth` property configuration in `PatientPortalDbContext.OnModelCreating`.

**Rationale**:
- Nullable column allows the migration to run against a database that already has users (seed data, existing records), without needing to back-fill data.
- Application-level validation (FluentValidation) enforces the field as required for all new registrations — the DB constraint is intentionally relaxed.
- Migration naming follows the existing convention (`20260409195431_InitialCreate`).

---

## All Unknowns Resolved

| Unknown | Resolution |
|---|---|
| C# date type for DOB | `DateOnly` → SQL `date` column |
| Input format handling | `string` in request DTO; parse in validator with `TryParseExact("MM-dd-yyyy")` |
| Output format handling | `DateOnly.ToString("MM-dd-yyyy")` via `DateOfBirthMapper.Format` on `UserDto` |
| Legacy accounts (no DOB) | `DateOfBirthMapper.Format` returns `null` for `default(DateOnly)` |
| 200-year boundary | Inclusive — exactly 200 years ago is valid |
| Which DTOs need DOB | `UserDto` only (covers login + me); `RegisterSuccessResponse` does not need DOB |
| Shared formatting | New `DateOfBirthMapper` static class in `PatientPortal.Application/Mappers/` |
