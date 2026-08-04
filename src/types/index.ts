// Full TypeScript Interfaces for CAR HR Skill Matrix Platform

export type Role = 'ADMIN' | 'SUPERVISOR' | 'EMPLOYEE';
export type EmploymentStatus = 'PROBATION' | 'PERMANENT' | 'RESIGNED';
export type SkillLevel = 0 | 25 | 50 | 75 | 100;
export type ProbationGrade = 'A+' | 'A' | 'B' | 'C' | 'D';
export type ProbationPeriod = '30_DAYS' | '90_DAYS' | '119_DAYS';
export type OjtFormType = 'A_NEW_HIRE' | 'B_CHANGE';
export type OjtPurposeType = 'NEW_HIRE' | 'TRANSFER';
export type OjtChangeReasonCategory =
  | 'DOCUMENT'
  | 'METHOD'
  | 'MATERIAL'
  | 'MACHINE'
  | 'ANNUAL_REVIEW'
  | 'OTHER';
export type OjtEvaluationMethod = 'PRE_POST_TEST' | 'PRACTICAL' | 'Q_AND_A';
export type EvaluationCycle = '2026-01' | '2026-07';
export type EvaluationAttempt = 1 | 2;

export interface Employee {
  id: string;
  empCode: string;
  name: string;
  email: string;
  department: string; // e.g. HR&GA, FMG-A, QA/QC, PD, R&D, PU, MT, IT
  section: string;
  position: string;
  startingDate: string; // YYYY-MM-DD
  status: EmploymentStatus;
  avatar: string;
  role: Role;
  supervisorId?: string;
  supervisorName?: string;
}

export interface SkillStandard {
  id: string;
  position: string;
  department: string;
  category: string;
  skillName: string;
  targetLevel: SkillLevel;
}

export interface SkillEvaluation {
  id: string;
  roundId: string;
  employeeId: string;
  employeeName: string;
  position: string;
  department: string;
  skillName: string;
  category: string;
  targetLevel: SkillLevel;
  resultLevel: SkillLevel;
  cycle: EvaluationCycle;
  attemptNumber: EvaluationAttempt;
  evaluatedAt: string;
  assessorName: string;
  remark?: string;
}

// F-HR-014: one sign-off round per employee, per cycle, per attempt (1st/2nd
// try) — Action Period + the 3-tier sign-off (Assessor / Dept. Manager / HR
// Dept.) apply once to every skill scored within that round.
export interface SkillEvaluationRound {
  id: string;
  employeeId: string;
  cycle: EvaluationCycle;
  attemptNumber: EvaluationAttempt;
  actionPeriodFrom: string;
  actionPeriodTo: string;
  assessorName: string;
  assessorSignature?: string; // data URL (PNG) of the hand-drawn signature
  deptManagerName: string;
  deptManagerSignature?: string;
  hrDeptName: string;
  hrDeptSignature?: string;
  signedAt?: string;
}

// F-HR-004: one OJT session (Form A = 1 trainee, Form B = up to ~10 trainees)
export interface OjtSession {
  id: string;
  formType: OjtFormType;
  department: string;
  position: string;
  courseName: string;
  instructor: string;
  location: string;
  trainingDateFrom: string;
  trainingDateTo: string;
  timeRange: string;
  evaluationMethod: OjtEvaluationMethod;
  hasAttachment: boolean;
  purposeType?: OjtPurposeType; // Form A only
  changeReasonCategory?: OjtChangeReasonCategory; // Form B only
  assessorName: string;
  managerName: string;
}

// Each content/topic line within a session (Form A: up to 25 lines)
export interface OjtContentItem {
  id: string;
  sessionId: string;
  sequence: number;
  description: string;
  instructorSignedDate?: string;
  resultPercent?: SkillLevel; // Form A scores per content line
  remark?: string;
}

// Each trainee attending a session (Form B: up to ~10 per session)
export interface OjtParticipant {
  id: string;
  sessionId: string;
  employeeId: string;
  employeeName: string;
  empCode: string;
  preScore?: number;
  postScore?: number;
  instructorScorePercent: SkillLevel;
  isPassed: boolean;
  remarks?: string;
}

// F-HR-009: 10 criteria, each scored 1-5 with weight x2 (max 100)
export interface ProbationCriteriaScores {
  knowledge: number; // ความรู้ในงานของพนักงานใหม่
  diligence: number; // ความขยัน / การอุทิศตนต่องาน
  responsibility: number; // ความรับผิดชอบต่องานและการติดตามงาน
  teamwork: number; // ความร่วมมือ การประสานงาน และการทำงานเป็นทีม
  attitude: number; // ทัศนคติและการตอบสนองต่อนโยบายบริษัท
  regulationCompliance: number; // การปฏิบัติตามกฎระเบียบบริษัท / ความมีวินัย
  problemSolving: number; // การวิเคราะห์และการแก้ปัญหา
  learningAbility: number; // ความสามารถปรับตัวและการเรียนรู้งาน
  ppeUse: number; // การใช้อุปกรณ์ความปลอดภัยในงาน
  activityParticipation: number; // การเข้าร่วมกิจกรรม (5ส., ความปลอดภัย, ISO 14001, IATF16949)
}

export interface ProbationEvaluation {
  id: string;
  employeeId: string;
  employeeName: string;
  empCode: string;
  department: string;
  position: string;
  period: ProbationPeriod;
  startingDate: string;
  evalDate: string;
  scores: ProbationCriteriaScores;
  criteriaTotalScore: number; // sum(scores) * 2, max 100
  criteriaPercentage: number; // criteriaTotalScore, weighted 80% of result
  attendancePercentage: number; // 0-100, weighted 20% of result
  resultScore: number; // criteriaPercentage * 0.8 + attendancePercentage * 0.2
  grade: ProbationGrade;
  isPassed: boolean;
  comments: string;
  assessorName: string;
}

export interface Certificate {
  id: string;
  employeeId: string;
  employeeName: string;
  empCode: string;
  department: string;
  certName: string;
  issuingOrg: string;
  issueDate: string;
  expiryDate: string;
  fileUrl: string;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
}

export interface TrainingCourse {
  id: string;
  code: string;
  title: string;
  category: 'SAFETY' | 'REGULATION' | 'QUALITY_IATF' | 'JOB_SPECIFIC' | 'SOFT_SKILLS';
  instructor: string;
  date: string;
  timeRange: string;
  location: string;
  hours: number;
  totalParticipants: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

export interface TrainingAttendance {
  id: string;
  courseId: string;
  employeeId: string;
  employeeName: string;
  empCode: string;
  department: string;
  position: string;
  checkInMorning?: string;
  signedMorning?: string; // data URL (PNG) of the hand-drawn signature
  checkInAfternoon?: string;
  signedAfternoon?: string;
  isPassed: boolean;
}

export interface ExamQuestion {
  id: number;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-based index
}

export interface ExamSubmission {
  id: string;
  employeeId: string;
  employeeName: string;
  score: number; // e.g. 26/30
  totalQuestions: number;
  percentage: number;
  isPassed: boolean; // >= 80% (>= 24 questions)
  timeTakenMinutes: number;
  submittedAt: string;
}

export type ExamType = 'SAFETY_ATTITUDE' | 'ORIENTATION';
export type ExamPhase = 'PRE_TEST' | 'POST_TEST';
export type PreTestLockMap = Record<string, Record<ExamType, boolean>>;

export interface GoogleFormQuestionDetail {
  questionNo: number;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface GoogleFormExamResult {
  id: string;
  attemptNumber: number;
  submittedAt: string;
  empCode: string;
  employeeName: string;
  department: string;
  score: number; // e.g. 12/14 or 26/30
  totalQuestions: number; // 14 or 30
  percentage: number; // Math.round((score / totalQuestions) * 100)
  isPassed: boolean;
  answersDetail: GoogleFormQuestionDetail[];
  source: 'GOOGLE_FORMS' | 'ONLINE_WEB';
  examType?: ExamType;
  phase?: ExamPhase;
  preTestClosed?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'PROBATION_DUE' | 'CERT_EXPIRING' | 'SKILL_EVAL_DUE' | 'EXAM_PASSED' | 'EXAM_FAILED';
  date: string;
  read: boolean;
  actionUrl?: string;
}
