import { describe, it, expect, afterEach } from 'vitest';
import { getDb, closeDb } from '../../src/db/manager.js';

describe('SQLite Local Persistence', () => {
  it('should insert a client and verify it persists after reconnection', () => {
    // Note: Since we are using :memory: for tests, reconnection actually wipes it.
    // For this specific test, we'll use a temporary file to simulate the behavior requested.
    const testDbPath = 'test-data/persistence.db';
    
    // Ensure the directory exists (now handled by getDb, but we stay explicit about the path)
    const db1 = getDb(testDbPath);
    
    // Clear the table first
    db1.exec('DELETE FROM clients');
    
    // Insert client
    db1.prepare('INSERT INTO clients (name) VALUES (?)').run('Cliente de Prueba');
    
    // Verify it exists in db1
    const clientBefore = db1.prepare('SELECT * FROM clients WHERE name = ?').get('Cliente de Prueba');
    expect(clientBefore).toBeDefined();
    expect(clientBefore.name).toBe('Cliente de Prueba');
    
    // Close connection
    closeDb();
    
    // Reopen connection
    const db2 = getDb(testDbPath);
    const clientAfter = db2.prepare('SELECT * FROM clients WHERE name = ?').get('Cliente de Prueba');
    
    expect(clientAfter).toBeDefined();
    expect(clientAfter.name).toBe('Cliente de Prueba');
    
    // Cleanup
    closeDb();
  });
});
