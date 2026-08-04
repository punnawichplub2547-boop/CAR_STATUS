import React, { useState, useEffect, useRef } from 'react';
import {
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Eye,
  Settings,
  Copy,
  Check,
  Search,
  BookOpen,
  X,
  Sparkles,
  Upload,
} from 'lucide-react';
import type { Employee, GoogleFormExamResult } from '../types';
import {
  DEFAULT_GOOGLE_FORM_URL,
  getSampleGoogleAppsScriptCode,
  loadExamResultsFromLocalStorage,
  parseExcelOrCsvFile,
} from '../services/googleFormSync';

interface ExamEngineProps {
  currentUser: Employee;
  employees: Employee[];
}

export const ExamEngine: React.FC<ExamEngineProps> = ({ currentUser, employees }) => {
  const [googleFormUrl, setGoogleFormUrl] = useState(() => {
    const saved = localStorage.getItem('hrskill_google_form_url');
    if (!saved || saved.includes('EXAMPLE_FORM_ID')) {
      return DEFAULT_GOOGLE_FORM_URL;
    }
    return saved;
  });
  const [appsScriptUrl, setAppsScriptUrl] = useState(() => {
    return localStorage.getItem('hrskill_apps_script_url') || '';
  });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);

  // Dynamic Exam Results Map
  const [examResultsMap, setExamResultsMap] = useState<Record<string, GoogleFormExamResult[]>>(() => {
    return loadExamResultsFromLocalStorage();
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('hrskill_google_form_url', googleFormUrl);
  }, [googleFormUrl]);

  useEffect(() => {
    localStorage.setItem('hrskill_apps_script_url', appsScriptUrl);
  }, [appsScriptUrl]);

  // Selected Employee for Detail Drawer (for Admin/Supervisor or Active User)
  const [viewingResult, setViewingResult] = useState<GoogleFormExamResult | null>(null);

  // Filter for Directory
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Excel/CSV File Upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSyncing(true);
      const updatedResults = await parseExcelOrCsvFile(file);
      setExamResultsMap(updatedResults);
      setImportStatusMessage(`✅ อัปเดตผลสอบจากไฟล์ "${file.name}" เรียบร้อยแล้ว!`);
      setTimeout(() => setImportStatusMessage(null), 5000);
    } catch (err: any) {
      alert(`❌ เกิดข้อผิดพลาดในการอ่านไฟล์: ${err?.message || 'รูปแบบไฟล์ไม่ถูกต้อง'}`);
    } finally {
      setIsSyncing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Sync Logic simulation / Live API fetch
  const handleSyncData = async () => {
    setIsSyncing(true);
    if (appsScriptUrl) {
      try {
        const res = await fetch(`${appsScriptUrl}?empCode=`);
        const json = await res.json();
        if (json.status === 'success' && json.results) {
          const newMap: Record<string, GoogleFormExamResult[]> = { ...examResultsMap };
          json.results.forEach((item: GoogleFormExamResult) => {
            if (!newMap[item.empCode]) newMap[item.empCode] = [];
            const idx = newMap[item.empCode].findIndex((r) => r.attemptNumber === item.attemptNumber);
            if (idx >= 0) newMap[item.empCode][idx] = item;
            else newMap[item.empCode].push(item);
          });
          setExamResultsMap(newMap);
          setImportStatusMessage('✅ ซิงค์ข้อมูลล่าสุดจาก Google Apps Script API สำเร็จ!');
          setTimeout(() => setImportStatusMessage(null), 4000);
        }
      } catch (err) {
        console.error('Apps Script Sync Error:', err);
      }
    }
    setTimeout(() => {
      setIsSyncing(false);
    }, 800);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getSampleGoogleAppsScriptCode());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Helper functions using state
  const getEmployeeExamResults = (empCode: string): GoogleFormExamResult[] => {
    return examResultsMap[empCode] || [];
  };

  const getLatestEmployeeExamResult = (empCode: string): GoogleFormExamResult | null => {
    const list = getEmployeeExamResults(empCode);
    if (!list.length) return null;
    return list[list.length - 1];
  };

  // Active User Results
  const activeUserHistory = getEmployeeExamResults(currentUser.empCode);
  const activeUserLatest = getLatestEmployeeExamResult(currentUser.empCode);

  // Filtered employees for Admin Directory
  const filteredEmployees = employees.filter((e) => {
    const matchesDept = selectedDeptFilter === 'ALL' || e.department === selectedDeptFilter;
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.empCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="exam-page content-container">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="eyebrow-tag">
            <FileCheck2 size={14} /> GOOGLE FORMS INTEGRATION • เกณฑ์ผ่าน ≥ 24/30 ข้อ (80%)
          </div>
          <h1 className="page-title gradient-text">ระบบข้อสอบปฐมนิเทศพนักงานใหม่ (Google Forms)</h1>
          <p className="page-subtitle">
            ทำข้อสอบปฐมนิเทศผ่าน Google Forms จากอินเทอร์เน็ตภายนอก พร้อมซิงค์คะแนนล่าสุดและดูแผ่นเฉลยคำตอบย้อนหลังรายบุคคล
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a
            href={googleFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ borderRadius: 14, padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
          >
            <ExternalLink size={18} /> ทำแบบทดสอบผ่าน Google Forms
          </a>

          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSyncing}
            style={{ borderRadius: 14, padding: '10px 16px', background: 'rgba(16, 185, 129, 0.1)', color: '#047857', border: '1px solid rgba(16, 185, 129, 0.3)' }}
            title="นำเข้าไฟล์ Excel หรือ CSV ตอบกลับจาก Google Form เพื่ออัปเดตคะแนนทันที"
          >
            <Upload size={18} /> นำเข้าไฟล์ Excel/CSV ตอบกลับ
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleSyncData}
            disabled={isSyncing}
            style={{ borderRadius: 14, padding: '10px 16px' }}
          >
            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'กำลังซิงค์ข้อมูล...' : 'ซิงค์ผลสอบล่าสุด'}
          </button>

          {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR') && (
            <button
              className="btn btn-ghost"
              onClick={() => setShowConfigModal(true)}
              style={{ borderRadius: 14, padding: '10px 14px', border: '1px solid var(--border-color)' }}
              title="ตั้งค่าลิงก์ Google Form & Apps Script API"
            >
              <Settings size={18} /> ตั้งค่า Google API
            </button>
          )}
        </div>
      </div>

      {importStatusMessage && (
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#047857', padding: '12px 18px', borderRadius: 12, marginBottom: 20, marginTop: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} /> {importStatusMessage}
        </div>
      )}

      {/* SECTION 1: Active User's Latest Score Card & Attempt History */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={20} className="text-blue" /> ผลการสอบปฐมนิเทศของคุณ ({currentUser.name})
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              รหัสพนักงาน: {currentUser.empCode} • {currentUser.department} ({currentUser.position})
            </span>
          </div>

          {activeUserLatest && (
            <span className={`badge ${activeUserLatest.isPassed ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
              {activeUserLatest.isPassed ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              {activeUserLatest.isPassed ? 'ผ่านเกณฑ์เรียบร้อย' : 'ไม่ผ่านเกณฑ์ (ต้องสอบใหม่)'}
            </span>
          )}
        </div>

        {activeUserLatest ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, alignItems: 'center' }}>
            {/* Score Highlight Box */}
            <div
              style={{
                background: activeUserLatest.isPassed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${activeUserLatest.isPassed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                borderRadius: 16,
                padding: 20,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>คะแนนสอบล่าสุดจาก Google Forms</div>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: activeUserLatest.isPassed ? '#047857' : '#b91c1c' }}>
                {activeUserLatest.score} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/ 30 ข้อ</span>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: activeUserLatest.isPassed ? '#047857' : '#b91c1c', marginTop: 2 }}>
                คิดเป็น {activeUserLatest.percentage}%
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 8 }}>
                ทดสอบเมื่อ: {activeUserLatest.submittedAt} (รอบที่ {activeUserLatest.attemptNumber})
              </div>
            </div>

            {/* Status & Retake Action Info */}
            <div>
              {!activeUserLatest.isPassed ? (
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: 16, borderRadius: 14, marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <AlertTriangle size={18} /> แจ้งเตือน: คะแนนสอบไม่ถึงเกณฑ์ 24/30 ข้อ
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                    คุณทำข้อสอบได้ {activeUserLatest.score}/30 ข้อ (ยังไม่ถึงเกณฑ์ผ่าน 24 ข้อ) ระบบได้แจ้งเตือน HR เรียบร้อยแล้ว กรุณากดดูข้อที่ตอบผิดเพื่อทบทวน แล้วคลิกทำข้อสอบใหม่ผ่าน Google Forms ครับ
                  </div>
                </div>
              ) : (
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: 16, borderRadius: 14, marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, color: '#047857', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <CheckCircle2 size={18} /> ผ่านการทดสอบปฐมนิเทศเรียบร้อยแล้ว
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                    ยินดีด้วย! คุณทำคะแนนสอบได้ {activeUserLatest.score}/30 ข้อ (สูงกว่าเกณฑ์บังคับ 24 ข้อ) ข้อมูลผลสอบได้รับการบันทึกเข้าประวัติพนักงานเรียบร้อยแล้ว
                  </div>
                </div>
              )}

              <button
                className="btn btn-primary btn-sm"
                onClick={() => setViewingResult(activeUserLatest)}
                style={{ borderRadius: 12, padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Eye size={16} /> ดูรายละเอียดคำตอบ & ข้อที่ตอบผิด (รอบล่าสุด)
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 32, background: 'rgba(148, 163, 184, 0.05)', borderRadius: 14 }}>
            <AlertTriangle size={32} className="text-amber" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>ยังไม่มีประวัติการทำข้อสอบ Google Forms ของคุณ</div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              กรุณากดปุ่มทำแบบทดสอบปฐมนิเทศผ่าน Google Forms ด้านบน (เกณฑ์ผ่าน ≥ 24/30 ข้อ)
            </p>
            <a
              href={googleFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{ borderRadius: 12, padding: '8px 16px', textDecoration: 'none' }}
            >
              <ExternalLink size={16} /> คลิกทำแบบทดสอบ Google Forms
            </a>
          </div>
        )}

        {/* Individual Attempt History Timeline */}
        {activeUserHistory.length > 0 && (
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12 }}>
              📜 ประวัติการทำข้อสอบสะสมของคุณ ({activeUserHistory.length} รอบ)
            </h3>
            <div className="table-responsive">
              <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>รอบที่ (Attempt)</th>
                    <th>วันที่ - เวลาที่ส่งข้อสอบ</th>
                    <th>คะแนนที่ได้</th>
                    <th>คิดเป็น (%)</th>
                    <th>ผลการประเมิน</th>
                    <th>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {activeUserHistory.map((res: GoogleFormExamResult) => (
                    <tr key={res.id}>
                      <td style={{ fontWeight: 700 }}>ครั้งที่ {res.attemptNumber}</td>
                      <td>{res.submittedAt}</td>
                      <td style={{ fontWeight: 800 }}>{res.score} / 30 ข้อ</td>
                      <td style={{ fontWeight: 700 }}>{res.percentage}%</td>
                      <td>
                        <span className={`badge ${res.isPassed ? 'badge-green' : 'badge-red'}`}>
                          {res.isPassed ? 'PASSED (ผ่าน)' : 'FAILED (ไม่ผ่าน)'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-xs btn-secondary"
                          onClick={() => setViewingResult(res)}
                          style={{ borderRadius: 8, padding: '4px 10px', fontSize: '0.8rem' }}
                        >
                          <Eye size={14} /> ดูแผ่นคำตอบรอบนี้
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Admin & Supervisor Directory (ตารางผลสอบพนักงานทั้งหมด) */}
      {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR') && (
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>📊 ทะเบียนติดตามผลสอบ Google Forms พนักงานทั้งหมด</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                ตรวจสอบคะแนนสอบล่าสุด ประวัติการทำซ้ำ และคำตอบที่ผิดของพนักงานรายบุคคล
              </span>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <select
                className="form-control"
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                style={{ borderRadius: 12, width: 'auto' }}
              >
                <option value="ALL">ทุกแผนกทั้งหมด</option>
                <option value="FMG-A">FMG-A</option>
                <option value="QA/QC">QA/QC</option>
                <option value="HR&GA IT">HR&GA IT</option>
                <option value="HR&GA">HR&GA</option>
              </select>

              <div style={{ position: 'relative', width: 220 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ/รหัส..."
                  className="form-control"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: 34, borderRadius: 12 }}
                />
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table" style={{ width: '100%', fontSize: '0.88rem' }}>
              <thead>
                <tr>
                  <th>พนักงาน</th>
                  <th>แผนก / ตำแหน่ง</th>
                  <th>คะแนนสอบล่าสุด (Google Form)</th>
                  <th>จำนวนรอบที่ทำ</th>
                  <th>สถานะ</th>
                  <th>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => {
                  const history = getEmployeeExamResults(emp.empCode);
                  const latest = getLatestEmployeeExamResult(emp.empCode);

                  return (
                    <tr key={emp.id}>
                      <td>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <img src={emp.avatar} alt={emp.name} style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{emp.name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{emp.empCode}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>{emp.department}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{emp.position}</div>
                      </td>
                      <td>
                        {latest ? (
                          <div>
                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: latest.isPassed ? '#047857' : '#b91c1c' }}>
                              {latest.score} / 30 ข้อ
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginLeft: 6 }}>({latest.percentage}%)</span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ส่งเมื่อ: {latest.submittedAt}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>ยังไม่มีข้อมูล</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>
                        {history.length > 0 ? `${history.length} รอบ` : '-'}
                      </td>
                      <td>
                        {latest ? (
                          <span className={`badge ${latest.isPassed ? 'badge-green' : 'badge-red'}`}>
                            {latest.isPassed ? 'PASSED (ผ่าน)' : 'FAILED (ต้องสอบใหม่)'}
                          </span>
                        ) : (
                          <span className="badge badge-amber">ยังไม่ได้ทำข้อสอบ</span>
                        )}
                      </td>
                      <td>
                        {latest ? (
                          <button
                            className="btn btn-xs btn-secondary"
                            onClick={() => {
                              setViewingResult(latest);
                            }}
                            style={{ borderRadius: 8, padding: '5px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Eye size={14} /> ดูประวัติ & เฉลย
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Detailed Answer Sheet & Question Breakdown */}
      {viewingResult && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }}>
          <div className="glass-card modal-container" style={{ maxWidth: 840, width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={18} className="text-blue" /> รายละเอียดผลสอบ Google Forms - {viewingResult.employeeName} ({viewingResult.empCode})
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  การสอบรอบที่ {viewingResult.attemptNumber} • ส่งเมื่อ {viewingResult.submittedAt}
                </div>
              </div>

              <button className="btn-icon" onClick={() => setViewingResult(null)}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Content Body */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {/* Score Summary Box */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: viewingResult.isPassed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${viewingResult.isPassed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  padding: 16,
                  borderRadius: 14,
                  marginBottom: 20,
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ผลสรุปคะแนนสอบ</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: viewingResult.isPassed ? '#047857' : '#b91c1c' }}>
                    {viewingResult.score} / 30 ข้อ ({viewingResult.percentage}%)
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${viewingResult.isPassed ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                    {viewingResult.isPassed ? 'PASSED (ผ่านเกณฑ์)' : 'FAILED (ไม่ผ่านเกณฑ์)'}
                  </span>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    เกณฑ์ผ่านบังคับ: 24 / 30 ข้อขึ้นไป
                  </div>
                </div>
              </div>

              {/* HR Diagnostic Banner if Failed */}
              {!viewingResult.isPassed && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: 14, borderRadius: 12, marginBottom: 20, fontSize: '0.88rem' }}>
                  <div style={{ fontWeight: 700, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <AlertTriangle size={16} /> HR Diagnostic Notice: พนักงานตอบผิดทั้งหมด {30 - viewingResult.score} ข้อ
                  </div>
                  <div style={{ color: 'var(--text-main)', lineHeight: 1.4 }}>
                    กรุณาแนะแนวนโยบายและกฎความปลอดภัยในข้อที่ตอบผิดด้านล่าง จากนั้นแจ้งให้พนักงานเข้าทำข้อสอบใหม่ผ่าน Google Forms ครับ
                  </div>
                </div>
              )}

              {/* Itemized Question Answer Sheet */}
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>
                📋 รายการคำตอบและข้อที่ตอบผิด (30 ข้อ):
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {viewingResult.answersDetail.map((q) => (
                  <div
                    key={q.questionNo}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      background: q.isCorrect ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.05)',
                      border: `1px solid ${q.isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.25)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                        {q.questionNo}. {q.questionText}
                      </div>
                      <span className={`badge ${q.isCorrect ? 'badge-green' : 'badge-red'}`} style={{ flexShrink: 0, fontSize: '0.78rem' }}>
                        {q.isCorrect ? '✅ ถูกต้อง' : '❌ ตอบผิด'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      คำตอบของพนักงาน: <strong style={{ color: q.isCorrect ? '#047857' : '#b91c1c' }}>{q.userAnswer}</strong>
                    </div>

                    {!q.isCorrect && (
                      <div style={{ fontSize: '0.85rem', color: '#047857', marginTop: 3, fontWeight: 600 }}>
                        เฉลยข้อที่ถูกต้อง: <span>{q.correctAnswer}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setViewingResult(null)} style={{ borderRadius: 12, padding: '8px 20px' }}>
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Admin Config Modal (Set Google Form Link & Apps Script Code) */}
      {showConfigModal && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }}>
          <div className="glass-card modal-container" style={{ maxWidth: 700, width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={18} className="text-blue" /> ตั้งค่าการเชื่อมต่อ Google Forms API
              </h3>
              <button className="btn-icon" onClick={() => setShowConfigModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">URL สำหรับทำแบบทดสอบ Google Forms (สำหรับพนักงานสอบภายนอก):</label>
                <input
                  type="text"
                  className="form-control"
                  value={googleFormUrl}
                  onChange={(e) => setGoogleFormUrl(e.target.value)}
                  placeholder="https://docs.google.com/forms/d/e/.../viewform"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">URL ของ Google Apps Script Web App (สำหรับซิงค์คะแนนอัตโนมัติ):</label>
                <input
                  type="text"
                  className="form-control"
                  value={appsScriptUrl}
                  onChange={(e) => setAppsScriptUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                />
              </div>

              {/* Copyable Apps Script Code Box */}
              <div style={{ background: '#0f172a', color: '#f8fafc', padding: 16, borderRadius: 12, fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>📄 โค้ด Google Apps Script (Code.gs) สำหรับติดตั้งใน Google Sheets:</span>
                  <button
                    className="btn btn-xs btn-secondary"
                    onClick={handleCopyCode}
                    style={{ borderRadius: 8, padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    {copiedCode ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                    {copiedCode ? 'คัดลอกสำเร็จ!' : 'คัดลอกโค้ด'}
                  </button>
                </div>

                <pre style={{ margin: 0, padding: 10, background: '#1e293b', borderRadius: 8, maxHeight: 180, overflowY: 'auto', fontFamily: 'monospace' }}>
                  {getSampleGoogleAppsScriptCode()}
                </pre>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', textAlign: 'right' }}>
              <button className="btn btn-primary" onClick={() => setShowConfigModal(false)} style={{ borderRadius: 12, padding: '8px 20px' }}>
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
