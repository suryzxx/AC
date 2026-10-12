import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seed,saveSessionAttendance,confirmStudentConsumption,markStudentAbsent,hasConfirmedConsumption,assertBookingCredits,reconcileDemoBookingCredits} from '../src/model.js';
test('student confirmations and cancellations never alter classmates or refund twice',()=>{
 let db=saveSessionAttendance(seed(),'b2',{s1:'present',s6:'present'});
 db=confirmStudentConsumption(db,'b2','s1','t1');
 assert.equal(db.students.find(s=>s.id==='s1').balance,7);
 assert.equal(db.students.find(s=>s.id==='s6').balance,10);
 assert.equal(db.sessions.find(s=>s.id==='b2').pendingConsumption,true);
 db=confirmStudentConsumption(db,'b2','s6','t1');
 db=markStudentAbsent(db,'b2','s1');
 assert.equal(db.students.find(s=>s.id==='s1').balance,8);
 assert.equal(db.students.find(s=>s.id==='s6').balance,9);
 assert.equal(hasConfirmedConsumption(db,'b2','s6'),true);
 assert.equal(markStudentAbsent(db,'b2','s1'),db);
 assert.equal(db.sessions.find(s=>s.id==='b2').attendance.s1,'absent');
});
test('booking credits include outstanding reservations and cancellations release them',()=>{
 const db=seed();db.students[0].balance=1;db.sessions=[{id:'reserved',status:'scheduled',studentIds:['s1'],courseId:'c1',attendance:{}}];
 const draft={id:'new',studentIds:['s1'],courseId:'c1'};
 assert.throws(()=>assertBookingCredits(db,[draft]),/課時不足/);
 db.sessions[0].status='cancelled';assert.doesNotThrow(()=>assertBookingCredits(db,[draft]));
 db.students[0].balance=0;assert.throws(()=>assertBookingCredits(db,[draft]),/課時不足/);
});
test('unconfirmed absence never deducts and insufficient confirmation cannot create pending deductions',()=>{
 let db=saveSessionAttendance(seed(),'b2',{s1:'present',s6:'present'});
 db=markStudentAbsent(db,'b2','s1');assert.equal(db.ledger.length,0);
 db.students.find(s=>s.id==='s6').balance=0;
 assert.throws(()=>confirmStudentConsumption(db,'b2','s6','t1'),/課時不足/);
 assert.equal(db.ledger.length,0);
 const fixed=reconcileDemoBookingCredits(db);assert.equal(reconcileDemoBookingCredits(fixed),fixed);
});
