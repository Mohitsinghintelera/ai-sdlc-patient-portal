# Tasks: Date of Birth Field — User Registration Form

**Input**: Design documents from `/specs/047-dob-field-registration/`
**Branch**: `047-dob-field-registration` | **Jira**: SCRUM-47
**Prerequisites**: plan.md ✓ spec.md ✓

**Constitution Check**: All tasks MUST adhere to `.specify/memory/constitution.md` principles:
- Principle I (Code Quality): Linting, complexity ≤5, coverage ≥80% for business logic
- Principle II (TDD): Tests written FIRST and failing before implementation (Red-Green-Refactor)
- Principle III (UX): Clinical Curator design system consistency, WCAG 2.1 AA
- Principle IV (Performance): No additional bundle impact, form interaction ≤100ms

**Scope**: Frontend only — no backend, no API, no Jira, no GitHub changes.

---

## Phase 1: Tests First (TDD — NON-NEGOTIABLE)

**Purpose**: Write all tests BEFORE touching implementation files. Tests must fail first (Red).

- [x] 1.1 Add `dateOfBirth` validation tests to `website/tests/unit/schemas/registration.schema.test.ts`:
  - Test: Rejects empty dateOfBirth → error "Date of birth is required"
  - Test: Rejects future date → error "Date of birth cannot be in the future"
  - Test: Rejects date older than 200 years → error "Please enter a valid date of birth"
  - Test: Accepts valid past date (e.g. 1990-06-15)

- [x] 1.2 Add `dateOfBirth` field tests to `website/tests/unit/components/registration-form.test.tsx`:
  - Test: DOB field renders in the form
  - Test: DOB field is required (shows error when empty on submit)
  - Test: DOB field shows error for future date

---

## Phase 2: Schema Update

**Purpose**: Add `dateOfBirth` Zod validation to the registration schema (Green — make tests pass).

- [x] 2.1 Update `website/src/schemas/registration.schema.ts`:
  - Add `dateOfBirth` field with:
    - Required: `"Date of birth is required"`
    - Valid date check
    - No future dates: `"Date of birth cannot be in the future"`
    - Max 200 years: `"Please enter a valid date of birth"`
  - Add `dateOfBirth: ''` to default values type inference

---

## Phase 3: Type Update

**Purpose**: Add `dateOfBirth` to the TypeScript interface.

- [x] 3.1 Update `website/src/types/auth.types.ts`:
  - Add `dateOfBirth: string` to `RegistrationInput` interface

---

## Phase 4: Form Component Update

**Purpose**: Add the DOB field to the registration form UI.

- [x] 4.1 Update `website/src/components/molecules/registration-form.tsx`:
  - Add `dateOfBirth: ''` to `useForm` defaultValues
  - Add DOB field in Section 01 (Personal Information), after Email Address field
  - Use native `<input type="date">` with:
    - `max` = today's date (`YYYY-MM-DD` format)
    - `min` = 200 years ago (`YYYY-MM-DD` format)
  - Wire up `register('dateOfBirth')` and `errors.dateOfBirth?.message`
  - Style with Clinical Curator tokens (matching existing inputs):
    - `surface_container_low` background
    - Bottom-only border in `primary`
    - Focus: `surface_container_lowest` + 2px border
  - Label: "Date of Birth" with required `*` indicator
  - Accessible: `aria-required`, `aria-invalid`, `aria-describedby` for error

---

## Phase 5: Verification

**Purpose**: Ensure all quality gates pass per constitution.

- [x] 5.1 Run `npm test` from `website/` — all tests pass
- [x] 5.2 Run `npm run lint` from `website/` — zero errors
- [x] 5.3 Run `npm run typecheck` from `website/` — zero type errors

---

## Task Summary

| Phase | Tasks | Purpose |
|---|---|---|
| 1: Tests First | 1.1, 1.2 | TDD — write failing tests |
| 2: Schema | 2.1 | Add Zod validation |
| 3: Types | 3.1 | Add TypeScript type |
| 4: Component | 4.1 | Add DOB field to form |
| 5: Verify | 5.1–5.3 | Quality gates |

**Total**: 7 tasks | **Estimated**: 2–3 hours
