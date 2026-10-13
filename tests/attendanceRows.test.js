import {test} from 'node:test';
import assert from 'node:assert/strict';
import {attendanceRows} from '../src/attendanceRows.js';
import {seed,saveSessionAttendance,confirmStudentConsumption,hasConfirmedConsumption} from '../src/model.js';
test('overdue attendance uses Hong Kong lesson end, excludes future, deleted and cancelled rows',()=>{
 const db={ledger:[],sessions:[{id:'past',date:'2026-10-13',start:'09:00',end:'10:00',studentIds:['s1','s2'],attendance:{s2:'absent'}},{id:'future',date:'2026-10-13',end:'10:01',studentIds:['s1']},{id:'cancelled',date:'2026-10-12',end:'10:00',studentIds:['s1'],status:'cancelled'},{id:'deleted',date:'2026-10-12',end:'10:00',studentIds:['s1'],deletedAt:'date'}]};
 const rows=attendanceRows(db,db.sessions,new Date('2026-10-13T02:00:00Z'));
 assert.equal(rows.length,2);assert.equal(rows[0].status,'unrecorded');assert.equal(rows[1].status,'absent');assert.equal(rows[1].confirmed,false);
});
test('absence confirmation is independent, does not deduct and resets after attendance correction',()=>{
 let db=saveSessionAttendance(seed(),'b2',{s1:'absent',s6:'absent'});
 const balance=db.students.find(s=>s.id==='s1').balance;
 assert.throws(()=>confirmStudentConsumption(db,'b2','s1','t2'),/授課老師/);
 db=confirmStudentConsumption(db,'b2','s1','t1');
 assert.equal(db.students.find(s=>s.id==='s1').balance,balance);assert.equal(hasConfirmedConsumption(db,'b2','s1'),false);
 assert.equal(attendanceRows(db,db.sessions).find(r=>r.id==='b2:s1').confirmed,true);
 assert.equal(attendanceRows(db,db.sessions).find(r=>r.id==='b2:s6').confirmed,false);
 assert.throws(()=>confirmStudentConsumption(db,'b2','s1','t1'),/重複/);
 db=saveSessionAttendance(db,'b2',{s1:'present',s6:'absent'},'更正');
 assert.equal(db.sessions.find(s=>s.id==='b2').absenceConfirmations.s1,undefined);
 db=saveSessionAttendance(db,'b2',{s1:'absent',s6:'absent'});
 assert.equal(attendanceRows(db,db.sessions).find(r=>r.id==='b2:s1').confirmed,false);
});
