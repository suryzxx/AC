import { simplify } from './language.js';
export const loginName = name => simplify(name.trim()).toLowerCase();
export async function hashTeacherPassword(password, salt = crypto.randomUUID()) {
  const bytes = new TextEncoder().encode(password);
  const key = await crypto.subtle.importKey('raw', bytes, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name:'PBKDF2', salt:new TextEncoder().encode(salt), iterations:100000, hash:'SHA-256'}, key, 256);
  return {salt, hash:Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, '0')).join('')};
}
export async function authenticateTeacher(teachers, name, password) {
  const matches = teachers.filter(t => loginName(t.name) === loginName(name));
  if (matches.length !== 1 || !matches[0].passwordHash || !password) return null;
  const teacher = matches[0];
  const result = await hashTeacherPassword(password, teacher.passwordSalt);
  return result.hash === teacher.passwordHash ? teacher.id : null;
}
