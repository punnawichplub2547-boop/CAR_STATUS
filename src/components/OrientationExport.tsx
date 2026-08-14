import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, RefreshCw, AlertCircle, CheckSquare, Square, Pencil, Trash2, X } from 'lucide-react';
import {
  fetchPendingOrientationEmployees,
  updateBackendEmployee,
  deleteBackendEmployee,
  type PendingOrientationEmployee,
  type ExamCategoryStatus,
} from '../utils/api';
import { exportOrientationFHR002, ORIENTATION_ROW_CAPACITY, type OrientationCourseCategory } from '../utils/fhr002Exporter';

const COURSE_OPTIONS: { value: OrientationCourseCategory; label: string }[] = [
  { value: 'REGULATION', label: 'กฎระเบียบข้อบังคับในการทำงาน' },
  { value: 'SAFETY', label: 'ความปลอดภัย อาชีวอนามัย และสภาพแวดล้อมในการทำงาน' },
];

const todayIso = () => new Date().toISOString().slice(0, 10);

interface EditForm {
  id: number;
  empCode: string;
  name: string;
  department: string;
  section: string;
  position: string;
  startingDate: string;
  status: string;
}

const ExamStatusBadge: React.FC<{ label: string; status: ExamCategoryStatus | null }> = ({ label, status }) => {
  if (!status) {
    return <span className="badge" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>{label}: ยังไม่สอบ</span>;
  }
  return (
    <span className={`badge ${status.isPassed ? 'badge-green' : 'badge-red'}`}>
      {label}: {status.isPassed ? 'ผ่าน' : 'ไม่ผ่าน'} {Math.round(status.percentage)}%
    </span>
  );
};

export const OrientationExport: React.FC = () => {
  const [category, setCategory] = useState<OrientationCourseCategory>('REGULATION');
  const [trainingDate, setTrainingDate] = useState(todayIso());
  const [timeRange, setTimeRange] = useState('09.00 - 16.00 น.');
  const [morningTime, setMorningTime] = useState('09.00');
  const [afternoonTime, setAfternoonTime] = useState('13.00');
  const [instructor, setInstructor] = useState('');
  const [location, setLocation] = useState('ห้อง TRAINING บจก. คอมพลีท โอโต รับเบอร์ แมนูแฟ็คเจอริ่ง');

  const [pending, setPending] = useState<PendingOrientationEmployee[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadPending = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const employees = await fetchPendingOrientationEmployees();
      // Preserve the user's existing checkbox choices across a reload (this
      // runs after every edit/delete, and on manual refresh, not just on
      // mount) — only a genuinely new employee that wasn't in the previous
      // list defaults to selected. Re-selecting everyone here used to
      // silently undo any deliberate deselection the moment an unrelated
      // row was edited or deleted.
      const previouslyKnownCodes = new Set(pending.map((e) => e.empCode));
      setSelectedCodes((prevSelected) => {
        const next = new Set<string>();
        employees.forEach((e) => {
          const isNewlySeen = !previouslyKnownCodes.has(e.empCode);
          if (isNewlySeen || prevSelected.has(e.empCode)) {
            next.add(e.empCode);
          }
        });
        return next;
      });
      setPending(employees);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'โหลดรายชื่อพนักงานใหม่ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSelected = (empCode: string) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(empCode)) next.delete(empCode);
      else next.add(empCode);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedCodes((prev) => (prev.size === pending.length ? new Set() : new Set(pending.map((e) => e.empCode))));
  };

  const selectedAttendees = pending.filter((e) => selectedCodes.has(e.empCode));

  const canExport = selectedAttendees.length > 0 && trainingDate && timeRange && morningTime && afternoonTime && instructor && location && !exporting;

  const handleExport = async () => {
    if (!canExport) return;
    setExporting(true);
    setExportMessage(null);
    try {
      const result = await exportOrientationFHR002({
        category,
        trainingDate,
        timeRange,
        morningTime,
        afternoonTime,
        instructor,
        location,
        attendees: selectedAttendees.map((e) => ({
          empCode: e.empCode,
          name: e.name,
          department: e.department,
          position: e.position,
        })),
      });
      const truncatedNote = result.truncatedCount > 0
        ? ` (เกินความจุแบบฟอร์ม ${ORIENTATION_ROW_CAPACITY} แถว — ตัดออก ${result.truncatedCount} คน)`
        : '';
      setExportMessage(`Export สำเร็จ ${result.exportedCount} คน${truncatedNote}`);
    } catch (err) {
      setExportMessage(err instanceof Error ? `Export ไม่สำเร็จ: ${err.message}` : 'Export ไม่สำเร็จ');
    } finally {
      setExporting(false);
    }
  };

  const openEdit = (emp: PendingOrientationEmployee) => {
    setEditError(null);
    setEditForm({
      id: emp.id,
      empCode: emp.empCode,
      name: emp.name,
      department: emp.department,
      section: emp.section ?? '',
      position: emp.position,
      startingDate: emp.startingDate.slice(0, 10),
      status: emp.status,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      await updateBackendEmployee(editForm.id, {
        empCode: editForm.empCode,
        name: editForm.name,
        department: editForm.department,
        section: editForm.section || undefined,
        position: editForm.position,
        startingDate: editForm.startingDate,
        status: editForm.status,
      });
      setEditForm(null);
      await loadPending();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'แก้ไขไม่สำเร็จ');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (emp: PendingOrientationEmployee) => {
    if (!window.confirm(`ลบ "${emp.name}" (${emp.empCode}) ออกจากระบบ F-HR-002?\n\nประวัติการสอบของคนนี้จะถูกลบไปด้วย — ทำแล้วกู้คืนไม่ได้`)) return;
    setDeletingId(emp.id);
    try {
      await deleteBackendEmployee(emp.id);
      await loadPending();
    } catch (err) {
      window.alert(err instanceof Error ? `ลบไม่สำเร็จ: ${err.message}` : 'ลบไม่สำเร็จ');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <div className="eyebrow-tag">ปฐมนิเทศพนักงานใหม่ • F-HR-002</div>
          <h2 style={{ fontSize: '1.1rem', margin: '4px 0 0' }}>Export รายชื่อผู้เข้ารับการฝึกอบรม</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            ดึงรายชื่อพนักงานใหม่ที่ยังไม่ผ่านการสอบปฐมนิเทศจากระบบอัตโนมัติ กรอกรายละเอียดการอบรม แล้ว export เป็น F-HR-002
            (เว้นช่องลงชื่อไว้ให้เซ็นจริงหลังปริ้น)
          </p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={loadPending} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> รีเฟรชรายชื่อ
        </button>
      </div>

      <div className="grid-cols-2" style={{ gap: 12, marginBottom: 18 }}>
        <div className="form-group">
          <label className="form-label">ชื่อหลักสูตร*</label>
          <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value as OrientationCourseCategory)}>
            {COURSE_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">วันที่อบรม*</label>
          <input type="date" className="form-control" value={trainingDate} onChange={(e) => setTrainingDate(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">ช่วงเวลา*</label>
          <input type="text" className="form-control" value={timeRange} onChange={(e) => setTimeRange(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">เวลาเช้า (ช่อง "เวลา" ในตารางเช้า)*</label>
          <input type="text" className="form-control" placeholder="เช่น 09.00" value={morningTime} onChange={(e) => setMorningTime(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">เวลาบ่าย (ช่อง "เวลา" ในตารางบ่าย)*</label>
          <input type="text" className="form-control" placeholder="เช่น 13.00" value={afternoonTime} onChange={(e) => setAfternoonTime(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">วิทยากร*</label>
          <input
            type="text"
            className="form-control"
            placeholder="เช่น น.ส. ชื่อ นามสกุล"
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
            required
          />
        </div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">สถานที่*</label>
          <input type="text" className="form-control" value={location} onChange={(e) => setLocation(e.target.value)} required />
        </div>
      </div>

      {loadError && (
        <div className="badge badge-red" style={{ marginBottom: 14, padding: '10px 14px', width: '100%', justifyContent: 'flex-start' }}>
          <AlertCircle size={14} /> {loadError} — ตรวจสอบว่า backend รันอยู่ (docker compose up -d car-status-mysql car-status-backend)
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h3 style={{ fontSize: '0.95rem', margin: 0 }}>
          พนักงานใหม่ที่ยังไม่ผ่านการสอบ ({pending.length} คน)
        </h3>
        {pending.length > 0 && (
          <button type="button" className="btn btn-sm btn-secondary" onClick={toggleAll}>
            {selectedCodes.size === pending.length ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมด'}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>กำลังโหลด...</div>
      ) : pending.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
          {loadError ? 'โหลดรายชื่อไม่ได้' : 'ไม่มีพนักงานใหม่ที่รอสอบปฐมนิเทศ'}
        </div>
      ) : (
        <div className="table-responsive" style={{ marginBottom: 18 }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th></th>
                <th>ลำดับ</th>
                <th>รหัสพนักงาน</th>
                <th>ชื่อ-สกุล</th>
                <th>แผนก/ฝ่าย</th>
                <th>ตำแหน่ง</th>
                <th>วันเริ่มงาน</th>
                <th>สถานะการสอบ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((emp, idx) => (
                <tr key={emp.id}>
                  <td>
                    <button type="button" className="btn-icon" onClick={() => toggleSelected(emp.empCode)}>
                      {selectedCodes.has(emp.empCode) ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </td>
                  <td>{idx + 1}</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{emp.empCode}</td>
                  <td>{emp.name}</td>
                  <td><span className="badge badge-blue">{emp.department}</span></td>
                  <td>{emp.position}</td>
                  <td>{emp.startingDate.slice(0, 10)}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <ExamStatusBadge label="กฎระเบียบ" status={emp.examStatus.REGULATION} />
                      <ExamStatusBadge label="ความปลอดภัย" status={emp.examStatus.SAFETY} />
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="btn-icon" title="แก้ไข" onClick={() => openEdit(emp)}>
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        title="ลบ"
                        style={{ color: 'var(--danger)' }}
                        disabled={deletingId === emp.id}
                        onClick={() => handleDelete(emp)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-primary" onClick={handleExport} disabled={!canExport}>
          <FileSpreadsheet size={16} /> {exporting ? 'กำลัง Export...' : `Export F-HR-002 (${selectedAttendees.length} คน)`}
        </button>
        {exportMessage && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{exportMessage}</span>}
      </div>

      {editForm && (
        <div className="modal-overlay" onClick={() => setEditForm(null)}>
          <div className="modal-content" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>แก้ไขข้อมูลพนักงาน</h3>
              <button type="button" className="btn-icon" onClick={() => setEditForm(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                {editError && (
                  <div className="badge badge-red" style={{ marginBottom: 14, padding: '10px 14px', width: '100%', justifyContent: 'flex-start' }}>
                    <AlertCircle size={14} /> {editError}
                  </div>
                )}
                <div className="grid-cols-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">รหัสพนักงาน*</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.empCode}
                      onChange={(e) => setEditForm({ ...editForm, empCode: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ชื่อ-สกุล*</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">แผนก*</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.department}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">หน่วยงาน</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.section}
                      onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ตำแหน่ง*</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.position}
                      onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">วันเริ่มงาน*</label>
                    <input
                      type="date"
                      className="form-control"
                      value={editForm.startingDate}
                      onChange={(e) => setEditForm({ ...editForm, startingDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">สถานะ</label>
                    <select
                      className="form-control"
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    >
                      <option value="PROBATION">ทดลองงาน (Probation)</option>
                      <option value="PERMANENT">พนักงานประจำ</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditForm(null)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                  {savingEdit ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
