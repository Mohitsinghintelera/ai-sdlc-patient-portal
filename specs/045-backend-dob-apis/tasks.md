# Tasks: Backend Date of Birth — Register / Login / Me APIs

**Input**: Design documents from `/specs/045-backend-dob-apis/`  
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

**Constitution Check**: All tasks adhere to `.specify/memory/constitution.md` principles:
- Principle I (Code Quality): `dotnet format` + Roslyn analysers; ≥80% coverage for DOB business logic
- Principle II (TDD): Tests written FIRST per story — Red-Green-Refactor enforced throughout
- Principle III (UX): N/A — backend-only; error message format consistency enforced via QA-011
- Principle IV (Performance): No new DB queries; nullable column migration; SLA unchanged

**Tests**: Test tasks are MANDATORY per Constitution Principle II and are written FIRST in each phase.

**Organization**: Tasks grouped by user story — each story is independently implementable and testable.

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no conflicting dependencies)
- **[Story]**: User story this task belongs to — US1, US2, US3
- All paths relative to `AI-SDLC-Patient-Backend/` (backend root)

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure that ALL three user stories depend on. No story work can begin until this phase is complete.

**⚠️ CRITICAL**: US1, US2, and US3 all block on this phase completing.

### Tests First (TDD — write before implementation, must fail initially)

- [x] T001 Create mapper unit test file `tests/PatientPortal.Application.Tests/DateOfBirthMapperTests.cs` — cover: `FormatDob` with valid date returns `"MM-DD-YYYY"` string, `FormatDob` with `default(DateOnly)` returns `null`, `ParseDob` with valid `"MM-DD-YYYY"` string returns correct `DateOnly`, `ParseDob` with invalid string returns `null` (4 test cases — will compile-fail until T005)

### Implementation

- [x] T002 Add `public DateOnly DateOfBirth { get; set; }` to `PatientPortal.Domain/Entities/User.cs`
- [x] T003 [P] Add `builder.Property(u => u.DateOfBirth).HasColumnType("date").IsRequired(false);` inside the `modelBuilder.Entity<User>` block in `PatientPortal.Infrastructure/PatientPortalDbContext.cs`
- [x] T004 [P] Add `public string? DateOfBirth { get; set; }` to `PatientPortal.Application/Models/Auth/UserDto.cs`
- [x] T005 Create new file `PatientPortal.Application/Mappers/DateOfBirthMapper.cs` — static class with `FormatDob(DateOnly dob) → string?` (returns `null` for `default`, else `dob.ToString("MM-dd-yyyy", CultureInfo.InvariantCulture)`) and `ParseDob(string? raw) → DateOnly?` (uses `DateOnly.TryParseExact` with format `"MM-dd-yyyy"`)
- [x] T006 Generate EF Core migration: run `dotnet ef migrations add AddDateOfBirthToUsers --project PatientPortal.Infrastructure --startup-project PatientPortal.Api` from `AI-SDLC-Patient-Backend/` and verify the generated migration file adds a nullable `date` column `DateOfBirth` to the `Users` table
- [x] T007 Apply the migration: run `dotnet ef database update --project PatientPortal.Infrastructure --startup-project PatientPortal.Api` and verify `dotnet ef migrations list` shows `AddDateOfBirthToUsers` as applied

**Checkpoint**: Run `dotnet build` — must compile. Run T001 mapper tests — must pass (green). Foundation is ready; all three user story phases can now begin.

---

## Phase 2: User Story 1 — Register with Date of Birth (Priority: P1) 🎯 MVP

**Goal**: `POST /api/v1/auth/register` accepts, validates, and persists `dateOfBirth` (MM-DD-YYYY). Invalid values (missing, wrong format, future date, >200 years) return 400.

**Independent Test**: `POST /api/v1/auth/register` with `"dateOfBirth": "01-15-1990"` returns 201; same request without `dateOfBirth` returns 400 with `"dateOfBirth is required"`.

### Tests for User Story 1 (write FIRST — must fail before implementation) ⚠️

- [x] T008 [P] [US1] Create `tests/PatientPortal.Api.Tests/unit/DateOfBirthValidationTests.cs` — 7 cases: (1) missing DOB → error `"dateOfBirth is required"`, (2) ISO format `"1990-01-15"` → error `"dateOfBirth must be in MM-DD-YYYY format"`, (3) non-date string `"not-a-date"` → format error, (4) today's date → error `"dateOfBirth must be a past date"`, (5) future date → past-date error, (6) date >200 years ago → error `"dateOfBirth must be within the last 200 years"`, (7) valid past date `"01-15-1990"` → passes validation (will fail until T012)
- [x] T009 [P] [US1] Update `tests/PatientPortal.Api.Tests/contracts/RegisterContractTests.cs` — add DOB to all valid registration payloads; add 4 negative contract cases (one per validation rule); verify 400 response shape matches existing error format `{ "success": false, "error": { "code": "INVALID_INPUT", "message": "..." } }`
- [x] T010 [US1] Update `tests/PatientPortal.Api.Tests/integration/RegisterIntegrationTests.cs` — add test: register with `"dateOfBirth": "01-15-1990"` → verify registration returns 201 and the `Users` table row has `DateOfBirth = 1990-01-15`

### Implementation for User Story 1

- [x] T011 [US1] Add `public string DateOfBirth { get; set; } = string.Empty;` to `PatientPortal.Api/Models/Auth/RegistrationRequest.cs`
- [x] T012 [US1] Add 4 DOB validation rules to `PatientPortal.Api/Validators/AuthRequestValidator.cs` constructor: (1) `NotEmpty()` → `"dateOfBirth is required"`, (2) `Must(TryParseExact "MM-dd-yyyy")` → `"dateOfBirth must be in MM-DD-YYYY format"`, (3) `.DependentRules` past-date check → `"dateOfBirth must be a past date"`, (4) `.DependentRules` 200-year check using `DateTime.UtcNow.Year - parsed.Year <= 200` → `"dateOfBirth must be within the last 200 years"` (see quickstart.md Step 4 for exact code)
- [x] T013 [US1] Update `RegisterAsync` signature in `PatientPortal.Application/Interfaces/IAuthService.cs` to add `DateOnly dateOfBirth` as the fifth parameter
- [x] T014 [US1] Update `PatientPortal.Application/Services/AuthService.cs` → `RegisterAsync` method: add `DateOnly dateOfBirth` parameter; add `DateOfBirth = dateOfBirth` when constructing the `User` object
- [x] T015 [US1] Update `PatientPortal.Api/Controllers/AuthController.cs` → `Register` action: call `DateOfBirthMapper.ParseDob(request.DateOfBirth)!.Value` to get `DateOnly`; pass it as the fifth argument to `_authService.RegisterAsync`

**Checkpoint**: Run T008–T010 tests — all must pass. `POST /register` with valid DOB returns 201. `POST /register` without DOB returns 400. DOB is visible in the Users table row. User Story 1 is complete and independently deployable.

---

## Phase 3: User Story 2 — Login Response Includes Date of Birth (Priority: P2)

**Goal**: `POST /api/v1/auth/login` success response includes `dateOfBirth` formatted as MM-DD-YYYY in the `user` object. Existing accounts without DOB return `"dateOfBirth": null`.

**Independent Test**: Register a user with `"dateOfBirth": "03-22-1985"`, log in, verify `response.data.user.dateOfBirth === "03-22-1985"`.

### Tests for User Story 2 (write FIRST — must fail before implementation) ⚠️

- [x] T016 [US2] Update `tests/PatientPortal.Api.Tests/integration/AuthIntegrationTests.cs` — add 3 cases: (1) login with an account that has DOB stored → `dateOfBirth` in response equals `"MM-DD-YYYY"` formatted value, (2) DOB in login response matches the value submitted at registration, (3) login with a legacy account (no DOB) → `dateOfBirth` is `null` (not an error). Also add 2 cases for User Story 3 in same file: (4) `GET /api/v1/users/me` with valid token → `dateOfBirth` in response equals `"MM-DD-YYYY"` formatted value, (5) `GET /api/v1/users/me` with legacy account token → `dateOfBirth` is `null`

### Implementation for User Story 2

- [x] T017 [US2] Update `PatientPortal.Application/Services/AuthService.cs` → `CreateAuthResponse` private method: add `DateOfBirth = DateOfBirthMapper.FormatDob(user.DateOfBirth)` when building the `UserDto` object (this also covers the `RefreshToken` endpoint since it calls the same `CreateAuthResponse`)

**Checkpoint**: Run T016 cases (1)–(3) — all must pass. `POST /login` response includes `dateOfBirth`. User Story 2 is complete.

---

## Phase 4: User Story 3 — Profile (me) Endpoint Returns Date of Birth (Priority: P2)

**Goal**: `GET /api/v1/users/me` response includes `dateOfBirth` formatted as MM-DD-YYYY. Legacy accounts return `null`.

**Independent Test**: Authenticate and call `GET /api/v1/users/me` — verify `response.data.dateOfBirth` equals the DOB set at registration.

### Tests for User Story 3

> Tests for this story were added to `AuthIntegrationTests.cs` in T016 (cases 4–5) to avoid file conflicts. No additional test files needed.

### Implementation for User Story 3

- [x] T018 [US3] Update `PatientPortal.Api/Controllers/UserController.cs` → `GetCurrentUser` method: add `DateOfBirth = DateOfBirthMapper.FormatDob(user.DateOfBirth)` when constructing the inline `UserDto` (add `using PatientPortal.Application.Mappers;` if not already present)

**Checkpoint**: Run T016 cases (4)–(5) — all must pass. `GET /users/me` includes `dateOfBirth`. User Story 3 is complete.

---

## Phase 5: Polish & Quality Assurance

**Purpose**: Cross-cutting quality gates confirming all three stories work end-to-end.

- [x] T019 [P] Run `dotnet build` from `AI-SDLC-Patient-Backend/` — verify zero errors and zero warnings; fix any Roslyn analyser warnings before proceeding
- [x] T020 [P] Run `dotnet format --verify-no-changes` from `AI-SDLC-Patient-Backend/` — verify linting is clean; run `dotnet format` to auto-fix if needed
- [x] T021 Run full test suite: `dotnet test AI-SDLC-Patient-Backend/` — all existing and new tests must pass; no regressions in `AuthIntegrationTests`, `RegisterIntegrationTests`, `RegisterContractTests`, or `ValidationContractTests`
- [ ] T022 Verify code coverage ≥80% for DOB business logic: check `DateOfBirthMapper` and the new DOB rules in `AuthRequestValidator` are covered by T001 and T008 test cases; add cases if below threshold
- [ ] T023 Manual verification of all three API endpoints per quickstart.md Verification Checklist — confirm: DOB exactly 200 years ago accepted, DOB 200 years + 1 day rejected, legacy account returns `null` on both login and me responses

**Checkpoint**: All gates pass — feature is ready for code review per Constitution Phase 3 (Pre-Merge Review).

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Foundational)
    ├── BLOCKS Phase 2 (US1)
    ├── BLOCKS Phase 3 (US2)
    └── BLOCKS Phase 4 (US3)

Phase 2 (US1) must complete before Phase 3 (US2)
    └── Reason: Login response depends on DOB being stored at registration time (same file: AuthService.cs)

Phase 3 (US2) test T016 covers US3 assertions — so T016 must complete before T018 can be verified.

Phase 5 (Polish) — depends on Phase 2 + 3 + 4 complete.
```

### Within Phase 1 (Foundational)

```
T001 (mapper tests — write first, compile-fail until T005)
    ↓
T002 (User.cs entity — needed by T005, T006)
    ↓
T003 (DbContext config) [P with T004]     T004 (UserDto) [P with T003]
    ↓
T005 (DateOfBirthMapper — makes T001 pass)
    ↓
T006 (generate migration — needs T002, T003)
    ↓
T007 (apply migration)
```

### Within Phase 2 (US1)

```
T008 [P] (validation unit tests — write first, fail until T012)
T009 [P] (contract tests — write first)
T010    (integration tests — write first)
    ↓
T011 (RegistrationRequest DTO)  [independent of T008-T010, can write alongside]
    ↓
T012 (Validator — makes T008 pass)
    ↓
T013 (IAuthService interface)
    ↓
T014 (AuthService.RegisterAsync — needs T013)
    ↓
T015 (AuthController — needs T011, T014)
```

### Within Phase 3 + 4 (US2, US3)

```
T016 (AuthIntegrationTests — write first, covers US2 + US3)
    ↓
T017 (AuthService.CreateAuthResponse — makes T016 US2 cases pass)
T018 (UserController.GetCurrentUser — makes T016 US3 cases pass) [P with T017 — different files]
```

### Parallel Opportunities

- **Phase 1**: T003 and T004 can run in parallel (different files: `PatientPortalDbContext.cs` vs `UserDto.cs`)
- **Phase 2 tests**: T008 and T009 can run in parallel (different files: new unit test vs existing contract test)
- **Phase 3+4 implementations**: T017 and T018 can run in parallel (different files: `AuthService.cs` vs `UserController.cs`)
- **Phase 5**: T019 and T020 can run in parallel (independent lint and build checks)

---

## Parallel Execution Examples

### Phase 1 — Parallel tasks

```
Simultaneously:
  Task T003: Add DateOfBirth config to PatientPortalDbContext.cs
  Task T004: Add DateOfBirth property to UserDto.cs
```

### Phase 2 (US1) — Parallel test tasks

```
Simultaneously:
  Task T008: Create DateOfBirthValidationTests.cs (unit tests)
  Task T009: Update RegisterContractTests.cs (contract tests)
Then sequentially:
  Task T010: Update RegisterIntegrationTests.cs
```

### Phase 3+4 — Parallel implementations

```
Simultaneously (after T016 is written):
  Task T017: Update AuthService.CreateAuthResponse (login response)
  Task T018: Update UserController.GetCurrentUser (me response)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Foundational) — **CRITICAL blocker**
2. Complete Phase 2 (US1 — Registration with DOB)
3. **STOP and VALIDATE**: Register a user with DOB, confirm 201 response, confirm DB row has DOB, confirm invalid DOBs return 400
4. The login and me endpoints still work (DOB appears as `null` in their responses at this stage)

### Incremental Delivery

1. Phase 1 → Foundation ready
2. Phase 2 → Register accepts DOB ✅ (MVP)
3. Phase 3 → Login response includes DOB ✅
4. Phase 4 → Me response includes DOB ✅
5. Phase 5 → All quality gates pass → Ready for PR

### Parallel Team Strategy (2 developers)

With two developers after Phase 1 + 2 are complete:
- **Developer A**: Phase 3 (T016 tests + T017 login implementation)
- **Developer B**: Phase 4 (T018 me implementation — T016 tests already written by Dev A)

---

## Notes

- All paths are relative to `AI-SDLC-Patient-Backend/`; test paths use `tests/` under `AI-SDLC-Patient-Backend/`
- `AuthService.cs` is modified in both T014 (US1 — `RegisterAsync`) and T017 (US2 — `CreateAuthResponse`); these are different methods so they can be edited sequentially without conflicts
- `AuthIntegrationTests.cs` test additions (T016) cover both US2 and US3 assertions to avoid a second file-conflict; US3's Phase 4 has no test task because T016 already covers it
- TDD: after writing each test batch, run `dotnet test` to confirm tests fail (red) before writing the implementation; re-run after implementation to confirm they pass (green)
- `DateOnly` is a .NET 6+ type — no NuGet package needed
- `DateOfBirthMapper.ParseDob` in `AuthController` is safe to call with `!.Value` after the validator has already confirmed the format is valid
- Exact code snippets for every task are in `specs/045-backend-dob-apis/quickstart.md`
