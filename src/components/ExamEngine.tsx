import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Eye,
  BookOpen,
  Sparkles,
  Upload,
  ShieldCheck,
  Award,
  ArrowRight,
  ClipboardList,
  Settings,
  QrCode,
} from 'lucide-react';
import type { Employee, GoogleFormExamResult, ExamType, ExamPhase, PreTestLockMap, OrientationBatch } from '../types';
import { loadOrientationBatchesFromLocalStorage } from '../services/orientationBatchService';
import {
  DEFAULT_APPS_SCRIPT_URL,
  DEFAULT_GOOGLE_FORM_URL,
  DEFAULT_SAFETY_FORM_URL,
  DEFAULT_ORIENTATION_FORM_URL,
  loadExamResultsFromLocalStorage,
  loadPreTestLockStatusFromLocalStorage,
  parseExcelOrCsvFile,
  saveExamResultsToLocalStorage,
  savePreTestLockStatusToLocalStorage,
} from '../services/googleFormSync';
import { ExamConfigModal } from './exam/ExamConfigModal';
import { ExamDetailDrawer } from './exam/ExamDetailDrawer';
import { ExamDirectoryTable } from './exam/ExamDirectoryTable';
import { ExamQrModal } from './exam/ExamQrModal';

interface ExamEngineProps {
  currentUser: Employee;
  employees: Employee[];
}

export const ExamEngine: React.FC<ExamEngineProps> = ({ currentUser, employees }) => {
  const [selectedExamType, setSelectedExamType] = useState<ExamType>('SAFETY_ATTITUDE');
  const [selectedPhase, setSelectedPhase] = useState<ExamPhase>('PRE_TEST');

  const [googleFormUrl, setGoogleFormUrl] = useState(() => {
    const saved = localStorage.getItem('hrskill_google_form_url');
    if (!saved || saved.includes('EXAMPLE_FORM_ID')) {
      return DEFAULT_GOOGLE_FORM_URL;
    }
    return saved;
  });
  const [appsScriptUrl, setAppsScriptUrl] = useState(() => {
    const saved = localStorage.getItem('hrskill_apps_script_url');
    if (!saved || saved !== DEFAULT_APPS_SCRIPT_URL) {
      localStorage.setItem('hrskill_apps_script_url', DEFAULT_APPS_SCRIPT_URL);
      return DEFAULT_APPS_SCRIPT_URL;
    }
    return saved;
  });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);

  const isHR = currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR';

  // Pre-Test Lock Status Map
  const [preTestLockMap, setPreTestLockMap] = useState<PreTestLockMap>(() =>
    loadPreTestLockStatusFromLocalStorage()
  );

  const isPreTestClosed = selectedExamType === 'ORIENTATION' ? true : Boolean(preTestLockMap[currentUser.empCode]?.[selectedExamType]);

  const handleTogglePreTestLock = (empCode: string) => {
    const currentStatus = Boolean(preTestLockMap[empCode]?.[selectedExamType]);
    const existingLocks = preTestLockMap[empCode] || { SAFETY_ATTITUDE: false, ORIENTATION: false };
    const updatedMap: PreTestLockMap = {
      ...preTestLockMap,
      [empCode]: {
        ...existingLocks,
        [selectedExamType]: !currentStatus,
      },
    };
    setPreTestLockMap(updatedMap);
    savePreTestLockStatusToLocalStorage(updatedMap);
    setImportStatusMessage(
      `🔒 อัปเดตสถานะการสอบ ${selectedExamType === 'SAFETY_ATTITUDE' ? 'ทัศนคติความปลอดภัย' : 'ปฐมนิเทศ'} ของรหัส ${empCode}: ${
        !currentStatus
          ? 'ปิดการสอบก่อนอบรมแล้ว (เปิดรับการสอบหลังอบรมแล้ว ✅)'
          : 'เปิดการสอบก่อนอบรมอยู่ (สอบหลังอบรมถูกล็อคอยู่ 🔒)'
      }`
    );
    setTimeout(() => setImportStatusMessage(null), 5000);
  };

  // Dynamic Exam Results Map (100% Real Live Google Sheet / Form Data Only)
  const [examResultsMap, setExamResultsMap] = useState<Record<string, GoogleFormExamResult[]>>(() => {
    if (!localStorage.getItem('hrskill_zero_mock_v1')) {
      localStorage.removeItem('hrskill_google_form_exam_results_v1');
      localStorage.setItem('hrskill_zero_mock_v1', 'true');
      return {};
    }
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
  const [selectedBatchId, setSelectedBatchId] = useState(() => {
    const pending = localStorage.getItem('hrskill_active_batch_id');
    return pending || 'ALL';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [orientationBatches, setOrientationBatches] = useState<OrientationBatch[]>(() => loadOrientationBatchesFromLocalStorage());

  useEffect(() => {
    setOrientationBatches(loadOrientationBatchesFromLocalStorage());
    const pending = localStorage.getItem('hrskill_active_batch_id');
    if (pending) {
      setSelectedBatchId(pending);
      localStorage.removeItem('hrskill_active_batch_id');
    }
  }, []);

  // Handle Excel/CSV File Upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSyncing(true);
      const { results: updatedResults, detectedExamType, detectedPhase } = await parseExcelOrCsvFile(file);
      setExamResultsMap(updatedResults);
      if (detectedExamType) setSelectedExamType(detectedExamType);
      if (detectedPhase) setSelectedPhase(detectedPhase);
      setImportStatusMessage(
        `✅ อัปเดตและซิงค์ผลสอบจากไฟล์ "${file.name}" เรียบร้อยแล้ว! (${
          detectedExamType === 'SAFETY_ATTITUDE' ? 'ทัศนคติความปลอดภัย 14 ข้อ' : 'ประเมินการปฐมนิเทศ 30 ข้อ'
        } - ${detectedPhase === 'PRE_TEST' ? 'รอบ Pre-Test' : 'รอบ Post-Test'})`
      );
      setTimeout(() => setImportStatusMessage(null), 6000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'รูปแบบไฟล์ไม่ถูกต้อง';
      alert(`❌ เกิดข้อผิดพลาดในการอ่านไฟล์: ${msg}`);
    } finally {
      setIsSyncing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Sync Logic / Live Apps Script Fetch (High-Performance Optimized)
  const handleSyncData = useCallback(async (silent: boolean = false) => {
    if (!silent) setIsSyncing(true);
    const targetUrl = appsScriptUrl || DEFAULT_APPS_SCRIPT_URL;
    if (targetUrl) {
      try {
        const res = await fetch(`${targetUrl}?empCode=`);
        const text = await res.text();
        if (text.startsWith('{')) {
          const json = JSON.parse(text);
          if (json.status === 'success' && json.results && json.results.length > 0) {
            setExamResultsMap((prevMap) => {
              let hasChanges = false;
              let updatedCount = 0;
              const newMap: Record<string, GoogleFormExamResult[]> = { ...prevMap };

              json.results.forEach((item: GoogleFormExamResult) => {
                const empCode = (item.empCode || '').trim().toUpperCase();
                if (!empCode) return;
                const normalizedItem = { ...item, empCode };
                if (!newMap[empCode]) {
                  newMap[empCode] = [normalizedItem];
                  hasChanges = true;
                  updatedCount++;
                } else {
                  const existingList = newMap[empCode];
                  const idx = existingList.findIndex(
                    (r) => r.attemptNumber === item.attemptNumber && r.examType === item.examType && r.phase === item.phase
                  );
                  if (idx >= 0) {
                    const prevItem = existingList[idx];
                    if (
                      prevItem.score !== item.score ||
                      prevItem.submittedAt !== item.submittedAt ||
                      prevItem.isPassed !== item.isPassed
                    ) {
                      existingList[idx] = normalizedItem;
                      hasChanges = true;
                      updatedCount++;
                    }
                  } else {
                    existingList.push(normalizedItem);
                    hasChanges = true;
                    updatedCount++;
                  }
                }
              });

              if (hasChanges) {
                saveExamResultsToLocalStorage(newMap);
                if (!silent || updatedCount > 0) {
                  setImportStatusMessage(`⚡️ ซิงค์ผลสอบสดจาก Google Forms เรียบร้อยแล้ว (${json.totalRecords} รายการ)`);
                  setTimeout(() => setImportStatusMessage(null), 4000);
                }
                return newMap;
              }
              
              if (!silent) {
                setImportStatusMessage(`⚡️ ข้อมูลเป็นปัจจุบันแล้ว (${json.totalRecords} รายการ)`);
                setTimeout(() => setImportStatusMessage(null), 3000);
              }
              return prevMap; // Return same reference -> NO RE-RENDER!
            });
          }
        } else if (!silent) {
          setImportStatusMessage('⚠️ ติดสิทธิ์การเข้าถึง Google: โปรดตรวจสอบว่าใน Apps Script ตั้งค่า "ผู้มีสิทธิ์เข้าถึง" เป็น "ทุกคน (Anyone)" แล้วกด Deploy ใหม่');
          setTimeout(() => setImportStatusMessage(null), 8000);
        }
      } catch (err) {
        console.error('Apps Script Auto Sync Error:', err);
      }
    }
    if (!silent) {
      setTimeout(() => {
        setIsSyncing(false);
      }, 500);
    }
  }, [appsScriptUrl]);

  // Smart Live Auto-Sync Polling (Every 15s & Only When Page Visible)
  useEffect(() => {
    handleSyncData(true);
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        handleSyncData(true);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [handleSyncData]);

  // Helper functions using state
  const getEmployeeExamResults = (empCode: string): GoogleFormExamResult[] => {
    const key = (empCode || '').trim().toUpperCase();
    return examResultsMap[key] || examResultsMap[empCode] || [];
  };

  // Active User Results filtered by current ExamType and Phase
  const allUserResults = getEmployeeExamResults(currentUser.empCode);
  const activeUserHistory = allUserResults.filter((r) => {
    const isSafety = r.examType === 'SAFETY_ATTITUDE' || (r.totalQuestions && r.totalQuestions <= 14);
    const recType: ExamType = isSafety ? 'SAFETY_ATTITUDE' : 'ORIENTATION';
    const matchType = recType === selectedExamType;
    const matchPhase = selectedExamType === 'ORIENTATION' ? true : (r.phase || 'POST_TEST') === selectedPhase;
    return matchType && matchPhase;
  });
  const activeUserLatest = activeUserHistory.length > 0 ? activeUserHistory[activeUserHistory.length - 1] : null;

  // Pre-Test vs Post-Test Comparison for active user
  const preResult = allUserResults.find((r) => {
    const isSafety = r.examType === 'SAFETY_ATTITUDE' || (r.totalQuestions && r.totalQuestions <= 14);
    return (isSafety ? 'SAFETY_ATTITUDE' : 'ORIENTATION') === selectedExamType && r.phase === 'PRE_TEST';
  });
  const postResult = allUserResults.find((r) => {
    const isSafety = r.examType === 'SAFETY_ATTITUDE' || (r.totalQuestions && r.totalQuestions <= 14);
    return (isSafety ? 'SAFETY_ATTITUDE' : 'ORIENTATION') === selectedExamType && (r.phase === 'POST_TEST' || !r.phase);
  });

  const handleUnlockBatchPreTest = (batch: OrientationBatch) => {
    const updatedMap: PreTestLockMap = { ...preTestLockMap };
    batch.empCodes.forEach((code) => {
      const empCode = code.trim().toUpperCase();
      const existingLocks = updatedMap[empCode] || { SAFETY_ATTITUDE: false, ORIENTATION: false };
      updatedMap[empCode] = {
        ...existingLocks,
        [selectedExamType]: true,
      };
    });
    setPreTestLockMap(updatedMap);
    savePreTestLockStatusToLocalStorage(updatedMap);
    setImportStatusMessage(`🔓 ปลดล็อคข้อสอบหลังอบรม (Post-Test) สำหรับพนักงาน ${batch.empCodes.length} คนในรอบ "${batch.batchName}" เรียบร้อยแล้ว! ✅`);
    setTimeout(() => setImportStatusMessage(null), 5000);
  };

  const isSafetySelected = selectedExamType === 'SAFETY_ATTITUDE';
  const passCriteriaText = isSafetySelected ? 'เกณฑ์ผ่าน: ผิดไม่เกิน 2 ข้อ (≥ 12/14 ข้อ)' : 'เกณฑ์ผ่าน: 80% ขึ้นไป (≥ 24/30 ข้อ)';
  const currentGoogleFormUrl = isSafetySelected ? DEFAULT_SAFETY_FORM_URL : DEFAULT_ORIENTATION_FORM_URL;

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
            <FileCheck2 size={14} /> DUAL EXAM ENGINE • {passCriteriaText}
          </div>
          <h1 className="page-title gradient-text">ระบบติดตามผลสอบปฐมนิเทศ & ความปลอดภัย (Google Forms)</h1>
          <p className="page-subtitle">
            ศูนย์ติดตามผลสอบพนักงานใหม่บริษัท COMPLETE AUTO RUBBER MANUFACTURING CO., LTD. (ผ่าน Google Forms 100%)
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowQrModal(true)}
            className="btn btn-primary"
            style={{
              borderRadius: 14,
              padding: '10px 18px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            <QrCode size={18} /> แสดง QR Code สแกนสอบ
          </button>

          <a
            href={currentGoogleFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{
              borderRadius: 14,
              padding: '10px 18px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={18} /> เปิด Google Forms ({isSafetySelected ? '14 ข้อ' : '30 ข้อ'})
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
            onClick={() => handleSyncData(false)}
            disabled={isSyncing}
            style={{ borderRadius: 14, padding: '10px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'กำลังซิงค์ข้อมูล...' : 'ซิงค์ผลสอบล่าสุด'}
          </button>

          {isHR && (
            <button
              className="btn btn-secondary"
              onClick={() => setShowConfigModal(true)}
              style={{ borderRadius: 14, padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              title="ตั้งค่า URL Google Forms / Apps Script Web App"
            >
              <Settings size={18} /> ตั้งค่า Google API
            </button>
          )}

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.78rem',
              color: '#047857',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '6px 12px',
              borderRadius: 14,
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontWeight: 600,
            }}
            title="ระบบเปิด Auto-Sync ดึงคะแนนสดจาก Google Form อัตโนมัติทุก 15 วินาที"
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            <span>Live Auto-Sync (15s)</span>
          </div>
        </div>
      </div>

      {/* EXAM SELECTION & PHASE SWITCHER TABS BAR */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Row 1: Exam Type Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, minWidth: 110 }}>
            <ClipboardList size={16} /> ชุดข้อสอบ:
          </span>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1 }}>
            <button
              onClick={() => setSelectedExamType('SAFETY_ATTITUDE')}
              className={`btn ${selectedExamType === 'SAFETY_ATTITUDE' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: 12,
                padding: '8px 18px',
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: selectedExamType === 'SAFETY_ATTITUDE' ? 'linear-gradient(135deg, #059669, #047857)' : undefined,
                border: selectedExamType === 'SAFETY_ATTITUDE' ? 'none' : '1px solid var(--border-color)',
              }}
            >
              <ShieldCheck size={18} /> ชุดที่ 1: ทัศนคติความปลอดภัย (14 ข้อ)
            </button>

            <button
              onClick={() => {
                setSelectedExamType('ORIENTATION');
                setSelectedPhase('POST_TEST');
              }}
              className={`btn ${selectedExamType === 'ORIENTATION' ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: 12,
                padding: '8px 18px',
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: selectedExamType === 'ORIENTATION' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : undefined,
                border: selectedExamType === 'ORIENTATION' ? 'none' : '1px solid var(--border-color)',
              }}
            >
              <Award size={18} /> ชุดที่ 2: ประเมินผลการปฐมนิเทศ (30 ข้อ - มีเฉพาะหลังอบรม)
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border-color)', opacity: 0.6 }} />

        {/* Row 2: Phase Switcher & HR Lock Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, minWidth: 110 }}>
            <BookOpen size={16} /> รอบการสอบ:
          </span>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {selectedExamType === 'ORIENTATION' ? (
              <div
                style={{
                  background: 'rgba(37, 99, 235, 0.1)',
                  color: '#1d4ed8',
                  padding: '6px 14px',
                  borderRadius: 10,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  border: '1px solid rgba(37, 99, 235, 0.25)',
                }}
              >
                <CheckCircle2 size={16} /> หลังการอบรม (Post-Test Only — ชุด 30 ข้อมีเฉพาะหลังการอบรม)
              </div>
            ) : (
              <>
                <button
                  onClick={() => setSelectedPhase('PRE_TEST')}
                  style={{
                    borderRadius: 10,
                    padding: '6px 16px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: selectedPhase === 'PRE_TEST' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                    color: selectedPhase === 'PRE_TEST' ? '#b45309' : 'var(--text-muted)',
                    border: selectedPhase === 'PRE_TEST' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                  }}
                >
                  📝 ก่อนการอบรม (Pre-Test)
                </button>

                <button
                  onClick={() => {
                    if (!isPreTestClosed) {
                      alert('🔒 รอบหลังการอบรม (Post-Test) ถูกล็อคอยู่:\nHR ต้องกดปิดการสอบก่อนอบรม (Close Pre-Test) ในระบบก่อน จึงจะทำข้อสอบหลังอบรมได้ครับ');
                    }
                    setSelectedPhase('POST_TEST');
                  }}
                  style={{
                    borderRadius: 10,
                    padding: '6px 16px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: selectedPhase === 'POST_TEST' ? (isPreTestClosed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)') : 'transparent',
                    color: selectedPhase === 'POST_TEST' ? (isPreTestClosed ? '#047857' : '#b91c1c') : 'var(--text-muted)',
                    border: selectedPhase === 'POST_TEST' ? (isPreTestClosed ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)') : '1px solid transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {isPreTestClosed ? '✅ หลังการอบรม (Post-Test)' : '🔒 หลังการอบรม (Post-Test - รอล็อคปิด Pre-Test)'}
                </button>

                {/* HR Control: Toggle Pre-Test Lock Status */}
                {isHR && (
                  <button
                    className={`btn btn-xs ${isPreTestClosed ? 'btn-secondary' : 'btn-warning'}`}
                    onClick={() => handleTogglePreTestLock(currentUser.empCode)}
                    style={{ borderRadius: 10, padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    title="HR กดเพื่อปิดการสอบก่อนอบรมและปลดล็อคให้สอบหลังอบรม"
                  >
                    {isPreTestClosed ? <CheckCircle2 size={14} className="text-green" /> : <AlertTriangle size={14} />}
                    {isPreTestClosed ? '🔒 HR กดปิด Pre-Test แล้ว (เปิด Post-Test)' : '🔓 HR กดปิด Pre-Test'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Pre-Test vs Post-Test Progress Badge */}
          {(preResult || postResult) && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', background: 'rgba(255,255,255,0.05)', padding: '6px 14px', borderRadius: 10, border: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>พัฒนาการสอบ (Pre ➔ Post):</span>
              <span style={{ fontWeight: 700, color: '#b45309' }}>Pre: {preResult ? `${preResult.score}/${preResult.totalQuestions}` : '-'}</span>
              <ArrowRight size={14} className="text-muted" />
              <span style={{ fontWeight: 700, color: '#047857' }}>Post: {postResult ? `${postResult.score}/${postResult.totalQuestions}` : '-'}</span>
              {preResult && postResult && (
                <span className="badge badge-green" style={{ marginLeft: 4, padding: '2px 8px', fontSize: '0.75rem' }}>
                  +{postResult.percentage - preResult.percentage}%
                </span>
              )}
            </div>
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
              <BookOpen size={20} className="text-blue" /> ผลการสอบ{isSafetySelected ? 'ทัศนคติความปลอดภัย (14 ข้อ)' : 'ประเมินผลการปฐมนิเทศ (30 ข้อ)'} ({currentUser.name})
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              รหัสพนักงาน: {currentUser.empCode} • {currentUser.department} ({currentUser.position}) • รอบ: <strong>{selectedPhase === 'PRE_TEST' ? 'ก่อนการอบรม (Pre-Test)' : 'หลังการอบรม (Post-Test)'}</strong>
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
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>คะแนนสอบล่าสุด (Google Forms)</div>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: activeUserLatest.isPassed ? '#047857' : '#b91c1c' }}>
                {activeUserLatest.score} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/ {activeUserLatest.totalQuestions} ข้อ</span>
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
                    <AlertTriangle size={18} /> แจ้งเตือน: คะแนนสอบยังไม่ถึงเกณฑ์บังคับ
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                    คุณทำข้อสอบได้ {activeUserLatest.score}/{activeUserLatest.totalQuestions} ข้อ ({passCriteriaText}) ข้อมูลส่งถึง HR แล้ว กรุณาเข้าทำข้อสอบใหม่ผ่าน Google Forms เพื่อปรับปรุงคะแนนครับ
                  </div>
                </div>
              ) : (
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: 16, borderRadius: 14, marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, color: '#047857', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <CheckCircle2 size={18} /> ผ่านการทดสอบปฐมนิเทศเรียบร้อยแล้ว
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                    ยินดีด้วย! คุณทำคะแนนสอบได้ {activeUserLatest.score}/{activeUserLatest.totalQuestions} ข้อ ({passCriteriaText}) ข้อมูลผลสอบได้รับการบันทึกเข้าประวัติพนักงานเรียบร้อยแล้ว
                  </div>
                </div>
              )}

              {isHR ? (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setViewingResult(activeUserLatest)}
                  style={{ borderRadius: 12, padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Eye size={16} /> ดูรายละเอียดคำตอบ & ข้อที่ตอบผิด (รอบล่าสุด)
                </button>
              ) : (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '6px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  🔒 คุณสามารถดูคะแนนรวมและสถานะผ่าน/ไม่ผ่านได้ที่นี่ (เฉลยรายข้อสงวนสิทธิ์สำหรับ HR)
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 32, background: 'rgba(148, 163, 184, 0.05)', borderRadius: 14 }}>
            <AlertTriangle size={32} className="text-amber" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>ยังไม่มีประวัติการทำข้อสอบ Google Forms ของคุณ</div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              กรุณาเปิดทำแบบทดสอบผ่านลิงก์ Google Forms ({passCriteriaText})
            </p>
            <a
              href={currentGoogleFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{ borderRadius: 12, padding: '8px 16px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
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
                      <td style={{ fontWeight: 800 }}>
                        {res.score} / {res.totalQuestions || (selectedExamType === 'SAFETY_ATTITUDE' ? 14 : 30)} ข้อ
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {Math.round((res.score / (res.totalQuestions || (selectedExamType === 'SAFETY_ATTITUDE' ? 14 : 30))) * 100)}%
                      </td>
                      <td>
                        <span className={`badge ${res.isPassed ? 'badge-green' : 'badge-red'}`}>
                          {res.isPassed ? 'PASSED (ผ่าน)' : 'FAILED (ไม่ผ่าน)'}
                        </span>
                      </td>
                      <td>
                        {isHR ? (
                          <button
                            className="btn btn-xs btn-secondary"
                            onClick={() => setViewingResult(res)}
                            style={{ borderRadius: 8, padding: '4px 10px', fontSize: '0.8rem' }}
                          >
                            <Eye size={14} /> ดูแผ่นคำตอบรอบนี้
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>-</span>
                        )}
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
        <ExamDirectoryTable
          employees={employees}
          orientationBatches={orientationBatches}
          selectedBatchId={selectedBatchId}
          setSelectedBatchId={setSelectedBatchId}
          selectedDeptFilter={selectedDeptFilter}
          setSelectedDeptFilter={setSelectedDeptFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          preTestLockMap={preTestLockMap}
          selectedExamType={selectedExamType}
          examResultsMap={examResultsMap}
          onTogglePreTestLock={handleTogglePreTestLock}
          onUnlockBatch={handleUnlockBatchPreTest}
          onViewResult={(res) => setViewingResult(res)}
        />
      )}

      {/* MODAL 1: Detailed Answer Sheet & Question Breakdown */}
      <ExamDetailDrawer
        result={viewingResult}
        onClose={() => setViewingResult(null)}
        isHR={isHR}
      />

      {/* MODAL 2: Admin Config Modal */}
      <ExamConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        googleFormUrl={googleFormUrl}
        setGoogleFormUrl={setGoogleFormUrl}
        appsScriptUrl={appsScriptUrl}
        setAppsScriptUrl={setAppsScriptUrl}
      />

      {/* MODAL 3: QR Code Scanner Modal */}
      <ExamQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title={isSafetySelected ? 'แบบทดสอบทัศนคติเกี่ยวกับความปลอดภัย (14 ข้อ)' : 'แบบทดสอบประเมินผลการปฐมนิเทศ (30 ข้อ)'}
        subtitle="ผู้เข้าอบรมสามารถเปิดกล้องมือถือเพื่อสแกน QR Code นี้เข้าทำข้อสอบได้ทันที"
        url={currentGoogleFormUrl}
        passCriteriaText={passCriteriaText}
        isSafety={isSafetySelected}
      />
    </div>
  );
};
