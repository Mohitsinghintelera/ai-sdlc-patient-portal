'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { FormInput } from '@/components/atoms/form-input';
import { registrationSchema, type RegistrationInput } from '@/schemas/registration.schema';
import { registerUser } from '@/services/auth/register.service';
import { isRegistrationSuccess, isRegistrationError } from '@/types/auth.types';

export interface RegistrationFormProps {
  onSuccess?: (userId: string, email: string) => void;
  className?: string;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSuccess,
  className = '',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
    reset,
    setFocus,
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      medicalId: '',
      password: '',
      confirmPassword: '',
      terms: false,
      dateOfBirth: '',
    },
  });

  React.useEffect(() => {
    setFocus('firstName');
  }, [setFocus]);

  const onSubmit = useCallback(
    async (data: RegistrationInput) => {
      setIsSubmitting(true);

      try {
        const response = await registerUser(data);

        if (isRegistrationSuccess(response)) {
          toast.success(response.message || 'Account created successfully!');
          reset();
          onSuccess?.(response.userId, response.email);
        } else if (isRegistrationError(response)) {
          switch (response.errorCode) {
            case 'EMAIL_EXISTS':
              toast.error('This email is already registered. Please sign in.');
              break;
            case 'NETWORK_ERROR':
              toast.error('Network error: Please check your internet connection and try again.');
              break;
            case 'SERVER_ERROR':
              toast.error('Unable to create your account. Please try again later.');
              break;
            case 'INVALID_INPUT':
              toast.error(response.error || 'Invalid input. Please check your information.');
              break;
            default:
              toast.error(response.error || 'Registration failed. Please try again.');
          }
        }
      } catch (err) {
        toast.error('An unexpected error occurred. Please try again.');
        console.error('Registration error:', err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [reset, onSuccess]
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`${className} space-y-10`}
      aria-busy={isSubmitting}
      noValidate
    >
      {/* Form-level error */}
      {/* Validation error summary — sr-only alert for screen readers */}
      {isSubmitted && Object.keys(errors).length > 0 && (
        <div role="alert" className="sr-only">
          Please fix the errors below to continue.
        </div>
      )}

      {/* Section 01: Personal Information */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-bold tracking-widest text-primary uppercase font-headline">01</span>
          <h3 className="font-headline font-bold text-lg text-on-background">Personal Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            {...register('firstName')}
            label="First Name"
            type="text"
            placeholder="Enter first name"
            error={errors.firstName?.message}
            required
            autoComplete="given-name"
          />
          <FormInput
            {...register('lastName')}
            label="Last Name"
            type="text"
            placeholder="Enter last name"
            error={errors.lastName?.message}
            required
            autoComplete="family-name"
          />
        </div>

        <FormInput
          {...register('email')}
          label="Email Address"
          type="email"
          placeholder="you@healthcare.com"
          error={errors.email?.message}
          required
          autoComplete="email"
        />

        {/* Date of Birth */}
        <FormInput
          {...register('dateOfBirth')}
          id="date-of-birth"
          label="Date of Birth"
          type="date"
          max={new Date().toISOString().split('T')[0]}
          min={(() => {
            const d = new Date();
            d.setFullYear(d.getFullYear() - 200);
            return d.toISOString().split('T')[0];
          })()}
          error={errors.dateOfBirth?.message}
          required
          aria-required="true"
          disabled={isSubmitting}
          autoComplete="bday"
        />
      </section>

      {/* Section 02: Healthcare Credentials */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-bold tracking-widest text-primary uppercase font-headline">02</span>
          <h3 className="font-headline font-bold text-lg text-on-background">Healthcare Credentials</h3>
        </div>

        <div className="p-6 bg-surface-container-low rounded-xl space-y-4">
          <FormInput
            {...register('medicalId')}
            label="Medical ID Number"
            type="text"
            placeholder="XX-000-000-000"
            error={errors.medicalId?.message}
            hint="Found on the back of your insurance card or provided by your primary clinic."
            required
            inputBaseClassName="w-full bg-surface-container-lowest border-0 border-b border-primary px-4 py-3 outline-none focus:border-b-2 focus:ring-0 transition-all duration-200 text-base text-on-surface placeholder-on-surface-variant"
            trailingIcon={
              <span className="material-symbols-outlined text-[20px]">info</span>
            }
          />
        </div>
      </section>

      {/* Section 03: Account Security */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-bold tracking-widest text-primary uppercase font-headline">03</span>
          <h3 className="font-headline font-bold text-lg text-on-background">Account Security</h3>
        </div>

        <FormInput
          {...register('password')}
          label="Choose Password"
          type="password"
          placeholder="Minimum 12 characters"
          error={errors.password?.message}
          required
          autoComplete="new-password"
        />

        <FormInput
          {...register('confirmPassword')}
          label="Confirm Password"
          type="password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          required
          autoComplete="new-password"
        />

        <div className="flex items-start gap-3 pt-2">
          <input
            {...register('terms')}
            id="terms"
            type="checkbox"
            disabled={isSubmitting}
            className="mt-1 rounded-sm border-outline-variant text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
          />
          <div>
            <label htmlFor="terms" className="text-sm text-on-surface-variant leading-relaxed cursor-pointer">
              I agree to the{' '}
              <a className="text-primary font-medium hover:underline" href="/terms">
                Terms of Service
              </a>{' '}
              and acknowledge the{' '}
              <a className="text-primary font-medium hover:underline" href="/privacy">
                Privacy Policy
              </a>{' '}
              regarding my medical data processing.
            </label>
            {errors.terms && (
              <p className="text-xs font-medium text-error mt-1">
                {errors.terms.message}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Submit */}
      <div className="pt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-4 px-8 rounded-xl font-headline font-bold text-lg text-white transition-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            isSubmitting
              ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed opacity-60'
              : 'bg-gradient-to-br from-primary to-primary-container shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.98]'
          }`}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating Account...
            </span>
          ) : (
            'Complete Registration'
          )}
        </button>
      </div>

    </form>
  );
};

RegistrationForm.displayName = 'RegistrationForm';
