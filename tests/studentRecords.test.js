import { test } from 'node:test';
import assert from 'node:assert/strict';
import { studentLessonStatus } from '../src/studentLessonStatus.js';
const session = { date: '2026-10-12', start: '14:00', end: '15:00', status: 'scheduled' };
test('student records distinguish reserved, in-progress and unconfirmed past lessons using Hong Kong time', () => {
  for (const [time, label] of [['05:59:59', '已預約'], ['06:00:00', '正在上課'], ['06:59:59', '正在上課'], ['07:00:00', '待確認考勤']]) {
    assert.equal(studentLessonStatus(session, 's1', Date.parse(`2026-10-12T${time}Z`)).label, label);
  }
});
test('attendance and cancellations override the clock; leave is per student', () => {
  const now = Date.parse('2026-10-12T06:30:00Z');
  assert.equal(studentLessonStatus({ ...session, status: 'completed', attendance: { s1: 'present' } }, 's1', now).label, '已上課');
  assert.equal(studentLessonStatus({ ...session, status: 'completed', attendance: { s1: 'absent' } }, 's1', now).label, '缺席');
  assert.equal(studentLessonStatus({ ...session, status: 'cancelled' }, 's1', now).label, '已取消');
  const excused = { ...session, excused: [{ studentId: 's1' }] };
  assert.equal(studentLessonStatus(excused, 's1', now).label, '已請假');
  assert.equal(studentLessonStatus(excused, 's2', now).label, '正在上課');
});
