import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seed,saveSessionAttendance} from '../src/model.js';

test('inline attendance saves roster once and corrections restore credits',()=>{
  let db=seed();
  const initial=db.students.find(s=>s.id==='s1').balance;
  assert.throws(()=>saveSessionAttendance(db,'b2',{s1:'present'}),/逐位/);
  db=saveSessionAttendance(db,'b2',{s1:'present',s6:'leave'});
  assert.equal(db.students.find(s=>s.id==='s1').balance,initial-1);
  assert.equal(saveSessionAttendance(db,'b2',{s1:'present',s6:'leave'}),db);
  assert.throws(()=>saveSessionAttendance(db,'b2',{s1:'leave',s6:'leave'}),/原因/);
  db=saveSessionAttendance(db,'b2',{s1:'leave',s6:'leave'},'請假更正');
  assert.equal(db.students.find(s=>s.id==='s1').balance,initial);
  assert.equal(db.sessions.find(s=>s.id==='b2').attendance.s1,'leave');
});
test('inline attendance preserves billed and cancelled lesson locks',()=>{
  const done=saveSessionAttendance(seed(),'b3',{s4:'present'});
  const billed={...done,invoices:[{id:'inv',lines:[{sessionId:'b3'}]}]};
  assert.throws(()=>saveSessionAttendance(billed,'b3',{s4:'absent'},'更正'),/已開單/);
  const cancelled=seed();cancelled.sessions.find(s=>s.id==='b2').status='cancelled';
  assert.throws(()=>saveSessionAttendance(cancelled,'b2',{s1:'present',s6:'present'}),/不能記錄/);
});
