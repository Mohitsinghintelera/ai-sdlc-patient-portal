import { axiosClient } from '@/services/api/axios-client';
import type { RegistrationInput, RegistrationSuccess, RegistrationError } from '@/types/auth.types';

/**
 * Configuration for retry logic
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  delays: [0, 2000, 5000], // Exponential backoff: immediate, 2s, 5s
};

/**
 * Error codes that should trigger a retry (server-side transient errors)
 */
const RETRYABLE_ERROR_CODES = new Set(['SERVER_ERROR', 'NETWORK_ERROR']);

/**
 * Call the registration API endpoint with error handling and exponential backoff retry.
 *
 * Maps form fields to backend payload:
 *   { firstName, lastName } → fullName: "First Last"
 *   email, password, confirmPassword → passed through
 *   medicalId, terms → client-only, not sent to backend
 *
 * Uses axiosClient (axios instance with interceptors) which:
 *   - Injects X-Request-ID header
 *   - Unwraps { success, data, error, meta } envelope
 *   - Normalizes errors to RegistrationError
 *
 * @param input - Registration form data
 * @returns Either RegistrationSuccess or RegistrationError (never throws)
 */
export async function registerUser(
  input: RegistrationInput
): Promise<RegistrationSuccess | RegistrationError> {
  const { maxAttempts, delays } = RETRY_CONFIG;

  // Map form fields to backend payload
  const payload = {
    fullName: `${input.firstName} ${input.lastName}`.trim(),
    email: input.email,
    password: input.password,
    confirmPassword: input.confirmPassword,
    dateOfBirth: input.dateOfBirth,
  };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const data = await axiosClient.post<RegistrationSuccess>('/api/auth/register', payload);
      return data as unknown as RegistrationSuccess;
    } catch (err) {
      const registrationError = err as RegistrationError;

      // On last attempt, return the error
      if (attempt === maxAttempts - 1) {
        if (registrationError.errorCode) {
          return registrationError;
        }
        return {
          errorCode: 'NETWORK_ERROR',
          error: 'An unexpected error occurred. Please try again.',
        };
      }

      // Retry only on transient server/network errors
      const isRetryable = RETRYABLE_ERROR_CODES.has(registrationError.errorCode ?? '');
      if (!isRetryable) {
        return registrationError;
      }

      // Apply backoff delay before retry
      const delay = delays[attempt];
      if (delay > 0) {
        console.warn(
          `Registration request attempt ${attempt + 1} failed (${registrationError.errorCode}), retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // Should never reach here
  return {
    errorCode: 'NETWORK_ERROR',
    error: 'An unexpected error occurred. Please try again.',
  };
}
