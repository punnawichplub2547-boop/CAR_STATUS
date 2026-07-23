import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle2, User, QrCode, GraduationCap } from 'lucide-react';
import type { TrainingCourse, TrainingAttendance } from '../types';

interface TrainingManagementProps {
  courses: TrainingCourse[];
  attendances: TrainingAttendance[];
  onAddCourse: (course: TrainingCourse) => void;
}

export const TrainingManagement: React.FC<TrainingManagementProps> = ({
  courses,
  attendances,
}) => {
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse>(courses[0]);
  const [showQrModal, setShowQrModal] = useState(false);

  const courseAttendances = attendances.filter((a) => a.courseId === selectedCourse?.id);

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
          <button className="btn btn-primary" onClick={() => setShowQrModal(true)}>
            <QrCode size={18} /> จำลองสแกน QR Code เช็กชื่อ
          </button>
        </div>
      </div>

      {/* Courses List Grid */}
      <div className="grid-cols-3" style={{ marginBottom: 24 }}>
        {courses.map((c) => (
          <div
            key={c.id}
            className={`glass-card glass-card-interactive ${c.id === selectedCourse?.id ? 'active' : ''}`}
            style={{
              padding: 18,
              border: c.id === selectedCourse?.id ? '1px solid var(--primary)' : undefined,
            }}
            onClick={() => setSelectedCourse(c)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span className="badge badge-purple">{c.code}</span>
              <span className={`badge ${c.status === 'COMPLETED' ? 'badge-green' : 'badge-amber'}`}>
                {c.status === 'COMPLETED' ? 'เสร็จสิ้นแล้ว' : 'กำลังจะเกิดขึ้น'}
              </span>
            </div>

            <h3 style={{ fontSize: '0.98rem', marginBottom: 8, lineHeight: 1.3 }}>{c.title}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={14} className="text-blue" /> วิทยากร: {c.instructor}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} className="text-amber" /> วันที่: {c.date} ({c.timeRange})
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} className="text-emerald" /> จำนวน: {c.hours} ชั่วโมง
              </div>
            </div>
          </div>
        ))}
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
                  <th>รหัสพนักงาน</th>
                  <th>ชื่อ - นามสกุล</th>
                  <th>แผนก/ฝ่าย</th>
                  <th>ตำแหน่ง</th>
                  <th>เวลาเช็กชื่อ (เช้า)</th>
                  <th>เวลาเช็กชื่อ (บ่าย)</th>
                  <th>ผลการอบรม</th>
                </tr>
              </thead>
              <tbody>
                {courseAttendances.map((att, idx) => (
                  <tr key={att.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{att.empCode}</td>
                    <td style={{ fontWeight: 600 }}>{att.employeeName}</td>
                    <td><span className="badge badge-blue">{att.department}</span></td>
                    <td>{att.position}</td>
                    <td>{att.checkInMorning || '-'}</td>
                    <td>{att.checkInAfternoon || '-'}</td>
                    <td>
                      {att.isPassed ? (
                        <span className="badge badge-green"><CheckCircle2 size={12} /> ผ่านเกณฑ์การอบรม</span>
                      ) : (
                        <span className="badge badge-red">ไม่ผ่าน</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QR Code Check-in Simulation Modal */}
      {showQrModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 450, textAlign: 'center' }}>
            <div className="modal-header">
              <h3>สแกน QR Code เช็กชื่อเข้าอบรม</h3>
              <button className="btn-icon" onClick={() => setShowQrModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ padding: 16, background: 'white', borderRadius: 16, display: 'inline-block' }}>
                {/* Simulated QR Code graphic */}
                <div style={{ width: 180, height: 180, border: '6px solid #0f172a', borderRadius: 8, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, padding: 8, background: '#fff' }}>
                  <div style={{ background: '#0f172a' }}></div><div style={{ background: '#0f172a' }}></div><div style={{ background: '#0f172a' }}></div><div></div><div style={{ background: '#0f172a' }}></div>
                  <div style={{ background: '#0f172a' }}></div><div></div><div style={{ background: '#0f172a' }}></div><div style={{ background: '#0f172a' }}></div><div></div>
                  <div></div><div style={{ background: '#0f172a' }}></div><div></div><div style={{ background: '#0f172a' }}></div><div style={{ background: '#0f172a' }}></div>
                  <div style={{ background: '#0f172a' }}></div><div style={{ background: '#0f172a' }}></div><div></div><div style={{ background: '#0f172a' }}></div><div></div>
                  <div style={{ background: '#0f172a' }}></div><div></div><div style={{ background: '#0f172a' }}></div><div></div><div style={{ background: '#0f172a' }}></div>
                </div>
              </div>

              <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                ให้พนักงานใช้โทรศัพท์สแกน QR Code เพื่อบันทึกเวลาเข้าเรียนอบรมออนไลน์ระบบ F-HR-002
              </div>

              <button className="btn btn-success" onClick={() => setShowQrModal(false)}>
                <CheckCircle2 size={16} /> จำลองบันทึกเวลาเช็กชื่อสำเร็จ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
