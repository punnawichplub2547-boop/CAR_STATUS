import type { Employee } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export interface ExamCategoryStatus {
  attempted: true;
  isPassed: boolean;
  percentage: number;
  submittedAt: string;
}

export interface PendingOrientationEmployee {
  id: number;
  empCode: string;
  name: string;
  department: string;
  section: string | null;
  position: string;
  startingDate: string;
  status: string;
  orientationPassed: boolean;
  examStatus: {
    REGULATION: ExamCategoryStatus | null;
    SAFETY: ExamCategoryStatus | null;
  };
}

export async function fetchPendingOrientationEmployees(): Promise<PendingOrientationEmployee[]> {
  const res = await fetch(`${API_BASE_URL}/api/employees/pending-orientation`);
  if (!res.ok) {
    throw new Error(`โหลดรายชื่อพนักงานใหม่ไม่สำเร็จ (HTTP ${res.status})`);
  }
  return res.json();
}

export interface CreateBackendEmployeePayload {
  empCode: string;
  name: string;
  email?: string;
  department: string;
  section?: string;
  position: string;
  startingDate: string; // YYYY-MM-DD
  status?: string;
}

// Mirrors a newly-added employee into the backend so they show up in
// /api/employees/pending-orientation (F-HR-002 name list) and can be matched
// against Google Form exam submissions by empCode. The app's own employee
// list (localStorage) stays the source of truth for everything else.
export async function createBackendEmployee(payload: CreateBackendEmployeePayload): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `บันทึกพนักงานเข้าระบบ backend ไม่สำเร็จ (HTTP ${res.status})`);
  }
}

export async function updateBackendEmployee(id: number, payload: CreateBackendEmployeePayload): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `แก้ไขพนักงานไม่สำเร็จ (HTTP ${res.status})`);
  }
}

export async function deleteBackendEmployee(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/employees/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `ลบพนักงานไม่สำเร็จ (HTTP ${res.status})`);
  }
}

// Auto background sync: ensures every employee in localStorage is mirrored into
// the MySQL database so MySQL DB and localStorage are always 100% in sync.
export async function syncLocalStorageEmployeesToBackend(): Promise<void> {
  try {
    const saved = localStorage.getItem('hrskill_employees');
    if (!saved) return;
    const empList: Partial<Employee>[] = JSON.parse(saved);

    for (const emp of empList) {
      if (!emp.empCode || !emp.name || !emp.department || !emp.position) continue;
      await createBackendEmployee({
        empCode: emp.empCode,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        section: emp.section,
        position: emp.position,
        startingDate: emp.startingDate || new Date().toISOString().slice(0, 10),
        status: emp.status || 'PROBATION',
      }).catch(() => { });
    }
  } catch (e) {
    console.warn('Background auto-sync employees to backend failed silently:', e);
  }
}
