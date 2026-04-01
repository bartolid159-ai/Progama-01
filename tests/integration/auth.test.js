import { describe, it, expect, beforeEach } from 'vitest';
import { login, register } from '../../src/auth.js';
import { getDb, closeDb } from '../../src/db/manager.js';

describe('Local Authentication System', () => {
  beforeEach(async () => {
    const db = getDb();
    // Clear users to ensure a clean state
    db.exec('DELETE FROM users');
    // Setup initial user for testing
    await register('admin', 'password123');
  });

  it('should reject incorrect passwords', async () => {
    const result = await login('admin', 'wrong_password');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid password');
  });

  it('should reject non-registered users', async () => {
    const result = await login('unknown_user', 'any_password');
    expect(result.success).toBe(false);
    expect(result.message).toBe('User not found');
  });

  it('should allow access to registered users with correct passwords', async () => {
    const result = await login('admin', 'password123');
    expect(result.success).toBe(true);
    expect(result.user.username).toBe('admin');
  });
});
