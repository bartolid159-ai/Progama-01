import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db;

export function getDb(dbPath = process.env.NODE_ENV === 'test' ? ':memory:' : 'data.db') {
  if (db) return db;
  
  // Ensure the directory exists if it's a file path
  if (dbPath !== ':memory:' && !dbPath.startsWith(':memory:')) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  
  // Initial schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    );
    
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
