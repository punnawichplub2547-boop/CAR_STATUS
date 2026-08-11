import { useState, useEffect, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import type { NavTab } from './components/Sidebar';
import { TestLoginModal } from './components/TestLoginModal';
import { LoginView } from './components/LoginView';

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
const OjtProbationEvaluator = lazy(() =>
  import('./components/OjtProbationEvaluator').then((m) => ({ default: m.OjtProbationEvaluator }))
);
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
import { createBackendEmployee } from './utils/api';

import {
  INITIAL_EMPLOYEES,
  INITIAL_SKILL_STANDARDS,
  INITIAL_SKILL_EVALUATIONS,
  INITIAL_SKILL_EVALUATION_ROUNDS,
  INITIAL_OJT_SESSIONS,
  INITIAL_OJT_CONTENT_ITEMS,
  INITIAL_OJT_PARTICIPANTS,
  INITIAL_PROBATION_EVALUATIONS,
  INITIAL_CERTIFICATES,
  INITIAL_COURSES,
  INITIAL_NOTIFICATIONS,
  INITIAL_ORG_CHART_NODES,
} from './data/mockData';

import type { Employee, OjtSession, OjtContentItem, OjtParticipant, ProbationEvaluation, Certificate, SkillEvaluation, SkillEvaluationRound, TrainingCourse, NotificationItem, OrgChartNode } from './types';

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
  const [currentUser, setCurrentUser] = usePersistentState<Employee>('currentUser', INITIAL_EMPLOYEES[0]);
  const [isLoggedIn, setIsLoggedIn] = usePersistentState<boolean>('is_logged_in', true);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [showTestLoginModal, setShowTestLoginModal] = useState(false);

  // App Master States with Persistence
  const [employees, setEmployees] = usePersistentState<Employee[]>('employees', INITIAL_EMPLOYEES);
  const [skillStandards] = useState(INITIAL_SKILL_STANDARDS);
  const [skillEvaluations, setSkillEvaluations] = usePersistentState<SkillEvaluation[]>('skillEvaluations', INITIAL_SKILL_EVALUATIONS);
  const [skillEvaluationRounds, setSkillEvaluationRounds] = usePersistentState<SkillEvaluationRound[]>('skillEvaluationRounds', INITIAL_SKILL_EVALUATION_ROUNDS);
  const [ojtSessions, setOjtSessions] = usePersistentState<OjtSession[]>('ojtSessions', INITIAL_OJT_SESSIONS);
  const [ojtContentItems, setOjtContentItems] = usePersistentState<OjtContentItem[]>('ojtContentItems', INITIAL_OJT_CONTENT_ITEMS);
  const [ojtParticipants, setOjtParticipants] = usePersistentState<OjtParticipant[]>('ojtParticipants', INITIAL_OJT_PARTICIPANTS);
  const [probationEvaluations, setProbationEvaluations] = usePersistentState<ProbationEvaluation[]>('probationEvaluations', INITIAL_PROBATION_EVALUATIONS);
  const [certificates, setCertificates] = usePersistentState<Certificate[]>('certificates', INITIAL_CERTIFICATES);
  const [courses] = usePersistentState<TrainingCourse[]>('courses', INITIAL_COURSES);
  const [notifications, setNotifications] = usePersistentState<NotificationItem[]>('notifications', INITIAL_NOTIFICATIONS);
  const [orgChartNodes, setOrgChartNodes] = usePersistentState<OrgChartNode[]>('orgChartNodes', INITIAL_ORG_CHART_NODES);

  // Enforce HR Admin role in the platform
  useEffect(() => {
    if (currentUser.role !== 'ADMIN') {
      const adminUser = employees.find((e) => e.role === 'ADMIN') || INITIAL_EMPLOYEES[0];
      setCurrentUser(adminUser);
    }
  }, [currentUser.role, employees, setCurrentUser]);

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  // Reset Demo Data
  const handleResetDemoData = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลตัวอย่างกลับเป็นค่าเริ่มต้นทั้งหมดหรือไม่?')) {
      const keys = ['currentUser', 'is_logged_in', 'employees', 'skillEvaluations', 'skillEvaluationRounds', 'ojtSessions', 'ojtContentItems', 'ojtParticipants', 'probationEvaluations', 'certificates', 'courses', 'notifications', 'orgChartNodes'];
      keys.forEach((k) => localStorage.removeItem(`hrskill_${k}`));
      window.location.reload();
    }
  };

  // Handlers
  const handleAddEmployee = (newEmp: Employee) => {
    setEmployees([newEmp, ...employees]);
    // Mirror into the backend so the new hire shows up on the F-HR-002
    // orientation export page and can be matched against Google Form exam
    // submissions by empCode. Local state above is already updated either
    // way — a backend sync failure (e.g. duplicate empCode) shouldn't block
    // HR from continuing to use the rest of the app.
    createBackendEmployee({
      empCode: newEmp.empCode,
      name: newEmp.name,
      email: newEmp.email,
      department: newEmp.department,
      section: newEmp.section,
      position: newEmp.position,
      startingDate: newEmp.startingDate,
      status: newEmp.status,
    }).catch((err) => {
      console.warn('Backend sync warning (running in offline/localStorage mode):', err);
    });
  };

  const handleEditEmployee = (updatedEmp: Employee) => {
    setEmployees(employees.map((e) => (e.id === updatedEmp.id ? updatedEmp : e)));
  };

  const handleAddOjtSession = (
    session: OjtSession,
    contentItems: OjtContentItem[],
    participants: OjtParticipant[]
  ) => {
    setOjtSessions([session, ...ojtSessions]);
    setOjtContentItems([...contentItems, ...ojtContentItems]);
    setOjtParticipants([...participants, ...ojtParticipants]);
  };

  const handleAddProbationEval = (evalRec: ProbationEvaluation) => {
    setProbationEvaluations([evalRec, ...probationEvaluations]);
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

  const handleUpdateEvaluation = (updated: SkillEvaluation) => {
    const exists = skillEvaluations.some((e) => e.id === updated.id);
    setSkillEvaluations(
      exists ? skillEvaluations.map((e) => (e.id === updated.id ? updated : e)) : [updated, ...skillEvaluations]
    );
  };

  const handleSaveEvaluationRound = (round: SkillEvaluationRound) => {
    const exists = skillEvaluationRounds.some((r) => r.id === round.id);
    setSkillEvaluationRounds(
      exists ? skillEvaluationRounds.map((r) => (r.id === round.id ? round : r)) : [round, ...skillEvaluationRounds]
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

  if (!isLoggedIn) {
    return (
      <LoginView
        employees={employees}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsLoggedIn(true);
        }}
      />
    );
  }

  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        allUsers={employees}
        onSwitchUser={setCurrentUser}
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

          {activeTab === 'evaluations' && (
            <OjtProbationEvaluator
              employees={employees}
              ojtSessions={ojtSessions}
              ojtContentItems={ojtContentItems}
              ojtParticipants={ojtParticipants}
              probationEvaluations={probationEvaluations}
              onAddOjtSession={handleAddOjtSession}
              onAddProbationEval={handleAddProbationEval}
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
              ojtParticipants={ojtParticipants}
              certificates={certificates}
              courses={courses}
            />
          )}
          </Suspense>
        </main>
      </div>

      {/* Test Login Screen Modal */}
      <TestLoginModal
        isOpen={showTestLoginModal}
        onClose={() => setShowTestLoginModal(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
        allUsers={employees}
      />
    </div>
  );
}

export default App;
