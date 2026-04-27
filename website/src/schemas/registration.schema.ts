import { z } from 'zod';

export const registrationSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(128, 'First name must not exceed 128 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Only letters, spaces, hyphens, and apostrophes allowed'),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(128, 'Last name must not exceed 128 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Only letters, spaces, hyphens, and apostrophes allowed'),

  email: z
    .string()
    .email('Invalid email address')
    .max(254, 'Email must not exceed 254 characters'),

  medicalId: z
    .string()
    .min(1, 'Medical ID is required'),

  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^a-zA-Z0-9]/, 'Must contain a special character'),

  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),

  terms: z
    .boolean()
    .refine(val => val === true, 'You must agree to the Terms of Service'),

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
}).superRefine((data, ctx) => {
  if (data.confirmPassword && data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    });
  }
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const validateRegistration = (data: unknown) => {
  return registrationSchema.safeParse(data);
};
