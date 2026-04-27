# Feature Specification: Date of Birth Field — User Registration Form

**Context**: SCRUM-47 — Date of birth field is missing in user registration form
**Feature Branch**: `047-dob-field-registration`
**Created**: 2026-04-27
**Status**: In Progress
**Scope**: Frontend only (website)

---

## 1. Feature Overview

### Summary

Add a Date of Birth input field to the existing user registration form. The field must display a calendar picker when clicked, enforce `MM-DD-YYYY` format, prevent selection of future dates, and reject ages exceeding 200 years. This is a frontend-only change — no backend or API modifications are required.

### Success Criteria

- ✅ Date of Birth field renders in Section 01 (Personal Information) of the registration form
- ✅ Calendar picker opens when the field is clicked
- ✅ Date is displayed in `MM-DD-YYYY` format
- ✅ Future dates are disabled and cannot be selected
- ✅ Dates older than 200 years are disabled and cannot be selected
- ✅ Field is required — form cannot be submitted without it
- ✅ Validation errors are shown inline with accessible error messages
- ✅ Field is styled consistently with the Clinical Curator design system (Principle III: UX Consistency)
- ✅ WCAG 2.1 AA accessibility compliance (Principle III: UX Consistency)
- ✅ Code coverage ≥80% for business logic (Principle I: Code Quality)
- ✅ TDD approach — tests written before implementation (Principle II: TDD)

---

## 2. User Story

**As a** new patient registering on the portal,
**I want to** enter my Date of Birth in the registration form,
**So that** the system can capture my age for healthcare purposes.

### Acceptance Criteria

1. **Field Presence**: A `Date of Birth` field is visible in Section 01 (Personal Information), below the Email Address field
2. **Calendar Picker**: Clicking the field opens a native date picker / calendar
3. **Date Format**: The displayed format is `MM-DD-YYYY`
4. **Future Dates Disabled**: User cannot select today's date or any future date
5. **200-Year Limit**: User cannot select a date older than 200 years from today
6. **Required Field**: Field is marked as required with a `*` indicator
7. **Empty Validation**: If submitted empty → error: `"Date of birth is required"`
8. **Future Date Validation**: If a future date is entered → error: `"Date of birth cannot be in the future"`
9. **200-Year Validation**: If date exceeds 200 years → error: `"Please enter a valid date of birth"`
10. **Accessibility**: Field has a proper `<label>`, `aria-required`, `aria-invalid`, and `aria-describedby` for error messages
11. **Design Consistency**: Field uses `surface_container_low` background, bottom-border in `primary`, matching all other form inputs

---

## 3. Design Reference

### Stitch Project
- **Website Design**: https://stitch.withgoogle.com/projects/2100673560530097365 (Screen: User Registration)

### Design System (Clinical Curator)
- **Input Styling**: `surface_container_low` background (`#e9f6fd`), bottom-only border in `primary` (`#003DA6`)
- **Focus State**: `surface_container_lowest` background, 2px bottom border
- **Font**: Inter (body), Manrope (labels)
- **Roundness**: `ROUND_FOUR` (4px)
- **Error Color**: `#ba1a1a`

---

## 4. Technical Context

### Stack
- **Framework**: Next.js 14.2+ (TypeScript 5.x)
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **Styling**: Tailwind CSS + Clinical Curator design tokens
- **Testing**: Jest + React Testing Library (unit), Playwright (E2E)

### Affected Files (Frontend Only)

| File | Change |
|---|---|
| `website/src/schemas/registration.schema.ts` | Add `dateOfBirth` Zod field with validation rules |
| `website/src/types/auth.types.ts` | Add `dateOfBirth: string` to `RegistrationInput` interface |
| `website/src/components/molecules/registration-form.tsx` | Add DOB date picker field in Section 01 |

### Out of Scope

- No backend changes
- No API payload changes (`register.service.ts` unchanged)
- No database schema changes
- No Stitch design updates

---

## 5. Non-Functional Requirements

### Code Quality (Principle I)
- ESLint must pass with zero errors on changed files
- Cyclomatic complexity ≤ 5 per function
- No code duplication >3 LOC

### Test-Driven Development (Principle II — NON-NEGOTIABLE)
- Tests MUST be written before implementation (Red-Green-Refactor)
- Unit tests for Zod schema validation rules
- Unit tests for form component rendering and error states
- E2E test for DOB field interaction (calendar, validation)

### UX Consistency (Principle III)
- Field must match existing form input styling exactly
- Error messages follow existing pattern: icon + text
- WCAG 2.1 AA: label association, aria-invalid, aria-describedby

### Performance (Principle IV)
- No additional bundle size impact beyond native HTML date input
- Form interaction response ≤100ms

---

## 6. Constraints & Assumptions

### Constraints
- Must use native HTML `<input type="date">` or a lightweight date picker — no heavy third-party libraries
- Must not break existing registration form tests

### Assumptions
- Backend does not yet accept `dateOfBirth` — field is captured on frontend only for now
- Date format `MM-DD-YYYY` is for display; internally stored as ISO string (`YYYY-MM-DD`)

---

## 7. References

### Jira Ticket
- **ID**: SCRUM-47
- **Type**: Bug
- **Priority**: Medium
- **Reporter**: Kaushik Parmar
- **Link**: https://intelera-team-gbifcm47.atlassian.net/browse/SCRUM-47

### Related Documents
- [Constitution](../../.specify/memory/constitution.md)
- [User Registration Screen Spec](../002-user-registration-screen/spec.md)
- [Registration API Contract](../002-user-registration-screen/contracts/registration-api.md)
