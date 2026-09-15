import { useState, useEffect } from 'react';
import type {
  OjtSession,
  OjtContentItem,
  OjtParticipant,
  ProbationEvaluation,
  OjtFormType,
  OjtEvaluationMethod,
  OjtPurposeType,
  OjtChangeReasonCategory,
  SkillLevel,
  ProbationPeriod,
  ProbationGrade,
  ProbationOutcome,
} from '../types';
import {
  fetchBackendOjtSessions,
  createBackendOjtSession,
  fetchBackendProbationEvaluations,
  createBackendProbationEvaluation,
  type BackendOjtSession,
  type BackendProbationEvaluation,
} from '../utils/api';

export function flattenBackendOjtSession(row: BackendOjtSession): {
  session: OjtSession;
  contentItems: OjtContentItem[];
  participants: OjtParticipant[];
} {
  const sessionId = String(row.id);
  return {
    session: {
      id: sessionId,
      formType: row.formType as OjtFormType,
      department: row.department,
      position: row.position,
      evaluationMethod: row.evaluationMethod as OjtEvaluationMethod,
      hasAttachment: row.hasAttachment,
      purposeType: row.purposeType != null ? (row.purposeType as OjtPurposeType) : undefined,
      changeReasonCategory: row.changeReasonCategory != null ? (row.changeReasonCategory as OjtChangeReasonCategory) : undefined,
      changeReasonOtherDetail: row.changeReasonOtherDetail ?? undefined,
      assessorName: row.assessorName,
      managerName: row.managerName,
      createdAt: row.createdAt,
      courseTitle: row.courseTitle ?? undefined,
      trainingDate: row.trainingDate ?? undefined,
      timeFrom: row.timeFrom ?? undefined,
      timeTo: row.timeTo ?? undefined,
      location: row.location ?? undefined,
      instructorName1: row.instructorName1 ?? undefined,
      instructorName2: row.instructorName2 ?? undefined,
    },
    contentItems: row.contentItems.map((c) => ({
      id: String(c.id),
      sessionId,
      sequence: c.sequence,
      description: c.description,
      trainingDate: c.trainingDate ?? undefined,
      timeFrom: c.timeFrom ?? undefined,
      timeTo: c.timeTo ?? undefined,
      resultPercent: c.resultPercent != null ? (c.resultPercent as SkillLevel) : undefined,
      remark: c.remark ?? undefined,
    })),
    participants: row.participants.map((p) => ({
      id: String(p.id),
      sessionId,
      employeeId: p.employeeId != null ? String(p.employeeId) : '',
      employeeName: p.employeeName,
      empCode: p.empCode,
      position: p.position ?? undefined,
      preScore: p.preScore ?? undefined,
      postScore: p.postScore ?? undefined,
      instructorScorePercent: p.instructorScorePercent as SkillLevel,
      isPassed: p.isPassed,
      remarks: p.remarks ?? undefined,
    })),
  };
}

export function mapBackendProbationEvaluation(row: BackendProbationEvaluation): ProbationEvaluation {
  return {
    id: String(row.id),
    employeeId: row.employeeId != null ? String(row.employeeId) : '',
    employeeName: row.employeeName,
    empCode: row.empCode,
    department: row.department,
    position: row.position,
    period: row.period as ProbationPeriod,
    startingDate: row.startingDate.slice(0, 10),
    evalDate: row.evalDate.slice(0, 10),
    scores: {
      knowledge: row.knowledge,
      diligence: row.diligence,
      responsibility: row.responsibility,
      teamwork: row.teamwork,
      attitude: row.attitude,
      regulationCompliance: row.regulationCompliance,
      problemSolving: row.problemSolving,
      learningAbility: row.learningAbility,
      ppeUse: row.ppeUse,
      activityParticipation: row.activityParticipation,
    },
    criteriaTotalScore: row.criteriaTotalScore,
    criteriaPercentage: row.criteriaPercentage,
    attendancePercentage: row.attendancePercentage,
    resultScore: row.resultScore,
    grade: row.grade as ProbationGrade,
    isPassed: row.isPassed,
    outcome: row.outcome != null ? (row.outcome as ProbationOutcome) : undefined,
    comments: row.comments ?? '',
    assessorName: row.assessorName,
    createdAt: row.createdAt,
  };
}

export function useOjtProbationState() {
  const [ojtSessions, setOjtSessions] = useState<OjtSession[]>([]);
  const [ojtContentItems, setOjtContentItems] = useState<OjtContentItem[]>([]);
  const [ojtParticipants, setOjtParticipants] = useState<OjtParticipant[]>([]);
  const [ojtHistoryError, setOjtHistoryError] = useState<string | null>(null);
  const [probationEvaluations, setProbationEvaluations] = useState<ProbationEvaluation[]>([]);
  const [probationError, setProbationError] = useState<string | null>(null);

  useEffect(() => {
    fetchBackendOjtSessions()
      .then((rows) => {
        const flattened = rows.map(flattenBackendOjtSession);
        setOjtSessions(flattened.map((f) => f.session));
        setOjtContentItems(flattened.flatMap((f) => f.contentItems));
        setOjtParticipants(flattened.flatMap((f) => f.participants));
      })
      .catch((err) => setOjtHistoryError(err instanceof Error ? err.message : 'unknown error'));

    fetchBackendProbationEvaluations()
      .then((rows) => setProbationEvaluations(rows.map(mapBackendProbationEvaluation)))
      .catch((err) => setProbationError(err instanceof Error ? err.message : 'unknown error'));
  }, []);

  const handleAddOjtSession = (
    session: OjtSession,
    contentItems: OjtContentItem[],
    participants: OjtParticipant[]
  ) => {
    const tempSessionId = session.id;
    setOjtSessions((prev) => [session, ...prev]);
    setOjtContentItems((prev) => [...contentItems, ...prev]);
    setOjtParticipants((prev) => [...participants, ...prev]);

    createBackendOjtSession({
      formType: session.formType,
      department: session.department,
      position: session.position,
      evaluationMethod: session.evaluationMethod,
      hasAttachment: session.hasAttachment,
      purposeType: session.purposeType,
      changeReasonCategory: session.changeReasonCategory,
      changeReasonOtherDetail: session.changeReasonOtherDetail,
      assessorName: session.assessorName,
      managerName: session.managerName,
      courseTitle: session.courseTitle,
      trainingDate: session.trainingDate,
      timeFrom: session.timeFrom,
      timeTo: session.timeTo,
      location: session.location,
      instructorName1: session.instructorName1,
      instructorName2: session.instructorName2,
      contentItems: contentItems.map((c) => ({
        sequence: c.sequence,
        description: c.description,
        trainingDate: c.trainingDate,
        timeFrom: c.timeFrom,
        timeTo: c.timeTo,
        resultPercent: c.resultPercent,
        remark: c.remark,
      })),
      participants: participants.map((p) => ({
        empCode: p.empCode,
        employeeName: p.employeeName,
        position: p.position,
        preScore: p.preScore,
        postScore: p.postScore,
        instructorScorePercent: p.instructorScorePercent,
        isPassed: p.isPassed,
        remarks: p.remarks,
      })),
    })
      .then((row) => {
        const flattened = flattenBackendOjtSession(row);
        setOjtSessions((prev) => [flattened.session, ...prev.filter((s) => s.id !== tempSessionId)]);
        setOjtContentItems((prev) => [...flattened.contentItems, ...prev.filter((c) => c.sessionId !== tempSessionId)]);
        setOjtParticipants((prev) => [...flattened.participants, ...prev.filter((p) => p.sessionId !== tempSessionId)]);
      })
      .catch((err) => {
        window.alert(
          `บันทึกผล OJT ในระบบหลักสำเร็จ แต่ซิงก์เข้าระบบ backend ไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown error'}`
        );
      });
  };

  const handleAddProbationEval = (evalRec: ProbationEvaluation) => {
    const tempId = evalRec.id;
    setProbationEvaluations((prev) => [evalRec, ...prev]);

    createBackendProbationEvaluation({
      empCode: evalRec.empCode,
      employeeName: evalRec.employeeName,
      department: evalRec.department,
      position: evalRec.position,
      period: evalRec.period,
      startingDate: evalRec.startingDate,
      evalDate: evalRec.evalDate,
      knowledge: evalRec.scores.knowledge,
      diligence: evalRec.scores.diligence,
      responsibility: evalRec.scores.responsibility,
      teamwork: evalRec.scores.teamwork,
      attitude: evalRec.scores.attitude,
      regulationCompliance: evalRec.scores.regulationCompliance,
      problemSolving: evalRec.scores.problemSolving,
      learningAbility: evalRec.scores.learningAbility,
      ppeUse: evalRec.scores.ppeUse,
      activityParticipation: evalRec.scores.activityParticipation,
      criteriaTotalScore: evalRec.criteriaTotalScore,
      criteriaPercentage: evalRec.criteriaPercentage,
      attendancePercentage: evalRec.attendancePercentage,
      resultScore: evalRec.resultScore,
      grade: evalRec.grade,
      isPassed: evalRec.isPassed,
      outcome: evalRec.outcome,
      comments: evalRec.comments,
      assessorName: evalRec.assessorName,
    })
      .then((row) => {
        const real = mapBackendProbationEvaluation(row);
        setProbationEvaluations((prev) => [real, ...prev.filter((e) => e.id !== tempId)]);
      })
      .catch((err) => {
        window.alert(
          `บันทึกผลประเมินทดลองงานในระบบหลักสำเร็จ แต่ซิงก์เข้าระบบ backend ไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown error'}`
        );
      });
  };

  return {
    ojtSessions,
    ojtContentItems,
    ojtParticipants,
    ojtHistoryError,
    probationEvaluations,
    probationError,
    handleAddOjtSession,
    handleAddProbationEval,
  };
}
