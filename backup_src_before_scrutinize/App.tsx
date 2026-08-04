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
import { computeCertificateStatus } from './utils/certificateStatus';

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
  INITIAL_ATTENDANCES,
  EXAM_QUESTIONS,
  INITIAL_NOTIFICATIONS,
} from './data/mockData';

import type { Employee, OjtSession, OjtContentItem, OjtParticipant, ProbationEvaluation, Certificate, SkillEvaluation, SkillEvaluationRound, TrainingCourse, TrainingAttendance, NotificationItem, ExamSubmission } from './types';

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
  const [skillEvaluationRounds, setSkillEvaluationRounds] = usePersistentState<SkillEvaluationRound[]>('skillEvaluationRounds', INITIAL_SKILL_EVALUATION_ROUNDS);
  const [ojtSessions, setOjtSessions] = usePersistentState<OjtSession[]>('ojtSessions', INITIAL_OJT_SESSIONS);
  const [ojtContentItems, setOjtContentItems] = usePersistentState<OjtContentItem[]>('ojtContentItems', INITIAL_OJT_CONTENT_ITEMS);
  const [ojtParticipants, setOjtParticipants] = usePersistentState<OjtParticipant[]>('ojtParticipants', INITIAL_OJT_PARTICIPANTS);
  const [probationEvaluations, setProbationEvaluations] = usePersistentState<ProbationEvaluation[]>('probationEvaluations', INITIAL_PROBATION_EVALUATIONS);
  const [certificates, setCertificates] = usePersistentState<Certificate[]>('certificates', INITIAL_CERTIFICATES);
  const [courses, setCourses] = usePersistentState<TrainingCourse[]>('courses', INITIAL_COURSES);
  const [attendances, setAttendances] = usePersistentState<TrainingAttendance[]>('attendances', INITIAL_ATTENDANCES);
  const [notifications, setNotifications] = usePersistentState<NotificationItem[]>('notifications', INITIAL_NOTIFICATIONS);

  // Reset Demo Data
  const handleResetDemoData = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลตัวอย่างกลับเป็นค่าเริ่มต้นทั้งหมดหรือไม่?')) {
      const keys = ['currentUser', 'employees', 'skillEvaluations', 'skillEvaluationRounds', 'ojtSessions', 'ojtContentItems', 'ojtParticipants', 'probationEvaluations', 'certificates', 'courses', 'attendances', 'notifications'];
      keys.forEach((k) => localStorage.removeItem(`hrskill_${k}`));
      window.location.reload();
    }
  };

  // Handlers
  const handleAddEmployee = (newEmp: Employee) => {
    setEmployees([newEmp, ...employees]);
  };

  const handleEditEmployee = (updatedEmp: Employee) => {
    setEmployees(employees.map((e) => (e.id === updatedEmp.id ? updatedEmp : e)));
  };

  const handleCheckIn = (
    courseId: string,
    employeeId: string,
    period: 'morning' | 'afternoon',
    time: string,
    signatureDataUrl: string
  ) => {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;
    const existing = attendances.find((a) => a.courseId === courseId && a.employeeId === employeeId);
    if (existing) {
      const checkInMorning = period === 'morning' ? time : existing.checkInMorning;
      const signedMorning = period === 'morning' ? signatureDataUrl : existing.signedMorning;
      const checkInAfternoon = period === 'afternoon' ? time : existing.checkInAfternoon;
      const signedAfternoon = period === 'afternoon' ? signatureDataUrl : existing.signedAfternoon;
      setAttendances(
        attendances.map((a) =>
          a.id === existing.id
            ? {
                ...a,
                checkInMorning,
                signedMorning,
                checkInAfternoon,
                signedAfternoon,
                isPassed: !!checkInMorning && !!checkInAfternoon,
              }
            : a
        )
      );
    } else {
      const checkInMorning = period === 'morning' ? time : undefined;
      const signedMorning = period === 'morning' ? signatureDataUrl : undefined;
      const checkInAfternoon = period === 'afternoon' ? time : undefined;
      const signedAfternoon = period === 'afternoon' ? signatureDataUrl : undefined;
      const newAttendance: TrainingAttendance = {
        id: `att-${Date.now()}`,
        courseId,
        employeeId: emp.id,
        employeeName: emp.name,
        empCode: emp.empCode,
        department: emp.department,
        position: emp.position,
        checkInMorning,
        signedMorning,
        checkInAfternoon,
        signedAfternoon,
        isPassed: !!checkInMorning && !!checkInAfternoon,
      };
      setAttendances([newAttendance, ...attendances]);
    }
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

  const handleAddCourse = (course: TrainingCourse) => {
    setCourses([course, ...courses]);
  };

  const handleEditCourse = (updatedCourse: TrainingCourse) => {
    setCourses(courses.map((c) => (c.id === updatedCourse.id ? updatedCourse : c)));
  };

  const handleDeleteCourse = (courseId: string) => {
    setCourses(courses.filter((c) => c.id !== courseId));
    setAttendances(attendances.filter((a) => a.courseId !== courseId));
  };

  const handleDeleteAttendance = (attendanceId: string) => {
    setAttendances(attendances.filter((a) => a.id !== attendanceId));
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

  const expiringCertsCount = certificates.filter((c) => {
    const status = computeCertificateStatus(c.expiryDate);
    return status === 'EXPIRING_SOON' || status === 'EXPIRED';
  }).length;
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
              onEditEmployee={handleEditEmployee}
            />
          )}

          {activeTab === 'training' && (
            <TrainingManagement
              courses={courses}
              attendances={attendances}
              employees={employees}
              onAddCourse={handleAddCourse}
              onEditCourse={handleEditCourse}
              onDeleteCourse={handleDeleteCourse}
              onCheckIn={handleCheckIn}
              onDeleteAttendance={handleDeleteAttendance}
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
              questions={EXAM_QUESTIONS}
              currentUser={currentUser}
              onSaveSubmission={handleSaveExamSubmission}
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
