import React, { useEffect, useState } from 'react';
import { FileText, CheckCircle2, Lock, Globe2, Plus, Trash2, FileSpreadsheet } from 'lucide-react';
import type {
  Employee,
  OjtSession,
  OjtContentItem,
  OjtParticipant,
  OjtChangeReasonCategory,
  OjtEvaluationMethod,
  SkillLevel,
} from '../types';
import { exportFHR004B, FHR004B_ROW_CAPACITY, type ExportOjtParticipant } from '../utils/fhr004Exporter';

interface OjtFormBEvaluatorProps {
  employees: Employee[];
  currentUser: Employee;
  onAddOjtSession: (session: OjtSession, contentItems: OjtContentItem[], participants: OjtParticipant[]) => void;
}

// "1. ความรู้ความเข้าใจก่อน-หลังการฝึกอบรม" — the real form has the trainee
// self-rate their own understanding on this 0-3 scale (not a percentage),
// separately from "2. ผลการประเมิน" (the instructor's 0/25/50/75/100 score
// below). preScore/postScore in the data model map to this 0-3 value.
type UnderstandingScore = 0 | 1 | 2 | 3;
const UNDERSTANDING_SCALE: { val: UnderstandingScore; label: string }[] = [
  { val: 0, label: 'ไม่เคยรู้ / ไม่เข้าใจ / ไม่เคยปฏิบัติ' },
  { val: 1, label: 'เคยรู้ แต่เข้าใจไม่ครบถ้วน / ไม่เคยปฏิบัติ' },
  { val: 2, label: 'รู้เข้าใจแล้ว แต่ยังปฏิบัติไม่ได้' },
  { val: 3, label: 'รู้เข้าใจ สามารถปฏิบัติได้และสอนงานได้' },
];

// "2. ผลการประเมิน ให้ผู้สอนงานประเมินออกมาเป็น % และลงบันทึก" — verbatim from
// the template's own legend (rows 37-41). Drives instructorScorePercent,
// which also decides isPassed (>= 75%).
const EVALUATION_SCALE: { val: SkillLevel; label: string }[] = [
  { val: 0, label: 'ไม่สามารถปฏิบัติงานได้ (ไม่ผ่านเกณฑ์การฝึกอบรมและต้องทำการ OJT ซ้ำ)' },
  {
    val: 25,
    label:
      'อยู่ในช่วงการฝึกอบรม ยังไม่สามารถปล่อยให้ทำงานได้ และกำลังอยู่ในช่วงเรียนรู้หรือฝึกทักษะในการปฏิบัติงานนั้น ๆ ภายใต้ความควบคุมของผู้ฝึกสอนตลอดเวลา (ไม่ผ่านเกณฑ์การฝึกอบรมและต้องทำการ OJT ซ้ำ)',
  },
  { val: 50, label: 'ปฏิบัติงานได้แต่ต้องมีผู้ควบคุมตรวจสอบผลงานเป็นระยะ ๆ (ไม่ผ่านเกณฑ์การฝึกอบรมและต้องทำการ OJT ซ้ำ)' },
  { val: 75, label: 'มีการพัฒนาและปรับปรุงงานให้ดีขึ้นอยู่เสมอ, ทำงานได้โดยไม่ต้องมีคนคอยตรวจสอบผลงาน (ผ่านเกณฑ์การฝึกอบรม)' },
  { val: 100, label: 'สามารถสอนงานและให้ความรู้กับบุคคลอื่นได้ (ผ่านเกณฑ์การฝึกอบรม)' },
];

interface ParticipantRowDraft {
  key: string;
  employeeId: string;
  preScore: UnderstandingScore;
  postScore: UnderstandingScore;
  instructorScorePercent: SkillLevel;
  remark: string;
}

const createEmptyParticipantRow = (employeeId: string): ParticipantRowDraft => ({
  key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  employeeId,
  preScore: 0,
  postScore: 3,
  instructorScorePercent: 75,
  remark: '',
});

export const OjtFormBEvaluator: React.FC<OjtFormBEvaluatorProps> = ({ employees, currentUser, onAddOjtSession }) => {
  // Same "ผู้บังคับบัญชาเป็นผู้ประเมิน" condition as Form A — department heads/
  // supervisors only evaluate their own team, admins keep full visibility.
  const scopedEmployees =
    currentUser.role === 'ADMIN' ? employees : employees.filter((e) => e.department === currentUser.department);
  const canEvaluate = currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR';

  const [courseTitle, setCourseTitle] = useState('การควบคุมเครื่องฉีดอัดยาง และการตบแต่ง Part ชิ้นงานยางรถยนต์');
  const [contentSubItems, setContentSubItems] = useState<string[]>(['', '', '', '']);
  const [trainingDate, setTrainingDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [location, setLocation] = useState('');
  const [instructorName1, setInstructorName1] = useState('');
  const [instructorName2, setInstructorName2] = useState('');
  const [changeReasonCategory, setChangeReasonCategory] = useState<OjtChangeReasonCategory>('METHOD');
  const [changeReasonOtherDetail, setChangeReasonOtherDetail] = useState('');
  const [evaluationMethod, setEvaluationMethod] = useState<OjtEvaluationMethod>('PRACTICAL');
  const [hasAttachment, setHasAttachment] = useState(false);
  const [participantRows, setParticipantRows] = useState<ParticipantRowDraft[]>(
    scopedEmployees[0] ? [createEmptyParticipantRow(scopedEmployees[0].id)] : []
  );
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // Re-scope participant rows whenever the logged-in user (and thus their
  // department) changes, OR whenever the employees list itself updates —
  // `employees` commonly arrives empty on first render and populates once
  // an async fetch resolves; without depending on it here, participantRows
  // would stay permanently empty (seeded from an empty scopedEmployees at
  // mount) even after real employee data loads. Drop any picks that fall
  // outside the new scope.
  useEffect(() => {
    setParticipantRows((rows) => {
      const kept = rows.filter((r) => scopedEmployees.some((e) => e.id === r.employeeId));
      if (kept.length > 0) return kept;
      return scopedEmployees[0] ? [createEmptyParticipantRow(scopedEmployees[0].id)] : [];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id, currentUser.department, currentUser.role, employees]);

  const pickedEmployeeIds = new Set(participantRows.map((r) => r.employeeId));
  const availableForNewRow = scopedEmployees.filter((e) => !pickedEmployeeIds.has(e.id));

  const addParticipantRow = () => {
    setParticipantRows((rows) => {
      if (rows.length >= FHR004B_ROW_CAPACITY) return rows;
      const next = scopedEmployees.find((e) => !rows.some((r) => r.employeeId === e.id));
      if (!next) return rows;
      return [...rows, createEmptyParticipantRow(next.id)];
    });
  };

  const removeParticipantRow = (key: string) => {
    setParticipantRows((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.key !== key)));
  };

  const updateParticipantRow = (key: string, patch: Partial<ParticipantRowDraft>) => {
    setParticipantRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  // The real form has one department field for the whole session — take it
  // from whoever's actually in the trainee list rather than the evaluator's
  // own department, since an Admin's list can span departments.
  const sessionDepartment = (() => {
    const firstPickedEmp = scopedEmployees.find((e) => e.id === participantRows[0]?.employeeId);
    return firstPickedEmp?.department || currentUser.department;
  })();

  type ResolvedParticipant = ExportOjtParticipant & { employeeId: string; position: string };

  const resolveParticipants = (): ResolvedParticipant[] =>
    participantRows
      .map((row): ResolvedParticipant | null => {
        const emp = scopedEmployees.find((e) => e.id === row.employeeId);
        if (!emp) return null;
        return {
          employeeId: emp.id,
          empCode: emp.empCode,
          employeeName: emp.name,
          position: emp.position,
          preScore: row.preScore,
          postScore: row.postScore,
          instructorScorePercent: row.instructorScorePercent,
          isPassed: row.instructorScorePercent >= 75,
          remarks: row.remark || undefined,
        };
      })
      .filter((p): p is ResolvedParticipant => p !== null);

  const handleSaveOjt = () => {
    const resolvedParticipants = resolveParticipants();
    if (resolvedParticipants.length === 0) return;

    const sessionId = `ojt-session-${Date.now()}`;
    const firstEmp = scopedEmployees.find((e) => e.id === resolvedParticipants[0].employeeId);

    const newSession: OjtSession = {
      id: sessionId,
      formType: 'B_CHANGE',
      department: sessionDepartment,
      position: firstEmp?.position || '',
      evaluationMethod,
      hasAttachment,
      changeReasonCategory,
      changeReasonOtherDetail: changeReasonCategory === 'OTHER' ? changeReasonOtherDetail || undefined : undefined,
      assessorName: currentUser.name,
      managerName: currentUser.supervisorName || currentUser.name,
      courseTitle,
      trainingDate,
      timeFrom: timeFrom || undefined,
      timeTo: timeTo || undefined,
      location: location || undefined,
      instructorName1: instructorName1 || undefined,
      instructorName2: instructorName2 || undefined,
    };

    const newContentItems: OjtContentItem[] = contentSubItems
      .filter((desc) => desc.trim())
      .map((desc, idx) => ({
        id: `ojt-content-${Date.now()}-${idx}`,
        sessionId,
        sequence: idx + 1,
        description: desc,
      }));

    const newParticipants: OjtParticipant[] = resolvedParticipants.map((p, idx) => ({
      id: `ojt-participant-${Date.now()}-${idx}`,
      sessionId,
      employeeId: p.employeeId,
      employeeName: p.employeeName,
      empCode: p.empCode,
      position: p.position,
      preScore: p.preScore,
      postScore: p.postScore,
      instructorScorePercent: p.instructorScorePercent,
      isPassed: p.isPassed,
      remarks: p.remarks,
    }));

    onAddOjtSession(newSession, newContentItems, newParticipants);
    alert('บันทึกผลการประเมิน OJT เรียบร้อยแล้ว!');
  };

  // Mirrors the guard inside handleSaveOjt (resolvedParticipants.length ===
  // 0) so the button's disabled state and the click handler's early-return
  // never disagree — without this, clicking Save with an empty scope (e.g.
  // a supervisor whose department has 0 employees) silently did nothing.
  const canSaveOjtB = resolveParticipants().length > 0;
  const canExportOjtB = participantRows.length > 0 && !exporting;

  const handleExportOjtB = async () => {
    const resolvedParticipants = resolveParticipants();
    if (resolvedParticipants.length === 0) return;
    setExporting(true);
    setExportMessage(null);
    try {
      const result = await exportFHR004B({
        courseTitle,
        contentSubItems,
        department: sessionDepartment,
        trainingDate,
        timeFrom: timeFrom || undefined,
        timeTo: timeTo || undefined,
        location: location || undefined,
        instructorName1: instructorName1 || undefined,
        instructorName2: instructorName2 || undefined,
        changeReasonCategory,
        changeReasonOtherDetail: changeReasonCategory === 'OTHER' ? changeReasonOtherDetail || undefined : undefined,
        evaluationMethod,
        hasAttachment,
        participants: resolvedParticipants,
      });
      const truncatedNote =
        result.truncatedCount > 0
          ? ` (เกินความจุแบบฟอร์ม ${FHR004B_ROW_CAPACITY} คน — ตัดออก ${result.truncatedCount} รายการ)`
          : '';
      setExportMessage(`Export สำเร็จ ${result.exportedCount} คน${truncatedNote}`);
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
            <FileText size={14} /> F-HR-004 FORM(B) • OJT เปลี่ยนงาน/4M1E
          </div>
          <h1 className="page-title gradient-text">F-HR-004 Form(B) แบบบันทึกการฝึกอบรมเฉพาะงาน (4M1E Change)</h1>
          <p className="page-subtitle">บันทึกผลการฝึกอบรมเฉพาะงานกรณีโยกย้าย/สับเปลี่ยนตำแหน่ง หรือมีการเปลี่ยนแปลง 4M1E — อบรมได้สูงสุด 10 คนต่อรอบ</p>
        </div>
      </div>

      {!canEvaluate ? (
        <div
          className="glass-card"
          style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
        >
          <Lock size={28} />
          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>เฉพาะหัวหน้างานเท่านั้นที่ประเมิน OJT ได้</div>
          <div style={{ fontSize: '0.85rem' }}>
            บัญชีของคุณ ({currentUser.name}) มีสิทธิ์ระดับ "{currentUser.role}" — การประเมิน F-HR-004 Form B สงวนไว้สำหรับหัวหน้างาน
            (Supervisor) เท่านั้น ตามเงื่อนไข "ผู้บังคับบัญชาเป็นผู้ประเมิน"
          </div>
        </div>
      ) : (
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2>F-HR-004 Form(B) แบบบันทึกการฝึกอบรมเฉพาะงาน (4M1E Change)</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>บริษัท คอมพลีท โอโต รับเบอร์ แมนูแฟ็คเจอริ่ง จำกัด</span>
          </div>
          <span className="badge badge-purple">Rev.11 Effective: 12/10/2023</span>
        </div>

        {currentUser.role === 'ADMIN' ? (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Globe2 size={12} /> สิทธิ์ Admin — มองเห็นพนักงานทุกแผนก ({scopedEmployees.length} คน)
          </div>
        ) : (
          <div
            style={{
              fontSize: '0.78rem',
              color: scopedEmployees.length === 0 ? 'var(--danger, #dc2626)' : 'var(--text-muted)',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Lock size={12} /> แสดงเฉพาะพนักงานแผนก "{currentUser.department}" ({scopedEmployees.length} คน)
          </div>
        )}

        <div className="grid-cols-2" style={{ gap: 20, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">1. หลักสูตร</label>
            <input className="form-control" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">แผนก / หน่วยงาน</label>
            <input className="form-control" readOnly value={sessionDepartment || '-'} />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">เนื้อหาหลักสูตร (สูงสุด 4 หัวข้อ)</label>
          {contentSubItems.map((val, idx) => (
            <input
              key={idx}
              className="form-control"
              style={{ marginBottom: 8 }}
              placeholder={`1.${idx + 1}`}
              value={val}
              onChange={(e) => setContentSubItems((items) => items.map((it, i) => (i === idx ? e.target.value : it)))}
            />
          ))}
        </div>

        <div className="grid-cols-3" style={{ gap: 20, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">วันที่อบรม</label>
            <input type="date" className="form-control" value={trainingDate} onChange={(e) => setTrainingDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">เวลาที่อบรมตั้งแต่</label>
            <input type="time" className="form-control" value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">ถึง</label>
            <input type="time" className="form-control" value={timeTo} onChange={(e) => setTimeTo(e.target.value)} />
          </div>
        </div>

        <div className="grid-cols-3" style={{ gap: 20, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">ผู้สอนงาน/วิทยากร 1</label>
            <input className="form-control" value={instructorName1} onChange={(e) => setInstructorName1(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">ผู้สอนงาน/วิทยากร 2</label>
            <input className="form-control" value={instructorName2} onChange={(e) => setInstructorName2(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">สถานที่ในการจัดอบรม</label>
            <input className="form-control" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
        </div>

        <div className="grid-cols-3" style={{ gap: 20, marginBottom: 20 }}>
          <div className="form-group">
            <label className="form-label">2. สาเหตุที่อบรม (4M1E Change)</label>
            <select
              className="form-control"
              value={changeReasonCategory}
              onChange={(e) => setChangeReasonCategory(e.target.value as OjtChangeReasonCategory)}
            >
              <option value="DOCUMENT">เปลี่ยนแปลงเอกสารในการทำงาน</option>
              <option value="METHOD">เปลี่ยนแปลงวิธีทำงาน</option>
              <option value="MATERIAL">เปลี่ยนแปลงวัตถุดิบ</option>
              <option value="MACHINE">เปลี่ยนแปลงเครื่องจักร/เครื่องมือ</option>
              <option value="ANNUAL_REVIEW">ทบทวนประจำปี (Annual Review)</option>
              <option value="OTHER">อื่นๆ (โปรดระบุ)</option>
            </select>
            {changeReasonCategory === 'OTHER' && (
              <input
                className="form-control"
                style={{ marginTop: 8 }}
                placeholder="โปรดระบุสาเหตุ"
                value={changeReasonOtherDetail}
                onChange={(e) => setChangeReasonOtherDetail(e.target.value)}
              />
            )}
          </div>

          <div className="form-group">
            <label className="form-label">3. ประเมินผลโดยการ</label>
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
            <label className="form-label">4. บันทึกผลการประเมิน</label>
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

        <div
          className="glass-card"
          style={{ padding: 14, marginBottom: 14, fontSize: '0.78rem', color: 'var(--text-muted)' }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-main)' }}>
            1. ความรู้ความเข้าใจก่อน-หลังการฝึกอบรม (ให้ผู้เข้าอบรมประเมินตนเอง)
          </div>
          {UNDERSTANDING_SCALE.map((s) => (
            <div key={s.val}>{s.val} = {s.label}</div>
          ))}
          <div style={{ fontWeight: 700, margin: '10px 0 4px', color: 'var(--text-main)' }}>
            2. ผลการประเมิน ให้ผู้สอนงานประเมินออกมาเป็น % และลงบันทึก
          </div>
          {EVALUATION_SCALE.map((s) => (
            <div key={s.val}>{s.val}% = {s.label}</div>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ width: '100%', minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th>พนักงานเข้ารับการอบรม</th>
                <th style={{ width: 140 }}>คะแนนก่อน</th>
                <th style={{ width: 140 }}>คะแนนหลัง</th>
                <th style={{ width: 110 }}>เกณฑ์ผ่านการประเมิน</th>
                <th style={{ width: 130 }}>ผลการประเมิน</th>
                <th>หมายเหตุ</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {participantRows.map((row, idx) => {
                const rowOptions = scopedEmployees.filter(
                  (e) => e.id === row.employeeId || availableForNewRow.some((a) => a.id === e.id)
                );
                return (
                  <tr key={row.key}>
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td>
                      <select
                        className="form-control"
                        value={row.employeeId}
                        onChange={(e) => updateParticipantRow(row.key, { employeeId: e.target.value })}
                      >
                        {rowOptions.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.empCode} - {e.name} ({e.position})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className="form-control"
                        value={row.preScore}
                        onChange={(e) =>
                          updateParticipantRow(row.key, { preScore: Number(e.target.value) as UnderstandingScore })
                        }
                      >
                        {UNDERSTANDING_SCALE.map((s) => (
                          <option key={s.val} value={s.val}>
                            {s.val}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className="form-control"
                        value={row.postScore}
                        onChange={(e) =>
                          updateParticipantRow(row.key, { postScore: Number(e.target.value) as UnderstandingScore })
                        }
                      >
                        {UNDERSTANDING_SCALE.map((s) => (
                          <option key={s.val} value={s.val}>
                            {s.val}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }} title="เกณฑ์ผ่านคงที่ทุกแถว ตามฟอร์มจริง (≥ 75% = ผ่านเกณฑ์การฝึกอบรม)">
                      75% (⊕ ผ่านเกณฑ์)
                    </td>
                    <td>
                      <select
                        className="form-control"
                        value={row.instructorScorePercent}
                        onChange={(e) =>
                          updateParticipantRow(row.key, { instructorScorePercent: Number(e.target.value) as SkillLevel })
                        }
                      >
                        <option value={0}>0% ไม่ผ่าน</option>
                        <option value={25}>25% ไม่ผ่าน</option>
                        <option value={50}>50% ไม่ผ่าน</option>
                        <option value={75}>75% ผ่าน</option>
                        <option value={100}>100% ผ่าน</option>
                      </select>
                    </td>
                    <td>
                      <input
                        className="form-control"
                        value={row.remark}
                        onChange={(e) => updateParticipantRow(row.key, { remark: e.target.value })}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '6px 8px' }}
                        disabled={participantRows.length <= 1}
                        onClick={() => removeParticipantRow(row.key)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={participantRows.length >= FHR004B_ROW_CAPACITY || availableForNewRow.length === 0}
            onClick={addParticipantRow}
          >
            <Plus size={16} /> เพิ่มพนักงาน ({participantRows.length}/{FHR004B_ROW_CAPACITY})
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 24 }}>
          {exportMessage && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{exportMessage}</span>}
          <button className="btn btn-secondary" onClick={handleExportOjtB} disabled={!canExportOjtB}>
            <FileSpreadsheet size={16} /> {exporting ? 'กำลัง Export...' : 'Export F-HR-004'}
          </button>
          <button className="btn btn-success" onClick={handleSaveOjt} disabled={!canSaveOjtB}>
            <CheckCircle2 size={18} /> บันทึกผลการประเมิน OJT (Form B)
          </button>
        </div>
      </div>
      )}
    </div>
  );
};
