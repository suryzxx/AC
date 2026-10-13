import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parentStudents,parentRecords} from '../src/parentData.js';
test('demo uses existing s1 without mutating contacts and scopes records to the child',()=>{
 const db={students:[{id:'s1',phone:'123'},{id:'s2',phone:'456'}],sessions:[{id:'a',studentIds:['s1','s2']},{id:'b',studentIds:['s2']},{id:'c',studentIds:['s1'],deletedAt:'today'}],invoices:[{studentId:'s1'},{studentId:'s2'}]};
 assert.deepEqual(parentStudents(db),[db.students[0]]);
 assert.deepEqual(parentRecords(db,'s1').sessions.map(s=>s.id),['a']);
 assert.equal(parentRecords(db,'s1').invoices.length,1);
 assert.deepEqual(parentRecords(db,'s2'),{sessions:[],invoices:[]});
 assert.equal(db.students[0].phone,'123');
});
test('actual matching phone takes precedence and a missing linked child produces empty data',()=>{
 const db={students:[{id:'s1'},{id:'s2',phone:'177 8888 9999'}],sessions:[],invoices:[]};
 assert.equal(parentStudents(db)[0].id,'s2');
 assert.deepEqual(parentStudents({...db,students:[]}),[]);
});
