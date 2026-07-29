import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, RefreshCw, Target, X, Edit3, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend } from 'recharts';
import type {
  Employee,
  SkillStandard,
  SkillEvaluation,
  SkillEvaluationRound,
  SkillLevel,
  EvaluationAttempt,
  EvaluationCycle,
} from '../types';
import { SignaturePad } from './SignaturePad';

interface SkillMatrixViewProps {
  employees: Employee[];
  standards: SkillStandard[];
  evaluations: SkillEvaluation[];
  evaluationRounds: SkillEvaluationRound[];
  onUpdateEvaluation: (updated: SkillEvaluation) => void;
  onSaveRound: (round: SkillEvaluationRound) => void;
}

const LEVELS: SkillLevel[] = [0, 25, 50, 75, 100];
const LEVEL_LABEL: Record<SkillLevel, string> = {
  0: 'ไม่ผ่าน',
  25: 'ควบคุม',
  50: 'คอยตรวจ',
  75: 'ทำได้เอง',
  100: 'สอนงานได้',
};

const PieIcon: React.FC<{ level: SkillLevel }> = ({ level }) => <span className="pie-icon" data-lvl={level} />;

export const SkillMatrixView: React.FC<SkillMatrixViewProps> = ({
  employees,
  standards,
  evaluations,
  evaluationRounds,
  onUpdateEvaluation,
  onSaveRound,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('FMG-A');
  const [selectedCycle, setSelectedCycle] = useState<EvaluationCycle>('2026-07');
  const [showRadarModal, setShowRadarModal] = useState(false);
  const [activeEmpForRadar, setActiveEmpForRadar] = useState<Employee | null>(null);

  const deptEmployees = employees.filter((e) => e.department === selectedDept);
  const deptStandards = standards.filter((s) => s.department === selectedDept);

  // Radar chart uses the latest known result per skill (attempt 2 if it exists, else attempt 1)
  const getLatestResult = (empId: string, skillName: string) => {
    const attempt2 = evaluations.find(
      (e) => e.employeeId === empId && e.skillName === skillName && e.cycle === selectedCycle && e.attemptNumber === 2
    );
    if (attempt2) return attempt2.resultLevel;
    const attempt1 = evaluations.find(
      (e) => e.employeeId === empId && e.skillName === skillName && e.cycle === selectedCycle && e.attemptNumber === 1
    );
    return attempt1 ? attempt1.resultLevel : 0;
  };

  const getEmployeeRadarData = (emp: Employee) =>
    deptStandards.map((std) => ({
      skill: std.skillName,
      Target: std.targetLevel,
      Actual: getLatestResult(emp.id, std.skillName),
    }));

  return (
    <div className="skill-matrix-page content-container">
      <div className="page-header">
        <div>
          <div className="eyebrow-tag">
            <Target size={14} /> SKILL MATRIX & GAP • ตารางประเมินทักษะตามมาตรฐาน (F-HR-014)
          </div>
          <h1 className="page-title gradient-text">ระบบมาตรฐานและประเมินทักษะ (Skill Matrix)</h1>
          <p className="page-subtitle">
            ตารางเปรียบเทียบมาตรฐานทักษะ (F-HR-005) และบันทึกผลการประเมินทักษะความสามารถประจำรอบ (F-HR-014)
          </p>
        </div>
        <div className="header-actions">
          <span className="badge badge-purple" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            <RefreshCw size={14} /> รอบประเมิน: มกราคม & กรกฎาคม
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 24, display: 'flex', gap: 20, alignItems: 'center' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">เลือกแผนก / หน่วยงาน</label>
          <select className="form-control" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
            <option value="FMG-A">FMG-A (แผนกผลิตยางรถยนต์)</option>
            <option value="QA/QC">QA/QC (แผนกควบคุมคุณภาพ)</option>
            <option value="HR&GA">HR&GA (แผนกบุคคลและธุรการ)</option>
            <option value="HR&GA IT">HR&GA IT</option>
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">รอบการประเมิน (Evaluation Cycle)</label>
          <select className="form-control" value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value as EvaluationCycle)}>
            <option value="2026-07">รอบ กรกฎาคม 2026 (July 2026)</option>
            <option value="2026-01">รอบ มกราคม 2026 (January 2026)</option>
          </select>
        </div>
      </div>

      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '8px 0 14px' }}>
        F-HR-014 • พนักงานในแผนก · {deptEmployees.length} คน
      </div>

      {deptEmployees.length === 0 && (
        <div className="glass-card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
          ไม่มีพนักงานในแผนกนี้
        </div>
      )}

      {deptEmployees.map((emp) => (
        <EmployeeEvalCard
          key={emp.id}
          emp={emp}
          standards={deptStandards}
          cycle={selectedCycle}
          evaluations={evaluations}
          evaluationRounds={evaluationRounds}
          onUpdateEvaluation={onUpdateEvaluation}
          onSaveRound={onSaveRound}
          onOpenRadar={() => {
            setActiveEmpForRadar(emp);
            setShowRadarModal(true);
          }}
        />
      ))}

      {/* Radar Chart Modal */}
      {showRadarModal && activeEmpForRadar && (
        <div className="modal-overlay" onClick={() => setShowRadarModal(false)}>
          <div className="modal-content" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Competency Radar Chart: {activeEmpForRadar.name}</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowRadarModal(false)}
                style={{ padding: 6, borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 20 }}>
                ตำแหน่ง: <strong style={{ color: 'var(--text-main)' }}>{activeEmpForRadar.position}</strong> ({activeEmpForRadar.department}) • รอบประเมิน: {selectedCycle}
              </div>

              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getEmployeeRadarData(activeEmpForRadar)}>
                    <PolarGrid stroke="var(--border-color)" />
                    <PolarAngleAxis
                      dataKey="skill"
                      stroke="var(--text-muted)"
                      tick={{ fontSize: 11, fill: 'var(--text-main)', fontWeight: 600 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      stroke="var(--text-dim)"
                      tick={{ fill: 'var(--text-dim)', fontSize: 10 }}
                    />
                    <Radar
                      name="Actual Skill (F-HR-014)"
                      dataKey="Actual"
                      stroke="#059669"
                      fill="#10b981"
                      fillOpacity={0.5}
                      strokeWidth={2.5}
                    />
                    <Radar
                      name="Target Standard (F-HR-005)"
                      dataKey="Target"
                      stroke="#2563eb"
                      fill="#3b82f6"
                      fillOpacity={0.15}
                      strokeWidth={2.5}
                    />
                    <Legend wrapperStyle={{ paddingTop: 10, fontSize: '0.85rem' }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 12,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        color: 'var(--text-main)',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowRadarModal(false)}>
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---- one F-HR-014 form-card per employee ----
const EmployeeEvalCard: React.FC<{
  emp: Employee;
  standards: SkillStandard[];
  cycle: EvaluationCycle;
  evaluations: SkillEvaluation[];
  evaluationRounds: SkillEvaluationRound[];
  onUpdateEvaluation: (updated: SkillEvaluation) => void;
  onSaveRound: (round: SkillEvaluationRound) => void;
  onOpenRadar: () => void;
}> = ({ emp, standards, cycle, evaluations, evaluationRounds, onUpdateEvaluation, onSaveRound, onOpenRadar }) => {
  const [attempt, setAttempt] = useState<EvaluationAttempt>(1);

  const attempt1Done = standards.length > 0 && standards.every((std) =>
    evaluations.some((e) => e.employeeId === emp.id && e.skillName === std.skillName && e.cycle === cycle && e.attemptNumber === 1)
  );
  const attempt1HasGap = standards.some((std) => {
    const ev = evaluations.find((e) => e.employeeId === emp.id && e.skillName === std.skillName && e.cycle === cycle && e.attemptNumber === 1);
    return ev && ev.resultLevel < std.targetLevel;
  });

  return (
    <div className="glass-card" style={{ marginBottom: 22, overflow: 'hidden', padding: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', padding: '18px 20px', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{emp.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3 }}>
            {emp.empCode} • {emp.position}
          </div>
        </div>
        <button className="btn btn-sm btn-secondary" onClick={onOpenRadar}>
          <Eye size={14} /> Radar Chart
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '14px 20px 0' }}>
        <button
          className={`btn btn-sm ${attempt === 1 ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setAttempt(1)}
        >
          ครั้งที่ 1 {attempt1Done && !attempt1HasGap ? '✓' : ''}
        </button>
        <button
          className={`btn btn-sm ${attempt === 2 ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setAttempt(2)}
        >
          ครั้งที่ 2 {attempt1HasGap ? '(ประเมินซ้ำ)' : ''}
        </button>
      </div>

      <RoundPanel
        key={attempt}
        attempt={attempt}
        emp={emp}
        standards={standards}
        cycle={cycle}
        evaluations={evaluations}
        evaluationRounds={evaluationRounds}
        onUpdateEvaluation={onUpdateEvaluation}
        onSaveRound={onSaveRound}
      />
    </div>
  );
};

// ---- the Action Period / skill grid / sign-off block for one attempt ----
const RoundPanel: React.FC<{
  attempt: EvaluationAttempt;
  emp: Employee;
  standards: SkillStandard[];
  cycle: EvaluationCycle;
  evaluations: SkillEvaluation[];
  evaluationRounds: SkillEvaluationRound[];
  onUpdateEvaluation: (updated: SkillEvaluation) => void;
  onSaveRound: (round: SkillEvaluationRound) => void;
}> = ({ attempt, emp, standards, cycle, evaluations, evaluationRounds, onUpdateEvaluation, onSaveRound }) => {
  const roundId = `${emp.id}_${cycle}_${attempt}`;
  const existingRound = evaluationRounds.find((r) => r.id === roundId);

  const [actionFrom, setActionFrom] = useState(existingRound?.actionPeriodFrom ?? '');
  const [actionTo, setActionTo] = useState(existingRound?.actionPeriodTo ?? '');
  const [assessorName, setAssessorName] = useState(existingRound?.assessorName ?? 'นางสาว สมหญิง ใจดี');
  const [assessorSig, setAssessorSig] = useState<string | null>(existingRound?.assessorSignature ?? null);
  const [deptManagerName, setDeptManagerName] = useState(existingRound?.deptManagerName ?? '');
  const [deptManagerSig, setDeptManagerSig] = useState<string | null>(existingRound?.deptManagerSignature ?? null);
  const [hrDeptName, setHrDeptName] = useState(existingRound?.hrDeptName ?? '');
  const [hrDeptSig, setHrDeptSig] = useState<string | null>(existingRound?.hrDeptSignature ?? null);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);

  const openScorePopover = (skillId: string, triggerEl: HTMLElement) => {
    if (editingSkillId === skillId) {
      setEditingSkillId(null);
      setPopoverPos(null);
      return;
    }
    const rect = triggerEl.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const popoverHeight = 56;
    const top = spaceBelow < popoverHeight + 12 ? rect.top - popoverHeight - 8 : rect.bottom + 8;
    setPopoverPos({ top, left: rect.left + rect.width / 2 });
    setEditingSkillId(skillId);
  };

  const closeScorePopover = () => {
    setEditingSkillId(null);
    setPopoverPos(null);
  };

  const findEval = (skillName: string) =>
    evaluations.find((e) => e.employeeId === emp.id && e.skillName === skillName && e.cycle === cycle && e.attemptNumber === attempt);

  const handleScoreSelect = (std: SkillStandard, level: SkillLevel) => {
    const existing = findEval(std.skillName);
    onUpdateEvaluation({
      id: existing?.id ?? `eval-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      roundId,
      employeeId: emp.id,
      employeeName: emp.name,
      position: emp.position,
      department: emp.department,
      skillName: std.skillName,
      category: std.category,
      targetLevel: std.targetLevel,
      resultLevel: level,
      cycle,
      attemptNumber: attempt,
      evaluatedAt: new Date().toISOString().split('T')[0],
      assessorName,
      remark: existing?.remark,
    });
    closeScorePopover();
  };

  const handleRemarkBlur = (std: SkillStandard, value: string) => {
    const existing = findEval(std.skillName);
    if (!existing) return;
    onUpdateEvaluation({ ...existing, remark: value });
  };

  const handleSaveRound = () => {
    onSaveRound({
      id: roundId,
      employeeId: emp.id,
      cycle,
      attemptNumber: attempt,
      actionPeriodFrom: actionFrom,
      actionPeriodTo: actionTo,
      assessorName,
      assessorSignature: assessorSig ?? undefined,
      deptManagerName,
      deptManagerSignature: deptManagerSig ?? undefined,
      hrDeptName,
      hrDeptSignature: hrDeptSig ?? undefined,
      signedAt: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '16px 20px 0' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Action Period จาก</label>
          <input type="date" className="form-control" value={actionFrom} onChange={(e) => setActionFrom(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">ถึง</label>
          <input type="date" className="form-control" value={actionTo} onChange={(e) => setActionTo(e.target.value)} />
        </div>
      </div>

      <div className="table-responsive" style={{ padding: '16px 20px 0' }}>
        <table className="custom-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '38%' }}>หัวข้อทักษะ</th>
              <th style={{ textAlign: 'center' }}>เป้าหมาย</th>
              <th style={{ textAlign: 'center' }}>ผลจริง</th>
              <th>หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            {standards.map((std) => {
              const ev = findEval(std.skillName);
              const actual = ev ? ev.resultLevel : null;
              const isEditing = editingSkillId === std.id;
              return (
                <tr key={std.id}>
                  <td>
                    {std.skillName}
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{std.category}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <PieIcon level={std.targetLevel} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={(e) => openScorePopover(std.id, e.currentTarget)}
                      title="คลิกเพื่อประเมินระดับทักษะ"
                    >
                      <PieIcon level={actual ?? 0} />
                      <Edit3 size={12} style={{ opacity: 0.5 }} />
                    </button>
                    {isEditing &&
                      popoverPos &&
                      createPortal(
                        <>
                          <div className="score-popover-backdrop" onClick={closeScorePopover} />
                          <div
                            className="score-popover"
                            style={{ position: 'fixed', top: popoverPos.top, left: popoverPos.left, transform: 'translateX(-50%)', marginTop: 0 }}
                          >
                            {LEVELS.map((lvl) => (
                              <button
                                key={lvl}
                                className={`score-popover-btn ${actual === lvl ? 'active' : ''}`}
                                title={LEVEL_LABEL[lvl]}
                                onClick={() => handleScoreSelect(std, lvl)}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </>,
                        document.body
                      )}
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      defaultValue={ev?.remark ?? ''}
                      disabled={!ev}
                      placeholder={ev ? '—' : 'กรอกคะแนนก่อน'}
                      onBlur={(e) => handleRemarkBlur(std, e.target.value)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, padding: '20px' }}>
        <div>
          <SignaturePad label="Assessor" onChange={setAssessorSig} />
          <input
            type="text"
            className="form-control"
            style={{ marginTop: 8 }}
            value={assessorName}
            onChange={(e) => setAssessorName(e.target.value)}
          />
        </div>
        <div>
          <SignaturePad label="Dept. Manager" onChange={setDeptManagerSig} />
          <input
            type="text"
            className="form-control"
            style={{ marginTop: 8 }}
            placeholder="ชื่อผู้จัดการแผนก"
            value={deptManagerName}
            onChange={(e) => setDeptManagerName(e.target.value)}
          />
        </div>
        <div>
          <SignaturePad label="HR Dept." onChange={setHrDeptSig} />
          <input
            type="text"
            className="form-control"
            style={{ marginTop: 8 }}
            placeholder="ชื่อฝ่ายบุคคล"
            value={hrDeptName}
            onChange={(e) => setHrDeptName(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '0 20px 20px' }}>
        <button className="btn btn-primary" onClick={handleSaveRound}>
          <CheckCircle2 size={16} /> บันทึกผลประเมิน (ครั้งที่ {attempt})
        </button>
      </div>
    </>
  );
};
