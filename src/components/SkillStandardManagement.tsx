import React, { useState } from 'react';
import { ListChecks, Search, Filter, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import type { SkillStandard, SkillLevel } from '../types';
import type { SkillStandardPayload } from '../utils/api';

interface SkillStandardManagementProps {
  standards: SkillStandard[];
  onAddSkillStandard: (payload: SkillStandardPayload) => void;
  onEditSkillStandard: (id: string, payload: SkillStandardPayload) => void;
  onDeleteSkillStandard: (id: string) => void;
  error: string | null;
}

const DEPARTMENT_OPTIONS = [
  { value: 'FMG-A', label: 'FMG-A (ผลิตยาง)' },
  { value: 'HR&GA IT', label: 'HR&GA IT' },
  { value: 'HR&GA', label: 'HR&GA Safety' },
  { value: 'QA/QC', label: 'QA/QC' },
  { value: 'PD', label: 'PD (แผนกผลิต)' },
];

const LEVEL_LABEL: Record<SkillLevel, string> = {
  0: 'ไม่ผ่าน',
  25: 'ควบคุม',
  50: 'คอยตรวจ',
  75: 'ทำได้เอง',
  100: 'สอนงานได้',
};

const emptyPayload = (): SkillStandardPayload => ({
  department: 'FMG-A',
  position: '',
  category: '',
  skillName: '',
  targetLevel: 50,
});

export const SkillStandardManagement: React.FC<SkillStandardManagementProps> = ({
  standards,
  onAddSkillStandard,
  onEditSkillStandard,
  onDeleteSkillStandard,
  error,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<SkillStandardPayload>(emptyPayload());
  const [viewingStandard, setViewingStandard] = useState<SkillStandard | null>(null);
  const [editForm, setEditForm] = useState<SkillStandard | null>(null);

  const filteredStandards = standards.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      s.skillName.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.position.toLowerCase().includes(q);
    const matchesDept = deptFilter === 'ALL' || s.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const closeProfileModal = () => {
    setViewingStandard(null);
    setEditForm(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.position.trim() || !addForm.category.trim() || !addForm.skillName.trim()) return;
    onAddSkillStandard(addForm);
    setShowAddModal(false);
    setAddForm(emptyPayload());
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    onEditSkillStandard(editForm.id, {
      department: editForm.department,
      position: editForm.position,
      category: editForm.category,
      skillName: editForm.skillName,
      targetLevel: editForm.targetLevel,
    });
    setViewingStandard(editForm);
    setEditForm(null);
  };

  const handleDelete = () => {
    if (!viewingStandard) return;
    if (!window.confirm(`ยืนยันการลบมาตรฐานทักษะ "${viewingStandard.skillName}" ?`)) return;
    onDeleteSkillStandard(viewingStandard.id);
    closeProfileModal();
  };

  return (
    <div className="employee-page content-container">
      <div className="page-header">
        <div>
          <div className="eyebrow-tag">
            <ListChecks size={14} /> F-HR-005 • มาตรฐานทักษะความสามารถประจำตำแหน่ง
          </div>
          <h1 className="page-title gradient-text">มาตรฐานทักษะ (F-HR-005)</h1>
          <p className="page-subtitle">
            กำหนดหัวข้อทักษะและระดับเป้าหมายต่อแผนก/ตำแหน่ง — ใช้เป็นฐานข้อมูลให้ Skill Matrix (F-HR-014) และ OJT Form A (F-HR-004) ดึงไปใช้อัตโนมัติ
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> เพิ่มมาตรฐานทักษะ
          </button>
        </div>
      </div>

      {error && (
        <div
          className="glass-card"
          style={{ padding: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--danger, #dc2626)' }}
        >
          <AlertTriangle size={18} /> ไม่สามารถโหลดมาตรฐานทักษะจากระบบได้: {error}
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div className="form-group" style={{ margin: 0, flex: 1 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="ค้นหาชื่อทักษะ, หมวดหมู่ หรือตำแหน่ง..."
              className="form-control"
              style={{ paddingLeft: 36 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} className="text-muted" />
          <select className="form-control" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="ALL">ทุกแผนก (All Departments)</option>
            {DEPARTMENT_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Standards Table */}
      <div className="glass-card table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>แผนก</th>
              <th>ตำแหน่ง</th>
              <th>หมวดหมู่</th>
              <th>ชื่อทักษะ</th>
              <th>เป้าหมาย</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredStandards.map((s) => (
              <tr key={s.id}>
                <td><span className="badge badge-blue">{s.department}</span></td>
                <td>{s.position}</td>
                <td>{s.category}</td>
                <td>{s.skillName}</td>
                <td>{LEVEL_LABEL[s.targetLevel]}</td>
                <td>
                  <button className="btn btn-sm btn-secondary" onClick={() => setViewingStandard(s)}>ดูรายละเอียด</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Standard Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3>เพิ่มมาตรฐานทักษะ (Add Skill Standard)</h3>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="grid-cols-2" style={{ gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">แผนก</label>
                    <select
                      className="form-control"
                      value={addForm.department}
                      onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                    >
                      {DEPARTMENT_OPTIONS.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">ตำแหน่ง*</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="เช่น พนักงานทั่วไป / หัวหน้าแผนก"
                      value={addForm.position}
                      onChange={(e) => setAddForm({ ...addForm, position: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">หมวดหมู่*</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="เช่น Functional Competency"
                      value={addForm.category}
                      onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ระดับเป้าหมาย</label>
                    <select
                      className="form-control"
                      value={addForm.targetLevel}
                      onChange={(e) => setAddForm({ ...addForm, targetLevel: Number(e.target.value) as SkillLevel })}
                    >
                      {(Object.keys(LEVEL_LABEL) as unknown as SkillLevel[]).map((lvl) => (
                        <option key={lvl} value={lvl}>{lvl} - {LEVEL_LABEL[lvl]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">ชื่อทักษะ*</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="เช่น การทำ 5 ส."
                      value={addForm.skillName}
                      onChange={(e) => setAddForm({ ...addForm, skillName: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  บันทึกมาตรฐานทักษะ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standard View / Edit Modal */}
      {viewingStandard && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3>{editForm ? 'แก้ไขมาตรฐานทักษะ (Edit)' : 'รายละเอียดมาตรฐานทักษะ'}</h3>
            </div>

            {editForm ? (
              <form onSubmit={handleSaveEdit}>
                <div className="modal-body">
                  <div className="grid-cols-2" style={{ gap: 12 }}>
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
                      <label className="form-label">ตำแหน่ง</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.position}
                        onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">หมวดหมู่</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">ระดับเป้าหมาย</label>
                      <select
                        className="form-control"
                        value={editForm.targetLevel}
                        onChange={(e) => setEditForm({ ...editForm, targetLevel: Number(e.target.value) as SkillLevel })}
                      >
                        {(Object.keys(LEVEL_LABEL) as unknown as SkillLevel[]).map((lvl) => (
                          <option key={lvl} value={lvl}>{lvl} - {LEVEL_LABEL[lvl]}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">ชื่อทักษะ</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.skillName}
                        onChange={(e) => setEditForm({ ...editForm, skillName: e.target.value })}
                        required
                      />
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
                  <div className="grid-cols-2" style={{ gap: '18px 24px', fontSize: '1rem' }}>
                    <div><strong>แผนก:</strong> {viewingStandard.department}</div>
                    <div><strong>ตำแหน่ง:</strong> {viewingStandard.position}</div>
                    <div><strong>หมวดหมู่:</strong> {viewingStandard.category}</div>
                    <div><strong>ระดับเป้าหมาย:</strong> {viewingStandard.targetLevel} - {LEVEL_LABEL[viewingStandard.targetLevel]}</div>
                    <div style={{ gridColumn: '1 / -1' }}><strong>ชื่อทักษะ:</strong> {viewingStandard.skillName}</div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-danger" onClick={handleDelete}>
                    <Trash2 size={16} /> ลบ
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditForm({ ...viewingStandard })}>
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
