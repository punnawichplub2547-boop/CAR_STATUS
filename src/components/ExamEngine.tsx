import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ShieldCheck,
  Award,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import type { Employee, GoogleFormExamResult, ExamType, ExamPhase, PreTestLockMap } from '../types';
import {
  DEFAULT_APPS_SCRIPT_URL,
  DEFAULT_GOOGLE_FORM_URL,
  DEFAULT_SAFETY_FORM_URL,
  DEFAULT_ORIENTATION_FORM_URL,
  SAFETY_ATTITUDE_QUESTIONS_BANK,
  MASTER_QUESTIONS_BANK,
  ensureAnswersDetail,
  getSampleGoogleAppsScriptCode,
  loadExamResultsFromLocalStorage,
  loadPreTestLockStatusFromLocalStorage,
  parseExcelOrCsvFile,
  saveExamResultsToLocalStorage,
  savePreTestLockStatusToLocalStorage,
} from '../services/googleFormSync';

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
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);

  const isHR = currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR';

  // Pre-Test Lock Status Map
  const [preTestLockMap, setPreTestLockMap] = useState<PreTestLockMap>(() =>
    loadPreTestLockStatusFromLocalStorage()
  );

  const isPreTestClosed = Boolean(preTestLockMap[currentUser.empCode]?.[selectedExamType]);

  const handleTogglePreTestLock = (empCode: string) => {
    const currentStatus = Boolean(preTestLockMap[empCode]?.[selectedExamType]);
    const updatedMap: PreTestLockMap = {
      ...preTestLockMap,
      [empCode]: {
        ...(preTestLockMap[empCode] || {}),
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

  // Online Web Quiz State
  const [showOnlineQuizModal, setShowOnlineQuizModal] = useState(false);
  const [userQuizAnswers, setUserQuizAnswers] = useState<Record<number, string>>({});

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
  const [searchQuery, setSearchQuery] = useState('');

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
    } catch (err: any) {
      alert(`❌ เกิดข้อผิดพลาดในการอ่านไฟล์: ${err?.message || 'รูปแบบไฟล์ไม่ถูกต้อง'}`);
    } finally {
      setIsSyncing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Sync Logic / Live Apps Script Fetch
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
              const newMap: Record<string, GoogleFormExamResult[]> = { ...prevMap };
              let updatedCount = 0;
              json.results.forEach((item: GoogleFormExamResult) => {
                const empCode = (item.empCode || '').trim().toUpperCase();
                if (!empCode) return;
                const normalizedItem = { ...item, empCode };
                if (!newMap[empCode]) newMap[empCode] = [];
                const idx = newMap[empCode].findIndex(
                  (r) => r.attemptNumber === item.attemptNumber && r.examType === item.examType && r.phase === item.phase
                );
                if (idx >= 0) {
                  newMap[empCode][idx] = normalizedItem;
                } else {
                  newMap[empCode].push(normalizedItem);
                  updatedCount++;
                }
              });
              saveExamResultsToLocalStorage(newMap);
              if (!silent || updatedCount > 0) {
                setImportStatusMessage(`⚡️ ซิงค์ผลสอบสดจาก Google Forms อัตโนมัติเรียบร้อยแล้ว (${json.totalRecords} รายการ)`);
                setTimeout(() => setImportStatusMessage(null), 5000);
              }
              return newMap;
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
      }, 800);
    }
  }, [appsScriptUrl]);

  // Live Auto-Sync Polling Every 10 Seconds
  useEffect(() => {
    handleSyncData(true);
    const interval = setInterval(() => {
      handleSyncData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [handleSyncData]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getSampleGoogleAppsScriptCode());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Helper functions using state
  const getEmployeeExamResults = (empCode: string): GoogleFormExamResult[] => {
    const key = (empCode || '').trim().toUpperCase();
    return examResultsMap[key] || examResultsMap[empCode] || [];
  };

  // Start Online Web Quiz
  const handleStartOnlineQuiz = () => {
    if (selectedPhase === 'POST_TEST' && !isPreTestClosed) {
      alert(
        '🔒 ไม่สามารถทำแบบทดสอบรอบหลังการอบรม (Post-Test) ได้:\n\nเจ้าหน้าที่ HR ต้องกดปิดการสอบก่อนอบรม (Close Pre-Test) ในระบบก่อน จึงจะสามารถทำแบบทดสอบรอบหลังการอบรมและบันทึกผลได้ครับ'
      );
      return;
    }
    setUserQuizAnswers({});
    setShowOnlineQuizModal(true);
  };

  // Submit Online Web Quiz
  const handleSubmitOnlineQuiz = () => {
    const isSafety = selectedExamType === 'SAFETY_ATTITUDE';
    const bank = isSafety ? SAFETY_ATTITUDE_QUESTIONS_BANK : MASTER_QUESTIONS_BANK;
    const total = bank.length;

    let score = 0;
    const answersDetail = bank.map((q) => {
      const userAns = userQuizAnswers[q.questionNo] || '(ไม่ได้รับคำตอบ)';
      const isCorrect = userAns.trim() === q.correctAnswer.trim();
      if (isCorrect) score++;
      return {
        questionNo: q.questionNo,
        questionText: q.questionText,
        userAnswer: userAns,
        correctAnswer: q.correctAnswer,
        isCorrect,
      };
    });

    const percentage = Math.round((score / total) * 100);
    const isPassed = isSafety ? score >= 12 : score >= 24;

    const newResult: GoogleFormExamResult = {
      id: `web-${currentUser.empCode}-${selectedExamType}-${selectedPhase}-${Date.now()}`,
      attemptNumber: (examResultsMap[currentUser.empCode]?.length || 0) + 1,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      empCode: currentUser.empCode,
      employeeName: currentUser.name,
      department: currentUser.department,
      score,
      totalQuestions: total,
      percentage,
      isPassed,
      answersDetail,
      source: 'ONLINE_WEB',
      examType: selectedExamType,
      phase: selectedPhase,
    };

    const newMap = { ...examResultsMap };
    if (!newMap[currentUser.empCode]) newMap[currentUser.empCode] = [];
    newMap[currentUser.empCode].push(newResult);

    setExamResultsMap(newMap);
    saveExamResultsToLocalStorage(newMap);
    setShowOnlineQuizModal(false);

    setImportStatusMessage(`🎉 บันทึกผลสอบ ${isSafety ? 'ทัศนคติความปลอดภัย' : 'ปฐมนิเทศ'} (${selectedPhase === 'PRE_TEST' ? 'ก่อนอบรม' : 'หลังอบรม'}) เรียบร้อยแล้ว! คะแนน: ${score}/${total} (${percentage}%) - ${isPassed ? 'ผ่านเกณฑ์ ✅' : 'ไม่ผ่านเกณฑ์ ❌'}`);
    setTimeout(() => setImportStatusMessage(null), 6000);
  };

  // Active User Results filtered by current ExamType and Phase
  const allUserResults = getEmployeeExamResults(currentUser.empCode);
  const activeUserHistory = allUserResults.filter((r) => {
    const matchType = (r.examType || 'ORIENTATION') === selectedExamType;
    const matchPhase = (r.phase || 'POST_TEST') === selectedPhase;
    return matchType && matchPhase;
  });
  const activeUserLatest = activeUserHistory.length > 0 ? activeUserHistory[activeUserHistory.length - 1] : null;

  // Pre-Test vs Post-Test Comparison for active user
  const preResult = allUserResults.find((r) => (r.examType || 'ORIENTATION') === selectedExamType && r.phase === 'PRE_TEST');
  const postResult = allUserResults.find((r) => (r.examType || 'ORIENTATION') === selectedExamType && (r.phase === 'POST_TEST' || !r.phase));

  // Filtered employees for Admin Directory
  const filteredEmployees = employees.filter((e) => {
    const matchesDept = selectedDeptFilter === 'ALL' || e.department === selectedDeptFilter;
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.empCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const isSafetySelected = selectedExamType === 'SAFETY_ATTITUDE';
  const totalQuestionsCount = isSafetySelected ? 14 : 30;
  const passCriteriaText = isSafetySelected ? 'เกณฑ์ผ่าน: ผิดไม่เกิน 2 ข้อ (≥ 12/14 ข้อ)' : 'เกณฑ์ผ่าน: 80% ขึ้นไป (≥ 24/30 ข้อ)';

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
          <h1 className="page-title gradient-text">ระบบข้อสอบปฐมนิเทศ & ทัศนคติความปลอดภัย</h1>
          <p className="page-subtitle">
            แบบทดสอบพนักงานใหม่บริษัท COMPLETE AUTO RUBBER MANUFACTURING CO., LTD. (Pre-Test & Post-Test)
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={handleStartOnlineQuiz}
            className="btn btn-primary"
            style={{ borderRadius: 14, padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}
          >
            <BookOpen size={18} /> ทำแบบทดสอบในระบบ (Web Exam)
          </button>

          <a
            href={isSafetySelected ? DEFAULT_SAFETY_FORM_URL : DEFAULT_ORIENTATION_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ borderRadius: 14, padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
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
              onClick={() => setSelectedExamType('ORIENTATION')}
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
              <Award size={18} /> ชุดที่ 2: ประเมินผลการปฐมนิเทศ (30 ข้อ)
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
                {isPreTestClosed ? '🔓 เปิดสอบหลังอบรมแล้ว (Pre-Test ปิดแล้ว)' : '🔒 HR กดปิดสอบก่อนอบรม (เพื่อเปิดสอบหลังอบรม)'}
              </button>
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
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>คะแนนสอบล่าสุด ({activeUserLatest.source === 'ONLINE_WEB' ? 'ระบบเว็บ' : 'Google Forms'})</div>
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
                    คุณทำข้อสอบได้ {activeUserLatest.score}/{activeUserLatest.totalQuestions} ข้อ ({passCriteriaText}) ระบบได้แจ้งเตือน HR เรียบร้อยแล้ว กรุณากดดูข้อที่ตอบผิดเพื่อทบทวน แล้วเข้าทำข้อสอบใหม่ครับ
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
                  <th>🛡️ ทัศนคติความปลอดภัย (14 ข้อ)</th>
                  <th>🏆 ประเมินการปฐมนิเทศ (30 ข้อ)</th>
                  <th>สถานะรวม</th>
                  <th>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => {
                  const allRecords = getEmployeeExamResults(emp.empCode);
                  const safetyRecords = allRecords.filter((r) => r.examType === 'SAFETY_ATTITUDE' || r.totalQuestions === 14);
                  const oriRecords = allRecords.filter((r) => r.examType === 'ORIENTATION' || r.totalQuestions === 30);

                  const safetyPre = safetyRecords.filter((r) => r.phase === 'PRE_TEST').pop();
                  const safetyPost = safetyRecords.filter((r) => r.phase === 'POST_TEST').pop();

                  const oriPre = oriRecords.filter((r) => r.phase === 'PRE_TEST').pop();
                  const oriPost = oriRecords.filter((r) => r.phase === 'POST_TEST').pop();

                  const isSafetyPassed = (safetyPost?.isPassed) || (safetyPre?.isPassed);
                  const isOriPassed = (oriPost?.isPassed) || (oriPre?.isPassed);

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

                      {/* Safety 14Q Score Column */}
                      <td>
                        {safetyPre || safetyPost ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {safetyPre && (
                              <div style={{ fontSize: '0.85rem' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-dim)' }}>Pre: </span>
                                <span style={{ fontWeight: 800, color: safetyPre.isPassed ? '#047857' : '#b91c1c' }}>
                                  {safetyPre.score} / 14 ข้อ
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: 4 }}>({safetyPre.percentage}%)</span>
                              </div>
                            )}
                            {safetyPost && (
                              <div style={{ fontSize: '0.85rem' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-dim)' }}>Post: </span>
                                <span style={{ fontWeight: 800, color: safetyPost.isPassed ? '#047857' : '#b91c1c' }}>
                                  {safetyPost.score} / 14 ข้อ
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: 4 }}>({safetyPost.percentage}%)</span>
                              </div>
                            )}
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>({safetyRecords.length} รอบ)</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>ยังไม่มีข้อมูล (14 ข้อ)</span>
                        )}
                      </td>

                      {/* Orientation 30Q Score Column */}
                      <td>
                        {oriPre || oriPost ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {oriPre && (
                              <div style={{ fontSize: '0.85rem' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-dim)' }}>Pre: </span>
                                <span style={{ fontWeight: 800, color: oriPre.isPassed ? '#047857' : '#b91c1c' }}>
                                  {oriPre.score} / 30 ข้อ
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: 4 }}>({oriPre.percentage}%)</span>
                              </div>
                            )}
                            {oriPost && (
                              <div style={{ fontSize: '0.85rem' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-dim)' }}>Post: </span>
                                <span style={{ fontWeight: 800, color: oriPost.isPassed ? '#047857' : '#b91c1c' }}>
                                  {oriPost.score} / 30 ข้อ
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: 4 }}>({oriPost.percentage}%)</span>
                              </div>
                            )}
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>({oriRecords.length} รอบ)</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>ยังไม่มีข้อมูล (30 ข้อ)</span>
                        )}
                      </td>

                      {/* Overall Status Badge */}
                      <td>
                        {isSafetyPassed && isOriPassed ? (
                          <span className="badge badge-green">PASSED ทั้ง 2 ชุด (ผ่าน)</span>
                        ) : (safetyRecords.length > 0 || oriRecords.length > 0) ? (
                          <span className={`badge ${isSafetyPassed || isOriPassed ? 'badge-amber' : 'badge-red'}`}>
                            {isSafetyPassed || isOriPassed ? 'ผ่าน 1/2 ชุด' : 'FAILED (ต้องสอบใหม่)'}
                          </span>
                        ) : (
                          <span className="badge badge-amber">ยังไม่ได้ทำข้อสอบ</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        {(safetyPost || safetyPre) && (
                          <button
                            className="btn btn-xs btn-secondary"
                            onClick={() => setViewingResult((safetyPost || safetyPre)!)}
                            style={{ borderRadius: 8, padding: '4px 8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            title="ดูคำตอบข้อสอบทัศนคติความปลอดภัย 14 ข้อ"
                          >
                            <Eye size={14} /> เฉลย (14 ข้อ)
                          </button>
                        )}

                        {(oriPost || oriPre) && (
                          <button
                            className="btn btn-xs btn-secondary"
                            onClick={() => setViewingResult((oriPost || oriPre)!)}
                            style={{ borderRadius: 8, padding: '4px 8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            title="ดูคำตอบข้อสอบประเมินการปฐมนิเทศ 30 ข้อ"
                          >
                            <Eye size={14} /> เฉลย (30 ข้อ)
                          </button>
                        )}

                        <button
                          className={`btn btn-xs ${preTestLockMap[emp.empCode]?.[selectedExamType] ? 'btn-secondary' : 'btn-warning'}`}
                          onClick={() => handleTogglePreTestLock(emp.empCode)}
                          style={{ borderRadius: 8, padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="HR สลับสถานะปิดก่อนอบรมเพื่อปลดล็อคการสอบหลังอบรม"
                        >
                          {preTestLockMap[emp.empCode]?.[selectedExamType] ? '🔓 Post-Test เปิด' : '🔒 HR กดปิด Pre-Test'}
                        </button>
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
                    {viewingResult.score} / {viewingResult.totalQuestions} ข้อ ({viewingResult.percentage}%)
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${viewingResult.isPassed ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                    {viewingResult.isPassed ? 'PASSED (ผ่านเกณฑ์)' : 'FAILED (ไม่ผ่านเกณฑ์)'}
                  </span>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {viewingResult.totalQuestions === 14 ? 'เกณฑ์ผ่าน: ผิดไม่เกิน 2 ข้อ (≥ 12/14)' : 'เกณฑ์ผ่านบังคับ: 24 / 30 ข้อขึ้นไป'}
                  </div>
                </div>
              </div>

              {/* HR Diagnostic Banner if Failed */}
              {!viewingResult.isPassed && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: 14, borderRadius: 12, marginBottom: 20, fontSize: '0.88rem' }}>
                  <div style={{ fontWeight: 700, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <AlertTriangle size={16} /> HR Diagnostic Notice: พนักงานตอบผิดทั้งหมด {viewingResult.totalQuestions - viewingResult.score} ข้อ
                  </div>
                  <div style={{ color: 'var(--text-main)', lineHeight: 1.4 }}>
                    กรุณาแนะแนวนโยบายและกฎความปลอดภัยในข้อที่ตอบผิดด้านล่าง จากนั้นแจ้งให้พนักงานเข้าทำข้อสอบใหม่ผ่าน Google Forms ครับ
                  </div>
                </div>
              )}

              {/* Itemized Question Answer Sheet (HR ONLY) */}
              {!isHR ? (
                <div style={{ padding: 24, textAlign: 'center', background: 'rgba(245, 158, 11, 0.08)', borderRadius: 16, border: '1px solid rgba(245, 158, 11, 0.3)', marginTop: 12 }}>
                  <ShieldCheck size={36} className="text-amber" style={{ marginBottom: 10 }} />
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', color: '#b45309', fontWeight: 700 }}>
                    🔒 สิทธิ์การเปิดดูเฉลยและข้อที่ตอบผิดถูกจำกัด
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    ระบบเปิดให้เฉพาะเจ้าหน้าที่ <strong>HR / Admin</strong> เป็นผู้เปิดดูและทบทวนรายละเอียดเฉลยคำตอบเพื่อความสุจริตของแบบทดสอบ<br />
                    หากต้องการทบทวนคำตอบข้อที่สงสัย สามารถติดต่อเจ้าหน้าที่ HR เพื่อขอคำแนะนำเพิ่มเติมได้ครับ
                  </p>
                </div>
              ) : (
                (() => {
                  const detailedAnswers = ensureAnswersDetail(viewingResult);
                  return (
                    <>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>
                        📋 รายการคำตอบและข้อที่ตอบผิด ({detailedAnswers.length} ข้อ):
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {detailedAnswers.map((q, idx) => (
                          <div
                            key={q.questionNo || idx}
                            style={{
                              padding: 14,
                              borderRadius: 12,
                              background: q.isCorrect ? 'rgba(16, 185, 129, 0.04)' : 'rgba(239, 68, 68, 0.05)',
                              border: `1px solid ${q.isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.25)'}`,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                                {q.questionText}
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
                    </>
                  );
                })()
              )}
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
      {/* MODAL 3: Interactive Online Web Quiz Modal */}
      {showOnlineQuizModal && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }}>
          <div className="glass-card modal-container" style={{ maxWidth: 880, width: '94%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isSafetySelected ? 'linear-gradient(135deg, rgba(5, 150, 105, 0.1), rgba(16, 185, 129, 0.05))' : 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(59, 130, 246, 0.05))' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isSafetySelected ? <ShieldCheck size={20} className="text-green" /> : <Award size={20} className="text-blue" />}
                  แบบทดสอบ{isSafetySelected ? 'ทัศนคติเกี่ยวกับความปลอดภัย (14 ข้อ)' : 'ประเมินผลการปฐมนิเทศ (30 ข้อ)'}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  พนักงาน: <strong>{currentUser.name} ({currentUser.empCode})</strong> • รอบ: <span className="badge badge-amber">{selectedPhase === 'PRE_TEST' ? 'ก่อนอบรม (Pre-Test)' : 'หลังอบรม (Post-Test)'}</span> • {passCriteriaText}
                </div>
              </div>

              <button className="btn-icon" onClick={() => setShowOnlineQuizModal(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Questions Body */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {(() => {
                const bank = isSafetySelected ? SAFETY_ATTITUDE_QUESTIONS_BANK : MASTER_QUESTIONS_BANK;
                return bank.map((q) => {
                  const selectedOpt = userQuizAnswers[q.questionNo];
                  return (
                    <div
                      key={q.questionNo}
                      style={{
                        padding: 16,
                        borderRadius: 14,
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: selectedOpt ? '1px solid rgba(37, 99, 235, 0.4)' : '1px solid var(--border-color)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: 12, lineHeight: 1.4 }}>
                        {q.questionText}
                      </div>

                      {/* Option Choices */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(() => {
                          let options: string[] = [];
                          if (isSafetySelected) {
                            options = [
                              q.correctAnswer,
                              q.questionNo === 1 ? 'ลองเปิดสวิทช์เริ่มเดินเครื่องทดสอบด้วยตัวเอง' :
                              q.questionNo === 2 ? 'ตะโกน "หยุด" จากระยะไกลแล้วหัวเราะสนุกสนาน' :
                              q.questionNo === 3 ? 'ทำต่อจนเสร็จยอมอดอาหารกลางวันเพราะกลัวงานไม่เสร็จ' :
                              q.questionNo === 4 ? 'ฝืนยกลังไม้นั้นด้วยตัวเองเพราะไม่อยากให้ผู้จัดการมองว่าอ่อนแอ' :
                              q.questionNo === 5 ? 'รอคนทำความสะอาดมาเจอเองแล้วเดินผ่านไป' :
                              q.questionNo === 6 ? 'พยายามบอกเหตุผลนายจ้างและขอทำความสะอาดหลังจบชิฟท์' :
                              q.questionNo === 7 ? 'รับคำท้าพนันทันทีเพื่อแสดงความแข็งแรง' :
                              q.questionNo === 8 ? 'ทานยาแก้ปวดแล้วปีนขึ้นไปซ่อมไฟต่อให้เสร็จ' :
                              q.questionNo === 9 ? 'แอบจุดสูบบุหรี่ในมุมอับเพราะคนอื่นก็ทำ' :
                              q.questionNo === 10 ? 'ใช้แว่นตาธรรมดาใส่แทนแล้วเทโซดาไฟต่อ' :
                              q.questionNo === 11 ? 'ทำงานด้วยวิธีเดิมต่อเพราะเกรงว่างานจะช้าลง' :
                              q.questionNo === 12 ? 'บอกภรรยาว่าเป็นหน้าที่รับผิดชอบในการดูแลลูก' :
                              q.questionNo === 13 ? 'ไม่เข้าชมภาพยนตร์เพราะถือว่าขับรถเก่งอยู่แล้ว' :
                              'รับงานทันทีเพราะเงินตอบแทนสูง',

                              q.questionNo === 1 ? 'สอบถามเพื่อนพนักงานข้างๆ แล้วเริ่มทำงานทันที' :
                              q.questionNo === 2 ? 'ไม่สนใจอะไรเพราะไม่ใช่เรื่องของเรา' :
                              q.questionNo === 3 ? 'รีบขนของเพิ่มเป็นสองเท่าเพื่อโกงเวลา' :
                              q.questionNo === 4 ? 'ทิ้งลังไม้นั้นไว้อย่างนั้นแล้วเดินหนี' :
                              q.questionNo === 5 ? 'เอาทรายหรือผ้ามาเช็ดบางส่วนแล้วทิ้งไว้' :
                              q.questionNo === 6 ? 'บอกนายจ้างให้เลือกระหว่างผลผลิตหรือความสะอาด' :
                              q.questionNo === 7 ? 'แกล้งทำเป็นเจ็บหลังเพื่อปฏิเสธคำท้า' :
                              q.questionNo === 8 ? 'ฝืนทำงานต่อโดยไม่บอกใคร' :
                              q.questionNo === 9 ? 'จุดสูบบุหรี่แล้วรีบดับทันที' :
                              q.questionNo === 10 ? 'ทำงานด้วยความระมัดระวังเป็นพิเศษโดยไม่ต้องใส่หน้ากาก' :
                              q.questionNo === 11 ? 'ขอเปลี่ยนไปอยู่แผนกอื่น' :
                              q.questionNo === 12 ? 'เตือนลูกให้ระมัดระวังเมื่อเดินขึ้นลงบันได' :
                              q.questionNo === 13 ? 'ไปชมภาพยนตร์เพื่อถือโอกาสพักผ่อนนอนหลับ' :
                              'ลังเลและไม่สามารถตัดสินใจได้',
                            ];

                            // Sort deterministically by string value so correct answer position varies predictably
                            options.sort((a, b) => (a.length % 3) - (b.length % 3));
                          } else {
                            options = [
                              q.correctAnswer,
                              'อุปกรณ์มาตรฐานทั่วไปที่ไม่บังคับใช้ในโรงงาน',
                              'แจ้งผู้รับเหมาภายนอกเข้ามาดำเนินการแทน',
                              'ไม่มีข้อใดถูกต้องตามมาตรฐาน CAR',
                            ];
                          }

                          return options.map((opt, oIdx) => {
                            const isSelected = selectedOpt === opt;
                            return (
                              <label
                                key={oIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  padding: '10px 14px',
                                  borderRadius: 10,
                                  cursor: 'pointer',
                                  background: isSelected ? 'rgba(37, 99, 235, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                                  border: isSelected ? '1px solid rgba(37, 99, 235, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                                  fontSize: '0.88rem',
                                  color: isSelected ? '#3b82f6' : 'var(--text-main)',
                                  fontWeight: isSelected ? 600 : 400,
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`q_${q.questionNo}`}
                                  checked={isSelected}
                                  onChange={() => {
                                    setUserQuizAnswers((prev) => ({
                                      ...prev,
                                      [q.questionNo]: opt,
                                    }));
                                  }}
                                  style={{ accentColor: '#2563eb', width: 16, height: 16 }}
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                ตอบไปแล้ว <strong>{Object.keys(userQuizAnswers).length}</strong> จาก <strong>{totalQuestionsCount}</strong> ข้อ
              </span>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" onClick={() => setShowOnlineQuizModal(false)} style={{ borderRadius: 12, padding: '8px 20px' }}>
                  ยกเลิก
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSubmitOnlineQuiz}
                  disabled={Object.keys(userQuizAnswers).length < totalQuestionsCount}
                  style={{
                    borderRadius: 12,
                    padding: '8px 24px',
                    opacity: Object.keys(userQuizAnswers).length < totalQuestionsCount ? 0.6 : 1,
                  }}
                >
                  ส่งข้อสอบ (Submit Exam)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
