import React, { useState } from 'react';
import { Users, Search, Filter, UserPlus, Network } from 'lucide-react';
import type { Employee } from '../types';

interface EmployeeManagementProps {
  employees: Employee[];
  onAddEmployee: (newEmp: Employee) => void;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  employees,
  onAddEmployee,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'orgChart'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [empCode, setEmpCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('FMG-A');
  const [position, setPosition] = useState('พนักงานทั่วไป');
  const [status, setStatus] = useState<'PROBATION' | 'PERMANENT'>('PROBATION');

  const filteredEmployees = employees.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.empCode.includes(searchTerm) ||
      e.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || e.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !empCode) return;
    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      empCode,
      name,
      email: email || `${empCode}@example.com`,
      department,
      section: `${department} Section`,
      position,
      startingDate: new Date().toISOString().split('T')[0],
      status,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: 'EMPLOYEE',
    };
    onAddEmployee(newEmp);
    setShowAddModal(false);
    // reset
    setEmpCode('');
    setName('');
    setEmail('');
  };

  return (
    <div className="employee-page">
      <div className="page-header">
        <div>
          <h1 className="page-title gradient-text">ข้อมูลประวัติพนักงาน & โครงสร้างองค์กร</h1>
          <p className="page-subtitle">
            ฐานข้อมูลกลางรายบุคคล แสดงประวัติ ตำแหน่ง แผนก อายุงาน และสายการบังคับบัญชา
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="btn-group" style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 10 }}>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('list')}
            >
              <Users size={16} /> รายชื่อพนักงาน
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'orgChart' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('orgChart')}
            >
              <Network size={16} /> โครงสร้างองค์กร (Org Chart)
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <UserPlus size={18} /> เพิ่มพนักงานใหม่
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <>
          {/* Filters Bar */}
          <div className="glass-card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
            <div className="form-group" style={{ margin: 0, flex: 1 }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, รหัสพนักงาน หรือตำแหน่ง..."
                  className="form-control"
                  style={{ paddingLeft: 36 }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={16} className="text-muted" />
              <select
                className="form-control"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="ALL">ทุกแผนก (All Departments)</option>
                <option value="HR&GA IT">HR&GA IT</option>
                <option value="HR&GA">HR&GA Safety</option>
                <option value="FMG-A">FMG-A (การผลิตยาง)</option>
                <option value="QA/QC">QA/QC</option>
                <option value="PD">PD (แผนกผลิต)</option>
              </select>
            </div>
          </div>

          {/* Employee Table */}
          <div className="glass-card table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>รหัสพนักงาน</th>
                  <th>ชื่อ - นามสกุล</th>
                  <th>แผนก / หน่วยงาน</th>
                  <th>ตำแหน่ง</th>
                  <th>วันเริ่มงาน</th>
                  <th>สถานะ</th>
                  <th>สิทธิ์ผู้ใช้</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{emp.empCode}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={emp.avatar} alt={emp.name} style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{emp.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-blue">{emp.department}</span>
                    </td>
                    <td>{emp.position}</td>
                    <td>{emp.startingDate}</td>
                    <td>
                      {emp.status === 'PROBATION' ? (
                        <span className="badge badge-amber">ทดลองงาน (Probation)</span>
                      ) : (
                        <span className="badge badge-green">พนักงานประจำ</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-purple">{emp.role}</span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-secondary">ดูประวัติ</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Org Chart View */
        <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
          <h2 style={{ marginBottom: 20 }}>โครงสร้างองค์กร (CAR Organization Chart)</h2>

          {/* Managing Director Top Node */}
          <div style={{ display: 'inline-block', padding: '16px 24px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: 12, marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#60a5fa' }}>Managing Director (MD)</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ผู้บริหารสูงสุด บจก. คอมพลีท โอโต รับเบอร์</div>
          </div>

          <div style={{ width: 2, height: 24, background: 'var(--border-color)', margin: '0 auto 24px' }}></div>

          {/* Department Managers Row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 30, flexWrap: 'wrap' }}>
            <div className="glass-card" style={{ padding: 16, width: 220 }}>
              <div className="badge badge-purple" style={{ marginBottom: 8 }}>HR&GA IT Manager</div>
              <div style={{ fontWeight: 600 }}>นางสาว สมหญิง ใจดี</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>HR&GA IT Officer</div>
            </div>

            <div className="glass-card" style={{ padding: 16, width: 220 }}>
              <div className="badge badge-blue" style={{ marginBottom: 8 }}>FMG Department Manager</div>
              <div style={{ fontWeight: 600 }}>นาย มานพ ตั้งมั่น</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FMG Section Manager</div>
              
              <div style={{ width: 2, height: 16, background: 'var(--border-color)', margin: '12px auto 8px' }}></div>
              <div className="glass-card" style={{ padding: 10, background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>นาย ประเสริฐ ยิ้มแย้ม</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>พนักงานทั่วไป (Probation)</div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 16, width: 220 }}>
              <div className="badge badge-green" style={{ marginBottom: 8 }}>Safety & QA Manager</div>
              <div style={{ fontWeight: 600 }}>น.ส. วรรณา สุขเจริญ</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>เจ้าหน้าที่ จป.อาวุโส</div>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>เพิ่มพนักงานใหม่ (Add Employee)</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">รหัสพนักงาน (Emp Code)*</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="เช่น 6906007"
                    value={empCode}
                    onChange={(e) => setEmpCode(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ชื่อ - นามสกุล*</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="เช่น นาย สมชาย สายเสนอ"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid-cols-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">แผนก (Department)</label>
                    <select
                      className="form-control"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
                      <option value="FMG-A">FMG-A (ผลิตยาง)</option>
                      <option value="HR&GA IT">HR&GA IT</option>
                      <option value="HR&GA">HR&GA Safety</option>
                      <option value="QA/QC">QA/QC</option>
                      <option value="PD">PD (แผนกผลิต)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">สถานะพนักงาน</label>
                    <select
                      className="form-control"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                    >
                      <option value="PROBATION">ทดลองงาน (Probation)</option>
                      <option value="PERMANENT">พนักงานประจำ (Permanent)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">ตำแหน่งงาน (Position)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="เช่น พนักงานทั่วไป / เจ้าหน้าที่"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  บันทึกข้อมูลพนักงาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
