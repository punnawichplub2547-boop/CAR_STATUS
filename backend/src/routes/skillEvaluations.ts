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

    const rounds = await prisma.skillEvaluationRound.findMany({
      where: employeeId ? { employeeId: Number(employeeId) } : {},
      orderBy: { id: 'desc' },
    });

    res.json({ evaluations, rounds });
  } catch (err) {
    console.error('Fetch skill evaluations error:', err);
    res.status(500).json({ error: 'ไม่สามารถโหลดข้อมูล Skill Evaluation ได้' });
  }
});

// POST /api/skill-evaluations
skillEvaluationsRouter.post('/skill-evaluations', async (req: Request, res: Response) => {
  try {
    const { evaluations, round } = req.body;

    if (!Array.isArray(evaluations) || evaluations.length === 0) {
      res.status(400).json({ error: 'กรุณาระบุรายการประเมินทักษะ (evaluations array)' });
      return;
    }

    const savedEvaluations = [];

    for (const item of evaluations) {
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
      } = item;

      const empIdNum = Number(employeeId) || 0;

      // Upsert evaluation record by unique key [employeeId, skillName, cycle, attemptNumber]
      const saved = await prisma.skillEvaluation.upsert({
        where: {
          employeeId_skillName_cycle_attemptNumber: {
            employeeId: empIdNum,
            skillName,
            cycle: cycle || '2026-07',
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
          cycle: cycle || '2026-07',
          attemptNumber: Number(attemptNumber ?? 1),
          evaluatedAt: evaluatedAt ? new Date(evaluatedAt) : new Date(),
          assessorName: assessorName || 'ผู้ประเมิน',
          remark: remark || null,
        },
      });

      savedEvaluations.push(saved);
    }

    // If round sign-off provided, upsert round
    let savedRound = null;
    if (round && round.employeeId) {
      const empIdNum = Number(round.employeeId);
      savedRound = await prisma.skillEvaluationRound.upsert({
        where: {
          employeeId_cycle_attemptNumber: {
            employeeId: empIdNum,
            cycle: round.cycle || '2026-07',
            attemptNumber: Number(round.attemptNumber ?? 1),
          },
        },
        update: {
          assessorName: round.assessorName || 'ผู้ประเมิน',
          assessorSignature: round.assessorSignature || null,
          deptManagerName: round.deptManagerName || null,
          deptManagerSignature: round.deptManagerSignature || null,
          hrDeptName: round.hrDeptName || null,
          hrDeptSignature: round.hrDeptSignature || null,
          signedAt: round.signedAt ? new Date(round.signedAt) : new Date(),
        },
        create: {
          employeeId: empIdNum,
          cycle: round.cycle || '2026-07',
          attemptNumber: Number(round.attemptNumber ?? 1),
          actionPeriodFrom: round.actionPeriodFrom ? new Date(round.actionPeriodFrom) : null,
          actionPeriodTo: round.actionPeriodTo ? new Date(round.actionPeriodTo) : null,
          assessorName: round.assessorName || 'ผู้ประเมิน',
          assessorSignature: round.assessorSignature || null,
          deptManagerName: round.deptManagerName || null,
          deptManagerSignature: round.deptManagerSignature || null,
          hrDeptName: round.hrDeptName || null,
          hrDeptSignature: round.hrDeptSignature || null,
          signedAt: round.signedAt ? new Date(round.signedAt) : new Date(),
        },
      });
    }

    res.status(201).json({ evaluations: savedEvaluations, round: savedRound });
  } catch (err) {
    console.error('Save skill evaluations error:', err);
    res.status(500).json({ error: 'บันทึกข้อมูลการประเมินทักษะไม่สำเร็จ' });
  }
});
