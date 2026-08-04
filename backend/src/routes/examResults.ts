import { Router } from 'express';
import { prisma } from '../db.js';
import { requireWebhookSecret } from '../middleware/webhookAuth.js';

export const examResultsRouter = Router();

const PASS_RULES = {
  REGULATION: (percentage: number, _wrongCount: number) => percentage >= 80,
  SAFETY: (_percentage: number, wrongCount: number) => wrongCount <= 2,
} as const;

type CourseCategory = keyof typeof PASS_RULES;

function isCourseCategory(value: unknown): value is CourseCategory {
  return value === 'REGULATION' || value === 'SAFETY';
}

interface WebhookPayload {
  formResponseId: string;
  courseCategory: string;
  empCode: string;
  respondentName: string;
  respondentEmail?: string;
  totalQuestions: number;
  correctCount: number;
  submittedAt: string;
}

// Called by the Google Apps Script onFormSubmit trigger — see
// backend/apps-script/Code.gs for the caller side.
examResultsRouter.post('/webhook/exam-result', requireWebhookSecret, async (req, res) => {
  const body = req.body as Partial<WebhookPayload>;

  if (
    !body.formResponseId ||
    !isCourseCategory(body.courseCategory) ||
    !body.empCode ||
    !body.respondentName ||
    typeof body.totalQuestions !== 'number' ||
    typeof body.correctCount !== 'number' ||
    !body.submittedAt
  ) {
    res.status(400).json({ error: 'Missing or invalid fields in webhook payload' });
    return;
  }

  const courseCategory = body.courseCategory;
  const wrongCount = body.totalQuestions - body.correctCount;
  const percentage = (body.correctCount / body.totalQuestions) * 100;
  const isPassed = PASS_RULES[courseCategory](percentage, wrongCount);

  const employee = await prisma.employee.findUnique({ where: { empCode: body.empCode } });
  const course = await prisma.trainingCourse.findFirst({ where: { category: courseCategory } });

  const submission = await prisma.examSubmission.upsert({
    where: { formResponseId: body.formResponseId },
    create: {
      formResponseId: body.formResponseId,
      courseCategory,
      courseId: course?.id,
      empCode: body.empCode,
      employeeId: employee?.id,
      respondentName: body.respondentName,
      respondentEmail: body.respondentEmail,
      totalQuestions: body.totalQuestions,
      correctCount: body.correctCount,
      wrongCount,
      percentage,
      isPassed,
      submittedAt: new Date(body.submittedAt),
    },
    // A resubmitted/edited Google Form response reuses the same response ID —
    // keep the latest score instead of silently ignoring it.
    update: {
      correctCount: body.correctCount,
      wrongCount,
      percentage,
      isPassed,
      submittedAt: new Date(body.submittedAt),
    },
  });

  if (employee) {
    const passedBoth = await hasPassedBothCourses(employee.id);
    if (passedBoth !== employee.orientationPassed) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { orientationPassed: passedBoth },
      });
    }
  }

  res.status(201).json({ ok: true, submissionId: submission.id, matchedEmployee: Boolean(employee) });
});

async function hasPassedBothCourses(employeeId: number): Promise<boolean> {
  const passedSubmissions = await prisma.examSubmission.findMany({
    where: { employeeId, isPassed: true },
    select: { courseCategory: true },
  });
  const passedCategories = new Set(passedSubmissions.map((s) => s.courseCategory));
  return passedCategories.has('REGULATION') && passedCategories.has('SAFETY');
}

// HR-facing read endpoints.
examResultsRouter.get('/exam-results', async (req, res) => {
  const empCode = typeof req.query.empCode === 'string' ? req.query.empCode : undefined;
  const submissions = await prisma.examSubmission.findMany({
    where: empCode ? { empCode } : undefined,
    orderBy: { submittedAt: 'desc' },
    include: { employee: true },
  });
  res.json(submissions);
});

examResultsRouter.get('/exam-results/:empCode', async (req, res) => {
  const submissions = await prisma.examSubmission.findMany({
    where: { empCode: req.params.empCode },
    orderBy: { submittedAt: 'desc' },
  });
  res.json(submissions);
});
