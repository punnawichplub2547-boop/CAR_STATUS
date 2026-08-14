import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, UserCheck, RotateCcw, FileSpreadsheet, Lock, Globe2 } from 'lucide-react';
import type { Employee, ProbationEvaluation, ProbationCriteriaScores, ProbationPeriod, ProbationOutcome } from '../types';
import type { EmployeePayload } from '../utils/api';
import { exportFHR009 } from '../utils/fhr009Exporter';

interface ProbationEvaluatorProps {
  employees: Employee[];
  currentUser: Employee;
  onAddProbationEval: (evalRec: ProbationEvaluation) => void;
  onEditEmployee: (id: string, payload: EmployeePayload) => void;
}

const OUTCOME_LABELS: Record<ProbationOutcome, string> = {
  OJT_REPEAT: 'OJT ซ้ำ',
  RECONSIDER: 'พิจารณา',
};

const PROBATION_CRITERIA: { key: keyof ProbationCriteriaScores; label: string }[] = [
  { key: 'knowledge', label: '1. ความรู้ในงานของพนักงานใหม่ (Knowledge of work)' },
  { key: 'diligence', label: '2. ความขยัน / การอุทิศตนต่องาน (Diligence / Devotion)' },
  { key: 'responsibility', label: '3. ความรับผิดชอบและการติดตามงาน (Responsibility)' },
  { key: 'teamwork', label: '4. ความร่วมมือและการทำงานเป็นทีม (Teamwork)' },
  { key: 'attitude', label: '5. ทัศนคติและการตอบสนองต่อนโยบายบริษัท (Attitude)' },
  { key: 'regulationCompliance', label: '6. การปฏิบัติตามกฎระเบียบบริษัท / ความมีวินัย (Regulation)' },
  { key: 'problemSolving', label: '7. การวิเคราะห์และการแก้ปัญหา (Problem Solving)' },
  { key: 'learningAbility', label: '8. ความสามารถปรับตัวและการเรียนรู้งาน (Learning Ability)' },
  { key: 'ppeUse', label: '9. การใช้อุปกรณ์ความปลอดภัยในงาน (PPE Use)' },
  { key: 'activityParticipation', label: '10. การเข้าร่วมกิจกรรม 5ส./ISO 14001/IATF16949 (Activity)' },
];

export const ProbationEvaluator: React.FC<ProbationEvaluatorProps> = ({ employees, currentUser, onAddProbationEval, onEditEmployee }) => {
  // Same "ผู้บังคับบัญชาเป็นผู้ประเมิน" restriction as OjtFormAEvaluator:
  // only a supervisor evaluates their own team; ADMIN keeps full visibility.
  const canEvaluate = currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR';
  const scopedEmployees =
    currentUser.role === 'ADMIN' ? employees : employees.filter((e) => e.department === currentUser.department);

  const [probEmpId, setProbEmpId] = useState(scopedEmployees[2]?.id || scopedEmployees[0]?.id);
  const [period, setPeriod] = useState<ProbationPeriod>('30_DAYS');
  const [outcome, setOutcome] = useState<ProbationOutcome>('OJT_REPEAT');
  const [savedEval, setSavedEval] = useState<ProbationEvaluation | null>(null);
  const [scores, setScores] = useState<ProbationCriteriaScores>({
    knowledge: 4,
    diligence: 4,
    responsibility: 5,
    teamwork: 4,
    attitude: 5,
    regulationCompliance: 4,
    problemSolving: 4,
    learningAbility: 5,
    ppeUse: 5,
    activityParticipation: 4,
  });
  const [attendancePercentage, setAttendancePercentage] = useState(95);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // Re-scope the selected employee whenever the logged-in user (and thus
  // their department) changes, or if the current pick falls outside scope —
  // otherwise probTargetEmp silently goes undefined and Save becomes a
  // no-op with no error shown.
  useEffect(() => {
    setProbEmpId((prev) =>
      scopedEmployees.some((e) => e.id === prev) ? prev : scopedEmployees[0]?.id
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id, currentUser.department, currentUser.role]);

  const probTargetEmp = scopedEmployees.find((e) => e.id === probEmpId);

  // Criteria total: 10 items x 1-5 x weight 2 = max 100. Result = criteria(80%) + attendance(20%)
  const criteriaTotalScore = PROBATION_CRITERIA.reduce((sum, c) => sum + scores[c.key], 0) * 2;
  const criteriaPercentage = criteriaTotalScore;
  const resultScore = Math.round((criteriaPercentage * 0.8 + attendancePercentage * 0.2) * 10) / 10;

  const getProbationGrade = (pct: number) => {
    if (pct >= 86) return 'A+';
    if (pct >= 76) return 'A';
    if (pct >= 66) return 'B';
    if (pct >= 56) return 'C';
    return 'D';
  };

  const isPassed = resultScore >= 56;

  const handleSaveProbation = () => {
    if (!probTargetEmp) return;
    const grade = getProbationGrade(resultScore);
    const newEval: ProbationEvaluation = {
      id: `prob-${Date.now()}`,
      employeeId: probTargetEmp.id,
      employeeName: probTargetEmp.name,
      empCode: probTargetEmp.empCode,
      department: probTargetEmp.department,
      position: probTargetEmp.position,
      period,
      startingDate: probTargetEmp.startingDate,
      evalDate: new Date().toISOString().split('T')[0],
      scores,
      criteriaTotalScore,
      criteriaPercentage,
      attendancePercentage,
      resultScore,
      grade,
      isPassed,
      outcome: isPassed ? undefined : outcome,
      comments: 'พนักงานมีความสนใจเรียนรู้และปฏิบัติงานได้อย่างเรียบร้อย',
      assessorName: currentUser.name,
    };
    onAddProbationEval(newEval);
    setSavedEval(newEval);
    alert(`บันทึกผลประเมินทดลองงานเรียบร้อย! ผลคะแนนสุทธิ ${resultScore}% เกรด ${grade}`);
  };

  const handleExportProbation = async () => {
    if (!probTargetEmp) return;
    setExporting(true);
    setExportMessage(null);
    try {
      await exportFHR009({
        employeeName: probTargetEmp.name,
        empCode: probTargetEmp.empCode,
        position: probTargetEmp.position,
        department: probTargetEmp.department,
        section: probTargetEmp.section,
        startingDate: probTargetEmp.startingDate,
        evalDate: savedEval?.evalDate ?? new Date().toISOString().split('T')[0],
        period,
        scores,
        criteriaTotalScore,
        criteriaPercentage,
        attendancePercentage,
        resultScore,
        grade: getProbationGrade(resultScore),
      });
      setExportMessage('Export สำเร็จ');
    } catch (err) {
      setExportMessage(err instanceof Error ? `Export ไม่สำเร็จ: ${err.message}` : 'Export ไม่สำเร็จ');
    } finally {
      setExporting(false);
    }
  };

  const handleConfirmPermanent = () => {
    if (!probTargetEmp) return;
    onEditEmployee(probTargetEmp.id, {
      empCode: probTargetEmp.empCode,
      name: probTargetEmp.name,
      email: probTargetEmp.email,
      department: probTargetEmp.department,
      section: probTargetEmp.section,
      position: probTargetEmp.position,
      startingDate: probTargetEmp.startingDate,
      status: 'PERMANENT',
      role: probTargetEmp.role,
      avatar: probTargetEmp.avatar,
      supervisorId: probTargetEmp.supervisorId ? Number(probTargetEmp.supervisorId) : null,
    });
  };

  return (
    <div className="evaluations-page content-container">
      <div className="page-header">
        <div>
          <div className="eyebrow-tag">
            <Award size={14} /> F-HR-009 • ประเมินผลทดลองงาน
          </div>
          <h1 className="page-title gradient-text">F-HR-009 แบบประเมินผลทดลองงาน 30/90/119 วัน</h1>
          <p className="page-subtitle">ประเมินผลพนักงานทดลองงานพร้อมคำนวณเกรดอัตโนมัติ</p>
        </div>
      </div>

      {!canEvaluate ? (
        <div
          className="glass-card"
          style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
        >
          <Lock size={28} />
          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>เฉพาะหัวหน้างานเท่านั้นที่ประเมินทดลองงานได้</div>
          <div style={{ fontSize: '0.85rem' }}>
            บัญชีของคุณ ({currentUser.name}) มีสิทธิ์ระดับ "{currentUser.role}" — การประเมิน F-HR-009 สงวนไว้สำหรับหัวหน้างาน
            (Supervisor) เท่านั้น ตามเงื่อนไข "ผู้บังคับบัญชาเป็นผู้ประเมิน"
          </div>
        </div>
      ) : (
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2>F-HR-009 แบบประเมินผลทดลองงาน (Probation Evaluation)</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>บริษัท คอมพลีท โอโต รับเบอร์ แมนูแฟ็คเจอริ่ง จำกัด</span>
          </div>
          <span className="badge badge-amber">Rev.7 Effective: 01/07/2022</span>
        </div>

        <div className="grid-cols-2" style={{ gap: 20, marginBottom: 24 }}>
          <div className="form-group">
            <label className="form-label">เลือกพนักงานทดลองงาน</label>
            <select className="form-control" value={probEmpId} onChange={(e) => setProbEmpId(e.target.value)}>
              {scopedEmployees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.empCode} - {e.name} ({e.status})
                </option>
              ))}
            </select>
            {currentUser.role === 'ADMIN' ? (
              <div
                style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Globe2 size={12} /> สิทธิ์ Admin — มองเห็นพนักงานทุกแผนก ({scopedEmployees.length} คน)
              </div>
            ) : (
              <div
                style={{
                  fontSize: '0.78rem',
                  color: scopedEmployees.length === 0 ? 'var(--danger, #dc2626)' : 'var(--text-muted)',
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Lock size={12} /> แสดงเฉพาะพนักงานแผนก "{currentUser.department}" ({scopedEmployees.length} คน)
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">รอบการประเมิน</label>
            <select className="form-control" value={period} onChange={(e) => setPeriod(e.target.value as ProbationPeriod)}>
              <option value="30_DAYS">ครบกำหนด 30 วัน</option>
              <option value="90_DAYS">ครบกำหนด 90 วัน</option>
              <option value="119_DAYS">ครบกำหนด 119 วัน</option>
            </select>
          </div>
        </div>

        {/* 10 Evaluation Criteria (Score 1-5 with Weight x2) */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>หัวข้อการประเมิน 10 ด้าน (คะแนนเต็มด้านละ 10 คะแนน - ตัวคูณ Weight x2):</h3>

          {PROBATION_CRITERIA.map((item) => (
            <div
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 12,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 10,
                marginBottom: 10,
              }}
            >
              <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  className="form-control"
                  style={{ width: 100 }}
                  value={scores[item.key]}
                  onChange={(e) => setScores({ ...scores, [item.key]: parseInt(e.target.value) })}
                >
                  <option value={5}>5 (ดีมาก)</option>
                  <option value={4}>4 (ดี)</option>
                  <option value={3}>3 (ปานกลาง)</option>
                  <option value={2}>2 (พอใช้)</option>
                  <option value={1}>1 (ปรับปรุง)</option>
                </select>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', width: 80, textAlign: 'right' }}>
                  = {scores[item.key] * 2} คะแนน
                </span>
              </div>
            </div>
          ))}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 12,
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 10,
              marginTop: 4,
            }}
          >
            <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>คะแนนการเข้างาน (Attendance) — น้ำหนัก 20% ของผลรวม</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                min={0}
                max={100}
                className="form-control"
                style={{ width: 100 }}
                value={attendancePercentage}
                onChange={(e) => setAttendancePercentage(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', width: 80, textAlign: 'right' }}>%</span>
            </div>
          </div>
        </div>

        {/* Result Calculation Preview */}
        <div
          className="glass-card"
          style={{
            padding: 20,
            background: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>คะแนนเกณฑ์ 10 ด้าน (80%):</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa' }}>
              {criteriaTotalScore} / 100 ({criteriaPercentage}%)
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>คะแนนเข้างาน (20%):</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa' }}>{attendancePercentage}%</div>
          </div>

          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ผลคะแนนสุทธิ (Result Score):</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#60a5fa' }}>{resultScore}%</div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>เกรดผลการประเมิน (Grade):</div>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: resultScore >= 76 ? 'var(--success)' : 'var(--warning)',
              }}
            >
              Grade {getProbationGrade(resultScore)}
            </div>
          </div>
        </div>

        {/* Pass/fail branch — matches the flowchart's "ผ่านทดลองงาน?" decision */}
        <div
          className="glass-card"
          style={{
            padding: 16,
            marginTop: 16,
            background: isPassed ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            borderColor: isPassed ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
          }}
        >
          {isPassed ? (
            <div style={{ fontSize: '0.9rem', color: 'var(--success)', fontWeight: 600 }}>
              ✅ ผ่านทดลองงาน — เมื่อบันทึกแล้ว จะต้องกดยืนยันบรรจุเป็นพนักงานประจำแยกต่างหาก
            </div>
          ) : (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: 'var(--danger)' }}>
                ❌ ไม่ผ่านทดลองงาน — เลือกการดำเนินการต่อ
              </label>
              <select
                className="form-control"
                style={{ maxWidth: 300 }}
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as ProbationOutcome)}
              >
                <option value="OJT_REPEAT">{OUTCOME_LABELS.OJT_REPEAT}</option>
                <option value="RECONSIDER">{OUTCOME_LABELS.RECONSIDER}</option>
              </select>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 24 }}>
          {exportMessage && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{exportMessage}</span>}
          <button className="btn btn-secondary" onClick={handleExportProbation} disabled={!probTargetEmp || exporting}>
            <FileSpreadsheet size={16} /> {exporting ? 'กำลัง Export...' : 'Export F-HR-009'}
          </button>
          <button className="btn btn-success" onClick={handleSaveProbation}>
            <CheckCircle2 size={18} /> บันทึกผลการประเมินทดลองงาน F-HR-009
          </button>
        </div>

        {/* Post-save follow-up — only for the employee whose result was just saved */}
        {savedEval && savedEval.employeeId === probTargetEmp?.id && (
          <div
            className="glass-card"
            style={{
              padding: 16,
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            {savedEval.isPassed ? (
              probTargetEmp?.status === 'PERMANENT' ? (
                <div style={{ fontSize: '0.9rem', color: 'var(--success)', fontWeight: 600 }}>
                  <UserCheck size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  บรรจุเป็นพนักงานประจำเรียบร้อยแล้ว
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '0.9rem' }}>บันทึกผลแล้ว: ผ่านทดลองงาน — ยืนยันบรรจุเป็นพนักงานประจำหรือไม่?</div>
                  <button className="btn btn-success" onClick={handleConfirmPermanent}>
                    <UserCheck size={16} /> ยืนยันบรรจุเป็นพนักงานประจำ
                  </button>
                </>
              )
            ) : (
              <div style={{ fontSize: '0.9rem' }}>
                <RotateCcw size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                บันทึกผลแล้ว: ไม่ผ่านทดลองงาน — ดำเนินการ:{' '}
                <strong>{savedEval.outcome ? OUTCOME_LABELS[savedEval.outcome] : '-'}</strong>
              </div>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
};
