import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download, X, AlertTriangle } from 'lucide-react';
import type { Employee } from '../types';
import type { EmployeePayload } from '../utils/api';

interface EmployeeExcelImportModalProps {
  existingEmployees: Employee[];
  onImport: (newEmployees: EmployeePayload[]) => void;
  onClose: () => void;
}

interface ParsedEmployeeRow {
  empCode: string;
  name: string;
  email?: string;
  department: string;
  section?: string;
  position: string;
  startingDate: string;
  status: 'PROBATION' | 'PERMANENT';
  role: 'EMPLOYEE' | 'SUPERVISOR' | 'HR' | 'ADMIN';
  isValid: boolean;
  errorReason?: string;
}

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
];

export const EmployeeExcelImportModal: React.FC<EmployeeExcelImportModalProps> = ({
  existingEmployees,
  onImport,
  onClose,
}) => {
  const [parsedRows, setParsedRows] = useState<ParsedEmployeeRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingEmpCodes = new Set(existingEmployees.map((e) => e.empCode.toUpperCase().trim()));

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'รหัสพนักงาน (empCode)': 'EMP-1006',
        'ชื่อ-นามสกุล (name)': 'นาย อนุชา สุขสำราญ',
        'อีเมล (email)': 'anucha.s@example.com',
        'แผนก (department)': 'FMG-A',
        'หน่วยงาน/Section (section)': 'FMG Production Line 1',
        'ตำแหน่ง (position)': 'พนักงานปฏิบัติการ',
        'วันเริ่มงาน (startingDate)': '2026-08-01',
        'สถานะ (status)': 'PROBATION',
        'สิทธิ์การใช้งาน (role)': 'EMPLOYEE',
      },
      {
        'รหัสพนักงาน (empCode)': 'EMP-1007',
        'ชื่อ-นามสกุล (name)': 'นางสาว นภาพร ดวงดี',
        'อีเมล (email)': 'naphaporn.d@example.com',
        'แผนก (department)': 'QA/QC',
        'หน่วยงาน/Section (section)': 'QA Final Inspection',
        'ตำแหน่ง (position)': 'เจ้าหน้าที่ตรวจสอบคุณภาพ',
        'วันเริ่มงาน (startingDate)': '2026-08-15',
        'สถานะ (status)': 'PERMANENT',
        'สิทธิ์การใช้งาน (role)': 'EMPLOYEE',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee_Import_Template');

    // Auto column widths
    worksheet['!cols'] = [
      { wch: 22 },
      { wch: 26 },
      { wch: 28 },
      { wch: 20 },
      { wch: 26 },
      { wch: 26 },
      { wch: 24 },
      { wch: 20 },
      { wch: 22 },
    ];

    XLSX.writeFile(workbook, 'CAR_Employee_Import_Template.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonRows || jsonRows.length === 0) {
          throw new Error('ไม่พบแถวข้อมูลในไฟล์ Excel ที่อัปโหลด');
        }

        const currentBatchCodes = new Set<string>();

        const parsed: ParsedEmployeeRow[] = jsonRows.map((row) => {
          // Normalize column names
          const empCode = String(row['รหัสพนักงาน (empCode)'] || row['รหัสพนักงาน'] || row['empCode'] || row['EmpCode'] || '').trim().toUpperCase();
          const name = String(row['ชื่อ-นามสกุล (name)'] || row['ชื่อ-นามสกุล'] || row['ชื่อ'] || row['name'] || '').trim();
          const email = String(row['อีเมล (email)'] || row['อีเมล'] || row['email'] || '').trim();
          const department = String(row['แผนก (department)'] || row['แผนก'] || row['department'] || 'FMG-A').trim();
          const section = String(row['หน่วยงาน/Section (section)'] || row['หน่วยงาน'] || row['section'] || '').trim();
          const position = String(row['ตำแหน่ง (position)'] || row['ตำแหน่ง'] || row['position'] || 'พนักงานทั่วไป').trim();

          let startingDate = String(row['วันเริ่มงาน (startingDate)'] || row['วันเริ่มงาน'] || row['startingDate'] || '').trim();
          if (!startingDate || !/^\d{4}-\d{2}-\d{2}$/.test(startingDate)) {
            startingDate = new Date().toISOString().slice(0, 10);
          }

          let rawStatus = String(row['สถานะ (status)'] || row['สถานะ'] || row['status'] || 'PROBATION').toUpperCase().trim();
          const status: 'PROBATION' | 'PERMANENT' = rawStatus.includes('PERM') || rawStatus.includes('ประจำ') ? 'PERMANENT' : 'PROBATION';

          let rawRole = String(row['สิทธิ์การใช้งาน (role)'] || row['สิทธิ์'] || row['role'] || 'EMPLOYEE').toUpperCase().trim();
          let role: 'EMPLOYEE' | 'SUPERVISOR' | 'HR' | 'ADMIN' = 'EMPLOYEE';
          if (rawRole.includes('ADMIN')) role = 'ADMIN';
          else if (rawRole.includes('HR')) role = 'HR';
          else if (rawRole.includes('SUPER') || rawRole.includes('หัวหน้า')) role = 'SUPERVISOR';

          let isValid = true;
          let errorReason = '';

          if (!empCode) {
            isValid = false;
            errorReason = 'ไม่มีรหัสพนักงาน';
          } else if (!name) {
            isValid = false;
            errorReason = 'ไม่มีชื่อ-นามสกุล';
          } else if (existingEmpCodes.has(empCode)) {
            isValid = false;
            errorReason = `รหัส ${empCode} มีอยู่ในระบบแล้ว`;
          } else if (currentBatchCodes.has(empCode)) {
            isValid = false;
            errorReason = `รหัส ${empCode} ซ้ำในไฟล์เดียวกัน`;
          }

          if (empCode) currentBatchCodes.add(empCode);

          return {
            empCode,
            name,
            email: email || `${empCode.toLowerCase()}@example.com`,
            department,
            section: section || department,
            position,
            startingDate,
            status,
            role,
            isValid,
            errorReason,
          };
        });

        setParsedRows(parsed);
      } catch (err) {
        console.error('Parse Excel error:', err);
        setParseError(err instanceof Error ? err.message : 'ไม่สามารถอ่านไฟล์ Excel ได้');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  const handleConfirmImport = () => {
    if (validRows.length === 0) return;

    const newEmployeesPayload: EmployeePayload[] = validRows.map((r, idx) => ({
      empCode: r.empCode,
      name: r.name,
      email: r.email,
      department: r.department,
      section: r.section,
      position: r.position,
      startingDate: r.startingDate,
      status: r.status,
      role: r.role,
      avatar: DEFAULT_AVATARS[idx % DEFAULT_AVATARS.length],
    }));

    onImport(newEmployeesPayload);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 860, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileSpreadsheet size={22} className="text-blue" />
            <h3>นำเข้าข้อมูลพนักงานจาก Excel (Bulk Import)</h3>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
          {/* Top Instruction & Template Download */}
          <div
            className="glass-card"
            style={{
              padding: 16,
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              background: 'rgba(59, 130, 246, 0.05)',
              borderColor: 'rgba(59, 130, 246, 0.2)',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                ดาวน์โหลดแบบฟอร์มมาตรฐานสำหรับเตรียมข้อมูล
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                รองรับไฟล์นามสกุล <strong>.xlsx</strong> และ <strong>.csv</strong> พร้อมหัวคอลัมน์มาตรฐาน
              </div>
            </div>
            <button type="button" className="btn btn-secondary" onClick={handleDownloadTemplate} style={{ gap: 6 }}>
              <Download size={16} /> ดาวน์โหลดแม่แบบ Excel
            </button>
          </div>

          {/* Upload Area */}
          <div
            style={{
              border: '2px dashed var(--border-color)',
              borderRadius: 14,
              padding: '30px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.02)',
              transition: 'border-color 0.2s',
              marginBottom: 20,
            }}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls, .csv"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <Upload size={36} className="text-blue" style={{ margin: '0 auto 10px auto', opacity: 0.85 }} />
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
              {fileName ? `ไฟล์ที่เลือก: ${fileName}` : 'คลิกเพื่อเลือกไฟล์ Excel หรือลากไฟล์มาวางที่นี่'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {isProcessing ? 'กำลังอ่านและตรวจสอบข้อมูล...' : 'ระบบจะตรวจสอบความถูกต้องและรหัสซ้ำให้อัตโนมัติ'}
            </div>
          </div>

          {parseError && (
            <div className="glass-card" style={{ padding: 12, marginBottom: 16, color: 'var(--danger)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <AlertCircle size={18} /> {parseError}
            </div>
          )}

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  พรีวิวรายการที่จะนำเข้า ({parsedRows.length} รายการ)
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: '0.82rem' }}>
                  <span className="badge badge-green">พร้อมนำเข้า: {validRows.length}</span>
                  {invalidRows.length > 0 && (
                    <span className="badge badge-red">มีข้อผิดพลาด: {invalidRows.length}</span>
                  )}
                </div>
              </div>

              <div className="table-responsive" style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 10 }}>
                <table className="custom-table" style={{ fontSize: '0.84rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>สถานะ</th>
                      <th>รหัส</th>
                      <th>ชื่อ-นามสกุล</th>
                      <th>แผนก</th>
                      <th>ตำแหน่ง</th>
                      <th>วันเริ่มงาน</th>
                      <th>สถานะ</th>
                      <th>หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((r, i) => (
                      <tr key={i} style={{ opacity: r.isValid ? 1 : 0.65 }}>
                        <td style={{ textAlign: 'center' }}>
                          {r.isValid ? (
                            <CheckCircle2 size={16} className="text-green" />
                          ) : (
                            <AlertTriangle size={16} className="text-red" />
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>{r.empCode || '-'}</td>
                        <td>{r.name || '-'}</td>
                        <td>{r.department}</td>
                        <td>{r.position}</td>
                        <td>{r.startingDate}</td>
                        <td>
                          <span className={`badge ${r.status === 'PERMANENT' ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: '0.72rem' }}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ color: r.isValid ? 'var(--success)' : 'var(--danger)', fontSize: '0.78rem' }}>
                          {r.isValid ? 'สมบูรณ์' : r.errorReason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {validRows.length > 0 ? `พร้อมนำเข้าพนักงานใหม่ทั้งหมด ${validRows.length} คน` : ''}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              ยกเลิก
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={validRows.length === 0}
              onClick={handleConfirmImport}
            >
              <CheckCircle2 size={16} /> ยืนยันนำเข้าข้อมูล ({validRows.length} คน)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
