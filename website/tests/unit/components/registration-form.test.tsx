import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { RegistrationForm } from '@/components/molecules/registration-form';
import { validRegistrationInput } from '@/mocks/auth/register.mock';
import { registerUser } from '@/services/auth/register.service';

jest.mock('@/services/auth/register.service');
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
  Toaster: () => null,
}));

import { toast } from 'sonner';
const mockToastSuccess = toast.success as jest.MockedFunction<typeof toast.success>;
const mockToastError = toast.error as jest.MockedFunction<typeof toast.error>;

/** Helper to fill out the full valid form */
async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/First Name/i), validRegistrationInput.firstName);
  await user.type(screen.getByLabelText(/Last Name/i), validRegistrationInput.lastName);
  await user.type(screen.getByLabelText(/Email Address/i), validRegistrationInput.email);
  await user.type(screen.getByLabelText(/Medical ID/i), validRegistrationInput.medicalId);
  await user.type(screen.getByLabelText(/Date of Birth/i), validRegistrationInput.dateOfBirth);
  await user.type(screen.getByLabelText(/Choose Password/i), validRegistrationInput.password);
  await user.type(screen.getByLabelText(/Confirm Password/i), validRegistrationInput.confirmPassword);
  await user.click(screen.getByRole('checkbox', { name: /terms/i }));
}

describe('RegistrationForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render all required form fields', () => {
      render(<RegistrationForm />);

      expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Medical ID/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Choose Password/i)).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<RegistrationForm />);

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      expect(submitButton).toBeInTheDocument();
    });

    it('should render section headers', () => {
      render(<RegistrationForm />);

      expect(screen.getByText(/Personal Information/i)).toBeInTheDocument();
      expect(screen.getByText(/Healthcare Credentials/i)).toBeInTheDocument();
      expect(screen.getByText(/Account Security/i)).toBeInTheDocument();
    });

    it('should render Date of Birth field', () => {
      render(<RegistrationForm />);
      expect(screen.getByLabelText(/Date of Birth/i)).toBeInTheDocument();
    });

    it('should render Date of Birth field as a date input', () => {
      render(<RegistrationForm />);
      const dobInput = screen.getByLabelText(/Date of Birth/i);
      expect(dobInput).toHaveAttribute('type', 'date');
    });

    it('should have max attribute set to today on Date of Birth field', () => {
      render(<RegistrationForm />);
      const dobInput = screen.getByLabelText(/Date of Birth/i);
      const today = new Date().toISOString().split('T')[0];
      expect(dobInput).toHaveAttribute('max', today);
    });
  });

  describe('Form Submission - Happy Path', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      (registerUser as jest.Mock).mockResolvedValueOnce({
        userId: 'usr_e7f4c2d9b1a5',
        email: validRegistrationInput.email,
        message: 'Registration successful',
      });

      render(<RegistrationForm />);
      await fillValidForm(user);

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(registerUser).toHaveBeenCalledWith(validRegistrationInput);
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      (registerUser as jest.Mock).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({
          userId: 'usr_e7f4c2d9b1a5',
          email: validRegistrationInput.email,
        }), 100))
      );

      render(<RegistrationForm />);
      await fillValidForm(user);

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
    });

    it('should show success toast after successful registration', async () => {
      const user = userEvent.setup();
      (registerUser as jest.Mock).mockResolvedValueOnce({
        userId: 'usr_e7f4c2d9b1a5',
        email: validRegistrationInput.email,
        message: 'Registration successful',
      });

      render(<RegistrationForm />);
      await fillValidForm(user);

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Client-Side Validation', () => {
    it('should prevent submission with empty first name', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      await user.type(screen.getByLabelText(/Email Address/i), validRegistrationInput.email);
      await user.type(screen.getByLabelText(/Choose Password/i), validRegistrationInput.password);

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(registerUser).not.toHaveBeenCalled();
      });
    });

    it('should prevent submission with invalid email', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      await user.type(screen.getByLabelText(/First Name/i), validRegistrationInput.firstName);
      await user.type(screen.getByLabelText(/Last Name/i), validRegistrationInput.lastName);
      await user.type(screen.getByLabelText(/Email Address/i), 'invalid-email');
      await user.type(screen.getByLabelText(/Medical ID/i), validRegistrationInput.medicalId);
      await user.type(screen.getByLabelText(/Choose Password/i), validRegistrationInput.password);

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(registerUser).not.toHaveBeenCalled();
      });
    });

    it('should prevent submission with weak password', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      await user.type(screen.getByLabelText(/First Name/i), validRegistrationInput.firstName);
      await user.type(screen.getByLabelText(/Last Name/i), validRegistrationInput.lastName);
      await user.type(screen.getByLabelText(/Email Address/i), validRegistrationInput.email);
      await user.type(screen.getByLabelText(/Medical ID/i), validRegistrationInput.medicalId);
      await user.type(screen.getByLabelText(/Choose Password/i), 'weak123');

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(registerUser).not.toHaveBeenCalled();
      });
    });

    it('should display validation error messages for each field', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errors = screen.getAllByText(/required|name|email|password/i);
        expect(errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Server-Side Error Handling', () => {
    it('should show error toast for SERVER_ERROR', async () => {
      const user = userEvent.setup();
      (registerUser as jest.Mock).mockResolvedValueOnce({
        errorCode: 'SERVER_ERROR',
        error: 'Unable to create account. Please try again later.',
      });

      render(<RegistrationForm />);
      await fillValidForm(user);

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled();
      });
    });

    it('should show error toast for EMAIL_EXISTS', async () => {
      const user = userEvent.setup();
      (registerUser as jest.Mock).mockResolvedValueOnce({
        errorCode: 'EMAIL_EXISTS',
        error: 'Email already registered. Try logging in instead.',
      });

      render(<RegistrationForm />);
      await fillValidForm(user);

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringMatching(/already registered/i)
        );
      });
    });

    it('should show error toast for NETWORK_ERROR', async () => {
      const user = userEvent.setup();
      (registerUser as jest.Mock).mockResolvedValueOnce({
        errorCode: 'NETWORK_ERROR',
        error: 'Check your internet connection and try again.',
      });

      render(<RegistrationForm />);
      await fillValidForm(user);

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringMatching(/network error|connection/i)
        );
      });
    });
  });

  describe('Form Behavior', () => {
    it('should reset form after successful submission', async () => {
      const user = userEvent.setup();
      (registerUser as jest.Mock).mockResolvedValueOnce({
        userId: 'usr_e7f4c2d9b1a5',
        email: validRegistrationInput.email,
      });

      const { container } = render(<RegistrationForm />);
      await fillValidForm(user);

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        const textInputs = container.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
        textInputs.forEach((input) => {
          expect((input as HTMLInputElement).value).toBe('');
        });
      });
    });

    it('should not reset form fields if submission fails', async () => {
      const user = userEvent.setup();
      (registerUser as jest.Mock).mockResolvedValueOnce({
        errorCode: 'EMAIL_EXISTS',
        error: 'Email already registered',
      });

      const { container } = render(<RegistrationForm />);
      await fillValidForm(user);

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        const emailInput = container.querySelector('input[type="email"]') as HTMLInputElement;
        expect(emailInput.value).toBe(validRegistrationInput.email);
      });
    });
  });

  describe('Integration with Service', () => {
    it('should call registerUser with form data', async () => {
      const user = userEvent.setup();
      (registerUser as jest.Mock).mockResolvedValueOnce({
        userId: 'usr_e7f4c2d9b1a5',
      });

      render(<RegistrationForm />);
      await fillValidForm(user);

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(registerUser).toHaveBeenCalledWith(validRegistrationInput);
      });
    });
  });
});
