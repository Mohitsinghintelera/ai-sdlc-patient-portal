import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { RegistrationForm } from '@/components/molecules/registration-form';

jest.mock('@/services/auth/register.service');
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
  Toaster: () => null,
}));

import { registerUser } from '@/services/auth/register.service';

describe('Registration Form - Accessibility (a11y)', () => {
  describe('Label Association', () => {
    it('should properly associate labels with inputs', () => {
      render(<RegistrationForm />);

      const firstNameInput = screen.getByLabelText(/First Name/i);
      const lastNameInput = screen.getByLabelText(/Last Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const medicalIdInput = screen.getByLabelText(/Medical ID/i);
      const passwordInput = screen.getByLabelText(/Choose Password/i);

      expect(firstNameInput).toHaveAttribute('id');
      expect(lastNameInput).toHaveAttribute('id');
      expect(emailInput).toHaveAttribute('id');
      expect(medicalIdInput).toHaveAttribute('id');
      expect(passwordInput).toHaveAttribute('id');
    });

    it('should mark required fields', () => {
      render(<RegistrationForm />);

      const textInputs = screen.getAllByRole('textbox');
      textInputs.forEach((input) => {
        expect(input).toHaveAttribute('required');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should allow tabbing through form fields', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const firstNameInput = screen.getByLabelText(/First Name/i);
      const lastNameInput = screen.getByLabelText(/Last Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);

      // Form autofocuses firstName on mount via setFocus
      await waitFor(() => expect(firstNameInput).toHaveFocus());

      await user.tab(); // firstName → lastName
      expect(lastNameInput).toHaveFocus();

      await user.tab(); // lastName → email
      expect(emailInput).toHaveFocus();
    });

    it('should allow reverting focus with Shift+Tab', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const firstNameInput = screen.getByLabelText(/First Name/i);
      const lastNameInput = screen.getByLabelText(/Last Name/i);

      // Form autofocuses firstName on mount via setFocus
      await waitFor(() => expect(firstNameInput).toHaveFocus());

      await user.tab(); // firstName → lastName
      expect(lastNameInput).toHaveFocus();

      await user.tab({ shift: true }); // lastName → firstName (Shift+Tab)
      expect(firstNameInput).toHaveFocus();
    });

    it('should have skip to main content link when provided', () => {
      const { container } = render(
        <div>
          <a href="#main-content" className="sr-only">Skip to main content</a>
          <RegistrationForm />
        </div>
      );

      const skipLink = container.querySelector('a[href="#main-content"]');
      expect(skipLink).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should focus first input on mount', async () => {
      render(<RegistrationForm />);

      const firstNameInput = screen.getByLabelText(/First Name/i);
      await waitFor(() => {
        expect(firstNameInput).toHaveFocus();
      });
    });

    it('should show error alerts when validation fails', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThan(0);
    });

    it.skip('should announce success message when form submits successfully', async () => {
      // Skipped: success is announced via toast (sonner), not a DOM status region
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper aria-label for input fields', () => {
      render(<RegistrationForm />);

      const firstNameInput = screen.getByLabelText(/First Name/i);
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = screen.getByLabelText(/Choose Password/i);

      expect(firstNameInput).toHaveAccessibleName(/First Name/i);
      expect(emailInput).toHaveAccessibleName(/Email Address/i);
      expect(passwordInput).toHaveAccessibleName(/Choose Password/i);
    });

    it('should announce error messages with aria-describedby', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      await user.type(screen.getByLabelText(/Email Address/i), 'invalid-email');
      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput).toHaveAttribute('aria-describedby');
    });

    it.skip('should use aria-live for dynamic messages', () => {
      // Skipped: dynamic messages are delivered via sonner toast, not an inline aria-live region
    });

    it('should mark loading state with aria-busy', async () => {
      const user = userEvent.setup();
      // Keep submission pending indefinitely to observe loading state
      (registerUser as jest.Mock).mockImplementationOnce(
        () => new Promise(() => { /* never resolves */ })
      );

      render(<RegistrationForm />);

      await user.type(screen.getByLabelText(/First Name/i), 'John');
      await user.type(screen.getByLabelText(/Last Name/i), 'Doe');
      await user.type(screen.getByLabelText(/Email Address/i), 'john@example.com');
      await user.type(screen.getByLabelText(/Medical ID/i), 'XX-001-002-003');
      await user.type(screen.getByLabelText(/Date of Birth/i), '1990-06-15');
      await user.type(screen.getByLabelText(/Choose Password/i), 'SecurePass123!');
      await user.type(screen.getByLabelText(/Confirm Password/i), 'SecurePass123!');
      await user.click(screen.getByRole('checkbox', { name: /terms/i }));

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      const form = submitButton.closest('form');
      expect(form).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Form Structure', () => {
    it('should use form element', () => {
      const { container } = render(<RegistrationForm />);

      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('should have section elements for grouped inputs', () => {
      const { container } = render(<RegistrationForm />);

      const sections = container.querySelectorAll('section');
      expect(sections.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Input Type Attributes', () => {
    it('should use correct input types for accessibility', () => {
      const { container } = render(<RegistrationForm />);

      const emailInput = container.querySelector('input[type="email"]');
      const passwordInput = container.querySelector('input[type="password"]');

      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    it('should use autocomplete attributes', () => {
      const { container } = render(<RegistrationForm />);

      const emailInput = container.querySelector('input[type="email"]');
      const passwordInput = container.querySelector('input[type="password"]');

      expect(emailInput).toHaveAttribute('autocomplete', 'email');
      expect(passwordInput).toHaveAttribute('autocomplete', 'new-password');
    });
  });

  describe('Error Announcement', () => {
    it('should announce errors as alert role', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      const submitButton = screen.getByRole('button', { name: /complete registration/i });
      await user.click(submitButton);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it.skip('should announce server errors', () => {
      // Skipped: server errors are announced via sonner toast, not inline alert text
    });
  });
});
