/**
 * Utility functions for date formatting and tenure calculations
 */

export function calculateTenure(startingDateStr?: string): string {
  if (!startingDateStr) return '-';
  const start = new Date(startingDateStr);
  const now = new Date();
  if (isNaN(start.getTime())) return '-';

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 0) return 'เพิ่งเริ่มงาน';

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ปี`);
  if (months > 0) parts.push(`${months} เดือน`);
  if (years === 0 && months === 0) parts.push(`${Math.max(1, days)} วัน`);

  return parts.join(' ');
}
