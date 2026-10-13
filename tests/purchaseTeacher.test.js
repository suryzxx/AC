import {test} from 'node:test';
import assert from 'node:assert/strict';
import {purchasedTeacher} from '../src/purchaseTeacher.js';
const purchase = (studentId,teacherId,extra={}) => ({studentId,teacherId,source:'package',paid:true,courseId:'c1',...extra});
const db = invoices => ({teachers:[{id:'t1',subjects:['c1']},{id:'t2',subjects:['c1','c2']}],invoices});
test('uses newest matching paid purchase and ignores unpaid, voided and other courses',()=>{
 const data=db([purchase('s1','t1',{paid:false}),purchase('s1','t1',{voided:true}),purchase('s1','t1',{courseId:'c2'}),purchase('s1','t2'),purchase('s1','t1')]);
 assert.equal(purchasedTeacher(data,['s1'],'c1'),'t2');
 assert.equal(purchasedTeacher(data,['other'],'c1'),'');
});
test('group preference requires agreement and deleted or incompatible teachers have no default',()=>{
 assert.equal(purchasedTeacher(db([purchase('s1','t1'),purchase('s2','t1')]),['s1','s2'],'c1'),'t1');
 assert.equal(purchasedTeacher(db([purchase('s1','t1'),purchase('s2','t2')]),['s1','s2'],'c1'),'');
 assert.equal(purchasedTeacher(db([purchase('s1','removed')]),['s1'],'c1'),'');
 assert.equal(purchasedTeacher(db([purchase('s1','t1',{courseId:'c2'})]),['s1'],'c2'),'');
 assert.equal(purchasedTeacher(db([]),[],'c1'),'');
});
