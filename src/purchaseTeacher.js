// Newest paid, active purchase for this student and course supplies a suggestion.
// A group gets a default only when every student's preference agrees.
export function purchasedTeacher(db, studentIds, courseId) {
  if (!studentIds.length) return '';
  const preferences = studentIds.map(studentId => {
    const purchase = db.invoices.find(i => i.studentId === studentId && i.source === 'package' && i.paid && !i.voided && i.teacherId && (i.courseId === courseId || i.lines?.some(l => l.courseId === courseId)));
    const teacher = db.teachers.find(t => t.id === purchase?.teacherId);
    return teacher?.subjects.includes(courseId) ? teacher.id : '';
  });
  return preferences[0] && preferences.every(id => id === preferences[0]) ? preferences[0] : '';
}
