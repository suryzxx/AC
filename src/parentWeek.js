import { dateAdd, mins } from './model.js';
export function weekDates(date) {
  const weekday = new Date(`${date}T12:00:00+08:00`).getUTCDay();
  const monday = dateAdd(date, -((weekday + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => dateAdd(monday, i));
}
export function calendarBounds(sessions) {
  return { start: Math.min(8 * 60, ...sessions.map(s => Math.floor(mins(s.start) / 60) * 60)), end: Math.max(20 * 60, ...sessions.map(s => Math.ceil(mins(s.end) / 60) * 60)) };
}
export function calendarState(session, studentId, now = Date.now()) {
  if (session.status === 'cancelled') return { key: 'cancelled', label: '已取消' };
  if (session.excused?.some(e => e.studentId === studentId) || ['absent','leave'].includes(session.attendance?.[studentId])) return { key: 'absent', label: session.attendance?.[studentId] === 'absent' ? '缺勤' : '已請假' };
  if (session.status === 'completed') return { key: 'completed', label: '已完成' };
  const start = Date.parse(`${session.date}T${session.start}:00+08:00`), end = Date.parse(`${session.date}T${session.end}:00+08:00`);
  if (now >= start && now < end) return { key: 'ongoing', label: '進行中' };
  if (now >= end) return { key: 'pending', label: '待確認' };
  return { key: 'upcoming', label: '未開始' };
}
