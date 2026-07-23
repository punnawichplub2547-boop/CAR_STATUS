import React, { useState, useEffect } from 'react';
import { FileCheck2, Clock, CheckCircle2, AlertTriangle, Trophy, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { ExamQuestion, Employee, ExamSubmission } from '../types';

interface ExamEngineProps {
  questions: ExamQuestion[];
  currentUser: Employee;
  onSaveSubmission: (sub: ExamSubmission) => void;
}

export const ExamEngine: React.FC<ExamEngineProps> = ({
  questions,
  currentUser,
  onSaveSubmission,
}) => {
  const [examStarted, setExamStarted] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(20 * 60); // 20 mins
  const [finalScore, setFinalScore] = useState(0);
  const [finalPercentage, setFinalPercentage] = useState(0);

  // Timer countdown
  useEffect(() => {
    let timer: any = null;
    if (examStarted && !examCompleted && timeLeftSeconds > 0) {
      timer = setInterval(() => {
        setTimeLeftSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timeLeftSeconds === 0 && examStarted && !examCompleted) {
      handleSubmitExam();
    }
    return () => clearInterval(timer);
  }, [examStarted, examCompleted, timeLeftSeconds]);

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: optionIdx,
    });
  };

  const handleSubmitExam = () => {
    let correctCount = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const pct = Math.round((correctCount / questions.length) * 100);
    setFinalScore(correctCount);
    setFinalPercentage(pct);
    setExamCompleted(true);

    const isPassed = pct >= 80;

    if (isPassed) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    const sub: ExamSubmission = {
      id: `sub-${Date.now()}`,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      score: correctCount,
      totalQuestions: questions.length,
      percentage: pct,
      isPassed,
      timeTakenMinutes: Math.ceil((20 * 60 - timeLeftSeconds) / 60),
      submittedAt: new Date().toLocaleString(),
    };
    onSaveSubmission(sub);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="exam-page">
      <div className="page-header">
        <div>
          <h1 className="page-title gradient-text">ระบบแบบทดสอบปฐมนิเทศพนักงานใหม่ออนไลน์</h1>
          <p className="page-subtitle">
            แบบทดสอบกฎระเบียบข้อบังคับ และความปลอดภัย อาชีวอนามัย (เกณฑ์ผ่าน $\ge 80\%$)
          </p>
        </div>
      </div>

      {!examStarted && !examCompleted ? (
        /* Exam Intro Card */
        <div className="glass-card" style={{ padding: 32, maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <Trophy size={48} className="text-purple" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: '1.4rem', marginBottom: 12 }}>
            คำชี้แจงการทำแบบทดสอบปฐมนิเทศ (กระดาษคำตอบ Digital Form)
          </h2>

          <div
            style={{
              textAlign: 'left',
              background: 'rgba(255,255,255,0.03)',
              padding: 20,
              borderRadius: 12,
              marginBottom: 24,
              fontSize: '0.9rem',
              lineHeight: 1.6,
            }}
          >
            <div>• <strong>ผู้ทำข้อสอบ:</strong> {currentUser.name} ({currentUser.empCode})</div>
            <div>• <strong>ตำแหน่ง / แผนก:</strong> {currentUser.position} ({currentUser.department})</div>
            <div>• <strong>หัวข้อข้อสอบ:</strong> กฎระเบียบข้อบังคับ, ความปลอดภัย CCCF, ISO 14001 / IATF 16949</div>
            <div>• <strong>จำนวนข้อสอบ:</strong> {questions.length} ข้อ | <strong>เวลาในการทำ:</strong> 20 นาที</div>
            <div>• <strong style={{ color: 'var(--success)' }}>เกณฑ์การผ่าน:</strong> ต้องได้คะแนน $\ge 80\%$ ขึ้นไป</div>
          </div>

          <button
            className="btn btn-primary"
            style={{ padding: '14px 28px', fontSize: '1.05rem' }}
            onClick={() => setExamStarted(true)}
          >
            <FileCheck2 size={20} /> เริ่มทำแบบทดสอบปฐมนิเทศ
          </button>
        </div>
      ) : examStarted && !examCompleted ? (
        /* Exam In Progress */
        <div className="glass-card" style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
          {/* Sticky Timer Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: 16,
              marginBottom: 20,
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ทำข้อสอบสำหรับ: {currentUser.name}</div>
              <h3 style={{ fontSize: '1.1rem' }}>แบบทดสอบประเมินผลการปฐมนิเทศ (CAR Orientation Exam)</h3>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 10,
                color: '#f87171',
                fontWeight: 700,
                fontSize: '1.1rem',
              }}
            >
              <Clock size={18} /> {formatTime(timeLeftSeconds)}
            </div>
          </div>

          {/* Question List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 30 }}>
            {questions.map((q, idx) => (
              <div key={q.id} className="glass-card" style={{ padding: 18, background: 'rgba(15,23,42,0.6)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>
                  ข้อที่ {idx + 1} / {questions.length} • หมวด: {q.category}
                </div>

                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 14 }}>{q.question}</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[q.id] === optIdx;
                    return (
                      <div
                        key={optIdx}
                        className={`glass-card glass-card-interactive ${isSelected ? 'active' : ''}`}
                        style={{
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          fontSize: '0.9rem',
                          border: isSelected ? '2px solid var(--primary)' : undefined,
                          background: isSelected ? 'rgba(59, 130, 246, 0.15)' : undefined,
                        }}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        {opt}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-success" style={{ padding: '12px 24px' }} onClick={handleSubmitExam}>
              <CheckCircle2 size={18} /> ส่งข้อสอบปฐมนิเทศ
            </button>
          </div>
        </div>
      ) : (
        /* Exam Results Screen */
        <div className="glass-card" style={{ padding: 32, maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          {finalPercentage >= 80 ? (
            <>
              <CheckCircle2 size={64} className="text-emerald" style={{ marginBottom: 16 }} />
              <h2 className="gradient-text-emerald" style={{ fontSize: '1.8rem', marginBottom: 8 }}>
                ยินดีด้วย! สอบผ่านเกณฑ์ปฐมนิเทศ
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                คุณสอบได้คะแนน {finalScore} จาก {questions.length} ข้อ คิดเป็น {finalPercentage}% (เกณฑ์ผ่าน $\ge 80\%$)
              </p>
            </>
          ) : (
            <>
              <AlertTriangle size={64} className="text-rose" style={{ marginBottom: 16 }} />
              <h2 style={{ fontSize: '1.8rem', color: 'var(--danger)', marginBottom: 8 }}>
                ไม่ผ่านเกณฑ์การทดสอบปฐมนิเทศ
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                คุณสอบได้คะแนน {finalScore} จาก {questions.length} ข้อ คิดเป็น {finalPercentage}% (ต้องได้ 80% ขึ้นไป)
              </p>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setExamStarted(false);
                setExamCompleted(false);
                setSelectedAnswers({});
              }}
            >
              <RefreshCw size={16} /> ทำแบบทดสอบอีกครั้ง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
