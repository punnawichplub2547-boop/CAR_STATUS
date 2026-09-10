import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  BookOpen,
  Printer,
  ChevronRight,
  Shield,
  LayoutDashboard,
  Users,
  GraduationCap,
  FileCheck2,
  ClipboardCheck,
  Award,
  Target,
  FileSpreadsheet,
  Play,
} from 'lucide-react';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialChapter?: number;
}

interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badgeColor: string;
  summary: string;
  steps: string[];
  tips?: string[];
  docRef?: string;
  videoSrc?: string;
  videoCaption?: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: 'การเข้าสู่ระบบ (Login & Demo Mode)',
    subtitle: 'สลับโหมดใช้งานจริง (Production) vs โหมดทดสอบ (Demo)',
    icon: Shield,
    badgeColor: 'badge-blue',
    summary: 'ระบบมี 2 โหมดการเข้าสู่ระบบเพื่อความสะดวกในการสาธิต การทดสอบ และการใช้งานจริงในโรงงาน',
    steps: [
      'โหมดทดสอบ (Demo Mode): คลิกเลือกบทบาทที่ต้องการ (Admin, HR, Supervisor, Operator) เพื่อทดลองใช้งานในมุมมองนั้นๆ ได้ทันทีโดยไม่ต้องจำรหัสผ่าน',
      'โหมดใช้งานจริง (Production Mode): กรอกรหัสพนักงาน (เช่น EMP-1001) หรืออีเมลบริษัท พร้อมรหัสผ่านส่วนบุคคล เพื่อเข้าสู่ระบบผ่านฐานข้อมูลจริง',
      'จดจำการเข้าสู่ระบบ: ติ๊กเลือกเพื่อให้ระบบจำสถานะการล็อกอินไว้บนเครื่อง',
    ],
    tips: [
      'หากลืมรหัสผ่านในโหมดจริง ให้ติดต่อฝ่ายบุคคล (HR) หรือ IT Support',
      'สามารถสลับโหมดได้ตลอดเวลาจากแท็บด้านบนของการ์ดเข้าสู่ระบบ',
    ],
    videoSrc: '/assets/guides/guide_login.webp',
    videoCaption: '🎬 คลิปสาธิต: การสลับโหมดใช้งานจริง vs โหมดทดสอบ และการล็อกอินสลับ Role ใน 1 คลิก',
  },
  {
    id: 2,
    title: 'ภาพรวมระบบ (Executive Dashboard)',
    subtitle: 'ศูนย์รวม KPIs, Action Center และความพร้อมรับการ Audit',
    icon: LayoutDashboard,
    badgeColor: 'badge-purple',
    summary: 'หน้าแรกสำหรับผู้บริหารและหัวหน้างานเพื่อดูสถานะความสามารถบุคลากรทั้งโรงงานแบบเรียลไทม์',
    steps: [
      'KPI Cards: ติดตามจำนวนพนักงาน, พนักงานทดลองงาน, ชั่วโมงอบรมสะสม และใบเซอร์ใกล้หมดอายุ',
      'Action Center: กล่องเตือนด่วนสีส้ม/แดง สำหรับรายการที่ต้องดำเนินการทันที (ครบกำหนดประเมินโปร, ใบเซอร์หมดอายุ)',
      'Skill Radar Chart: กราฟเรดาร์เปรียบเทียบระดับทักษะจริง (Actual) กับเป้าหมาย (Target) แยกตามแผนก',
      'Audit Readiness %: ดัชนีความพร้อมในการตรวจประเมินตามมาตรฐาน IATF 16949 / ISO 9001',
    ],
    tips: [
      'คลิกการ์ดแจ้งเตือนใน Action Center เพื่อข้ามไปยังหน้านั้นๆ ได้ทันที',
    ],
  },
  {
    id: 3,
    title: 'ข้อมูลพนักงาน & ผังองค์กร (Org Chart)',
    subtitle: 'ทะเบียนประวัติพนักงานและโครงสร้างสายการบังคับบัญชา',
    icon: Users,
    badgeColor: 'badge-blue',
    summary: 'จัดการข้อมูลพนักงาน เพิ่ม/แก้ไขข้อมูล และดูผังองค์กรแบบ Interactive Tree',
    steps: [
      'เพิ่มพนักงานใหม่: กดปุ่ม "+ เพิ่มพนักงานใหม่" กรอกชื่อ, แผนก, ตำแหน่ง, วันที่เริ่มงาน และเลือกหัวหน้างาน (Supervisor)',
      'ค้นหาและกรอง: ค้นหาตามรหัส EMP หรือกรองดูเฉพาะแผนก (FMG-A, QA/QC, HR&GA, PD)',
      'ผังองค์กร (Org Chart): สลับดูสายการรายงานตัวของพนักงานทุกคนในโรงงาน',
    ],
    docRef: 'CAR-HR-EMP-01',
  },
  {
    id: 4,
    title: 'บันทึกการอบรมปฐมนิเทศ (F-HR-002)',
    subtitle: 'การจัดรอบอบรมและการ Export Excel Rev.6 ทางการ',
    icon: GraduationCap,
    badgeColor: 'badge-green',
    summary: 'บันทึกรายชื่อผู้เข้าอบรมปฐมนิเทศพนักงานใหม่ พร้อมส่งออกเอกสาร Excel ลง Template แท้',
    steps: [
      'สร้างรอบการอบรม: กำหนดวันที่, เวลาเช้า-บ่าย, วิทยากร, และสถานที่อบรม',
      'เลือกรายชื่อผู้เข้าอบรม: ติ๊กเลือกพนักงานใหม่ที่จะเข้าร่วมในรุ่นนั้นๆ',
      'Export Excel F-HR-002: กดปุ่มส่งออก Excel ระบบจะเติมข้อมูลลง Template Rev.6 แยกแผ่นงานกฎระเบียบและแผ่นงานความปลอดภัย พร้อมช่องเซ็นชื่อจริง',
    ],
    docRef: 'F-HR-002 Rev.6',
  },
  {
    id: 5,
    title: 'ศูนย์ข้อสอบออนไลน์ & QR Code',
    subtitle: 'Google Forms Live Sync & ควบคุม Phase Lock (Pre/Post Test)',
    icon: FileCheck2,
    badgeColor: 'badge-purple',
    summary: 'ระบบข้อสอบออนไลน์ 100% ผ่าน Google Forms สำหรับพนักงานสแกนทำข้อสอบผ่านมือถือ',
    steps: [
      'เปิด QR Code: กดปุ่ม "แสดง QR Code สแกนสอบ" เพื่อฉายขึ้นจอโปรเจกเตอร์หรือพิมพ์ติดห้องอบรม',
      'ระบบ Phase Lock: ก่อนอบรมทำ Pre-Test ได้ (Post-Test ถูกล็อคไว้) เมื่ออบรมเสร็จ HR กดปิด Pre-Test เพื่อปลดล็อค Post-Test',
      'Auto-Sync ผลคะแนน: ระบบดึงผลสอบอัตโนมัติทุก 15 วินาที พร้อมคำนวณเกณฑ์ผ่าน (30Q ≥ 80%, 14Q ผิด ≤ 2 ข้อ)',
    ],
    tips: [
      'พนักงานต้องพิมพ์รหัสพนักงาน (EMP Code) ให้ถูกต้องใน Google Form เพื่อให้คะแนนจับคู่เข้าสู่ระบบอัตโนมัติ',
    ],
    videoSrc: '/assets/guides/guide_exam_qr.webp',
    videoCaption: '🎬 คลิปสาธิต: การเปิด QR Code ขึ้นจออบรม และการกดสลับ Phase Lock เพื่อปลดล็อค Post-Test',
  },
  {
    id: 6,
    title: 'การประเมินฝึกอบรมหน้างาน OJT (F-HR-004)',
    subtitle: 'F-HR-004A พนักงานใหม่ & F-HR-004B ย้ายงาน/ปิด Gap ทักษะ',
    icon: ClipboardCheck,
    badgeColor: 'badge-amber',
    summary: 'เครื่องมือสำหรับหัวหน้างาน (Supervisor) และพี่เลี้ยงในการสอนงานและประเมินผลภาคปฏิบัติ',
    steps: [
      'F-HR-004A: สำหรับพนักงานใหม่ในช่วง 30 วันแรก ณ หน้างานจริง',
      'F-HR-004B: สำหรับการโอนย้ายงาน/เปลี่ยนเครื่องจักร หรือ Re-training ทักษะที่ยังไม่ถึงเป้าหมาย (Skill Gap)',
      'การประเมิน 4 ด้าน: ความรู้, ทักษะปฏิบัติ, คุณภาพงาน, ความปลอดภัย (เกณฑ์ระดับ 0% - 100%)',
    ],
    docRef: 'F-HR-004A / F-HR-004B Rev.3',
  },
  {
    id: 7,
    title: 'การประเมินผลการทดลองงาน (F-HR-009)',
    subtitle: 'ประเมิน 10 มิติการทำงานรอบ 30, 60, 90, 119 วัน',
    icon: Award,
    badgeColor: 'badge-red',
    summary: 'แบบประเมินผลการทดลองงานตามช่วงเวลา พร้อมระบบคำนวณเกรด A/B/C/D และสถานะผ่านงานอัตโนมัติ',
    steps: [
      'รอบการประเมิน: เลือกช่วงเวลา 30 วัน, 60 วัน, 90 วัน, หรือ 119 วัน',
      'ให้คะแนน 10 มิติ: ความรู้, ความขยัน, ความรับผิดชอบ, การทำงานเป็นทีม, ทัศนคติ, กฎระเบียบ, การแก้ปัญหา, การเรียนรู้, อุปกรณ์ PPE, กิจกรรม',
      'สรุปผลและเกรด: ระบบคำนวณเกรด A+, A, B, C, D และสถานะ ผ่าน / ขยายเวลา / ไม่ผ่านการทดลองงาน',
    ],
    docRef: 'F-HR-009 Rev.4',
  },
  {
    id: 8,
    title: 'Skill Matrix & Gap Analysis (F-HR-014)',
    subtitle: 'ประเมินระดับทักษะประจำรอบ 6 เดือน & Export Excel วาดวงกลมแท้',
    icon: Target,
    badgeColor: 'badge-blue',
    summary: 'ศูนย์กลางการวัดผลขีดความสามารถพนักงาน เปรียบเทียบคะแนนจริงกับเป้าหมาย Target',
    steps: [
      'รอบการประเมิน: ประเมินปีละ 2 ครั้ง (รอบ ม.ค. และ รอบ ก.ค.) พร้อมกำหนด Target',
      'วิเคราะห์ Skill Gap: แสดงแถบไฮไลท์สีส้ม/แดงทันทีเมื่อทักษะใดต่ำกว่าเกณฑ์เป้าหมาย',
      'Export Excel F-HR-014 Rev.4: วาดไอคอนวงกลมคะแนน (0%, 25%, 50%, 75%, 100%) ลงใน Template แท้ และแตกชีตอัตโนมัติเมื่อพนักงานเกิน 20 คน',
    ],
    docRef: 'F-HR-014 Rev.4',
    videoSrc: '/assets/guides/guide_skill_matrix.webp',
    videoCaption: '🎬 คลิปสาธิต: ตาราง Skill Matrix และการกดส่งออกไฟล์ Excel F-HR-014 Template จริง',
  },
  {
    id: 9,
    title: 'คลังใบรับรอง & บัตรทักษะ (Skill Passport)',
    subtitle: 'จัดเก็บใบเซอร์, บัตรทักษะดิจิทัล และแจ้งเตือนหมดอายุ',
    icon: Award,
    badgeColor: 'badge-amber',
    summary: 'จัดเก็บใบรับรองวิชาชีพ เช่น จป., โฟล์คลิฟต์, งานเชื่อม, IATF Internal Auditor และเปิดบัตรทักษะพนักงาน',
    steps: [
      'บันทึกใบรับรอง: แนบชื่อใบเซอร์, สถาบันผู้ออก, วันที่ออก และวันหมดอายุ',
      'สถานะการแจ้งเตือน 3 สี: สีเขียว (Active ใช้งานได้), สีเหลือง (Expiring Soon ใกล้หมดอายุ), สีแดง (Expired หมดอายุแล้ว)',
      'Digital Skill Passport: ค้นหาชื่อพนักงานและเปิดบัตรทักษะดิจิทัลพร้อม QR Code เพื่อสแกนตรวจสอบที่หน้างาน',
    ],
    videoSrc: '/assets/guides/guide_passport.webp',
    videoCaption: '🎬 คลิปสาธิต: การค้นหาชื่อพนักงานด่วนและเปิดบัตร Digital Skill Passport พร้อม QR Code',
  },
  {
    id: 10,
    title: 'รายงานการตรวจประเมิน (ISO/IATF Audit Package)',
    subtitle: 'รายงานสรุปหลักฐาน Audit และดาวน์โหลด 5-Sheet Excel Package',
    icon: FileSpreadsheet,
    badgeColor: 'badge-green',
    summary: 'หน้ารวมข้อมูลหลักฐานสำหรับยื่นตรวจประเมิน ISO 9001:2015 & IATF 16949',
    steps: [
      '4 แท็บตรวจสอบ: รายบุคคล (Individual), รายแผนก (Department), Skill Matrix รวม, และทะเบียนหลักสูตรฝึกอบรม (CAR-HR-REC-02)',
      'Export 5-Sheet Excel Package: ดาวน์โหลดชุดเอกสารประกอบการ Audit รวม 5 แผ่นงานครบในไฟล์เดียว',
    ],
    docRef: 'CAR-HR-REC-02 / IATF 16949',
  },
];

export const UserManualModal: React.FC<UserManualModalProps> = ({
  isOpen,
  onClose,
  initialChapter = 1,
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState(initialChapter);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedChapterId]);

  if (!isOpen) return null;

  const currentChapter = CHAPTERS.find((c) => c.id === selectedChapterId) || CHAPTERS[0];
  const IconComp = currentChapter.icon;

  const handleOpenPrintable = () => {
    window.open('/manual.html', '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: 960,
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--card-bg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #1560d0, #1e9bf0)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(21, 96, 208, 0.3)',
              }}
            >
              <BookOpen size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                คู่มือการใช้งานระบบ (User Manual & Quick Start Guide)
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                CAR HR Skill Matrix & Evaluation Platform · ISO 9001 & IATF 16949
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleOpenPrintable}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', padding: '6px 14px' }}
              title="เปิดคู่มือฉบับเต็มสำหรับสั่งพิมพ์หรือบันทึกเป็น PDF"
            >
              <Printer size={15} /> สั่งพิมพ์ / PDF
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={onClose}
              style={{ width: 34, height: 34 }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Main Body (2 Columns: Chapter Sidebar + Content Pane) */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Chapter Nav List */}
          <div
            style={{
              width: 280,
              borderRight: '1px solid var(--border-color)',
              background: 'rgba(248, 250, 252, 0.6)',
              overflowY: 'auto',
              padding: '12px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                padding: '4px 10px',
                letterSpacing: '0.05em',
              }}
            >
              หัวข้อคู่มือ (Chapters)
            </div>
            {CHAPTERS.map((ch) => {
              const isSelected = ch.id === selectedChapterId;
              const ChIcon = ch.icon;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedChapterId(ch.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: isSelected ? '#1560d0' : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--text-main)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ChIcon size={16} style={{ flexShrink: 0, opacity: isSelected ? 1 : 0.7 }} />
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ch.id}. {ch.title.split('(')[0]}
                  </span>
                  <ChevronRight size={14} style={{ opacity: isSelected ? 0.9 : 0.3 }} />
                </button>
              );
            })}
          </div>

          {/* Right Content Pane */}
          <div
            ref={contentRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 28px',
              background: 'var(--card-bg)',
            }}
          >
            {/* Chapter Header */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span className={`badge ${currentChapter.badgeColor}`}>
                  บทที่ {currentChapter.id}
                </span>
                {currentChapter.docRef && (
                  <span className="badge badge-gray" style={{ fontSize: '0.72rem' }}>
                    Doc: {currentChapter.docRef}
                  </span>
                )}
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconComp size={22} className="text-blue" />
                {currentChapter.title}
              </h3>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {currentChapter.subtitle}
              </div>
            </div>

            {/* Summary Box */}
            <div
              className="glass-card"
              style={{
                padding: '14px 18px',
                background: 'rgba(21, 96, 208, 0.05)',
                borderColor: 'rgba(21, 96, 208, 0.2)',
                marginBottom: 20,
                fontSize: '0.88rem',
                color: 'var(--text-main)',
                lineHeight: 1.5,
              }}
            >
              <strong>💡 วัตถุประสงค์:</strong> {currentChapter.summary}
            </div>

            {/* Step-by-Step Instructions */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--primary)' }}>
                📝 ขั้นตอนการใช้งาน (Step-by-Step):
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {currentChapter.steps.map((step, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      fontSize: '0.86rem',
                      lineHeight: 1.5,
                      background: 'rgba(248, 250, 252, 0.8)',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: '#1560d0',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>{step}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Animated Demo Preview (if chapter has video) */}
            {currentChapter.videoSrc && (
              <div
                style={{
                  marginBottom: 20,
                  borderRadius: 14,
                  overflow: 'hidden',
                  border: '1px solid rgba(21, 96, 208, 0.25)',
                  background: 'rgba(15, 23, 42, 0.03)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    background: 'rgba(241, 245, 249, 0.95)',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Play size={14} /> ภาพเคลื่อนไหวสาธิตการทำงานจริง (Live Demo Loop)
                  </span>
                  <span className="badge badge-purple" style={{ fontSize: '0.68rem' }}>
                    WebP Animation
                  </span>
                </div>
                <div style={{ padding: 12, textAlign: 'center' }}>
                  <img
                    src={currentChapter.videoSrc}
                    alt={currentChapter.title}
                    style={{
                      width: '100%',
                      maxHeight: 380,
                      objectFit: 'contain',
                      borderRadius: 10,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                    }}
                  />
                  {currentChapter.videoCaption && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
                      {currentChapter.videoCaption}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tips Section */}
            {currentChapter.tips && currentChapter.tips.length > 0 && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  marginBottom: 20,
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#d97706', marginBottom: 6 }}>
                  ⚡ ข้อควรระวัง & เทคนิคแนะนำ (Pro Tips):
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                  {currentChapter.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer Navigation Buttons inside chapter */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 16,
                borderTop: '1px solid var(--border-color)',
                marginTop: 20,
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                disabled={selectedChapterId === 1}
                onClick={() => setSelectedChapterId((prev) => Math.max(1, prev - 1))}
                style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              >
                ← บทก่อนหน้า
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                บทที่ {selectedChapterId} จาก {CHAPTERS.length}
              </span>
              <button
                type="button"
                className="btn btn-primary"
                disabled={selectedChapterId === CHAPTERS.length}
                onClick={() => setSelectedChapterId((prev) => Math.min(CHAPTERS.length, prev + 1))}
                style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              >
                บทถัดไป →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
