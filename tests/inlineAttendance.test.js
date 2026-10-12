import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seed,saveSessionAttendance,confirmSessionConsumption} from '../src/model.js';

test('attendance waits for teacher confirmation, charges only present students once',()=>{
  let db=seed();
  const initial=db.students.find(s=>s.id==='s1').balance;
  assert.throws(()=>saveSessionAttendance(db,'b2',{s1:'late',s6:'absent'}),/出勤或缺勤/);
  db=saveSessionAttendance(db,'b2',{s1:'present',s6:'absent'});
  assert.equal(db.students.find(s=>s.id==='s1').balance,initial);
  assert.equal(db.ledger.length,0);
  assert.equal(db.sessions.find(s=>s.id==='b2').pendingConsumption,true);
  assert.throws(()=>confirmSessionConsumption(db,'b2','t2'),/授課老師/);
  db=confirmSessionConsumption(db,'b2','t1');
  assert.equal(db.students.find(s=>s.id==='s1').balance,initial-1);
  assert.equal(db.ledger.filter(l=>l.studentId==='s6').length,0);
  assert.throws(()=>confirmSessionConsumption(db,'b2','t1'),/重複/);
  assert.equal(saveSessionAttendance(db,'b2',{s1:'present',s6:'absent'}),db);
  db=saveSessionAttendance(db,'b2',{s1:'absent',s6:'absent'},'更正');
  assert.equal(db.students.find(s=>s.id==='s1').balance,initial);
  assert.equal(db.sessions.find(s=>s.id==='b2').pendingConsumption,false);
});
test('absence completes without deduction and pre-confirmation edits do not charge',()=>{
  let db=saveSessionAttendance(seed(),'b2',{s1:'present',s6:'present'});
  db=saveSessionAttendance(db,'b2',{s1:'absent',s6:'absent'});
  assert.equal(db.ledger.length,0);
  assert.equal(db.sessions.find(s=>s.id==='b2').status,'completed');
  assert.throws(()=>confirmSessionConsumption(db,'b2','t1'),/沒有待確認/);
});
test('unpaid students cannot record attendance',()=>{const db=seed();assert.throws(()=>saveSessionAttendance(db,'b3',{s4:'present'}),/先購課/);assert.equal(db.ledger.length,0);});
