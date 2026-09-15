import { useState, useMemo, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import type { NavTab } from './components/layout/Sidebar';
import { LoginView } from './components/auth/LoginView';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { SkillPassportModal } from './components/employee/SkillPassportModal';
import { UserManualModal } from './components/modals/UserManualModal';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { SkillStandardManagement } from './components/skills/SkillStandardManagement';
import { OjtHistoryView } from './components/ojt/OjtHistoryView';
import { ProbationHistoryView } from './components/ojt/ProbationHistoryView';
import { generateLiveNotifications } from './utils/notificationGenerator';
import { INITIAL_EMPLOYEES, INITIAL_COURSES, INITIAL_ORG_CHART_NODES } from './data/mockData';
import type { Employee, TrainingCourse, OrgChartNode } from './types';
import {
  usePersistentState,
  useEmployeeState,
  useSkillMatrixState,
  useOjtProbationState,
  useCertificateState,
} from './hooks';

// Code-split heavy modules on demand
const Dashboard = lazy(() => import('./components/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })));
const EmployeeManagement = lazy(() =>
  import('./components/employee/EmployeeManagement').then((m) => ({ default: m.EmployeeManagement }))
);
const TrainingManagement = lazy(() =>
  import('./components/certificates/TrainingManagement').then((m) => ({ default: m.TrainingManagement }))
);
const OjtFormAEvaluator = lazy(() => import('./components/ojt/OjtFormAEvaluator').then((m) => ({ default: m.OjtFormAEvaluator })));
const OjtFormBEvaluator = lazy(() => import('./components/ojt/OjtFormBEvaluator').then((m) => ({ default: m.OjtFormBEvaluator })));
const ProbationEvaluator = lazy(() => import('./components/ojt/ProbationEvaluator').then((m) => ({ default: m.ProbationEvaluator })));
const SkillMatrixView = lazy(() => import('./components/skills/SkillMatrixView').then((m) => ({ default: m.SkillMatrixView })));
const CertificateVault = lazy(() => import('./components/certificates/CertificateVault').then((m) => ({ default: m.CertificateVault })));
const ExamEngine = lazy(() => import('./components/exam/ExamEngine').then((m) => ({ default: m.ExamEngine })));
const AuditReportExporter = lazy(() =>
  import('./components/reports/AuditReportExporter').then((m) => ({ default: m.AuditReportExporter }))
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

export function App() {
  // 1. Employee & Auth State
  const {
    currentUser,
    setCurrentUser,
    employees,
    employeesError,
    isLoggedIn,
    setIsLoggedIn,
    handleAddEmployee,
    handleEditEmployee,
    handleDeleteEmployee,
    handleSwitchUser,
    handleLogout,
    persistCurrentUserEmpCode,
    probationCount,
  } = useEmployeeState();

  // 2. Skill Matrix & Standards State
  const {
    skillStandards,
    skillStandardsError,
    skillEvaluations,
    skillEvaluationRounds,
    skillEvaluationsError,
    handleAddSkillStandard,
    handleEditSkillStandard,
    handleDeleteSkillStandard,
    handleUpdateEvaluation,
    handleSaveEvaluationRound,
  } = useSkillMatrixState();

  // 3. OJT & Probation State
  const {
    ojtSessions,
    ojtContentItems,
    ojtParticipants,
    ojtHistoryError,
    probationEvaluations,
    probationError,
    handleAddOjtSession,
    handleAddProbationEval,
  } = useOjtProbationState();

  // 4. Certificates State
  const {
    certificates,
    handleAddCertificate,
    handleEditCertificate,
    handleDeleteCertificate,
    expiringCertsCount,
  } = useCertificateState();

  // 5. Navigation, Modals & Local App State
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [passportEmployee, setPassportEmployee] = useState<Employee | null>(null);

  const [courses] = usePersistentState<TrainingCourse[]>('courses', INITIAL_COURSES);
  const [readNotifIds, setReadNotifIds] = usePersistentState<string[]>('read_notif_ids', []);
  const [orgChartNodes, setOrgChartNodes] = usePersistentState<OrgChartNode[]>('orgChartNodes', INITIAL_ORG_CHART_NODES);

  const readNotifIdSet = useMemo(() => new Set(readNotifIds), [readNotifIds]);
  const liveNotifications = useMemo(
    () => generateLiveNotifications(employees, certificates, readNotifIdSet),
    [employees, certificates, readNotifIdSet]
  );

  const handleMarkNotifRead = (id: string) => {
    setReadNotifIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleMarkAllNotifsRead = () => {
    setReadNotifIds(liveNotifications.map((n) => n.id));
  };

  // Reset Demo Data — resets localStorage-first collections
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

  if (!currentUser) {
    return (
      <LoginView
        employees={employees.length > 0 ? employees : INITIAL_EMPLOYEES}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          persistCurrentUserEmpCode(user.empCode);
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
        standards={skillStandards}
        certificates={certificates}
        onSwitchUser={handleSwitchUser}
        notifications={liveNotifications}
        onMarkNotificationRead={handleMarkNotifRead}
        onMarkAllNotificationsRead={handleMarkAllNotifsRead}
        onNavigate={setActiveTab}
        onSelectEmployeeForPassport={(emp) => setPassportEmployee(emp)}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenPassport={() => setPassportEmployee(currentUser)}
        onOpenManual={() => setShowManualModal(true)}
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
          onOpenManual={() => setShowManualModal(true)}
        />

        <main className="main-content">
          <ErrorBoundary>
            <Suspense fallback={<PageLoading />}>
              {activeTab === 'dashboard' && (
                <Dashboard
                  employees={employees}
                  certificates={certificates}
                  standards={skillStandards}
                  evaluations={skillEvaluations}
                  courses={courses}
                  probationEvaluations={probationEvaluations}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === 'employees' && (
                <EmployeeManagement
                  employees={employees}
                  onAddEmployee={handleAddEmployee}
                  onEditEmployee={handleEditEmployee}
                  onDeleteEmployee={handleDeleteEmployee}
                  onViewPassport={(emp) => setPassportEmployee(emp)}
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
                <OjtFormBEvaluator
                  employees={employees}
                  currentUser={currentUser}
                  onAddOjtSession={handleAddOjtSession}
                />
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
                  onNavigate={setActiveTab}
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

      {/* User Profile & Security Modal */}
      {currentUser && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          currentUser={currentUser}
        />
      )}

      {/* Employee Skill Passport Modal */}
      <SkillPassportModal
        isOpen={!!passportEmployee}
        onClose={() => setPassportEmployee(null)}
        employee={passportEmployee}
        standards={skillStandards}
        evaluations={skillEvaluations}
        certificates={certificates}
        ojtSessions={ojtSessions}
        ojtParticipants={ojtParticipants}
        probationEvaluations={probationEvaluations}
      />

      {/* Interactive User Manual & Guide Modal */}
      <UserManualModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
      />
    </div>
  );
}

export default App;
