import type { SkillStandard, Employee } from '../types';

/**
 * Robustly matches an employee to their corresponding F-HR-005 skill standards.
 * Handles minor naming variations (e.g. "พนักงานทั่วไป (ยางรถยนต์)" vs "พนักงานทั่วไป",
 * or "เจ้าหน้าที่ จป.อาวุโส" vs "เจ้าหน้าที่ (จป.อาวุโส)").
 */
export function matchEmployeeStandards(standards: SkillStandard[], emp: Employee | null | undefined): SkillStandard[] {
  if (!emp || !standards || standards.length === 0) return [];

  // 1. Exact match: department and position
  const exact = standards.filter((s) => s.department === emp.department && s.position === emp.position);
  if (exact.length > 0) return exact;

  // 2. Normalized match: strip parentheses and outer whitespace
  // e.g. "พนักงานทั่วไป (ยางรถยนต์)" -> "พนักงานทั่วไป"
  // e.g. "เจ้าหน้าที่ จป.อาวุโส" vs "เจ้าหน้าที่ (จป.อาวุโส)"
  const cleanEmpPos = emp.position.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  const byClean = standards.filter((s) => {
    if (s.department !== emp.department) return false;
    const cleanStdPos = s.position.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    return cleanStdPos === cleanEmpPos;
  });
  if (byClean.length > 0) return byClean;

  // 3. Substring containment match within the same department
  const bySubstring = standards.filter((s) => {
    if (s.department !== emp.department) return false;
    const stdPos = s.position.trim().toLowerCase();
    const empPos = emp.position.trim().toLowerCase();
    return empPos.includes(stdPos) || stdPos.includes(empPos);
  });
  if (bySubstring.length > 0) return bySubstring;

  // 4. Department-level fallback: if this department only has standards for a single position
  const deptStandards = standards.filter((s) => s.department === emp.department);
  if (deptStandards.length > 0) {
    const firstPos = deptStandards[0].position;
    if (deptStandards.every((s) => s.position === firstPos)) {
      return deptStandards;
    }
  }

  return [];
}
