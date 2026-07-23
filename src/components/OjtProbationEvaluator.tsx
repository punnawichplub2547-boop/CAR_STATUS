import React, { useState } from 'react';
import { ClipboardCheck, CheckCircle2, FileText, Award } from 'lucide-react';
import type { Employee, OjtRecord, ProbationEvaluation } from '../types';

interface OjtProbationEvaluatorProps {
  employees: Employee[];
  ojtRecords: OjtRecord[];
  probationEvaluations: ProbationEvaluation[];
  onAddOjtRecord: (record: OjtRecord) => void;
  onAddProbationEval: (evalRec: ProbationEvaluation) => void;
}

export const OjtProbationEvaluator: React.FC<OjtProbationEvaluatorProps> = ({
  employees,
  onAddOjtRecord,
  onAddProbationEval,
}) => {
  const [activeFormTab, setActiveFormTab] = useState<'ojt_a' | 'ojt_b' | 'probation'>('ojt_a');

  // Form A State (1 Month OJT New Hire)
  const [selectedEmpId, setSelectedEmpId] = useState(employees[2]?.id || employees[0]?.id);
  const [courseContent, setCourseContent] = useState('การควบคุมเครื่องฉีดอัดยาง และการตบแต่ง Part ชิ้นงานยางรถยนต์');
  const [instructorLevel, setInstructorLevel] = useState<0 | 25 | 50 | 75 | 100>(75);

  // Probation Form State
  const [probEmpId, setProbEmpId] = useState(employees[2]?.id || employees[0]?.id);
  const [period, setPeriod] = useState<'30_DAYS' | '60_DAYS' | '90_DAYS'>('30_DAYS');
  const [scores, setScores] = useState({
    knowledge: 4,
    diligence: 4,
    responsibility: 5,
    teamwork: 4,
    attitude: 5,
  });

  const targetEmp = employees.find((e) => e.id === selectedEmpId);
  const probTargetEmp = employees.find((e) => e.id === probEmpId);

  // Calculate probation total score (Max 50) and Grade
  const rawTotal = (scores.knowledge + scores.diligence + scores.responsibility + scores.teamwork + scores.attitude) * 2;
  const percentage = (rawTotal / 50) * 100;

  const getProbationGrade = (pct: number) => {
    if (pct >= 86) return 'A+';
    if (pct >= 76) return 'A';
    if (pct >= 66) return 'B';
    if (pct >= 56) return 'C';
    return 'D';
  };

  const handleSaveOjt = () => {
    if (!targetEmp) return;
    const newRecord: OjtRecord = {
      id: `ojt-${Date.now()}`,
      employeeId: targetEmp.id,
      employeeName: targetEmp.name,
      empCode: targetEmp.empCode,
      department: targetEmp.department,
      position: targetEmp.position,
      formType: activeFormTab === 'ojt_a' ? 'A_NEW_HIRE' : 'B_CHANGE',
      courseName: activeFormTab === 'ojt_a' ? 'แบบบันทึกการฝึกอบรมเฉพาะงาน (Form A)' : 'แบบบันทึกการฝึกอบรมเฉพาะงาน (Form B)',
      courseContent,
      instructor: 'นาย วิชัย สมบูรณ์ดี',
      location: 'LINE FMG-A โรงงาน CAR',
      evalDate: new Date().toISOString().split('T')[0],
      preScore: 40,
      postScore: 75,
      instructorScorePercent: instructorLevel,
      isPassed: instructorLevel >= 75,
      assessorName: 'นาย วิชัย สมบูรณ์ดี',
      managerName: 'นางสาว อำภา หิงคำ',
    };
    onAddOjtRecord(newRecord);
    alert('บันทึกผลการประเมิน OJT เรียบร้อยแล้ว!');
  };

  const handleSaveProbation = () => {
    if (!probTargetEmp) return;
    const grade = getProbationGrade(percentage);
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
      totalScore: rawTotal,
      percentage,
      grade,
      isPassed: percentage >= 56,
      comments: 'พนักงานมีความสนใจเรียนรู้และปฏิบัติงานได้อย่างเรียบร้อย',
      assessorName: 'นาย วิชัย สมบูรณ์ดี',
    };
    onAddProbationEval(newEval);
    alert(`บันทึกผลประเมินทดลองงานเรียบร้อย! ได้คะแนน ${rawTotal}/50 (${percentage}%) เกรด ${grade}`);
  };

  return (
    <div className="evaluations-page">
      <div className="page-header">
        <div>
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
          <Award size={18} /> แบบประเมินทดลองงาน 30/60/90 วัน (F-HR-009)
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

            {activeFormTab === 'ojt_b' && (
              <div className="form-group">
                <label className="form-label">สาเหตุที่อบรม (4M1E Change)</label>
                <select className="form-control">
                  <option>เปลี่ยนแปลงวิธีทำงาน</option>
                  <option>เปลี่ยนแปลงเอกสารการทำงาน</option>
                  <option>เปลี่ยนแปลงวัตถุดิบ</option>
                  <option>เปลี่ยนแปลงเครื่องจักร/เครื่องมือ</option>
                  <option>ทบทวนประจำปี (Annual Review)</option>
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
                  onClick={() => setInstructorLevel(item.lvl as any)}
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
              <select className="form-control" value={period} onChange={(e) => setPeriod(e.target.value as any)}>
                <option value="30_DAYS">ครบกำหนด 30 วัน</option>
                <option value="60_DAYS">ครบกำหนด 60 วัน</option>
                <option value="90_DAYS">ครบกำหนด 90 วัน / 119 วัน</option>
              </select>
            </div>
          </div>

          {/* 5 Evaluation Criteria (Score 1-5 with Weight x2) */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>หัวข้อการประเมิน 5 ด้าน (คะแนนเต็มด้านละ 10 คะแนน - ตัวคูณ Weight x2):</h3>

            {[
              { key: 'knowledge', label: '1. ความรู้ในงานของพนักงานใหม่ (Knowledge of work)' },
              { key: 'diligence', label: '2. ความขยัน / การอุทิศตนต่องาน (Diligence / Devotion)' },
              { key: 'responsibility', label: '3. ความรับผิดชอบและการติดตามงาน (Responsibility)' },
              { key: 'teamwork', label: '4. ความร่วมมือและการทำงานเป็นทีม (Teamwork)' },
              { key: 'attitude', label: '5. ทัศนคติและการตอบสนองต่อนโยบาย (Attitude)' },
            ].map((item) => (
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
                    value={(scores as any)[item.key]}
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
                    = {(scores as any)[item.key] * 2} คะแนน
                  </span>
                </div>
              </div>
            ))}
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
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>คะแนนรวมประเมินผลทดลองงานสุทธิ:</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#60a5fa' }}>
                {rawTotal} / 50 คะแนน ({percentage}%)
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>เกรดผลการประเมิน (Grade):</div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 900,
                  color: percentage >= 76 ? 'var(--success)' : 'var(--warning)',
                }}
              >
                Grade {getProbationGrade(percentage)}
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
