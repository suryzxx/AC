import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deleteSession} from '../src/model.js';
const data = (status='scheduled', ledger=[]) => ({students:[{id:'s1',balance:4},{id:'s2',balance:7}],sessions:[{id:'b1',date:'2026-10-13',start:'12:00',end:'13:00',courseId:'c1',studentIds:['s1','s2'],status,pendingConsumption:true},{id:'b2',status:'scheduled'}],courses:[{id:'c1',name:'英文'}],ledger,invoices:[],history:[]});
test('deletes only this lesson and retains an audit trail without charging credits',()=>{
 const db=data();const next=deleteSession(db,'b1');
 assert.equal(next.sessions[0].status,'cancelled');assert.ok(next.sessions[0].deletedAt);
 assert.equal(next.sessions[0].pendingConsumption,false);assert.equal(next.sessions[1].status,'scheduled');
 assert.deepEqual(next.students,db.students);assert.ok(next.history[0].text.includes('刪除'));assert.equal(db.sessions[0].status,'scheduled');
 assert.throws(()=>deleteSession(next,'b1'),/已刪除/);
});
test('returns only active deductions for completed or partially confirmed lessons',()=>{
 for(const status of ['scheduled','completed']) {
 const db=data(status,[{id:'l1',sessionId:'b1',studentId:'s1',type:'上課扣減',delta:-1},{id:'l2',sessionId:'b1',studentId:'s2',type:'上課扣減',delta:-1,reversed:true},{id:'l3',sessionId:'b2',studentId:'s1',type:'上課扣減',delta:-1}]);
 const next=deleteSession(db,'b1');assert.equal(next.students[0].balance,5);assert.equal(next.students[1].balance,7);
 assert.equal(next.ledger[0].reversed,true);assert.equal(next.ledger[2].reversed,undefined);assert.equal(next.ledger.at(-1).delta,1);
 }
});
test('protects billed lessons atomically; voided documents allow deletion',()=>{
 const db=data();db.invoices=[{lines:[{sessionId:'b1'}]}];const before=structuredClone(db);
 assert.throws(()=>deleteSession(db,'b1'),/已開單/);assert.deepEqual(db,before);
 db.invoices[0].voided=true;assert.equal(deleteSession(db,'b1').sessions[0].status,'cancelled');
 assert.throws(()=>deleteSession(db,'missing'),/不存在/);
});
