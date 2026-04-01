import { beforeAll, afterAll, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { getDb, closeDb } from '../src/db/manager.js';

beforeAll(() => {
  // Ensure we are in test mode
  process.env.NODE_ENV = 'test';
});

beforeEach(() => {
  // We can choose to clear tables or re-init in-memory DB
  // For in-memory DB, every time getDb is called it will use the same singleton until closed
});

afterAll(() => {
  closeDb();
});