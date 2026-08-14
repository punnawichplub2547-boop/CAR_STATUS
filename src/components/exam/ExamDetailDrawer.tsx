import React from 'react';
import { Sparkles, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { GoogleFormExamResult } from '../../types';
import { ensureAnswersDetail } from '../../services/googleFormSync';

interface ExamDetailDrawerProps {
  result: GoogleFormExamResult | null;
  onClose: () => void;
  isHR: boolean;
}

export const ExamDetailDrawer: React.FC<ExamDetailDrawerProps> = ({
  result,
  onClose,
  isHR,
}) => {
  if (!result) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div
        className="glass-card modal-container"
        style={{
          maxWidth: 840,
          width: '92%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} className="text-blue" /> รายละเอียดผลสอบ Google Forms - {result.employeeName} ({result.empCode})
            </h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
              การสอบรอบที่ {result.attemptNumber} • ส่งเมื่อ {result.submittedAt}
            </div>
          </div>

          <button className="btn-icon" onClick={onClose}>
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
              background: result.isPassed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: `1px solid ${result.isPassed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              padding: 16,
              borderRadius: 14,
              marginBottom: 20,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ผลสรุปคะแนนสอบ</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: result.isPassed ? '#047857' : '#b91c1c' }}>
                {result.score} / {result.totalQuestions} ข้อ ({result.percentage}%)
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span className={`badge ${result.isPassed ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
                {result.isPassed ? 'PASSED (ผ่านเกณฑ์)' : 'FAILED (ไม่ผ่านเกณฑ์)'}
              </span>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {result.totalQuestions === 14 ? 'เกณฑ์ผ่าน: ผิดไม่เกิน 2 ข้อ (≥ 12/14)' : 'เกณฑ์ผ่านบังคับ: 24 / 30 ข้อขึ้นไป'}
              </div>
            </div>
          </div>

          {/* HR Diagnostic Banner if Failed */}
          {!result.isPassed && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: 14, borderRadius: 12, marginBottom: 20, fontSize: '0.88rem' }}>
              <div style={{ fontWeight: 700, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <AlertTriangle size={16} /> HR Diagnostic Notice: พนักงานตอบผิดทั้งหมด {result.totalQuestions - result.score} ข้อ
              </div>
              <div style={{ color: 'var(--text-main)', lineHeight: 1.4 }}>
                กรุณาแนะแนวนโยบายและกฎความปลอดภัยในข้อที่ตอบผิดด้านล่าง จากนั้นแจ้งให้พนักงานเข้าทำข้อสอบใหม่ผ่าน Google Forms ครับ
              </div>
            </div>
          )}

          {/* Itemized Question Answer Sheet (HR ONLY GATE) */}
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
              const detailedAnswers = ensureAnswersDetail(result);
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
          <button className="btn btn-secondary" onClick={onClose} style={{ borderRadius: 12, padding: '8px 20px' }}>
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
