import React, { useState, useEffect } from 'react';
import { Bell, Search, UserCheck, Shield, ChevronDown, CheckCircle2, AlertTriangle, Sun, Moon } from 'lucide-react';
import type { Employee, NotificationItem } from '../types';

interface NavbarProps {
  currentUser: Employee;
  allUsers: Employee[];
  onSwitchUser: (user: Employee) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  notifications,
  onMarkNotificationRead,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="logo-badge">CAR</div>
        <div className="brand-text">
          <span className="company-name">บจก. คอมพลีท โอโต รับเบอร์ แมนูแฟ็คเจอริ่ง</span>
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
        <div className="notif-wrapper">
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
            <div className="notif-dropdown glass-card">
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
        <div className="user-profile-wrapper">
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
            <div className="user-dropdown glass-card">
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
