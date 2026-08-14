import React, { useState } from 'react';
import { History, Search, Filter, AlertTriangle } from 'lucide-react';
import type { OjtSession, OjtContentItem, OjtParticipant } from '../types';

interface OjtHistoryViewProps {
  sessions: OjtSession[];
  contentItems: OjtContentItem[];
  participants: OjtParticipant[];
  error: string | null;
}

const DEPARTMENT_OPTIONS = [
  { value: 'FMG-A', label: 'FMG-A (ผลิตยาง)' },
  { value: 'HR&GA IT', label: 'HR&GA IT' },
  { value: 'HR&GA', label: 'HR&GA Safety' },
  { value: 'QA/QC', label: 'QA/QC' },
  { value: 'PD', label: 'PD (แผนกผลิต)' },
];

const FORM_TYPE_LABEL: Record<OjtSession['formType'], string> = {
  A_NEW_HIRE: 'Form A: พนักงานเข้าใหม่',
  B_CHANGE: 'Form B: เปลี่ยนงาน/4M1E',
};

const PURPOSE_LABEL: Record<string, string> = {
  NEW_HIRE: 'พนักงานเข้าใหม่',
  TRANSFER: 'โยกย้าย/สับเปลี่ยนตำแหน่งงาน',
};

const EVAL_METHOD_LABEL: Record<string, string> = {
  PRE_POST_TEST: 'แบบทดสอบ ก่อน-หลังอบรม',
  PRACTICAL: 'ทดสอบการปฏิบัติจริง',
  Q_AND_A: 'แจ้งให้ทราบและใช้การซักถาม',
};

const RESULT_LABEL: Record<number, string> = { 0: '0', 25: '1', 50: '2', 75: '3', 100: '4' };

const formatDate = (value?: string) => {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('th-TH');
};

export const OjtHistoryView: React.FC<OjtHistoryViewProps> = ({ sessions, contentItems, participants, error }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formTypeFilter, setFormTypeFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [viewingSession, setViewingSession] = useState<OjtSession | null>(null);

  const participantsOf = (sessionId: string) => participants.filter((p) => p.sessionId === sessionId);
  const contentOf = (sessionId: string) =>
    contentItems.filter((c) => c.sessionId === sessionId).sort((a, b) => a.sequence - b.sequence);

  const filteredSessions = sessions
    .filter((s) => {
      const rows = participantsOf(s.id);
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        rows.some((p) => p.employeeName.toLowerCase().includes(q) || p.empCode.toLowerCase().includes(q)) ||
        s.position.toLowerCase().includes(q);
      const matchesFormType = formTypeFilter === 'ALL' || s.formType === formTypeFilter;
      const matchesDept = deptFilter === 'ALL' || s.department === deptFilter;
      return matchesSearch && matchesFormType && matchesDept;
    })
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  return (
    <div className="employee-page content-container">
      <div className="page-header">
        <div>
          <div className="eyebrow-tag">
            <History size={14} /> F-HR-004 • ประวัติการฝึกอบรมเฉพาะงาน (OJT)
          </div>
          <h1 className="page-title gradient-text">ประวัติการอบรม OJT (F-HR-004)</h1>
          <p className="page-subtitle">
            รายการบันทึกผล OJT (Form A/B) ทั้งหมดที่เคยบันทึกเข้าระบบ — ดูรายละเอียดหัวข้อและคะแนนของแต่ละครั้งได้ที่นี่
          </p>
        </div>
      </div>

      {error && (
        <div
          className="glass-card"
          style={{ padding: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--danger, #dc2626)' }}
        >
          <AlertTriangle size={18} /> ไม่สามารถโหลดประวัติการอบรม OJT จากระบบได้: {error}
        </div>
      )}

      <div className="glass-card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 220 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, รหัสพนักงาน หรือตำแหน่ง..."
              className="form-control"
              style={{ paddingLeft: 36 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} className="text-muted" />
          <select className="form-control" value={formTypeFilter} onChange={(e) => setFormTypeFilter(e.target.value)}>
            <option value="ALL">ทุกฟอร์ม (A/B)</option>
            <option value="A_NEW_HIRE">Form A: พนักงานเข้าใหม่</option>
            <option value="B_CHANGE">Form B: เปลี่ยนงาน/4M1E</option>
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
              <th>วันที่บันทึก</th>
              <th>ฟอร์ม</th>
              <th>แผนก / ตำแหน่ง</th>
              <th>ผู้เข้ารับการประเมิน</th>
              <th>ผู้สอน</th>
              <th>ผลรวม</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map((s) => {
              const rows = participantsOf(s.id);
              const allPassed = rows.length > 0 && rows.every((p) => p.isPassed);
              return (
                <tr key={s.id}>
                  <td>{formatDate(s.createdAt)}</td>
                  <td><span className="badge badge-blue">{FORM_TYPE_LABEL[s.formType]}</span></td>
                  <td>{s.department} / {s.position}</td>
                  <td>{rows.map((p) => p.employeeName).join(', ') || '-'}</td>
                  <td>{s.assessorName}</td>
                  <td>
                    {rows.length === 0 ? (
                      '-'
                    ) : allPassed ? (
                      <span className="badge badge-green">ผ่าน</span>
                    ) : (
                      <span className="badge badge-red">ไม่ผ่าน</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => setViewingSession(s)}>ดูรายละเอียด</button>
                  </td>
                </tr>
              );
            })}
            {filteredSessions.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
                  ยังไม่มีประวัติการอบรม OJT
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {viewingSession && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 860 }}>
            <div className="modal-header">
              <h3>รายละเอียดการอบรม OJT — {FORM_TYPE_LABEL[viewingSession.formType]}</h3>
            </div>
            <div className="modal-body">
              <div className="grid-cols-2" style={{ gap: '14px 24px', fontSize: '0.95rem', marginBottom: 20 }}>
                <div><strong>วันที่บันทึก:</strong> {formatDate(viewingSession.createdAt)}</div>
                <div><strong>แผนก / ตำแหน่ง:</strong> {viewingSession.department} / {viewingSession.position}</div>
                <div>
                  <strong>วัตถุประสงค์:</strong>{' '}
                  {viewingSession.purposeType ? PURPOSE_LABEL[viewingSession.purposeType] ?? viewingSession.purposeType : '-'}
                </div>
                <div><strong>ประเมินผลโดยการ:</strong> {EVAL_METHOD_LABEL[viewingSession.evaluationMethod] ?? viewingSession.evaluationMethod}</div>
                <div><strong>ผู้สอน:</strong> {viewingSession.assessorName}</div>
                <div><strong>ผู้จัดการ:</strong> {viewingSession.managerName}</div>
              </div>

              <div style={{ fontWeight: 700, marginBottom: 8 }}>ผู้เข้ารับการประเมิน</div>
              <div className="table-responsive" style={{ marginBottom: 20 }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>รหัสพนักงาน</th>
                      <th>ชื่อ-สกุล</th>
                      <th>คะแนนผู้สอน</th>
                      <th>ผลการประเมิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participantsOf(viewingSession.id).map((p) => (
                      <tr key={p.id}>
                        <td>{p.empCode}</td>
                        <td>{p.employeeName}</td>
                        <td>{RESULT_LABEL[p.instructorScorePercent] ?? p.instructorScorePercent}</td>
                        <td>
                          {p.isPassed ? <span className="badge badge-green">ผ่าน</span> : <span className="badge badge-red">ไม่ผ่าน</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ fontWeight: 700, marginBottom: 8 }}>เนื้อหาหลักสูตร</div>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>เนื้อหาหลักสูตร</th>
                      <th>วันที่อบรม</th>
                      <th>เวลา</th>
                      <th>ผลการประเมิน</th>
                      <th>หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contentOf(viewingSession.id).map((c) => (
                      <tr key={c.id}>
                        <td>{c.sequence}</td>
                        <td>{c.description}</td>
                        <td>{formatDate(c.trainingDate)}</td>
                        <td>{c.timeFrom || '-'} - {c.timeTo || '-'}</td>
                        <td>{c.resultPercent != null ? (RESULT_LABEL[c.resultPercent] ?? c.resultPercent) : '-'}</td>
                        <td>{c.remark || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={() => setViewingSession(null)}>
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
