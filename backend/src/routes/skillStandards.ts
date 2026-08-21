import { Router } from 'express';
import { prisma } from '../db.js';

export const skillStandardsRouter = Router();

skillStandardsRouter.get('/skill-standards', async (_req, res) => {
  try {
    const standards = await prisma.skillStandard.findMany({
      orderBy: [{ department: 'asc' }, { position: 'asc' }, { category: 'asc' }],
    });
    res.json(standards);
  } catch {
    res.status(500).json({ error: 'Database unavailable' });
  }
});

skillStandardsRouter.post('/skill-standards', async (req, res) => {
  const { department, position, category, skillName, targetLevel } = req.body;

  if (!department || !position || !category || !skillName || targetLevel === undefined) {
    res.status(400).json({ error: 'department, position, category, skillName, targetLevel are required' });
    return;
  }

  try {
    const standard = await prisma.skillStandard.create({
      data: { department, position, category, skillName, targetLevel },
    });
    res.status(201).json(standard);
  } catch {
    res.status(400).json({ error: 'สร้างมาตรฐานทักษะไม่สำเร็จ (อาจซ้ำกับรายการที่มีอยู่)' });
  }
});

skillStandardsRouter.put('/skill-standards/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid skill standard id' });
    return;
  }

  const { department, position, category, skillName, targetLevel } = req.body;
  if (!department || !position || !category || !skillName || targetLevel === undefined) {
    res.status(400).json({ error: 'department, position, category, skillName, targetLevel are required' });
    return;
  }

  try {
    const standard = await prisma.skillStandard.update({
      where: { id },
      data: { department, position, category, skillName, targetLevel },
    });
    res.json(standard);
  } catch {
    res.status(404).json({ error: 'Skill standard not found' });
  }
});

skillStandardsRouter.delete('/skill-standards/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid skill standard id' });
    return;
  }

  try {
    await prisma.skillStandard.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Skill standard not found' });
  }
});
