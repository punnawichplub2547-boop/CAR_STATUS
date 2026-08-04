import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Check, LogIn, X, Shield, UserCheck } from 'lucide-react';
import type { Employee } from '../types';

interface TestLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: Employee) => void;
  allUsers: Employee[];
}

export const TestLoginModal: React.FC<TestLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  allUsers,
}) => {
  const [email, setEmail] = useState('somying.j@example.com');
  const [password, setPassword] = useState('demo1234');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginAlert, setLoginAlert] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Test login logic: find matching user or default to first user
    const matchedUser = allUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() || u.empCode === email
    ) || allUsers[0];

    setLoginAlert(`เข้าสู่ระบบสำเร็จในชื่อ: ${matchedUser.name} (${matchedUser.role})`);
    setTimeout(() => {
      onLoginSuccess(matchedUser);
      onClose();
      setLoginAlert(null);
    }, 800);
  };

  const handleQuickDemoLogin = (user: Employee) => {
    setEmail(user.email);
    setPassword('••••••••');
    setLoginAlert(`เข้าสู่ระบบสำเร็จ: ${user.name} (${user.role})`);
    setTimeout(() => {
      onLoginSuccess(user);
      onClose();
      setLoginAlert(null);
    }, 700);
  };

  return (
    <div className="login-modal-overlay">
      {/* Full-bleed background photo */}
      <img
        src="/assets/building.jpg"
        alt="CAR Building Background"
        className="login-bg-img"
        onError={(e) => {
          // fallback if image not found
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
      <div className="login-bg-overlay"></div>

      {/* Top-Left Brand Corner Badge */}
      <div className="login-brand-header">
        <div className="login-brand-logo">
          <img src="/assets/car-logo.png" alt="CAR Logo" />
        </div>
        <div className="login-brand-text">
          <span className="brand-title">COMPLETE AUTO RUBBER MANUFACTURING CO., LTD.</span>
          <span className="brand-subtitle">Skill Management & Orientation System</span>
        </div>
      </div>

      {/* Top-Right Exit Button */}
      <button className="login-close-btn" onClick={onClose} title="ปิดหน้าต่างทดสอบ">
        <X size={18} /> ปิดหน้าต่างทดสอบ
      </button>

      {/* Centered Glass Login Card */}
      <div className="login-glass-card">
        <div className="login-card-header">
          <div className="login-eyebrow">Skill Management Portal</div>
          <h1 className="login-title">เข้าสู่ระบบ</h1>
        </div>

        {loginAlert && (
          <div className="login-alert-success">
            <UserCheck size={18} /> {loginAlert}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="login-form">
          <div className="login-field">
            <label>อีเมล หรือ รหัสพนักงาน</label>
            <div className="login-input-wrapper">
              <Mail className="field-icon" size={18} />
              <input
                type="text"
                placeholder="name@example.com หรือ รหัสพนักงาน"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label>รหัสผ่าน</label>
            <div className="login-input-wrapper">
              <Lock className="field-icon" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-pw-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="login-options">
            <label className="remember-checkbox" onClick={() => setRememberMe(!rememberMe)}>
              <span className={`custom-check ${rememberMe ? 'checked' : ''}`}>
                {rememberMe && <Check size={13} strokeWidth={3} />}
              </span>
              <span>จดจำการเข้าสู่ระบบ</span>
            </label>
            <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('ระบบทดสอบ: กรุณาใช้ปุ่ม Quick Demo ด้านล่างเพื่อทดลองเข้าใช้งาน'); }} className="forgot-link">
              ลืมรหัสผ่าน?
            </a>
          </div>

          <button type="submit" className="login-submit-btn">
            <span className="btn-sheen"></span>
            <LogIn size={20} /> เข้าสู่ระบบ (Login)
          </button>
        </form>

        {/* Quick Demo Roles Section */}
        <div className="demo-roles-container">
          <div className="demo-roles-title">
            <Shield size={14} /> คลิกสลับสิทธิ์ทดลองเข้าใช้งาน (Quick Demo Accounts):
          </div>
          <div className="demo-user-list">
            {allUsers.slice(0, 3).map((u) => {
              const roleClass = u.role === 'ADMIN' ? 'role-admin' : u.role === 'SUPERVISOR' ? 'role-supervisor' : 'role-operator';
              const roleLabel = u.role === 'ADMIN' ? 'ADMIN (ผู้ดูแล)' : u.role === 'SUPERVISOR' ? 'SUPERVISOR (หัวหน้า)' : 'OPERATOR (พนักงาน)';

              return (
                <button
                  key={u.id}
                  type="button"
                  className="demo-user-btn"
                  onClick={() => handleQuickDemoLogin(u)}
                >
                  <img src={u.avatar} alt={u.name} className="demo-avatar" />
                  <div className="demo-user-info" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="demo-name">{u.name}</span>
                      <span className={`role-pill ${roleClass}`}>{roleLabel}</span>
                    </div>
                    <span className="demo-role">{u.empCode} • {u.department} ({u.position})</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Status Badge */}
      <div className="login-footer-status">
        <span className="status-pill">
          <span className="status-dot"></span>
          ระบบพร้อมใช้งาน · ISO 9001 & IATF 16949 Certified
        </span>
      </div>
    </div>
  );
};
