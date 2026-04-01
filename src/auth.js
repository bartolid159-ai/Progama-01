import { getDb } from './db/manager.js';
import bcrypt from 'bcrypt';

export async function login(username, password) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user) {
    return { success: false, message: 'User not found' };
  }
  
  const match = await bcrypt.compare(password, user.password);
  if (match) {
    return { success: true, user: { id: user.id, username: user.username } };
  } else {
    return { success: false, message: 'Invalid password' };
  }
}

export async function register(username, password) {
  const db = getDb();
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Username already exists' };
  }
}