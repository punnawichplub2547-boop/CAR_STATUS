import React, { useState } from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';
import type { Employee, OjtSession, OjtContentItem, OjtParticipant, OjtChangeReasonCategory, SkillLevel } from '../types';

interface OjtFormBEvaluatorProps {
  employees: Employee[];
  currentUser: Employee;
  onAddOjtSession: (session: OjtSession, contentItems: OjtContentItem[], participants: OjtParticipant[]) => void;
}

export const OjtFormBEvaluator: React.FC<OjtFormBEvaluatorProps> = ({ employees, currentUser, onAddOjtSession }) => {
  const [selectedEmpId, setSelectedEmpId] = useState(employees[2]?.id || employees[0]?.id);
  const [changeReasonCategory, setChangeReasonCategory] = useState<OjtChangeReasonCategory>('METHOD');
  const [courseContent, setCourseContent] = useState('การควบคุมเครื่องฉีดอัดยาง และการตบแต่ง Part ชิ้นงานยางรถยนต์');
  const [instructorLevel, setInstructorLevel] = useState<0 | 25 | 50 | 75 | 100>(75);

  const targetEmp = employees.find((e) => e.id === selectedEmpId);

  const handleSaveOjt = () => {
    if (!targetEmp) return;
    const now = new Date().toISOString().split('T')[0];
    const sessionId = `ojt-session-${Date.now()}`;

    const newSession: OjtSession = {
      id: sessionId,
      formType: 'B_CHANGE',
      department: targetEmp.department,
      position: targetEmp.position,
      evaluationMethod: 'PRACTICAL',
      hasAttachment: false,
      changeReasonCategory,
      assessorName: currentUser.name,
      managerName: currentUser.supervisorName || currentUser.name,
    };

    const newContentItem: OjtContentItem = {
      id: `ojt-content-${Date.now()}`,
      sessionId,
      sequence: 1,
      description: courseContent,
      trainingDate: now,
      resultPercent: instructorLevel,
    };

    const overallScore = instructorLevel as SkillLevel;

    const newParticipant: OjtParticipant = {
      id: `ojt-participant-${Date.now()}`,
      sessionId,
      employeeId: targetEmp.id,
      employeeName: targetEmp.name,
      empCode: targetEmp.empCode,
      preScore: 40,
      postScore: 75,
      instructorScorePercent: overallScore,
      isPassed: overallScore >= 75,
    };

    onAddOjtSession(newSession, [newContentItem], [newParticipant]);
    alert('บันทึกผลการประเมิน OJT เรียบร้อยแล้ว!');
  };

  return (
    <div className="evaluations-page content-container">
      <div className="page-header">
        <div>
          <div className="eyebrow-tag">
            <FileText size={14} /> F-HR-004 FORM(B) • OJT เปลี่ยนงาน/4M1E
          </div>
          <h1 className="page-title gradient-text">F-HR-004 Form(B) แบบบันทึกการฝึกอบรมเฉพาะงาน (4M1E Change)</h1>
          <p className="page-subtitle">บันทึกผลการฝึกอบรมเฉพาะงานกรณีโยกย้าย/สับเปลี่ยนตำแหน่ง หรือมีการเปลี่ยนแปลง 4M1E</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2>F-HR-004 Form(B) แบบบันทึกการฝึกอบรมเฉพาะงาน (4M1E Change)</h2>
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

        {/* Sticky Bottom Action Bar */}
        <div
          className="glass-card"
          style={{
            position: 'sticky',
            bottom: 16,
            zIndex: 30,
            marginTop: 24,
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.18)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-color)',
            borderRadius: 14,
            background: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ผลประเมินที่เลือก</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: instructorLevel >= 75 ? 'var(--success)' : 'var(--danger)' }}>
                {instructorLevel}% ({instructorLevel >= 75 ? 'ผ่านเกณฑ์' : 'ยังไม่ผ่านเกณฑ์'})
              </div>
            </div>
            {targetEmp && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                พนักงาน: <strong style={{ color: 'var(--text-main)' }}>{targetEmp.name}</strong> ({targetEmp.empCode})
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn-success" onClick={handleSaveOjt}>
              <CheckCircle2 size={16} /> บันทึกผลการประเมิน OJT (Form B)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
