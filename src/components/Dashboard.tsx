import React from 'react';
import {
  Users,
  Clock,
  Award,
  AlertTriangle,
  Target,
  TrendingUp,
  FileCheck2,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import type { Employee, Certificate } from '../types';

interface DashboardProps {
  employees: Employee[];
  certificates: Certificate[];
  onNavigate: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  employees,
  certificates,
  onNavigate,
}) => {
  const probationCount = employees.filter((e) => e.status === 'PROBATION').length;
  const expiringCertsCount = certificates.filter(
    (c) => c.status === 'EXPIRING_SOON' || c.status === 'EXPIRED'
  ).length;

  // Chart Data: Training Hours by Month
  const trainingChartData = [
    { month: 'ม.ค.', hours: 42 },
    { month: 'ก.พ.', hours: 38 },
    { month: 'มี.ค.', hours: 54 },
    { month: 'เม.ย.', hours: 30 },
    { month: 'พ.ค.', hours: 48 },
    { month: 'มิ.ย.', hours: 62 },
    { month: 'ก.ค.', hours: 75 },
  ];

  // Radar Chart Data: Average Skill Level vs Target
  const skillRadarData = [
    { category: 'ฉีดอัดยาง', Target: 75, Actual: 60 },
    { category: 'ตกแต่ง Part', Target: 75, Actual: 75 },
    { category: 'ประกอบชิ้นงาน', Target: 50, Actual: 50 },
    { category: 'บันทึกรายงาน', Target: 75, Actual: 65 },
    { category: 'ความปลอดภัย CCCF', Target: 100, Actual: 95 },
    { category: 'ระบบ ERP', Target: 50, Actual: 40 },
  ];

  return (
    <div className="dashboard-page content-container">
      <div className="page-header">
        <div>
          <div className="eyebrow-tag">
            <LayoutDashboard size={14} /> EXECUTIVE DASHBOARD • ภาพรวมทักษะและการฝึกอบรม
          </div>
          <h1 className="page-title gradient-text">Executive Dashboard</h1>
          <p className="page-subtitle">
            ระบบบริหารจัดการทักษะและการฝึกอบรมพนักงาน บจก. คอมพลีท โอโต รับเบอร์ แมนูแฟ็คเจอริ่ง (CAR)
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => onNavigate('audit')}>
            <ShieldCheck size={18} /> Export ISO/IATF Audit Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-cols-4" style={{ marginBottom: 24 }}>
        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper icon-blue">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{employees.length}</span>
            <span className="stat-label">พนักงานทั้งหมด</span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper icon-amber">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{probationCount} คน</span>
            <span className="stat-label">พนักงานทดลองงาน (Probation)</span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper icon-emerald">
            <Award size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">349 hrs</span>
            <span className="stat-label">ชั่วโมงอบรมสะสมประจำปี</span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper icon-rose">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{expiringCertsCount} ใบ</span>
            <span className="stat-label">Certificate ใกล้หมดอายุ</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid-cols-2" style={{ marginBottom: 24 }}>
        {/* Radar Chart: Skill Gap Overview */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.05rem' }}>ภาพรวม Competency Radar Chart</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                เปรียบเทียบ Target (มาตรฐาน) vs Actual (ทักษะจริง) แผนก FMG-A
              </span>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => onNavigate('skill_matrix')}>
              <Target size={14} /> ดูรายละเอียด
            </button>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={skillRadarData}>
                <PolarGrid stroke="rgba(255,255,255,0.15)" />
                <PolarAngleAxis dataKey="category" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" />
                <Radar
                  name="Target (เป้าหมาย)"
                  dataKey="Target"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.25}
                />
                <Radar
                  name="Actual (ผลจริง)"
                  dataKey="Actual"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.4}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Training Hours */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.05rem' }}>ชั่วโมงการฝึกอบรมสะสมประจำเดือน</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                รายงานชั่วโมงอบรมรวมทุกแผนก (เป้าหมาย 50 hrs/เดือน)
              </span>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => onNavigate('training')}>
              <TrendingUp size={14} /> ดูตารางอบรม
            </button>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trainingChartData}>
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="hours" name="ชั่วโมงอบรม (Hrs)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Action Center & Recent Notifications */}
      <div className="grid-cols-2">
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} className="text-amber" /> รายการที่ต้องดำเนินการ (Action Center)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              className="glass-card glass-card-interactive"
              style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              onClick={() => onNavigate('evaluations')}
            >
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  ประเมินผลทดลองงาน (30 วัน): นาย สุริยา มารานนท์
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  ครบกำหนดวันที่ 22/07/2026 • แผนก FMG-A
                </div>
              </div>
              <span className="badge badge-amber">ทำแบบประเมิน F-HR-009</span>
            </div>

            <div
              className="glass-card glass-card-interactive"
              style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              onClick={() => onNavigate('certificates')}
            >
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  ใบรับรอง จป.วิชาชีพ หมดอายุใน 24 วัน
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  น.ส. พิชญดา อึ้งพยัคฆ์เดช • หมดอายุ 15/08/2026
                </div>
              </div>
              <span className="badge badge-red">แจ้งเตือนต่ออายุ</span>
            </div>

            <div
              className="glass-card glass-card-interactive"
              style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              onClick={() => onNavigate('skill_matrix')}
            >
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  ประเมิน Skill Matrix ประจำรอบ กรกฎาคม 2026
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  เปิดให้ประเมินทักษะพนักงานประจำปี (F-HR-014)
                </div>
              </div>
              <span className="badge badge-blue">เข้าสู่ Skill Matrix</span>
            </div>
          </div>
        </div>

        {/* Quick Shortcut Buttons */}
        <div className="glass-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: 16 }}>เมนูด่วน (Quick Shortcuts)</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <button
              className="btn btn-secondary"
              style={{ padding: 16, justifyContent: 'flex-start', textAlign: 'left', height: '100%' }}
              onClick={() => onNavigate('exam')}
            >
              <FileCheck2 size={24} className="text-purple" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>ข้อสอบปฐมนิเทศ</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>30 ข้อ เกณฑ์ผ่าน 80%</div>
              </div>
            </button>

            <button
              className="btn btn-secondary"
              style={{ padding: 16, justifyContent: 'flex-start', textAlign: 'left', height: '100%' }}
              onClick={() => onNavigate('evaluations')}
            >
              <FileCheck2 size={24} className="text-blue" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>ฟอร์มประเมิน OJT (A/B)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>บันทึกเกณฑ์ % 0-100%</div>
              </div>
            </button>

            <button
              className="btn btn-secondary"
              style={{ padding: 16, justifyContent: 'flex-start', textAlign: 'left', height: '100%' }}
              onClick={() => onNavigate('certificates')}
            >
              <Award size={24} className="text-amber" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>อัปโหลด Certificate</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>คลังใบรับรองพนักงาน</div>
              </div>
            </button>

            <button
              className="btn btn-secondary"
              style={{ padding: 16, justifyContent: 'flex-start', textAlign: 'left', height: '100%' }}
              onClick={() => onNavigate('audit')}
            >
              <ShieldCheck size={24} className="text-emerald" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>รายงาน Audit ISO/IATF</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>1-Click Export PDF/Excel</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
