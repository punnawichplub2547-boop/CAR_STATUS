import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import type { NavTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { EmployeeManagement } from './components/EmployeeManagement';
import { TrainingManagement } from './components/TrainingManagement';
import { OjtProbationEvaluator } from './components/OjtProbationEvaluator';
import { SkillMatrixView } from './components/SkillMatrixView';
import { CertificateVault } from './components/CertificateVault';
import { ExamEngine } from './components/ExamEngine';
import { AuditReportExporter } from './components/AuditReportExporter';
import { TestLoginModal } from './components/TestLoginModal';

import {
  INITIAL_EMPLOYEES,
  INITIAL_SKILL_STANDARDS,
  INITIAL_SKILL_EVALUATIONS,
  INITIAL_OJT_RECORDS,
  INITIAL_PROBATION_EVALUATIONS,
  INITIAL_CERTIFICATES,
  INITIAL_COURSES,
  INITIAL_ATTENDANCES,
  EXAM_QUESTIONS,
  INITIAL_NOTIFICATIONS,
} from './data/mockData';

import type { Employee, OjtRecord, ProbationEvaluation, Certificate, SkillEvaluation, TrainingCourse, NotificationItem, ExamSubmission } from './types';

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
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [showTestLoginModal, setShowTestLoginModal] = useState(false);

  // App Master States with Persistence
  const [employees, setEmployees] = usePersistentState<Employee[]>('employees', INITIAL_EMPLOYEES);
  const [skillStandards] = useState(INITIAL_SKILL_STANDARDS);
  const [skillEvaluations, setSkillEvaluations] = usePersistentState<SkillEvaluation[]>('skillEvaluations', INITIAL_SKILL_EVALUATIONS);
  const [ojtRecords, setOjtRecords] = usePersistentState<OjtRecord[]>('ojtRecords', INITIAL_OJT_RECORDS);
  const [probationEvaluations, setProbationEvaluations] = usePersistentState<ProbationEvaluation[]>('probationEvaluations', INITIAL_PROBATION_EVALUATIONS);
  const [certificates, setCertificates] = usePersistentState<Certificate[]>('certificates', INITIAL_CERTIFICATES);
  const [courses, setCourses] = usePersistentState<TrainingCourse[]>('courses', INITIAL_COURSES);
  const [attendances] = useState(INITIAL_ATTENDANCES);
  const [notifications, setNotifications] = usePersistentState<NotificationItem[]>('notifications', INITIAL_NOTIFICATIONS);

  // Reset Demo Data
  const handleResetDemoData = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลตัวอย่างกลับเป็นค่าเริ่มต้นทั้งหมดหรือไม่?')) {
      const keys = ['currentUser', 'employees', 'skillEvaluations', 'ojtRecords', 'probationEvaluations', 'certificates', 'courses', 'notifications'];
      keys.forEach((k) => localStorage.removeItem(`hrskill_${k}`));
      window.location.reload();
    }
  };

  // Handlers
  const handleAddEmployee = (newEmp: Employee) => {
    setEmployees([newEmp, ...employees]);
  };

  const handleAddOjtRecord = (record: OjtRecord) => {
    setOjtRecords([record, ...ojtRecords]);
  };

  const handleAddProbationEval = (evalRec: ProbationEvaluation) => {
    setProbationEvaluations([evalRec, ...probationEvaluations]);
  };

  const handleAddCertificate = (cert: Certificate) => {
    setCertificates([cert, ...certificates]);
  };

  const handleUpdateEvaluation = (updated: SkillEvaluation) => {
    setSkillEvaluations(skillEvaluations.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleAddCourse = (course: TrainingCourse) => {
    setCourses([course, ...courses]);
  };

  const handleMarkNotifRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleSaveExamSubmission = (sub: ExamSubmission) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: sub.isPassed ? 'สอบปฐมนิเทศผ่านเกณฑ์' : 'สอบปฐมนิเทศไม่ผ่านเกณฑ์',
      message: `${sub.employeeName} ทำแบบทดสอบได้ ${sub.score}/${sub.totalQuestions} คะแนน (${sub.percentage}%)`,
      type: 'EXAM_PASSED',
      date: new Date().toISOString().split('T')[0],
      read: false,
    };
    setNotifications([newNotif, ...notifications]);
  };

  const expiringCertsCount = certificates.filter(
    (c) => c.status === 'EXPIRING_SOON' || c.status === 'EXPIRED'
  ).length;
  const probationCount = employees.filter((e) => e.status === 'PROBATION').length;

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
      />

      {/* Main Body with Sidebar & Content Area */}
      <div className="app-container">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          expiringCertsCount={expiringCertsCount}
          probationCount={probationCount}
        />

        <main className="main-content">
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
            />
          )}

          {activeTab === 'training' && (
            <TrainingManagement
              courses={courses}
              attendances={attendances}
              onAddCourse={handleAddCourse}
            />
          )}

          {activeTab === 'evaluations' && (
            <OjtProbationEvaluator
              employees={employees}
              ojtRecords={ojtRecords}
              probationEvaluations={probationEvaluations}
              onAddOjtRecord={handleAddOjtRecord}
              onAddProbationEval={handleAddProbationEval}
            />
          )}

          {activeTab === 'skill_matrix' && (
            <SkillMatrixView
              employees={employees}
              standards={skillStandards}
              evaluations={skillEvaluations}
              onUpdateEvaluation={handleUpdateEvaluation}
            />
          )}

          {activeTab === 'certificates' && (
            <CertificateVault
              certificates={certificates}
              employees={employees}
              onAddCertificate={handleAddCertificate}
            />
          )}

          {activeTab === 'exam' && (
            <ExamEngine
              questions={EXAM_QUESTIONS}
              currentUser={currentUser}
              onSaveSubmission={handleSaveExamSubmission}
            />
          )}

          {activeTab === 'audit' && (
            <AuditReportExporter
              employees={employees}
              skillEvaluations={skillEvaluations}
              ojtRecords={ojtRecords}
              certificates={certificates}
              courses={courses}
            />
          )}
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
