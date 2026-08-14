import React, { useState } from 'react';
import { Settings, X, Check, Copy } from 'lucide-react';
import { getSampleGoogleAppsScriptCode } from '../../services/googleFormSync';

interface ExamConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  googleFormUrl: string;
  setGoogleFormUrl: (url: string) => void;
  appsScriptUrl: string;
  setAppsScriptUrl: (url: string) => void;
}

export const ExamConfigModal: React.FC<ExamConfigModalProps> = ({
  isOpen,
  onClose,
  googleFormUrl,
  setGoogleFormUrl,
  appsScriptUrl,
  setAppsScriptUrl,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getSampleGoogleAppsScriptCode());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div
        className="glass-card modal-container"
        style={{
          maxWidth: 700,
          width: '92%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={18} className="text-blue" /> ตั้งค่าการเชื่อมต่อ Google Forms API
          </h3>
          <button className="btn-icon" onClick={onClose}>
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

            <pre
              style={{
                margin: 0,
                padding: 10,
                background: '#1e293b',
                borderRadius: 8,
                maxHeight: 180,
                overflowY: 'auto',
                fontFamily: 'monospace',
              }}
            >
              {getSampleGoogleAppsScriptCode()}
            </pre>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', textAlign: 'right' }}>
          <button className="btn btn-primary" onClick={onClose} style={{ borderRadius: 12, padding: '8px 20px' }}>
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </div>
  );
};
