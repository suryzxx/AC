// Legacy courses retain their flat per-lesson price until duration rates are saved.
export function courseRates(course) {
  if (!course) return [];
  return course.rates?.length ? course.rates : [{ durationMinutes: 60, price: course.price }];
}
export function coursePrice(course, durationMinutes) {
  if (!course) return null;
  if (!course.rates?.length) return course.price ?? null;
  return course.rates.find(r => r.durationMinutes === durationMinutes)?.price ?? null;
}
export function validateCourseRates(rates) {
  if (!rates?.length) return '請至少設定一個時長價格';
  if (rates.some(r => !Number.isInteger(r.durationMinutes) || r.durationMinutes <= 0 || !Number.isFinite(r.price) || r.price < 0)) return '請填寫有效的課堂時長及價格';
  if (new Set(rates.map(r => r.durationMinutes)).size !== rates.length) return '課堂時長不可重複';
  return '';
}
