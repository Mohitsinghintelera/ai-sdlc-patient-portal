# Data Model: Backend Date of Birth

**Branch**: `045-backend-dob-apis` | **Phase**: 1 | **Date**: 2026-04-28

---

## Entity Changes

### User (Domain Entity)

**File**: `AI-SDLC-Patient-Backend/PatientPortal.Domain/Entities/User.cs`

**Change**: Add `DateOfBirth` property.

```
Before:
  FirstName   string  (required)
  LastName    string  (required)
  Email       string  (required, unique)
  PasswordHash string (required)
  Role        string  (required, default "Patient")
  IsActive    bool    (default true)
  RefreshToken string? (nullable)
  RefreshTokenExpiresOn DateTime? (nullable)
  [+ AuditableEntity: Id, CreatedOn, CreatedBy, ModifiedOn, ModifiedBy]

After (added field highlighted):
  + DateOfBirth  DateOnly  (nullable — default(DateOnly) for legacy accounts)
```

**Validation rules** (enforced at API layer, not at DB level):
- Required for all new registrations
- Must be a past date (strictly before today)
- Must be within the last 200 years (i.e., ≥ today's date minus 200 years, inclusive)

---

### Database Column

**Table**: `Users`  
**Column**: `DateOfBirth DATE NULL`

Added via EF Core migration `AddDateOfBirthToUsers`. Nullable to allow existing records to remain without a DOB value.

`PatientPortalDbContext.OnModelCreating` configuration added:
```
builder.Property(u => u.DateOfBirth)
    .HasColumnType("date")
    .IsRequired(false);
```

---

## DTO Changes

### RegistrationRequest (API Input DTO)

**File**: `AI-SDLC-Patient-Backend/PatientPortal.Api/Models/Auth/RegistrationRequest.cs`

**Change**: Add `DateOfBirth` as a `string` (received in MM-DD-YYYY format, validated and parsed before the service is called).

```
Before:
  FullName         string
  Email            string
  Password         string
  ConfirmPassword  string

After:
  FullName         string
  Email            string
  Password         string
  ConfirmPassword  string
  + DateOfBirth    string   ← accepted as "MM-DD-YYYY"; validated in AuthRequestValidator
```

**JSON key**: `dateOfBirth`

---

### UserDto (Shared Output DTO — Login & Me responses)

**File**: `AI-SDLC-Patient-Backend/PatientPortal.Application/Models/Auth/UserDto.cs`

**Change**: Add `DateOfBirth` as a `string` (formatted MM-DD-YYYY; `null` for legacy accounts).

```
Before:
  Id        Guid
  Email     string
  FirstName string
  LastName  string
  Role      string
  IsActive  bool

After:
  Id          Guid
  Email       string
  FirstName   string
  LastName    string
  Role        string
  IsActive    bool
  + DateOfBirth  string?   ← "MM-DD-YYYY" formatted; null for legacy accounts
```

**JSON key**: `dateOfBirth`

> `RegisterSuccessResponse` is NOT changed — the registration confirmation response does not need to return DOB.

---

## New Mapper

### DateOfBirthMapper

**File** (new): `AI-SDLC-Patient-Backend/PatientPortal.Application/Mappers/DateOfBirthMapper.cs`

Single responsibility: convert `DateOnly` ↔ `string` in MM-DD-YYYY format.

```
Methods:
  Format(DateOnly? dob) → string?
    Returns null if dob is null or default(DateOnly)
    Returns dob.ToString("MM-dd-yyyy") otherwise

  Parse(string raw) → DateOnly?
    Returns null if DateOnly.TryParseExact(raw, "MM-dd-yyyy", ...) fails
    Returns parsed DateOnly on success
```

**Used by**:
- `AuthService.CreateAuthResponse` — format DOB when building `UserDto` for login/refresh responses
- `UserController.GetCurrentUser` — format DOB when building `UserDto` for the me response

---

## Validation Rules Added

**File**: `AI-SDLC-Patient-Backend/PatientPortal.Api/Validators/AuthRequestValidator.cs`

Four new rules on `RegistrationRequest.DateOfBirth`:

| # | Rule | Condition | Error message |
|---|---|---|---|
| 1 | Required | field is not null/empty | `"dateOfBirth is required"` |
| 2 | Valid format | parses as MM-DD-YYYY | `"dateOfBirth must be in MM-DD-YYYY format"` |
| 3 | Past date | parsed date < DateOnly.FromDateTime(DateTime.UtcNow) | `"dateOfBirth must be a past date"` |
| 4 | Max 200 years | today.Year − parsed.Year ≤ 200 | `"dateOfBirth must be within the last 200 years"` |

Rules 3 and 4 run only when rule 2 passes (dependent rules).

---

## Service Interface Change

**File**: `AI-SDLC-Patient-Backend/PatientPortal.Application/Interfaces/IAuthService.cs`

**Change**: Add `DateOnly dateOfBirth` parameter to `RegisterAsync`.

```
Before:
  Task<RegisterSuccessResponse> RegisterAsync(string fullName, string email, string password, string confirmPassword)

After:
  Task<RegisterSuccessResponse> RegisterAsync(string fullName, string email, string password, string confirmPassword, DateOnly dateOfBirth)
```

---

## Files Changed — Summary

| File | Change type |
|---|---|
| `PatientPortal.Domain/Entities/User.cs` | Add `DateOnly DateOfBirth` property |
| `PatientPortal.Api/Models/Auth/RegistrationRequest.cs` | Add `string DateOfBirth` property |
| `PatientPortal.Api/Validators/AuthRequestValidator.cs` | Add 4 DOB validation rules |
| `PatientPortal.Application/Interfaces/IAuthService.cs` | Add `DateOnly dateOfBirth` param to `RegisterAsync` |
| `PatientPortal.Application/Services/AuthService.cs` | Accept & persist DOB in `RegisterAsync`; map DOB in `CreateAuthResponse` |
| `PatientPortal.Api/Controllers/AuthController.cs` | Parse DOB string → `DateOnly`; pass to `RegisterAsync` |
| `PatientPortal.Application/Models/Auth/UserDto.cs` | Add `string? DateOfBirth` property |
| `PatientPortal.Api/Controllers/UserController.cs` | Map DOB via `DateOfBirthMapper.Format` in `GetCurrentUser` |
| `PatientPortal.Infrastructure/PatientPortalDbContext.cs` | Configure `DateOfBirth` column |
| **New** `PatientPortal.Application/Mappers/DateOfBirthMapper.cs` | Format/parse helper |
| **New** Migration `AddDateOfBirthToUsers` | Add nullable `date` column to `Users` table |
