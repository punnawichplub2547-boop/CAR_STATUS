import React, { useEffect, useState } from 'react';
import { ClipboardCheck, CheckCircle2, Plus, Trash2, FileSpreadsheet, Lock, Globe2, Hourglass } from 'lucide-react';
import type {
  Employee,
  OjtSession,
  OjtContentItem,
  OjtParticipant,
  OjtPurposeType,
  OjtEvaluationMethod,
  SkillLevel,
  SkillStandard,
} from '../types';
import { exportFHR004A, FHR004A_ROW_CAPACITY } from '../utils/fhr004Exporter';

interface OjtFormAEvaluatorProps {
  employees: Employee[];
  standards: SkillStandard[];
  currentUser: Employee;
  onAddOjtSession: (session: OjtSession, contentItems: OjtContentItem[], participants: OjtParticipant[]) => void;
}

interface ContentRowDraft {
  key: string;
  description: string;
  trainingDate: string;
  timeFrom: string;
  timeTo: string;
  resultPercent: SkillLevel;
  remark: string;
  targetLevel?: SkillLevel;
}

const createEmptyContentRow = (): ContentRowDraft => ({
  key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  description: '',
  trainingDate: new Date().toISOString().split('T')[0],
  timeFrom: '',
  timeTo: '',
  resultPercent: 75,
  remark: '',
  targetLevel: undefined,
});

const SKILL_LEVEL_SCALE: Record<SkillLevel, string> = { 0: '0', 25: '1', 50: '2', 75: '3', 100: '4' };
const levelToScaleLabel = (level?: SkillLevel) => (level === undefined ? '-' : SKILL_LEVEL_SCALE[level]);

// Flowchart condition (F-HR-004 Form A): only a new hire who has completed
// 1 month of employment is eligible for the OJT evaluation.
const MIN_TENURE_DAYS_FOR_OJT = 30;
const getTenureDays = (startingDate: string) => {
  const start = new Date(startingDate);
  if (Number.isNaN(start.getTime())) return 0;
  const diffMs = Date.now() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

export const OjtFormAEvaluator: React.FC<OjtFormAEvaluatorProps> = ({ employees, standards, currentUser, onAddOjtSession }) => {
  // Department heads/supervisors only evaluate their own team — scope the
  // picker to their department. Admins keep full company-wide visibility.
  const scopedEmployees =
    currentUser.role === 'ADMIN' ? employees : employees.filter((e) => e.department === currentUser.department);

  const [selectedEmpId, setSelectedEmpId] = useState(scopedEmployees[0]?.id);
  const [purposeType, setPurposeType] = useState<OjtPurposeType>('NEW_HIRE');
  const [evaluationMethod, setEvaluationMethod] = useState<OjtEvaluationMethod>('PRACTICAL');
  const [hasAttachment, setHasAttachment] = useState(false);
  const [contentRows, setContentRows] = useState<ContentRowDraft[]>([createEmptyContentRow()]);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // Re-scope the selected employee whenever the logged-in user (and thus
  // their department) changes, or if the current pick falls outside scope.
  useEffect(() => {
    setSelectedEmpId((prev) =>
      scopedEmployees.some((e) => e.id === prev) ? prev : scopedEmployees[0]?.id
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id, currentUser.department, currentUser.role]);

  const targetEmp = scopedEmployees.find((e) => e.id === selectedEmpId);

  // Auto-pull the F-HR-005 skill standard topics for whichever employee is
  // selected (matched by department + exact position, same logic as
  // SkillMatrixView) so the instructor doesn't have to type every topic by
  // hand. Falls back to one blank row if this employee/position has no
  // standards on file yet. Also reused right after a successful save (see
  // handleSaveOjt) so the form repopulates the standard topics instead of
  // collapsing to a single blank row, which read as "the content vanished".
  const buildContentRowsForEmployee = (emp: typeof targetEmp): ContentRowDraft[] => {
    if (!emp) return [createEmptyContentRow()];
    const matched = standards.filter((s) => s.department === emp.department && s.position === emp.position);
    // Cap at the real form's fixed 25-row band (rows 13-37) so the on-screen
    // table, the "เพิ่มแถว (n/25)" counter, and what gets saved/exported all
    // agree — otherwise a role with >25 F-HR-005 standards (e.g. หัวหน้าแผนก)
    // would show more rows than the physical form has, and Save would
    // persist all of them uncapped even though Export silently truncates.
    const capped = matched.slice(0, FHR004A_ROW_CAPACITY);
    return capped.length > 0
      ? capped.map((s) => ({ ...createEmptyContentRow(), description: s.skillName, targetLevel: s.targetLevel }))
      : [createEmptyContentRow()];
  };

  useEffect(() => {
    setContentRows(buildContentRowsForEmployee(targetEmp));
    setExportMessage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetEmp?.id]);

  const tenureDays = targetEmp ? getTenureDays(targetEmp.startingDate) : 0;
  const isTenureEligible = tenureDays >= MIN_TENURE_DAYS_FOR_OJT;
  const daysUntilEligible = Math.max(0, MIN_TENURE_DAYS_FOR_OJT - tenureDays);

  const hasMatchedStandards =
    !!targetEmp &&
    standards.some((s) => s.department === targetEmp.department && s.position === targetEmp.position);

  const matchedStandardsOverflow = targetEmp
    ? Math.max(
        0,
        standards.filter((s) => s.department === targetEmp.department && s.position === targetEmp.position).length -
          FHR004A_ROW_CAPACITY
      )
    : 0;

  const addContentRow = (description = '') => {
    setContentRows((rows) => {
      if (rows.length >= FHR004A_ROW_CAPACITY) return rows;
      return [...rows, { ...createEmptyContentRow(), description }];
    });
  };

  const removeContentRow = (key: string) => {
    setContentRows((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.key !== key)));
  };

  const updateContentRow = (key: string, patch: Partial<ContentRowDraft>) => {
    setContentRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const handleSaveOjt = () => {
    if (!targetEmp || !isTenureEligible) return;
    const sessionId = `ojt-session-${Date.now()}`;

    const newSession: OjtSession = {
      id: sessionId,
      formType: 'A_NEW_HIRE',
      department: targetEmp.department,
      position: targetEmp.position,
      evaluationMethod,
      hasAttachment,
      purposeType,
      assessorName: currentUser.name,
      managerName: currentUser.supervisorName || currentUser.name,
    };

    const newContentItems: OjtContentItem[] = contentRows
      .filter((row) => row.description.trim())
      .map((row, idx) => ({
        id: `ojt-content-${Date.now()}-${idx}`,
        sessionId,
        sequence: idx + 1,
        description: row.description,
        trainingDate: row.trainingDate || undefined,
        timeFrom: row.timeFrom || undefined,
        timeTo: row.timeTo || undefined,
        resultPercent: row.resultPercent,
        remark: row.remark || undefined,
      }));

    // A trainee is only as strong as their weakest trained topic — overall
    // result = the lowest per-line score.
    const overallScore = newContentItems.reduce<number>((min, c) => Math.min(min, c.resultPercent ?? 0), 100) as SkillLevel;

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

    onAddOjtSession(newSession, newContentItems, [newParticipant]);
    alert('บันทึกผลการประเมิน OJT เรียบร้อยแล้ว!');
    setContentRows(buildContentRowsForEmployee(targetEmp));
  };

  const canExportOjtA = !!targetEmp && contentRows.some((r) => r.description.trim()) && !exporting;

  const handleExportOjtA = async () => {
    if (!targetEmp) return;
    setExporting(true);
    setExportMessage(null);
    try {
      const result = await exportFHR004A({
        employeeName: targetEmp.name,
        empCode: targetEmp.empCode,
        position: targetEmp.position,
        department: targetEmp.department,
        startingDate: targetEmp.startingDate,
        purposeType,
        evaluationMethod,
        hasAttachment,
        contentItems: contentRows
          .filter((r) => r.description.trim())
          .map((r) => ({
            description: r.description,
            trainingDate: r.trainingDate || undefined,
            timeFrom: r.timeFrom || undefined,
            timeTo: r.timeTo || undefined,
            resultPercent: r.resultPercent,
            remark: r.remark || undefined,
          })),
      });
      const truncatedNote =
        result.truncatedCount > 0
          ? ` (เกินความจุแบบฟอร์ม ${FHR004A_ROW_CAPACITY} แถว — ตัดออก ${result.truncatedCount} รายการ)`
          : '';
      setExportMessage(`Export สำเร็จ ${result.exportedCount} รายการ${truncatedNote}`);
    } catch (err) {
      setExportMessage(err instanceof Error ? `Export ไม่สำเร็จ: ${err.message}` : 'Export ไม่สำเร็จ');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="evaluations-page content-container">
      <div className="page-header">
        <div>
          <div className="eyebrow-tag">
            <ClipboardCheck size={14} /> F-HR-004 FORM(A) • OJT พนักงานเข้าใหม่
          </div>
          <h1 className="page-title gradient-text">F-HR-004 Form(A) แบบบันทึกการฝึกอบรมเฉพาะงาน</h1>
          <p className="page-subtitle">
            บันทึกผลการฝึกอบรมเฉพาะงานสำหรับพนักงานเข้าใหม่ครบ 1 เดือน พร้อม Export ไฟล์ Excel ตามฟอร์มจริง
          </p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2>F-HR-004 Form(A) แบบบันทึกการฝึกอบรมเฉพาะงาน</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>บริษัท คอมพลีท โอโต รับเบอร์ แมนูแฟ็คเจอริ่ง จำกัด</span>
          </div>
          <span className="badge badge-purple">Rev.11 Effective: 12/10/2023</span>
        </div>

        {/* Header fields — matches the real form's 5-field header (rows 5-6): ชื่อ-สกุล/รหัสพนักงาน/ตำแหน่ง then แผนก-หน่วยงาน/วันเริ่มงาน */}
        <div className="grid-cols-3" style={{ gap: 20, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">ชื่อ-สกุล (เลือกพนักงานเข้ารับการประเมิน)</label>
            <select className="form-control" value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)}>
              {scopedEmployees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
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
            <label className="form-label">รหัสพนักงาน</label>
            <input className="form-control" readOnly value={targetEmp?.empCode || '-'} />
          </div>

          <div className="form-group">
            <label className="form-label">ตำแหน่ง</label>
            <input className="form-control" readOnly value={targetEmp?.position || '-'} />
          </div>
        </div>

        <div className="grid-cols-2" style={{ gap: 20, marginBottom: 20 }}>
          <div className="form-group">
            <label className="form-label">แผนก / หน่วยงาน</label>
            <input className="form-control" readOnly value={targetEmp?.department || '-'} />
          </div>

          <div className="form-group">
            <label className="form-label">วันเริ่มงาน</label>
            <input
              className="form-control"
              readOnly
              value={targetEmp ? new Date(targetEmp.startingDate).toLocaleDateString('th-TH') : '-'}
            />
          </div>
        </div>

        <div className="grid-cols-3" style={{ gap: 20, marginBottom: 20 }}>
          <div className="form-group">
            <label className="form-label">1. วัตถุประสงค์ที่อบรม</label>
            <select
              className="form-control"
              value={purposeType}
              onChange={(e) => setPurposeType(e.target.value as OjtPurposeType)}
            >
              <option value="NEW_HIRE">พนักงานเข้าใหม่</option>
              <option value="TRANSFER">โยกย้าย/สับเปลี่ยนตำแหน่งงาน</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">2. ประเมินผลโดยการ</label>
            <select
              className="form-control"
              value={evaluationMethod}
              onChange={(e) => setEvaluationMethod(e.target.value as OjtEvaluationMethod)}
            >
              <option value="PRE_POST_TEST">แบบทดสอบ ก่อน-หลังอบรม</option>
              <option value="PRACTICAL">ทดสอบการปฏิบัติจริง</option>
              <option value="Q_AND_A">แจ้งให้ทราบและใช้การซักถาม</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">3. บันทึกผลการประเมิน</label>
            <select
              className="form-control"
              value={hasAttachment ? 'true' : 'false'}
              onChange={(e) => setHasAttachment(e.target.value === 'true')}
            >
              <option value="true">มีเอกสารแนบ</option>
              <option value="false">ไม่มีเอกสารแนบ</option>
            </select>
          </div>
        </div>

        {targetEmp && !isTenureEligible && (
          <div
            className="glass-card"
            style={{
              padding: 14,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(217, 119, 6, 0.08)',
              borderColor: 'rgba(217, 119, 6, 0.3)',
              color: 'var(--warning, #d97706)',
              fontSize: '0.85rem',
            }}
          >
            <Hourglass size={18} />
            <span>
              พนักงานคนนี้อายุงานยังไม่ครบ 1 เดือน (ทำงานมาแล้ว {tenureDays} วัน) — ตามเงื่อนไข F-HR-004 ต้องรออีก{' '}
              {daysUntilEligible} วันจึงจะประเมิน OJT ได้
            </span>
          </div>
        )}

        {!hasMatchedStandards && (
          <div style={{ marginBottom: 12, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            ยังไม่มีมาตรฐานทักษะ (F-HR-005) สำหรับตำแหน่ง "{targetEmp?.position}" ในแผนก "{targetEmp?.department}" —
            กรอกเนื้อหาหลักสูตรเองด้านล่างได้
          </div>
        )}

        {matchedStandardsOverflow > 0 && (
          <div style={{ marginBottom: 12, fontSize: '0.85rem', color: 'var(--warning, #d97706)' }}>
            ตำแหน่ง "{targetEmp?.position}" มีมาตรฐานทักษะ (F-HR-005) เกินความจุ 25 แถวของฟอร์มจริง — แสดง 25 หัวข้อแรกเท่านั้น
            (ตัดออก {matchedStandardsOverflow} หัวข้อ) กรุณาแยกประเมินในรอบถัดไปหากต้องครอบคลุมหัวข้อที่เหลือ
          </div>
        )}

        <div
          className="glass-card"
          style={{ padding: 14, marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 24, fontSize: '0.78rem', color: 'var(--text-muted)' }}
        >
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-main)' }}>
              เกณฑ์ระดับความสามารถ (ผลการประเมิน)
            </div>
            <div>0 = ไม่ต้องอบรม / ไม่มีทักษะในเรื่องนั้น</div>
            <div>1 = ควรมีทักษะในเรื่องนั้นอย่างน้อย 25%</div>
            <div>2 = ควรมีทักษะในเรื่องนั้นอย่างน้อย 50%</div>
            <div>3 = ควรมีทักษะในเรื่องนั้นอย่างน้อย 75%</div>
            <div>4 = ควรมีทักษะในเรื่องนั้น 100% เพื่อสอนงาน / อธิบายงาน</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-main)' }}>หมวดหมู่ทักษะ</div>
            <div><span style={{ color: '#1a1a1a' }}>●</span> Functional Competency = สมรรถนะด้านความรู้และความสามารถเฉพาะสายงาน</div>
            <div><span style={{ color: '#2563eb' }}>●</span> Skill = สมรรถนะด้านทักษะในการปฏิบัติงาน</div>
            <div><span style={{ color: '#dc2626' }}>●</span> Managerial Competency = สมรรถนะด้านการบริหารจัดการและภาวะผู้นำ</div>
            <div><span style={{ color: '#9333ea' }}>●</span> Department Requirement = สมรรถนะเพิ่มเติมตามความต้องการของแต่ละหน่วยงาน</div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th>เนื้อหาหลักสูตร</th>
                <th style={{ width: 140 }}>วันที่อบรม</th>
                <th style={{ width: 90 }}>เวลาตั้งแต่</th>
                <th style={{ width: 90 }}>เวลาถึง</th>
                <th style={{ width: 90 }} title="ระดับที่ต้องได้ตามมาตรฐาน F-HR-005">เกณฑ์ขั้นต่ำ</th>
                <th style={{ width: 110 }}>ผลการประเมิน</th>
                <th>หมายเหตุ</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {contentRows.map((row, idx) => (
                <tr key={row.key}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td>
                    <input
                      className="form-control"
                      value={row.description}
                      onChange={(e) => updateContentRow(row.key, { description: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      className="form-control"
                      value={row.trainingDate}
                      onChange={(e) => updateContentRow(row.key, { trainingDate: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      className="form-control"
                      value={row.timeFrom}
                      onChange={(e) => updateContentRow(row.key, { timeFrom: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      className="form-control"
                      value={row.timeTo}
                      onChange={(e) => updateContentRow(row.key, { timeTo: e.target.value })}
                    />
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {levelToScaleLabel(row.targetLevel)}
                  </td>
                  <td>
                    <select
                      className="form-control"
                      value={row.resultPercent}
                      onChange={(e) => updateContentRow(row.key, { resultPercent: Number(e.target.value) as SkillLevel })}
                    >
                      <option value={0}>0</option>
                      <option value={25}>1</option>
                      <option value={50}>2</option>
                      <option value={75}>3</option>
                      <option value={100}>4</option>
                    </select>
                  </td>
                  <td>
                    <input
                      className="form-control"
                      value={row.remark}
                      onChange={(e) => updateContentRow(row.key, { remark: e.target.value })}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '6px 8px' }}
                      disabled={contentRows.length <= 1}
                      onClick={() => removeContentRow(row.key)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={contentRows.length >= FHR004A_ROW_CAPACITY}
            onClick={() => addContentRow()}
          >
            <Plus size={16} /> เพิ่มแถว ({contentRows.length}/{FHR004A_ROW_CAPACITY})
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 24 }}>
          {exportMessage && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{exportMessage}</span>}
          <button className="btn btn-secondary" onClick={handleExportOjtA} disabled={!canExportOjtA}>
            <FileSpreadsheet size={16} /> {exporting ? 'กำลัง Export...' : 'Export F-HR-004'}
          </button>
          <button className="btn btn-success" onClick={handleSaveOjt} disabled={!targetEmp || !isTenureEligible}>
            <CheckCircle2 size={18} /> บันทึกผลการประเมิน OJT (Form A)
          </button>
        </div>
      </div>
    </div>
  );
};
