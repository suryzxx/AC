import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seed, normalizeDb, usePurchasedLessonCredits, upgradeDemoBilling, registerPayment } from '../src/model.js';
import { dashboardStats } from '../src/analytics.js';
test('sample billing includes paid, unpaid and void records with matching credits once', () => {
  const db = usePurchasedLessonCredits(normalizeDb(seed()));
  const out = upgradeDemoBilling(db, '2026-10-12');
  assert.equal(out.invoices.length, 36);
  assert.equal(out.invoices.filter(i => i.paid).length, 15);
  assert.equal(out.invoices.filter(i => !i.paid && !i.voided).length, 14);
  assert.equal(out.invoices.filter(i => i.voided).length, 7);
  assert.ok(out.invoices.some(i => i.kind === 'receipt'));
  for (const {id} of db.students) {
    const delta = out.invoices.filter(i => i.studentId === id && i.paid && !i.voided).reduce((sum,i)=>sum+i.packageCount,0);
    assert.equal(out.students.find(s => s.id === id).balance, db.students.find(s => s.id === id).balance + delta);
  }
  assert.equal(upgradeDemoBilling(out), out);
  const stats = dashboardStats(out, '2026-10-01', '2026-10-31');
  const october = out.invoices.filter(i => i.date >= '2026-10-01' && !i.voided);
  assert.equal(stats.totals.received, october.filter(i=>i.paid).reduce((sum,i)=>sum+i.total,0));
  assert.equal(stats.totals.purchased, october.reduce((sum,i)=>sum+i.total,0));
  assert.throws(() => registerPayment(out, 'demo-billing-1', '現金'), /重複/);
  const paid = registerPayment(out, 'demo-billing-4', '現金', '2026-10-12');
  assert.equal(paid.students.find(s => s.id === 's2').balance, out.students.find(s => s.id === 's2').balance + 10);
  assert.deepEqual(out.sessions, db.sessions);
});

test('upgrading existing billing preserves edited records and never credits twice', () => {
  const full = upgradeDemoBilling(usePurchasedLessonCredits(normalizeDb(seed())), '2026-10-12');
  const existing = {...full, demoBillingVersion:1};
  existing.invoices[0] = {...existing.invoices[0], remarks:'User edit'};
  const out = upgradeDemoBilling(existing, '2026-11-01');
  assert.deepEqual(out.invoices, existing.invoices);
  assert.deepEqual(out.students, existing.students);
  assert.deepEqual(out.ledger, existing.ledger);
  assert.equal(upgradeDemoBilling(out), out);
});
