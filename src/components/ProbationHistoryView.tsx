import React, { useState } from 'react';
import { ClipboardList, Search, Filter, AlertTriangle } from 'lucide-react';
import type { ProbationEvaluation, ProbationCriteriaScores } from '../types';

interface ProbationHistoryViewProps {
  evaluations: ProbationEvaluation[];
  error: string | null;
}

const DEPARTMENT_OPTIONS = [
  { value: 'FMG-A', label: 'FMG-A (ผลิตยาง)' },
  { value: 'HR&GA IT', label: 'HR&GA IT' },
  { value: 'HR&GA', label: 'HR&GA Safety' },
  { value: 'QA/QC', label: 'QA/QC' },
  { value: 'PD', label: 'PD (แผนกผลิต)' },
];

const PERIOD_LABEL: Record<string, string> = {
  '30_DAYS': 'ครบกำหนด 30 วัน',
  '90_DAYS': 'ครบกำหนด 90 วัน',
  '119_DAYS': 'ครบกำหนด 119 วัน',
};

const OUTCOME_LABEL: Record<string, string> = {
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

const formatDate = (value?: string) => {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('th-TH');
};

export const ProbationHistoryView: React.FC<ProbationHistoryViewProps> = ({ evaluations, error }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [viewingEval, setViewingEval] = useState<ProbationEvaluation | null>(null);

  const filteredEvaluations = evaluations
    .filter((e) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q || e.employeeName.toLowerCase().includes(q) || e.empCode.toLowerCase().includes(q);
      const matchesPeriod = periodFilter === 'ALL' || e.period === periodFilter;
      const matchesDept = deptFilter === 'ALL' || e.department === deptFilter;
      return matchesSearch && matchesPeriod && matchesDept;
    })
    .sort((a, b) => (b.createdAt || b.evalDate || '').localeCompare(a.createdAt || a.evalDate || ''));

  return (
    <div className="employee-page content-container">
      <div className="page-header">
        <div>
          <div className="eyebrow-tag">
            <ClipboardList size={14} /> F-HR-009 • ประวัติการประเมินทดลองงาน
          </div>
          <h1 className="page-title gradient-text">ประวัติการประเมินทดลองงาน (F-HR-009)</h1>
          <p className="page-subtitle">
            รายการบันทึกผลทดลองงาน 30/90/119 วันทั้งหมดที่เคยบันทึกเข้าระบบ — ดูรายละเอียดคะแนนแต่ละด้านได้ที่นี่
          </p>
        </div>
      </div>

      {error && (
        <div
          className="glass-card"
          style={{ padding: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--danger, #dc2626)' }}
        >
          <AlertTriangle size={18} /> ไม่สามารถโหลดประวัติการประเมินทดลองงานจากระบบได้: {error}
        </div>
      )}

      <div className="glass-card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 220 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="ค้นหาชื่อ หรือรหัสพนักงาน..."
              className="form-control"
              style={{ paddingLeft: 36 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} className="text-muted" />
          <select className="form-control" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}>
            <option value="ALL">ทุกรอบ</option>
            <option value="30_DAYS">ครบกำหนด 30 วัน</option>
            <option value="90_DAYS">ครบกำหนด 90 วัน</option>
            <option value="119_DAYS">ครบกำหนด 119 วัน</option>
          </select>
          <select className="form-control" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="ALL">ทุกแผนก (All Departments)</option>
            {DEPARTMENT_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-card table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>วันที่ประเมิน</th>
              <th>พนักงาน</th>
              <th>แผนก / ตำแหน่ง</th>
              <th>รอบ</th>
              <th>เกรด</th>
              <th>ผลคะแนนสุทธิ</th>
              <th>ผู้ประเมิน</th>
              <th>ผลรวม</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvaluations.map((e) => (
              <tr key={e.id}>
                <td>{formatDate(e.evalDate)}</td>
                <td>{e.employeeName} <span style={{ color: 'var(--text-muted)' }}>({e.empCode})</span></td>
                <td>{e.department} / {e.position}</td>
                <td><span className="badge badge-blue">{PERIOD_LABEL[e.period] ?? e.period}</span></td>
                <td>{e.grade}</td>
                <td>{e.resultScore}%</td>
                <td>{e.assessorName}</td>
                <td>
                  {e.isPassed ? <span className="badge badge-green">ผ่าน</span> : <span className="badge badge-red">ไม่ผ่าน</span>}
                </td>
                <td>
                  <button className="btn btn-sm btn-secondary" onClick={() => setViewingEval(e)}>ดูรายละเอียด</button>
                </td>
              </tr>
            ))}
            {filteredEvaluations.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
                  ยังไม่มีประวัติการประเมินทดลองงาน
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {viewingEval && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 760 }}>
            <div className="modal-header">
              <h3>รายละเอียดการประเมินทดลองงาน — {viewingEval.employeeName}</h3>
            </div>
            <div className="modal-body">
              <div className="grid-cols-2" style={{ gap: '14px 24px', fontSize: '0.95rem', marginBottom: 20 }}>
                <div><strong>รหัสพนักงาน:</strong> {viewingEval.empCode}</div>
                <div><strong>แผนก / ตำแหน่ง:</strong> {viewingEval.department} / {viewingEval.position}</div>
                <div><strong>วันที่ประเมิน:</strong> {formatDate(viewingEval.evalDate)}</div>
                <div><strong>รอบการประเมิน:</strong> {PERIOD_LABEL[viewingEval.period] ?? viewingEval.period}</div>
                <div><strong>ผู้ประเมิน:</strong> {viewingEval.assessorName}</div>
                <div><strong>คะแนนเข้างาน:</strong> {viewingEval.attendancePercentage}%</div>
                <div><strong>เกรด:</strong> {viewingEval.grade}</div>
                <div>
                  <strong>ผลคะแนนสุทธิ:</strong> {viewingEval.resultScore}%{' '}
                  {viewingEval.isPassed ? <span className="badge badge-green">ผ่าน</span> : <span className="badge badge-red">ไม่ผ่าน</span>}
                </div>
                {!viewingEval.isPassed && viewingEval.outcome && (
                  <div><strong>ผลที่ตามมา:</strong> {OUTCOME_LABEL[viewingEval.outcome] ?? viewingEval.outcome}</div>
                )}
                {viewingEval.comments && (
                  <div style={{ gridColumn: '1 / -1' }}><strong>ความคิดเห็น:</strong> {viewingEval.comments}</div>
                )}
              </div>

              <div style={{ fontWeight: 700, marginBottom: 8 }}>คะแนนหัวข้อการประเมิน 10 ด้าน</div>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>หัวข้อ</th>
                      <th>คะแนน (1-5)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PROBATION_CRITERIA.map((c) => (
                      <tr key={c.key}>
                        <td>{c.label}</td>
                        <td>{viewingEval.scores[c.key]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={() => setViewingEval(null)}>
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
