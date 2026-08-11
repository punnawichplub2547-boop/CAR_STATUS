import { Router } from 'express';
import { prisma } from '../db.js';

export const ojtRouter = Router();

interface ContentItemPayload {
  sequence: number;
  description: string;
  instructorSignedDate?: string;
  resultPercent?: number;
  remark?: string;
}

interface ParticipantPayload {
  empCode: string;
  employeeName: string;
  preScore?: number;
  postScore?: number;
  instructorScorePercent: number;
  isPassed: boolean;
  remarks?: string;
}

interface CreateOjtSessionPayload {
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
  contentItems: ContentItemPayload[];
  participants: ParticipantPayload[];
}

// F-HR-004 Form A/B: one session with its content lines and trainees, all
// written together. Each participant's empCode is resolved to a backend
// employeeId here (same technique as the exam webhook) — soft-fails to
// employeeId: null if no matching Employee row exists yet.
ojtRouter.post('/ojt-sessions', async (req, res) => {
  const body = req.body as Partial<CreateOjtSessionPayload>;

  if (
    !body.formType ||
    !body.department ||
    !body.position ||
    !body.courseName ||
    !body.instructor ||
    !body.location ||
    !body.trainingDateFrom ||
    !body.trainingDateTo ||
    !body.timeRange ||
    !body.evaluationMethod ||
    !body.assessorName ||
    !body.managerName ||
    !Array.isArray(body.contentItems) ||
    !Array.isArray(body.participants)
  ) {
    res.status(400).json({ error: 'Missing or invalid fields in OJT session payload' });
    return;
  }

  const empCodes = [...new Set(body.participants.map((p) => p.empCode))];
  const matchedEmployees = await prisma.employee.findMany({
    where: { empCode: { in: empCodes } },
  });
  const employeeIdByEmpCode = new Map(matchedEmployees.map((e) => [e.empCode, e.id]));

  const session = await prisma.ojtSession.create({
    data: {
      formType: body.formType,
      department: body.department,
      position: body.position,
      courseName: body.courseName,
      instructor: body.instructor,
      location: body.location,
      trainingDateFrom: new Date(body.trainingDateFrom),
      trainingDateTo: new Date(body.trainingDateTo),
      timeRange: body.timeRange,
      evaluationMethod: body.evaluationMethod,
      hasAttachment: body.hasAttachment ?? false,
      purposeType: body.purposeType,
      changeReasonCategory: body.changeReasonCategory,
      assessorName: body.assessorName,
      managerName: body.managerName,
      contentItems: {
        create: body.contentItems.map((c) => ({
          sequence: c.sequence,
          description: c.description,
          instructorSignedDate: c.instructorSignedDate ? new Date(c.instructorSignedDate) : undefined,
          resultPercent: c.resultPercent,
          remark: c.remark,
        })),
      },
      participants: {
        create: body.participants.map((p) => ({
          empCode: p.empCode,
          employeeId: employeeIdByEmpCode.get(p.empCode),
          employeeName: p.employeeName,
          preScore: p.preScore,
          postScore: p.postScore,
          instructorScorePercent: p.instructorScorePercent,
          isPassed: p.isPassed,
          remarks: p.remarks,
        })),
      },
    },
    include: { contentItems: true, participants: true },
  });

  res.status(201).json(session);
});

// HR-facing read endpoint.
ojtRouter.get('/ojt-sessions', async (req, res) => {
  const empCode = typeof req.query.empCode === 'string' ? req.query.empCode : undefined;
  const sessions = await prisma.ojtSession.findMany({
    where: empCode ? { participants: { some: { empCode } } } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { contentItems: true, participants: true },
  });
  res.json(sessions);
});
