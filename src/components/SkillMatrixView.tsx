import React, { useState } from 'react';
import { Eye, RefreshCw, Target, X, Edit3, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend } from 'recharts';
import type { Employee, SkillStandard, SkillEvaluation, SkillLevel } from '../types';

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
  onUpdateEvaluation,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('FMG-A');
  const [selectedCycle, setSelectedCycle] = useState<'2026-01' | '2026-07'>('2026-07');
  const [showRadarModal, setShowRadarModal] = useState(false);
  const [activeEmpForRadar, setActiveEmpForRadar] = useState<Employee | null>(null);

  // Edit Modal State
  const [editingCell, setEditingCell] = useState<{
    emp: Employee;
    std: SkillStandard;
    currentResult: SkillLevel;
  } | null>(null);

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
      <div className="glass-card" style={{ padding: 20, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3>F-HR-014 SKILL MATRIX EVALUATION RECORD FORM</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              เกณฑ์ระดับทักษะ: 0% (ไม่ผ่าน/OJT ซ้ำ), 25% (ฝึกอบรมใต้การควบคุม), 50% (คอยตรวจ), 75% (ทำงานได้เอง - ผ่านเกณฑ์), 100% (สอนงานผู้อื่นได้)
            </span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table" style={{ width: '100%', minWidth: 900 }}>
            <thead>
              <tr>
                <th rowSpan={2} className="sticky-col" style={{ minWidth: 160 }}>รายชื่อพนักงาน / ตำแหน่ง</th>
                {deptStandards.map((std) => (
                  <th key={std.id} colSpan={2} style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', minWidth: 140 }}>
                    {std.skillName}
                    <div style={{ fontSize: '0.7rem', color: 'var(--primary)', textTransform: 'none' }}>
                      (Target: {std.targetLevel}%)
                    </div>
                  </th>
                ))}
                <th rowSpan={2} style={{ textAlign: 'center', minWidth: 130 }}>กราฟ Radar</th>
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
                  <td className="sticky-col">
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
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onClick={() => {
                            setEditingCell({
                              emp,
                              std,
                              currentResult: (actual ?? std.targetLevel) as SkillLevel,
                            });
                          }}
                          title="คลิกเพื่อประเมินระดับทักษะความสามารถ (Edit Skill Level)"
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            {actual !== null ? `${actual}%` : '-'}
                            <Edit3 size={12} style={{ opacity: 0.5 }} />
                          </div>
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
                      <Eye size={14} /> Radar Chart
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Skill Level Evaluator Modal */}
      {editingCell && (
        <div className="modal-overlay" onClick={() => setEditingCell(null)}>
          <div className="modal-content" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>F-HR-014 บันทึกผลประเมินทักษะ</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setEditingCell(null)}
                style={{ padding: 6, borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="glass-card" style={{ padding: 16, marginBottom: 20, background: 'rgba(59, 130, 246, 0.06)' }}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary)' }}>
                  {editingCell.emp.name} ({editingCell.emp.empCode})
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  ตำแหน่ง: {editingCell.emp.position} • แผนก: {editingCell.emp.department}
                </div>
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>หัวข้อทักษะ: <strong style={{ color: 'var(--text-main)' }}>{editingCell.std.skillName}</strong></span>
                  <span className="badge badge-blue">Target Standard: {editingCell.std.targetLevel}%</span>
                </div>
              </div>

              <label className="form-label" style={{ marginBottom: 12, display: 'block', fontWeight: 600 }}>
                เลือกระดับผลการประเมินทักษะจริง (รอบประเมิน {selectedCycle}):
              </label>

              <div className="grid-cols-5" style={{ gap: 8, marginBottom: 20 }}>
                {([0, 25, 50, 75, 100] as SkillLevel[]).map((lvl) => (
                  <div
                    key={lvl}
                    className={`glass-card glass-card-interactive ${editingCell.currentResult === lvl ? 'active' : ''}`}
                    style={{
                      padding: 12,
                      textAlign: 'center',
                      border: editingCell.currentResult === lvl ? '2px solid var(--primary)' : undefined,
                    }}
                    onClick={() => setEditingCell({ ...editingCell, currentResult: lvl })}
                  >
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: lvl >= editingCell.std.targetLevel ? 'var(--success)' : 'var(--warning)' }}>
                      {lvl}%
                    </div>
                    <div style={{ fontSize: '0.68rem', marginTop: 4, color: 'var(--text-muted)' }}>
                      {lvl === 0 && 'ไม่ผ่าน'}
                      {lvl === 25 && 'ควบคุม'}
                      {lvl === 50 && 'คอยตรวจ'}
                      {lvl === 75 && 'ทำได้เอง'}
                      {lvl === 100 && 'สอนงานได้'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">ผู้ประเมิน (Assessor Name)</label>
                <input
                  type="text"
                  className="form-control"
                  defaultValue="นางสาว สมหญิง ใจดี (Admin/Supervisor)"
                  id="eval-assessor-input"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditingCell(null)}>
                ยกเลิก
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const assessorInput = (document.getElementById('eval-assessor-input') as HTMLInputElement)?.value || 'Admin';
                  const existingEval = evaluations.find(
                    (e) => e.employeeId === editingCell.emp.id && e.skillName === editingCell.std.skillName && e.cycle === selectedCycle
                  );

                  const updated: SkillEvaluation = {
                    id: existingEval ? existingEval.id : `eval-${Date.now()}`,
                    employeeId: editingCell.emp.id,
                    employeeName: editingCell.emp.name,
                    position: editingCell.emp.position,
                    department: editingCell.emp.department,
                    skillName: editingCell.std.skillName,
                    category: editingCell.std.category,
                    targetLevel: editingCell.std.targetLevel,
                    resultLevel: editingCell.currentResult,
                    cycle: selectedCycle,
                    evaluatedAt: new Date().toISOString().split('T')[0],
                    assessorName: assessorInput,
                  };

                  onUpdateEvaluation(updated);
                  setEditingCell(null);
                }}
              >
                <CheckCircle2 size={16} /> บันทึกการประเมินทักษะ (Save Evaluation)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Radar Chart Modal */}
      {showRadarModal && activeEmpForRadar && (
        <div className="modal-overlay" onClick={() => setShowRadarModal(false)}>
          <div className="modal-content" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Competency Radar Chart: {activeEmpForRadar.name}</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowRadarModal(false)}
                style={{ padding: 6, borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 20 }}>
                ตำแหน่ง: <strong style={{ color: 'var(--text-main)' }}>{activeEmpForRadar.position}</strong> ({activeEmpForRadar.department}) • รอบประเมิน: {selectedCycle}
              </div>

              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getEmployeeRadarData(activeEmpForRadar)}>
                    <PolarGrid stroke="var(--border-color)" />
                    <PolarAngleAxis
                      dataKey="skill"
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
                      name="Target Standard (F-HR-005)"
                      dataKey="Target"
                      stroke="#2563eb"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      strokeWidth={2.5}
                    />
                    <Radar
                      name="Actual Skill (F-HR-014)"
                      dataKey="Actual"
                      stroke="#059669"
                      fill="#10b981"
                      fillOpacity={0.5}
                      strokeWidth={2.5}
                    />
                    <Legend wrapperStyle={{ paddingTop: 10, fontSize: '0.85rem' }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 12,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        color: 'var(--text-main)',
                      }}
                    />
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
