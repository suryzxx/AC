import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seed,normalizeDb,totalStudentLessons,completeSession,reverseAttendance,registerPayment,fixInvoice} from '../src/model.js';
test('attendance reduces remaining lessons but not total; corrections do not increase total',()=>{
 let db=normalizeDb(seed());
 assert.equal(totalStudentLessons(db,'s1'),8);
 db=completeSession(db,'b2',{s1:'present',s6:'present'},'');
 assert.equal(db.students.find(s=>s.id==='s1').balance,7);
 assert.equal(totalStudentLessons(db,'s1'),8);
 db=reverseAttendance(db,'b2','誤記');
 assert.equal(totalStudentLessons(db,'s1'),8);
});
test('only paid purchases increase total; payment reversal restores original total',()=>{
 let db=normalizeDb(seed());
 db.invoices.push({id:'purchase',no:'INV-test',studentId:'s1',source:'package',packageCount:10,paid:false,lines:[]});
 assert.equal(totalStudentLessons(db,'s1'),8);
 db=registerPayment(db,'purchase','現金');
 assert.equal(totalStudentLessons(db,'s1'),18);
 db=fixInvoice(db,'purchase','unpay','誤收款');
 assert.equal(totalStudentLessons(db,'s1'),8);
});
