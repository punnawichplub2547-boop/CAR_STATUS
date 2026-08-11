import React from 'react';
import { GraduationCap } from 'lucide-react';
import { OrientationExport } from './OrientationExport';

export const TrainingManagement: React.FC<{ onNavigateToExam?: (batchId?: string) => void }> = ({ onNavigateToExam }) => {
  return (
    <div className="training-page content-container">
      <div className="page-header">
        <div>
          <div className="eyebrow-tag">
            <GraduationCap size={14} /> TRAINING MANAGEMENT • บันทึกการอบรม (F-HR-002)
          </div>
          <h1 className="page-title gradient-text">ระบบบันทึกการฝึกอบรม (F-HR-002)</h1>
          <p className="page-subtitle">
            ปฐมนิเทศพนักงานใหม่ — ดึงรายชื่อพนักงานใหม่ที่ยังไม่ผ่านการสอบ กรอกรายละเอียดการอบรม แล้ว export เป็น F-HR-002
          </p>
        </div>
      </div>

      <OrientationExport onNavigateToExam={onNavigateToExam} />
    </div>
  );
};
