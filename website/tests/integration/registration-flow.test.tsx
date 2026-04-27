import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { RegistrationForm } from '@/components/molecules/registration-form';
import { validRegistrationInput, mockResponses } from '@/mocks/auth/register.mock';
import { registerUser } from '@/services/auth/register.service';

jest.mock('@/services/auth/register.service');
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
  Toaster: () => null,
}));

import { toast } from 'sonner';
const mockRegisterUser = registerUser as jest.MockedFunction<typeof registerUser>;
const mockToastSuccess = toast.success as jest.MockedFunction<typeof toast.success>;
const mockToastError = toast.error as jest.MockedFunction<typeof toast.error>;

/**
 * Integration tests for the complete registration flow
 */
describe('Registration Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  describe('Happy Path - Successful Registration', () => {
    it('should complete full registration flow and show success toast', async () => {
      const user = userEvent.setup();
      mockRegisterUser.mockResolvedValueOnce(mockResponses.success.response);

      render(<RegistrationForm />);
      await fillValidForm(user);

      const firstNameInput = screen.getByLabelText(/First Name/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;

      expect(firstNameInput.value).toBe(validRegistrationInput.firstName);
      expect(emailInput.value).toBe(validRegistrationInput.email);

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegisterUser).toHaveBeenCalledWith(validRegistrationInput);
      });

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalled();
      });
    });

    it('should clear form after successful registration', async () => {
      const user = userEvent.setup();
      mockRegisterUser.mockResolvedValueOnce(mockResponses.success.response);

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
  });

  describe('Client-Side Validation - Error Prevention', () => {
    it('should prevent submission if first name is empty', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      // Skip first name, fill rest
      await user.type(screen.getByLabelText(/Last Name/i), validRegistrationInput.lastName);
      await user.type(screen.getByLabelText(/Email Address/i), validRegistrationInput.email);
      await user.type(screen.getByLabelText(/Medical ID/i), validRegistrationInput.medicalId);
      await user.type(screen.getByLabelText(/Date of Birth/i), validRegistrationInput.dateOfBirth);
      await user.type(screen.getByLabelText(/Choose Password/i), validRegistrationInput.password);
      await user.type(screen.getByLabelText(/Confirm Password/i), validRegistrationInput.confirmPassword);
      await user.click(screen.getByRole('checkbox', { name: /terms/i }));

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegisterUser).not.toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    it('should prevent submission if email is invalid', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      await user.type(screen.getByLabelText(/First Name/i), validRegistrationInput.firstName);
      await user.type(screen.getByLabelText(/Last Name/i), validRegistrationInput.lastName);
      await user.type(screen.getByLabelText(/Email Address/i), 'not-an-email');
      await user.type(screen.getByLabelText(/Medical ID/i), validRegistrationInput.medicalId);
      await user.type(screen.getByLabelText(/Choose Password/i), validRegistrationInput.password);
      await user.type(screen.getByLabelText(/Confirm Password/i), validRegistrationInput.confirmPassword);

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegisterUser).not.toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });
    });

    it('should prevent submission if password is weak', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      await user.type(screen.getByLabelText(/First Name/i), validRegistrationInput.firstName);
      await user.type(screen.getByLabelText(/Last Name/i), validRegistrationInput.lastName);
      await user.type(screen.getByLabelText(/Email Address/i), validRegistrationInput.email);
      await user.type(screen.getByLabelText(/Medical ID/i), validRegistrationInput.medicalId);
      await user.type(screen.getByLabelText(/Choose Password/i), 'Nospecial123');

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegisterUser).not.toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText(/special character/i)).toBeInTheDocument();
      });
    });
  });

  describe('Server-Side Error Handling', () => {
    it('should handle EMAIL_EXISTS error gracefully', async () => {
      const user = userEvent.setup();
      mockRegisterUser.mockResolvedValueOnce(mockResponses.emailExists.response);

      render(<RegistrationForm />);
      await fillValidForm(user);

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
      expect(emailInput.value).toBe(validRegistrationInput.email);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          expect.stringMatching(/already registered/i)
        );
      });
    });

    it('should handle SERVER_ERROR with user-friendly toast', async () => {
      const user = userEvent.setup();
      mockRegisterUser.mockResolvedValueOnce(mockResponses.serverError.response);

      render(<RegistrationForm />);
      await fillValidForm(user);

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled();
      });
    });

    it('should handle NETWORK_ERROR with user-friendly toast', async () => {
      const user = userEvent.setup();
      mockRegisterUser.mockResolvedValueOnce(mockResponses.networkError.response);

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

  describe('Form State During Submission', () => {
    it('should disable submit button while request is pending', async () => {
      const user = userEvent.setup();
      mockRegisterUser.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve(mockResponses.success.response), 100))
      );

      render(<RegistrationForm />);
      await fillValidForm(user);

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Multiple Submission Attempts', () => {
    it('should handle resubmission after error', async () => {
      const user = userEvent.setup();
      mockRegisterUser
        .mockResolvedValueOnce(mockResponses.emailExists.response)
        .mockResolvedValueOnce(mockResponses.success.response);

      render(<RegistrationForm />);
      await fillValidForm(user);

      let submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled();
      });

      submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalled();
      });
    });
  });
});
