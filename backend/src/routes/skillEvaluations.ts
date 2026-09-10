import { Router, type Request, type Response } from 'express';
import { prisma } from '../db.js';

export const skillEvaluationsRouter = Router();

// GET /api/skill-evaluations
skillEvaluationsRouter.get('/skill-evaluations', async (req: Request, res: Response) => {
  try {
    const { department, cycle, employeeId } = req.query;
    const where: any = {};
    if (department && department !== 'ALL') where.department = String(department);
    if (cycle) where.cycle = String(cycle);
    if (employeeId) where.employeeId = Number(employeeId);

    const evaluations = await prisma.skillEvaluation.findMany({
      where,
      orderBy: [{ evaluatedAt: 'desc' }, { id: 'asc' }],
    });

    res.json(evaluations);
  } catch (err) {
    console.error('Fetch skill evaluations error:', err);
    res.status(500).json({ error: 'ไม่สามารถโหลดข้อมูล Skill Evaluation ได้' });
  }
});

// POST /api/skill-evaluations
skillEvaluationsRouter.post('/skill-evaluations', async (req: Request, res: Response) => {
  try {
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

    if (!employeeId || !skillName || !cycle) {
      res.status(400).json({ error: 'กรุณาระบุ employeeId, skillName และ cycle' });
      return;
    }

    const empIdNum = Number(employeeId);

    // Upsert evaluation record by unique key [employeeId, skillName, cycle, attemptNumber]
    const saved = await prisma.skillEvaluation.upsert({
      where: {
        employeeId_skillName_cycle_attemptNumber: {
          employeeId: empIdNum,
          skillName,
          cycle,
          attemptNumber: Number(attemptNumber ?? 1),
        },
      },
      update: {
        resultLevel: Number(resultLevel ?? 0),
        targetLevel: Number(targetLevel ?? 0),
        assessorName: assessorName || 'ผู้ประเมิน',
        remark: remark || null,
        evaluatedAt: evaluatedAt ? new Date(evaluatedAt) : new Date(),
      },
      create: {
        employeeId: empIdNum,
        employeeName: employeeName || '-',
        department: department || '-',
        position: position || '-',
        skillName,
        category: category || 'CORE',
        targetLevel: Number(targetLevel ?? 0),
        resultLevel: Number(resultLevel ?? 0),
        cycle,
        attemptNumber: Number(attemptNumber ?? 1),
        evaluatedAt: evaluatedAt ? new Date(evaluatedAt) : new Date(),
        assessorName: assessorName || 'ผู้ประเมิน',
        remark: remark || null,
      },
    });

    res.status(201).json(saved);
  } catch (err) {
    console.error('Save skill evaluation error:', err);
    res.status(500).json({ error: 'บันทึกข้อมูลการประเมินทักษะไม่สำเร็จ' });
  }
});

// GET /api/skill-evaluation-rounds
skillEvaluationsRouter.get('/skill-evaluation-rounds', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.query;
    const rounds = await prisma.skillEvaluationRound.findMany({
      where: employeeId ? { employeeId: Number(employeeId) } : {},
      orderBy: { id: 'desc' },
    });
    res.json(rounds);
  } catch (err) {
    console.error('Fetch skill evaluation rounds error:', err);
    res.status(500).json({ error: 'ไม่สามารถโหลดข้อมูลรอบการประเมินทักษะได้' });
  }
});

// POST /api/skill-evaluation-rounds
skillEvaluationsRouter.post('/skill-evaluation-rounds', async (req: Request, res: Response) => {
  try {
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

    if (!employeeId || !cycle) {
      res.status(400).json({ error: 'กรุณาระบุ employeeId และ cycle' });
      return;
    }

    const empIdNum = Number(employeeId);
    const attemptNum = Number(attemptNumber ?? 1);

    const round = await prisma.skillEvaluationRound.upsert({
      where: {
        employeeId_cycle_attemptNumber: {
          employeeId: empIdNum,
          cycle,
          attemptNumber: attemptNum,
        },
      },
      update: {
        actionPeriodFrom: actionPeriodFrom ? new Date(actionPeriodFrom) : null,
        actionPeriodTo: actionPeriodTo ? new Date(actionPeriodTo) : null,
        assessorName: assessorName || 'ผู้ประเมิน',
        assessorSignature: assessorSignature || null,
        deptManagerName: deptManagerName || null,
        deptManagerSignature: deptManagerSignature || null,
        hrDeptName: hrDeptName || null,
        hrDeptSignature: hrDeptSignature || null,
        signedAt: signedAt ? new Date(signedAt) : new Date(),
      },
      create: {
        employeeId: empIdNum,
        cycle,
        attemptNumber: attemptNum,
        actionPeriodFrom: actionPeriodFrom ? new Date(actionPeriodFrom) : null,
        actionPeriodTo: actionPeriodTo ? new Date(actionPeriodTo) : null,
        assessorName: assessorName || 'ผู้ประเมิน',
        assessorSignature: assessorSignature || null,
        deptManagerName: deptManagerName || null,
        deptManagerSignature: deptManagerSignature || null,
        hrDeptName: hrDeptName || null,
        hrDeptSignature: hrDeptSignature || null,
        signedAt: signedAt ? new Date(signedAt) : new Date(),
      },
    });

    res.status(201).json(round);
  } catch (err) {
    console.error('Save skill evaluation round error:', err);
    res.status(500).json({ error: 'บันทึกรอบการประเมินทักษะไม่สำเร็จ' });
  }
});
