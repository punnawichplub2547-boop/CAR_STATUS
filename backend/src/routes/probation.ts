import { Router } from 'express';
import { prisma } from '../db.js';

export const probationRouter = Router();

interface CreateProbationEvaluationPayload {
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

// F-HR-009: empCode resolved to a backend employeeId here (same technique
// as the exam webhook / OJT sessions) — soft-fails to employeeId: null if
// no matching Employee row exists yet.
probationRouter.post('/probation-evaluations', async (req, res) => {
  const body = req.body as Partial<CreateProbationEvaluationPayload>;

  if (
    !body.empCode ||
    !body.employeeName ||
    !body.department ||
    !body.position ||
    !body.period ||
    !body.startingDate ||
    !body.evalDate ||
    typeof body.knowledge !== 'number' ||
    typeof body.diligence !== 'number' ||
    typeof body.responsibility !== 'number' ||
    typeof body.teamwork !== 'number' ||
    typeof body.attitude !== 'number' ||
    typeof body.regulationCompliance !== 'number' ||
    typeof body.problemSolving !== 'number' ||
    typeof body.learningAbility !== 'number' ||
    typeof body.ppeUse !== 'number' ||
    typeof body.activityParticipation !== 'number' ||
    typeof body.criteriaTotalScore !== 'number' ||
    typeof body.criteriaPercentage !== 'number' ||
    typeof body.attendancePercentage !== 'number' ||
    typeof body.resultScore !== 'number' ||
    !body.grade ||
    typeof body.isPassed !== 'boolean' ||
    !body.assessorName
  ) {
    res.status(400).json({ error: 'Missing or invalid fields in probation evaluation payload' });
    return;
  }

  const employee = await prisma.employee.findUnique({ where: { empCode: body.empCode } });

  const evaluation = await prisma.probationEvaluation.create({
    data: {
      empCode: body.empCode,
      employeeId: employee?.id,
      employeeName: body.employeeName,
      department: body.department,
      position: body.position,
      period: body.period,
      startingDate: new Date(body.startingDate),
      evalDate: new Date(body.evalDate),
      knowledge: body.knowledge,
      diligence: body.diligence,
      responsibility: body.responsibility,
      teamwork: body.teamwork,
      attitude: body.attitude,
      regulationCompliance: body.regulationCompliance,
      problemSolving: body.problemSolving,
      learningAbility: body.learningAbility,
      ppeUse: body.ppeUse,
      activityParticipation: body.activityParticipation,
      criteriaTotalScore: body.criteriaTotalScore,
      criteriaPercentage: body.criteriaPercentage,
      attendancePercentage: body.attendancePercentage,
      resultScore: body.resultScore,
      grade: body.grade,
      isPassed: body.isPassed,
      outcome: body.outcome,
      comments: body.comments,
      assessorName: body.assessorName,
    },
  });

  res.status(201).json(evaluation);
});

// HR-facing read endpoint.
probationRouter.get('/probation-evaluations', async (req, res) => {
  const empCode = typeof req.query.empCode === 'string' ? req.query.empCode : undefined;
  const evaluations = await prisma.probationEvaluation.findMany({
    where: empCode ? { empCode } : undefined,
    orderBy: { evalDate: 'desc' },
  });
  res.json(evaluations);
});
