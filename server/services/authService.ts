import { db } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  name: string;
  level: string;
  native_language: string;
  avatar_initials?: string;
  headline?: string;
  created_at?: string;
}

export class AuthService {
  static getAllUsers(): User[] {
    const users = db.prepare(`
      SELECT id, email, name, level, native_language, avatar_initials, headline, created_at
      FROM users
      ORDER BY id = 'usr_sarah_chen' DESC, id = 'usr_carlos_mendes' DESC, name ASC
    `).all() as User[];
    return users;
  }

  static getOrCreateGuest(name = 'Reality Pilot'): User {
    const defaultUser = db.prepare('SELECT id, email, name, level, native_language, avatar_initials, headline, created_at FROM users WHERE id = ?').get('usr_sarah_chen') as User | undefined;
    if (defaultUser) {
      return defaultUser;
    }

    const firstUser = db.prepare('SELECT id, email, name, level, native_language, avatar_initials, headline, created_at FROM users LIMIT 1').get() as User | undefined;
    if (firstUser) return firstUser;

    const id = `usr_${uuidv4().substring(0, 8)}`;
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, level, native_language, avatar_initials, headline)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, `${id}@aienglishreality.com`, 'guest_hash', name, 'Intermediate', 'Global', 'RP', 'Communication Candidate');

    return {
      id,
      email: `${id}@aienglishreality.com`,
      name,
      level: 'Intermediate',
      native_language: 'Global',
      avatar_initials: 'RP',
      headline: 'Communication Candidate'
    };
  }

  static getUserById(id: string): User | null {
    const user = db.prepare('SELECT id, email, name, level, native_language, avatar_initials, headline, created_at FROM users WHERE id = ?').get(id) as User | undefined;
    return user || null;
  }

  static updateUserLevel(id: string, level: string): boolean {
    const res = db.prepare('UPDATE users SET level = ? WHERE id = ?').run(level, id);
    return res.changes > 0;
  }
}
