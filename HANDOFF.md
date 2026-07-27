# 📋 เอกสารการส่งมอบงาน (Developer Handoff Guide)
**โครงการ:** HR Skill Management Platform (บริษัท คอมพลีท โอโต รับเบอร์ จำกัด)  
**วันที่อัปเดตล่าสุด:** 27 กรกฎาคม 2026  
**สถานะโปรเจค:** สภาพแวดล้อมสมบูรณ์ (Build & Lint 0 Errors) พร้อมส่งมอบเพื่อพัฒนาต่อ/เชื่อมต่อระบบหลังบ้าน (Backend API)

---

## 1. ข้อมูลภาพรวมและวัตถุประสงค์ (Project Summary)
ระบบ HR Skill Management Platform ถูกออกแบบมาเพื่อตอบโจทย์กระบวนการทำงานจริงของแผนก HR และผู้บังคับบัญชาในโรงงานผลิตชิ้นส่วนยางยานยนต์ โดยเน้นการรองรับข้อกำหนดมาตรฐานสากล **IATF 16949**, **ISO 9001** และ **ISO 14001**

### เอกสาร/แบบฟอร์มโรงงานที่ถูกแปลงเป็นระบบดิจิทัล:
- **F-HR-005**: ตารางกำหนดมาตรฐานทักษะพนักงานตามตำแหน่ง (Skill Standard)
- **F-HR-014**: บันทึกการประเมินทักษะความสามารถพนักงานประจำรอบ 6 เดือน (Skill Matrix)
- **F-HR-016 (Form A)**: แบบบันทึกการประเมินการฝึกอบรมขณะปฏิบัติงานสำหรับพนักงานใหม่ (New Hire OJT)
- **F-HR-016 (Form B)**: แบบบันทึกการประเมินการฝึกอบรมกรณีเปลี่ยนงาน/ย้ายตำแหน่ง (4M1E Change OJT)
- **Probation Evaluation**: แบบประเมินผลการทดลองงาน 30 / 60 / 90 วัน (เกรด A+ ถึง D)

---

## 2. สถานะความพร้อมทางเทคนิค (Technical Status)

| รายการตรวจสอบ (Checklist) | ผลการตรวจสอบ | หมายเหตุ |
| :--- | :---: | :--- |
| **TypeScript Compilation** | ✅ Pass | รัน `tsc -b` ไม่มี error |
| **Vite Production Build** | ✅ Pass | รัน `vite build` สร้างไฟล์ dist ได้สมบูรณ์ (1.06s) |
| **Code Quality / Linter** | ✅ Pass | รัน `oxlint` ผ่าน 0 warnings, 0 errors |
| **State Persistence** | ✅ Pass | เก็บข้อมูลจำลองลง `localStorage` อัตโนมัติ ปิดเปิดเบราว์เซอร์ข้อมูลไม่หาย |
| **Responsive UI Design** | ✅ Pass | Glassmorphic theme + Dark mode พร้อมแผนภูมิ Interactive |

---

## 3. โครงสร้างไฟล์และไฟล์สำคัญ (Key Files Directory)

```text
d:\HrSkill\
├── Flow Chart _ทักษะความสามารถของพนักงาน/   # ไฟล์เอกสารกระบวนการและไฟล์ Excel อ้างอิง
├── HR Skill Management design/             # ไฟล์ UX/UI Design Mockups (HTML/DC format)
└── app/                                    # โค้ดโปรเจคหลัก (Vite + React + TypeScript)
    ├── src/
    │   ├── types/index.ts                  # ⭐ ศูนย์รวม Data Types & Interfaces ทั้งหมด
    │   ├── data/mockData.ts                # ⭐ ข้อมูลจำลองสำหรับทดสอบระบบ
    │   ├── components/                     # โมดูล UI แต่ละหน้า
    │   │   ├── Dashboard.tsx               # หน้าสรุปภาพรวมและสถิติ
    │   │   ├── EmployeeManagement.tsx      # ทะเบียนพนักงาน + Org Chart
    │   │   ├── SkillMatrixView.tsx         # ตารางประเมินทักษะ + Radar Chart
    │   │   ├── OjtProbationEvaluator.tsx   # แบบประเมิน OJT (Form A/B) & ทดลองงาน
    │   │   ├── CertificateVault.tsx        # ระบบติดตามใบรับรองหมดอายุ
    │   │   ├── TrainingManagement.tsx      # ระบบจัดการอบรมและเช็คอิน
    │   │   ├── ExamEngine.tsx              # ระบบทำข้อสอบวัดผลออนไลน์
    │   │   ├── AuditReportExporter.tsx     # ศูนย์ส่งออกรายงานสำหรับ Audit ISO/IATF
    │   │   ├── Navbar.tsx                  # แถบบน + สลับผู้ใช้งาน (Test Login)
    │   │   ├── Sidebar.tsx                 # เมนูด้านข้าง
    │   │   └── TestLoginModal.tsx          # ป๊อปอัปสลับสิทธิ์การใช้งาน
    │   ├── App.tsx                         # ⭐ State Manager หลักของระบบ
    │   └── index.css                       # Global Design System Tokens & CSS
```

---

## 4. แนะนำขั้นตอนการนำไปพัฒนาต่อ (Next Steps for Next Developer)

### ระยะที่ 1: พัฒนาระบบหลังบ้าน (Backend API & Database)
1. นำข้อมูลโครงสร้างจาก [app/src/types/index.ts](app/src/types/index.ts) ไปออกแบบ Database Tables (เช่น PostgreSQL / MySQL / MongoDB)
2. สร้าง RESTful API หรือ GraphQL Service สำหรับรองรับการดึงและบันทึกข้อมูล
3. ปรับเปลี่ยนฟังก์ชันจัดการข้อมูลใน [app/src/App.tsx](app/src/App.tsx) จากการสลับ LocalStorage เป็นการต่อ API endpoint

### ระยะที่ 2: ระบบยืนยันตัวตน (Authentication & Authorization)
1. เชื่อมต่อระบบ Login จริง (JWT / OAuth2 / Active Directory / LDAP โรงงาน) แทนที่ `TestLoginModal`
2. ปรับการจำกัดสิทธิ์ (Role-based Access Control - Admin / Supervisor / Employee)

### ระยะที่ 3: ระบบส่งออกเอกสารและแจ้งเตือน (Exports & Notifications)
1. เชื่อมต่อ Library พิมพ์ PDF หรือ Excel (เช่น `jspdf` / `xlsx`) เพิ่มเติมในหน้า `AuditReportExporter.tsx`
2. ตั้งค่าระบบแจ้งเตือนทาง LINE Notify หรือ Email สำหรับใบรับรองที่ใกล้หมดอายุล่วงหน้า 30 วัน

---

## 5. คำสั่งที่จำเป็นในการรันโปรเจค

```bash
# 1. เข้าโฟลเดอร์แอป
cd d:/HrSkill/app

# 2. เริ่มต้นรันเซิร์ฟเวอร์ทดสอบ (Dev Server)
cmd /c "npm run dev"

# 3. ตรวจสอบการคอมไพล์และ Build
cmd /c "npm run build"

# 4. ตรวจสอบการเขียนโค้ด (Lint)
cmd /c "npm run lint"
```
