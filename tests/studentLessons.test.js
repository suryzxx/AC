import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seed, addStudent, registerPayment } from '../src/model.js';
test('new students start at zero despite supplied credit fields', () => {
 const before=seed();
 const db=addStudent(before,{name:'Test',grade:'P4',balance:12,purchasedLessons:12});
 assert.equal(db.students.at(-1).balance,0);
 assert.deepEqual(db.ledger,before.ledger);
 assert.deepEqual(db.invoices,before.invoices);
 assert.equal(db.students.length,before.students.length+1);
});
test('purchase payment adds ten lessons exactly once after creation', () => {
 const db=addStudent(seed(),{name:'Test',grade:'P4'});
 const student=db.students.at(-1);
 db.invoices.push({id:'purchase',no:'INV-TEST',studentId:student.id,source:'package',packageCount:10,total:2000,paid:false,lines:[]});
 assert.equal(student.balance,0);
 const paid=registerPayment(db,'purchase','Cash');
 assert.equal(paid.students.at(-1).balance,10);
 assert.throws(()=>registerPayment(paid,'purchase','Cash'));
});
