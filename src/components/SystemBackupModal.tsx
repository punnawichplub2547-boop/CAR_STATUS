import React, { useState, useRef } from 'react';
import { Download, Upload, Database, CheckCircle2, AlertTriangle, X, ShieldAlert, FileJson } from 'lucide-react';
import type { Employee } from '../types';
import { syncLocalStorageEmployeesToBackend } from '../utils/api';

interface SystemBackupModalProps {
  currentUser: Employee;
  onClose: () => void;
  onRestoreSuccess?: () => void;
}

interface BackupPayload {
  version: string;
  system: string;
  exportedAt: string;
  exportedBy: string;
  data: Record<string, any>;
}

export const SystemBackupModal: React.FC<SystemBackupModalProps> = ({
  currentUser,
  onClose,
  onRestoreSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>('backup');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportBackup = () => {
    try {
      setIsProcessing(true);
      const backupKeys = [
        'hrskill_employees',
        'hrskill_certificates',
        'hrskill_skill_standards',
        'hrskill_skill_evaluations',
        'hrskill_skill_evaluation_rounds',
        'hrskill_ojt_sessions',
        'hrskill_ojt_content_items',
        'hrskill_ojt_participants',
        'hrskill_probation_evaluations',
        'hrskill_exam_submissions',
        'hrskill_orientation_batches',
        'hrskill_org_chart_nodes',
        'hrskill_exam_pre_test_locks',
      ];

      const dump: Record<string, any> = {};
      for (const key of backupKeys) {
        const val = localStorage.getItem(key);
        if (val) {
          try {
            dump[key] = JSON.parse(val);
          } catch {
            dump[key] = val;
          }
        }
      }

      const backupObject: BackupPayload = {
        version: '1.0.0',
        system: 'CAR_STATUS_HR_SKILL_MATRIX',
        exportedAt: new Date().toISOString(),
        exportedBy: `${currentUser.name} (${currentUser.empCode})`,
        data: dump,
      };

      const jsonStr = JSON.stringify(backupObject, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `CAR_STATUS_BACKUP_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage({
        type: 'success',
        text: `ดาวน์โหลดไฟล์สำรองข้อมูลสำเร็จ (ส่งออกทั้งหมด ${Object.keys(dump).length} หมวดข้อมูล)`,
      });
    } catch (err) {
      console.error('Export backup failed:', err);
      setStatusMessage({
        type: 'error',
        text: `ส่งออกข้อมูลไม่สำเร็จ: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed: BackupPayload = JSON.parse(text);

        if (!parsed.system?.includes('CAR_STATUS') || !parsed.data) {
          throw new Error('โครงสร้างไฟล์ไม่ถูกต้องหรือไม่ใช่ไฟล์สำรองของระบบ CAR HR Skill Matrix');
        }

        const confirmRestore = window.confirm(
          `⚠️ ยืนยันการกู้คืนข้อมูลระบบหรือไม่?\n\nไฟล์สำรองเมื่อ: ${new Date(parsed.exportedAt).toLocaleString('th-TH')}\nผู้ส่งออก: ${parsed.exportedBy}\n\n* ข้อมูลปัจจุบันในระบบจะถูกแทนที่ด้วยข้อมูลจากไฟล์สำรองนี้`
        );

        if (!confirmRestore) {
          setIsProcessing(false);
          return;
        }

        // Restore keys to localStorage
        let restoredCount = 0;
        for (const [key, value] of Object.entries(parsed.data)) {
          if (typeof value === 'object') {
            localStorage.setItem(key, JSON.stringify(value));
          } else {
            localStorage.setItem(key, String(value));
          }
          restoredCount++;
        }

        // Auto background sync employees to MySQL
        await syncLocalStorageEmployeesToBackend().catch(() => {});

        setStatusMessage({
          type: 'success',
          text: `กู้คืนข้อมูลสำเร็จ (${restoredCount} หมวดข้อมูล) — ระบบจะรีเฟรชหน้าจอเพื่อนำข้อมูลใหม่มาแสดง`,
        });

        setTimeout(() => {
          if (onRestoreSuccess) {
            onRestoreSuccess();
          } else {
            window.location.reload();
          }
        }, 1200);
      } catch (err) {
        console.error('Restore error:', err);
        setStatusMessage({
          type: 'error',
          text: `กู้คืนข้อมูลไม่สำเร็จ: ${err instanceof Error ? err.message : 'ไฟล์ JSON เสียหายหรือไม่ถูกต้อง'}`,
        });
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database size={22} className="text-blue" />
            <h3>ระบบสำรองและกู้คืนข้อมูล (System Backup & Restore)</h3>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose} style={{ padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Tab Selection */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'backup' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('backup')}
            >
              <Download size={16} /> ส่งออกไฟล์สำรอง (Backup)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'restore' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('restore')}
            >
              <Upload size={16} /> กู้คืนข้อมูล (Restore)
            </button>
          </div>

          {statusMessage && (
            <div
              className="glass-card"
              style={{
                padding: '12px 16px',
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.86rem',
                borderLeft: `4px solid ${
                  statusMessage.type === 'success'
                    ? 'var(--success)'
                    : statusMessage.type === 'error'
                    ? 'var(--danger)'
                    : 'var(--primary)'
                }`,
              }}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 size={18} className="text-green" />
              ) : (
                <AlertTriangle size={18} className="text-amber" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {activeTab === 'backup' ? (
            <div>
              <div
                className="glass-card"
                style={{
                  padding: 20,
                  marginBottom: 16,
                  background: 'rgba(59, 130, 246, 0.04)',
                  borderColor: 'rgba(59, 130, 246, 0.2)',
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <FileJson size={32} className="text-blue" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.96rem', color: 'var(--text-main)' }}>
                      ดาวน์โหลดข้อมูลทั้งหมดของระบบ (Complete Snapshot)
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                      ไฟล์สำรองจะรวมข้อมูลพนักงาน, มาตรฐานทักษะ (F-HR-005), ประวัติการประเมิน OJT (Form A/B), ผลประเมินทดลองงาน (Form 009), ใบรับรอง Certificate และผลการสอบทั้งหมด
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleExportBackup}
                  disabled={isProcessing}
                  style={{ gap: 8, padding: '10px 20px' }}
                >
                  <Download size={18} />
                  {isProcessing ? 'กำลังส่งออกข้อมูล...' : 'ดาวน์โหลดไฟล์สำรอง (.json)'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div
                className="glass-card"
                style={{
                  padding: 16,
                  marginBottom: 16,
                  background: 'rgba(239, 68, 68, 0.05)',
                  borderColor: 'rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  gap: 10,
                }}
              >
                <ShieldAlert size={22} className="text-red" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  <strong style={{ color: 'var(--danger)' }}>คำเตือน:</strong> การกู้คืนข้อมูลจะเขียนทับข้อมูลที่มีอยู่ในเบราว์เซอร์ปัจจุบันด้วยข้อมูลจากไฟล์สำรอง กรุณาตรวจสอบให้แน่ใจว่าไฟล์ที่นำมาใช้เป็นไฟล์สำรองที่ถูกต้อง
                </div>
              </div>

              <div
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 14,
                  padding: '30px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.02)',
                  transition: 'border-color 0.2s',
                }}
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
                <Upload size={36} className="text-blue" style={{ margin: '0 auto 10px auto', opacity: 0.85 }} />
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  คลิกเพื่อเลือกไฟล์สำรอง (.json)
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {isProcessing ? 'กำลังอ่านและตรวจสอบไฟล์สำรอง...' : 'ไฟล์ CAR_STATUS_BACKUP_*.json'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
