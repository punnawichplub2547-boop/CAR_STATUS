import type { Employee } from '../types';

const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location.port === '5173') {
    return 'http://localhost:4002';
  }
  return '';
};

const API_BASE_URL = getApiBaseUrl();

const TOKEN_KEY = 'hrskill_jwt_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function removeStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export interface AuthLoginResponse {
  token: string;
  user: BackendEmployee;
}

export async function loginApi(identifier: string, password: string): Promise<AuthLoginResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.message || `เข้าสู่ระบบไม่สำเร็จ (HTTP ${res.status})`);
  }
  const data: AuthLoginResponse = await res.json();
  setStoredToken(data.token);
  return data;
}

export async function getMeApi(token?: string): Promise<BackendEmployee> {
  const authToken = token || getStoredToken();
  if (!authToken) {
    throw new Error('No auth token found');
  }
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.message || `ตรวจสอบ Session ไม่สำเร็จ (HTTP ${res.status})`);
  }
  const data = await res.json();
  return data.user;
}

export async function changePasswordApi(oldPassword: string, newPassword: string): Promise<string> {
  const token = getStoredToken();
  if (!token) {
    throw new Error('กรุณาเข้าสู่ระบบก่อนเปลี่ยนรหัสผ่าน');
  }
  const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || `เปลี่ยนรหัสผ่านไม่สำเร็จ (HTTP ${res.status})`);
  }
  return data?.message || 'เปลี่ยนรหัสผ่านสำเร็จ';
}

export interface BackendCertificate {
  id: number;
  employeeId: number | null;
  empCode: string;
  employeeName: string;
  department: string;
  position: string;
  certName: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  certNumber: string | null;
  attachmentUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CertificatePayload {
  empCode: string;
  employeeName: string;
  department?: string;
  position?: string;
  certName: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  certNumber?: string;
  attachmentUrl?: string;
}

export async function fetchBackendCertificates(empCode?: string): Promise<BackendCertificate[]> {
  const url = empCode
    ? `${API_BASE_URL}/api/certificates?empCode=${encodeURIComponent(empCode)}`
    : `${API_BASE_URL}/api/certificates`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`โหลดข้อมูล Certificate ไม่สำเร็จ (HTTP ${res.status})`);
  }
  return res.json();
}

export async function createBackendCertificate(payload: CertificatePayload): Promise<BackendCertificate> {
  const res = await fetch(`${API_BASE_URL}/api/certificates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `เพิ่ม Certificate ไม่สำเร็จ (HTTP ${res.status})`);
  }
  return res.json();
}

export async function updateBackendCertificate(id: number | string, payload: Partial<CertificatePayload>): Promise<BackendCertificate> {
  const res = await fetch(`${API_BASE_URL}/api/certificates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `แก้ไข Certificate ไม่สำเร็จ (HTTP ${res.status})`);
  }
  return res.json();
}

export async function deleteBackendCertificate(id: number | string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/certificates/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`ลบ Certificate ไม่สำเร็จ (HTTP ${res.status})`);
  }
}

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

export interface BackendEmployee {
  id: number;
  empCode: string;
  name: string;
  email: string | null;
  department: string;
  section: string | null;
  position: string;
  startingDate: string;
  status: string;
  orientationPassed: boolean;
  role: string;
  avatar: string | null;
  supervisorId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeePayload {
  empCode: string;
  name: string;
  email?: string;
  department: string;
  section?: string;
  position: string;
  startingDate: string; // YYYY-MM-DD
  status?: string;
  role?: string;
  avatar?: string;
  supervisorId?: number | null;
}

export async function fetchBackendEmployees(): Promise<BackendEmployee[]> {
  const res = await fetch(`${API_BASE_URL}/api/employees`);
  if (!res.ok) {
    throw new Error(`โหลดรายชื่อพนักงานไม่สำเร็จ (HTTP ${res.status})`);
  }
  return res.json();
}

// Employee is DB-backed (like SkillStandard) — this is the sole source of
// truth, not a best-effort mirror of local state.
export async function createBackendEmployee(payload: EmployeePayload): Promise<BackendEmployee> {
  const res = await fetch(`${API_BASE_URL}/api/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `เพิ่มพนักงานไม่สำเร็จ (HTTP ${res.status})`);
  }
  return res.json();
}

export async function updateBackendEmployee(id: number, payload: EmployeePayload): Promise<BackendEmployee> {
  const res = await fetch(`${API_BASE_URL}/api/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `แก้ไขพนักงานไม่สำเร็จ (HTTP ${res.status})`);
  }
  return res.json();
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
  evaluationMethod: string;
  hasAttachment?: boolean;
  purposeType?: string;
  changeReasonCategory?: string;
  assessorName: string;
  managerName: string;
  contentItems: {
    sequence: number;
    description: string;
    trainingDate?: string;
    timeFrom?: string;
    timeTo?: string;
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

export interface BackendOjtContentItem {
  id: number;
  sessionId: number;
  sequence: number;
  description: string;
  trainingDate: string | null;
  timeFrom: string | null;
  timeTo: string | null;
  resultPercent: number | null;
  remark: string | null;
}

export interface BackendOjtParticipant {
  id: number;
  sessionId: number;
  empCode: string;
  employeeId: number | null;
  employeeName: string;
  preScore: number | null;
  postScore: number | null;
  instructorScorePercent: number;
  isPassed: boolean;
  remarks: string | null;
}

export interface BackendOjtSession {
  id: number;
  formType: string;
  department: string;
  position: string;
  evaluationMethod: string;
  hasAttachment: boolean;
  purposeType: string | null;
  changeReasonCategory: string | null;
  assessorName: string;
  managerName: string;
  createdAt: string;
  contentItems: BackendOjtContentItem[];
  participants: BackendOjtParticipant[];
}

// F-HR-004 OJT sessions are DB-backed — GET /ojt-sessions already returns
// each session with its content items and participants nested.
export async function fetchBackendOjtSessions(empCode?: string): Promise<BackendOjtSession[]> {
  const url = empCode
    ? `${API_BASE_URL}/api/ojt-sessions?empCode=${encodeURIComponent(empCode)}`
    : `${API_BASE_URL}/api/ojt-sessions`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`โหลดประวัติการอบรม OJT ไม่สำเร็จ (HTTP ${res.status})`);
  }
  return res.json();
}

export async function createBackendOjtSession(payload: CreateOjtSessionPayload): Promise<BackendOjtSession> {
  const res = await fetch(`${API_BASE_URL}/api/ojt-sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `บันทึกผล OJT เข้าระบบ backend ไม่สำเร็จ (HTTP ${res.status})`);
  }
  return res.json();
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
  outcome?: string;
  comments?: string;
  assessorName: string;
}

export interface BackendProbationEvaluation {
  id: number;
  empCode: string;
  employeeId: number | null;
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
  outcome: string | null;
  comments: string | null;
  assessorName: string;
  createdAt: string;
}

// F-HR-009 probation evaluations are DB-backed — GET /probation-evaluations
// already exists (optional ?empCode= filter, flat rows, no nested children).
export async function fetchBackendProbationEvaluations(empCode?: string): Promise<BackendProbationEvaluation[]> {
  const url = empCode
    ? `${API_BASE_URL}/api/probation-evaluations?empCode=${encodeURIComponent(empCode)}`
    : `${API_BASE_URL}/api/probation-evaluations`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`โหลดประวัติการประเมินทดลองงานไม่สำเร็จ (HTTP ${res.status})`);
  }
  return res.json();
}

export async function createBackendProbationEvaluation(payload: CreateProbationEvaluationPayload): Promise<BackendProbationEvaluation> {
  const res = await fetch(`${API_BASE_URL}/api/probation-evaluations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `บันทึกผลประเมินทดลองงานเข้าระบบ backend ไม่สำเร็จ (HTTP ${res.status})`);
  }
  return res.json();
}

export interface BackendSkillStandard {
  id: number;
  department: string;
  position: string;
  category: string;
  skillName: string;
  targetLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillStandardPayload {
  department: string;
  position: string;
  category: string;
  skillName: string;
  targetLevel: number;
}

// F-HR-005 skill standards are DB-backed (unlike Employee/OJT/Probation,
// which are localStorage-first with a best-effort backend mirror) — this is
// the sole source of truth, so App.tsx fetches on mount and every CRUD op
// round-trips through here before local state updates.
export async function fetchBackendSkillStandards(): Promise<BackendSkillStandard[]> {
  const res = await fetch(`${API_BASE_URL}/api/skill-standards`);
  if (!res.ok) {
    throw new Error(`โหลดมาตรฐานทักษะไม่สำเร็จ (HTTP ${res.status})`);
  }
  return res.json();
}

export async function createBackendSkillStandard(payload: SkillStandardPayload): Promise<BackendSkillStandard> {
  const res = await fetch(`${API_BASE_URL}/api/skill-standards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `เพิ่มมาตรฐานทักษะไม่สำเร็จ (HTTP ${res.status})`);
  }
  return res.json();
}

export async function updateBackendSkillStandard(id: number, payload: SkillStandardPayload): Promise<BackendSkillStandard> {
  const res = await fetch(`${API_BASE_URL}/api/skill-standards/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `แก้ไขมาตรฐานทักษะไม่สำเร็จ (HTTP ${res.status})`);
  }
  return res.json();
}

export async function deleteBackendSkillStandard(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/skill-standards/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `ลบมาตรฐานทักษะไม่สำเร็จ (HTTP ${res.status})`);
  }
}

export interface BackendSkillEvaluation {
  id: number;
  employeeId: number | null;
  employeeName: string;
  department: string;
  position: string;
  skillName: string;
  category: string;
  targetLevel: number;
  resultLevel: number;
  cycle: string;
  attemptNumber: number;
  evaluatedAt: string;
  assessorName: string;
  remark: string | null;
}

export interface SkillEvaluationPayload {
  employeeId: number;
  employeeName: string;
  department: string;
  position: string;
  skillName: string;
  category: string;
  targetLevel: number;
  resultLevel: number;
  cycle: string;
  attemptNumber: number;
  evaluatedAt: string; // YYYY-MM-DD
  assessorName: string;
  remark?: string;
}

// F-HR-014 scores are DB-backed — POST always upserts by the natural key
// (employeeId + skillName + cycle + attemptNumber), so the same call is
// used whether this is the first score or a correction to an existing one.
export async function fetchBackendSkillEvaluations(employeeId?: number): Promise<BackendSkillEvaluation[]> {
  const url = employeeId
    ? `${API_BASE_URL}/api/skill-evaluations?employeeId=${employeeId}`
    : `${API_BASE_URL}/api/skill-evaluations`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`โหลดผลประเมินทักษะไม่สำเร็จ (HTTP ${res.status})`);
  }
  return res.json();
}

export async function saveBackendSkillEvaluation(payload: SkillEvaluationPayload): Promise<BackendSkillEvaluation> {
  const res = await fetch(`${API_BASE_URL}/api/skill-evaluations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `บันทึกผลประเมินทักษะไม่สำเร็จ (HTTP ${res.status})`);
  }
  return res.json();
}

export interface BackendSkillEvaluationRound {
  id: number;
  employeeId: number | null;
  cycle: string;
  attemptNumber: number;
  actionPeriodFrom: string | null;
  actionPeriodTo: string | null;
  assessorName: string;
  assessorSignature: string | null;
  deptManagerName: string | null;
  deptManagerSignature: string | null;
  hrDeptName: string | null;
  hrDeptSignature: string | null;
  signedAt: string | null;
}

export interface SkillEvaluationRoundPayload {
  employeeId: number;
  cycle: string;
  attemptNumber: number;
  actionPeriodFrom?: string;
  actionPeriodTo?: string;
  assessorName: string;
  assessorSignature?: string;
  deptManagerName?: string;
  deptManagerSignature?: string;
  hrDeptName?: string;
  hrDeptSignature?: string;
  signedAt?: string;
}

// Same upsert-by-natural-key pattern as skill evaluations above, keyed on
// employeeId + cycle + attemptNumber.
export async function fetchBackendSkillEvaluationRounds(employeeId?: number): Promise<BackendSkillEvaluationRound[]> {
  const url = employeeId
    ? `${API_BASE_URL}/api/skill-evaluation-rounds?employeeId=${employeeId}`
    : `${API_BASE_URL}/api/skill-evaluation-rounds`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`โหลดรอบการประเมินทักษะไม่สำเร็จ (HTTP ${res.status})`);
  }
  return res.json();
}

export async function saveBackendSkillEvaluationRound(
  payload: SkillEvaluationRoundPayload
): Promise<BackendSkillEvaluationRound> {
  const res = await fetch(`${API_BASE_URL}/api/skill-evaluation-rounds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `บันทึกรอบการประเมินทักษะไม่สำเร็จ (HTTP ${res.status})`);
  }
  return res.json();
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
        // Backend upserts on empCode and falls back to role='EMPLOYEE',
        // avatar/supervisorId=null when these are omitted — leaving them out
        // here silently reset every existing employee's role back to
        // EMPLOYEE (and wiped avatar/supervisorId) on every sync.
        role: emp.role,
        avatar: emp.avatar,
        supervisorId: emp.supervisorId != null ? Number(emp.supervisorId) : null,
      }).catch(() => { });
    }
  } catch (e) {
    console.warn('Background auto-sync employees to backend failed silently:', e);
  }
}
