/**
 * Authentication-related type definitions
 * Covers registration input, API responses, and form states
 */

// ── Backend envelope types ───────────────────────────────────────────────────

export interface ApiErrorDetail {
  field: string;
  reason: string;
}

export interface ApiEnvelopeError {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: ApiEnvelopeError | null;
  meta: {
    timestamp: string;
    version: string;
  };
}

// ── Registration types ───────────────────────────────────────────────────────

/**
 * User input from registration form (client-side)
 * Validated by Zod schema before submission
 */
export interface RegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  medicalId: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
  dateOfBirth: string;
}

/**
 * Successful registration response from server (HTTP 201 Created)
 */
export interface RegistrationSuccess {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  message: string;
}

/**
 * Error response from server (HTTP 400, 409, 500, etc.)
 * Includes user-friendly message and machine-readable error code
 */
export interface RegistrationError {
  error: string;
  errorCode: string;
  field?: string;
}

/**
 * Form submission state tracking
 * Used to manage UI feedback during registration flow
 */
export type FormState = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Type guard to check if response is a success
 */
export function isRegistrationSuccess(
  response: RegistrationSuccess | RegistrationError
): response is RegistrationSuccess {
  return 'userId' in response && !('errorCode' in response);
}

/**
 * Type guard to check if response is an error
 */
export function isRegistrationError(
  response: RegistrationSuccess | RegistrationError
): response is RegistrationError {
  return 'errorCode' in response;
}

// ── Login types ──────────────────────────────────────────────────────────────

export interface LoginUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

export interface LoginSuccess {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: LoginUser;
}

export type LoginError = RegistrationError;

export function isLoginSuccess(r: LoginSuccess | LoginError): r is LoginSuccess {
  return 'accessToken' in r && !('errorCode' in r);
}

export function isLoginError(r: LoginSuccess | LoginError): r is LoginError {
  return 'errorCode' in r;
}

// ── User Detail types ────────────────────────────────────────────────────────

export interface UserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

export type UserDetailSuccess = UserDetail;

export interface UserDetailError {
  errorCode: string;
  error: string;
}

export function isUserDetailSuccess(
  r: UserDetailSuccess | UserDetailError
): r is UserDetailSuccess {
  return 'id' in r && !('errorCode' in r);
}

export function isUserDetailError(
  r: UserDetailSuccess | UserDetailError
): r is UserDetailError {
  return 'errorCode' in r;
}
