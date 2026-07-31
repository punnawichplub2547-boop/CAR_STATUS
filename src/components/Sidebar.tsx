import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  Target,
  Award,
  FileCheck2,
  FileSpreadsheet,
  Building2,
  ChevronLeft,
  ShieldCheck,
  FileText,
  CheckCircle2,
  X,
  Info,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'employees'
  | 'training'
  | 'evaluations'
  | 'skill_matrix'
  | 'certificates'
  | 'exam'
  | 'audit';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  expiringCertsCount: number;
  probationCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  expiringCertsCount,
  probationCount,
}) => {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('hrskill_sidebarCollapsed') === '1');
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      collapsed ? 'var(--sidebar-width-collapsed)' : '270px'
    );
    localStorage.setItem('hrskill_sidebarCollapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'employees',
      label: 'ข้อมูลพนักงาน & ผังองค์กร',
      icon: Users,
      badge: null,
    },
    {
      id: 'training',
      label: 'บันทึกการอบรม (F-HR-002)',
      icon: GraduationCap,
      badge: null,
    },
    {
      id: 'evaluations',
      label: 'ประเมิน OJT & ทดลองงาน',
      icon: ClipboardCheck,
      badge: probationCount > 0 ? `${probationCount} งาน` : null,
      badgeColor: 'badge-amber',
    },
    {
      id: 'skill_matrix',
      label: 'Skill Matrix & Gap (F-HR-014)',
      icon: Target,
      badge: 'รอบ ก.ค.',
      badgeColor: 'badge-blue',
    },
    {
      id: 'certificates',
      label: 'คลังใบรับรอง (Certificates)',
      icon: Award,
      badge: expiringCertsCount > 0 ? `${expiringCertsCount} เตือน` : null,
      badgeColor: 'badge-red',
    },
    {
      id: 'exam',
      label: 'ข้อสอบปฐมนิเทศออนไลน์',
      icon: FileCheck2,
      badge: '30 ข้อ',
      badgeColor: 'badge-purple',
    },
    {
      id: 'audit',
      label: 'รายงาน Audit (ISO/IATF)',
      icon: FileSpreadsheet,
      badge: '1-Click',
      badgeColor: 'badge-green',
    },
  ];

  return (
    <>
      <aside className={`sidebar glass-card ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-section">
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
          >
            <ChevronLeft size={16} />
          </button>
          <div className="section-title">เมนูหลัก (MAIN MENU)</div>
          <nav className="nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div className="nav-item-wrap" key={item.id}>
                  <button
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => onTabChange(item.id as NavTab)}
                  >
                    <Icon size={18} className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                    {item.badge && (
                      <span className={`badge ${item.badgeColor || 'badge-blue'} nav-badge`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                  <div className="nav-tooltip">
                    {item.label}
                    {item.badge && (
                      <span className={`badge ${item.badgeColor || 'badge-blue'}`} style={{ fontSize: '0.68rem' }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        <div
          className="sidebar-footer glass-card glass-card-interactive"
          onClick={() => setShowCompanyModal(true)}
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          title="คลิกเพื่อดูข้อมูลองค์กรและมาตรฐานระบบคุณภาพ ISO/IATF"
        >
          <div className="footer-info">
            <Building2 size={16} className="text-blue" />
            <div className="footer-text">
              <span className="company-tag">CAR Co., Ltd.</span>
              <span className="effective-date" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Info size={11} /> Effective: 2026
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Company Profile & ISO Standards Master Modal */}
      {showCompanyModal && (
        <div className="modal-overlay" onClick={() => setShowCompanyModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: 640, width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: 'var(--primary-gradient)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)',
                  }}
                >
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>
                    บจก. คอมพลีท โอโต รับเบอร์ แมนูแฟ็คเจอริ่ง
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Complete Auto Rubber Manufacturing Co., Ltd. (CAR)
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowCompanyModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Certified Standards Badges */}
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>
                  มาตรฐานระบบคุณภาพที่ได้รับการรับรอง (CERTIFIED STANDARDS)
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="badge badge-green" style={{ padding: '6px 14px', fontSize: '0.88rem' }}>
                    <ShieldCheck size={14} /> IATF 16949:2016
                  </span>
                  <span className="badge badge-blue" style={{ padding: '6px 14px', fontSize: '0.88rem' }}>
                    <ShieldCheck size={14} /> ISO 9001:2015
                  </span>
                  <span className="badge badge-purple" style={{ padding: '6px 14px', fontSize: '0.88rem' }}>
                    <ShieldCheck size={14} /> ISO 14001:2015
                  </span>
                </div>
              </div>

              {/* Quality Policy Statement */}
              <div
                className="glass-card"
                style={{
                  padding: 16,
                  background: 'rgba(59, 130, 246, 0.06)',
                  borderColor: 'rgba(59, 130, 246, 0.2)',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>
                  นโยบายคุณภาพและสิ่งแวดล้อม (Quality & Environmental Policy)
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  "มุ่งมั่นผลิตชิ้นส่วนยางยานยนต์คุณภาพสูง ส่งมอบตรงเวลา ปฏิบัติตามข้อกำหนดสากล และพัฒนาทักษะสมรรถนะบุคลากรอย่างต่อเนื่อง"
                </p>
              </div>

              {/* Form Master Registry */}
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase' }}>
                  ทะเบียนแบบฟอร์มเอกสารควบคุมในระบบ (DOCUMENT CONTROL MASTER)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="glass-card" style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FileText size={18} className="text-blue" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>F-HR-005 (Rev.4)</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ตารางกำหนดมาตรฐานทักษะพนักงานประจำตำแหน่ง</div>
                      </div>
                    </div>
                    <span className="badge badge-blue">Skill Standard</span>
                  </div>

                  <div className="glass-card" style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FileText size={18} className="text-purple" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>F-HR-014 (Rev.4)</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>แบบประเมินทักษะความสามารถพนักงานประจำรอบ 6 เดือน</div>
                      </div>
                    </div>
                    <span className="badge badge-purple">Skill Matrix</span>
                  </div>

                  <div className="glass-card" style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FileText size={18} className="text-amber" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>F-HR-016 Form A/B (Rev.3)</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>แบบประเมิน OJT พนักงานใหม่ & ย้ายงาน (4M1E)</div>
                      </div>
                    </div>
                    <span className="badge badge-amber">OJT Form A/B</span>
                  </div>

                  <div className="glass-card" style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FileText size={18} className="text-green" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>F-HR-002 (Rev.6)</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ใบบันทึกรายชื่อผู้เข้ารับการฝึกอบรมประจำปี</div>
                      </div>
                    </div>
                    <span className="badge badge-green">Training Log</span>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-dim)', paddingTop: 10, borderTop: '1px solid var(--border-color)' }}>
                <span>HR Skill Management Platform v2.4</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#059669', fontWeight: 600 }}>
                  <CheckCircle2 size={13} /> Active System Status
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCompanyModal(false)}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

