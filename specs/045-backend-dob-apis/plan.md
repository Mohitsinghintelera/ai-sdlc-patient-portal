# Implementation Plan: Backend Date of Birth — Register / Login / Me APIs

**Branch**: `045-backend-dob-apis` | **Date**: 2026-04-28 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/045-backend-dob-apis/spec.md`

---

## Summary

Add a Date of Birth field to the patient registration API (accepted and validated in the request, persisted to the Users table), and include it in the login and profile (me) API responses formatted as MM-DD-YYYY. This is a backend-only change touching one domain entity, one new migration, two request/response DTOs, one new shared formatter, one validator, two controllers, and one service. No frontend changes.

---

## Technical Context

**Language/Version**: C# 12 / .NET 8  
**Primary Dependencies**: ASP.NET Core 8, FluentValidation, Entity Framework Core 8, BCrypt.Net  
**Storage**: SQL Server — `Users` table gains a nullable `date` column (`DateOfBirth`)  
**Testing**: xUnit — existing test projects: `PatientPortal.Api.Tests`, `PatientPortal.Application.Tests`, `PatientPortal.Infrastructure.Tests`  
**Target Platform**: Linux / Windows server (ASP.NET Core hosted)  
**Project Type**: REST API (web service)  
**Performance Goals**: All three endpoints maintain p95 ≤200ms, p99 ≤500ms (unchanged SLA)  
**Constraints**: DOB column nullable for backward-compatibility; MM-DD-YYYY for both API input and output; no minimum age check; 200-year upper age limit inclusive

---

## Constitution Check

### Code Quality (Principle I) ✅

- **Linting**: Roslyn analysers + `dotnet format` (existing CI tooling)
- **Coverage target**: 80% for DOB validation logic (`AuthRequestValidator`, `DateOfBirthMapper`); 70% for controller DOB mapping code
- **Duplication**: `DateOfBirthMapper` centralises formatting — used by both `AuthService.CreateAuthResponse` and `UserController.GetCurrentUser`; no duplication
- **Complexity**: All new methods are ≤5 cyclomatic complexity (simple null checks + TryParseExact)

### Test-Driven Development (Principle II) ✅

- **Testing tool**: xUnit (existing)
- **TDD sequence**: Write `DateOfBirthValidationTests` (red) → add validator rules (green) → refactor; same for `DateOfBirthMapperTests`
- **Unit tests**: `DateOfBirthValidationTests` (7 cases), `DateOfBirthMapperTests` (4 cases)
- **Integration tests**: `RegisterIntegrationTests` (DOB persisted), `AuthIntegrationTests` (DOB in login + me responses, null for legacy)
- **E2E**: Not applicable — backend-only change

### UX Consistency (Principle III) ✅ (N/A for backend)

- **Format consistency**: `DateOfBirthMapper.FormatDob` used in both login and me responses — identical MM-DD-YYYY output guaranteed
- **Error format**: Validation errors use existing `INVALID_INPUT` error code and format — no new error format introduced

### Performance (Principle IV) ✅

- **Response time**: No new DB queries introduced; `DateOfBirth` is stored on the existing `User` row — no join required
- **Migration**: Nullable column add; runs in milliseconds on the current small dataset; no table rebuild required
- **Index**: No index on `DateOfBirth` needed — the field is not queried as a filter criterion

**Gate Status**: ✅ PASS — all gates checked, no violations

---

## Project Structure

### Documentation (this feature)

```text
specs/045-backend-dob-apis/
├── plan.md              ← this file
├── spec.md              ← feature specification
├── research.md          ← Phase 0: all decisions resolved
├── data-model.md        ← Phase 1: entity + DTO + mapper changes
├── quickstart.md        ← Phase 1: step-by-step implementation guide
├── contracts/
│   ├── register.md      ← POST /api/v1/auth/register contract
│   ├── login.md         ← POST /api/v1/auth/login contract
│   └── me.md            ← GET /api/v1/users/me contract
└── checklists/
    └── requirements.md  ← spec quality checklist (all pass)
```

### Source Code — Files Changed

```text
AI-SDLC-Patient-Backend/
├── PatientPortal.Domain/
│   └── Entities/
│       └── User.cs                              ← add DateOnly DateOfBirth
│
├── PatientPortal.Application/
│   ├── Interfaces/
│   │   └── IAuthService.cs                      ← add dateOfBirth param to RegisterAsync
│   ├── Models/Auth/
│   │   └── UserDto.cs                           ← add string? DateOfBirth
│   ├── Services/
│   │   └── AuthService.cs                       ← assign DOB in RegisterAsync; map in CreateAuthResponse
│   └── Mappers/
│       ├── FullNameMapper.cs                    ← unchanged
│       └── DateOfBirthMapper.cs                 ← NEW: FormatDob / ParseDob
│
├── PatientPortal.Api/
│   ├── Models/Auth/
│   │   └── RegistrationRequest.cs               ← add string DateOfBirth
│   ├── Validators/
│   │   └── AuthRequestValidator.cs              ← add 4 DOB validation rules
│   └── Controllers/
│       ├── AuthController.cs                    ← parse DOB; pass to RegisterAsync
│       └── UserController.cs                    ← add DateOfBirthMapper.FormatDob to me response
│
└── PatientPortal.Infrastructure/
    ├── PatientPortalDbContext.cs                 ← configure DateOfBirth column
    └── Migrations/
        ├── 20260409195431_InitialCreate.cs       ← unchanged
        └── {timestamp}_AddDateOfBirthToUsers.cs  ← NEW: add nullable date column

tests/PatientPortal.Api.Tests/
├── unit/
│   └── DateOfBirthValidationTests.cs            ← NEW: 7 validation unit tests
├── contracts/
│   └── RegisterContractTests.cs                 ← UPDATE: add DOB cases
└── integration/
    ├── RegisterIntegrationTests.cs              ← UPDATE: verify DOB persisted
    └── AuthIntegrationTests.cs                  ← UPDATE: verify DOB in login + me responses

tests/PatientPortal.Application.Tests/
└── DateOfBirthMapperTests.cs                    ← NEW: format + parse unit tests
```

**Structure Decision**: Single backend API project (Option 1 pattern — no frontend, no mobile). All changes confined to `AI-SDLC-Patient-Backend/` and corresponding test projects.

---

## Phase 0: Research — Complete

All unknowns resolved. See [research.md](research.md).

| Decision | Resolution |
|---|---|
| C# date type | `DateOnly` → SQL `date` column |
| API input format | `string` in DTO; `TryParseExact("MM-dd-yyyy")` in validator |
| API output format | `DateOnly.ToString("MM-dd-yyyy")` via `DateOfBirthMapper.FormatDob` |
| Legacy accounts | `FormatDob(default)` returns `null` — no error |
| 200-year boundary | Inclusive (exactly 200 years ago is valid) |
| Shared formatting | New `DateOfBirthMapper` static class |
| Migration strategy | Nullable `date` column for backward compatibility |

---

## Phase 1: Design & Contracts — Complete

### Data Model

Full entity + DTO + mapper changes documented in [data-model.md](data-model.md).

**Key changes**:
- `User.DateOfBirth` (`DateOnly`) — domain entity; SQL `date` column; nullable at DB level
- `RegistrationRequest.DateOfBirth` (`string`) — receives MM-DD-YYYY; validated before reaching service
- `UserDto.DateOfBirth` (`string?`) — formatted MM-DD-YYYY; shared by login + me responses; `null` for legacy accounts
- `DateOfBirthMapper` (new) — `FormatDob(DateOnly)` and `ParseDob(string?)` — used in 3 places

### API Contracts

| Endpoint | Change |
|---|---|
| [POST /api/v1/auth/register](contracts/register.md) | Request gains `dateOfBirth` (required, MM-DD-YYYY); 4 new validation errors; response unchanged |
| [POST /api/v1/auth/login](contracts/login.md) | Request unchanged; response `user` object gains `dateOfBirth` (string\|null) |
| [GET /api/v1/users/me](contracts/me.md) | Request unchanged; response `data` gains `dateOfBirth` (string\|null) |

### Implementation Guide

Step-by-step implementation order with exact code snippets in [quickstart.md](quickstart.md).

### Agent Context

Updated — see `.specify/agent-context/claude.md`.

---

## Complexity Tracking

No constitution violations. No complexity justification required.
