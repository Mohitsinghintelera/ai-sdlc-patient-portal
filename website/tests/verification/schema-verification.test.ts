import { registrationSchema, validateRegistration } from '@/schemas/registration.schema';

const validBase = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  medicalId: 'XX-001-002-003',
  password: 'SecurePass123!',
  confirmPassword: 'SecurePass123!',
  terms: true,
  dateOfBirth: '1990-06-15',
};

describe('Registration Schema Verification', () => {
  describe('Schema Structure', () => {
    it('should have required fields', () => {
      const result = registrationSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });

    it('should accept valid registration input', () => {
      const result = registrationSchema.safeParse(validBase);
      expect(result.success).toBe(true);
    });
  });

  describe('First Name Validation', () => {
    const validFirstNames = ['John', 'Mary-Jane', "O'Connor", 'Jean-Luc', 'Anne'];

    validFirstNames.forEach((name) => {
      it(`should accept valid first name: "${name}"`, () => {
        const result = registrationSchema.safeParse({ ...validBase, firstName: name });
        expect(result.success).toBe(true);
      });
    });

    it('should reject names with invalid characters', () => {
      const result = registrationSchema.safeParse({ ...validBase, firstName: 'John123' });
      expect(result.success).toBe(false);
    });

    it('should reject empty firstName', () => {
      const result = registrationSchema.safeParse({ ...validBase, firstName: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('Email Validation', () => {
    const validEmails = [
      'user@example.com',
      'test.email@domain.co.uk',
      'first+last@example.com',
      'user123@test-domain.com',
    ];

    validEmails.forEach((email) => {
      it(`should accept valid email: "${email}"`, () => {
        const result = registrationSchema.safeParse({ ...validBase, email });
        expect(result.success).toBe(true);
      });
    });

    const invalidEmails = [
      'plaintext',
      '@example.com',
      'user@',
      'user @example.com',
    ];

    invalidEmails.forEach((email) => {
      it(`should reject invalid email: "${email}"`, () => {
        const result = registrationSchema.safeParse({ ...validBase, email });
        expect(result.success).toBe(false);
      });
    });

    it('should reject empty email', () => {
      const result = registrationSchema.safeParse({ ...validBase, email: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('Password Validation', () => {
    const validPasswords = [
      'SecurePass123!',
      'MyP@ssw0rdAbc',
      'Complex#Pass1X',
      'StrongP@ss99XY',
    ];

    validPasswords.forEach((password) => {
      it(`should accept valid password: "${password}"`, () => {
        const result = registrationSchema.safeParse({ ...validBase, password, confirmPassword: password });
        expect(result.success).toBe(true);
      });
    });

    it('should reject password without uppercase', () => {
      const result = registrationSchema.safeParse({ ...validBase, password: 'securepass1234!' });
      expect(result.success).toBe(false);
    });

    it('should reject password without lowercase', () => {
      const result = registrationSchema.safeParse({ ...validBase, password: 'SECUREPASS1234!' });
      expect(result.success).toBe(false);
    });

    it('should reject password without digit', () => {
      const result = registrationSchema.safeParse({ ...validBase, password: 'SecurePassAbc!' });
      expect(result.success).toBe(false);
    });

    it('should reject password without special character', () => {
      const result = registrationSchema.safeParse({ ...validBase, password: 'SecurePass1234' });
      expect(result.success).toBe(false);
    });

    it('should reject too-short password (< 12 chars)', () => {
      const result = registrationSchema.safeParse({ ...validBase, password: 'Pass1!a' });
      expect(result.success).toBe(false);
    });

    it('should reject too-long password (> 128 chars)', () => {
      const result = registrationSchema.safeParse({ ...validBase, password: 'P' + 'a'.repeat(127) + '1!' });
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = registrationSchema.safeParse({ ...validBase, password: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('Terms Validation', () => {
    it('should reject when terms not accepted', () => {
      const result = registrationSchema.safeParse({ ...validBase, terms: false });
      expect(result.success).toBe(false);
    });
  });

  describe('validateRegistration Utility', () => {
    it('should return parsed data on valid input', () => {
      const result = validateRegistration(validBase);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validBase);
      }
    });

    it('should return errors on invalid input', () => {
      const invalidInput = { firstName: '', lastName: '', email: 'invalid', medicalId: '', password: 'weak', terms: false };
      const result = validateRegistration(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });

    it('should handle mixed valid/invalid fields', () => {
      const mixedInput = { ...validBase, email: 'invalid' };
      const result = validateRegistration(mixedInput);
      expect(result.success).toBe(false);
    });
  });

  describe('Schema Type Inference', () => {
    it('should infer RegistrationInput type from schema', () => {
      const result = registrationSchema.parse(validBase);
      const firstName: string = result.firstName;
      const email: string = result.email;
      const password: string = result.password;

      expect(firstName).toBe('John');
      expect(email).toBe('john@example.com');
      expect(password).toBe('SecurePass123!');
    });
  });
});
