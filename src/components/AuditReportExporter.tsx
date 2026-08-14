import React, { useState } from 'react';
import { Printer, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Employee, SkillEvaluation, OjtSession, OjtContentItem, OjtParticipant, Certificate, TrainingCourse } from '../types';
import { computeCertificateStatus } from '../utils/certificateStatus';
import { downloadExcelWorkbook, formatSkillLevelWithIcon } from '../utils/excelTemplateExporter';

interface AuditReportExporterProps {
  employees: Employee[];
  skillEvaluations: SkillEvaluation[];
  ojtSessions: OjtSession[];
  ojtContentItems: OjtContentItem[];
  ojtParticipants: OjtParticipant[];
  certificates: Certificate[];
  courses: TrainingCourse[];
}

export const AuditReportExporter: React.FC<AuditReportExporterProps> = ({
  employees,
  skillEvaluations,
  ojtSessions,
  ojtContentItems,
  ojtParticipants,
  certificates,
}) => {
  const [reportType, setReportType] = useState<'individual' | 'department_matrix' | 'certs_compliance'>('individual');
  const [selectedEmpId, setSelectedEmpId] = useState(employees[2]?.id || employees[0]?.id);

  const selectedEmp = employees.find((e) => e.id === selectedEmpId);
  const empOjt = ojtParticipants
    .filter((p) => p.employeeId === selectedEmpId)
    .map((participant) => ({ participant, session: ojtSessions.find((s) => s.id === participant.sessionId) }))
    .filter((row): row is { participant: OjtParticipant; session: OjtSession } => !!row.session)
    .map((row) => {
      const lines = ojtContentItems.filter((c) => c.sessionId === row.session.id);
      const dates = lines.map((c) => c.trainingDate).filter((d): d is string => !!d).sort();
      return {
        ...row,
        courseLabel: lines.length > 0 ? lines.map((l) => l.description).join(', ') : '-',
        trainingDate: dates.length > 0 ? dates[dates.length - 1] : '-',
      };
    });

  // Dedupe to the latest attempt per employee+skill+cycle — a skill that was
  // re-evaluated (failed attempt 1, passed attempt 2) must show only once,
  // otherwise the audit card shows two seemingly-conflicting rows for the
  // same skill.
  const latestEvals = (() => {
    const map = new Map<string, SkillEvaluation>();
    skillEvaluations.forEach((s) => {
      const key = `${s.employeeId}|${s.skillName}|${s.cycle}`;
      const existing = map.get(key);
      if (!existing || s.attemptNumber > existing.attemptNumber) map.set(key, s);
    });
    return [...map.values()];
  })();

  const empSkills = latestEvals.filter((s) => s.employeeId === selectedEmpId);

  const departmentGroups = latestEvals.reduce<Record<string, SkillEvaluation[]>>((acc, s) => {
    (acc[s.department] ||= []).push(s);
    return acc;
  }, {});

  const buildSkillRows = (evals: SkillEvaluation[]) => {
    const bySkill = evals.reduce<Record<string, SkillEvaluation[]>>((acc, s) => {
      (acc[s.skillName] ||= []).push(s);
      return acc;
    }, {});
    return Object.entries(bySkill).map(([skillName, rows]) => {
      const total = rows.length;
      const passed = rows.filter((r) => r.resultLevel >= r.targetLevel).length;
      const avgTarget = Math.round(rows.reduce((sum, r) => sum + r.targetLevel, 0) / total);
      const avgResult = Math.round(rows.reduce((sum, r) => sum + r.resultLevel, 0) / total);
      return { skillName, total, passed, gap: total - passed, avgTarget, avgResult, passRate: Math.round((passed / total) * 100) };
    });
  };

  // --- Tab 3: Certificate compliance readiness ---
  const certRows = certificates
    .map((c) => ({ ...c, liveStatus: computeCertificateStatus(c.expiryDate) }))
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  const certActive = certRows.filter((c) => c.liveStatus === 'ACTIVE').length;
  const certExpiringSoon = certRows.filter((c) => c.liveStatus === 'EXPIRING_SOON').length;
  const certExpired = certRows.filter((c) => c.liveStatus === 'EXPIRED').length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const fileName = `ISO_IATF_16949_Skill_Matrix_Audit_${new Date().toISOString().split('T')[0]}.xlsx`;

    const data: any[][] = [];
    data.push(["รหัสพนักงาน", "ชื่อ-นามสกุล", "แผนก", "ตำแหน่ง", "ทักษะมาตรฐาน", "ระดับเป้าหมาย (%)", "ระดับประเมินจริง (%)", "สถานะ ISO/IATF"]);

    employees.forEach((emp) => {
      const empSkills = skillEvaluations.filter((s) => s.employeeId === emp.id);
      if (empSkills.length === 0) {
        data.push([emp.empCode, emp.name, emp.department, emp.position, "ไม่มีข้อมูล", "0%", "0%", "รอดำเนินการ"]);
      } else {
        empSkills.forEach((sk) => {
          const status = sk.resultLevel >= sk.targetLevel ? "ผ่านเกณฑ์มาตรฐาน (Passed)" : "ต้องพัฒนาทักษะ (Gap)";
          data.push([emp.empCode, emp.name, emp.department, emp.position, sk.skillName, formatSkillLevelWithIcon(sk.targetLevel), formatSkillLevelWithIcon(sk.resultLevel), status]);
        });
      }
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Skill Matrix");

    downloadExcelWorkbook(workbook, fileName);
  };

  return (
    <div className="audit-report-page content-container">
      <div className="page-header">
        <div>
          <div className="eyebrow-tag">
            <FileSpreadsheet size={14} /> ISO/IATF 16949 REPORT • รวบรวมและส่งออกรายงาน AUDIT
          </div>
          <h1 className="page-title gradient-text">รายงานรองรับการตรวจประเมิน ISO / IATF 16949</h1>
          <p className="page-subtitle">
            1-Click Export เอกสารประวัติการฝึกอบรม Skill Matrix และ Certificate สำหรับ Audit (บริษัท CAR)
          </p>
        </div>

        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={18} /> พิมพ์รายงาน (Print)
          </button>
          <button
            className="btn btn-success"
            onClick={handleExportExcel}
            title="ดาวน์โหลดรายงานสรุปทักษะพนักงานเป็นไฟล์ Excel (.xlsx)"
          >
            <FileSpreadsheet size={18} /> Export Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
        <button
          className={`btn btn-sm ${reportType === 'individual' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setReportType('individual')}
        >
          1. บัตรประวัติการฝึกอบรมรายบุคคล (Individual Card)
        </button>
        <button
          className={`btn btn-sm ${reportType === 'department_matrix' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setReportType('department_matrix')}
        >
          2. รายงาน Skill Matrix สรุปรายแผนก (F-HR-014)
        </button>
        <button
          className={`btn btn-sm ${reportType === 'certs_compliance' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setReportType('certs_compliance')}
        >
          3. รายงานความพร้อม Certificate Compliance ({certificates.length} ใบ)
        </button>
      </div>

      {reportType === 'individual' && selectedEmp && (
        <>
          <div className="glass-card" style={{ padding: 16, marginBottom: 20 }}>
            <div className="form-group" style={{ margin: 0, maxWidth: 400 }}>
              <label className="form-label">เลือกพนักงานสำหรับพิมพ์บัตรประวัติการอบรม</label>
              <select className="form-control" value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)}>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.empCode} - {e.name} ({e.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Individual Training Record Sheet Preview */}
          <div className="glass-card" style={{ padding: '24px 32px', background: '#ffffff', color: '#0f172a', borderRadius: 16, maxWidth: '100%', boxSizing: 'border-box' }} id="printable-area">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: 16, marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', flexShrink: 0 }}>
                  <img src="/CARLOGO.png" alt="CAR Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', color: '#0f172a', margin: 0 }}>บริษัท คอมพลีท โอโต รับเบอร์ แมนูแฟ็คเจอริ่ง จำกัด</h2>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>COMPLETE AUTO RUBBER MANUFACTURING CO., LTD.</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e40af', marginTop: 4 }}>
                    INDIVIDUAL TRAINING & COMPETENCY RECORD CARD
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
                <div>Document No: CAR-HR-REC-08</div>
                <div>ISO 9001 / IATF 16949 Compliant</div>
              </div>
            </div>

            {/* Employee Profile Metadata Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, background: '#f8fafc', padding: 16, borderRadius: 10, marginBottom: 24, border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
              <div><strong>รหัสพนักงาน:</strong> {selectedEmp.empCode}</div>
              <div><strong>ชื่อ-นามสกุล:</strong> {selectedEmp.name}</div>
              <div><strong>แผนก/ฝ่าย:</strong> {selectedEmp.department}</div>
              <div><strong>ตำแหน่ง:</strong> {selectedEmp.position}</div>
              <div><strong>วันเริ่มงาน:</strong> {selectedEmp.startingDate}</div>
              <div><strong>สถานะ:</strong> {selectedEmp.status}</div>
            </div>

            {/* Section 1: OJT Records */}
            <h3 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: 10, borderBottom: '1px solid #cbd5e1', paddingBottom: 4 }}>
              1. ประวัติการฝึกอบรมเฉพาะงาน (OJT Records - F-HR-004)
            </h3>
            <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', marginBottom: 24, fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>หลักสูตรการอบรม</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>ผู้สอน/วิทยากร</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>วันที่อบรม</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>ผลประเมิน (%)</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {empOjt.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ border: '1px solid #cbd5e1', padding: 12, textAlign: 'center', color: '#64748b' }}>
                        ยังไม่มีประวัติ OJT บันทึก
                      </td>
                    </tr>
                  ) : (
                    empOjt.map(({ participant, session, courseLabel, trainingDate }) => (
                      <tr key={participant.id}>
                        <td style={{ border: '1px solid #cbd5e1', padding: 8 }}>{courseLabel}</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: 8 }}>{session.assessorName}</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: 8 }}>{trainingDate}</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: 8, fontWeight: 700 }}>{participant.instructorScorePercent}%</td>
                        <td style={{ border: '1px solid #cbd5e1', padding: 8, color: participant.isPassed ? '#166534' : '#991b1b', fontWeight: 700 }}>
                          {participant.isPassed ? 'PASSED (ผ่านเกณฑ์)' : 'FAILED'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Section 2: Skill Evaluations */}
            <h3 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: 10, borderBottom: '1px solid #cbd5e1', paddingBottom: 4 }}>
              2. ผลประเมินทักษะความสามารถ (Skill Matrix Evaluation - F-HR-014)
            </h3>
            <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', marginBottom: 24, fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>หัวข้อทักษะ</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>หมวดหมู่</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>Target Standard</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>Result (%)</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>รอบการประเมิน</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>ครั้งที่ประเมิน</th>
                  </tr>
                </thead>
                <tbody>
                  {empSkills.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ border: '1px solid #cbd5e1', padding: 12, textAlign: 'center', color: '#64748b' }}>
                        ยังไม่มีผลประเมินทักษะบันทึก
                      </td>
                    </tr>
                  ) : (
                  empSkills.map((s) => (
                    <tr key={s.id}>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8, fontWeight: 600 }}>{s.skillName}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8 }}>{s.category}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8 }}>{s.targetLevel}%</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8, fontWeight: 700, color: '#1e40af' }}>{s.resultLevel}%</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8 }}>{s.cycle}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8, textAlign: 'center' }}>
                        {s.attemptNumber === 2 ? 'ครั้งที่ 2 (ประเมินซ้ำ)' : 'ครั้งที่ 1'}
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Approval Signatures Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginTop: 40, paddingTop: 20, borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.8rem' }}>
              <div>
                <div style={{ height: 40 }}></div>
                <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: 4 }}>ลงชื่อผู้จัดทำเอกสาร (HR Officer)</div>
                <div style={{ color: '#64748b' }}>(นางสาว สมหญิง ใจดี)</div>
              </div>
              <div>
                <div style={{ height: 40 }}></div>
                <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: 4 }}>ลงชื่อผู้ตรวจสอบ (Supervisor)</div>
                <div style={{ color: '#64748b' }}>(นาย มานพ ตั้งมั่น)</div>
              </div>
              <div>
                <div style={{ height: 40 }}></div>
                <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: 4 }}>ลงชื่อผู้อนุมัติ (Department Manager)</div>
                <div style={{ color: '#64748b' }}>(น.ส. วรรณา สุขเจริญ)</div>
              </div>
            </div>
          </div>
        </>
      )}

      {reportType === 'department_matrix' && (
        <div className="glass-card" style={{ padding: '24px 32px', background: '#ffffff', color: '#0f172a', borderRadius: 16, maxWidth: '100%', boxSizing: 'border-box' }} id="printable-area">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: 16, marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', flexShrink: 0 }}>
                <img src="/CARLOGO.png" alt="CAR Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', color: '#0f172a', margin: 0 }}>บริษัท คอมพลีท โอโต รับเบอร์ แมนูแฟ็คเจอริ่ง จำกัด</h2>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>COMPLETE AUTO RUBBER MANUFACTURING CO., LTD.</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e40af', marginTop: 4 }}>
                  SKILL MATRIX DEPARTMENT SUMMARY REPORT (F-HR-014)
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
              <div>Document No: CAR-HR-REC-14</div>
              <div>ISO 9001 / IATF 16949 Compliant</div>
            </div>
          </div>

          {Object.keys(departmentGroups).length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>ยังไม่มีข้อมูลการประเมินทักษะ</div>
          ) : (
            Object.entries(departmentGroups).map(([dept, evals]) => {
              const rows = buildSkillRows(evals);
              return (
                <div key={dept} style={{ marginBottom: 28 }}>
                  <h3 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: 10, borderBottom: '1px solid #cbd5e1', paddingBottom: 4 }}>
                    แผนก {dept}
                  </h3>
                  <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', minWidth: 650, borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9' }}>
                          <th style={{ border: '1px solid #cbd5e1', padding: 8, textAlign: 'left' }}>หัวข้อทักษะ</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>จำนวนคนที่ประเมิน</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>เป้าหมายเฉลี่ย</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>ผลจริงเฉลี่ย</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>ผ่านเกณฑ์</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>ต่ำกว่าเกณฑ์ (Gap)</th>
                          <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>% ผ่านเกณฑ์</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.skillName}>
                            <td style={{ border: '1px solid #cbd5e1', padding: 8, fontWeight: 600 }}>{r.skillName}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: 8, textAlign: 'center' }}>{r.total}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: 8, textAlign: 'center' }}>{r.avgTarget}%</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: 8, textAlign: 'center', fontWeight: 700, color: '#1e40af' }}>{r.avgResult}%</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: 8, textAlign: 'center', color: '#166534', fontWeight: 700 }}>{r.passed}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: 8, textAlign: 'center', color: r.gap > 0 ? '#991b1b' : '#64748b', fontWeight: 700 }}>{r.gap}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: 8, textAlign: 'center', fontWeight: 700 }}>{r.passRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {reportType === 'certs_compliance' && (
        <div className="glass-card" style={{ padding: '24px 32px', background: '#ffffff', color: '#0f172a', borderRadius: 16, maxWidth: '100%', boxSizing: 'border-box' }} id="printable-area">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: 16, marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', flexShrink: 0 }}>
                <img src="/CARLOGO.png" alt="CAR Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', color: '#0f172a', margin: 0 }}>บริษัท คอมพลีท โอโต รับเบอร์ แมนูแฟ็คเจอริ่ง จำกัด</h2>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>COMPLETE AUTO RUBBER MANUFACTURING CO., LTD.</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e40af', marginTop: 4 }}>
                  CERTIFICATE COMPLIANCE READINESS REPORT
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
              <div>Document No: CAR-HR-REC-15</div>
              <div>ISO 9001 / IATF 16949 Compliant</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{certRows.length}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>ใบรับรองทั้งหมด</div>
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#166534' }}>{certActive}</div>
              <div style={{ fontSize: '0.8rem', color: '#166534' }}>ใช้งานได้ปกติ</div>
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#92400e' }}>{certExpiringSoon}</div>
              <div style={{ fontSize: '0.8rem', color: '#92400e' }}>ใกล้หมดอายุ (30 วัน)</div>
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#991b1b' }}>{certExpired}</div>
              <div style={{ fontSize: '0.8rem', color: '#991b1b' }}>หมดอายุแล้ว</div>
            </div>
          </div>

          <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: 650, borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ border: '1px solid #cbd5e1', padding: 8, textAlign: 'left', minWidth: 160 }}>ชื่อใบรับรอง</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: 8, textAlign: 'left', minWidth: 150 }}>พนักงาน</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: 8, minWidth: 80 }}>แผนก</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: 8, minWidth: 130 }}>สถาบันออกใบรับรอง</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: 8, minWidth: 100 }}>วันหมดอายุ</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: 8, minWidth: 100 }}>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {certRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ border: '1px solid #cbd5e1', padding: 12, textAlign: 'center', color: '#64748b' }}>
                      ยังไม่มีใบรับรองบันทึกไว้
                    </td>
                  </tr>
                ) : (
                  certRows.map((c) => (
                    <tr key={c.id}>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8, fontWeight: 600, wordBreak: 'break-word' }}>{c.certName}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8, wordBreak: 'break-word' }}>{c.employeeName} ({c.empCode})</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8, textAlign: 'center' }}>{c.department}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8, wordBreak: 'break-word' }}>{c.issuingOrg}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8, textAlign: 'center' }}>{c.expiryDate}</td>
                      <td
                        style={{
                          border: '1px solid #cbd5e1',
                          padding: 8,
                          textAlign: 'center',
                          fontWeight: 700,
                          color: c.liveStatus === 'ACTIVE' ? '#166534' : c.liveStatus === 'EXPIRING_SOON' ? '#92400e' : '#991b1b',
                        }}
                      >
                        {c.liveStatus === 'ACTIVE' ? 'ใช้งานได้ปกติ' : c.liveStatus === 'EXPIRING_SOON' ? 'ใกล้หมดอายุ' : 'หมดอายุแล้ว'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
