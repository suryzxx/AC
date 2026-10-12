// Scheduled times are Hong Kong local times; attendance remains authoritative.
export function studentLessonStatus(session, studentId, now = Date.now()) {
  if (session.excused?.some(e => e.studentId === studentId) || session.attendance?.[studentId] === 'leave') return { label: '已請假', color: 'orange' };
  if (session.status === 'cancelled') return { label: '已取消', color: 'default' };
  if (session.attendance?.[studentId] === 'absent') return { label: '缺席', color: 'orange' };
  if (session.pendingConsumption && session.attendance?.[studentId] === 'present') return { label: '出勤 · 待確認課銷', color: 'gold' };
  if (session.status === 'completed') return { label: '已上課', color: 'green' };
  const start = Date.parse(`${session.date}T${session.start}:00+08:00`);
  const end = Date.parse(`${session.date}T${session.end}:00+08:00`);
  if (now >= start && now < end) return { label: '正在上課', color: 'blue' };
  if (now >= end) return { label: '待確認考勤', color: 'gold' };
  return { label: '已預約', color: 'default' };
}
