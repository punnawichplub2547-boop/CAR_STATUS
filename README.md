# 🚗 HR Skill Management Platform (บริษัท คอมพลีท โอโต รับเบอร์ จำกัด - CAR)

ระบบบริหารจัดการทักษะพนักงาน การประเมินผล OJT ทดลองงาน ข้อสอบออนไลน์ และจัดเก็บใบรับรอง สำหรับโรงงานอุตสาหกรรมยานยนต์ (รองรับมาตรฐาน IATF 16949 / ISO 9001 / ISO 14001)

---

## 📌 ภาพรวมระบบ (Overview)

ระบบ **HR Skill Management Platform** ถูกพัฒนาขึ้นเพื่อเปลี่ยนผ่านการทำงานเอกสาร HR ของโรงงาน (เช่น แบบฟอร์มประเมิน F-HR-005, F-HR-014, F-HR-016) มาสู่ระบบดิจิทัล ช่วยจัดการทักษะความสามารถพนักงาน (Skill Matrix), การประเมิน OJT พนักงานใหม่และพนักงานเปลี่ยนงาน (4M1E), การสอบวัดผลปฐมนิเทศ, การติดตามวันหมดอายุของใบรับรอง/ใบขับขี่เครน/ความปลอดภัย และส่งออกรายงานสำหรับการ Audit ISO/IATF

---

## ✨ ฟีเจอร์หลักของระบบ (Key Features)

1. **Dashboard & Analytics**
   - สรุปสถิติพนักงานประจำ, พนักงานทดลองงาน, อัตราผ่านเกณฑ์ Skill Matrix
   - การแจ้งเตือนใบรับรองใกล้หมดอายุ และพนักงานครบรอบประเมินทดลองงาน
   - แผนภูมิวิเคราะห์ระดับทักษะภาพรวมแต่ละแผนก (Recharts)

2. **ระบบทะเบียนพนักงาน & โครงสร้างองค์กร (Employee Directory & Org Chart)**
   - บันทึกประวัติพนักงาน, รหัสพนักงาน, แผนก (FMG-A, QA/QC, HR&GA IT ฯลฯ), ตำแหน่ง
   - แสดงแผนผังสายการบังคับบัญชา (Organization Chart)

3. **ตารางประเมินทักษะความสามารถ (Skill Matrix - F-HR-005 / F-HR-014)**
   - กำหนดระดับทักษะเป้าหมาย (Target Level) และประเมินทักษะจริง (Result Level: 0%, 25%, 50%, 75%, 100%)
   - แสดงกราฟใยแมงมุม (Radar Chart / Skill Gap Analysis) รายบุคคล
   - รองรับรอบการประเมินประจำปี (รอบมกราคม และ กรกฎาคม)

4. **การประเมิน OJT และทดลองงาน (OJT & Probation Evaluator - F-HR-016)**
   - **Form A (New Hire OJT)**: ประเมินการสอนงานพนักงานใหม่ตามหลักสูตร
   - **Form B (4M1E Change OJT)**: ประเมินพนักงานกรณีเปลี่ยนงาน/ย้ายตำแหน่ง (Man, Machine, Material, Method, Environment)
   - **Probation Evaluation**: ประเมินทดลองงาน 30, 60, 90 วัน ออกเกรดอัตโนมัติ (A+, A, B, C, D) ตามคะแนนเต็ม 50 คะแนน

5. **ระบบจัดการการฝึกอบรม (Training & Attendance Management)**
   - บันทึกคอร์สอบรม (Safety, Quality/IATF, Job Specific)
   - เช็คอินเข้าอบรมเช้า-บ่าย และบันทึกผลการผ่านอบรม

6. **คลังใบรับรองและวุฒิบัตร (Certificate Vault)**
   - จัดเก็บและติดตามวันหมดอายุของ Certificate/License (ความปลอดภัย, จป., ขับโฟล์คลิฟต์ ฯลฯ)
   - ระบบเตือนสถานะ Expiring Soon (ภายใน 30 วัน) และ Expired

7. **ระบบสอบวัดผลออนไลน์ (Exam Engine)**
   - แบบทดสอบปฐมนิเทศความปลอดภัยและกฎระเบียบบริษัท (30 ข้อ)
   - ตรวจผลสอบและคิดเปอร์เซ็นต์ผ่านเกณฑ์อัตโนมัติ (>= 80%) พร้อมเอฟเฟกต์ Confetti เมื่อสอบผ่าน

8. **ศูนย์ส่งออกรายงาน Audit (Audit Report Exporter)**
   - สรุปเอกสารพร้อมสำหรับการตรวจสอบ (Audit Ready) สำหรับ ISO/IATF 16949
   - พิมพ์และส่งออกรายงานสรุป Skill Matrix, OJT Records, Certificate Expiring List

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend Core**: React 19 + TypeScript 6 + Vite 8
- **Styling**: Vanilla CSS with Design System Tokens & Glassmorphism Theme ([src/index.css](src/index.css))
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Radar Chart, Bar Chart, Area Chart)
- **Effects**: Canvas Confetti
- **State Management & Persistence**: React State + Custom LocalStorage Hook ([src/App.tsx](src/App.tsx))
- **Linter**: Oxlint

---

## 🚀 วิธีการติดตั้งและใช้งาน (Getting Started)

### 1. Requirements
- Node.js version 18.0.0 ขึ้นไป
- npm หรือ pnpm / yarn

### 2. Installation
```bash
# เข้าไปยังโฟลเดอร์แอปพลิเคชัน
cd app

# ติดตั้ง dependencies
npm install
```

### 3. Running in Development Mode
```bash
npm run dev
```
แอปพลิเคชันจะรันที่ `http://localhost:5173` (หรือพอร์ตตามที่ Vite กำหนด)

### 4. Build for Production
```bash
npm run build
```
ไฟล์ Production Build จะถูกสร้างไว้ในโฟลเดอร์ `dist/`

### 5. Linting Check
```bash
npm run lint
```

### 6. Sync หลัง Pull โค้ดของเพื่อนร่วมทีม (Syncing After a Pull)
เวลามีใครเพิ่ม dependency ใหม่ หรือแก้ Prisma schema (`backend/prisma/schema.prisma`) แล้ว push ขึ้นมา ให้รันตามลำดับนี้ทุกครั้งหลัง `git pull` — ข้ามข้อ 3 (migrate) ไม่ได้ เพราะ `prisma:seed` จะ error ทันทีถ้าตารางในฐานข้อมูลยังไม่ถูกสร้าง:

```bash
# 1. ดึงโค้ดล่าสุด
git pull

# 2. ติดตั้ง dependency ทั้ง frontend และ backend
npm install
cd backend && npm install && cd ..

# 3. รัน migration ที่ค้างอยู่ (ต้องมี MySQL รันอยู่ก่อน เช่น docker compose up -d car-status-mysql)
cd backend
npx prisma migrate deploy

# 4. seed ข้อมูล mock พนักงาน + มาตรฐานทักษะ (F-HR-005) ชุดล่าสุด
npm run prisma:seed
```

> หมายเหตุ: ไฟล์ `backend/.env` และ `.env.local` ไม่ได้ถูก commit ขึ้น git (เก็บค่าเฉพาะเครื่อง เช่น พอร์ต/DATABASE_URL) — ให้ copy จาก `backend/.env.example` / `.env.example` แล้วปรับค่าตามเครื่องตัวเองก่อนรันขั้นตอนด้านบน

---

## 📂 โครงสร้างไดเรกทอรี (Directory Structure)

```text
app/
├── public/                 # Assets สาธารณะ
├── src/
│   ├── components/         # คอมโพเนนต์ UI แต่ละโมดูล
│   │   ├── AuditReportExporter.tsx
│   │   ├── CertificateVault.tsx
│   │   ├── Dashboard.tsx
│   │   ├── EmployeeManagement.tsx
│   │   ├── ExamEngine.tsx
│   │   ├── Navbar.tsx
│   │   ├── OjtProbationEvaluator.tsx
│   │   ├── Sidebar.tsx
│   │   ├── SkillMatrixView.tsx
│   │   ├── TestLoginModal.tsx
│   │   └── TrainingManagement.tsx
│   ├── data/
│   │   └── mockData.ts     # ชุดข้อมูลจำลอง (Initial Mock Data)
│   ├── types/
│   │   └── index.ts        # TypeScript Interfaces & Data Definitions
│   ├── App.css
│   ├── App.tsx             # Main Application Container & State Provider
│   ├── index.css           # Global Styles & CSS Design Tokens
│   └── main.tsx            # Entry Point
├── index.html
├── package.json
└── vite.config.ts
```

---

## 📋 ข้อมูลสำหรับการพัฒนาต่อ (Backend Integration Guide)

ปัจจุบันระบบทำงานแบบ **Client-side Rendered (CSR)** โดยเก็บข้อมูลจำลองใน LocalStorage (`hrskill_*`) หากต้องการเชื่อมต่อ Backend Database (เช่น Node.js / Python / C# + PostgreSQL/MySQL):

1. ดูคำอธิบาย Data Schema ได้ที่ [src/types/index.ts](src/types/index.ts)
2. สร้าง API Endpoints รองรับ CRUD สำหรับ:
   - `/api/employees`
   - `/api/skills/evaluations`
   - `/api/ojt/records`
   - `/api/probation/evaluations`
   - `/api/certificates`
   - `/api/training/courses`
3. แทนที่ `usePersistentState` ใน [src/App.tsx](src/App.tsx) ด้วย `fetch` / `axios` API calls
