import React, { useState } from 'react';
import { Award, AlertTriangle, Download, Plus, Pencil, Trash2, X, Paperclip, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Certificate, Employee } from '../types';
import { computeCertificateStatus } from '../utils/certificateStatus';

interface CertificateVaultProps {
  certificates: Certificate[];
  employees: Employee[];
  onAddCertificate: (cert: Certificate) => void;
  onEditCertificate: (cert: Certificate) => void;
  onDeleteCertificate: (certId: string) => void;
}

export const CertificateVault: React.FC<CertificateVaultProps> = ({
  certificates,
  employees,
  onAddCertificate,
  onEditCertificate,
  onDeleteCertificate,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateError, setDateError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6;

  // Form State
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [certName, setCertName] = useState('');
  const [issuingOrg, setIssuingOrg] = useState('');
  const [issueDate, setIssueDate] = useState('2025-01-01');
  const [expiryDate, setExpiryDate] = useState('2027-01-01');
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [existingFileUrl, setExistingFileUrl] = useState('');

  const filteredCerts = certificates
    .filter((c) => {
      if (filterStatus === 'ALL') return true;
      return computeCertificateStatus(c.expiryDate) === filterStatus;
    })
    .filter((c) => {
      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;
      return (
        c.employeeName.toLowerCase().includes(term) ||
        c.empCode.toLowerCase().includes(term) ||
        c.department.toLowerCase().includes(term) ||
        c.certName.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

  const totalPages = Math.max(1, Math.ceil(filteredCerts.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCerts = filteredCerts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const goToFilter = (status: string) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCertId(null);
  };

  const openAddModal = () => {
    setEditingCertId(null);
    setSelectedEmpId(employees[0]?.id || '');
    setCertName('');
    setIssuingOrg('');
    setIssueDate('2025-01-01');
    setExpiryDate('2027-01-01');
    setFileDataUrl(null);
    setFileName('');
    setExistingFileUrl('');
    setDateError('');
    setShowModal(true);
  };

  const openEditModal = (cert: Certificate) => {
    setEditingCertId(cert.id);
    setSelectedEmpId(cert.employeeId);
    setCertName(cert.certName);
    setIssuingOrg(cert.issuingOrg);
    setIssueDate(cert.issueDate);
    setExpiryDate(cert.expiryDate);
    setFileDataUrl(null);
    setFileName('');
    setExistingFileUrl(cert.fileUrl);
    setDateError('');
    setShowModal(true);
  };

  const handleDelete = (cert: Certificate) => {
    if (window.confirm(`ต้องการลบใบรับรอง "${cert.certName}" ของ ${cert.employeeName} ใช่หรือไม่?`)) {
      onDeleteCertificate(cert.id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('ไฟล์ใหญ่เกินไป (จำกัดไม่เกิน 5MB)');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileDataUrl(reader.result);
        setFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = (cert: Certificate) => {
    if (cert.fileUrl.startsWith('data:')) {
      const mimeMatch = cert.fileUrl.match(/^data:([^;]+);/);
      const ext = mimeMatch?.[1] === 'application/pdf' ? 'pdf' : mimeMatch?.[1]?.split('/')[1] || 'file';
      const a = document.createElement('a');
      a.href = cert.fileUrl;
      a.download = `${cert.certName}.${ext}`;
      a.click();
    } else {
      alert(`ใบรับรองนี้ยังไม่มีไฟล์แนบจริง (ข้อมูลตัวอย่าง): ${cert.certName}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === selectedEmpId);
    if (!emp || !certName) return;

    if (expiryDate <= issueDate) {
      setDateError('วันหมดอายุต้องอยู่หลังวันที่ออกเอกสาร');
      return;
    }
    setDateError('');

    const fileUrl = fileDataUrl || existingFileUrl || '/certs/sample_cert.pdf';

    if (editingCertId) {
      onEditCertificate({
        id: editingCertId,
        employeeId: emp.id,
        employeeName: emp.name,
        empCode: emp.empCode,
        department: emp.department,
        certName,
        issuingOrg: issuingOrg || 'สถาบันฝึกอบรมมาตรฐาน',
        issueDate,
        expiryDate,
        fileUrl,
        status: computeCertificateStatus(expiryDate),
      });
    } else {
      onAddCertificate({
        id: `cert-${Date.now()}`,
        employeeId: emp.id,
        employeeName: emp.name,
        empCode: emp.empCode,
        department: emp.department,
        certName,
        issuingOrg: issuingOrg || 'สถาบันฝึกอบรมมาตรฐาน',
        issueDate,
        expiryDate,
        fileUrl,
        status: computeCertificateStatus(expiryDate),
      });
    }

    closeModal();
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
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> อัปโหลด Certificate ใหม่
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: 36 }}
            placeholder="ค้นหาชื่อพนักงาน, รหัส, แผนก หรือชื่อใบรับรอง..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <button
          className={`btn btn-sm ${filterStatus === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => goToFilter('ALL')}
        >
          ทั้งหมด ({certificates.length})
        </button>
        <button
          className={`btn btn-sm ${filterStatus === 'EXPIRING_SOON' ? 'btn-danger' : 'btn-secondary'}`}
          onClick={() => goToFilter('EXPIRING_SOON')}
        >
          <AlertTriangle size={14} /> ใกล้หมดอายุ ({certificates.filter((c) => computeCertificateStatus(c.expiryDate) === 'EXPIRING_SOON').length})
        </button>
        <button
          className={`btn btn-sm ${filterStatus === 'EXPIRED' ? 'btn-danger' : 'btn-secondary'}`}
          style={{ borderColor: 'var(--danger)', color: filterStatus === 'EXPIRED' ? '#ffffff' : 'var(--danger)' }}
          onClick={() => goToFilter('EXPIRED')}
        >
          หมดอายุแล้ว ({certificates.filter((c) => computeCertificateStatus(c.expiryDate) === 'EXPIRED').length})
        </button>
      </div>

      {/* Certificates Cards Grid */}
      <div className="grid-cols-3" style={{ gap: 20 }}>
        {paginatedCerts.map((cert) => {
          const status = computeCertificateStatus(cert.expiryDate);
          return (
            <div key={cert.id} className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <Award size={28} className={status === 'ACTIVE' ? 'text-blue' : 'text-rose'} />
                  {status === 'EXPIRING_SOON' ? (
                    <span className="badge badge-red"><AlertTriangle size={12} /> หมดอายุใน 30 วัน</span>
                  ) : status === 'EXPIRED' ? (
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
                  <div style={{ color: status !== 'ACTIVE' ? 'var(--danger)' : undefined, fontWeight: 600 }}>
                    วันหมดอายุ: {cert.expiryDate}
                  </div>
                  {cert.fileUrl.startsWith('data:') && (
                    <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Paperclip size={12} /> มีไฟล์แนบจริง
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => openEditModal(cert)}>
                  <Pencil size={14} /> แก้ไข
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => handleDelete(cert)} style={{ color: 'var(--danger)' }}>
                  <Trash2 size={14} /> ลบ
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => handleDownload(cert)}>
                  <Download size={14} /> ดาวน์โหลด
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCerts.length === 0 && (
        <div className="glass-card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
          ไม่พบใบรับรองที่ตรงกับเงื่อนไข
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 24 }}>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
          >
            <ChevronLeft size={16} /> ก่อนหน้า
          </button>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            หน้า {safePage} / {totalPages}
          </span>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
          >
            ถัดไป <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Add / Edit Certificate Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCertId ? 'แก้ไข Certificate' : 'อัปโหลด Certificate ใหม่'}</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={closeModal}
                style={{ padding: 6, borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
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

                <div className="form-group">
                  <label className="form-label">แนบไฟล์ใบรับรอง (PDF หรือรูปภาพ)</label>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    className="form-control"
                    onChange={handleFileChange}
                  />
                  {fileName ? (
                    <div style={{ fontSize: '0.78rem', color: 'var(--success)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Paperclip size={12} /> แนบไฟล์แล้ว: {fileName}
                    </div>
                  ) : existingFileUrl.startsWith('data:') ? (
                    <div style={{ fontSize: '0.78rem', color: 'var(--success)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Paperclip size={12} /> มีไฟล์แนบอยู่แล้ว (เลือกไฟล์ใหม่เพื่อแทนที่)
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 6 }}>
                      ยังไม่มีไฟล์แนบจริง
                    </div>
                  )}
                </div>

                <div className="grid-cols-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">วันที่ออกเอกสาร</label>
                    <input
                      type="date"
                      className="form-control"
                      value={issueDate}
                      onChange={(e) => {
                        setIssueDate(e.target.value);
                        setDateError('');
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">วันหมดอายุ (Expiry Date)</label>
                    <input
                      type="date"
                      className="form-control"
                      value={expiryDate}
                      onChange={(e) => {
                        setExpiryDate(e.target.value);
                        setDateError('');
                      }}
                    />
                  </div>
                </div>
                {dateError && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: 8 }}>{dateError}</div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCertId ? 'บันทึกการแก้ไข' : 'บันทึก Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
