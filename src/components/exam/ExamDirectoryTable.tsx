import React, { useState, useEffect, useMemo } from 'react';
import { Search, Eye, ShieldCheck } from 'lucide-react';
import type { Employee, GoogleFormExamResult, ExamType, PreTestLockMap, OrientationBatch } from '../../types';
import { calculateTenure } from '../../utils/dateUtils';

interface ExamDirectoryTableProps {
  employees: Employee[];
  orientationBatches: OrientationBatch[];
  selectedBatchId: string;
  setSelectedBatchId: (id: string) => void;
  selectedDeptFilter: string;
  setSelectedDeptFilter: (dept: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  preTestLockMap: PreTestLockMap;
  selectedExamType: ExamType;
  examResultsMap: Record<string, GoogleFormExamResult[]>;
  onTogglePreTestLock: (empCode: string) => void;
  onUnlockBatch: (batch: OrientationBatch) => void;
  onViewResult: (res: GoogleFormExamResult) => void;
}

export const ExamDirectoryTable: React.FC<ExamDirectoryTableProps> = ({
  employees,
  orientationBatches,
  selectedBatchId,
  setSelectedBatchId,
  selectedDeptFilter,
  setSelectedDeptFilter,
  searchQuery,
  setSearchQuery,
  preTestLockMap,
  selectedExamType,
  examResultsMap,
  onTogglePreTestLock,
  onUnlockBatch,
  onViewResult,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const selectedBatch = useMemo(() => {
    if (selectedBatchId === 'ALL') return null;
    return orientationBatches.find((b) => b.id === selectedBatchId) || null;
  }, [selectedBatchId, orientationBatches]);

  const getEmployeeExamResults = (empCode: string): GoogleFormExamResult[] => {
    const key = (empCode || '').trim().toUpperCase();
    return examResultsMap[key] || examResultsMap[empCode] || [];
  };

  // Filtered employees with useMemo to eliminate render lag
  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const batchCodes = selectedBatch ? new Set(selectedBatch.empCodes.map((c) => c.trim().toUpperCase())) : null;

    return employees.filter((e) => {
      const matchesDept = selectedDeptFilter === 'ALL' || e.department === selectedDeptFilter;
      const matchesSearch = !q || e.name.toLowerCase().includes(q) || e.empCode.toLowerCase().includes(q);
      const matchesBatch = !batchCodes || batchCodes.has(e.empCode.trim().toUpperCase());
      return matchesDept && matchesSearch && matchesBatch;
    });
  }, [employees, selectedDeptFilter, selectedBatch, searchQuery]);

  // Comprehensive HR Admin Stats Overview
  const hrStats = useMemo(() => {
    let passedBoth = 0;
    let attemptedSome = 0;
    let pendingAny = 0;

    employees.forEach((emp) => {
      const codeKey = (emp.empCode || '').trim().toUpperCase();
      const allRecords = examResultsMap[codeKey] || examResultsMap[emp.empCode] || [];
      const safetyPassed = allRecords.some((r) => (r.examType === 'SAFETY_ATTITUDE' || r.totalQuestions === 14) && r.isPassed);
      const oriPassed = allRecords.some((r) => (r.examType === 'ORIENTATION' || r.totalQuestions === 30) && r.isPassed);

      if (safetyPassed && oriPassed) {
        passedBoth++;
      } else if (allRecords.length > 0) {
        attemptedSome++;
      } else {
        pendingAny++;
      }
    });

    return { passedBoth, attemptedSome, pendingAny, total: employees.length };
  }, [employees, examResultsMap]);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDeptFilter, selectedBatchId, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedEmployees = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredEmployees.slice(start, start + PAGE_SIZE);
  }, [filteredEmployees, safePage]);

  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>📊 ทะเบียนติดตามผลสอบ Google Forms พนักงานทั้งหมด (HR Executive Dashboard)</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            ตรวจสอบคะแนนสอบล่าสุด ประวัติการทำซ้ำ สถิติรวม และคำตอบที่ผิดของพนักงานรายบุคคล
          </span>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <select
            className="form-control"
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            style={{
              borderRadius: 12,
              width: 'auto',
              background: selectedBatchId !== 'ALL' ? 'rgba(37, 99, 235, 0.1)' : undefined,
              borderColor: selectedBatchId !== 'ALL' ? '#2563eb' : undefined,
              fontWeight: selectedBatchId !== 'ALL' ? 600 : undefined,
            }}
          >
            <option value="ALL">📋 รอบอบรม F-HR-002 ทั้งหมด</option>
            {orientationBatches.map((b) => (
              <option key={b.id} value={b.id}>
                📅 วันที่ {b.trainingDate} — 🎓 {b.batchName} ({b.empCodes.length} คน)
              </option>
            ))}
          </select>

          <select
            className="form-control"
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            style={{ borderRadius: 12, width: 'auto' }}
          >
            <option value="ALL">ทุกแผนกทั้งหมด</option>
            <option value="FMG-A">FMG-A</option>
            <option value="QA/QC">QA/QC</option>
            <option value="HR&GA IT">HR&GA IT</option>
            <option value="HR&GA">HR&GA</option>
          </select>

          <div style={{ position: 'relative', width: 220 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="ค้นหาชื่อ/รหัส..."
              className="form-control"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 34, borderRadius: 12 }}
            />
          </div>
        </div>
      </div>

      {/* HR Admin Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ background: 'rgba(37, 99, 235, 0.05)', border: '1px solid rgba(37, 99, 235, 0.2)', padding: '12px 16px', borderRadius: 12 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>👥 พนักงานทั้งหมด</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1d4ed8', marginTop: 2 }}>{hrStats.total} คน</div>
        </div>
        <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px 16px', borderRadius: 12 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>✅ ผ่านครบทั้ง 2 ชุด</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#047857', marginTop: 2 }}>{hrStats.passedBoth} คน</div>
        </div>
        <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '12px 16px', borderRadius: 12 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>⏳ อยู่ระหว่างทำข้อสอบ</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b45309', marginTop: 2 }}>{hrStats.attemptedSome} คน</div>
        </div>
        <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px 16px', borderRadius: 12 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>🔴 ยังไม่ได้เริ่มสอบ</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b91c1c', marginTop: 2 }}>{hrStats.pendingAny} คน</div>
        </div>
      </div>

      {selectedBatch && (
        <div
          style={{
            background: 'rgba(37, 99, 235, 0.08)',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: selectedBatch.courseTopics?.length ? 10 : 0 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#1d4ed8' }}>
                🎓 รอบการอบรม F-HR-002: {selectedBatch.batchName} {selectedBatch.courseName ? `(${selectedBatch.courseName})` : ''}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                วันที่อบรม: {selectedBatch.trainingDate} • วิทยากร: {selectedBatch.instructor || '-'} • สถานที่: {selectedBatch.location || '-'} • ผู้เข้าร่วมอบรม: <strong>{selectedBatch.empCodes.length} คน</strong>
              </div>
            </div>
            <button
              className="btn btn-xs btn-primary"
              onClick={() => onUnlockBatch(selectedBatch)}
              style={{ borderRadius: 10, padding: '6px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <ShieldCheck size={14} /> ปลดล็อคสอบหลังอบรม (Post-Test) ทั้งรอบนี้
            </button>
          </div>

          {selectedBatch.courseTopics && selectedBatch.courseTopics.length > 0 && (
            <div style={{ background: 'rgba(255, 255, 255, 0.5)', border: '1px dashed rgba(37, 99, 235, 0.3)', padding: '10px 14px', borderRadius: 10 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1d4ed8', marginBottom: 4 }}>
                📚 เนื้อหาหลักสูตรการอบรมในรอบนี้ ({selectedBatch.courseTopics.length} หัวข้อ):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '4px 12px', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                {selectedBatch.courseTopics.map((topic, i) => (
                  <div key={i}>• {topic}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="table-responsive">
        <table className="table" style={{ width: '100%', fontSize: '0.88rem' }}>
          <thead>
            <tr>
              <th>พนักงาน</th>
              <th>แผนก / ตำแหน่ง</th>
              <th>📋 รอบอบรม F-HR-002</th>
              <th>🛡️ ทัศนคติความปลอดภัย (14 ข้อ)</th>
              <th>🏆 ประเมินการปฐมนิเทศ (30 ข้อ)</th>
              <th>สถานะรวม</th>
              <th>การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEmployees.map((emp: Employee) => {
              const empBatches = orientationBatches.filter(
                (b) => b.empCodes.some((code) => code.trim().toUpperCase() === emp.empCode.trim().toUpperCase())
              );

              const allRecords = getEmployeeExamResults(emp.empCode);
              const safetyRecords = allRecords.filter((r) => r.examType === 'SAFETY_ATTITUDE' || r.totalQuestions === 14);
              const oriRecords = allRecords.filter((r) => r.examType === 'ORIENTATION' || r.totalQuestions === 30);

              const safetyPre = safetyRecords.filter((r) => r.phase === 'PRE_TEST').pop();
              const safetyPost = safetyRecords.filter((r) => r.phase === 'POST_TEST').pop();

              const oriPre = oriRecords.filter((r) => r.phase === 'PRE_TEST').pop();
              const oriPost = oriRecords.filter((r) => r.phase === 'POST_TEST').pop();

              const isSafetyPassed = (safetyPost?.isPassed) || (safetyPre?.isPassed);
              const isOriPassed = (oriPost?.isPassed) || (oriPre?.isPassed);

              return (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <img src={emp.avatar} alt={emp.name} style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {emp.name}{' '}
                          {emp.startingDate && (
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 400, marginLeft: 4 }}>
                              (อายุงาน {calculateTenure(emp.startingDate)})
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{emp.empCode}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{emp.department}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{emp.position}</div>
                  </td>

                  {/* Orientation Batch Info Column */}
                  <td>
                    {empBatches.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {empBatches.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setSelectedBatchId(b.id)}
                            className={`badge ${b.category === 'REGULATION' ? 'badge-blue' : 'badge-green'}`}
                            style={{
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              border: 'none',
                              textAlign: 'left',
                              padding: '3px 8px',
                            }}
                            title={`คลิกเพื่อคัดกรองเฉพาะรอบอบรมนี้ (วิทยากร: ${b.instructor || '-'})`}
                          >
                            📅 {b.trainingDate} ({b.category === 'REGULATION' ? 'กฎระเบียบ' : 'ความปลอดภัย'})
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>- ไม่พบรอบอบรม -</span>
                    )}
                  </td>

                  {/* Safety 14Q Score Column */}
                  <td>
                    {safetyPre || safetyPost ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {safetyPre && (
                          <div style={{ fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-dim)' }}>Pre: </span>
                            <span style={{ fontWeight: 800, color: safetyPre.isPassed ? '#047857' : '#b91c1c' }}>
                              {safetyPre.score} / 14 ข้อ
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: 4 }}>({safetyPre.percentage}%)</span>
                          </div>
                        )}
                        {safetyPost && (
                          <div style={{ fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-dim)' }}>Post: </span>
                            <span style={{ fontWeight: 800, color: safetyPost.isPassed ? '#047857' : '#b91c1c' }}>
                              {safetyPost.score} / 14 ข้อ
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: 4 }}>({safetyPost.percentage}%)</span>
                          </div>
                        )}
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>({safetyRecords.length} รอบ)</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>ยังไม่มีข้อมูล (14 ข้อ)</span>
                    )}
                  </td>

                  {/* Orientation 30Q Score Column (Post-Test Only) */}
                  <td>
                    {oriPost || oriPre ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-dim)' }}>Post: </span>
                          <span style={{ fontWeight: 800, color: (oriPost || oriPre)!.isPassed ? '#047857' : '#b91c1c' }}>
                            {(oriPost || oriPre)!.score} / 30 ข้อ
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: 4 }}>
                            ({(oriPost || oriPre)!.percentage}%)
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>({oriRecords.length} รอบ)</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>ยังไม่มีข้อมูล (30 ข้อ)</span>
                    )}
                  </td>

                  {/* Overall Status Badge */}
                  <td>
                    {isSafetyPassed && isOriPassed ? (
                      <span className="badge badge-green">PASSED ทั้ง 2 ชุด (ผ่าน)</span>
                    ) : (safetyRecords.length > 0 || oriRecords.length > 0) ? (
                      <span className={`badge ${isSafetyPassed || isOriPassed ? 'badge-amber' : 'badge-red'}`}>
                        {isSafetyPassed || isOriPassed ? 'ผ่าน 1/2 ชุด' : 'FAILED (ต้องสอบใหม่)'}
                      </span>
                    ) : (
                      <span className="badge badge-amber">ยังไม่ได้ทำข้อสอบ</span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {(safetyPost || safetyPre) && (
                      <button
                        className="btn btn-xs btn-secondary"
                        onClick={() => onViewResult((safetyPost || safetyPre)!)}
                        style={{ borderRadius: 8, padding: '4px 8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        title="ดูคำตอบข้อสอบทัศนคติความปลอดภัย 14 ข้อ"
                      >
                        <Eye size={14} /> เฉลย (14 ข้อ)
                      </button>
                    )}

                    {(oriPost || oriPre) && (
                      <button
                        className="btn btn-xs btn-secondary"
                        onClick={() => onViewResult((oriPost || oriPre)!)}
                        style={{ borderRadius: 8, padding: '4px 8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        title="ดูคำตอบข้อสอบประเมินการปฐมนิเทศ 30 ข้อ"
                      >
                        <Eye size={14} /> เฉลย (30 ข้อ)
                      </button>
                    )}

                    <button
                      className={`btn btn-xs ${preTestLockMap[emp.empCode]?.[selectedExamType] ? 'btn-secondary' : 'btn-warning'}`}
                      onClick={() => onTogglePreTestLock(emp.empCode)}
                      style={{ borderRadius: 8, padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      title="HR สลับสถานะปิดก่อนอบรมเพื่อปลดล็อคการสอบหลังอบรม"
                    >
                      {preTestLockMap[emp.empCode]?.[selectedExamType] ? '🔓 Post-Test เปิด' : '🔒 HR กดปิด Pre-Test'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* High-Performance Pagination Controls */}
      {filteredEmployees.length > PAGE_SIZE && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            แสดงลำดับที่ <strong>{(safePage - 1) * PAGE_SIZE + 1}</strong> ถึง <strong>{Math.min(safePage * PAGE_SIZE, filteredEmployees.length)}</strong> จากทั้งหมด <strong>{filteredEmployees.length}</strong> พนักงาน
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn btn-xs btn-secondary"
              onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
              disabled={safePage === 1}
              style={{ borderRadius: 8, padding: '6px 14px', fontSize: '0.82rem', opacity: safePage === 1 ? 0.5 : 1 }}
            >
              ◀ หน้าก่อนหน้า
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0 8px' }}>
              หน้า {safePage} / {totalPages}
            </span>
            <button
              className="btn btn-xs btn-secondary"
              onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
              disabled={safePage === totalPages}
              style={{ borderRadius: 8, padding: '6px 14px', fontSize: '0.82rem', opacity: safePage === totalPages ? 0.5 : 1 }}
            >
              หน้าถัดไป ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
