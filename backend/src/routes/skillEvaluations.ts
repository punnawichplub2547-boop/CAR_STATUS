import { Router } from 'express';
import { prisma } from '../db.js';

export const skillEvaluationsRouter = Router();

// F-HR-014 scores. The frontend always "upserts" — it doesn't track
// whether a score already exists, it just posts the current natural key
// (employeeId + skillName + cycle + attemptNumber) every time a level is
// picked, so this single POST handles both create and update.
skillEvaluationsRouter.post('/skill-evaluations', async (req, res) => {
  const {
    employeeId,
    employeeName,
    department,
    position,
    skillName,
    category,
    targetLevel,
    resultLevel,
    cycle,
    attemptNumber,
    evaluatedAt,
    assessorName,
    remark,
  } = req.body;

  if (
    !Number.isInteger(employeeId) ||
    !employeeName ||
    !department ||
    !position ||
    !skillName ||
    !category ||
    targetLevel === undefined ||
    resultLevel === undefined ||
    !cycle ||
    !Number.isInteger(attemptNumber) ||
    !evaluatedAt ||
    !assessorName
  ) {
    res.status(400).json({ error: 'Missing or invalid fields in skill evaluation payload' });
    return;
  }

  const key = { employeeId_skillName_cycle_attemptNumber: { employeeId, skillName, cycle, attemptNumber } };
  const data = {
    employeeId,
    employeeName,
    department,
    position,
    skillName,
    category,
    targetLevel,
    resultLevel,
    cycle,
    attemptNumber,
    evaluatedAt: new Date(evaluatedAt),
    assessorName,
    remark: remark ?? null,
  };

  try {
    const evaluation = await prisma.skillEvaluation.upsert({ where: key, create: data, update: data });
    res.status(201).json(evaluation);
  } catch {
    res.status(400).json({ error: 'บันทึกผลประเมินทักษะไม่สำเร็จ' });
  }
});

skillEvaluationsRouter.get('/skill-evaluations', async (req, res) => {
  const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;
  if (req.query.employeeId !== undefined && !Number.isInteger(employeeId)) {
    res.status(400).json({ error: 'Invalid employeeId' });
    return;
  }
  const evaluations = await prisma.skillEvaluation.findMany({
    where: employeeId ? { employeeId } : undefined,
    orderBy: { evaluatedAt: 'desc' },
  });
  res.json(evaluations);
});

// F-HR-014 sign-off rounds — same upsert-by-natural-key pattern as above,
// keyed on employeeId + cycle + attemptNumber.
skillEvaluationsRouter.post('/skill-evaluation-rounds', async (req, res) => {
  const {
    employeeId,
    cycle,
    attemptNumber,
    actionPeriodFrom,
    actionPeriodTo,
    assessorName,
    assessorSignature,
    deptManagerName,
    deptManagerSignature,
    hrDeptName,
    hrDeptSignature,
    signedAt,
  } = req.body;

  if (!Number.isInteger(employeeId) || !cycle || !Number.isInteger(attemptNumber) || !assessorName) {
    res.status(400).json({ error: 'Missing or invalid fields in skill evaluation round payload' });
    return;
  }

  const key = { employeeId_cycle_attemptNumber: { employeeId, cycle, attemptNumber } };
  const data = {
    employeeId,
    cycle,
    attemptNumber,
    actionPeriodFrom: actionPeriodFrom ? new Date(actionPeriodFrom) : null,
    actionPeriodTo: actionPeriodTo ? new Date(actionPeriodTo) : null,
    assessorName,
    assessorSignature: assessorSignature ?? null,
    deptManagerName: deptManagerName ?? null,
    deptManagerSignature: deptManagerSignature ?? null,
    hrDeptName: hrDeptName ?? null,
    hrDeptSignature: hrDeptSignature ?? null,
    signedAt: signedAt ? new Date(signedAt) : null,
  };

  try {
    const round = await prisma.skillEvaluationRound.upsert({ where: key, create: data, update: data });
    res.status(201).json(round);
  } catch {
    res.status(400).json({ error: 'บันทึกรอบการประเมินทักษะไม่สำเร็จ' });
  }
});

skillEvaluationsRouter.get('/skill-evaluation-rounds', async (req, res) => {
  const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;
  if (req.query.employeeId !== undefined && !Number.isInteger(employeeId)) {
    res.status(400).json({ error: 'Invalid employeeId' });
    return;
  }
  const rounds = await prisma.skillEvaluationRound.findMany({
    where: employeeId ? { employeeId } : undefined,
  });
  res.json(rounds);
});
