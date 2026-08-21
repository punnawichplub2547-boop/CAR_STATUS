import React, { useMemo } from 'react';
import {
  X,
  Printer,
  Shield,
  Award,
  BookOpen,
  Calendar,
  User,
  Briefcase,
  Layers,
  GraduationCap,
  ClipboardCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from 'recharts';
import type {
  Employee,
  SkillStandard,
  SkillEvaluation,
  Certificate,
  OjtSession,
  OjtParticipant,
  ProbationEvaluation,
} from '../types';

interface SkillPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  standards: SkillStandard[];
  evaluations: SkillEvaluation[];
  certificates: Certificate[];
  ojtSessions?: OjtSession[];
  ojtParticipants?: OjtParticipant[];
  probationEvaluations?: ProbationEvaluation[];
}

export const SkillPassportModal: React.FC<SkillPassportModalProps> = ({
  isOpen,
  onClose,
  employee,
  standards,
  evaluations,
  certificates,
  ojtSessions = [],
  ojtParticipants = [],
  probationEvaluations = [],
}) => {
  // Filter employee-specific data (hooks called unconditionally at top)
  const empStandards = useMemo(() => {
    if (!employee) return [];
    return standards.filter(
      (s) =>
        s.department.toLowerCase() === employee.department.toLowerCase() &&
        (!s.position || s.position.toLowerCase() === employee.position.toLowerCase() || s.position === 'ALL')
    );
  }, [standards, employee]);

  const empEvaluations = useMemo(() => {
    if (!employee) return [];
    return evaluations.filter((e) => e.employeeId === employee.id);
  }, [evaluations, employee]);

  const empCertificates = useMemo(() => {
    if (!employee) return [];
    return certificates.filter((c) => c.empCode === employee.empCode || c.employeeId === employee.id);
  }, [certificates, employee]);

  const empProbation = useMemo(() => {
    if (!employee) return undefined;
    return probationEvaluations.find((p) => p.empCode === employee.empCode);
  }, [probationEvaluations, employee]);

  const empOjtSessions = useMemo(() => {
    if (!employee) return [];
    const sessionIds = ojtParticipants.filter((p) => p.empCode === employee.empCode).map((p) => p.sessionId);
    return ojtSessions.filter((s) => sessionIds.includes(s.id));
  }, [ojtSessions, ojtParticipants, employee]);

  // Tenure calculation
  const tenureText = useMemo(() => {
    if (!employee?.startingDate) return '-';
    const start = new Date(employee.startingDate);
    const now = new Date();
    const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    if (years > 0) return `${years} ปี ${months} เดือน`;
    return `${months} เดือน`;
  }, [employee?.startingDate]);

  // Radar Data calculation
  const radarData = useMemo(() => {
    if (!employee) return [];
    const topicList = empStandards.length > 0 ? empStandards : standards.slice(0, 6);
    return topicList.map((std) => {
      const latestEval = empEvaluations.find((e) => e.skillName === std.skillName);
      return {
        subject: std.skillName.length > 18 ? `${std.skillName.slice(0, 16)}...` : std.skillName,
        Target: std.targetLevel || 3,
        Actual: latestEval?.resultLevel ?? 0,
        fullMark: 4,
      };
    });
  }, [employee, empStandards, standards, empEvaluations]);

  if (!isOpen || !employee) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="passport-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        className="passport-card glass-card"
        style={{
          width: '100%',
          maxWidth: 900,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 20,
          padding: 28,
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          position: 'relative',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Actions Bar (hidden on print) */}
        <div
          className="no-print"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge badge-blue" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
              <Award size={14} /> EMPLOYEE SKILL PASSPORT
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-sm btn-primary"
              style={{ borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Printer size={15} /> พิมพ์บัตรทักษะ (Print PDF)
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                borderRadius: '50%',
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Official Header */}
        <div
          style={{
            borderBottom: '2px solid var(--border-color)',
            paddingBottom: 16,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <img src="/CARLOGO.png" alt="CAR Logo" style={{ height: 48, objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.04em', color: 'var(--text-main)' }}>
              COMPLETE AUTO RUBBER MANUFACTURING CO., LTD.
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-blue)', marginTop: 2 }}>
              EMPLOYEE SKILL & COMPETENCY PASSPORT (บัตรทักษะความสามารถพนักงาน)
            </div>
          </div>
        </div>

        {/* Profile Card Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '130px 1fr 1fr',
            gap: 20,
            padding: 18,
            borderRadius: 14,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)',
            marginBottom: 24,
            alignItems: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <img
              src={employee.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={employee.name}
              style={{
                width: 100,
                height: 100,
                borderRadius: 16,
                objectFit: 'cover',
                border: '3px solid rgba(59, 130, 246, 0.4)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {employee.name}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={14} /> รหัส: <strong style={{ color: 'var(--text-main)' }}>{employee.empCode}</strong>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Briefcase size={14} /> แผนก: <strong style={{ color: 'var(--text-main)' }}>{employee.department}</strong>
              {employee.section && ` (${employee.section})`}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Layers size={14} /> ตำแหน่ง: <strong style={{ color: 'var(--text-main)' }}>{employee.position}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} /> วันเริ่มงาน: <strong style={{ color: 'var(--text-main)' }}>{employee.startingDate || '-'}</strong>
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} /> อายุงาน: <strong style={{ color: 'var(--text-main)' }}>{tenureText}</strong>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              <span className={`badge ${employee.status === 'PERMANENT' ? 'badge-green' : 'badge-amber'}`}>
                สถานะ: {employee.status === 'PERMANENT' ? 'บรรจุพนักงาน' : 'ทดลองงาน'}
              </span>
              <span className={`badge ${employee.orientationPassed ? 'badge-blue' : 'badge-amber'}`}>
                <GraduationCap size={13} /> {employee.orientationPassed ? 'ผ่านปฐมนิเทศแล้ว' : 'รอปฐมนิเทศ'}
              </span>
            </div>
          </div>
        </div>

        {/* Middle Section: Radar Chart & Skills Table */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Radar Chart */}
          <div
            style={{
              padding: 16,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
            }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Award size={16} className="text-blue" /> แผนภาพระดับทักษะ (Skill Radar Chart)
            </h3>
            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.15)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 4]} tick={{ fill: 'var(--text-dim)', fontSize: 10 }} />
                  <Radar name="Target (เป้าหมาย)" dataKey="Target" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
                  <Radar name="Actual (ผลประเมิน)" dataKey="Actual" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.45} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Skill Breakdown Summary */}
          <div
            style={{
              padding: 16,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookOpen size={16} className="text-purple" /> รายละเอียดทักษะ & ผลประเมิน (F-HR-014)
            </h3>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 250 }}>
              <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>หัวข้อทักษะ</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Target</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Actual</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {radarData.map((s, idx) => {
                    const pct = s.Target > 0 ? Math.round((s.Actual / s.Target) * 100) : 100;
                    const isMet = s.Actual >= s.Target;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 500 }}>{s.subject}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', color: '#a78bfa' }}>Lv.{s.Target}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', color: '#60a5fa', fontWeight: 600 }}>Lv.{s.Actual}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <span className={`badge ${isMet ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                            {pct}% {isMet ? '✓' : ''}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom Details: Certificates & OJT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Certificates */}
          <div
            style={{
              padding: 16,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
            }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={16} className="text-amber" /> ใบอนุญาต & ใบรับรอง (Certificates)
            </h3>
            {empCertificates.length === 0 ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '12px 0', textAlign: 'center' }}>
                ไม่มีข้อมูลใบรับรองในระบบ
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {empCertificates.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.certName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ผู้ออก: {c.issuingOrg} • หมดอายุ: {c.expiryDate}
                      </div>
                    </div>
                    <span className={`badge ${c.status === 'ACTIVE' ? 'badge-green' : 'badge-rose'}`} style={{ fontSize: '0.72rem' }}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* OJT & Probation Record */}
          <div
            style={{
              padding: 16,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
            }}
          >
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ClipboardCheck size={16} className="text-emerald" /> ประวัติ OJT & ทดลองงาน (F-HR-009)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>ผลการประเมินทดลองงาน (F-HR-009)</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {empProbation ? (
                    <>
                      คะแนน: <strong>{empProbation.criteriaPercentage}%</strong> • เกรด: <strong>{empProbation.grade}</strong> • สถานะ: <span style={{ color: empProbation.isPassed ? '#10b981' : '#ef4444' }}>{empProbation.isPassed ? 'ผ่านเกณฑ์' : 'ไม่ผ่าน'}</span>
                    </>
                  ) : (
                    'ยังไม่มีบันทึกผลการประเมินทดลองงาน'
                  )}
                </div>
              </div>

              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>ประวัติการฝึกอบรมสอนงาน (OJT Sessions)</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  ผ่านการอบรม OJT ทั้งหมด: <strong>{empOjtSessions.length} หลักสูตร</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Signatures Area for Official Printout */}
        <div
          style={{
            borderTop: '1px dashed var(--border-color)',
            paddingTop: 16,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 20,
            textAlign: 'center',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            <div style={{ height: 40, borderBottom: '1px solid var(--border-color)', marginBottom: 6 }}></div>
            <div>ลงชื่อ พนักงาน (Employee)</div>
            <div style={{ fontSize: '0.75rem' }}>วันที่: ____/____/________</div>
          </div>
          <div>
            <div style={{ height: 40, borderBottom: '1px solid var(--border-color)', marginBottom: 6 }}></div>
            <div>ลงชื่อ ผู้บังคับบัญชา (Supervisor)</div>
            <div style={{ fontSize: '0.75rem' }}>วันที่: ____/____/________</div>
          </div>
          <div>
            <div style={{ height: 40, borderBottom: '1px solid var(--border-color)', marginBottom: 6 }}></div>
            <div>ลงชื่อ ฝ่ายบุคคล (HR Dept Manager)</div>
            <div style={{ fontSize: '0.75rem' }}>วันที่: ____/____/________</div>
          </div>
        </div>
      </div>
    </div>
  );
};
