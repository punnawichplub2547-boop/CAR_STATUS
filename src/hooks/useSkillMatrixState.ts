import { useState, useEffect, useCallback } from 'react';
import type {
  SkillStandard,
  SkillEvaluation,
  SkillEvaluationRound,
  SkillLevel,
  EvaluationCycle,
  EvaluationAttempt,
} from '../types';
import {
  fetchBackendSkillStandards,
  createBackendSkillStandard,
  updateBackendSkillStandard,
  deleteBackendSkillStandard,
  fetchBackendSkillEvaluations,
  saveBackendSkillEvaluation,
  fetchBackendSkillEvaluationRounds,
  saveBackendSkillEvaluationRound,
  type SkillStandardPayload,
  type BackendSkillEvaluation,
  type BackendSkillEvaluationRound,
} from '../utils/api';
import { INITIAL_SKILL_STANDARDS } from '../data/mockData';

export function mapBackendSkillEvaluation(row: BackendSkillEvaluation): SkillEvaluation {
  const employeeId = row.employeeId != null ? String(row.employeeId) : '';
  return {
    id: String(row.id),
    roundId: `${employeeId}_${row.cycle}_${row.attemptNumber}`,
    employeeId,
    employeeName: row.employeeName,
    position: row.position,
    department: row.department,
    skillName: row.skillName,
    category: row.category,
    targetLevel: row.targetLevel as SkillLevel,
    resultLevel: row.resultLevel as SkillLevel,
    cycle: row.cycle as EvaluationCycle,
    attemptNumber: row.attemptNumber as EvaluationAttempt,
    evaluatedAt: row.evaluatedAt.slice(0, 10),
    assessorName: row.assessorName,
    remark: row.remark ?? undefined,
  };
}

export function mapBackendSkillEvaluationRound(row: BackendSkillEvaluationRound): SkillEvaluationRound {
  const employeeId = row.employeeId != null ? String(row.employeeId) : '';
  return {
    id: String(row.id),
    employeeId,
    cycle: row.cycle as EvaluationCycle,
    attemptNumber: row.attemptNumber as EvaluationAttempt,
    actionPeriodFrom: row.actionPeriodFrom?.slice(0, 10) ?? '',
    actionPeriodTo: row.actionPeriodTo?.slice(0, 10) ?? '',
    assessorName: row.assessorName,
    assessorSignature: row.assessorSignature ?? undefined,
    deptManagerName: row.deptManagerName ?? '',
    deptManagerSignature: row.deptManagerSignature ?? undefined,
    hrDeptName: row.hrDeptName ?? '',
    hrDeptSignature: row.hrDeptSignature ?? undefined,
    signedAt: row.signedAt?.slice(0, 10) ?? undefined,
  };
}

export function useSkillMatrixState() {
  const [skillStandards, setSkillStandards] = useState<SkillStandard[]>(INITIAL_SKILL_STANDARDS);
  const [skillStandardsError, setSkillStandardsError] = useState<string | null>(null);
  const [skillEvaluations, setSkillEvaluations] = useState<SkillEvaluation[]>([]);
  const [skillEvaluationRounds, setSkillEvaluationRounds] = useState<SkillEvaluationRound[]>([]);
  const [skillEvaluationsError, setSkillEvaluationsError] = useState<string | null>(null);

  useEffect(() => {
    fetchBackendSkillStandards()
      .then((rows) => {
        if (rows.length > 0) {
          setSkillStandards(
            rows.map((r) => ({
              id: String(r.id),
              department: r.department,
              position: r.position,
              category: r.category,
              skillName: r.skillName,
              targetLevel: r.targetLevel as SkillLevel,
            }))
          );
        }
      })
      .catch((err) => {
        setSkillStandardsError(err instanceof Error ? err.message : 'unknown error');
      });

    fetchBackendSkillEvaluations()
      .then((rows) => setSkillEvaluations(rows.map(mapBackendSkillEvaluation)))
      .catch((err) => setSkillEvaluationsError(err instanceof Error ? err.message : 'unknown error'));

    fetchBackendSkillEvaluationRounds()
      .then((rows) => setSkillEvaluationRounds(rows.map(mapBackendSkillEvaluationRound)))
      .catch((err) => setSkillEvaluationsError(err instanceof Error ? err.message : 'unknown error'));
  }, []);

  const handleAddSkillStandard = (payload: SkillStandardPayload) => {
    createBackendSkillStandard(payload)
      .then((row) =>
        setSkillStandards((prev) => [...prev, { id: String(row.id), ...payload, targetLevel: payload.targetLevel as SkillLevel }])
      )
      .catch((err) => window.alert(`เพิ่มมาตรฐานทักษะไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown error'}`));
  };

  const handleEditSkillStandard = (id: string, payload: SkillStandardPayload) => {
    updateBackendSkillStandard(Number(id), payload)
      .then(() =>
        setSkillStandards((prev) =>
          prev.map((s) => (s.id === id ? { id, ...payload, targetLevel: payload.targetLevel as SkillLevel } : s))
        )
      )
      .catch((err) => window.alert(`แก้ไขมาตรฐานทักษะไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown error'}`));
  };

  const handleDeleteSkillStandard = (id: string) => {
    deleteBackendSkillStandard(Number(id))
      .then(() => setSkillStandards((prev) => prev.filter((s) => s.id !== id)))
      .catch((err) => window.alert(`ลบมาตรฐานทักษะไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown error'}`));
  };

  const handleUpdateEvaluation = useCallback((updated: SkillEvaluation) => {
    setSkillEvaluations((prev) => {
      const exists = prev.some((e) => e.id === updated.id);
      return exists ? prev.map((e) => (e.id === updated.id ? updated : e)) : [updated, ...prev];
    });

    saveBackendSkillEvaluation({
      employeeId: Number(updated.employeeId),
      employeeName: updated.employeeName,
      department: updated.department,
      position: updated.position,
      skillName: updated.skillName,
      category: updated.category,
      targetLevel: updated.targetLevel,
      resultLevel: updated.resultLevel,
      cycle: updated.cycle,
      attemptNumber: updated.attemptNumber,
      evaluatedAt: updated.evaluatedAt,
      assessorName: updated.assessorName,
      remark: updated.remark,
    })
      .then((row) => {
        const real = mapBackendSkillEvaluation(row);
        setSkillEvaluations((prev) => [
          real,
          ...prev.filter(
            (e) =>
              !(
                e.employeeId === real.employeeId &&
                e.skillName === real.skillName &&
                e.cycle === real.cycle &&
                e.attemptNumber === real.attemptNumber
              )
          ),
        ]);
      })
      .catch((err) =>
        window.alert(`บันทึกผลประเมินทักษะเข้าระบบ backend ไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown error'}`)
      );
  }, []);

  const handleSaveEvaluationRound = useCallback((round: SkillEvaluationRound) => {
    setSkillEvaluationRounds((prev) => {
      const exists = prev.some((r) => r.id === round.id);
      return exists ? prev.map((r) => (r.id === round.id ? round : r)) : [round, ...prev];
    });

    saveBackendSkillEvaluationRound({
      employeeId: Number(round.employeeId),
      cycle: round.cycle,
      attemptNumber: round.attemptNumber,
      actionPeriodFrom: round.actionPeriodFrom || undefined,
      actionPeriodTo: round.actionPeriodTo || undefined,
      assessorName: round.assessorName,
      assessorSignature: round.assessorSignature,
      deptManagerName: round.deptManagerName,
      deptManagerSignature: round.deptManagerSignature,
      hrDeptName: round.hrDeptName,
      hrDeptSignature: round.hrDeptSignature,
      signedAt: round.signedAt,
    })
      .then((row) => {
        const real = mapBackendSkillEvaluationRound(row);
        setSkillEvaluationRounds((prev) => [
          real,
          ...prev.filter(
            (r) => !(r.employeeId === real.employeeId && r.cycle === real.cycle && r.attemptNumber === real.attemptNumber)
          ),
        ]);
      })
      .catch((err) =>
        window.alert(`บันทึกรอบการประเมินทักษะเข้าระบบ backend ไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown error'}`)
      );
  }, []);

  return {
    skillStandards,
    setSkillStandards,
    skillStandardsError,
    skillEvaluations,
    setSkillEvaluations,
    skillEvaluationRounds,
    setSkillEvaluationRounds,
    skillEvaluationsError,
    handleAddSkillStandard,
    handleEditSkillStandard,
    handleDeleteSkillStandard,
    handleUpdateEvaluation,
    handleSaveEvaluationRound,
  };
}
