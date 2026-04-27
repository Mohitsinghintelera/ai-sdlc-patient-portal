# Implementation Plan: Date of Birth Field — User Registration Form

**Branch**: `047-dob-field-registration` | **Date**: 2026-04-27 | **Spec**: [spec.md](./spec.md)
**Jira**: SCRUM-47
**Input**: Feature specification from `/specs/047-dob-field-registration/spec.md`
**Status**: Phase 1 (Design) → Phase 2 (Implementation)

---

## Summary

Add a Date of Birth input field to the existing user registration form (frontend only). The field uses a native HTML date picker, enforces `MM-DD-YYYY` display format, disables future dates and dates older than 200 years, and is validated via Zod. No backend or API changes are required.

---

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 14.2+
**Primary Dependencies**: React Hook Form (existing), Zod (existing), Tailwind CSS (existing)
**Storage**: Client-side form state only — no backend persistence for DOB in this phase
**Testing**: Jest + React Testing Library (unit), Playwright (E2E), coverage ≥80%
**Target Platform**: Web (desktop + mobile responsive)
**Performance Goals**: No additional bundle impact (native HTML input only), form interaction ≤100ms
**Constraints**: No third-party date picker libraries; use native `<input type="date">`
**Scale/Scope**: 3 files changed, ~30 LOC added

---

## Constitution Check

*GATE: Must pass before implementation begins.*

- [x] **Code Quality (Principle I)**: ESLint + TypeScript strict mode already enforced in project
- [x] **Test-Driven (Principle II)**: Tests written before implementation — unit tests for schema + component
- [x] **UX Consistency (Principle III)**: Field styled with Clinical Curator design tokens; WCAG 2.1 AA
- [x] **Performance (Principle IV)**: Native HTML input — zero additional bundle impact

**Gate Status**: ☑️ **PASS**

---

## Project Structure

### Documentation (this feature)

```text
specs/047-dob-field-registration/
├── spec.md       # Feature specification (SCRUM-47)
├── plan.md       # This file
└── tasks.md      # Implementation tasks (generated next)
```

### Source Code Changes (Frontend Only)

```text
website/
├── src/
│   ├── schemas/
│   │   └── registration.schema.ts        # ADD: dateOfBirth Zod field
│   ├── types/
│   │   └── auth.types.ts                 # ADD: dateOfBirth to RegistrationInput
│   └── components/
│       └── molecules/
│           └── registration-form.tsx     # ADD: DOB field in Section 01
└── tests/
    ├── unit/
    │   ├── schemas/
    │   │   └── registration.schema.test.ts  # ADD: DOB validation tests
    │   └── components/
    │       └── registration-form.test.tsx   # ADD: DOB field rendering tests
    └── e2e/
        └── registration-happy-path.spec.ts  # ADD: DOB field E2E test
```

---

## Phase 1: Design

### 1.1 Zod Schema Change

**File**: `website/src/schemas/registration.schema.ts`

Add `dateOfBirth` field to `registrationSchema`:

```typescript
dateOfBirth: z
  .string()
  .min(1, 'Date of birth is required')
  .refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Please enter a valid date of birth')
  .refine((val) => {
    const date = new Date(val);
    return date <= new Date();
  }, 'Date of birth cannot be in the future')
  .refine((val) => {
    const date = new Date(val);
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 200);
    return date >= minDate;
  }, 'Please enter a valid date of birth'),
```

### 1.2 Type Change

**File**: `website/src/types/auth.types.ts`

Add to `RegistrationInput` interface:
```typescript
dateOfBirth: string;
```

### 1.3 Form Component Change

**File**: `website/src/components/molecules/registration-form.tsx`

- Add `dateOfBirth: ''` to `useForm` defaultValues
- Add DOB field in Section 01 (Personal Information), after Email Address field
- Use native `<input type="date">` with:
  - `max` = today's date in `YYYY-MM-DD` format (disables future dates)
  - `min` = 200 years ago in `YYYY-MM-DD` format (disables old dates)
- Wire up `register('dateOfBirth')` and `errors.dateOfBirth`
- Style with Clinical Curator tokens (matching existing inputs)

---

## Phase 2: Implementation Order

1. **Write tests first** (TDD — Principle II)
   - Schema validation tests for `dateOfBirth`
   - Component rendering test for DOB field presence
   - Component validation error tests

2. **Update Zod schema** — add `dateOfBirth` field

3. **Update TypeScript types** — add `dateOfBirth` to `RegistrationInput`

4. **Update form component** — add DOB field in Section 01

5. **Verify**
   - `npm test` — all tests pass
   - `npm run lint` — zero errors
   - `npm run typecheck` — zero errors

---

## Dependencies & Blocking Issues

- No external dependencies
- No backend coordination needed
- No design handoff needed (follows existing Clinical Curator tokens)

---

## Notes

- `dateOfBirth` is captured on the frontend only — not sent to backend in this phase
- Native `<input type="date">` stores value as `YYYY-MM-DD` internally; display format `MM-DD-YYYY` is handled by the browser
- No third-party calendar libraries to avoid bundle size increase
