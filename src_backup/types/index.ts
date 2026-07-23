// Full TypeScript Interfaces for CAR HR Skill Matrix Platform

export type Role = 'ADMIN' | 'SUPERVISOR' | 'EMPLOYEE';
export type EmploymentStatus = 'PROBATION' | 'PERMANENT' | 'RESIGNED';
export type SkillLevel = 0 | 25 | 50 | 75 | 100;
export type ProbationGrade = 'A+' | 'A' | 'B' | 'C' | 'D';
export type ProbationPeriod = '30_DAYS' | '60_DAYS' | '90_DAYS';
export type OjtFormType = 'A_NEW_HIRE' | 'B_CHANGE';
export type EvaluationCycle = '2026-01' | '2026-07';

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
  employeeId: string;
  employeeName: string;
  position: string;
  department: string;
  skillName: string;
  category: string;
  targetLevel: SkillLevel;
  resultLevel: SkillLevel;
  cycle: EvaluationCycle;
  evaluatedAt: string;
  assessorName: string;
  remark?: string;
}

export interface OjtRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  empCode: string;
  department: string;
  position: string;
  formType: OjtFormType;
  courseName: string;
  courseContent: string;
  instructor: string;
  location: string;
  evalDate: string;
  changeReason?: string; // 4M1E change for Form B
  preScore?: number;
  postScore?: number;
  instructorScorePercent: SkillLevel;
  isPassed: boolean;
  remarks?: string;
  assessorName: string;
  managerName: string;
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
  scores: {
    knowledge: number; // 1-5 (x2 weight)
    diligence: number; // 1-5 (x2 weight)
    responsibility: number; // 1-5 (x2 weight)
    teamwork: number; // 1-5 (x2 weight)
    attitude: number; // 1-5 (x2 weight)
  };
  totalScore: number; // max 50
  percentage: number;
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
  checkInAfternoon?: string;
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

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'PROBATION_DUE' | 'CERT_EXPIRING' | 'SKILL_EVAL_DUE' | 'EXAM_PASSED';
  date: string;
  read: boolean;
  actionUrl?: string;
}
