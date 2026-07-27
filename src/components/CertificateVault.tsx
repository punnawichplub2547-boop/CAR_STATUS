import React, { useState } from 'react';
import { Award, AlertTriangle, Download, Plus } from 'lucide-react';
import type { Certificate, Employee } from '../types';

interface CertificateVaultProps {
  certificates: Certificate[];
  employees: Employee[];
  onAddCertificate: (cert: Certificate) => void;
}

export const CertificateVault: React.FC<CertificateVaultProps> = ({
  certificates,
  employees,
  onAddCertificate,
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form State
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [certName, setCertName] = useState('');
  const [issuingOrg, setIssuingOrg] = useState('');
  const [issueDate, setIssueDate] = useState('2025-01-01');
  const [expiryDate, setExpiryDate] = useState('2027-01-01');

  const filteredCerts = certificates.filter((c) => {
    if (filterStatus === 'ALL') return true;
    return c.status === filterStatus;
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === selectedEmpId);
    if (!emp || !certName) return;

    const newCert: Certificate = {
      id: `cert-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      empCode: emp.empCode,
      department: emp.department,
      certName,
      issuingOrg: issuingOrg || 'สถาบันฝึกอบรมมาตรฐาน',
      issueDate,
      expiryDate,
      fileUrl: '/certs/sample_cert.pdf',
      status: 'ACTIVE',
    };

    onAddCertificate(newCert);
    setShowUploadModal(false);
    setCertName('');
    alert('อัปโหลดไฟล์ Certificate สำเร็จ!');
  };

  return (
    <div className="certificate-page content-container">
      <div className="page-header">
        <div>
          <div className="eyebrow-tag">
            <Award size={14} /> CERTIFICATE VAULT • คลังใบรับรองและใบอนุญาต
          </div>
          <h1 className="page-title gradient-text">คลังจัดเก็บใบรับรอง (Certificate Vault)</h1>
          <p className="page-subtitle">
            จัดเก็บ Certificate รายบุคคล กำหนดวันหมดอายุ พร้อมระบบแจ้งเตือนอัตโนมัติก่อนเอกสารหมดอายุ
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
            <Plus size={18} /> อัปโหลด Certificate ใหม่
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
        <button
          className={`btn btn-sm ${filterStatus === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterStatus('ALL')}
        >
          ทั้งหมด ({certificates.length})
        </button>
        <button
          className={`btn btn-sm ${filterStatus === 'EXPIRING_SOON' ? 'btn-danger' : 'btn-secondary'}`}
          onClick={() => setFilterStatus('EXPIRING_SOON')}
        >
          <AlertTriangle size={14} /> ใกล้หมดอายุ ({certificates.filter((c) => c.status === 'EXPIRING_SOON').length})
        </button>
        <button
          className={`btn btn-sm ${filterStatus === 'EXPIRED' ? 'btn-danger' : 'btn-secondary'}`}
          style={{ borderColor: 'var(--danger)', color: filterStatus === 'EXPIRED' ? '#ffffff' : 'var(--danger)' }}
          onClick={() => setFilterStatus('EXPIRED')}
        >
          หมดอายุแล้ว ({certificates.filter((c) => c.status === 'EXPIRED').length})
        </button>
      </div>

      {/* Certificates Cards Grid */}
      <div className="grid-cols-3" style={{ gap: 20 }}>
        {filteredCerts.map((cert) => (
          <div key={cert.id} className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <Award size={28} className={cert.status === 'ACTIVE' ? 'text-blue' : 'text-rose'} />
                {cert.status === 'EXPIRING_SOON' ? (
                  <span className="badge badge-red"><AlertTriangle size={12} /> หมดอายุใน 30 วัน</span>
                ) : cert.status === 'EXPIRED' ? (
                  <span className="badge badge-red">หมดอายุแล้ว</span>
                ) : (
                  <span className="badge badge-green">ใช้งานได้ปกติ</span>
                )}
              </div>

              <h3 style={{ fontSize: '1rem', marginBottom: 6, lineHeight: 1.3 }}>{cert.certName}</h3>

              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#60a5fa', marginBottom: 12 }}>
                {cert.employeeName} ({cert.empCode}) • {cert.department}
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>สถาบันออกใบรับรอง: {cert.issuingOrg}</div>
                <div>วันที่ออกเอกสาร: {cert.issueDate}</div>
                <div style={{ color: cert.status !== 'ACTIVE' ? 'var(--danger)' : undefined, fontWeight: 600 }}>
                  วันหมดอายุ: {cert.expiryDate}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => alert(`จำลองดาวน์โหลดไฟล์: ${cert.certName}`)}
              >
                <Download size={14} /> ดาวน์โหลด PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Certificate Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>อัปโหลด Certificate ใหม่</h3>
              <button className="btn-icon" onClick={() => setShowUploadModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">เลือกพนักงานเจ้าของ Certificate</label>
                  <select className="form-control" value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)}>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.empCode} - {e.name} ({e.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">ชื่อหลักสูตร / ชื่อ Certificate*</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="เช่น IATF 16949 Internal Auditor Cert"
                    value={certName}
                    onChange={(e) => setCertName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">สถาบันที่ออกใบรับรอง (Issuing Organization)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="เช่น TÜV SÜD / กรมสวัสดิการแรงงาน"
                    value={issuingOrg}
                    onChange={(e) => setIssuingOrg(e.target.value)}
                  />
                </div>

                <div className="grid-cols-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">วันที่ออกเอกสาร</label>
                    <input
                      type="date"
                      className="form-control"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">วันหมดอายุ (Expiry Date)</label>
                    <input
                      type="date"
                      className="form-control"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  บันทึก Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
