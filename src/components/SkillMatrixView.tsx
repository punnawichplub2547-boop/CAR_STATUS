import React, { useState } from 'react';
import { Eye, RefreshCw, Target } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import type { Employee, SkillStandard, SkillEvaluation } from '../types';

interface SkillMatrixViewProps {
  employees: Employee[];
  standards: SkillStandard[];
  evaluations: SkillEvaluation[];
  onUpdateEvaluation: (updated: SkillEvaluation) => void;
}

export const SkillMatrixView: React.FC<SkillMatrixViewProps> = ({
  employees,
  standards,
  evaluations,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('FMG-A');
  const [selectedCycle, setSelectedCycle] = useState<'2026-01' | '2026-07'>('2026-07');
  const [showRadarModal, setShowRadarModal] = useState(false);
  const [activeEmpForRadar, setActiveEmpForRadar] = useState<Employee | null>(null);

  const deptEmployees = employees.filter((e) => e.department === selectedDept);
  const deptStandards = standards.filter((s) => s.department === selectedDept);

  // Helper to find evaluation result for employee & skill
  const getEvalResult = (empId: string, skillName: string) => {
    const ev = evaluations.find(
      (e) => e.employeeId === empId && e.skillName === skillName && e.cycle === selectedCycle
    );
    return ev ? ev.resultLevel : null;
  };

  // Build Radar Chart data for selected employee
  const getEmployeeRadarData = (emp: Employee) => {
    return deptStandards.map((std) => {
      const actual = getEvalResult(emp.id, std.skillName) ?? 0;
      return {
        skill: std.skillName,
        Target: std.targetLevel,
        Actual: actual,
      };
    });
  };

  return (
    <div className="skill-matrix-page content-container">
      <div className="page-header">
        <div>
          <div className="eyebrow-tag">
            <Target size={14} /> SKILL MATRIX & GAP • ตารางประเมินทักษะตามมาตรฐาน (F-HR-014)
          </div>
          <h1 className="page-title gradient-text">ระบบมาตรฐานและประเมินทักษะ (Skill Matrix)</h1>
          <p className="page-subtitle">
            ตารางเปรียบเทียบมาตรฐานทักษะ (F-HR-005) และบันทึกผลการประเมินทักษะความสามารถประจำรอบ (F-HR-014)
          </p>
        </div>
        <div className="header-actions">
          <span className="badge badge-purple" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            <RefreshCw size={14} /> รอบประเมิน: มกราคม & กรกฎาคม
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 24, display: 'flex', gap: 20, alignItems: 'center' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">เลือกแผนก / หน่วยงาน</label>
          <select className="form-control" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
            <option value="FMG-A">FMG-A (แผนกผลิตยางรถยนต์)</option>
            <option value="QA/QC">QA/QC (แผนกควบคุมคุณภาพ)</option>
            <option value="HR&GA IT">HR&GA IT</option>
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">รอบการประเมิน (Evaluation Cycle)</label>
          <select className="form-control" value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value as any)}>
            <option value="2026-07">รอบ กรกฎาคม 2026 (July 2026)</option>
            <option value="2026-01">รอบ มกราคม 2026 (January 2026)</option>
          </select>
        </div>
      </div>

      {/* Skill Matrix Grid Table (Form F-HR-014 Layout) */}
      <div className="glass-card table-responsive" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3>F-HR-014 SKILL MATRIX EVALUATION RECORD FORM</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              เกณฑ์ระดับทักษะ: 0% (ไม่ผ่าน/OJT ซ้ำ), 25% (ฝึกอบรมใต้การควบคุม), 50% (คอยตรวจ), 75% (ทำงานได้เอง - ผ่านเกณฑ์), 100% (สอนงานผู้อื่นได้)
            </span>
          </div>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th rowSpan={2}>รายชื่อพนักงาน / ตำแหน่ง</th>
              {deptStandards.map((std) => (
                <th key={std.id} colSpan={2} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)' }}>
                  {std.skillName}
                  <div style={{ fontSize: '0.7rem', color: 'var(--primary)', textTransform: 'none' }}>
                    (Target: {std.targetLevel}%)
                  </div>
                </th>
              ))}
              <th rowSpan={2} style={{ textAlign: 'center' }}>กราฟ Radar</th>
            </tr>
            <tr>
              {deptStandards.map((std) => (
                <React.Fragment key={`sub-${std.id}`}>
                  <th style={{ fontSize: '0.7rem', textTransform: 'none', textAlign: 'center', background: 'rgba(59,130,246,0.1)' }}>
                    เป้าหมาย
                  </th>
                  <th style={{ fontSize: '0.7rem', textTransform: 'none', textAlign: 'center', background: 'rgba(16,185,129,0.1)' }}>
                    ผลจริง
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {deptEmployees.map((emp) => (
              <tr key={emp.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{emp.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {emp.empCode} • {emp.position}
                  </div>
                </td>

                {deptStandards.map((std) => {
                  const actual = getEvalResult(emp.id, std.skillName);
                  const isGap = actual !== null && actual < std.targetLevel;

                  return (
                    <React.Fragment key={`cell-${emp.id}-${std.id}`}>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#60a5fa' }}>
                        {std.targetLevel}%
                      </td>
                      <td
                        style={{
                          textAlign: 'center',
                          fontWeight: 700,
                          color: isGap ? 'var(--danger)' : 'var(--success)',
                          background: isGap ? 'rgba(239, 68, 68, 0.1)' : undefined,
                        }}
                      >
                        {actual !== null ? `${actual}%` : '-'}
                      </td>
                    </React.Fragment>
                  );
                })}

                <td style={{ textAlign: 'center' }}>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setActiveEmpForRadar(emp);
                      setShowRadarModal(true);
                    }}
                  >
                    <Eye size={14} /> ดู Radar Chart
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Radar Chart Modal */}
      {showRadarModal && activeEmpForRadar && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 650 }}>
            <div className="modal-header">
              <h3>Competency Radar Chart: {activeEmpForRadar.name}</h3>
              <button className="btn-icon" onClick={() => setShowRadarModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                ตำแหน่ง: {activeEmpForRadar.position} ({activeEmpForRadar.department}) • รอบประเมิน: {selectedCycle}
              </div>

              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getEmployeeRadarData(activeEmpForRadar)}>
                    <PolarGrid stroke="rgba(255,255,255,0.15)" />
                    <PolarAngleAxis dataKey="skill" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" />
                    <Radar
                      name="Target Standard (F-HR-005)"
                      dataKey="Target"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                    />
                    <Radar
                      name="Actual Skill (F-HR-014)"
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
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowRadarModal(false)}>
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
