/**
 * Tests for registerUser() service (T016 + T017).
 * Migrated from fetch to axiosClient — mocks the axios client.
 */

import MockAdapter from 'axios-mock-adapter';

import { mockResponses, validRegistrationInput } from '@/mocks/auth/register.mock';
import { axiosClient } from '@/services/api/axios-client';
import { registerUser } from '@/services/auth/register.service';
import type { RegistrationError, RegistrationSuccess } from '@/types/auth.types';

const mock = new MockAdapter(axiosClient);

afterEach(() => {
  mock.reset();
});

afterAll(() => {
  mock.restore();
});

// ── T016: fullName mapping ────────────────────────────────────────────────────

describe('T016 — registerUser maps form fields to API payload', () => {
  it('combines firstName and lastName into fullName', async () => {
    let capturedBody: Record<string, unknown> | undefined;

    mock.onPost('/api/auth/register').reply((config) => {
      capturedBody = JSON.parse(config.data as string);
      return [
        201,
        {
          success: true,
          data: mockResponses.success.response,
          error: null,
          meta: { timestamp: '', version: '1.0' },
        },
      ];
    });

    await registerUser(validRegistrationInput);

    expect(capturedBody).toMatchObject({
      fullName: 'Jane Doe',
      email: 'jane.doe@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      dateOfBirth: '1990-06-15',
    });
  });

  it('does NOT send medicalId or terms to the backend', async () => {
    let capturedBody: Record<string, unknown> | undefined;

    mock.onPost('/api/auth/register').reply((config) => {
      capturedBody = JSON.parse(config.data as string);
      return [
        201,
        {
          success: true,
          data: mockResponses.success.response,
          error: null,
          meta: { timestamp: '', version: '1.0' },
        },
      ];
    });

    await registerUser(validRegistrationInput);

    expect(capturedBody).not.toHaveProperty('medicalId');
    expect(capturedBody).not.toHaveProperty('terms');
  });

  it('trims whitespace when lastName is empty', async () => {
    let capturedBody: Record<string, unknown> | undefined;

    mock.onPost('/api/auth/register').reply((config) => {
      capturedBody = JSON.parse(config.data as string);
      return [
        201,
        {
          success: true,
          data: { ...mockResponses.success.response, lastName: '' },
          error: null,
          meta: { timestamp: '', version: '1.0' },
        },
      ];
    });

    await registerUser({ ...validRegistrationInput, lastName: '' });

    expect(capturedBody?.fullName).toBe('Jane');
  });
});

// ── T017: service return values ───────────────────────────────────────────────

describe('T017 — registerUser returns correct types', () => {
  it('should return RegistrationSuccess on 201 response', async () => {
    mock.onPost('/api/auth/register').reply(201, {
      success: true,
      data: mockResponses.success.response,
      error: null,
      meta: { timestamp: '', version: '1.0' },
    });

    const result = await registerUser(validRegistrationInput);

    expect(result).toHaveProperty('userId');
    expect(result).toHaveProperty('email');
    expect((result as RegistrationSuccess).userId).toBe('usr_e7f4c2d9b1a5');
  });

  it('should return RegistrationError with INVALID_INPUT code on 400', async () => {
    mock.onPost('/api/auth/register').reply(400, {
      success: false,
      data: null,
      error: { code: 'INVALID_INPUT', message: 'Request validation failed', details: [{ field: 'email', reason: 'Invalid email' }] },
      meta: { timestamp: '', version: '1.0' },
    });

    const result = await registerUser(validRegistrationInput);

    expect((result as RegistrationError).errorCode).toBe('INVALID_INPUT');
    expect((result as RegistrationError).field).toBe('email');
  });

  it('should return RegistrationError with EMAIL_EXISTS code on 409', async () => {
    mock.onPost('/api/auth/register').reply(409, {
      success: false,
      data: null,
      error: { code: 'EMAIL_EXISTS', message: 'Email already registered. Try login or use another email.' },
      meta: { timestamp: '', version: '1.0' },
    });

    const result = await registerUser(validRegistrationInput);

    expect((result as RegistrationError).errorCode).toBe('EMAIL_EXISTS');
    expect((result as RegistrationError).error).toContain('Email already registered');
  });

  it('should retry on SERVER_ERROR and return error after 3 attempts', async () => {
    mock.onPost('/api/auth/register').reply(500, {
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: 'Internal server error' },
      meta: { timestamp: '', version: '1.0' },
    });

    // Make setTimeout resolve immediately so retry delays don't block
    jest.spyOn(global, 'setTimeout').mockImplementation((cb) => {
      (cb as () => void)();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });

    const result = await registerUser(validRegistrationInput);

    expect((result as RegistrationError).errorCode).toBe('SERVER_ERROR');
    // Should have retried 3 times
    expect(mock.history.post.length).toBe(3);

    jest.restoreAllMocks();
  });

  it('should return NETWORK_ERROR on network failure', async () => {
    mock.onPost('/api/auth/register').networkError();

    jest.spyOn(global, 'setTimeout').mockImplementation((cb) => {
      (cb as () => void)();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });

    const result = await registerUser(validRegistrationInput);

    expect((result as RegistrationError).errorCode).toBe('NETWORK_ERROR');

    jest.restoreAllMocks();
  });

  it('should send POST to /api/auth/register endpoint', async () => {
    mock.onPost('/api/auth/register').reply(201, {
      success: true,
      data: mockResponses.success.response,
      error: null,
      meta: { timestamp: '', version: '1.0' },
    });

    await registerUser(validRegistrationInput);

    expect(mock.history.post[0].url).toBe('/api/auth/register');
  });
});
