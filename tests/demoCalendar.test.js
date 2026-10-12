import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seed, normalizeDb, usePurchasedLessonCredits, upgradeDemoCalendar, validateSessions, totalStudentLessons } from '../src/model.js';
test('calendar examples include both states, valid slots, and matching credit records exactly once', () => {
  const db = usePurchasedLessonCredits(normalizeDb(seed()));
  const out = upgradeDemoCalendar(db, '2026-10-12');
  const examples = out.sessions.filter(s => s.id.startsWith('demo-calendar-'));
  assert.equal(examples.length, 9);
  for (const id of ['t1', 't2', 't3']) {
    assert.equal(examples.filter(s => s.teacherId === id && s.status === 'completed').length, 1);
    assert.equal(examples.filter(s => s.teacherId === id && s.status === 'scheduled').length, 2);
  }
  for (const lesson of examples) {
    assert.equal(validateSessions(out, [lesson], lesson.id), '');
    assert.ok(lesson.date >= '2026-10-12' && lesson.date <= '2026-10-17');
  }
  for (const id of ['s1', 's3', 's6']) {
    assert.equal(out.students.find(s => s.id === id).balance, db.students.find(s => s.id === id).balance - 1);
    assert.equal(totalStudentLessons(out, id), totalStudentLessons(db, id));
  }
  assert.equal(upgradeDemoCalendar(out), out);
  assert.deepEqual(out.sessions.slice(0, db.sessions.length), db.sessions);
});
