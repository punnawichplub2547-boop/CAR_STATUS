import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Eye,
  RefreshCw,
  Target,
  X,
  Edit3,
  CheckCircle2,
  FileSpreadsheet,
  ChevronDown,
  UserPlus,
  Search,
  Trash2,
  UserCheck,
  PlusCircle,
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend } from 'recharts';
import type {
  Employee,
  SkillStandard,
  SkillEvaluation,
  SkillEvaluationRound,
  SkillLevel,
  EvaluationAttempt,
  EvaluationCycle,
} from '../types';
import {
  exportExactFHR014Template,
  FHR014_EMPLOYEES_PER_SHEET,
  FHR014_SKILLS_PER_SHEET,
} from '../utils/excelTemplateExporter';

interface SkillMatrixViewProps {
  employees: Employee[];
  standards: SkillStandard[];
  evaluations: SkillEvaluation[];
  evaluationRounds: SkillEvaluationRound[];
  onUpdateEvaluation: (updated: SkillEvaluation) => void;
  onSaveRound: (round: SkillEvaluationRound) => void;
  onAddEmployee?: (newEmp: Employee) => void;
}

const LEVELS: SkillLevel[] = [0, 25, 50, 75, 100];
const LEVEL_LABEL: Record<SkillLevel, string> = {
  0: 'ไม่ผ่าน',
  25: 'ควบคุม',
  50: 'คอยตรวจ',
  75: 'ทำได้เอง',
  100: 'สอนงานได้',
};

const PieIcon: React.FC<{ level: SkillLevel }> = ({ level }) => <span className="pie-icon" data-lvl={level} />;

export const SkillMatrixView: React.FC<SkillMatrixViewProps> = ({
  employees,
  standards,
  evaluations,
  evaluationRounds,
  onUpdateEvaluation,
  onSaveRound,
  onAddEmployee,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('FMG-A');
  const [selectedCycle, setSelectedCycle] = useState<EvaluationCycle>('2026-07');
  const [showRadarModal, setShowRadarModal] = useState(false);
  const [activeEmpForRadar, setActiveEmpForRadar] = useState<Employee | null>(null);

  // State for cross-department / new added employees & search modal
  const [extraEmpIds, setExtraEmpIds] = useState<string[]>([]);
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [searchEmpQuery, setSearchEmpQuery] = useState('');

  // Mode inside Add Employee Modal: 'SEARCH' vs 'CREATE_NEW'
  const [addEmpMode, setAddEmpMode] = useState<'SEARCH' | 'CREATE_NEW'>('SEARCH');
  const [newEmpCode, setNewEmpCode] = useState('');
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpPosition, setNewEmpPosition] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('FMG-A');

  // Department baseline employees & standards
  const deptEmployees = employees.filter((e) => e.department === selectedDept);
  const extraEmployees = employees.filter((e) => extraEmpIds.includes(e.id) && e.department !== selectedDept);
  const displayedEmployees = [...deptEmployees, ...extraEmployees];

  const deptStandards = standards.filter((s) => s.department === selectedDept);

  // Reset extra employees when department changes
  const handleDeptChange = (dept: string) => {
    setSelectedDept(dept);
    setExtraEmpIds([]);
  };

  const handleAddExtraEmp = (empId: string) => {
    if (!extraEmpIds.includes(empId)) {
      setExtraEmpIds((prev) => [...prev, empId]);
    }
    setShowAddEmpModal(false);
    setSearchEmpQuery('');
  };

  const handleRemoveExtraEmp = (empId: string) => {
    setExtraEmpIds((prev) => prev.filter((id) => id !== empId));
  };

  const handleCreateAndAddNewEmp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpCode.trim() || !newEmpName.trim()) return;

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      empCode: newEmpCode.trim(),
      name: newEmpName.trim(),
      email: `${newEmpCode.toLowerCase().trim()}@car.co.th`,
      department: newEmpDept || selectedDept,
      section: '-',
      position: newEmpPosition.trim() || 'พนักงานทั่วไป (ยางรถยนต์)',
      startingDate: new Date().toISOString().split('T')[0],
      status: 'PERMANENT',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
      role: 'EMPLOYEE',
    };

    if (onAddEmployee) {
      onAddEmployee(newEmp);
    }
    if (!extraEmpIds.includes(newEmp.id) && newEmp.department !== selectedDept) {
      setExtraEmpIds((prev) => [...prev, newEmp.id]);
    }

    // Reset form state & close modal
    setNewEmpCode('');
    setNewEmpName('');
    setNewEmpPosition('');
    setShowAddEmpModal(false);
    setAddEmpMode('SEARCH');
  };

  // Candidates available to add (not currently displayed)
  const candidateEmployees = employees.filter((emp) => {
    const isAlreadyInView = displayedEmployees.some((d) => d.id === emp.id);
    if (isAlreadyInView) return false;
    if (!searchEmpQuery.trim()) return true;
    const q = searchEmpQuery.toLowerCase().trim();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.empCode.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q)
    );
  });

  // Radar chart uses the latest known result per skill (attempt 2 if it exists, else attempt 1)
  const getLatestResult = (empId: string, skillName: string) => {
    const attempt2 = evaluations.find(
      (e) => e.employeeId === empId && e.skillName === skillName && e.cycle === selectedCycle && e.attemptNumber === 2
    );
    if (attempt2) return attempt2.resultLevel;
    const attempt1 = evaluations.find(
      (e) => e.employeeId === empId && e.skillName === skillName && e.cycle === selectedCycle && e.attemptNumber === 1
    );
    return attempt1 ? attempt1.resultLevel : 0;
  };

  const getEmployeeRadarData = (emp: Employee) =>
    deptStandards.map((std) => ({
      skill: std.skillName,
      Target: std.targetLevel,
      Actual: getLatestResult(emp.id, std.skillName),
    }));

  const handleExportExactTemplate = async () => {
    try {
      const result = await exportExactFHR014Template({
        employees,
        customEmployees: displayedEmployees,
        standards,
        evaluations,
        department: selectedDept,
        cycle: selectedCycle,
      });

      // One sheet holds 6 skills × 20 employees. Anything bigger is split, so
      // tell HR how many sheets to expect instead of letting rows disappear.
      if (result.sheetNames.length > 1) {
        alert(
          `Export สำเร็จ — ${result.employeeCount} คน × ${result.skillCount} ทักษะ ` +
            `เกินความจุ 1 แผ่น (${FHR014_EMPLOYEES_PER_SHEET} คน × ${FHR014_SKILLS_PER_SHEET} ทักษะ) ` +
            `จึงแยกเป็น ${result.sheetNames.length} ชีต: ${result.sheetNames.join(', ')}`
        );
      }
    } catch (err) {
      alert(err instanceof Error ? `Export ไม่สำเร็จ: ${err.message}` : 'Export ไม่สำเร็จ');
    }
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
        <div className="header-actions" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="badge badge-purple" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            <RefreshCw size={14} /> รอบประเมิน: มกราคม & กรกฎาคม
          </span>
          <button className="btn btn-primary" onClick={() => setShowAddEmpModal(true)}>
            <UserPlus size={16} /> เพิ่ม / ดึงข้อมูลพนักงาน
          </button>
          <button className="btn btn-success" onClick={handleExportExactTemplate} title="ดาวน์โหลดฟอร์ม F-HR-014 Rev.4 เป็นไฟล์ Excel (.xlsx)">
            <FileSpreadsheet size={16} /> Export F-HR-014 (Excel)
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 24, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">เลือกแผนก / หน่วยงานหลัก</label>
          <select className="form-control" value={selectedDept} onChange={(e) => handleDeptChange(e.target.value)}>
            <option value="FMG-A">FMG-A (แผนกผลิตยางรถยนต์)</option>
            <option value="QA/QC">QA/QC (แผนกควบคุมคุณภาพ)</option>
            <option value="HR&GA">HR&GA (แผนกบุคคลและธุรการ)</option>
            <option value="HR&GA IT">HR&GA IT</option>
          </select>
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">รอบการประเมิน (Evaluation Cycle)</label>
          <select className="form-control" value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value as EvaluationCycle)}>
            <option value="2026-07">รอบ กรกฎาคม 2026 (July 2026)</option>
            <option value="2026-01">รอบ มกราคม 2026 (January 2026)</option>
          </select>
        </div>

        {extraEmployees.length > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-purple" style={{ fontSize: '0.8rem' }}>
              มีพนักงานดึงข้ามแผนก: {extraEmployees.length} คน
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 14px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          F-HR-014 • แสดงพนักงานประเมิน · {displayedEmployees.length} คน (คลิกที่ชื่อพนักงานเพื่อเปิด/ปิดผลประเมิน)
        </div>
      </div>

      {displayedEmployees.length === 0 && (
        <div className="glass-card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
          ไม่มีพนักงานในตารางนี้ คลิกปุ่ม <strong>"เพิ่ม / ดึงข้อมูลพนักงาน"</strong> ด้านบนเพื่อค้นหาหรือสร้างพนักงานใหม่
        </div>
      )}

      {displayedEmployees.map((emp) => (
        <EmployeeEvalCard
          key={emp.id}
          emp={emp}
          standards={deptStandards}
          cycle={selectedCycle}
          evaluations={evaluations}
          evaluationRounds={evaluationRounds}
          isCrossDept={emp.department !== selectedDept}
          onRemoveCrossDept={() => handleRemoveExtraEmp(emp.id)}
          onUpdateEvaluation={onUpdateEvaluation}
          onSaveRound={onSaveRound}
          onOpenRadar={() => {
            setActiveEmpForRadar(emp);
            setShowRadarModal(true);
          }}
        />
      ))}

      {/* Modal: Search / Select / Create Employee */}
      {showAddEmpModal && (
        <div className="modal-overlay" onClick={() => setShowAddEmpModal(false)}>
          <div className="modal-content" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <UserPlus size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0 }}>
                  {addEmpMode === 'SEARCH' ? 'ดึงข้อมูลพนักงานร่วมประเมิน' : 'สร้างพนักงานใหม่ข้ามแผนก'}
                </h3>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowAddEmpModal(false);
                  setAddEmpMode('SEARCH');
                }}
                style={{ padding: 6, borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Mode Selector Switch */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 18, background: 'rgba(0,0,0,0.04)', padding: 4, borderRadius: 10 }}>
                <button
                  className={`btn btn-sm ${addEmpMode === 'SEARCH' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, borderRadius: 8 }}
                  onClick={() => setAddEmpMode('SEARCH')}
                >
                  <Search size={14} /> ค้นหาพนักงานในระบบ
                </button>
                <button
                  className={`btn btn-sm ${addEmpMode === 'CREATE_NEW' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, borderRadius: 8 }}
                  onClick={() => setAddEmpMode('CREATE_NEW')}
                >
                  <PlusCircle size={14} /> สร้างพนักงานใหม่
                </button>
              </div>

              {addEmpMode === 'SEARCH' ? (
                <>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                    พิมพ์รหัสประจำตัวพนักงาน (EMP Code), ชื่อ-นามสกุล หรือตำแหน่ง เพื่อดึงข้อมูลพนักงานและผลการประเมิน skill เข้าสู่ตารางแผนก {selectedDept} และ Export Excel ได้ทันที
                  </p>

                  {/* Search Box */}
                  <div style={{ position: 'relative', marginBottom: 16 }}>
                    <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="form-control"
                      style={{ paddingLeft: 42 }}
                      placeholder="ค้นหาด้วยรหัสพนักงาน (เช่น EMP-1003) หรือชื่อพนักงาน..."
                      value={searchEmpQuery}
                      onChange={(e) => setSearchEmpQuery(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {/* Candidate Employees List */}
                  <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {candidateEmployees.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                        ไม่พบพนักงานตรงตามเงื่อนไขค้นหา
                        <div style={{ marginTop: 8 }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => setAddEmpMode('CREATE_NEW')}>
                            <PlusCircle size={14} /> คลิกตรงนี้เพื่อสร้างพนักงานใหม่
                          </button>
                        </div>
                      </div>
                    ) : (
                      candidateEmployees.map((cEmp) => (
                        <div
                          key={cEmp.id}
                          className="glass-card"
                          style={{
                            padding: '12px 16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 0,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: 'var(--primary-glow)',
                                color: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                              }}
                            >
                              {cEmp.empCode.replace(/[^0-9]/g, '') || cEmp.name.slice(0, 2)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                {cEmp.name} <span style={{ color: 'var(--primary)', fontSize: '0.85rem', marginLeft: 4 }}>({cEmp.empCode})</span>
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                {cEmp.position} • แผนก: <strong style={{ color: 'var(--text-main)' }}>{cEmp.department}</strong>
                              </div>
                            </div>
                          </div>

                          <button className="btn btn-sm btn-primary" onClick={() => handleAddExtraEmp(cEmp.id)}>
                            <UserCheck size={14} /> เลือกคนนี้
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                /* Create New Employee Form */
                <form onSubmit={handleCreateAndAddNewEmp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    กรอกข้อมูลพนักงานใหม่เพื่อบันทึกเข้าสู่ระบบ และดึงเข้าร่วมการประเมินทักษะในตาราง Export Excel ทันที
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">รหัสพนักงาน (EMP Code) *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="เช่น EMP-1005"
                        value={newEmpCode}
                        onChange={(e) => setNewEmpCode(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">แผนกสังกัด (Department)</label>
                      <select className="form-control" value={newEmpDept} onChange={(e) => setNewEmpDept(e.target.value)}>
                        <option value="FMG-A">FMG-A (แผนกผลิตยางรถยนต์)</option>
                        <option value="QA/QC">QA/QC (แผนกควบคุมคุณภาพ)</option>
                        <option value="HR&GA">HR&GA (แผนกบุคคลและธุรการ)</option>
                        <option value="HR&GA IT">HR&GA IT</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">ชื่อ-นามสกุล *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="เช่น นาย สมชาย ขยันดี"
                      value={newEmpName}
                      onChange={(e) => setNewEmpName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">ตำแหน่งงาน (Position)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="เช่น พนักงานทั่วไป (ยางรถยนต์)"
                      value={newEmpPosition}
                      onChange={(e) => setNewEmpPosition(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setAddEmpMode('SEARCH')}>
                      ยกเลิก
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <CheckCircle2 size={16} /> ยืนยันสร้างและเพิ่มเข้าตาราง
                    </button>
                  </div>
                </form>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddEmpModal(false);
                  setAddEmpMode('SEARCH');
                }}
              >
                ปิดหน้าต่าง
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
                      name="Actual Skill (F-HR-014)"
                      dataKey="Actual"
                      stroke="#059669"
                      fill="#10b981"
                      fillOpacity={0.5}
                      strokeWidth={2.5}
                    />
                    <Radar
                      name="Target Standard (F-HR-005)"
                      dataKey="Target"
                      stroke="#2563eb"
                      fill="#3b82f6"
                      fillOpacity={0.15}
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

// ---- one F-HR-014 form-card per employee (Collapsible Accordion) ----
const EmployeeEvalCard: React.FC<{
  emp: Employee;
  standards: SkillStandard[];
  cycle: EvaluationCycle;
  evaluations: SkillEvaluation[];
  evaluationRounds: SkillEvaluationRound[];
  isCrossDept?: boolean;
  onRemoveCrossDept?: () => void;
  onUpdateEvaluation: (updated: SkillEvaluation) => void;
  onSaveRound: (round: SkillEvaluationRound) => void;
  onOpenRadar: () => void;
}> = ({
  emp,
  standards,
  cycle,
  evaluations,
  evaluationRounds,
  isCrossDept = false,
  onRemoveCrossDept,
  onUpdateEvaluation,
  onSaveRound,
  onOpenRadar,
}) => {
  const [attempt, setAttempt] = useState<EvaluationAttempt>(1);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const attempt1Done =
    standards.length > 0 &&
    standards.every((std) =>
      evaluations.some(
        (e) => e.employeeId === emp.id && e.skillName === std.skillName && e.cycle === cycle && e.attemptNumber === 1
      )
    );
  const attempt1HasGap = standards.some((std) => {
    const ev = evaluations.find(
      (e) => e.employeeId === emp.id && e.skillName === std.skillName && e.cycle === cycle && e.attemptNumber === 1
    );
    return ev && ev.resultLevel < std.targetLevel;
  });
  const attempt2Done =
    standards.length > 0 &&
    standards.every((std) =>
      evaluations.some(
        (e) => e.employeeId === emp.id && e.skillName === std.skillName && e.cycle === cycle && e.attemptNumber === 2
      )
    );

  return (
    <div className="glass-card" style={{ marginBottom: 16, overflow: 'hidden', padding: 0, transition: 'all 0.2s ease' }}>
      {/* Clickable Header Bar */}
      <div
        className="employee-card-header"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          padding: '16px 20px',
          cursor: 'pointer',
          borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
          background: isExpanded ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              color: isExpanded ? 'var(--primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), color 0.25s ease',
            }}
          >
            <ChevronDown size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {emp.name}
              {isCrossDept && (
                <span className="badge badge-purple" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                  ต่างแผนก ({emp.department})
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {emp.empCode} • {emp.position}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="btn btn-sm btn-secondary"
            onClick={(e) => {
              e.stopPropagation();
              onOpenRadar();
            }}
          >
            <Eye size={14} /> Radar Chart
          </button>
          {isCrossDept && onRemoveCrossDept && (
            <button
              className="btn btn-sm btn-ghost"
              style={{ color: 'var(--danger)', padding: '6px 10px' }}
              onClick={(e) => {
                e.stopPropagation();
                onRemoveCrossDept();
              }}
              title="นำพนักงานท่านนี้ออกจากรายการในตารางแผนกนี้"
            >
              <Trash2 size={14} /> นำออก
            </button>
          )}
        </div>
      </div>

      {/* Expanded Accordion Body with smooth dropdown animation */}
      {isExpanded && (
        <div className="accordion-dropdown-body">
          <div style={{ display: 'flex', gap: 6, padding: '14px 20px 0' }}>
            <button
              className={`btn btn-sm ${attempt === 1 ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setAttempt(1)}
            >
              ครั้งที่ 1 {attempt1Done && !attempt1HasGap ? '✓' : ''}
            </button>
            <button
              className={`btn btn-sm ${attempt === 2 ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setAttempt(2)}
            >
              ครั้งที่ 2 {attempt2Done ? '✓' : attempt1HasGap ? '(ประเมินซ้ำ)' : ''}
            </button>
          </div>

          <RoundPanel
            key={attempt}
            attempt={attempt}
            emp={emp}
            standards={standards}
            cycle={cycle}
            evaluations={evaluations}
            evaluationRounds={evaluationRounds}
            onUpdateEvaluation={onUpdateEvaluation}
            onSaveRound={onSaveRound}
          />
        </div>
      )}
    </div>
  );
};

// ---- the Action Period / skill grid / sign-off block for one attempt ----
const RoundPanel: React.FC<{
  attempt: EvaluationAttempt;
  emp: Employee;
  standards: SkillStandard[];
  cycle: EvaluationCycle;
  evaluations: SkillEvaluation[];
  evaluationRounds: SkillEvaluationRound[];
  onUpdateEvaluation: (updated: SkillEvaluation) => void;
  onSaveRound: (round: SkillEvaluationRound) => void;
}> = ({ attempt, emp, standards, cycle, evaluations, evaluationRounds, onUpdateEvaluation, onSaveRound }) => {
  const roundId = `${emp.id}_${cycle}_${attempt}`;
  const existingRound = evaluationRounds.find((r) => r.id === roundId);

  const [actionFrom, setActionFrom] = useState(existingRound?.actionPeriodFrom ?? '');
  const [actionTo, setActionTo] = useState(existingRound?.actionPeriodTo ?? '');
  const assessorName = existingRound?.assessorName ?? 'นางสาว สมหญิง ใจดี';
  const assessorSig = existingRound?.assessorSignature ?? null;
  const deptManagerName = existingRound?.deptManagerName ?? '';
  const deptManagerSig = existingRound?.deptManagerSignature ?? null;
  const hrDeptName = existingRound?.hrDeptName ?? '';
  const hrDeptSig = existingRound?.hrDeptSignature ?? null;
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);

  const openScorePopover = (skillId: string, triggerEl: HTMLElement) => {
    if (editingSkillId === skillId) {
      setEditingSkillId(null);
      setPopoverPos(null);
      return;
    }
    const rect = triggerEl.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const popoverHeight = 56;
    const top = spaceBelow < popoverHeight + 12 ? rect.top - popoverHeight - 8 : rect.bottom + 8;
    setPopoverPos({ top, left: rect.left + rect.width / 2 });
    setEditingSkillId(skillId);
  };

  const closeScorePopover = () => {
    setEditingSkillId(null);
    setPopoverPos(null);
  };

  const findEval = (skillName: string) =>
    evaluations.find((e) => e.employeeId === emp.id && e.skillName === skillName && e.cycle === cycle && e.attemptNumber === attempt);

  const handleScoreSelect = (std: SkillStandard, level: SkillLevel) => {
    const existing = findEval(std.skillName);
    onUpdateEvaluation({
      id: existing?.id ?? `eval-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      roundId,
      employeeId: emp.id,
      employeeName: emp.name,
      position: emp.position,
      department: emp.department,
      skillName: std.skillName,
      category: std.category,
      targetLevel: std.targetLevel,
      resultLevel: level,
      cycle,
      attemptNumber: attempt,
      evaluatedAt: new Date().toISOString().split('T')[0],
      assessorName,
      remark: existing?.remark,
    });
    closeScorePopover();
  };

  const handleRemarkBlur = (std: SkillStandard, value: string) => {
    const existing = findEval(std.skillName);
    if (!existing) return;
    onUpdateEvaluation({ ...existing, remark: value });
  };

  const handleSaveRound = () => {
    onSaveRound({
      id: roundId,
      employeeId: emp.id,
      cycle,
      attemptNumber: attempt,
      actionPeriodFrom: actionFrom,
      actionPeriodTo: actionTo,
      assessorName,
      assessorSignature: assessorSig ?? undefined,
      deptManagerName,
      deptManagerSignature: deptManagerSig ?? undefined,
      hrDeptName,
      hrDeptSignature: hrDeptSig ?? undefined,
      signedAt: new Date().toISOString().split('T')[0],
    });
    alert(`บันทึกผลประเมิน (ครั้งที่ ${attempt}) เรียบร้อยแล้ว!`);
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '16px 20px 0' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Action Period จาก</label>
          <input type="date" className="form-control" value={actionFrom} onChange={(e) => setActionFrom(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">ถึง</label>
          <input type="date" className="form-control" value={actionTo} onChange={(e) => setActionTo(e.target.value)} />
        </div>
      </div>

      <div className="table-responsive" style={{ padding: '16px 20px 0' }}>
        <table className="custom-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '38%' }}>หัวข้อทักษะ</th>
              <th style={{ textAlign: 'center' }}>เป้าหมาย</th>
              <th style={{ textAlign: 'center' }}>ผลจริง</th>
              <th>หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            {standards.map((std) => {
              const ev = findEval(std.skillName);
              const actual = ev ? ev.resultLevel : null;
              const isEditing = editingSkillId === std.id;
              return (
                <tr key={std.id}>
                  <td>
                    {std.skillName}
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{std.category}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <PieIcon level={std.targetLevel} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={(e) => openScorePopover(std.id, e.currentTarget)}
                      title="คลิกเพื่อประเมินระดับทักษะ"
                    >
                      <PieIcon level={actual ?? 0} />
                      <Edit3 size={12} style={{ opacity: 0.5 }} />
                    </button>
                    {isEditing &&
                      popoverPos &&
                      createPortal(
                        <>
                          <div className="score-popover-backdrop" onClick={closeScorePopover} />
                          <div
                            className="score-popover"
                            style={{ position: 'fixed', top: popoverPos.top, left: popoverPos.left, transform: 'translateX(-50%)', marginTop: 0 }}
                          >
                            {LEVELS.map((lvl) => (
                              <button
                                key={lvl}
                                className={`score-popover-btn ${actual === lvl ? 'active' : ''}`}
                                title={LEVEL_LABEL[lvl]}
                                onClick={() => handleScoreSelect(std, lvl)}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </>,
                        document.body
                      )}
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      defaultValue={ev?.remark ?? ''}
                      disabled={!ev}
                      placeholder={ev ? '—' : 'กรอกคะแนนก่อน'}
                      onBlur={(e) => handleRemarkBlur(std, e.target.value)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '0 20px 20px' }}>
        <button className="btn btn-primary" onClick={handleSaveRound}>
          <CheckCircle2 size={16} /> บันทึกผลประเมิน (ครั้งที่ {attempt})
        </button>
      </div>
    </>
  );
};
