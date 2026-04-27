import { registrationSchema, validateRegistration } from '@/schemas/registration.schema';

const validBase = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  medicalId: 'XX-001-002-003',
  password: 'SecurePass123!',
  confirmPassword: 'SecurePass123!',
  terms: true,
  dateOfBirth: '1990-06-15',
};

describe('Registration Schema Validation', () => {
  describe('Valid Input', () => {
    it('should accept valid input (happy path)', () => {
      expect(registrationSchema.parse(validBase)).toEqual(validBase);
    });

    it('should accept email with +addressing', () => {
      const data = { ...validBase, email: 'john+test@example.com' };
      expect(registrationSchema.parse(data)).toEqual(data);
    });

    it('should accept name with apostrophes and hyphens', () => {
      const data = { ...validBase, firstName: "O'Brien-Smith" };
      expect(registrationSchema.parse(data)).toEqual(data);
    });
  });

  describe('First Name Validation', () => {
    it('should reject empty first name', () => {
      const result = registrationSchema.safeParse({ ...validBase, firstName: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('First name is required');
      }
    });

    it('should reject first name too long (>128 chars)', () => {
      const result = registrationSchema.safeParse({ ...validBase, firstName: 'a'.repeat(129) });
      expect(result.success).toBe(false);
    });

    it('should reject first name with numbers', () => {
      const result = registrationSchema.safeParse({ ...validBase, firstName: 'John123' });
      expect(result.success).toBe(false);
    });
  });

  describe('Last Name Validation', () => {
    it('should reject empty last name', () => {
      const result = registrationSchema.safeParse({ ...validBase, lastName: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Last name is required');
      }
    });

    it('should reject last name too long (>128 chars)', () => {
      const result = registrationSchema.safeParse({ ...validBase, lastName: 'a'.repeat(129) });
      expect(result.success).toBe(false);
    });
  });

  describe('Email Validation', () => {
    it('should reject invalid email format', () => {
      const result = registrationSchema.safeParse({ ...validBase, email: 'invalid-email' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Invalid email address');
      }
    });

    it('should reject email without @', () => {
      const result = registrationSchema.safeParse({ ...validBase, email: 'janedoegmail.com' });
      expect(result.success).toBe(false);
    });

    it('should reject email without domain', () => {
      const result = registrationSchema.safeParse({ ...validBase, email: 'jane@' });
      expect(result.success).toBe(false);
    });

    it('should reject email too long (>254 chars)', () => {
      const result = registrationSchema.safeParse({ ...validBase, email: 'a'.repeat(250) + '@example.com' });
      expect(result.success).toBe(false);
    });
  });

  describe('Medical ID Validation', () => {
    it('should reject empty medical ID', () => {
      const result = registrationSchema.safeParse({ ...validBase, medicalId: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Medical ID is required');
      }
    });
  });

  describe('Password Validation', () => {
    it('should reject password too short (<12 chars)', () => {
      const result = registrationSchema.safeParse({ ...validBase, password: 'Pass12!' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password must be at least 12 characters');
      }
    });

    it('should reject password missing uppercase', () => {
      const result = registrationSchema.safeParse({ ...validBase, password: 'password123456!' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('uppercase');
      }
    });

    it('should reject password missing lowercase', () => {
      const result = registrationSchema.safeParse({ ...validBase, password: 'PASSWORD123456!' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('lowercase');
      }
    });

    it('should reject password missing digit', () => {
      const result = registrationSchema.safeParse({ ...validBase, password: 'PasswordAbcDef!' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('number');
      }
    });

    it('should reject password missing special character', () => {
      const result = registrationSchema.safeParse({ ...validBase, password: 'Password123456' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('special character');
      }
    });

    it('should accept various special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*'];
      specialChars.forEach(char => {
        const pw = `SecurePass123${char}`;
        const result = registrationSchema.safeParse({ ...validBase, password: pw, confirmPassword: pw });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Terms Validation', () => {
    it('should reject when terms is false', () => {
      const result = registrationSchema.safeParse({ ...validBase, terms: false });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Terms of Service');
      }
    });

    it('should accept when terms is true', () => {
      const result = registrationSchema.safeParse({ ...validBase, terms: true });
      expect(result.success).toBe(true);
    });
  });

  describe('Date of Birth Validation', () => {
    it('should reject empty dateOfBirth', () => {
      const result = registrationSchema.safeParse({ ...validBase, dateOfBirth: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Date of birth is required');
      }
    });

    it('should reject a future date', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const futureStr = future.toISOString().split('T')[0];
      const result = registrationSchema.safeParse({ ...validBase, dateOfBirth: futureStr });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.message === 'Date of birth cannot be in the future')).toBe(true);
      }
    });

    it('should reject a date older than 200 years', () => {
      const tooOld = new Date();
      tooOld.setFullYear(tooOld.getFullYear() - 201);
      const tooOldStr = tooOld.toISOString().split('T')[0];
      const result = registrationSchema.safeParse({ ...validBase, dateOfBirth: tooOldStr });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.message === 'Please enter a valid date of birth')).toBe(true);
      }
    });

    it('should accept a valid past date', () => {
      const result = registrationSchema.safeParse({ ...validBase, dateOfBirth: '1990-06-15' });
      expect(result.success).toBe(true);
    });

    it('should accept a date exactly 200 years ago', () => {
      const exactly200 = new Date();
      exactly200.setFullYear(exactly200.getFullYear() - 200);
      exactly200.setDate(exactly200.getDate() + 1); // one day after the 200-year boundary
      const dateStr = exactly200.toISOString().split('T')[0];
      const result = registrationSchema.safeParse({ ...validBase, dateOfBirth: dateStr });
      expect(result.success).toBe(true);
    });
  });

  describe('validateRegistration utility', () => {
    it('should return safeParse result for valid input', () => {
      const result = validateRegistration(validBase);
      expect(result.success).toBe(true);
    });

    it('should handle unknown data types safely', () => {
      const result = validateRegistration(null);
      expect(result.success).toBe(false);
    });

    it('should handle empty objects', () => {
      const result = validateRegistration({});
      expect(result.success).toBe(false);
    });
  });
});
