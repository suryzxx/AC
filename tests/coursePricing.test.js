import { test } from 'node:test';
import assert from 'node:assert/strict';
import { courseRates, coursePrice, validateCourseRates } from '../src/coursePricing.js';
import { lessonCharge } from '../src/model.js';
const course = { id: 'c1', rates: [{ durationMinutes: 60, price: 200 }, { durationMinutes: 90, price: 280 }] };
test('duration selects the exact price and survives persistence', () => {
  const saved = JSON.parse(JSON.stringify(course));
  assert.equal(coursePrice(saved, 60), 200);
  assert.equal(coursePrice(saved, 90), 280);
  assert.equal(coursePrice(saved, 120), null);
  assert.equal(coursePrice({ price: 300 }, 90), 300);
  assert.deepEqual(courseRates({ price: 300 }), [{ durationMinutes: 60, price: 300 }]);
});
test('rates require prices and unique positive durations while allowing zero price', () => {
  assert.ok(validateCourseRates([{ durationMinutes: 60, price: null }]));
  assert.ok(validateCourseRates([...course.rates, course.rates[0]]));
  assert.ok(validateCourseRates([{ durationMinutes: 0, price: 200 }]));
  assert.equal(validateCourseRates([{ durationMinutes: 60, price: 0 }]), '');
});
test('new lesson charges use duration and existing agreed prices remain frozen', () => {
  const db = { courses: [course], students: [{ id: 's1', mode: 'package' }] };
  const lesson = { courseId: 'c1', start: '09:00', end: '10:30' };
  assert.equal(lessonCharge(db, lesson, 's1').unitPrice, 280);
  assert.equal(lessonCharge(db, { ...lesson, charges: { s1: { unitPrice: 250 } } }, 's1').unitPrice, 250);
});
