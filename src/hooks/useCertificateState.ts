import { useEffect } from 'react';
import type { Certificate } from '../types';
import {
  fetchBackendCertificates,
  createBackendCertificate,
  updateBackendCertificate,
  deleteBackendCertificate,
} from '../utils/api';
import { INITIAL_CERTIFICATES } from '../data/mockData';
import { computeCertificateStatus } from '../utils/certificateStatus';
import { usePersistentState } from './usePersistentState';

export function useCertificateState() {
  const [certificates, setCertificates] = usePersistentState<Certificate[]>('certificates', INITIAL_CERTIFICATES);

  useEffect(() => {
    fetchBackendCertificates()
      .then((rows) => {
        if (rows.length > 0) {
          setCertificates(
            rows.map((r) => {
              const expiry = r.expiryDate ? r.expiryDate.slice(0, 10) : '';
              return {
                id: String(r.id),
                employeeId: r.employeeId ? String(r.employeeId) : '',
                empCode: r.empCode,
                employeeName: r.employeeName,
                department: r.department,
                certName: r.certName,
                issuingOrg: r.issuer || '',
                issueDate: r.issueDate ? r.issueDate.slice(0, 10) : '',
                expiryDate: expiry,
                fileUrl: r.attachmentUrl || '',
                status: computeCertificateStatus(expiry),
              };
            })
          );
        }
      })
      .catch(() => {});
  }, [setCertificates]);

  const handleAddCertificate = (cert: Certificate) => {
    setCertificates((prev) => [cert, ...prev]);
    createBackendCertificate({
      empCode: cert.empCode,
      employeeName: cert.employeeName,
      department: cert.department,
      certName: cert.certName,
      issuer: cert.issuingOrg,
      issueDate: cert.issueDate,
      expiryDate: cert.expiryDate,
      attachmentUrl: cert.fileUrl,
    })
      .then((row) => {
        const expiry = row.expiryDate ? row.expiryDate.slice(0, 10) : cert.expiryDate;
        const real: Certificate = {
          id: String(row.id),
          employeeId: row.employeeId ? String(row.employeeId) : cert.employeeId,
          empCode: row.empCode,
          employeeName: row.employeeName,
          department: row.department,
          certName: row.certName,
          issuingOrg: row.issuer,
          issueDate: row.issueDate ? row.issueDate.slice(0, 10) : cert.issueDate,
          expiryDate: expiry,
          fileUrl: row.attachmentUrl || '',
          status: computeCertificateStatus(expiry),
        };
        setCertificates((prev) => [real, ...prev.filter((c) => c.id !== cert.id)]);
      })
      .catch(() => {});
  };

  const handleEditCertificate = (cert: Certificate) => {
    setCertificates((prev) => prev.map((c) => (c.id === cert.id ? cert : c)));
    if (!isNaN(Number(cert.id))) {
      updateBackendCertificate(Number(cert.id), {
        empCode: cert.empCode,
        employeeName: cert.employeeName,
        department: cert.department,
        certName: cert.certName,
        issuer: cert.issuingOrg,
        issueDate: cert.issueDate,
        expiryDate: cert.expiryDate,
        attachmentUrl: cert.fileUrl,
      }).catch(() => {});
    }
  };

  const handleDeleteCertificate = (id: string) => {
    setCertificates((prev) => prev.filter((c) => c.id !== id));
    if (!isNaN(Number(id))) {
      deleteBackendCertificate(Number(id)).catch(() => {});
    }
  };

  const expiringCertsCount = certificates.filter((c) => {
    const status = computeCertificateStatus(c.expiryDate);
    return status === 'EXPIRING_SOON' || status === 'EXPIRED';
  }).length;

  return {
    certificates,
    setCertificates,
    handleAddCertificate,
    handleEditCertificate,
    handleDeleteCertificate,
    expiringCertsCount,
  };
}
