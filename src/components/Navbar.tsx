import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Bell,
  Search,
  UserCheck,
  Shield,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Moon,
  LogOut,
  RotateCcw,
  KeyRound,
  Award,
  BookOpen,
  X,
} from 'lucide-react';
import type { Employee, Certificate, SkillStandard } from '../types';
import type { NavTab } from './Sidebar';
import type { DynamicNotificationItem } from '../utils/notificationGenerator';
import { ROLE_LABELS, LOGINABLE_ROLES } from '../utils/roleLabels';

interface NavbarProps {
  currentUser: Employee;
  allUsers: Employee[];
  standards?: SkillStandard[];
  certificates?: Certificate[];
  onSwitchUser: (user: Employee) => void;
  notifications: DynamicNotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onNavigate?: (tab: NavTab) => void;
  onSelectEmployeeForPassport?: (emp: Employee) => void;
  onOpenProfile?: () => void;
  onOpenPassport?: () => void;
  onResetDemoData?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  standards = [],
  certificates = [],
  onSwitchUser,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNavigate,
  onSelectEmployeeForPassport,
  onOpenProfile,
  onOpenPassport,
  onResetDemoData,
  onLogout,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const trimmedQuery = searchQuery.trim().toLowerCase();

  const matchedEmployees = useMemo(() => {
    if (!trimmedQuery) return [];
    return allUsers
      .filter(
        (e) =>
          e.name.toLowerCase().includes(trimmedQuery) ||
          e.empCode.toLowerCase().includes(trimmedQuery) ||
          e.department.toLowerCase().includes(trimmedQuery) ||
          e.position.toLowerCase().includes(trimmedQuery)
      )
      .slice(0, 5);
  }, [allUsers, trimmedQuery]);

  const matchedCertificates = useMemo(() => {
    if (!trimmedQuery) return [];
    return certificates
      .filter(
        (c) =>
          c.certName.toLowerCase().includes(trimmedQuery) ||
          c.employeeName.toLowerCase().includes(trimmedQuery) ||
          c.issuingOrg.toLowerCase().includes(trimmedQuery)
      )
      .slice(0, 4);
  }, [certificates, trimmedQuery]);

  const matchedStandards = useMemo(() => {
    if (!trimmedQuery) return [];
    return standards
      .filter(
        (s) =>
          s.skillName.toLowerCase().includes(trimmedQuery) ||
          s.department.toLowerCase().includes(trimmedQuery) ||
          s.category.toLowerCase().includes(trimmedQuery)
      )
      .slice(0, 4);
  }, [standards, trimmedQuery]);

  const hasSearchMatches = matchedEmployees.length > 0 || matchedCertificates.length > 0 || matchedStandards.length > 0;
  const showSearchDropdown = isSearchFocused && trimmedQuery.length > 0;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifMenu(false);
        setShowUserMenu(false);
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="logo-badge" title="Complete Auto Rubber Manufacturing">
          <img src="/CARLOGO.png" alt="CAR Logo" className="logo-img" />
        </div>
        <div className="brand-text">
          <span className="company-name">COMPLETE AUTO RUBBER MANUFACTURING CO., LTD.</span>
          <span className="app-title gradient-text">HR Skill & Competency Platform</span>
        </div>
      </div>

      {/* Global Universal Search */}
      <div className="navbar-search" ref={searchRef} style={{ position: 'relative' }}>
        <Search className="search-icon" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          placeholder="ค้นหาพนักงาน, บัตรทักษะ, ใบเซอร์ หรือหลักสูตร..."
          className="search-input"
          style={{ paddingRight: searchQuery ? 32 : 12 }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={15} />
          </button>
        )}

        {/* Search Results Dropdown */}
        {showSearchDropdown && (
          <div
            className="glass-card"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 14,
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
              maxHeight: 380,
              overflowY: 'auto',
              zIndex: 1100,
              padding: '10px 0',
            }}
          >
            {!hasSearchMatches ? (
              <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                ไม่พบผลการค้นหาสำหรับ "{searchQuery}"
              </div>
            ) : (
              <>
                {/* Employees */}
                {matchedEmployees.length > 0 && (
                  <div>
                    <div
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-dim)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      พนักงาน (Employees) • คลิกเปิดบัตรทักษะ
                    </div>
                    {matchedEmployees.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => {
                          setIsSearchFocused(false);
                          setSearchQuery('');
                          onSelectEmployeeForPassport?.(emp);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 14px',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <img
                          src={emp.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                          alt={emp.name}
                          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {emp.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {emp.empCode} • {emp.department} ({emp.position})
                          </div>
                        </div>
                        <span className="badge badge-purple" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Award size={11} /> บัตรทักษะ
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Certificates */}
                {matchedCertificates.length > 0 && (
                  <div style={{ borderTop: matchedEmployees.length > 0 ? '1px solid var(--border-color)' : 'none', marginTop: 6, paddingTop: 6 }}>
                    <div
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-dim)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      ใบรับรอง & ใบอนุญาต (Certificates)
                    </div>
                    {matchedCertificates.map((cert) => (
                      <div
                        key={cert.id}
                        onClick={() => {
                          setIsSearchFocused(false);
                          setSearchQuery('');
                          onNavigate?.('certificates');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 14px',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Shield size={18} className="text-amber" style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {cert.certName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ผู้ถือ: {cert.employeeName} • หมดอายุ: {cert.expiryDate}
                          </div>
                        </div>
                        <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
                          คลังใบเซอร์ ➔
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Skill Standards */}
                {matchedStandards.length > 0 && (
                  <div style={{ borderTop: (matchedEmployees.length > 0 || matchedCertificates.length > 0) ? '1px solid var(--border-color)' : 'none', marginTop: 6, paddingTop: 6 }}>
                    <div
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-dim)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      มาตรฐานทักษะ (Skill Standards)
                    </div>
                    {matchedStandards.map((std) => (
                      <div
                        key={std.id}
                        onClick={() => {
                          setIsSearchFocused(false);
                          setSearchQuery('');
                          onNavigate?.('skill_standards');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 14px',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <BookOpen size={18} className="text-blue" style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {std.skillName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {std.department} • เป้าหมาย: ระดับ {std.targetLevel}
                          </div>
                        </div>
                        <span className="badge badge-blue" style={{ fontSize: '0.72rem' }}>
                          มาตรฐานทักษะ ➔
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="navbar-actions">
        {/* Reset Demo Data Button */}
        {onResetDemoData && (
          <button
            className="btn btn-sm btn-ghost"
            onClick={onResetDemoData}
            title="รีเซ็ตข้อมูลตัวอย่างกลับเป็นค่าเริ่มต้น (Reset Demo Data)"
            style={{ borderRadius: 12, padding: '8px 12px', color: 'var(--text-muted)' }}
          >
            <RotateCcw size={15} /> รีเซ็ตข้อมูล
          </button>
        )}

        {/* Theme Switcher Button */}
        <button
          className="notif-btn"
          onClick={toggleTheme}
          title={theme === 'light' ? 'สลับเป็น Dark Theme' : 'สลับเป็น Light Theme (สว่าง)'}
          style={{ width: '44px', height: '44px' }}
        >
          {theme === 'light' ? <Moon size={20} className="text-muted" /> : <Sun size={20} style={{ color: '#fbbf24' }} />}
        </button>

        {/* Notification Bell */}
        <div className="notif-wrapper" ref={notifRef}>
          <button
            className="notif-btn"
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowUserMenu(false);
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>

          {showNotifMenu && (
            <div className="notif-dropdown" style={{ width: 340 }}>
              <div className="notif-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem' }}>การแจ้งเตือน (Notifications)</h3>
                  <span className="badge badge-blue" style={{ marginTop: 2 }}>{unreadCount} รายการใหม่</span>
                </div>
                {unreadCount > 0 && onMarkAllNotificationsRead && (
                  <button
                    type="button"
                    onClick={onMarkAllNotificationsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#60a5fa',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      textDecoration: 'underline',
                    }}
                  >
                    อ่านทั้งหมด
                  </button>
                )}
              </div>
              <div className="notif-list" style={{ maxHeight: 360, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div className="notif-empty" style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    ไม่มีรายการแจ้งเตือนในขณะนี้
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item ${!n.read ? 'unread' : ''}`}
                      onClick={() => {
                        onMarkNotificationRead(n.id);
                        if (n.targetTab && onNavigate) {
                          onNavigate(n.targetTab);
                          setShowNotifMenu(false);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="notif-icon">
                        {n.type === 'PROBATION_DUE' ? (
                          <AlertTriangle className="text-amber" size={18} />
                        ) : n.type === 'CERT_EXPIRING' ? (
                          <AlertTriangle className="text-rose" size={18} />
                        ) : (
                          <CheckCircle2 className="text-blue" size={18} />
                        )}
                      </div>
                      <div className="notif-content">
                        <div className="notif-title" style={{ fontWeight: 600, fontSize: '0.88rem' }}>{n.title}</div>
                        <div className="notif-msg" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{n.message}</div>
                        <div className="notif-date" style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>{n.date}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Role Switcher Dropdown */}
        <div className="user-profile-wrapper" ref={userRef}>
          <button
            className="user-profile-btn"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifMenu(false);
            }}
          >
            <img src={currentUser.avatar} alt={currentUser.name} className="user-avatar" />
            <div className="user-info">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role-badge">
                <Shield size={12} /> {ROLE_LABELS[currentUser.role]} ({currentUser.department})
              </span>
            </div>
            <ChevronDown size={16} />
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="dropdown-title">บัญชีผู้ใช้งานปัจจุบัน</div>
              <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{currentUser.name}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {currentUser.empCode} • {currentUser.department}
                    </div>
                  </div>
                  <span className={`badge ${currentUser.role === 'ADMIN' ? 'badge-purple' : currentUser.role === 'SUPERVISOR' ? 'badge-blue' : 'badge-amber'}`} style={{ fontSize: '0.7rem' }}>
                    {currentUser.role}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
                  {onOpenProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenProfile();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                        padding: '6px 8px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        borderRadius: 7,
                        color: '#60a5fa',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                      title="ข้อมูลส่วนตัว & เปลี่ยนรหัสผ่าน"
                    >
                      <KeyRound size={13} /> โปรไฟล์
                    </button>
                  )}
                  {onOpenPassport && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenPassport();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                        padding: '6px 8px',
                        background: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.25)',
                        borderRadius: 7,
                        color: '#a78bfa',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                      title="ดูบัตรทักษะความสามารถพนักงาน (Skill Passport)"
                    >
                      <Award size={13} /> บัตรทักษะ
                    </button>
                  )}
                </div>
              </div>

              <div className="dropdown-title" style={{ marginTop: 6, marginBottom: 6, fontSize: '0.75rem' }}>
                สลับผู้ใช้งาน (Switch Role Demo)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {allUsers.filter((u) => LOGINABLE_ROLES.includes(u.role)).map((u) => (
                  <div
                    key={u.id}
                    className={`user-option ${u.id === currentUser.id ? 'active' : ''}`}
                    style={{ padding: '6px 8px', borderRadius: 8 }}
                    onClick={() => {
                      onSwitchUser(u);
                      setShowUserMenu(false);
                    }}
                  >
                    <img src={u.avatar} alt={u.name} className="opt-avatar" style={{ width: 28, height: 28, borderRadius: 6 }} />
                    <div className="opt-info">
                      <span className="opt-name" style={{ fontSize: '0.82rem' }}>{u.name}</span>
                      <span className="opt-role" style={{ fontSize: '0.7rem' }}>
                        {ROLE_LABELS[u.role]} - {u.position}
                      </span>
                    </div>
                    {u.id === currentUser.id && <UserCheck size={14} className="text-blue" />}
                  </div>
                ))}
              </div>

              {onLogout && (
                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '7px 12px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 8,
                      color: '#f87171',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                    }}
                  >
                    <LogOut size={14} /> ออกจากระบบ (Logout)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
