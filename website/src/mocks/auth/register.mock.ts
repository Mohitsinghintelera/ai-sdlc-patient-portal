import { RegistrationSuccess, RegistrationError } from '@/types/auth.types';

export const mockResponses = {
  success: {
    response: {
      userId: 'usr_e7f4c2d9b1a5',
      email: 'jane.doe@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      message: 'Account created successfully',
    } as RegistrationSuccess,
    status: 201,
  },

  validationError: {
    response: {
      error: 'Invalid email address',
      errorCode: 'INVALID_INPUT',
      field: 'email',
    } as RegistrationError,
    status: 400,
  },

  emailExists: {
    response: {
      error: 'Email already registered. Try login or use another email.',
      errorCode: 'EMAIL_EXISTS',
      field: 'email',
    } as RegistrationError,
    status: 409,
  },

  serverError: {
    response: {
      error: 'Unable to create account. Please try again later.',
      errorCode: 'SERVER_ERROR',
    } as RegistrationError,
    status: 500,
  },

  networkError: {
    response: {
      error: 'Unable to create account. Please check your internet connection and try again.',
      errorCode: 'NETWORK_ERROR',
    } as RegistrationError,
    status: 0,
  },
};

export const validRegistrationInput = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  medicalId: 'XX-001-002-003',
  password: 'SecurePass123!',
  confirmPassword: 'SecurePass123!',
  terms: true,
  dateOfBirth: '1990-06-15',
};

export const invalidRegistrationInputs = {
  shortFirstName: {
    firstName: '',
    lastName: 'Doe',
    email: 'jane@example.com',
    medicalId: 'XX-001-002-003',
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!',
    terms: true,
  },
  invalidEmail: {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'invalid-email',
    medicalId: 'XX-001-002-003',
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!',
    terms: true,
  },
  weakPassword: {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    medicalId: 'XX-001-002-003',
    password: 'password',
    confirmPassword: 'password',
    terms: true,
  },
};
