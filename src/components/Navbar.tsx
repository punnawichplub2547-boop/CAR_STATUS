import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, UserCheck, Shield, ChevronDown, CheckCircle2, AlertTriangle, Sun, Moon, LogIn, RotateCcw } from 'lucide-react';
import type { Employee, NotificationItem } from '../types';

interface NavbarProps {
  currentUser: Employee;
  allUsers: Employee[];
  onSwitchUser: (user: Employee) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onOpenLoginTest?: () => void;
  onResetDemoData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  notifications,
  onMarkNotificationRead,
  onOpenLoginTest,
  onResetDemoData,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

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
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifMenu(false);
        setShowUserMenu(false);
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
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
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

      <div className="navbar-search">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          placeholder="ค้นหาพนักงาน, หลักสูตรอบรม, ทักษะ หรือ Certificate..."
          className="search-input"
        />
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

        {/* Test Login Screen Trigger */}
        {onOpenLoginTest && (
          <button
            className="btn btn-sm btn-secondary"
            onClick={onOpenLoginTest}
            title="ทดสอบหน้าต่างเข้าสู่ระบบ (Demo Login Screen)"
            style={{ borderRadius: 12, padding: '8px 14px' }}
          >
            <LogIn size={16} /> ทดสอบหน้า Login
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
            <div className="notif-dropdown">
              <div className="notif-header">
                <h3>การแจ้งเตือน (Notifications)</h3>
                <span className="badge badge-blue">{unreadCount} รายการใหม่</span>
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">ไม่มีรายการแจ้งเตือน</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item ${!n.read ? 'unread' : ''}`}
                      onClick={() => onMarkNotificationRead(n.id)}
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
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-msg">{n.message}</div>
                        <div className="notif-date">{n.date}</div>
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
                <Shield size={12} /> {currentUser.role} ({currentUser.department})
              </span>
            </div>
            <ChevronDown size={16} />
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="dropdown-title">สลับผู้ใช้งาน (Switch Role Demo)</div>
              {allUsers.map((u) => (
                <div
                  key={u.id}
                  className={`user-option ${u.id === currentUser.id ? 'active' : ''}`}
                  onClick={() => {
                    onSwitchUser(u);
                    setShowUserMenu(false);
                  }}
                >
                  <img src={u.avatar} alt={u.name} className="opt-avatar" />
                  <div className="opt-info">
                    <span className="opt-name">{u.name}</span>
                    <span className="opt-role">
                      {u.role} - {u.position}
                    </span>
                  </div>
                  {u.id === currentUser.id && <UserCheck size={16} className="text-blue" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
