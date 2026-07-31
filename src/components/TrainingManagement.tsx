import React, { useEffect, useState } from 'react';
import { CheckCircle2, GraduationCap, Plus, Search, Pencil, Trash2, Eye, X } from 'lucide-react';
import type { Employee, TrainingCourse, TrainingAttendance } from '../types';
import { SignaturePad } from './SignaturePad';

interface TrainingManagementProps {
  courses: TrainingCourse[];
  attendances: TrainingAttendance[];
  employees: Employee[];
  onAddCourse: (course: TrainingCourse) => void;
  onEditCourse: (course: TrainingCourse) => void;
  onDeleteCourse: (courseId: string) => void;
  onCheckIn: (courseId: string, employeeId: string, period: 'morning' | 'afternoon', time: string, signatureDataUrl: string) => void;
  onDeleteAttendance: (attendanceId: string) => void;
}

const CATEGORY_OPTIONS: { value: TrainingCourse['category']; label: string }[] = [
  { value: 'SAFETY', label: 'ความปลอดภัย (Safety)' },
  { value: 'REGULATION', label: 'กฎระเบียบ (Regulation)' },
  { value: 'QUALITY_IATF', label: 'คุณภาพ IATF/ISO' },
  { value: 'JOB_SPECIFIC', label: 'งานเฉพาะทาง (Job Specific)' },
  { value: 'SOFT_SKILLS', label: 'ทักษะทั่วไป (Soft Skills)' },
];

export const TrainingManagement: React.FC<TrainingManagementProps> = ({
  courses,
  attendances,
  employees,
  onAddCourse,
  onEditCourse,
  onDeleteCourse,
  onCheckIn,
  onDeleteAttendance,
}) => {
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(courses[0] ?? null);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInEmpId, setCheckInEmpId] = useState(employees[0]?.id || '');
  const [checkInPeriod, setCheckInPeriod] = useState<'morning' | 'afternoon'>('morning');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState(false);
  const [signatureResetKey, setSignatureResetKey] = useState(0);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);

  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  const handleViewAttendees = (course: TrainingCourse) => {
    setSelectedCourse(course);
    setShowAttendeesModal(true);
  };
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCategory, setCourseCategory] = useState<TrainingCourse['category']>('SAFETY');
  const [courseInstructor, setCourseInstructor] = useState('');
  const [courseDate, setCourseDate] = useState('');
  const [courseTimeRange, setCourseTimeRange] = useState('09.00 - 16.00 น.');
  const [courseLocation, setCourseLocation] = useState('');
  const [courseHours, setCourseHours] = useState(6);

  const [courseSearchTerm, setCourseSearchTerm] = useState('');

  const courseAttendances = attendances.filter((a) => a.courseId === selectedCourse?.id);

  const filteredCourses = courses
    .filter(
      (c) =>
        c.code.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
        c.title.toLowerCase().includes(courseSearchTerm.toLowerCase())
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  // Keep selection valid if the selected course gets deleted
  useEffect(() => {
    if (selectedCourse && !courses.some((c) => c.id === selectedCourse.id)) {
      setSelectedCourse(courses[0] ?? null);
    }
  }, [courses, selectedCourse]);

  const handleConfirmCheckIn = () => {
    const emp = employees.find((e) => e.id === checkInEmpId);
    if (!emp || !selectedCourse) return;
    if (!signatureDataUrl) {
      setSignatureError(true);
      return;
    }
    const time = new Date().toLocaleTimeString('en-GB');
    onCheckIn(selectedCourse.id, checkInEmpId, checkInPeriod, time, signatureDataUrl);
    setLastCheckIn(`เช็กชื่อ ${emp.name} (${checkInPeriod === 'morning' ? 'เช้า' : 'บ่าย'}) เวลา ${time} เรียบร้อยแล้ว`);
    setSignatureDataUrl(null);
    setSignatureError(false);
    setSignatureResetKey((k) => k + 1);
  };

  const resetCourseForm = () => {
    setEditingCourseId(null);
    setCourseCode('');
    setCourseTitle('');
    setCourseCategory('SAFETY');
    setCourseInstructor('');
    setCourseDate('');
    setCourseTimeRange('09.00 - 16.00 น.');
    setCourseLocation('');
    setCourseHours(6);
  };

  const handleOpenAddCourse = () => {
    resetCourseForm();
    setShowAddCourseModal(true);
  };

  const handleOpenEditCourse = (c: TrainingCourse) => {
    setEditingCourseId(c.id);
    setCourseCode(c.code);
    setCourseTitle(c.title);
    setCourseCategory(c.category);
    setCourseInstructor(c.instructor);
    setCourseDate(c.date);
    setCourseTimeRange(c.timeRange);
    setCourseLocation(c.location);
    setCourseHours(c.hours);
    setShowAddCourseModal(true);
  };

  const handleDeleteCourse = (c: TrainingCourse) => {
    if (!window.confirm(`ลบหลักสูตร "${c.title}"?\nรายชื่อผู้เข้าอบรมทั้งหมดของหลักสูตรนี้จะถูกลบไปด้วย`)) return;
    onDeleteCourse(c.id);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode || !courseTitle || !courseInstructor || !courseDate || !courseLocation) return;

    if (editingCourseId) {
      const existing = courses.find((c) => c.id === editingCourseId);
      if (!existing) return;
      const updatedCourse: TrainingCourse = {
        ...existing,
        code: courseCode,
        title: courseTitle,
        category: courseCategory,
        instructor: courseInstructor,
        date: courseDate,
        timeRange: courseTimeRange,
        location: courseLocation,
        hours: courseHours,
      };
      onEditCourse(updatedCourse);
      if (selectedCourse?.id === updatedCourse.id) setSelectedCourse(updatedCourse);
    } else {
      const newCourse: TrainingCourse = {
        id: `course-${Date.now()}`,
        code: courseCode,
        title: courseTitle,
        category: courseCategory,
        instructor: courseInstructor,
        date: courseDate,
        timeRange: courseTimeRange,
        location: courseLocation,
        hours: courseHours,
        totalParticipants: 0,
        status: 'SCHEDULED',
      };
      onAddCourse(newCourse);
      setSelectedCourse(newCourse);
    }

    setShowAddCourseModal(false);
    resetCourseForm();
  };

  const handleDeleteAttendanceRow = (att: TrainingAttendance) => {
    if (!window.confirm(`ลบประวัติเช็กชื่อของ "${att.employeeName}"?`)) return;
    onDeleteAttendance(att.id);
  };

  return (
    <div className="training-page content-container">
      <div className="page-header">
        <div>
          <div className="eyebrow-tag">
            <GraduationCap size={14} /> TRAINING MANAGEMENT • บันทึกการอบรม (F-HR-002)
          </div>
          <h1 className="page-title gradient-text">ระบบบันทึกการฝึกอบรม (F-HR-002)</h1>
          <p className="page-subtitle">
            บันทึกประวัติการอบรมประจำหลักสูตร เช็กชื่อเข้าอบรมย้อนหลัง และสรุปชั่วโมงฝึกอบรมสะสม
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleOpenAddCourse}>
            <Plus size={18} /> เพิ่มหลักสูตรใหม่
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setLastCheckIn(null);
              setCheckInEmpId(employees[0]?.id || '');
              setSignatureDataUrl(null);
              setSignatureError(false);
              setSignatureResetKey((k) => k + 1);
              setShowCheckInModal(true);
            }}
          >
            <CheckCircle2 size={18} /> เช็กชื่อเข้าอบรม (F-HR-002)
          </button>
        </div>
      </div>

      {/* Course list — always visible, no separate modal needed */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: '1rem' }}>รายการหลักสูตร ({courses.length})</h2>
        </div>

        <div className="form-group" style={{ margin: '0 0 14px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: 36 }}
              placeholder="ค้นหารหัสหรือชื่อหลักสูตร..."
              value={courseSearchTerm}
              onChange={(e) => setCourseSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
            ไม่พบหลักสูตรที่ค้นหา
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredCourses.map((c) => (
              <div
                key={c.id}
                className="glass-card"
                style={{
                  padding: 14,
                  border: c.id === selectedCourse?.id ? '1px solid var(--primary)' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span className="badge badge-purple">{c.code}</span>
                  <span className={`badge ${c.status === 'COMPLETED' ? 'badge-green' : 'badge-amber'}`}>
                    {c.status === 'COMPLETED' ? 'เสร็จสิ้นแล้ว' : 'กำลังจะเกิดขึ้น'}
                  </span>
                  <span className="badge badge-blue">
                    {attendances.filter((a) => a.courseId === c.id).length} คน
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{c.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2, marginBottom: 12 }}>
                  {c.date} ({c.timeRange}) · {c.instructor}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => handleViewAttendees(c)}
                  >
                    <Eye size={13} /> ดูรายชื่อ
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => handleOpenEditCourse(c)}
                  >
                    <Pencil size={13} /> แก้ไข
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    style={{ flex: 1, color: 'var(--danger)' }}
                    onClick={() => handleDeleteCourse(c)}
                  >
                    <Trash2 size={13} /> ลบ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Course Attendance Sheet (Form F-HR-002 Display) */}
      {selectedCourse && (
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>ใบบันทึกรายชื่อผู้เข้ารับการฝึกอบรม (F-HR-002 Rev.6)</div>
              <h2 style={{ fontSize: '1.35rem', lineHeight: 1.35, wordBreak: 'break-word' }}>{selectedCourse.title}</h2>
            </div>
            <span className="badge badge-blue" style={{ fontSize: '0.85rem', padding: '6px 14px', flexShrink: 0, marginTop: 4 }}>
              รวมทั้งสิ้น {courseAttendances.length} คน
            </span>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ลำดับ</th>
                  <th>พนักงาน</th>
                  <th>แผนก / ตำแหน่ง</th>
                  <th>เวลาเช็กชื่อ</th>
                  <th>ผลการอบรม</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {courseAttendances.map((att, idx) => (
                  <tr key={att.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{att.empCode}</div>
                      <div style={{ fontWeight: 600 }}>{att.employeeName}</div>
                    </td>
                    <td>
                      <span className="badge badge-blue">{att.department}</span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{att.position}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span>เช้า {att.checkInMorning || '-'}</span>
                        {att.signedMorning && (
                          <img
                            src={att.signedMorning}
                            alt="ลายเซ็นเช้า"
                            style={{ height: 22, background: '#fff', borderRadius: 4, border: '1px solid var(--border-color)' }}
                          />
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>บ่าย {att.checkInAfternoon || '-'}</span>
                        {att.signedAfternoon && (
                          <img
                            src={att.signedAfternoon}
                            alt="ลายเซ็นบ่าย"
                            style={{ height: 22, background: '#fff', borderRadius: 4, border: '1px solid var(--border-color)' }}
                          />
                        )}
                      </div>
                    </td>
                    <td>
                      {att.isPassed ? (
                        <span className="badge badge-green"><CheckCircle2 size={12} /> ผ่านเกณฑ์การอบรม</span>
                      ) : (
                        <span className="badge badge-red">ไม่ผ่าน</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-icon"
                        title="ลบประวัติเช็กชื่อนี้"
                        onClick={() => handleDeleteAttendanceRow(att)}
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Check-in Counter Modal — records time + signature per F-HR-002 */}
      {showCheckInModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 450, textAlign: 'center' }}>
            <div className="modal-header">
              <h3>เช็กชื่อเข้าอบรม (F-HR-002)</h3>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              {/* Concept mockup only — not wired to any real scan/auth flow yet */}
              <div
                style={{
                  width: '100%',
                  position: 'relative',
                  padding: '18px 14px 14px',
                  borderRadius: 12,
                  border: '1.5px dashed var(--border-color)',
                  opacity: 0.85,
                }}
              >
                <span
                  className="badge badge-amber"
                  style={{ position: 'absolute', top: -10, left: 12, fontSize: '0.7rem' }}
                >
                  Mockup
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ padding: 10, background: 'white', borderRadius: 12 }}>
                    <div style={{ width: 110, height: 110, border: '5px solid #0f172a', borderRadius: 8, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3, padding: 6, background: '#fff' }}>
                      <div style={{ background: '#0f172a' }}></div><div style={{ background: '#0f172a' }}></div><div style={{ background: '#0f172a' }}></div><div></div><div style={{ background: '#0f172a' }}></div>
                      <div style={{ background: '#0f172a' }}></div><div></div><div style={{ background: '#0f172a' }}></div><div style={{ background: '#0f172a' }}></div><div></div>
                      <div></div><div style={{ background: '#0f172a' }}></div><div></div><div style={{ background: '#0f172a' }}></div><div style={{ background: '#0f172a' }}></div>
                      <div style={{ background: '#0f172a' }}></div><div style={{ background: '#0f172a' }}></div><div></div><div style={{ background: '#0f172a' }}></div><div></div>
                      <div style={{ background: '#0f172a' }}></div><div></div><div style={{ background: '#0f172a' }}></div><div></div><div style={{ background: '#0f172a' }}></div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    ในอนาคต พนักงานจะสแกน QR นี้ด้วยมือถือตัวเองเพื่อเช็กชื่อ — ต้องมีระบบ Login รายบุคคลก่อนถึงจะใช้งานได้จริง
                  </div>
                </div>
              </div>

              <div style={{ width: '100%', textAlign: 'left', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                ใช้งานได้จริงตอนนี้ — เช็กชื่อผ่านเจ้าหน้าที่
              </div>

              <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                เลือกพนักงาน ช่วงเวลา แล้วลงชื่อยืนยัน — ระบบจะบันทึกเวลาและลายเซ็นตามแบบฟอร์ม F-HR-002
              </div>

              <div className="form-group" style={{ width: '100%', textAlign: 'left' }}>
                <label className="form-label">พนักงานที่เช็กชื่อ</label>
                <select
                  className="form-control"
                  value={checkInEmpId}
                  onChange={(e) => setCheckInEmpId(e.target.value)}
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.empCode} - {e.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${checkInPeriod === 'morning' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => setCheckInPeriod('morning')}
                >
                  เช้า
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${checkInPeriod === 'afternoon' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => setCheckInPeriod('afternoon')}
                >
                  บ่าย
                </button>
              </div>

              <SignaturePad
                key={signatureResetKey}
                error={signatureError}
                onChange={(dataUrl) => {
                  setSignatureDataUrl(dataUrl);
                  if (dataUrl && signatureError) setSignatureError(false);
                }}
              />

              <button className="btn btn-success" style={{ width: '100%' }} onClick={handleConfirmCheckIn}>
                <CheckCircle2 size={16} /> บันทึกเวลาเช็กชื่อ
              </button>

              {lastCheckIn && (
                <div className="badge badge-green" style={{ width: '100%', justifyContent: 'center', padding: '10px 14px' }}>
                  <CheckCircle2 size={14} /> {lastCheckIn}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCheckInModal(false)}>
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Course Modal */}
      {showAddCourseModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>{editingCourseId ? 'แก้ไขหลักสูตรอบรม' : 'เพิ่มหลักสูตรอบรมใหม่'}</h3>
            </div>
            <form onSubmit={handleSaveCourse}>
              <div className="modal-body">
                <div className="grid-cols-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">รหัสหลักสูตร*</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="เช่น TRN-2026-003"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">หมวดหมู่</label>
                    <select
                      className="form-control"
                      value={courseCategory}
                      onChange={(e) => setCourseCategory(e.target.value as TrainingCourse['category'])}
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">ชื่อหลักสูตร*</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="เช่น อบรมความปลอดภัยประจำปี"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">วิทยากร*</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="เช่น น.ส.วรรณา สุขเจริญ"
                      value={courseInstructor}
                      onChange={(e) => setCourseInstructor(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">สถานที่*</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="เช่น ห้อง TRAINING CAR"
                      value={courseLocation}
                      onChange={(e) => setCourseLocation(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">วันที่อบรม*</label>
                    <input
                      type="date"
                      className="form-control"
                      value={courseDate}
                      onChange={(e) => setCourseDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ช่วงเวลา</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="เช่น 09.00 - 16.00 น."
                      value={courseTimeRange}
                      onChange={(e) => setCourseTimeRange(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">จำนวนชั่วโมง</label>
                    <input
                      type="number"
                      min={1}
                      className="form-control"
                      value={courseHours}
                      onChange={(e) => setCourseHours(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddCourseModal(false);
                    resetCourseForm();
                  }}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCourseId ? 'บันทึกการแก้ไข' : 'บันทึกหลักสูตร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendees List Modal */}
      {showAttendeesModal && selectedCourse && (
        <div className="modal-overlay" onClick={() => setShowAttendeesModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 820, width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="badge badge-purple" style={{ marginBottom: 4 }}>
                  {selectedCourse.code}
                </span>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                  รายชื่อผู้เข้าอบรม: {selectedCourse.title}
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {selectedCourse.date} ({selectedCourse.timeRange}) · วิทยากร: {selectedCourse.instructor} · สถานที่: {selectedCourse.location}
                </div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowAttendeesModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="badge badge-blue">
                    ผู้เข้าร่วมทั้งหมด {courseAttendances.length} คน
                  </span>
                  <span className="badge badge-green">
                    ผ่าน {courseAttendances.filter((a) => a.isPassed).length} คน
                  </span>
                </div>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    setShowAttendeesModal(false);
                    setLastCheckIn(null);
                    setCheckInEmpId(employees[0]?.id || '');
                    setSignatureDataUrl(null);
                    setSignatureError(false);
                    setSignatureResetKey((k) => k + 1);
                    setShowCheckInModal(true);
                  }}
                >
                  <CheckCircle2 size={15} /> เช็กชื่อเข้าอบรมเพิ่ม
                </button>
              </div>

              {courseAttendances.length === 0 ? (
                <div className="glass-card" style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
                  ยังไม่มีประวัติการเช็กชื่อในหลักสูตรนี้
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>ลำดับ</th>
                        <th>พนักงาน</th>
                        <th>แผนก / ตำแหน่ง</th>
                        <th>เวลาเช็กชื่อ & ลายเซ็น</th>
                        <th>ผลการอบรม</th>
                        <th>จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseAttendances.map((att, idx) => (
                        <tr key={att.id}>
                          <td>{idx + 1}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{att.empCode}</div>
                            <div style={{ fontWeight: 600 }}>{att.employeeName}</div>
                          </td>
                          <td>
                            <span className="badge badge-blue">{att.department}</span>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{att.position}</div>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span>เช้า: {att.checkInMorning || '-'}</span>
                              {att.signedMorning && (
                                <img
                                  src={att.signedMorning}
                                  alt="ลายเซ็นเช้า"
                                  style={{ height: 22, background: '#fff', borderRadius: 4, border: '1px solid var(--border-color)' }}
                                />
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span>บ่าย: {att.checkInAfternoon || '-'}</span>
                              {att.signedAfternoon && (
                                <img
                                  src={att.signedAfternoon}
                                  alt="ลายเซ็นบ่าย"
                                  style={{ height: 22, background: '#fff', borderRadius: 4, border: '1px solid var(--border-color)' }}
                                />
                              )}
                            </div>
                          </td>
                          <td>
                            {att.isPassed ? (
                              <span className="badge badge-green"><CheckCircle2 size={12} /> ผ่านเกณฑ์</span>
                            ) : (
                              <span className="badge badge-red">ไม่ผ่าน</span>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn-icon"
                              title="ลบประวัติเช็กชื่อนี้"
                              onClick={() => handleDeleteAttendanceRow(att)}
                              style={{ color: 'var(--danger)' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAttendeesModal(false)}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
