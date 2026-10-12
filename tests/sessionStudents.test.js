import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seed, normalizeDb, usePurchasedLessonCredits, addSessionStudents, completeSession } from '../src/model.js';
const base = () => {
  const db = usePurchasedLessonCredits(normalizeDb(seed()));
  db.sessions = [{ id: 'group', date: '2026-10-13', start: '11:00', end: '12:00', teacherId: 't1', courseId: 'c1', studentIds: ['s1'], status: 'scheduled', attendance: {} }];
  return db;
};
test('adding multiple students preserves roster and credits until individual attendance', () => {
  const db = base();
  const out = addSessionStudents(db, 'group', ['s1', 's3', 's6', 's3']);
  assert.deepEqual(out.sessions[0].studentIds, ['s1', 's3', 's6']);
  assert.deepEqual(out.students, db.students);
  const done = completeSession(out, 'group', { s1: 'present', s3: 'absent', s6: 'late' }, '');
  for (const id of ['s1', 's3', 's6']) assert.equal(done.students.find(s => s.id === id).balance, db.students.find(s => s.id === id).balance - (id === 's3' ? 0 : 1));
  assert.throws(() => addSessionStudents(done, 'group', ['s2']), /未完成/);
});
test('adding students checks their other bookings and teacher grade eligibility', () => {
  const db = base();
  db.sessions.push({ ...db.sessions[0], id: 'other', teacherId: 't2', studentIds: ['s3'] });
  assert.throws(() => addSessionStudents(db, 'group', ['s3']), /學生已有/);
  db.students.find(s => s.id === 's6').grade = 'P1';
  assert.throws(() => addSessionStudents(db, 'group', ['s6']), /年級/);
  assert.deepEqual(db.sessions[0].studentIds, ['s1']);
});
