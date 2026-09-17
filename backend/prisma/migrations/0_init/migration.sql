-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "employees" (
    "id" SERIAL NOT NULL,
    "empCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "department" TEXT NOT NULL,
    "section" TEXT,
    "position" TEXT NOT NULL,
    "startingDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROBATION',
    "orientationPassed" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "passwordHash" VARCHAR(255),
    "avatar" TEXT,
    "supervisorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_standards" (
    "id" SERIAL NOT NULL,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "targetLevel" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_courses" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_attendances" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "trainingDate" TIMESTAMP(3) NOT NULL,
    "timeRange" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "checkInMorning" TEXT,
    "checkInAfternoon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_submissions" (
    "id" SERIAL NOT NULL,
    "formResponseId" TEXT NOT NULL,
    "courseId" INTEGER,
    "courseCategory" TEXT NOT NULL,
    "empCode" TEXT NOT NULL,
    "employeeId" INTEGER,
    "respondentName" TEXT NOT NULL,
    "respondentEmail" TEXT,
    "totalQuestions" INTEGER NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "wrongCount" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "isPassed" BOOLEAN NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ojt_sessions" (
    "id" SERIAL NOT NULL,
    "formType" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "evaluationMethod" TEXT NOT NULL,
    "hasAttachment" BOOLEAN NOT NULL DEFAULT false,
    "purposeType" TEXT,
    "changeReasonCategory" TEXT,
    "changeReasonOtherDetail" TEXT,
    "assessorName" TEXT NOT NULL,
    "managerName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "courseTitle" TEXT,
    "trainingDate" TIMESTAMP(3),
    "timeFrom" TEXT,
    "timeTo" TEXT,
    "location" TEXT,
    "instructorName1" TEXT,
    "instructorName2" TEXT,

    CONSTRAINT "ojt_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ojt_content_items" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "trainingDate" TIMESTAMP(3),
    "timeFrom" TEXT,
    "timeTo" TEXT,
    "resultPercent" INTEGER,
    "remark" TEXT,

    CONSTRAINT "ojt_content_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ojt_participants" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "empCode" TEXT NOT NULL,
    "employeeId" INTEGER,
    "employeeName" TEXT NOT NULL,
    "position" TEXT,
    "preScore" INTEGER,
    "postScore" INTEGER,
    "instructorScorePercent" INTEGER NOT NULL,
    "isPassed" BOOLEAN NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "ojt_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "probation_evaluations" (
    "id" SERIAL NOT NULL,
    "empCode" TEXT NOT NULL,
    "employeeId" INTEGER,
    "employeeName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "startingDate" TIMESTAMP(3) NOT NULL,
    "evalDate" TIMESTAMP(3) NOT NULL,
    "knowledge" INTEGER NOT NULL,
    "diligence" INTEGER NOT NULL,
    "responsibility" INTEGER NOT NULL,
    "teamwork" INTEGER NOT NULL,
    "attitude" INTEGER NOT NULL,
    "regulationCompliance" INTEGER NOT NULL,
    "problemSolving" INTEGER NOT NULL,
    "learningAbility" INTEGER NOT NULL,
    "ppeUse" INTEGER NOT NULL,
    "activityParticipation" INTEGER NOT NULL,
    "criteriaTotalScore" INTEGER NOT NULL,
    "criteriaPercentage" DOUBLE PRECISION NOT NULL,
    "attendancePercentage" DOUBLE PRECISION NOT NULL,
    "resultScore" DOUBLE PRECISION NOT NULL,
    "grade" TEXT NOT NULL,
    "isPassed" BOOLEAN NOT NULL,
    "outcome" TEXT,
    "comments" TEXT,
    "assessorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "probation_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_evaluations" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER,
    "employeeName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetLevel" INTEGER NOT NULL,
    "resultLevel" INTEGER NOT NULL,
    "cycle" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL,
    "assessorName" TEXT NOT NULL,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_evaluation_rounds" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER,
    "cycle" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "actionPeriodFrom" TIMESTAMP(3),
    "actionPeriodTo" TIMESTAMP(3),
    "assessorName" TEXT NOT NULL,
    "assessorSignature" TEXT,
    "deptManagerName" TEXT,
    "deptManagerSignature" TEXT,
    "hrDeptName" TEXT,
    "hrDeptSignature" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_evaluation_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER,
    "empCode" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "certName" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "certNumber" TEXT,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_empCode_key" ON "employees"("empCode");

-- CreateIndex
CREATE INDEX "skill_standards_department_position_idx" ON "skill_standards"("department", "position");

-- CreateIndex
CREATE UNIQUE INDEX "skill_standards_department_position_category_skillName_key" ON "skill_standards"("department", "position", "category", "skillName");

-- CreateIndex
CREATE UNIQUE INDEX "training_courses_code_key" ON "training_courses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "training_attendances_courseId_employeeId_trainingDate_key" ON "training_attendances"("courseId", "employeeId", "trainingDate");

-- CreateIndex
CREATE UNIQUE INDEX "exam_submissions_formResponseId_key" ON "exam_submissions"("formResponseId");

-- CreateIndex
CREATE INDEX "exam_submissions_empCode_idx" ON "exam_submissions"("empCode");

-- CreateIndex
CREATE UNIQUE INDEX "ojt_content_items_sessionId_sequence_key" ON "ojt_content_items"("sessionId", "sequence");

-- CreateIndex
CREATE INDEX "ojt_participants_empCode_idx" ON "ojt_participants"("empCode");

-- CreateIndex
CREATE INDEX "probation_evaluations_empCode_idx" ON "probation_evaluations"("empCode");

-- CreateIndex
CREATE INDEX "skill_evaluations_employeeId_cycle_idx" ON "skill_evaluations"("employeeId", "cycle");

-- CreateIndex
CREATE UNIQUE INDEX "skill_evaluations_employeeId_skillName_cycle_attemptNumber_key" ON "skill_evaluations"("employeeId", "skillName", "cycle", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "skill_evaluation_rounds_employeeId_cycle_attemptNumber_key" ON "skill_evaluation_rounds"("employeeId", "cycle", "attemptNumber");

-- CreateIndex
CREATE INDEX "certificates_empCode_idx" ON "certificates"("empCode");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_attendances" ADD CONSTRAINT "training_attendances_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "training_courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_attendances" ADD CONSTRAINT "training_attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_submissions" ADD CONSTRAINT "exam_submissions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "training_courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_submissions" ADD CONSTRAINT "exam_submissions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ojt_content_items" ADD CONSTRAINT "ojt_content_items_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ojt_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ojt_participants" ADD CONSTRAINT "ojt_participants_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ojt_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ojt_participants" ADD CONSTRAINT "ojt_participants_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "probation_evaluations" ADD CONSTRAINT "probation_evaluations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_evaluations" ADD CONSTRAINT "skill_evaluations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_evaluation_rounds" ADD CONSTRAINT "skill_evaluation_rounds_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

