import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, ExternalLink, Printer, ShieldCheck, Award, Download, RefreshCw } from 'lucide-react';
import { DEFAULT_SAFETY_FORM_URL, DEFAULT_ORIENTATION_FORM_URL } from '../../services/googleFormSync';

interface ExamQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  url?: string;
  passCriteriaText?: string;
  isSafety?: boolean;
}

export const ExamQrModal: React.FC<ExamQrModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  url,
  passCriteriaText,
  isSafety = true,
}) => {
  // Tab state: 'SAFETY' (14 ข้อ) or 'ORIENTATION' (30 ข้อ)
  const [activeTab, setActiveTab] = useState<'SAFETY' | 'ORIENTATION'>(isSafety ? 'SAFETY' : 'ORIENTATION');
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState<Record<string, boolean>>({});
  const [generatedQr, setGeneratedQr] = useState<Record<string, string>>({});

  // Sync tab with isSafety prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(isSafety ? 'SAFETY' : 'ORIENTATION');
      setCopied(false);
    }
  }, [isOpen, isSafety]);

  // Current tab metadata
  const isCurrentSafety = activeTab === 'SAFETY';
  const currentUrl = isCurrentSafety
    ? (url && isSafety ? url : DEFAULT_SAFETY_FORM_URL)
    : (url && !isSafety ? url : DEFAULT_ORIENTATION_FORM_URL);

  const currentTitle = isCurrentSafety
    ? 'แบบทดสอบทัศนคติความปลอดภัย (14 ข้อ)'
    : 'แบบทดสอบประเมินผลการปฐมนิเทศ (30 ข้อ)';

  const currentCriteria = isCurrentSafety
    ? 'เกณฑ์ผ่าน: ผิดไม่เกิน 2 ข้อ (≥ 12/14 ข้อ)'
    : 'เกณฑ์ผ่าน: 80% ขึ้นไป (≥ 24/30 ข้อ)';

  const currentQrImage = isCurrentSafety ? '/qrpic/14kor.png' : '/qrpic/30kor.png';
  const currentFileName = isCurrentSafety ? 'QR_Safety_14ข้อ.png' : 'QR_Orientation_30ข้อ.png';

  // Generate dynamic QR fallback if image fails
  useEffect(() => {
    if (!isOpen) return;

    ['SAFETY', 'ORIENTATION'].forEach((type) => {
      const targetUrl = type === 'SAFETY' ? DEFAULT_SAFETY_FORM_URL : DEFAULT_ORIENTATION_FORM_URL;
      QRCode.toDataURL(targetUrl, {
        width: 320,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
        .then((dataUrl) => {
          setGeneratedQr((prev) => ({ ...prev, [type]: dataUrl }));
        })
        .catch((err) => console.error('Failed to generate fallback QR:', err));
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = !imgError[activeTab] ? currentQrImage : (generatedQr[activeTab] || currentQrImage);
    link.download = currentFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: 1200 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-card modal-container"
        style={{
          maxWidth: 'min(540px, 94vw)',
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          textAlign: 'center',
          overflow: 'hidden',
          borderRadius: 24,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          boxSizing: 'border-box',
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
            background: isCurrentSafety
              ? 'linear-gradient(135deg, rgba(5, 150, 105, 0.12), rgba(16, 185, 129, 0.05))'
              : 'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(59, 130, 246, 0.05))',
            transition: 'background 0.3s ease',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
              {isCurrentSafety ? (
                <ShieldCheck size={22} className="text-green" style={{ color: '#10b981' }} />
              ) : (
                <Award size={22} className="text-blue" style={{ color: '#3b82f6' }} />
              )}
              {title || currentTitle}
            </h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {subtitle || 'สแกน QR Code ด้วยกล้องมือถือเพื่อเข้าทำแบบทดสอบ (Google Forms)'}
            </div>
          </div>

          <button className="btn-icon" onClick={onClose} style={{ borderRadius: '50%', width: 36, height: 36 }}>
            <X size={20} />
          </button>
        </div>

        {/* Exam Type Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-card-secondary)',
            padding: '8px 16px',
            gap: 10,
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <button
            onClick={() => setActiveTab('SAFETY')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 12,
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: activeTab === 'SAFETY' ? '1px solid #10b981' : '1px solid transparent',
              background: activeTab === 'SAFETY' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
              color: activeTab === 'SAFETY' ? '#ffffff' : 'var(--text-muted)',
              boxShadow: activeTab === 'SAFETY' ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <ShieldCheck size={16} /> ความปลอดภัย (14 ข้อ)
          </button>

          <button
            onClick={() => setActiveTab('ORIENTATION')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 12,
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: activeTab === 'ORIENTATION' ? '1px solid #3b82f6' : '1px solid transparent',
              background: activeTab === 'ORIENTATION' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
              color: activeTab === 'ORIENTATION' ? '#ffffff' : 'var(--text-muted)',
              boxShadow: activeTab === 'ORIENTATION' ? '0 4px 12px rgba(59, 130, 246, 0.25)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Award size={16} /> ปฐมนิเทศ (30 ข้อ)
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Badge */}
          <div
            style={{
              fontSize: '0.84rem',
              fontWeight: 700,
              color: isCurrentSafety ? '#047857' : '#1d4ed8',
              background: isCurrentSafety ? 'rgba(16, 185, 129, 0.12)' : 'rgba(37, 99, 235, 0.12)',
              padding: '6px 16px',
              borderRadius: 20,
              marginBottom: 16,
              border: `1px solid ${isCurrentSafety ? 'rgba(16, 185, 129, 0.3)' : 'rgba(37, 99, 235, 0.3)'}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>📋</span> {passCriteriaText && (!title || title.includes(isCurrentSafety ? '14' : '30')) ? passCriteriaText : currentCriteria}
          </div>

          {/* QR Code Container */}
          <div
            style={{
              background: '#ffffff',
              padding: 16,
              borderRadius: 20,
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              border: '2px solid rgba(226, 232, 240, 0.8)',
              position: 'relative',
            }}
          >
            {!imgError[activeTab] ? (
              <img
                src={currentQrImage}
                alt={`QR Code ${currentTitle}`}
                onError={() => setImgError((prev) => ({ ...prev, [activeTab]: true }))}
                style={{
                  width: 230,
                  height: 230,
                  objectFit: 'contain',
                  display: 'block',
                  borderRadius: 10,
                }}
              />
            ) : generatedQr[activeTab] ? (
              <img
                src={generatedQr[activeTab]}
                alt={`QR Code ${currentTitle} (Generated)`}
                style={{ width: 230, height: 230, display: 'block', borderRadius: 10 }}
              />
            ) : (
              <div style={{ width: 230, height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <RefreshCw className="animate-spin" size={24} />
              </div>
            )}

            <div style={{ marginTop: 8, fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
              {isCurrentSafety ? '14kor.png (Safety Attitude)' : '30kor.png (Orientation Evaluation)'}
            </div>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
            📱 ผู้เข้าอบรมสามารถเปิด <strong>แอปกล้องถ่ายรูป (Camera)</strong> บนมือถือ<br />
            แล้วสแกนภาพ QR Code ด้านบนเพื่อเข้าทำแบบทดสอบได้ทันที
          </p>

          {/* URL Box & Copy */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg-card-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
              padding: '8px 12px',
              width: '100%',
              maxWidth: 460,
              marginBottom: 16,
            }}
          >
            <input
              type="text"
              readOnly
              value={currentUrl}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                flex: 1,
                outline: 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            />
            <button
              className="btn btn-xs btn-secondary"
              onClick={handleCopy}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 8, padding: '5px 12px', fontSize: '0.78rem', flexShrink: 0 }}
            >
              {copied ? <Check size={14} className="text-green" style={{ color: '#10b981' }} /> : <Copy size={14} />}
              {copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
            </button>
          </div>

          {/* Direct Link & Action buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{
                borderRadius: 10,
                padding: '8px 16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                textDecoration: 'none',
                background: isCurrentSafety ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
              }}
            >
              <ExternalLink size={16} /> เปิด Google Forms
            </a>

            <button
              onClick={handleDownload}
              className="btn btn-secondary btn-sm"
              style={{ borderRadius: 10, padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={16} /> บันทึกรูป QR
            </button>

            <button
              onClick={handlePrint}
              className="btn btn-secondary btn-sm"
              style={{ borderRadius: 10, padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Printer size={16} /> พิมพ์ใบ QR Code
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', textAlign: 'right', background: 'var(--bg-card-secondary)' }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ borderRadius: 10, padding: '6px 20px', fontWeight: 600 }}>
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
