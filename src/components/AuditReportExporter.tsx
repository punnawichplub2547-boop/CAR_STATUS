import React, { useState } from 'react';
import { Download, Printer, FileSpreadsheet } from 'lucide-react';
import type { Employee, SkillEvaluation, OjtRecord, Certificate, TrainingCourse } from '../types';

interface AuditReportExporterProps {
  employees: Employee[];
  skillEvaluations: SkillEvaluation[];
  ojtRecords: OjtRecord[];
  certificates: Certificate[];
  courses: TrainingCourse[];
}

export const AuditReportExporter: React.FC<AuditReportExporterProps> = ({
  employees,
  skillEvaluations,
  ojtRecords,
  certificates,
}) => {
  const [reportType, setReportType] = useState<'individual' | 'department_matrix' | 'certs_compliance'>('individual');
  const [selectedEmpId, setSelectedEmpId] = useState(employees[2]?.id || employees[0]?.id);

  const selectedEmp = employees.find((e) => e.id === selectedEmpId);
  const empOjt = ojtRecords.filter((o) => o.employeeId === selectedEmpId);
  const empSkills = skillEvaluations.filter((s) => s.employeeId === selectedEmpId);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "รหัสพนักงาน,ชื่อ-นามสกุล,แผนก,ตำแหน่ง,ทักษะมาตรฐาน,ระดับเป้าหมาย (%),ระดับประเมินจริง (%),สถานะ ISO/IATF\n";

    employees.forEach((emp) => {
      const empSkills = skillEvaluations.filter((s) => s.employeeId === emp.id);
      if (empSkills.length === 0) {
        csvContent += `"${emp.empCode}","${emp.name}","${emp.department}","${emp.position}","ไม่มีข้อมูล",0,0,"รอดำเนินการ"\n`;
      } else {
        empSkills.forEach((sk) => {
          const status = sk.resultLevel >= sk.targetLevel ? "ผ่านเกณฑ์มาตรฐาน (Passed)" : "ต้องพัฒนาทักษะ (Gap)";
          csvContent += `"${emp.empCode}","${emp.name}","${emp.department}","${emp.position}","${sk.skillName}",${sk.targetLevel},${sk.resultLevel},"${status}"\n`;
        });
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ISO_IATF_16949_Skill_Matrix_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            onClick={handleExportCSV}
            title="ดาวน์โหลดรายงานสรุปทักษะพนักงานเป็นไฟล์ CSV สำหรับ Excel"
          >
            <Download size={18} /> Export Excel (CSV)
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
          <div className="glass-card" style={{ padding: 32, background: '#ffffff', color: '#0f172a', borderRadius: 16 }} id="printable-area">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, background: '#1d4ed8', color: '#fff', fontWeight: 900, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  CAR
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', color: '#0f172a' }}>บริษัท คอมพลีท โอโต รับเบอร์ แมนูแฟ็คเจอริ่ง จำกัด</h2>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, background: '#f8fafc', padding: 16, borderRadius: 10, marginBottom: 24, border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
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
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: '0.85rem' }}>
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
                  empOjt.map((o) => (
                    <tr key={o.id}>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8 }}>{o.courseName}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8 }}>{o.instructor}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8 }}>{o.evalDate}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8, fontWeight: 700 }}>{o.instructorScorePercent}%</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: 8, color: o.isPassed ? '#166534' : '#991b1b', fontWeight: 700 }}>
                        {o.isPassed ? 'PASSED (ผ่านเกณฑ์)' : 'FAILED'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Section 2: Skill Evaluations */}
            <h3 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: 10, borderBottom: '1px solid #cbd5e1', paddingBottom: 4 }}>
              2. ผลประเมินทักษะความสามารถ (Skill Matrix Evaluation - F-HR-014)
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>หัวข้อทักษะ</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>หมวดหมู่</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>Target Standard</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>Result (%)</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: 8 }}>รอบการประเมิน</th>
                </tr>
              </thead>
              <tbody>
                {empSkills.map((s) => (
                  <tr key={s.id}>
                    <td style={{ border: '1px solid #cbd5e1', padding: 8, fontWeight: 600 }}>{s.skillName}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: 8 }}>{s.category}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: 8 }}>{s.targetLevel}%</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: 8, fontWeight: 700, color: '#1e40af' }}>{s.resultLevel}%</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: 8 }}>{s.cycle}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Approval Signatures Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 40, paddingTop: 20, borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.8rem' }}>
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
    </div>
  );
};
