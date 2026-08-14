import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, ExternalLink, Printer, ShieldCheck, Award } from 'lucide-react';

interface ExamQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  url: string;
  passCriteriaText: string;
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
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !url) return;

    QRCode.toDataURL(url, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch((err) => console.error('Failed to generate QR Code:', err));
  }, [isOpen, url]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div
        className="glass-card modal-container"
        style={{
          maxWidth: 520,
          width: '92%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          textAlign: 'center',
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
            background: isSafety
              ? 'linear-gradient(135deg, rgba(5, 150, 105, 0.1), rgba(16, 185, 129, 0.05))'
              : 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(59, 130, 246, 0.05))',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              {isSafety ? <ShieldCheck size={20} className="text-green" /> : <Award size={20} className="text-blue" />}
              {title}
            </h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {subtitle || 'สแกน QR Code ด้วยกล้องมือถือเพื่อเข้าทำแบบทดสอบ'}
            </div>
          </div>

          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Badge */}
          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: isSafety ? '#047857' : '#1d4ed8',
              background: isSafety ? 'rgba(16, 185, 129, 0.1)' : 'rgba(37, 99, 235, 0.1)',
              padding: '6px 14px',
              borderRadius: 20,
              marginBottom: 16,
              border: `1px solid ${isSafety ? 'rgba(16, 185, 129, 0.25)' : 'rgba(37, 99, 235, 0.25)'}`,
            }}
          >
            📋 {passCriteriaText}
          </div>

          {/* QR Code Container */}
          <div
            style={{
              background: '#ffffff',
              padding: 16,
              borderRadius: 18,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code สำหรับทำแบบทดสอบ"
                style={{ width: 220, height: 220, display: 'block', borderRadius: 8 }}
              />
            ) : (
              <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                กำลังสร้าง QR Code...
              </div>
            )}
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
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
              maxWidth: 440,
              marginBottom: 16,
            }}
          >
            <input
              type="text"
              readOnly
              value={url}
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
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 8, padding: '4px 10px', fontSize: '0.78rem', flexShrink: 0 }}
            >
              {copied ? <Check size={14} className="text-green" /> : <Copy size={14} />}
              {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
            </button>
          </div>

          {/* Direct Link & Action buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{ borderRadius: 10, padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              <ExternalLink size={16} /> เปิดฟอร์มในเบราว์เซอร์
            </a>
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
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', textAlign: 'right' }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ borderRadius: 10, padding: '6px 18px' }}>
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
