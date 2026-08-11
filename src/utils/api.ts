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

export interface CreateOjtSessionPayload {
  formType: string;
  department: string;
  position: string;
  courseName: string;
  instructor: string;
  location: string;
  trainingDateFrom: string;
  trainingDateTo: string;
  timeRange: string;
  evaluationMethod: string;
  hasAttachment?: boolean;
  purposeType?: string;
  changeReasonCategory?: string;
  assessorName: string;
  managerName: string;
  contentItems: {
    sequence: number;
    description: string;
    instructorSignedDate?: string;
    resultPercent?: number;
    remark?: string;
  }[];
  participants: {
    empCode: string;
    employeeName: string;
    preScore?: number;
    postScore?: number;
    instructorScorePercent: number;
    isPassed: boolean;
    remarks?: string;
  }[];
}

// Mirrors a newly-saved OJT session (F-HR-004) into the backend — same
// best-effort pattern as createBackendEmployee. The app's own OJT state
// (localStorage) stays the source of truth.
export async function createBackendOjtSession(payload: CreateOjtSessionPayload): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/ojt-sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `บันทึกผล OJT เข้าระบบ backend ไม่สำเร็จ (HTTP ${res.status})`);
  }
}

export interface CreateProbationEvaluationPayload {
  empCode: string;
  employeeName: string;
  department: string;
  position: string;
  period: string;
  startingDate: string;
  evalDate: string;
  knowledge: number;
  diligence: number;
  responsibility: number;
  teamwork: number;
  attitude: number;
  regulationCompliance: number;
  problemSolving: number;
  learningAbility: number;
  ppeUse: number;
  activityParticipation: number;
  criteriaTotalScore: number;
  criteriaPercentage: number;
  attendancePercentage: number;
  resultScore: number;
  grade: string;
  isPassed: boolean;
  comments?: string;
  assessorName: string;
}

// Mirrors a newly-saved probation evaluation (F-HR-009) into the backend —
// same best-effort pattern as createBackendEmployee.
export async function createBackendProbationEvaluation(payload: CreateProbationEvaluationPayload): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/probation-evaluations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `บันทึกผลประเมินทดลองงานเข้าระบบ backend ไม่สำเร็จ (HTTP ${res.status})`);
  }
}
