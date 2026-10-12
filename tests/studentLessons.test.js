import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seed, addStudentWithLessons, completeSession } from '../src/model.js';
test('opening purchased lessons become usable credit and are deducted once on attendance', () => {
  const before = seed();
  const db = addStudentWithLessons(before, {name:'測試學生',english:'Test',grade:'P4'}, 12);
  const student = db.students.at(-1);
  assert.equal(student.balance, 12);
  assert.equal(student.mode, 'package');
  assert.equal(db.ledger.at(-1).delta, 12);
  assert.deepEqual(db.invoices, before.invoices);
  const session = {...db.sessions[0],id:'opening-credit-test',studentIds:[student.id],status:'scheduled',attendance:{}};
  db.sessions = [...db.sessions,session];
  const after = completeSession(db, session.id, {[student.id]:'present'}, '');
  assert.equal(after.students.at(-1).balance, 11);
  assert.throws(() => completeSession(after,session.id,{[student.id]:'present'},''));
});
test('zero is allowed; empty, negative and fractional opening credits are rejected', () => {
  const db = seed();
  assert.equal(addStudentWithLessons(db,{name:'零課時'},0).students.at(-1).balance,0);
  for (const value of [null,undefined,-1,1.5,'12',Infinity]) assert.throws(() => addStudentWithLessons(db,{name:'測試'},value));
});
