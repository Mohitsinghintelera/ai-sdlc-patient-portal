# Quickstart: Backend Date of Birth Implementation

**Branch**: `045-backend-dob-apis` | **Date**: 2026-04-28

This guide tells an implementer exactly what to change and in what order to deliver the DOB feature across the register, login, and me endpoints.

---

## Implementation Order

Work in this sequence — each layer depends on the layer below it.

```
1. Domain entity  →  2. DB migration  →  3. Request DTO + Validator
       ↓
4. Mapper (new)  →  5. Service + Interface  →  6. Controllers
       ↓
7. Tests
```

---

## Step 1 — Domain Entity

**File**: `PatientPortal.Domain/Entities/User.cs`

Add one property:
```csharp
public DateOnly DateOfBirth { get; set; }
```

---

## Step 2 — Database Migration

**File**: `PatientPortal.Infrastructure/PatientPortalDbContext.cs`

Inside the `modelBuilder.Entity<User>` block, add:
```csharp
builder.Property(u => u.DateOfBirth)
    .HasColumnType("date")
    .IsRequired(false);
```

Then generate the migration:
```bash
cd AI-SDLC-Patient-Backend
dotnet ef migrations add AddDateOfBirthToUsers \
  --project PatientPortal.Infrastructure \
  --startup-project PatientPortal.Api
dotnet ef database update \
  --project PatientPortal.Infrastructure \
  --startup-project PatientPortal.Api
```

---

## Step 3 — Request DTO

**File**: `PatientPortal.Api/Models/Auth/RegistrationRequest.cs`

Add:
```csharp
public string DateOfBirth { get; set; } = string.Empty;
```

---

## Step 4 — Validator

**File**: `PatientPortal.Api/Validators/AuthRequestValidator.cs`

Add inside the constructor (after existing rules):
```csharp
RuleFor(x => x.DateOfBirth)
    .NotEmpty().WithMessage("dateOfBirth is required")
    .Must(v => DateOnly.TryParseExact(v, "MM-dd-yyyy",
        System.Globalization.CultureInfo.InvariantCulture,
        System.Globalization.DateTimeStyles.None, out _))
    .WithMessage("dateOfBirth must be in MM-DD-YYYY format")
    .DependentRules(() =>
    {
        RuleFor(x => x.DateOfBirth)
            .Must(v =>
            {
                DateOnly.TryParseExact(v, "MM-dd-yyyy",
                    System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.None, out var d);
                return d < DateOnly.FromDateTime(DateTime.UtcNow);
            })
            .WithMessage("dateOfBirth must be a past date")
            .Must(v =>
            {
                DateOnly.TryParseExact(v, "MM-dd-yyyy",
                    System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.None, out var d);
                return DateTime.UtcNow.Year - d.Year <= 200;
            })
            .WithMessage("dateOfBirth must be within the last 200 years");
    });
```

---

## Step 5 — Shared Formatter (New File)

**File** (create): `PatientPortal.Application/Mappers/DateOfBirthMapper.cs`

```csharp
using System.Globalization;

namespace PatientPortal.Application.Mappers;

public static class DateOfBirthMapper
{
    private const string Format = "MM-dd-yyyy";

    public static string? FormatDob(DateOnly dob) =>
        dob == default ? null : dob.ToString(Format, CultureInfo.InvariantCulture);

    public static DateOnly? ParseDob(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        return DateOnly.TryParseExact(raw, Format, CultureInfo.InvariantCulture,
            DateTimeStyles.None, out var result)
            ? result
            : null;
    }
}
```

---

## Step 6 — UserDto

**File**: `PatientPortal.Application/Models/Auth/UserDto.cs`

Add:
```csharp
public string? DateOfBirth { get; set; }
```

---

## Step 7 — Service Interface

**File**: `PatientPortal.Application/Interfaces/IAuthService.cs`

Update `RegisterAsync` signature:
```csharp
Task<RegisterSuccessResponse> RegisterAsync(
    string fullName, string email,
    string password, string confirmPassword,
    DateOnly dateOfBirth);
```

---

## Step 8 — AuthService

**File**: `PatientPortal.Application/Services/AuthService.cs`

**`RegisterAsync`** — add parameter and set property:
```csharp
public async Task<RegisterSuccessResponse> RegisterAsync(
    string fullName, string email,
    string password, string confirmPassword,
    DateOnly dateOfBirth)
{
    // ... existing checks unchanged ...

    var user = new User
    {
        // ... existing fields unchanged ...
        DateOfBirth = dateOfBirth,   // ← add this
    };

    // ... rest unchanged ...
}
```

**`CreateAuthResponse`** — add DOB to UserDto:
```csharp
User = new UserDto
{
    Id = user.Id,
    Email = user.Email,
    FirstName = user.FirstName,
    LastName = user.LastName,
    Role = user.Role,
    IsActive = user.IsActive,
    DateOfBirth = DateOfBirthMapper.FormatDob(user.DateOfBirth),   // ← add this
}
```

---

## Step 9 — AuthController (Register action)

**File**: `PatientPortal.Api/Controllers/AuthController.cs`

Parse DOB before calling the service, and pass it through:
```csharp
var dateOfBirth = DateOfBirthMapper.ParseDob(request.DateOfBirth)!.Value;
var result = await _authService.RegisterAsync(
    request.FullName, request.Email,
    request.Password, request.ConfirmPassword,
    dateOfBirth);
```

> `ParseDob` will not return `null` here because the validator already confirmed the format is valid.

---

## Step 10 — UserController (me endpoint)

**File**: `PatientPortal.Api/Controllers/UserController.cs`

Add DOB to the inline `UserDto` construction:
```csharp
Data = new UserDto
{
    Id = user.Id,
    Email = user.Email,
    FirstName = user.FirstName,
    LastName = user.LastName,
    Role = user.Role,
    IsActive = user.IsActive,
    DateOfBirth = DateOfBirthMapper.FormatDob(user.DateOfBirth),   // ← add this
}
```

---

## Step 11 — Tests

### New unit test file

**File**: `tests/PatientPortal.Api.Tests/unit/DateOfBirthValidationTests.cs`

Cover these cases:
- Missing DOB → validation error
- Invalid format (e.g., `"1990-01-15"`, `"not-a-date"`) → validation error
- Future date → validation error
- Exactly today → validation error
- Date more than 200 years ago → validation error
- Exactly 200 years ago today → passes validation
- Valid past date → passes validation

### Update existing test files

| File | What to add |
|---|---|
| `tests/PatientPortal.Api.Tests/contracts/RegisterContractTests.cs` | Add DOB to valid registration payload; add negative cases for each DOB validation rule |
| `tests/PatientPortal.Api.Tests/integration/RegisterIntegrationTests.cs` | Verify DOB is persisted to DB after successful registration |
| `tests/PatientPortal.Api.Tests/integration/AuthIntegrationTests.cs` | Verify `dateOfBirth` appears in login response and me response; verify `null` for legacy account |

### New mapper unit test file

**File**: `tests/PatientPortal.Application.Tests/DateOfBirthMapperTests.cs`

Cover: `FormatDob` with valid date, `FormatDob` with `default`, `ParseDob` with valid string, `ParseDob` with invalid string.

---

## Verification Checklist

After implementation:

- [ ] `dotnet build` passes with no errors or warnings
- [ ] `dotnet ef migrations list` shows `AddDateOfBirthToUsers` as applied
- [ ] `POST /api/v1/auth/register` with valid DOB returns 201; without DOB returns 400
- [ ] `POST /api/v1/auth/login` response includes `dateOfBirth` in `user` object
- [ ] `GET /api/v1/users/me` response includes `dateOfBirth`
- [ ] DOB with future date rejected with 400 and message `"dateOfBirth must be a past date"`
- [ ] DOB exactly 200 years ago accepted
- [ ] DOB 200 years and 1 day ago rejected with message `"dateOfBirth must be within the last 200 years"`
- [ ] Legacy account (no DOB stored) returns `"dateOfBirth": null` without error
- [ ] All new and existing tests pass
