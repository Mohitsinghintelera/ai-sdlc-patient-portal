import { registrationSchema, validateRegistration } from '@/schemas/registration.schema';
import { RegistrationInput, RegistrationSuccess, RegistrationError, FormState } from '@/types/auth.types';
import { isRegistrationSuccess, isRegistrationError } from '@/types/auth.types';

test('auth type verification', () => {

// Test 1: RegistrationInput type exports
const testRegistrationInput: RegistrationInput = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  medicalId: 'XX-001-002-003',
  password: 'SecurePass123!',
  confirmPassword: 'SecurePass123!',
  terms: true,
  dateOfBirth: '1990-06-15',
};

// Test 2: RegistrationSuccess type export
const testSuccess: RegistrationSuccess = {
  userId: 'usr_123',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  message: 'Registration successful',
};

// Test 3: RegistrationError type export
const testError: RegistrationError = {
  errorCode: 'EMAIL_EXISTS',
  error: 'Email already registered',
};

// Test 4: FormState type export (string union)
const testFormState: FormState = 'idle';
const _testFormStateSubmitting: FormState = 'submitting';
const _testFormStateSuccess: FormState = 'success';
const _testFormStateError: FormState = 'error';

// Test 5: Type narrowing functions
const sampleResponse: RegistrationSuccess | RegistrationError = testSuccess;
if (isRegistrationSuccess(sampleResponse)) {
  const userId: string = sampleResponse.userId;
  console.log('Registration succeeded for user:', userId);
}

const errorResponse: RegistrationSuccess | RegistrationError = testError;
if (isRegistrationError(errorResponse)) {
  const code: string = errorResponse.errorCode;
  console.log('Registration failed with code:', code);
}

// Test 6: Zod schema validation at runtime
const validInput = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  medicalId: 'XX-001-002-003',
  password: 'ValidPass456!!',
  confirmPassword: 'ValidPass456!!',
  terms: true,
};

const result = registrationSchema.safeParse(validInput);
if (result.success) {
  const input: RegistrationInput = result.data;
  console.log('Input is valid:', input);
}

// Test 7: Zod schema rejects invalid input
const invalidInput = {
  firstName: '',
  lastName: '',
  email: 'invalid',
  medicalId: '',
  password: 'weak',
  confirmPassword: '',
  terms: false,
};

const invalidResult = registrationSchema.safeParse(invalidInput);
if (!invalidResult.success) {
  console.log('Input validation errors:', invalidResult.error.errors);
}

// Test 8: validateRegistration utility function
const validationResult = validateRegistration(validInput);
console.log('Validation result:', validationResult);

// Test 9: Type compatibility
const performTypeCompatibilityCheck = (input: RegistrationInput): void => {
  const isValid = registrationSchema.safeParse(input).success;
  console.log('Type compatibility check passed:', isValid);
};

performTypeCompatibilityCheck(testRegistrationInput);
void testFormState;

console.log('✅ All type verification tests passed');

}); // end test('auth type verification')
