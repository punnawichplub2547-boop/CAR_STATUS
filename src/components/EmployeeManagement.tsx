import React, { useRef, useState } from 'react';
import { Users, Search, Filter, UserPlus, Network, Pencil, Camera } from 'lucide-react';
import type { Employee } from '../types';

interface EmployeeManagementProps {
  employees: Employee[];
  onAddEmployee: (newEmp: Employee) => void;
  onEditEmployee: (updatedEmp: Employee) => void;
}

const DEPARTMENT_OPTIONS = [
  { value: 'FMG-A', label: 'FMG-A (ผลิตยาง)' },
  { value: 'HR&GA IT', label: 'HR&GA IT' },
  { value: 'HR&GA', label: 'HR&GA Safety' },
  { value: 'QA/QC', label: 'QA/QC' },
  { value: 'PD', label: 'PD (แผนกผลิต)' },
];

const statusLabel: Record<Employee['status'], string> = {
  PROBATION: 'ทดลองงาน (Probation)',
  PERMANENT: 'พนักงานประจำ',
  RESIGNED: 'ลาออกแล้ว',
};

// Recursive org chart node — children resolved from employees[].supervisorId
const OrgNode: React.FC<{ employee: Employee; employees: Employee[]; isRoot?: boolean }> = ({
  employee,
  employees,
  isRoot,
}) => {
  const reports = employees.filter((e) => e.supervisorId === employee.id);

  if (isRoot) {
    return (
      <div className="glass-card" style={{ padding: 16, width: 220 }}>
        <div className="badge badge-purple" style={{ marginBottom: 8 }}>{employee.position}</div>
        <div style={{ fontWeight: 600 }}>{employee.name}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{employee.department}</div>

        {reports.length > 0 && (
          <>
            <div style={{ width: 2, height: 16, background: 'var(--border-color)', margin: '12px auto 8px' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reports.map((r) => (
                <OrgNode key={r.id} employee={r} employees={employees} />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="glass-card" style={{ padding: 10, background: 'rgba(255,255,255,0.03)', textAlign: 'left' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{employee.name}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {employee.position}
          {employee.status === 'PROBATION' ? ' (Probation)' : ''}
        </div>
      </div>

      {reports.length > 0 && (
        <div style={{ marginLeft: 16, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {reports.map((r) => (
            <OrgNode key={r.id} employee={r} employees={employees} />
          ))}
        </div>
      )}
    </div>
  );
};

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  employees,
  onAddEmployee,
  onEditEmployee,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'orgChart'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState<Employee | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editForm) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditForm((prev) => (prev ? { ...prev, avatar: reader.result as string } : prev));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const closeProfileModal = () => {
    setViewingEmployee(null);
    setEditForm(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    const supervisor = employees.find((s) => s.id === editForm.supervisorId);
    const updated: Employee = { ...editForm, supervisorName: supervisor?.name };
    onEditEmployee(updated);
    setViewingEmployee(updated);
    setEditForm(null);
  };

  // Add Employee Form State
  const [empCode, setEmpCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('FMG-A');
  const [section, setSection] = useState('');
  const [position, setPosition] = useState('พนักงานทั่วไป');
  const [status, setStatus] = useState<'PROBATION' | 'PERMANENT'>('PROBATION');
  const [role, setRole] = useState<Employee['role']>('EMPLOYEE');
  const [supervisorId, setSupervisorId] = useState('');
  const [avatar, setAvatar] = useState(
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  );
  const newAvatarInputRef = useRef<HTMLInputElement>(null);

  const handleNewAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

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
    const supervisor = employees.find((s) => s.id === supervisorId);
    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      empCode,
      name,
      email: email || `${empCode}@example.com`,
      department,
      section: section || `${department} Section`,
      position,
      startingDate: new Date().toISOString().split('T')[0],
      status,
      avatar,
      role,
      supervisorId: supervisorId || undefined,
      supervisorName: supervisor?.name,
    };
    onAddEmployee(newEmp);
    setShowAddModal(false);
    // reset
    setEmpCode('');
    setName('');
    setEmail('');
    setSection('');
    setRole('EMPLOYEE');
    setSupervisorId('');
    setAvatar('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');
  };

  return (
    <div className="employee-page content-container">
      <div className="page-header">
        <div>
          <div className="eyebrow-tag">
            <Users size={14} /> EMPLOYEE DIRECTORY • รายชื่อพนักงานทั้งหมด
          </div>
          <h1 className="page-title gradient-text">ข้อมูลพนักงาน & ผังองค์กร</h1>
          <p className="page-subtitle">
            ดูรายชื่อ ตำแหน่ง แผนก ของพนักงานทั้งหมดได้ที่นี่
          </p>
        </div>
        <div className="header-actions" style={{ width: '100%', justifyContent: 'space-between' }}>
          <div className="btn-group" style={{ display: 'flex', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: 4, borderRadius: 12 }}>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('list')}
            >
              <Users size={16} /> รายชื่อพนักงาน
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'orgChart' ? 'btn-primary' : 'btn-ghost'}`}
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
                  <th>สถานะ</th>
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
                    <td>
                      {emp.status === 'PROBATION' ? (
                        <span className="badge badge-amber">ทดลองงาน (Probation)</span>
                      ) : (
                        <span className="badge badge-green">พนักงานประจำ</span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => setViewingEmployee(emp)}>ดูประวัติ</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Org Chart View — derived from employees[].supervisorId, not hardcoded */
        <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
          <h2 style={{ marginBottom: 20 }}>โครงสร้างองค์กร (CAR Organization Chart)</h2>

          {/* Managing Director Top Node — no employee record backs this role in the data */}
          <div style={{ display: 'inline-block', padding: '16px 24px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: 12, marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#60a5fa' }}>Managing Director (MD)</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ผู้บริหารสูงสุด บจก. คอมพลีท โอโต รับเบอร์</div>
          </div>

          <div style={{ width: 2, height: 24, background: 'var(--border-color)', margin: '0 auto 24px' }}></div>

          {/* Department heads: employees with no supervisorId */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 30, flexWrap: 'wrap' }}>
            {employees
              .filter((e) => !e.supervisorId)
              .map((head) => (
                <OrgNode key={head.id} employee={head} employees={employees} isRoot />
              ))}
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 760 }}>
            <div className="modal-header">
              <h3>เพิ่มพนักงานใหม่ (Add Employee)</h3>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24 }}>
                  <div style={{ position: 'relative', width: 72, height: 72, flex: 'none' }}>
                    <img
                      src={avatar}
                      alt="พรีวิวรูปพนักงานใหม่"
                      style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => newAvatarInputRef.current?.click()}
                      title="เปลี่ยนรูปภาพ"
                      style={{
                        position: 'absolute',
                        bottom: -6,
                        right: -6,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: '2px solid var(--bg-card)',
                        background: 'var(--primary)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Camera size={14} />
                    </button>
                    <input
                      ref={newAvatarInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleNewAvatarFileChange}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
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
                </div>

                <div className="grid-cols-2" style={{ gap: 12 }}>
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
                    <label className="form-label">อีเมล</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="เช่น name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">แผนก</label>
                    <select
                      className="form-control"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
                      {DEPARTMENT_OPTIONS.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">หน่วยงาน</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={`${department} Section`}
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ตำแหน่งงาน</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="เช่น พนักงานทั่วไป / เจ้าหน้าที่"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">สถานะพนักงาน</label>
                    <select
                      className="form-control"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'PROBATION' | 'PERMANENT')}
                    >
                      <option value="PROBATION">ทดลองงาน (Probation)</option>
                      <option value="PERMANENT">พนักงานประจำ (Permanent)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">สิทธิ์ผู้ใช้</label>
                    <select
                      className="form-control"
                      value={role}
                      onChange={(e) => setRole(e.target.value as Employee['role'])}
                    >
                      <option value="EMPLOYEE">EMPLOYEE</option>
                      <option value="SUPERVISOR">SUPERVISOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">หัวหน้างาน</label>
                    <select
                      className="form-control"
                      value={supervisorId}
                      onChange={(e) => setSupervisorId(e.target.value)}
                    >
                      <option value="">- ไม่มี (หัวหน้าแผนก) -</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>{e.empCode} - {e.name}</option>
                      ))}
                    </select>
                  </div>
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

      {/* Employee Profile Modal */}
      {viewingEmployee && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 760 }}>
            <div className="modal-header">
              <h3>{editForm ? 'แก้ไขข้อมูลพนักงาน (Edit Profile)' : 'ประวัติพนักงาน (Employee Profile)'}</h3>
            </div>

            {editForm ? (
              <form onSubmit={handleSaveEdit}>
                <div className="modal-body">
                  <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24 }}>
                    <div style={{ position: 'relative', width: 72, height: 72, flex: 'none' }}>
                      <img
                        src={editForm.avatar}
                        alt={editForm.name}
                        style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        title="เปลี่ยนรูปภาพ"
                        style={{
                          position: 'absolute',
                          bottom: -6,
                          right: -6,
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          border: '2px solid var(--bg-card)',
                          background: 'var(--primary)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Camera size={14} />
                      </button>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleAvatarFileChange}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                      <label className="form-label">ชื่อ - นามสกุล</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid-cols-2" style={{ gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">อีเมล</label>
                      <input
                        type="email"
                        className="form-control"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">ตำแหน่ง</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.position}
                        onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">แผนก</label>
                      <select
                        className="form-control"
                        value={editForm.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      >
                        {DEPARTMENT_OPTIONS.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">หน่วยงาน</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.section}
                        onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">สถานะ</label>
                      <select
                        className="form-control"
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Employee['status'] })}
                      >
                        <option value="PROBATION">ทดลองงาน (Probation)</option>
                        <option value="PERMANENT">พนักงานประจำ (Permanent)</option>
                        <option value="RESIGNED">ลาออกแล้ว (Resigned)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">สิทธิ์ผู้ใช้</label>
                      <select
                        className="form-control"
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Employee['role'] })}
                      >
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="SUPERVISOR">SUPERVISOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">หัวหน้างาน</label>
                      <select
                        className="form-control"
                        value={editForm.supervisorId || ''}
                        onChange={(e) => setEditForm({ ...editForm, supervisorId: e.target.value || undefined })}
                      >
                        <option value="">- ไม่มี (หัวหน้าแผนก) -</option>
                        {employees
                          .filter((e) => e.id !== editForm.id)
                          .map((e) => (
                            <option key={e.id} value={e.id}>{e.empCode} - {e.name}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditForm(null)}>
                    ยกเลิก
                  </button>
                  <button type="submit" className="btn btn-primary">
                    บันทึกการแก้ไข
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="modal-body">
                  <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 28 }}>
                    <img
                      src={viewingEmployee.avatar}
                      alt={viewingEmployee.name}
                      style={{ width: 88, height: 88, borderRadius: 16, objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.4rem' }}>{viewingEmployee.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>{viewingEmployee.position}</div>
                    </div>
                  </div>

                  <div className="grid-cols-2" style={{ gap: '18px 24px', fontSize: '1rem' }}>
                    <div><strong>รหัสพนักงาน:</strong> {viewingEmployee.empCode}</div>
                    <div><strong>อีเมล:</strong> {viewingEmployee.email}</div>
                    <div><strong>แผนก:</strong> {viewingEmployee.department}</div>
                    <div><strong>หน่วยงาน:</strong> {viewingEmployee.section}</div>
                    <div><strong>วันเริ่มงาน:</strong> {viewingEmployee.startingDate}</div>
                    <div><strong>สถานะ:</strong> {statusLabel[viewingEmployee.status]}</div>
                    <div><strong>สิทธิ์ผู้ใช้:</strong> {viewingEmployee.role}</div>
                    <div>
                      <strong>หัวหน้างาน:</strong>{' '}
                      {employees.find((e) => e.id === viewingEmployee.supervisorId)?.name ||
                        viewingEmployee.supervisorName ||
                        '-'}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditForm({ ...viewingEmployee })}
                  >
                    <Pencil size={16} /> แก้ไขข้อมูล
                  </button>
                  <button type="button" className="btn btn-primary" onClick={closeProfileModal}>
                    ปิด
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
