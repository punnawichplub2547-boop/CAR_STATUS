import React from 'react';
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
    <aside className="sidebar glass-card">
      <div className="sidebar-section">
        <div className="section-title">เมนูหลัก (MAIN MENU)</div>
        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
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
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer glass-card">
        <div className="footer-info">
          <Building2 size={16} className="text-blue" />
          <div className="footer-text">
            <span className="company-tag">CAR Co., Ltd.</span>
            <span className="effective-date">Effective: 2026</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
