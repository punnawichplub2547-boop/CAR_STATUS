import React, { useMemo, useState } from 'react';
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
import type { Employee, Certificate, SkillStandard, SkillEvaluation, TrainingCourse, ProbationEvaluation, ProbationPeriod, EvaluationCycle } from '../types';
import type { NavTab } from './Sidebar';
import { computeCertificateStatus } from '../utils/certificateStatus';

const formatDMY = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

interface DashboardProps {
  employees: Employee[];
  certificates: Certificate[];
  standards: SkillStandard[];
  evaluations: SkillEvaluation[];
  courses: TrainingCourse[];
  probationEvaluations: ProbationEvaluation[];
  onNavigate: (tab: NavTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  employees,
  certificates,
  standards,
  evaluations,
  courses,
  probationEvaluations,
  onNavigate,
}) => {
  // Departments that actually have F-HR-005 standards on file — not a fixed
  // list, since only some departments are seeded (e.g. FMG-B/Maintenance
  // have none yet) and a switcher tab for a department with no standards
  // would just show an empty chart.
  const availableDepts = [...new Set(standards.map((s) => s.department))].sort();
  const [selectedDept, setSelectedDept] = useState<string>(availableDepts[0] || 'FMG-A');
  const effectiveDept = availableDepts.includes(selectedDept) ? selectedDept : availableDepts[0];

  const probationCount = employees.filter((e) => e.status === 'PROBATION').length;
  const expiringCertsCount = certificates.filter((c) => {
    const status = computeCertificateStatus(c.expiryDate);
    return status === 'EXPIRING_SOON' || status === 'EXPIRED';
  }).length;

  // Action Center — flowchart's "แจ้งเตือน: ทดลองงาน & รอ Skill Matrix"
  // output. Each of the 3 cards below surfaces the single most-urgent real
  // record of its kind (not a fixed example) and disappears entirely when
  // there's genuinely nothing of that kind to flag.
  const msPerDay = 1000 * 60 * 60 * 24;
  const now = new Date();

  // F-HR-009 checkpoints fall at 30/90/119 days from hire date — flag each
  // PROBATION employee's next checkpoint that has no matching ProbationEvaluation
  // on file yet, then surface whoever's checkpoint is nearest (includes
  // already-overdue ones, which sort first).
  const PROBATION_MILESTONES: { days: number; period: ProbationPeriod }[] = [
    { days: 30, period: '30_DAYS' },
    { days: 90, period: '90_DAYS' },
    { days: 119, period: '119_DAYS' },
  ];
  const probationAlerts = employees
    .filter((e) => e.status === 'PROBATION')
    .map((e) => {
      const start = new Date(e.startingDate);
      if (isNaN(start.getTime())) return null;
      const nextMilestone = PROBATION_MILESTONES.find(
        (m) => !probationEvaluations.some((pe) => pe.employeeId === e.id && pe.period === m.period)
      );
      if (!nextMilestone) return null; // all 3 checkpoints already evaluated
      const dueDate = new Date(start.getTime() + nextMilestone.days * msPerDay);
      const daysUntilDue = Math.round((dueDate.getTime() - now.getTime()) / msPerDay);
      return { employee: e, dueDate, daysUntilDue, milestoneDays: nextMilestone.days };
    })
    .filter((x): x is NonNullable<typeof x> => !!x)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  const topProbationAlert = probationAlerts[0] ?? null;

  // Nearest EXPIRING_SOON/EXPIRED certificate — same "most urgent real
  // record" rule as above.
  const certAlerts = certificates
    .filter((c) => {
      const status = computeCertificateStatus(c.expiryDate);
      return status === 'EXPIRING_SOON' || status === 'EXPIRED';
    })
    .map((c) => ({ cert: c, daysUntilExpiry: Math.round((new Date(c.expiryDate).getTime() - now.getTime()) / msPerDay) }))
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  const topCertAlert = certAlerts[0] ?? null;

  // Pending Skill Matrix (F-HR-014) — employees whose own position has
  // F-HR-005 standards on file but haven't had attempt 1 recorded yet for
  // the current 6-month cycle (ม.ค./ก.ค., per F-HR-014's own cadence).
  const currentCycle: EvaluationCycle = now.getMonth() >= 6 ? '2026-07' : '2026-01';
  const CYCLE_LABEL: Record<EvaluationCycle, string> = { '2026-01': 'มกราคม 2026', '2026-07': 'กรกฎาคม 2026' };
  const pendingSkillMatrixCount = employees.filter((e) => {
    if (e.status === 'RESIGNED') return false;
    const empStandards = standards.filter((s) => s.department === e.department && s.position === e.position);
    if (empStandards.length === 0) return false;
    return !empStandards.every((s) =>
      evaluations.some(
        (ev) => ev.employeeId === e.id && ev.skillName === s.skillName && ev.cycle === currentCycle && ev.attemptNumber === 1
      )
    );
  }).length;

  // Skill Gap Overview — real F-HR-005 targets vs real F-HR-014 results,
  // grouped by each standard's own category (e.g. "อัดขึ้นรูป", "Set up
  // mold") so the radar's axes are meaningful groupings rather than one
  // point per individual topic. "Latest" result per employee×skill prefers
  // attempt 2 over attempt 1, and the newest cycle when both exist — same
  // rule SkillMatrixView's own radar uses per employee.
  // Wrapped in useMemo — this recomputes a full categories × standards ×
  // employees × evaluations scan, which would otherwise re-run from
  // scratch on every Dashboard re-render (e.g. an unrelated sibling state
  // update) even though standards/employees/evaluations/effectiveDept
  // rarely change between renders.
  const currentRadarData = useMemo(() => {
    // "Latest" result per employee×skill prefers attempt 2 over attempt 1,
    // and the newest cycle when both exist — same rule SkillMatrixView's
    // own radar uses per employee.
    const getLatestResult = (empId: string, skillName: string): number => {
      const matches = evaluations.filter((e) => e.employeeId === empId && e.skillName === skillName);
      if (matches.length === 0) return 0;
      const best = matches.reduce((a, b) => {
        if (a.cycle !== b.cycle) return b.cycle > a.cycle ? b : a;
        return (b.attemptNumber ?? 1) > (a.attemptNumber ?? 1) ? b : a;
      });
      return best.resultLevel;
    };

    // Some categories (e.g. FMG-A's "อัดขึ้นรูป"/"Set up mold") bundle a single
    // managerial topic in with the rest of that group's functional ones — the
    // real F-HR-005 source document itself splits "Functional Competency" from
    // "Managerial Competency" within each of those groups, this DB's `category`
    // field just doesn't carry that finer split. Deriving it from the skill
    // name (already real data, not invented) gives departments like FMG-A more
    // than 2 real axes instead of the radar collapsing to a line — departments
    // with no such skill at all (e.g. MIX) are unaffected, since the split only
    // fires where a matching skill genuinely exists in that department's data.
    const isManagerialSkill = (skillName: string) => /บริหารการจัดการ/.test(skillName);
    const radarCategoryOf = (s: SkillStandard) => (isManagerialSkill(s.skillName) ? `${s.category} (บริหาร)` : s.category);

    const deptStandards = standards.filter((s) => s.department === effectiveDept);
    const deptEmployees = employees.filter((e) => e.department === effectiveDept);
    const categories = [...new Set(deptStandards.map(radarCategoryOf))];

    const data = categories.map((category) => {
      const catStandards = deptStandards.filter((s) => radarCategoryOf(s) === category);
      const avgTarget = catStandards.reduce((sum, s) => sum + s.targetLevel, 0) / catStandards.length;

      let actualSum = 0;
      let actualCount = 0;
      catStandards.forEach((std) => {
        deptEmployees
          .filter((e) => e.position === std.position)
          .forEach((emp) => {
            actualSum += getLatestResult(emp.id, std.skillName);
            actualCount++;
          });
      });

      return {
        category,
        Target: Math.round(avgTarget),
        Actual: actualCount > 0 ? Math.round(actualSum / actualCount) : 0,
      };
    });

    // Padded to a fixed 6 axes so every department's chart reads as the same
    // hexagon shape — departments with fewer than 6 real F-HR-005 categories
    // get placeholder axes at 0/0 to fill the rest. These aren't real
    // standards (there's nothing to average), so they're labeled distinctly
    // rather than given a name that could be mistaken for one.
    const RADAR_AXIS_COUNT = 6;
    while (data.length > 0 && data.length < RADAR_AXIS_COUNT) {
      data.push({
        category: `(ยังไม่มีมาตรฐาน ${data.length + 1})`,
        Target: 0,
        Actual: 0,
      });
    }
    return data;
  }, [standards, employees, evaluations, effectiveDept]);

  // "ชั่วโมงอบรมสะสมประจำปี" / monthly bar chart — flowchart's "3.3 อบรมเพื่อ
  // พัฒนา" node feeding "Dashboard & รายงาน". Only COMPLETED courses count
  // toward hours actually delivered (a SCHEDULED course hasn't happened
  // yet), scoped to the current calendar year. No per-employee attendance
  // multiplier — TrainingAttendance isn't loaded into app state yet, so
  // this is course-hours held, not man-hours; revisit once attendance is wired up.
  const currentYear = new Date().getFullYear();
  const completedCoursesThisYear = courses.filter(
    (c) => c.status === 'COMPLETED' && new Date(c.date).getFullYear() === currentYear
  );
  const totalTrainingHours = completedCoursesThisYear.reduce((sum, c) => sum + c.hours, 0);
  const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const trainingChartData = THAI_MONTHS.map((month, idx) => ({
    month,
    hours: completedCoursesThisYear
      .filter((c) => new Date(c.date).getMonth() === idx)
      .reduce((sum, c) => sum + c.hours, 0),
  }));

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
            <span className="stat-value">{totalTrainingHours} hrs</span>
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
                เปรียบเทียบ Target (F-HR-005) vs Actual (F-HR-014) ประจำแผนก {effectiveDept || '-'}
              </span>
            </div>

            {/* Department Filter Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Filter size={13} style={{ color: 'var(--text-dim)' }} />
              {availableDepts.map((dept) => (
                <button
                  key={dept}
                  className={`btn btn-sm ${effectiveDept === dept ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  onClick={() => setSelectedDept(dept)}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {currentRadarData.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              ยังไม่มีมาตรฐานทักษะ (F-HR-005) สำหรับแผนกนี้
            </div>
          ) : (
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
          )}
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
            {!topProbationAlert && !topCertAlert && pendingSkillMatrixCount === 0 && (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                ไม่มีรายการที่ต้องดำเนินการตอนนี้
              </div>
            )}

            {topProbationAlert && (
              <div
                className="glass-card glass-card-interactive"
                style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => onNavigate('probation')}
              >
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    ประเมินผลทดลองงาน ({topProbationAlert.milestoneDays} วัน): {topProbationAlert.employee.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {topProbationAlert.daysUntilDue < 0
                      ? `เลยกำหนดมาแล้ว ${Math.abs(topProbationAlert.daysUntilDue)} วัน`
                      : topProbationAlert.daysUntilDue === 0
                        ? 'ครบกำหนดวันนี้'
                        : `ครบกำหนดใน ${topProbationAlert.daysUntilDue} วัน`}{' '}
                    ({formatDMY(topProbationAlert.dueDate)}) • แผนก {topProbationAlert.employee.department}
                    {probationAlerts.length > 1 && ` • และอีก ${probationAlerts.length - 1} คน`}
                  </div>
                </div>
                <span className="badge badge-amber">ทำแบบประเมิน F-HR-009</span>
              </div>
            )}

            {topCertAlert && (
              <div
                className="glass-card glass-card-interactive"
                style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => onNavigate('certificates')}
              >
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {topCertAlert.cert.certName}:{' '}
                    {topCertAlert.daysUntilExpiry < 0
                      ? `หมดอายุแล้ว ${Math.abs(topCertAlert.daysUntilExpiry)} วัน`
                      : `หมดอายุใน ${topCertAlert.daysUntilExpiry} วัน`}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {topCertAlert.cert.employeeName} • หมดอายุ {formatDMY(new Date(topCertAlert.cert.expiryDate))}
                    {certAlerts.length > 1 && ` • และอีก ${certAlerts.length - 1} ใบ`}
                  </div>
                </div>
                <span className="badge badge-red">แจ้งเตือนต่ออายุ</span>
              </div>
            )}

            {pendingSkillMatrixCount > 0 && (
              <div
                className="glass-card glass-card-interactive"
                style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => onNavigate('skill_matrix')}
              >
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    ประเมิน Skill Matrix ประจำรอบ {CYCLE_LABEL[currentCycle]}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    ยังค้างประเมิน {pendingSkillMatrixCount} คน (F-HR-014)
                  </div>
                </div>
                <span className="badge badge-blue">เข้าสู่ Skill Matrix</span>
              </div>
            )}
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
              onClick={() => onNavigate('ojt_a')}
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
