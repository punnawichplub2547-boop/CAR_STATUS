import { useState, useEffect, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import type { NavTab } from './components/Sidebar';
import { TestLoginModal } from './components/TestLoginModal';
import { LoginView } from './components/LoginView';
import { ErrorBoundary } from './components/ErrorBoundary';

// Only one tab is on screen at a time, so each page is loaded on demand. This
// keeps recharts (Dashboard / Skill Matrix), xlsx (Audit / Exam) and jszip
// (Skill Matrix / Training) out of the first download — HR opening the app no
// longer waits for the Excel machinery of tabs they may never visit.
const Dashboard = lazy(() => import('./components/Dashboard').then((m) => ({ default: m.Dashboard })));
const EmployeeManagement = lazy(() =>
  import('./components/EmployeeManagement').then((m) => ({ default: m.EmployeeManagement }))
);
const TrainingManagement = lazy(() =>
  import('./components/TrainingManagement').then((m) => ({ default: m.TrainingManagement }))
);
const OjtFormAEvaluator = lazy(() => import('./components/OjtFormAEvaluator').then((m) => ({ default: m.OjtFormAEvaluator })));
const OjtFormBEvaluator = lazy(() => import('./components/OjtFormBEvaluator').then((m) => ({ default: m.OjtFormBEvaluator })));
const ProbationEvaluator = lazy(() => import('./components/ProbationEvaluator').then((m) => ({ default: m.ProbationEvaluator })));
const SkillMatrixView = lazy(() => import('./components/SkillMatrixView').then((m) => ({ default: m.SkillMatrixView })));
const CertificateVault = lazy(() => import('./components/CertificateVault').then((m) => ({ default: m.CertificateVault })));
const ExamEngine = lazy(() => import('./components/ExamEngine').then((m) => ({ default: m.ExamEngine })));
const AuditReportExporter = lazy(() =>
  import('./components/AuditReportExporter').then((m) => ({ default: m.AuditReportExporter }))
);

function PageLoading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        minHeight: 320,
        color: 'var(--text-muted)',
      }}
    >
      <Loader2 size={28} className="spin" />
      <span style={{ fontSize: '0.9rem' }}>กำลังโหลดหน้า...</span>
    </div>
  );
}
import { computeCertificateStatus } from './utils/certificateStatus';
import { SkillStandardManagement } from './components/SkillStandardManagement';
import { OjtHistoryView } from './components/OjtHistoryView';
import { ProbationHistoryView } from './components/ProbationHistoryView';
import {
  fetchBackendEmployees,
  createBackendEmployee,
  updateBackendEmployee,
  deleteBackendEmployee,
  fetchBackendOjtSessions,
  createBackendOjtSession,
  fetchBackendProbationEvaluations,
  createBackendProbationEvaluation,
  fetchBackendSkillStandards,
  createBackendSkillStandard,
  updateBackendSkillStandard,
  deleteBackendSkillStandard,
  fetchBackendSkillEvaluations,
  saveBackendSkillEvaluation,
  fetchBackendSkillEvaluationRounds,
  saveBackendSkillEvaluationRound,
  type EmployeePayload,
  type BackendEmployee,
  type BackendOjtSession,
  type BackendProbationEvaluation,
  type BackendSkillEvaluation,
  type BackendSkillEvaluationRound,
  type SkillStandardPayload,
} from './utils/api';

import {
  INITIAL_CERTIFICATES,
  INITIAL_COURSES,
  INITIAL_NOTIFICATIONS,
  INITIAL_ORG_CHART_NODES,
} from './data/mockData';

import type { Employee, OjtSession, OjtContentItem, OjtParticipant, ProbationEvaluation, Certificate, SkillEvaluation, SkillEvaluationRound, TrainingCourse, NotificationItem, OrgChartNode, SkillStandard, SkillLevel, EmploymentStatus, Role, OjtFormType, OjtEvaluationMethod, OjtPurposeType, OjtChangeReasonCategory, ProbationPeriod, ProbationGrade, ProbationOutcome, EvaluationCycle, EvaluationAttempt } from './types';

const DEFAULT_AVATAR_URL =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

function mapBackendEmployee(row: BackendEmployee, existingEmployees: Employee[]): Employee {
  const supervisorIdStr = row.supervisorId != null ? String(row.supervisorId) : undefined;
  return {
    id: String(row.id),
    empCode: row.empCode,
    name: row.name,
    email: row.email ?? '',
    department: row.department,
    section: row.section ?? '',
    position: row.position,
    startingDate: row.startingDate.slice(0, 10),
    status: row.status as EmploymentStatus,
    avatar: row.avatar ?? DEFAULT_AVATAR_URL,
    role: row.role as Role,
    supervisorId: supervisorIdStr,
    supervisorName: supervisorIdStr ? existingEmployees.find((e) => e.id === supervisorIdStr)?.name : undefined,
  };
}

// Flattens a nested BackendOjtSession (session + contentItems + participants)
// into the three parallel flat arrays the rest of the app already expects
// (AuditReportExporter etc. do a plain client-side join by sessionId).
function flattenBackendOjtSession(row: BackendOjtSession): {
  session: OjtSession;
  contentItems: OjtContentItem[];
  participants: OjtParticipant[];
} {
  const sessionId = String(row.id);
  return {
    session: {
      id: sessionId,
      formType: row.formType as OjtFormType,
      department: row.department,
      position: row.position,
      evaluationMethod: row.evaluationMethod as OjtEvaluationMethod,
      hasAttachment: row.hasAttachment,
      purposeType: row.purposeType != null ? (row.purposeType as OjtPurposeType) : undefined,
      changeReasonCategory: row.changeReasonCategory != null ? (row.changeReasonCategory as OjtChangeReasonCategory) : undefined,
      assessorName: row.assessorName,
      managerName: row.managerName,
      createdAt: row.createdAt,
    },
    contentItems: row.contentItems.map((c) => ({
      id: String(c.id),
      sessionId,
      sequence: c.sequence,
      description: c.description,
      trainingDate: c.trainingDate ?? undefined,
      timeFrom: c.timeFrom ?? undefined,
      timeTo: c.timeTo ?? undefined,
      resultPercent: c.resultPercent != null ? (c.resultPercent as SkillLevel) : undefined,
      remark: c.remark ?? undefined,
    })),
    participants: row.participants.map((p) => ({
      id: String(p.id),
      sessionId,
      employeeId: p.employeeId != null ? String(p.employeeId) : '',
      employeeName: p.employeeName,
      empCode: p.empCode,
      preScore: p.preScore ?? undefined,
      postScore: p.postScore ?? undefined,
      instructorScorePercent: p.instructorScorePercent as SkillLevel,
      isPassed: p.isPassed,
      remarks: p.remarks ?? undefined,
    })),
  };
}

// Re-nests the backend's 10 flat score columns back into the frontend's
// `scores` object shape.
function mapBackendProbationEvaluation(row: BackendProbationEvaluation): ProbationEvaluation {
  return {
    id: String(row.id),
    employeeId: row.employeeId != null ? String(row.employeeId) : '',
    employeeName: row.employeeName,
    empCode: row.empCode,
    department: row.department,
    position: row.position,
    period: row.period as ProbationPeriod,
    startingDate: row.startingDate.slice(0, 10),
    evalDate: row.evalDate.slice(0, 10),
    scores: {
      knowledge: row.knowledge,
      diligence: row.diligence,
      responsibility: row.responsibility,
      teamwork: row.teamwork,
      attitude: row.attitude,
      regulationCompliance: row.regulationCompliance,
      problemSolving: row.problemSolving,
      learningAbility: row.learningAbility,
      ppeUse: row.ppeUse,
      activityParticipation: row.activityParticipation,
    },
    criteriaTotalScore: row.criteriaTotalScore,
    criteriaPercentage: row.criteriaPercentage,
    attendancePercentage: row.attendancePercentage,
    resultScore: row.resultScore,
    grade: row.grade as ProbationGrade,
    isPassed: row.isPassed,
    outcome: row.outcome != null ? (row.outcome as ProbationOutcome) : undefined,
    comments: row.comments ?? '',
    assessorName: row.assessorName,
    createdAt: row.createdAt,
  };
}

// roundId isn't stored server-side (SkillEvaluationRound is looked up by
// employeeId+cycle+attemptNumber, not by this string) — it's reconstructed
// here purely because SkillMatrixView's existing UI groups scores by it.
function mapBackendSkillEvaluation(row: BackendSkillEvaluation): SkillEvaluation {
  const employeeId = row.employeeId != null ? String(row.employeeId) : '';
  return {
    id: String(row.id),
    roundId: `${employeeId}_${row.cycle}_${row.attemptNumber}`,
    employeeId,
    employeeName: row.employeeName,
    position: row.position,
    department: row.department,
    skillName: row.skillName,
    category: row.category,
    targetLevel: row.targetLevel as SkillLevel,
    resultLevel: row.resultLevel as SkillLevel,
    cycle: row.cycle as EvaluationCycle,
    attemptNumber: row.attemptNumber as EvaluationAttempt,
    evaluatedAt: row.evaluatedAt.slice(0, 10),
    assessorName: row.assessorName,
    remark: row.remark ?? undefined,
  };
}

function mapBackendSkillEvaluationRound(row: BackendSkillEvaluationRound): SkillEvaluationRound {
  const employeeId = row.employeeId != null ? String(row.employeeId) : '';
  return {
    id: String(row.id),
    employeeId,
    cycle: row.cycle as EvaluationCycle,
    attemptNumber: row.attemptNumber as EvaluationAttempt,
    actionPeriodFrom: row.actionPeriodFrom?.slice(0, 10) ?? '',
    actionPeriodTo: row.actionPeriodTo?.slice(0, 10) ?? '',
    assessorName: row.assessorName,
    assessorSignature: row.assessorSignature ?? undefined,
    deptManagerName: row.deptManagerName ?? '',
    deptManagerSignature: row.deptManagerSignature ?? undefined,
    hrDeptName: row.hrDeptName ?? '',
    hrDeptSignature: row.hrDeptSignature ?? undefined,
    signedAt: row.signedAt?.slice(0, 10) ?? undefined,
  };
}

function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(`hrskill_${key}`);
      return saved ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`hrskill_${key}`, JSON.stringify(state));
    } catch (e) {
      console.error(`Failed to save hrskill_${key}`, e);
    }
  }, [key, state]);

  return [state, setState];
}

export function App() {
  // Employee/currentUser are DB-backed (like skillStandards below) — fetched
  // on mount, no localStorage seed for the object itself. Only the logged-in
  // empCode is persisted (a tiny string, not a stale full Employee snapshot)
  // so "who was logged in" survives a reload without re-showing LoginView.
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = usePersistentState<boolean>('is_logged_in', true);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [showTestLoginModal, setShowTestLoginModal] = useState(false);

  const persistCurrentUserEmpCode = (empCode: string) => {
    try {
      localStorage.setItem('hrskill_currentUserEmpCode', JSON.stringify(empCode));
    } catch (e) {
      console.error('Failed to save hrskill_currentUserEmpCode', e);
    }
  };

  // App Master States with Persistence
  const [skillStandards, setSkillStandards] = useState<SkillStandard[]>([]);
  const [skillStandardsError, setSkillStandardsError] = useState<string | null>(null);
  const [skillEvaluations, setSkillEvaluations] = useState<SkillEvaluation[]>([]);
  const [skillEvaluationRounds, setSkillEvaluationRounds] = useState<SkillEvaluationRound[]>([]);
  const [skillEvaluationsError, setSkillEvaluationsError] = useState<string | null>(null);
  const [ojtSessions, setOjtSessions] = useState<OjtSession[]>([]);
  const [ojtContentItems, setOjtContentItems] = useState<OjtContentItem[]>([]);
  const [ojtParticipants, setOjtParticipants] = useState<OjtParticipant[]>([]);
  const [ojtHistoryError, setOjtHistoryError] = useState<string | null>(null);
  const [probationEvaluations, setProbationEvaluations] = useState<ProbationEvaluation[]>([]);
  const [probationError, setProbationError] = useState<string | null>(null);
  const [certificates, setCertificates] = usePersistentState<Certificate[]>('certificates', INITIAL_CERTIFICATES);
  const [courses] = usePersistentState<TrainingCourse[]>('courses', INITIAL_COURSES);
  const [notifications, setNotifications] = usePersistentState<NotificationItem[]>('notifications', INITIAL_NOTIFICATIONS);
  const [orgChartNodes, setOrgChartNodes] = usePersistentState<OrgChartNode[]>('orgChartNodes', INITIAL_ORG_CHART_NODES);

  // F-HR-005 skill standards are DB-backed (unlike the localStorage-first
  // state above) — fetch once on mount. No fallback to stale mock data on
  // failure: an empty list + visible error banner is more honest than
  // silently showing hardcoded standards that no longer match the DB.
  useEffect(() => {
    fetchBackendSkillStandards()
      .then((rows) =>
        setSkillStandards(
          rows.map((r) => ({
            id: String(r.id),
            department: r.department,
            position: r.position,
            category: r.category,
            skillName: r.skillName,
            targetLevel: r.targetLevel as SkillLevel,
          }))
        )
      )
      .catch((err) => setSkillStandardsError(err instanceof Error ? err.message : 'unknown error'));
  }, []);

  // Employee roster — same DB-backed pattern as skillStandards above. No
  // fallback to mock data on failure: a visible error banner beats silently
  // showing employees that don't exist in the DB (their ids wouldn't resolve
  // against any real backend write anyway).
  useEffect(() => {
    fetchBackendEmployees()
      .then((rows) => {
        const basicList = rows.map((r) => mapBackendEmployee(r, []));
        const mapped = basicList.map((e) => ({
          ...e,
          supervisorName: e.supervisorId ? basicList.find((x) => x.id === e.supervisorId)?.name : undefined,
        }));
        setEmployees(mapped);

        let savedEmpCode: string | null = null;
        try {
          const raw = localStorage.getItem('hrskill_currentUserEmpCode');
          savedEmpCode = raw ? JSON.parse(raw) : null;
        } catch {
          savedEmpCode = null;
        }
        const reconciled =
          (savedEmpCode && mapped.find((e) => e.empCode === savedEmpCode)) ||
          mapped.find((e) => e.role === 'ADMIN') ||
          mapped[0] ||
          null;
        setCurrentUser(reconciled);
      })
      .catch((err) => setEmployeesError(err instanceof Error ? err.message : 'unknown error'));
  }, []);

  // F-HR-004 OJT sessions — same DB-backed pattern as skillStandards/
  // employees above. No fallback to mock data on failure.
  useEffect(() => {
    fetchBackendOjtSessions()
      .then((rows) => {
        const flattened = rows.map(flattenBackendOjtSession);
        setOjtSessions(flattened.map((f) => f.session));
        setOjtContentItems(flattened.flatMap((f) => f.contentItems));
        setOjtParticipants(flattened.flatMap((f) => f.participants));
      })
      .catch((err) => setOjtHistoryError(err instanceof Error ? err.message : 'unknown error'));
  }, []);

  // F-HR-009 probation evaluations — same DB-backed pattern as above.
  useEffect(() => {
    fetchBackendProbationEvaluations()
      .then((rows) => setProbationEvaluations(rows.map(mapBackendProbationEvaluation)))
      .catch((err) => setProbationError(err instanceof Error ? err.message : 'unknown error'));
  }, []);

  // F-HR-014 skill evaluations + sign-off rounds — same DB-backed pattern
  // as above.
  useEffect(() => {
    fetchBackendSkillEvaluations()
      .then((rows) => setSkillEvaluations(rows.map(mapBackendSkillEvaluation)))
      .catch((err) => setSkillEvaluationsError(err instanceof Error ? err.message : 'unknown error'));
    fetchBackendSkillEvaluationRounds()
      .then((rows) => setSkillEvaluationRounds(rows.map(mapBackendSkillEvaluationRound)))
      .catch((err) => setSkillEvaluationsError(err instanceof Error ? err.message : 'unknown error'));
  }, []);

  const handleAddSkillStandard = (payload: SkillStandardPayload) => {
    createBackendSkillStandard(payload)
      .then((row) =>
        setSkillStandards((prev) => [...prev, { id: String(row.id), ...payload, targetLevel: payload.targetLevel as SkillLevel }])
      )
      .catch((err) => window.alert(`เพิ่มมาตรฐานทักษะไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown error'}`));
  };

  const handleEditSkillStandard = (id: string, payload: SkillStandardPayload) => {
    updateBackendSkillStandard(Number(id), payload)
      .then(() =>
        setSkillStandards((prev) =>
          prev.map((s) => (s.id === id ? { id, ...payload, targetLevel: payload.targetLevel as SkillLevel } : s))
        )
      )
      .catch((err) => window.alert(`แก้ไขมาตรฐานทักษะไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown error'}`));
  };

  const handleDeleteSkillStandard = (id: string) => {
    deleteBackendSkillStandard(Number(id))
      .then(() => setSkillStandards((prev) => prev.filter((s) => s.id !== id)))
      .catch((err) => window.alert(`ลบมาตรฐานทักษะไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown error'}`));
  };

  // Reset Demo Data — employees, OJT sessions, skill standards, skill
  // evaluations, and probation evaluations are all DB-backed now, so this
  // only resets the still-localStorage-first collections (certificates,
  // courses, notifications, org chart layout).
  const handleResetDemoData = () => {
    if (
      window.confirm(
        'คุณต้องการรีเซ็ตข้อมูลตัวอย่าง (ใบรับรอง, ผังองค์กร) กลับเป็นค่าเริ่มต้นทั้งหมดหรือไม่?\n\nข้อมูลพนักงาน, ประวัติ OJT, ประวัติทดลองงาน และผลประเมินทักษะจะไม่ถูกรีเซ็ต (อยู่ในฐานข้อมูลกลางแล้ว)'
      )
    ) {
      const keys = ['certificates', 'courses', 'notifications', 'orgChartNodes', 'currentUserEmpCode'];
      keys.forEach((k) => localStorage.removeItem(`hrskill_${k}`));
      window.location.reload();
    }
  };

  // Handlers — Employee is DB-backed (like SkillStandard): the backend
  // response is the source of truth, not a local optimistic snapshot.
  const handleAddEmployee = (payload: EmployeePayload) => {
    createBackendEmployee(payload)
      .then((row) => setEmployees((prev) => [mapBackendEmployee(row, prev), ...prev]))
      .catch((err) => window.alert(`เพิ่มพนักงานไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown error'}`));
  };

  const handleEditEmployee = (id: string, payload: EmployeePayload) => {
    updateBackendEmployee(Number(id), payload)
      .then((row) => {
        setEmployees((prev) => {
          const updated = mapBackendEmployee(row, prev);
          return prev.map((e) => (e.id === id ? updated : e));
        });
        setCurrentUser((prev) => (prev?.id === id ? mapBackendEmployee(row, employees) : prev));
      })
      .catch((err) => window.alert(`แก้ไขพนักงานไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown error'}`));
  };

  const handleDeleteEmployee = (id: string) => {
    deleteBackendEmployee(Number(id))
      .then(() => setEmployees((prev) => prev.filter((e) => e.id !== id)))
      .catch((err) => window.alert(`ลบพนักงานไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown error'}`));
  };

  const handleAddOjtSession = (
    session: OjtSession,
    contentItems: OjtContentItem[],
    participants: OjtParticipant[]
  ) => {
    // Optimistic local update first so the form's instant "saved!" feedback
    // doesn't wait on the network — then reconcile with the real DB-assigned
    // ids once the backend responds (same end state as handleAddEmployee/
    // handleAddSkillStandard, just deferred to keep the form's existing UX).
    const tempSessionId = session.id;
    setOjtSessions((prev) => [session, ...prev]);
    setOjtContentItems((prev) => [...contentItems, ...prev]);
    setOjtParticipants((prev) => [...participants, ...prev]);

    createBackendOjtSession({
      formType: session.formType,
      department: session.department,
      position: session.position,
      evaluationMethod: session.evaluationMethod,
      hasAttachment: session.hasAttachment,
      purposeType: session.purposeType,
      changeReasonCategory: session.changeReasonCategory,
      assessorName: session.assessorName,
      managerName: session.managerName,
      contentItems: contentItems.map((c) => ({
        sequence: c.sequence,
        description: c.description,
        trainingDate: c.trainingDate,
        timeFrom: c.timeFrom,
        timeTo: c.timeTo,
        resultPercent: c.resultPercent,
        remark: c.remark,
      })),
      participants: participants.map((p) => ({
        empCode: p.empCode,
        employeeName: p.employeeName,
        preScore: p.preScore,
        postScore: p.postScore,
        instructorScorePercent: p.instructorScorePercent,
        isPassed: p.isPassed,
        remarks: p.remarks,
      })),
    })
      .then((row) => {
        const flattened = flattenBackendOjtSession(row);
        setOjtSessions((prev) => [flattened.session, ...prev.filter((s) => s.id !== tempSessionId)]);
        setOjtContentItems((prev) => [...flattened.contentItems, ...prev.filter((c) => c.sessionId !== tempSessionId)]);
        setOjtParticipants((prev) => [...flattened.participants, ...prev.filter((p) => p.sessionId !== tempSessionId)]);
      })
      .catch((err) => {
        window.alert(
          `บันทึกผล OJT ในระบบหลักสำเร็จ แต่ซิงก์เข้าระบบ backend ไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown error'}`
        );
      });
  };

  const handleAddProbationEval = (evalRec: ProbationEvaluation) => {
    // Optimistic local update first so the form's instant pass/fail alert
    // doesn't wait on the network — then reconcile with the real DB-assigned
    // id once the backend responds (same pattern as handleAddOjtSession).
    const tempId = evalRec.id;
    setProbationEvaluations((prev) => [evalRec, ...prev]);

    createBackendProbationEvaluation({
      empCode: evalRec.empCode,
      employeeName: evalRec.employeeName,
      department: evalRec.department,
      position: evalRec.position,
      period: evalRec.period,
      startingDate: evalRec.startingDate,
      evalDate: evalRec.evalDate,
      knowledge: evalRec.scores.knowledge,
      diligence: evalRec.scores.diligence,
      responsibility: evalRec.scores.responsibility,
      teamwork: evalRec.scores.teamwork,
      attitude: evalRec.scores.attitude,
      regulationCompliance: evalRec.scores.regulationCompliance,
      problemSolving: evalRec.scores.problemSolving,
      learningAbility: evalRec.scores.learningAbility,
      ppeUse: evalRec.scores.ppeUse,
      activityParticipation: evalRec.scores.activityParticipation,
      criteriaTotalScore: evalRec.criteriaTotalScore,
      criteriaPercentage: evalRec.criteriaPercentage,
      attendancePercentage: evalRec.attendancePercentage,
      resultScore: evalRec.resultScore,
      grade: evalRec.grade,
      isPassed: evalRec.isPassed,
      outcome: evalRec.outcome,
      comments: evalRec.comments,
      assessorName: evalRec.assessorName,
    })
      .then((row) => {
        const real = mapBackendProbationEvaluation(row);
        setProbationEvaluations((prev) => [real, ...prev.filter((e) => e.id !== tempId)]);
      })
      .catch((err) => {
        window.alert(
          `บันทึกผลประเมินทดลองงานในระบบหลักสำเร็จ แต่ซิงก์เข้าระบบ backend ไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown error'}`
        );
      });
  };

  const handleAddCertificate = (cert: Certificate) => {
    setCertificates([cert, ...certificates]);
  };

  const handleEditCertificate = (cert: Certificate) => {
    setCertificates(certificates.map((c) => (c.id === cert.id ? cert : c)));
  };

  const handleDeleteCertificate = (certId: string) => {
    setCertificates(certificates.filter((c) => c.id !== certId));
  };

  // F-HR-014 scores are DB-backed — optimistic local update first (same
  // pattern as handleAddProbationEval) so the score popover closes
  // instantly, then reconcile with the real DB-assigned id once the
  // backend responds. Reconciled by natural key (employeeId+skillName+
  // cycle+attemptNumber), not by id, since the optimistic entry's id is
  // still the client-generated temp one.
  const handleUpdateEvaluation = (updated: SkillEvaluation) => {
    const exists = skillEvaluations.some((e) => e.id === updated.id);
    setSkillEvaluations(
      exists ? skillEvaluations.map((e) => (e.id === updated.id ? updated : e)) : [updated, ...skillEvaluations]
    );

    saveBackendSkillEvaluation({
      employeeId: Number(updated.employeeId),
      employeeName: updated.employeeName,
      department: updated.department,
      position: updated.position,
      skillName: updated.skillName,
      category: updated.category,
      targetLevel: updated.targetLevel,
      resultLevel: updated.resultLevel,
      cycle: updated.cycle,
      attemptNumber: updated.attemptNumber,
      evaluatedAt: updated.evaluatedAt,
      assessorName: updated.assessorName,
      remark: updated.remark,
    })
      .then((row) => {
        const real = mapBackendSkillEvaluation(row);
        setSkillEvaluations((prev) => [
          real,
          ...prev.filter(
            (e) =>
              !(
                e.employeeId === real.employeeId &&
                e.skillName === real.skillName &&
                e.cycle === real.cycle &&
                e.attemptNumber === real.attemptNumber
              )
          ),
        ]);
      })
      .catch((err) =>
        window.alert(`บันทึกผลประเมินทักษะเข้าระบบ backend ไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown error'}`)
      );
  };

  const handleSaveEvaluationRound = (round: SkillEvaluationRound) => {
    const exists = skillEvaluationRounds.some((r) => r.id === round.id);
    setSkillEvaluationRounds(
      exists ? skillEvaluationRounds.map((r) => (r.id === round.id ? round : r)) : [round, ...skillEvaluationRounds]
    );

    saveBackendSkillEvaluationRound({
      employeeId: Number(round.employeeId),
      cycle: round.cycle,
      attemptNumber: round.attemptNumber,
      actionPeriodFrom: round.actionPeriodFrom || undefined,
      actionPeriodTo: round.actionPeriodTo || undefined,
      assessorName: round.assessorName,
      assessorSignature: round.assessorSignature,
      deptManagerName: round.deptManagerName,
      deptManagerSignature: round.deptManagerSignature,
      hrDeptName: round.hrDeptName,
      hrDeptSignature: round.hrDeptSignature,
      signedAt: round.signedAt,
    })
      .then((row) => {
        const real = mapBackendSkillEvaluationRound(row);
        setSkillEvaluationRounds((prev) => [
          real,
          ...prev.filter(
            (r) => !(r.employeeId === real.employeeId && r.cycle === real.cycle && r.attemptNumber === real.attemptNumber)
          ),
        ]);
      })
      .catch((err) =>
        window.alert(`บันทึกรอบการประเมินทักษะเข้าระบบ backend ไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown error'}`)
      );
  };

  const handleMarkNotifRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const expiringCertsCount = certificates.filter((c) => {
    const status = computeCertificateStatus(c.expiryDate);
    return status === 'EXPIRING_SOON' || status === 'EXPIRED';
  }).length;
  const probationCount = employees.filter((e) => e.status === 'PROBATION').length;

  const handleSwitchUser = (user: Employee) => {
    setCurrentUser(user);
    persistCurrentUserEmpCode(user.empCode);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <LoginView
        employees={employees}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          persistCurrentUserEmpCode(user.empCode);
          setIsLoggedIn(true);
        }}
      />
    );
  }

  // Navbar/ExamEngine/OjtFormAEvaluator etc. all assume currentUser is a
  // real Employee — show a lightweight loading state until the mount-time
  // fetch resolves (or a hard error if it failed).
  if (!currentUser) {
    if (employeesError) {
      return (
        <div className="app-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div className="glass-card" style={{ padding: 24, maxWidth: 480, textAlign: 'center' }}>
            ไม่สามารถโหลดข้อมูลพนักงานจากระบบได้: {employeesError}
            <br />
            ตรวจสอบว่า backend รันอยู่ (docker compose up -d car-status-mysql car-status-backend) แล้วลองรีเฟรชหน้านี้
          </div>
        </div>
      );
    }
    return (
      <div className="app-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        กำลังโหลดข้อมูลพนักงาน...
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        allUsers={employees}
        onSwitchUser={handleSwitchUser}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotifRead}
        onOpenLoginTest={() => setShowTestLoginModal(true)}
        onResetDemoData={handleResetDemoData}
        onLogout={handleLogout}
      />

      {/* Main Body with Sidebar & Content Area */}
      <div className="app-container">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          expiringCertsCount={expiringCertsCount}
          probationCount={probationCount}
          currentUserRole={currentUser.role}
        />

        <main className="main-content">
          <ErrorBoundary>
            <Suspense fallback={<PageLoading />}>
            {activeTab === 'dashboard' && (
              <Dashboard
                employees={employees}
                certificates={certificates}
                onNavigate={setActiveTab}
              />
            )}

            {activeTab === 'employees' && (
              <EmployeeManagement
                employees={employees}
                onAddEmployee={handleAddEmployee}
                onEditEmployee={handleEditEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                employeesError={employeesError}
                orgChartNodes={orgChartNodes}
                onChangeOrgChartNodes={setOrgChartNodes}
              />
            )}

            {activeTab === 'training' && (
              <TrainingManagement
                onNavigateToExam={(batchId) => {
                  if (batchId) {
                    localStorage.setItem('hrskill_active_batch_id', batchId);
                  }
                  setActiveTab('exam');
                }}
              />
            )}

            {activeTab === 'ojt_a' && (
              <OjtFormAEvaluator
                employees={employees}
                standards={skillStandards}
                currentUser={currentUser}
                onAddOjtSession={handleAddOjtSession}
              />
            )}

            {activeTab === 'ojt_b' && (
              <OjtFormBEvaluator employees={employees} currentUser={currentUser} onAddOjtSession={handleAddOjtSession} />
            )}

            {activeTab === 'ojt_history' && (
              <OjtHistoryView
                sessions={ojtSessions}
                contentItems={ojtContentItems}
                participants={ojtParticipants}
                error={ojtHistoryError}
              />
            )}

            {activeTab === 'probation' && (
              <ProbationEvaluator
                employees={employees}
                currentUser={currentUser}
                onAddProbationEval={handleAddProbationEval}
                onEditEmployee={handleEditEmployee}
              />
            )}

            {activeTab === 'probation_history' && (
              <ProbationHistoryView evaluations={probationEvaluations} error={probationError} />
            )}

            {activeTab === 'skill_standards' && (
              <SkillStandardManagement
                standards={skillStandards}
                onAddSkillStandard={handleAddSkillStandard}
                onEditSkillStandard={handleEditSkillStandard}
                onDeleteSkillStandard={handleDeleteSkillStandard}
                error={skillStandardsError}
              />
            )}

            {activeTab === 'skill_matrix' && (
              <SkillMatrixView
                employees={employees}
                standards={skillStandards}
                evaluations={skillEvaluations}
                evaluationRounds={skillEvaluationRounds}
                onUpdateEvaluation={handleUpdateEvaluation}
                onSaveRound={handleSaveEvaluationRound}
                onAddEmployee={handleAddEmployee}
                error={skillEvaluationsError}
              />
            )}

            {activeTab === 'certificates' && (
              <CertificateVault
                certificates={certificates}
                employees={employees}
                onAddCertificate={handleAddCertificate}
                onEditCertificate={handleEditCertificate}
                onDeleteCertificate={handleDeleteCertificate}
              />
            )}

            {activeTab === 'exam' && (
              <ExamEngine
                currentUser={currentUser}
                employees={employees}
              />
            )}

            {activeTab === 'audit' && (
              <AuditReportExporter
                employees={employees}
                skillEvaluations={skillEvaluations}
                ojtSessions={ojtSessions}
                ojtContentItems={ojtContentItems}
                ojtParticipants={ojtParticipants}
                certificates={certificates}
                courses={courses}
              />
            )}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Test Login Screen Modal */}
      <TestLoginModal
        isOpen={showTestLoginModal}
        onClose={() => setShowTestLoginModal(false)}
        onLoginSuccess={handleSwitchUser}
        allUsers={employees}
      />
    </div>
  );
}

export default App;
