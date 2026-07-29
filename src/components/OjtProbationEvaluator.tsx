import React, { useState } from 'react';
import { ClipboardCheck, CheckCircle2, FileText, Award } from 'lucide-react';
import type {
  Employee,
  OjtSession,
  OjtContentItem,
  OjtParticipant,
  ProbationEvaluation,
  ProbationCriteriaScores,
  ProbationPeriod,
  OjtPurposeType,
  OjtChangeReasonCategory,
} from '../types';

interface OjtProbationEvaluatorProps {
  employees: Employee[];
  ojtSessions: OjtSession[];
  ojtContentItems: OjtContentItem[];
  ojtParticipants: OjtParticipant[];
  probationEvaluations: ProbationEvaluation[];
  onAddOjtSession: (session: OjtSession, contentItems: OjtContentItem[], participants: OjtParticipant[]) => void;
  onAddProbationEval: (evalRec: ProbationEvaluation) => void;
}

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

export const OjtProbationEvaluator: React.FC<OjtProbationEvaluatorProps> = ({
  employees,
  onAddOjtSession,
  onAddProbationEval,
}) => {
  const [activeFormTab, setActiveFormTab] = useState<'ojt_a' | 'ojt_b' | 'probation'>('ojt_a');

  // Form A / B State (F-HR-004)
  const [selectedEmpId, setSelectedEmpId] = useState(employees[2]?.id || employees[0]?.id);
  const [courseContent, setCourseContent] = useState('การควบคุมเครื่องฉีดอัดยาง และการตบแต่ง Part ชิ้นงานยางรถยนต์');
  const [instructorLevel, setInstructorLevel] = useState<0 | 25 | 50 | 75 | 100>(75);
  const [purposeType, setPurposeType] = useState<OjtPurposeType>('NEW_HIRE');
  const [changeReasonCategory, setChangeReasonCategory] = useState<OjtChangeReasonCategory>('METHOD');

  // Probation Form State (F-HR-009)
  const [probEmpId, setProbEmpId] = useState(employees[2]?.id || employees[0]?.id);
  const [period, setPeriod] = useState<ProbationPeriod>('30_DAYS');
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

  const targetEmp = employees.find((e) => e.id === selectedEmpId);
  const probTargetEmp = employees.find((e) => e.id === probEmpId);

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

  const handleSaveOjt = () => {
    if (!targetEmp) return;
    const now = new Date().toISOString().split('T')[0];
    const sessionId = `ojt-session-${Date.now()}`;

    const newSession: OjtSession = {
      id: sessionId,
      formType: activeFormTab === 'ojt_a' ? 'A_NEW_HIRE' : 'B_CHANGE',
      department: targetEmp.department,
      position: targetEmp.position,
      courseName: activeFormTab === 'ojt_a' ? 'แบบบันทึกการฝึกอบรมเฉพาะงาน (Form A)' : 'แบบบันทึกการฝึกอบรมเฉพาะงาน (Form B)',
      instructor: 'นาย มานพ ตั้งมั่น',
      location: 'LINE FMG-A โรงงาน CAR',
      trainingDateFrom: now,
      trainingDateTo: now,
      timeRange: '08.00 - 17.00 น.',
      evaluationMethod: 'PRACTICAL',
      hasAttachment: false,
      purposeType: activeFormTab === 'ojt_a' ? purposeType : undefined,
      changeReasonCategory: activeFormTab === 'ojt_b' ? changeReasonCategory : undefined,
      assessorName: 'นาย มานพ ตั้งมั่น',
      managerName: 'นางสาว สมหญิง ใจดี',
    };

    const newContentItem: OjtContentItem = {
      id: `ojt-content-${Date.now()}`,
      sessionId,
      sequence: 1,
      description: courseContent,
      instructorSignedDate: now,
      resultPercent: instructorLevel,
    };

    const newParticipant: OjtParticipant = {
      id: `ojt-participant-${Date.now()}`,
      sessionId,
      employeeId: targetEmp.id,
      employeeName: targetEmp.name,
      empCode: targetEmp.empCode,
      preScore: 40,
      postScore: 75,
      instructorScorePercent: instructorLevel,
      isPassed: instructorLevel >= 75,
    };

    onAddOjtSession(newSession, [newContentItem], [newParticipant]);
    alert('บันทึกผลการประเมิน OJT เรียบร้อยแล้ว!');
  };

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
      isPassed: resultScore >= 56,
      comments: 'พนักงานมีความสนใจเรียนรู้และปฏิบัติงานได้อย่างเรียบร้อย',
      assessorName: 'นาย มานพ ตั้งมั่น',
    };
    onAddProbationEval(newEval);
    alert(`บันทึกผลประเมินทดลองงานเรียบร้อย! ผลคะแนนสุทธิ ${resultScore}% เกรด ${grade}`);
  };

  return (
    <div className="evaluations-page content-container">
      <div className="page-header">
        <div>
          <div className="eyebrow-tag">
            <ClipboardCheck size={14} /> OJT & PROBATION • แบบบันทึกการประเมินเฉพาะงานและทดลองงาน
          </div>
          <h1 className="page-title gradient-text">ระบบประเมิน OJT & ประเมินผลทดลองงาน</h1>
          <p className="page-subtitle">
            บันทึกแบบฟอร์ม F-HR-004 Form(A/B) และ F-HR-009 แบบประเมินทดลองงานพร้อมคำนวณเกรดอัตโนมัติ
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button
          className={`btn ${activeFormTab === 'ojt_a' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveFormTab('ojt_a')}
        >
          <ClipboardCheck size={18} /> Form A: OJT พนักงานใหม่ 1 เดือน (F-HR-004A)
        </button>
        <button
          className={`btn ${activeFormTab === 'ojt_b' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveFormTab('ojt_b')}
        >
          <FileText size={18} /> Form B: OJT เปลี่ยนงาน/4M1E (F-HR-004B)
        </button>
        <button
          className={`btn ${activeFormTab === 'probation' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveFormTab('probation')}
        >
          <Award size={18} /> แบบประเมินทดลองงาน 30/90/119 วัน (F-HR-009)
        </button>
      </div>

      {/* OJT Form A / B */}
      {(activeFormTab === 'ojt_a' || activeFormTab === 'ojt_b') && (
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2>{activeFormTab === 'ojt_a' ? 'F-HR-004 Form(A) แบบบันทึกการฝึกอบรมเฉพาะงาน' : 'F-HR-004 Form(B) แบบบันทึกการฝึกอบรมเฉพาะงาน (4M1E Change)'}</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>บริษัท คอมพลีท โอโต รับเบอร์ แมนูแฟ็คเจอริ่ง จำกัด</span>
            </div>
            <span className="badge badge-purple">Rev.11 Effective: 12/10/2023</span>
          </div>

          <div className="grid-cols-2" style={{ gap: 20, marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">เลือกพนักงานเข้ารับการประเมิน</label>
              <select className="form-control" value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)}>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.empCode} - {e.name} ({e.position} / {e.department})
                  </option>
                ))}
              </select>
            </div>

            {activeFormTab === 'ojt_a' ? (
              <div className="form-group">
                <label className="form-label">วัตถุประสงค์ที่อบรม</label>
                <select
                  className="form-control"
                  value={purposeType}
                  onChange={(e) => setPurposeType(e.target.value as OjtPurposeType)}
                >
                  <option value="NEW_HIRE">พนักงานเข้าใหม่</option>
                  <option value="TRANSFER">โยกย้าย/สับเปลี่ยนตำแหน่งงาน</option>
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">สาเหตุที่อบรม (4M1E Change)</label>
                <select
                  className="form-control"
                  value={changeReasonCategory}
                  onChange={(e) => setChangeReasonCategory(e.target.value as OjtChangeReasonCategory)}
                >
                  <option value="METHOD">เปลี่ยนแปลงวิธีทำงาน</option>
                  <option value="DOCUMENT">เปลี่ยนแปลงเอกสารการทำงาน</option>
                  <option value="MATERIAL">เปลี่ยนแปลงวัตถุดิบ</option>
                  <option value="MACHINE">เปลี่ยนแปลงเครื่องจักร/เครื่องมือ</option>
                  <option value="ANNUAL_REVIEW">ทบทวนประจำปี (Annual Review)</option>
                  <option value="OTHER">อื่นๆ</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">เนื้อหาหลักสูตรการฝึกอบรมเฉพาะงาน</label>
            <textarea
              className="form-control"
              rows={3}
              value={courseContent}
              onChange={(e) => setCourseContent(e.target.value)}
            ></textarea>
          </div>

          {/* Scoring Scale % Selection */}
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>
              ผลการประเมินโดยผู้สอนงาน (% Scale ตามเกณฑ์มาตรฐาน CAR):
            </label>

            <div className="grid-cols-5" style={{ gap: 10 }}>
              {[
                { lvl: 0, label: '0% ไม่สามารถปฏิบัติงานได้ (ไม่ผ่าน)', isPass: false },
                { lvl: 25, label: '25% ต้องเรียนรู้ใต้การควบคุม (ไม่ผ่าน)', isPass: false },
                { lvl: 50, label: '50% ทำงานได้แต่ต้องคอยตรวจ (ไม่ผ่าน)', isPass: false },
                { lvl: 75, label: '75% ทำงานได้เองโดยไม่ต้องตรวจ (ผ่าน)', isPass: true },
                { lvl: 100, label: '100% สอนงานผู้อื่นได้ (ผ่านเกณฑ์)', isPass: true },
              ].map((item) => (
                <div
                  key={item.lvl}
                  className={`glass-card glass-card-interactive ${instructorLevel === item.lvl ? 'active' : ''}`}
                  style={{
                    padding: 14,
                    textAlign: 'center',
                    border: instructorLevel === item.lvl ? `2px solid ${item.isPass ? 'var(--success)' : 'var(--danger)'}` : undefined,
                  }}
                  onClick={() => setInstructorLevel(item.lvl as 0 | 25 | 50 | 75 | 100)}
                >
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: item.isPass ? 'var(--success)' : 'var(--danger)' }}>
                    {item.lvl}%
                  </div>
                  <div style={{ fontSize: '0.72rem', marginTop: 4, color: 'var(--text-muted)' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <button className="btn btn-success" onClick={handleSaveOjt}>
              <CheckCircle2 size={18} /> บันทึกผลการประเมิน OJT (Form {activeFormTab === 'ojt_a' ? 'A' : 'B'})
            </button>
          </div>
        </div>
      )}

      {/* Probation Form F-HR-009 */}
      {activeFormTab === 'probation' && (
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
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.empCode} - {e.name} ({e.status})
                  </option>
                ))}
              </select>
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
                    onChange={(e) =>
                      setScores({ ...scores, [item.key]: parseInt(e.target.value) })
                    }
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
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa' }}>
                {attendancePercentage}%
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ผลคะแนนสุทธิ (Result Score):</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#60a5fa' }}>
                {resultScore}%
              </div>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <button className="btn btn-success" onClick={handleSaveProbation}>
              <CheckCircle2 size={18} /> บันทึกผลการประเมินทดลองงาน F-HR-009
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
