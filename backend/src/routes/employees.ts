import { Router } from 'express';
import { prisma } from '../db.js';
import type { ExamSubmission } from '@prisma/client';

export const employeesRouter = Router();

employeesRouter.get('/employees', async (_req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { empCode: 'asc' },
      select: {
        id: true,
        empCode: true,
        name: true,
        email: true,
        department: true,
        section: true,
        position: true,
        startingDate: true,
        status: true,
        orientationPassed: true,
        role: true,
        avatar: true,
        supervisorId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(employees);
  } catch {
    res.status(500).json({ error: 'Database unavailable' });
  }
});

type CourseCategory = 'REGULATION' | 'SAFETY';

function latestSubmissionPerCategory(submissions: ExamSubmission[]) {
  const latest: Record<CourseCategory, ExamSubmission | null> = { REGULATION: null, SAFETY: null };
  for (const s of submissions) {
    const category = s.courseCategory as CourseCategory;
    const current = latest[category];
    if (!current || s.submittedAt > current.submittedAt) latest[category] = s;
  }
  return {
    REGULATION: latest.REGULATION && {
      attempted: true,
      isPassed: latest.REGULATION.isPassed,
      percentage: latest.REGULATION.percentage,
      submittedAt: latest.REGULATION.submittedAt,
    },
    SAFETY: latest.SAFETY && {
      attempted: true,
      isPassed: latest.SAFETY.isPassed,
      percentage: latest.SAFETY.percentage,
      submittedAt: latest.SAFETY.submittedAt,
    },
  };
}

// Feeds the F-HR-002 name list: new employees who haven't cleared both
// orientation exams yet, sorted by employee code — with each person's latest
// exam attempt per course so HR can see who still needs which exam without
// leaving this page.
employeesRouter.get('/employees/pending-orientation', async (_req, res) => {
  const employees = await prisma.employee.findMany({
    where: { orientationPassed: false },
    orderBy: { empCode: 'asc' },
    include: { examSubmissions: true },
  });

  const withExamStatus = employees.map(({ examSubmissions, passwordHash: _, ...emp }) => ({
    ...emp,
    examStatus: latestSubmissionPerCategory(examSubmissions),
  }));

  res.json(withExamStatus);
});

employeesRouter.post('/employees', async (req, res) => {
  const { empCode, name, email, department, section, position, startingDate, status, role, avatar, supervisorId } = req.body;

  if (!empCode || !name || !department || !position || !startingDate) {
    res.status(400).json({ error: 'empCode, name, department, position, startingDate are required' });
    return;
  }

  if (supervisorId != null) {
    const supervisorExists = await prisma.employee.findUnique({ where: { id: Number(supervisorId) }, select: { id: true } });
    if (!supervisorExists) {
      res.status(400).json({ error: 'Invalid supervisorId: no such employee' });
      return;
    }
  }

  const parsedDate = isNaN(Date.parse(startingDate)) ? new Date() : new Date(startingDate);

  // upsert (not plain create) — syncLocalStorageEmployeesToBackend() posts
  // whatever's in localStorage on every load, which needs to be safe to
  // repeat against an empCode that's already been synced. The update branch
  // leaves status/role/avatar/supervisorId untouched when omitted (same
  // convention as PUT below) — falling back to defaults here would silently
  // reset an existing employee's role back to EMPLOYEE on every sync.
  const employee = await prisma.employee.upsert({
    where: { empCode },
    update: {
      name,
      email,
      department,
      section,
      position,
      startingDate: parsedDate,
      status,
      role,
      avatar,
      supervisorId: supervisorId != null ? Number(supervisorId) : supervisorId,
    },
    create: {
      empCode,
      name,
      email,
      department,
      section,
      position,
      startingDate: parsedDate,
      status: status ?? 'PROBATION',
      role: role ?? 'EMPLOYEE',
      avatar: avatar ?? null,
      supervisorId: supervisorId != null ? Number(supervisorId) : null,
    },
  });

  res.status(201).json(employee);
});

employeesRouter.put('/employees/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid employee id' });
    return;
  }

  const { empCode, name, email, department, section, position, startingDate, status, role, avatar, supervisorId } = req.body;
  if (!empCode || !name || !department || !position || !startingDate) {
    res.status(400).json({ error: 'empCode, name, department, position, startingDate are required' });
    return;
  }

  if (supervisorId != null) {
    if (Number(supervisorId) === id) {
      res.status(400).json({ error: 'Employee cannot be their own supervisor' });
      return;
    }
    const supervisorExists = await prisma.employee.findUnique({ where: { id: Number(supervisorId) }, select: { id: true } });
    if (!supervisorExists) {
      res.status(400).json({ error: 'Invalid supervisorId: no such employee' });
      return;
    }
  }

  try {
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        empCode,
        name,
        email,
        department,
        section,
        position,
        startingDate: new Date(startingDate),
        status,
        // Leave role/avatar/supervisorId untouched when omitted (undefined) —
        // OrientationExport.tsx only ever sends the 8 core fields and must
        // not clobber these back to defaults on its narrower edit form.
        role,
        avatar,
        supervisorId: supervisorId != null ? Number(supervisorId) : supervisorId,
      },
    });
    res.json(employee);
  } catch {
    res.status(404).json({ error: 'Employee not found' });
  }
});

employeesRouter.delete('/employees/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid employee id' });
    return;
  }

  try {
    await prisma.employee.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Employee not found' });
  }
});
