import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seed,normalizeDb,usePurchasedLessonCredits,completeSession} from '../src/model.js';
test('all current students and scheduled lessons use credits without inventing balances',()=>{
 const before=normalizeDb(seed());
 const after=usePurchasedLessonCredits(before);
 assert.ok(after.students.every(s=>s.mode==='package'));
 assert.deepEqual(after.students.map(s=>s.balance),before.students.map(s=>s.balance));
 assert.ok(after.sessions.filter(s=>s.status==='scheduled').every(s=>Object.values(s.charges).every(c=>c.mode==='package')));
 const done=completeSession(after,'b3',{s4:'present'},'');
 assert.equal(done.ledger.at(-1).type,'待補扣');
 assert.deepEqual(usePurchasedLessonCredits(after),after);
});
test('completed lessons, invoices and ledger are preserved during migration',()=>{
 const before=completeSession(normalizeDb(seed()),'b3',{s4:'present'},'');
 const after=usePurchasedLessonCredits(before);
 assert.deepEqual(after.sessions.find(s=>s.id==='b3'),before.sessions.find(s=>s.id==='b3'));
 assert.deepEqual(after.ledger,before.ledger);
 assert.deepEqual(after.invoices,before.invoices);
});
