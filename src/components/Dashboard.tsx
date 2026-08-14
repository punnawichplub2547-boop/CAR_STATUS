import React, { useState } from 'react';
import {
  Users,
  Clock,
  Award,
  AlertTriangle,
  TrendingUp,
  FileCheck2,
  ShieldCheck,
  LayoutDashboard,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Filter,
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
  Legend,
} from 'recharts';
import type { Employee, Certificate } from '../types';
import type { NavTab } from './Sidebar';
import { computeCertificateStatus } from '../utils/certificateStatus';

interface DashboardProps {
  employees: Employee[];
  certificates: Certificate[];
  onNavigate: (tab: NavTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  employees,
  certificates,
  onNavigate,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('FMG-A');

  const probationCount = employees.filter((e) => e.status === 'PROBATION').length;
  const expiringCertsCount = certificates.filter((c) => {
    const status = computeCertificateStatus(c.expiryDate);
    return status === 'EXPIRING_SOON' || status === 'EXPIRED';
  }).length;

  // Department-specific Radar Chart Data
  const radarDataByDept: Record<string, Array<{ category: string; Target: number; Actual: number }>> = {
    'FMG-A': [
      { category: 'ฉีดอัดยาง', Target: 75, Actual: 60 },
      { category: 'ตกแต่ง Part', Target: 75, Actual: 75 },
      { category: 'ประกอบชิ้นงาน', Target: 50, Actual: 50 },
      { category: 'บันทึกรายงาน', Target: 75, Actual: 65 },
      { category: 'ความปลอดภัย CCCF', Target: 100, Actual: 95 },
      { category: 'ระบบ ERP', Target: 50, Actual: 40 },
    ],
    'FMG-B': [
      { category: 'ฉีดอัดยาง', Target: 75, Actual: 75 },
      { category: 'ตกแต่ง Part', Target: 100, Actual: 85 },
      { category: 'ประกอบชิ้นงาน', Target: 75, Actual: 70 },
      { category: 'บันทึกรายงาน', Target: 50, Actual: 50 },
      { category: 'ความปลอดภัย CCCF', Target: 100, Actual: 100 },
      { category: 'ระบบ ERP', Target: 50, Actual: 45 },
    ],
    'QA/QC': [
      { category: 'ตรวจสอบมิติ', Target: 100, Actual: 90 },
      { category: 'ใช้ Vernier/Caliper', Target: 100, Actual: 100 },
      { category: 'เกณฑ์รับ/ปฏิเสธ', Target: 100, Actual: 95 },
      { category: 'บันทึกสถิติ Cpk', Target: 75, Actual: 75 },
      { category: 'ความปลอดภัย CCCF', Target: 100, Actual: 100 },
      { category: 'ระบบ ERP', Target: 75, Actual: 60 },
    ],
    'Maintenance': [
      { category: 'PM เครื่องฉีด', Target: 100, Actual: 85 },
      { category: 'ซ่อมบำรุงไฟฟ้า', Target: 75, Actual: 75 },
      { category: 'ระบบไฮดรอลิก', Target: 100, Actual: 90 },
      { category: 'วิเคราะห์ 5G/5Why', Target: 75, Actual: 70 },
      { category: 'ความปลอดภัย CCCF', Target: 100, Actual: 100 },
      { category: 'ระบบ ERP', Target: 75, Actual: 65 },
    ],
  };

  const currentRadarData = radarDataByDept[selectedDept] || radarDataByDept['FMG-A'];

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

  return (
    <div className="dashboard-page content-container">
      {/* ISO Audit Readiness Banner */}
      <div
        className="glass-card"
        style={{
          padding: '20px 24px',
          marginBottom: 24,
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(124, 58, 237, 0.06))',
          borderColor: 'rgba(59, 130, 246, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(16, 185, 129, 0.35)',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                IATF 16949 / ISO 9001 Audit Readiness: <span style={{ color: '#059669' }}>96.8% Complete</span>
              </h3>
              <span className="badge badge-green">
                <CheckCircle2 size={13} /> Ready for Audit
              </span>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: 4 }}>
              เอกสาร F-HR-005, F-HR-014 (Skill Matrix), และ F-HR-016 (OJT) พร้อมสำหรับการตรวจสอบมาตรฐานสากล
            </p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigate('audit')}>
          <Sparkles size={16} /> ออกเอกสาร Audit ทันที <ArrowUpRight size={16} />
        </button>
      </div>

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
        {/* Radar Chart: Skill Gap Overview with Interactive Dept Switcher */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.05rem' }}>ภาพรวม Competency Radar Chart</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                เปรียบเทียบ Target (มาตรฐาน) vs Actual (ทักษะจริง) ประจำแผนก {selectedDept}
              </span>
            </div>

            {/* Department Filter Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Filter size={13} style={{ color: 'var(--text-dim)' }} />
              {['FMG-A', 'FMG-B', 'QA/QC', 'Maintenance'].map((dept) => (
                <button
                  key={dept}
                  className={`btn btn-sm ${selectedDept === dept ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  onClick={() => setSelectedDept(dept)}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={currentRadarData}>
                <PolarGrid stroke="var(--border-color)" />
                <PolarAngleAxis
                  dataKey="category"
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 11, fill: 'var(--text-main)', fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  stroke="var(--text-dim)"
                  tick={{ fill: 'var(--text-dim)', fontSize: 10 }}
                />
                <Radar
                  name="Target (เป้าหมาย)"
                  dataKey="Target"
                  stroke="#2563eb"
                  fill="#3b82f6"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Radar
                  name="Actual (ผลจริง)"
                  dataKey="Actual"
                  stroke="#059669"
                  fill="#10b981"
                  fillOpacity={0.5}
                  strokeWidth={2.5}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 10,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    color: 'var(--text-main)',
                  }}
                />
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
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    color: 'var(--text-main)',
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
                  ประเมินผลทดลองงาน (30 วัน): นาย ประเสริฐ ยิ้มแย้ม
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
                  น.ส. วรรณา สุขเจริญ • หมดอายุ 15/08/2026
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
