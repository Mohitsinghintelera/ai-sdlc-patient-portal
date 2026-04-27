/**
 * TDD component tests for RegistrationForm — T021–T024.
 * Written FIRST (Red phase) — tests must fail before implementation.
 *
 * Tests cover:
 * T021: confirmPassword field renders + Zod mismatch error
 * T022: success toast on 201
 * T023: EMAIL_EXISTS toast on 409
 * T024: NETWORK_ERROR toast
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock the register service so we can control responses
jest.mock('@/services/auth/register.service');
// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
  Toaster: () => null,
}));

import { toast } from 'sonner';
import { registerUser } from '@/services/auth/register.service';
import { RegistrationForm } from '@/components/molecules/registration-form';

const mockRegisterUser = registerUser as jest.MockedFunction<typeof registerUser>;
const mockToastSuccess = toast.success as jest.MockedFunction<typeof toast.success>;
const mockToastError = toast.error as jest.MockedFunction<typeof toast.error>;

const validFormData = {
  firstName: 'Kaushik',
  lastName: 'Parmar',
  email: 'kaushik@healthcare.com',
  medicalId: 'MED-001',
  password: 'SecurePass123!',
  confirmPassword: 'SecurePass123!',
  dateOfBirth: '1990-06-15',
};

async function fillAndSubmitForm(overrides: Partial<typeof validFormData> = {}) {
  const data = { ...validFormData, ...overrides };
  const user = userEvent.setup();

  await user.type(screen.getByLabelText(/first name/i), data.firstName);
  await user.type(screen.getByLabelText(/last name/i), data.lastName);
  await user.type(screen.getByLabelText(/email/i), data.email);
  await user.type(screen.getByLabelText(/medical id/i), data.medicalId);
  await user.type(screen.getByLabelText(/choose password/i), data.password);
  await user.type(screen.getByLabelText(/confirm password/i), data.confirmPassword);
  // Fill DOB using fireEvent since userEvent doesn't support date inputs well
  const dobInput = screen.getByLabelText(/date of birth/i);
  await user.type(dobInput, data.dateOfBirth);
  await user.click(screen.getByRole('checkbox'));
  await user.click(screen.getByRole('button', { name: /complete registration/i }));
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ── T021: confirmPassword field ───────────────────────────────────────────────

describe('T021 — confirmPassword field renders and validates', () => {
  it('renders a Confirm Password field in Section 03', () => {
    render(<RegistrationForm />);
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('shows Zod error "Passwords do not match" when passwords differ', async () => {
    render(<RegistrationForm />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/choose password/i), 'SecurePass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPass1!');
    await user.tab(); // trigger onBlur validation

    // Submit to trigger validation
    await user.click(screen.getByRole('button', { name: /complete registration/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('does not call registerUser when confirmPassword mismatches', async () => {
    render(<RegistrationForm />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/first name/i), 'Kaushik');
    await user.type(screen.getByLabelText(/last name/i), 'Parmar');
    await user.type(screen.getByLabelText(/email/i), 'k@healthcare.com');
    await user.type(screen.getByLabelText(/medical id/i), 'MED-001');
    await user.type(screen.getByLabelText(/choose password/i), 'SecurePass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'WrongPass123!');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /complete registration/i }));

    await waitFor(() => {
      expect(mockRegisterUser).not.toHaveBeenCalled();
    });
  });
});

// ── T022: success toast ───────────────────────────────────────────────────────

describe('T022 — shows success toast and calls onSuccess on 201', () => {
  it('calls toast.success with account created message', async () => {
    mockRegisterUser.mockResolvedValueOnce({
      userId: 'abc-123',
      email: 'kaushik@healthcare.com',
      firstName: 'Kaushik',
      lastName: 'Parmar',
      message: 'Account created successfully',
    });

    const onSuccess = jest.fn();
    render(<RegistrationForm onSuccess={onSuccess} />);

    await fillAndSubmitForm();

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(
        expect.stringContaining('Account created')
      );
    });
  });

  it('calls onSuccess(userId, email) after successful registration', async () => {
    mockRegisterUser.mockResolvedValueOnce({
      userId: 'abc-123',
      email: 'kaushik@healthcare.com',
      firstName: 'Kaushik',
      lastName: 'Parmar',
      message: 'Account created successfully',
    });

    const onSuccess = jest.fn();
    render(<RegistrationForm onSuccess={onSuccess} />);

    await fillAndSubmitForm();

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('abc-123', 'kaushik@healthcare.com');
    });
  });
});

// ── T023: EMAIL_EXISTS toast ──────────────────────────────────────────────────

describe('T023 — shows error toast for EMAIL_EXISTS (409)', () => {
  it('calls toast.error with email registered message', async () => {
    mockRegisterUser.mockResolvedValueOnce({
      errorCode: 'EMAIL_EXISTS',
      error: 'An account with this email already exists',
    });

    render(<RegistrationForm />);

    await fillAndSubmitForm();

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringMatching(/already registered|email.*registered/i)
      );
    });
  });
});

// ── T024: NETWORK_ERROR toast ─────────────────────────────────────────────────

describe('T024 — shows error toast for NETWORK_ERROR', () => {
  it('calls toast.error with network error message', async () => {
    mockRegisterUser.mockResolvedValueOnce({
      errorCode: 'NETWORK_ERROR',
      error: 'Network error: Please check your internet connection and try again.',
    });

    render(<RegistrationForm />);

    await fillAndSubmitForm();

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringMatching(/network error|connection/i)
      );
    });
  });
});
