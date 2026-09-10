import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Check, LogIn, Shield, UserCheck, AlertCircle, Loader2, Server, Sparkles } from 'lucide-react';
import type { Employee } from '../types';
import { ROLE_LABELS, LOGINABLE_ROLES } from '../utils/roleLabels';
import { loginApi } from '../utils/api';

interface LoginViewProps {
  onLoginSuccess: (user: Employee) => void;
  employees: Employee[];
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, employees }) => {
  const [authMode, setAuthMode] = useState<'demo' | 'production'>(() => {
    return (localStorage.getItem('hrskill_auth_mode') as 'demo' | 'production') || 'demo';
  });

  const [email, setEmail] = useState(() => (authMode === 'demo' ? 'somying.j@example.com' : ''));
  const [password, setPassword] = useState(() => (authMode === 'demo' ? 'admin1234' : ''));
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loginAlert, setLoginAlert] = useState<string | null>(null);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  const handleModeChange = (mode: 'demo' | 'production') => {
    setAuthMode(mode);
    localStorage.setItem('hrskill_auth_mode', mode);
    setErrorAlert(null);
    if (mode === 'demo') {
      setEmail('somying.j@example.com');
      setPassword('admin1234');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const performLogin = async (identifier: string, pass: string) => {
    setErrorAlert(null);
    setIsLoading(true);

    try {
      const res = await loginApi(identifier, pass);
      const backendUser = res.user;

      // Reconcile with local employees array for enriched data (e.g. supervisorName)
      const matched =
        employees.find((e) => e.empCode === backendUser.empCode) ||
        ({
          id: String(backendUser.id),
          empCode: backendUser.empCode,
          name: backendUser.name,
          email: backendUser.email || undefined,
          department: backendUser.department,
          section: backendUser.section || undefined,
          position: backendUser.position,
          startingDate: backendUser.startingDate.slice(0, 10),
          status: backendUser.status as any,
          orientationPassed: backendUser.orientationPassed,
          role: backendUser.role as any,
          avatar: backendUser.avatar || undefined,
          supervisorId: backendUser.supervisorId ? String(backendUser.supervisorId) : undefined,
        } as Employee);

      setLoginAlert(`เข้าสู่ระบบสำเร็จ: ${matched.name} (${ROLE_LABELS[matched.role] || matched.role})`);
      setTimeout(() => {
        onLoginSuccess(matched);
        setLoginAlert(null);
        setIsLoading(false);
      }, 500);
    } catch (err: any) {
      // If backend is offline, provide graceful fallback check
      const cleanInput = identifier.trim().toLowerCase();
      const localMatched = employees.find(
        (u) =>
          u.email?.trim().toLowerCase() === cleanInput ||
          u.empCode.trim().toLowerCase() === cleanInput
      );

      if (localMatched && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        setLoginAlert(`เข้าสู่ระบบสำเร็จ (ออฟไลน์โหมด): ${localMatched.name} (${localMatched.role})`);
        setTimeout(() => {
          onLoginSuccess(localMatched);
          setLoginAlert(null);
          setIsLoading(false);
        }, 500);
        return;
      }

      setErrorAlert(err.message || 'ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบข้อมูล');
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(email, password);
  };

  const handleQuickDemoLogin = (user: Employee) => {
    const defaultPassword =
      user.role === 'ADMIN'
        ? 'admin1234'
        : user.role === 'HR'
        ? 'hr1234'
        : user.role === 'SUPERVISOR'
        ? 'super1234'
        : 'emp1234';

    setEmail(user.email || user.empCode);
    setPassword(defaultPassword);
    performLogin(user.email || user.empCode, defaultPassword);
  };

  return (
    <div className="login-modal-overlay">
      {/* Full-bleed background photo */}
      <img
        src="/assets/building.jpg"
        alt="CAR Building Background"
        className="login-bg-img"
        onError={(e) => {
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

      {/* Centered Glass Login Card */}
      <div className="login-glass-card">
        <div className="login-card-header">
          <div className="login-logo-pop">
            <img src="/assets/car-logo.png" alt="CAR Logo" />
          </div>
          <div className="login-eyebrow">Skill Management Portal</div>
          <h1 className="login-title">เข้าสู่ระบบ</h1>
        </div>

        {/* Mode Switcher Toggle */}
        <div className="login-mode-toggle">
          <button
            type="button"
            className={`login-mode-tab ${authMode === 'production' ? 'active' : ''}`}
            onClick={() => handleModeChange('production')}
          >
            <Server size={15} /> โหมดใช้งานจริง (Production)
          </button>
          <button
            type="button"
            className={`login-mode-tab demo-tab ${authMode === 'demo' ? 'active demo-active' : ''}`}
            onClick={() => handleModeChange('demo')}
          >
            <Sparkles size={15} /> โหมดทดสอบ (Demo)
          </button>
        </div>

        <div className="login-mode-desc">
          {authMode === 'production'
            ? '🏢 โหมดจริง: เข้าสู่ระบบด้วยรหัสพนักงาน/อีเมล และรหัสผ่านส่วนบุคคล'
            : '🧪 โหมดทดสอบ: สลับดูมุมมองผู้ใช้แต่ละบทบาท (Admin, HR, Supervisor, พนักงาน) ได้ในคลิกเดียว'}
        </div>

        {errorAlert && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#dc2626',
              fontSize: '0.88rem',
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{errorAlert}</div>
          </div>
        )}

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
                placeholder={authMode === 'production' ? 'เช่น EMP-001 หรือ user@car.co.th' : 'name@example.com หรือ รหัสพนักงาน'}
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
                placeholder={authMode === 'production' ? 'รหัสผ่านประจำตัว' : '••••••••'}
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
            <a
              href="#forgot"
              onClick={(e) => {
                e.preventDefault();
                alert(
                  authMode === 'production'
                    ? 'กรุณาติดต่อฝ่ายทรัพยากรบุคคล (HR) หรือ IT เพื่อขอรีเซ็ตรหัสผ่าน'
                    : 'ระบบทดสอบ: กรุณาใช้ปุ่ม Quick Demo ด้านล่างเพื่อทดลองเข้าใช้งาน'
                );
              }}
              className="forgot-link"
            >
              ลืมรหัสผ่าน?
            </a>
          </div>

          <button type="submit" className="login-submit-btn" disabled={isLoading}>
            <span className="btn-sheen"></span>
            {isLoading ? (
              <>
                <Loader2 size={20} className="spin" /> กำลังเข้าสู่ระบบ...
              </>
            ) : (
              <>
                <LogIn size={20} /> เข้าสู่ระบบ (Login)
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Roles Section - Shown in Demo Mode */}
        {authMode === 'demo' && (
          <div className="demo-roles-container">
            <div className="demo-roles-title">
              <Shield size={14} /> คลิกสลับสิทธิ์ทดลองเข้าใช้งาน (Quick Demo Accounts):
            </div>
            <div className="demo-user-list">
              {LOGINABLE_ROLES.map((r) => employees.find((u) => u.role === r))
                .filter((u): u is Employee => Boolean(u))
                .map((u) => {
                const roleClass =
                  u.role === 'ADMIN'
                    ? 'role-admin'
                    : u.role === 'HR'
                    ? 'role-hr'
                    : u.role === 'SUPERVISOR'
                    ? 'role-supervisor'
                    : 'role-operator';
                const roleLabel = ROLE_LABELS[u.role] || u.role;

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
                      <span className="demo-role">
                        {u.empCode} • {u.department} ({u.position})
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Status Badge */}
      <div className="login-footer-status">
        <span className="status-pill">
          <span className="status-dot"></span>
          {authMode === 'production' ? 'ระบบพร้อมใช้งาน (Production Online)' : 'โหมดสาธิตและทดสอบ (Demo Mode)'} · ISO 9001 & IATF 16949 Certified
        </span>
      </div>
    </div>
  );
};
