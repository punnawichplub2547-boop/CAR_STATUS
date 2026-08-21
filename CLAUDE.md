# 📘 CLAUDE.md - Developer & Agent Guide

## 1. Project Overview
**Project:** HR Skill Management Platform (บริษัท คอมพลีท โอโต รับเบอร์ จำกัด)  
**Description:** Web application for managing automotive factory employee skill matrices, OJT evaluations, probation assessments, training records, certificate vaults, and ISO/IATF 16949 audit reports.
- **Dev Environment Path:** `D:\HrSkill\app`
- **Prod Server Path:** `D:\Skill\CAR_STATUS`

---

## 2. Tech Stack & Standards
- **Core:** React 19, TypeScript 6, Vite 8
- **Styling:** Custom Vanilla CSS Design System with Glassmorphism, CSS Custom Properties (`src/index.css`), and Google Web Font (`Sarabun`)
- **Icons & Charts:** `lucide-react`, `recharts`
- **Linter & Quality:** `oxlint`
- **ISO & Industrial Standards Supported:**
  - **IATF 16949 / ISO 9001 / ISO 14001**
  - **F-HR-005:** Skill Standards per position
  - **F-HR-014:** 6-Month Skill Matrix Evaluation
  - **F-HR-016 (Form A):** New Hire OJT Evaluation
  - **F-HR-016 (Form B):** 4M1E Change/Transfer OJT Evaluation
  - **Probation Evaluation:** 30 / 60 / 90 Days (Grades A+ to D)

---

## 3. Key Development Commands

Always run commands via `cmd /c` on Windows environments to bypass PowerShell execution policy restrictions:

```bash
# Run Development Server
cmd /c npm run dev

# Production Build Verification
cmd /c npm run build

# Code Quality & Lint Check
cmd /c npx oxlint
```

---

## 4. Architecture & File Structure

```text
d:\HrSkill\app\
├── src/
│   ├── types/index.ts            # Central Data Types, Interfaces & Enums
│   ├── data/mockData.ts          # Sanitized Demo Data & Question Bank
│   ├── constants/
│   │   └── orientationConstants.ts # Orientation Course Topics & Options
│   ├── utils/
│   │   ├── dateUtils.ts          # Tenure & Date Formatting Helpers
│   │   ├── api.ts                # Backend API Client & Sync (Auth, Employees, Certs)
│   │   ├── notificationGenerator.ts # Dynamic System Notifications (Cert Expiry, OJT, Exam)
│   │   ├── fhr002Exporter.ts     # F-HR-002 OpenXML Template Exporter
│   │   └── excelTemplateExporter.ts # F-HR-014 OpenXML Exporter & Helpers
│   ├── components/               # Modular UI Components
│   │   ├── exam/                 # Exam Sub-components
│   │   │   ├── ExamConfigModal.tsx   # Google Forms API Config Modal
│   │   │   ├── ExamDetailDrawer.tsx  # Score Detail & Mistakes (isHR Gate)
│   │   │   ├── ExamDirectoryTable.tsx # HR Tracker, Batch Filters & Locks
│   │   │   └── ExamQrModal.tsx       # Instant Mobile QR Code Scanner Modal
│   │   ├── Dashboard.tsx         # Executive Overview & Recharts Visualizations
│   │   ├── EmployeeManagement.tsx # Org Chart (@xyflow/react) & Employee Directory
│   │   ├── EmployeeExcelImportModal.tsx # Bulk Employee Excel (.xlsx) Import with Validation
│   │   ├── SkillMatrixView.tsx   # Skill Matrix & Competency Radar Charts
│   │   ├── OjtProbationEvaluator.tsx # Forms F-HR-016 (Form A/B) & Probation Evaluation
│   │   ├── OjtFormAEvaluator.tsx # New Hire OJT (Form A) with Sticky Action Bar
│   │   ├── OjtFormBEvaluator.tsx # Transfer OJT (Form B) with Sticky Action Bar
│   │   ├── ProbationEvaluator.tsx# Probation Evaluation (F-HR-009) with Sticky Action Bar
│   │   ├── CertificateVault.tsx  # Certification Expiry Tracking
│   │   ├── TrainingManagement.tsx# Training Calendar & QR/Check-in
│   │   ├── ExamEngine.tsx        # Exam Engine Orchestrator & Live Sync
│   │   ├── AuditReportExporter.tsx # ISO/IATF Audit Report Center (SheetJS)
│   │   ├── LoginView.tsx         # Real Authentication & Role-based Login (Glassmorphic)
│   │   ├── UserProfileModal.tsx  # User Profile & Self Password Change
│   │   ├── SkillPassportModal.tsx# Employee Skill Passport & Printable CV/Portfolio (A4 Layout)
│   │   ├── SystemBackupModal.tsx # 1-Click System JSON Backup & Restore Modal
│   │   ├── ErrorBoundary.tsx     # React Runtime Error Protection & Recovery
│   │   ├── Navbar.tsx            # Header, Notifications Drawer, User Profile, Backup & Logout
│   │   └── Sidebar.tsx           # Navigation Menu & Role Permission Filtering
│   ├── App.tsx                   # Master State Manager & LocalStorage Persistence
│   └── index.css                 # Global Design System Tokens & Glassmorphism Styles
├── backend/                      # Express 4 + Prisma 6 + MySQL 8.4
│   ├── prisma/
│   │   ├── schema.prisma         # Prisma Data Models (Employee, Cert, SkillStandard, Exam)
│   │   └── seed.ts               # Seed data with bcrypt passwords & roles
│   └── src/
│       ├── routes/
│       │   ├── auth.ts           # POST /login, POST /change-password, GET /me
│       │   ├── certificates.ts   # GET / POST /api/certificates
│       │   ├── employees.ts      # GET / POST /api/employees
│       │   ├── skillStandards.ts # GET /api/skill-standards
│       │   └── webhook.ts        # POST /api/webhook/exam-result
│       ├── server.ts             # Express Server Setup & CORS
│       ├── verify_auth.ts        # Authentication & RBAC Test Suite
│       └── verify_profile_and_certs.ts # Profile & Cert Status Unit Tests
├── scratch/
│   ├── verify_all_modules_e2e.mts # Complete 7-Module E2E System Audit Suite
│   ├── verify_fhr014.mts         # F-HR-014 OpenXML Multi-sheet Exporter Verification
│   └── verify_audit_export.mts   # Audit Report Exporter Verification
├── index.html                    # Root HTML & Google Fonts (Sarabun)
└── package.json                  # Dependencies & Scripts
```

---

## 5. Coding Conventions & Best Practices

### TypeScript & Types
- Keep all shared data structures in `src/types/index.ts`.
- Avoid using `any`; define explicit interfaces or union types.
- Ensure strict type safety when working with skill levels (`0 | 25 | 50 | 75 | 100`) and probation grades (`'A+' | 'A' | 'B' | 'C' | 'D'`).

### CSS & Design System
- Utilize predefined CSS Variables from `src/index.css` (e.g. `--primary`, `--bg-card`, `--font-sans`).
- Maintain **Glassmorphic Theme** aesthetics: backdrop blur, sleek borders, smooth hover animations, and dark mode compatibility via `[data-theme='dark']`.
- Typography stack MUST prioritize `'Sarabun'` web font over local system fonts to avoid rendering scale discrepancies across client machines.

### Data Privacy & Security
- Never store or commit real employee names, personal emails, or telephone numbers to repository.
- Use fictional placeholder names (e.g., "สมชาย ใจดี", "สมศักดิ์ มั่นคง") in `src/data/mockData.ts`.

### 📊 Excel Export & File Download Best Practices
- **Two different jobs, two different tools — do not mix them up:**
  - Filling an existing company form (`F-HR-002`, `F-HR-014`) → **`JSZip` on the raw OpenXML parts**, see `src/utils/excelTemplateExporter.ts` and `src/utils/fhr002Exporter.ts`. ExcelJS is NOT used and is no longer a dependency.
  - Building a report from scratch (`AuditReportExporter`) or parsing an imported file → **SheetJS (`xlsx`)**.
- **Native Excel (.xlsx) Export:** For scratch-built workbooks use SheetJS to write native `.xlsx` binary buffers via `XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })`. Route the buffer through `downloadExcelWorkbook()` / `saveBlobFile()` rather than hand-rolling a Blob.
- **Never let an export fail silently:** a download helper that receives a shape it does not understand must `throw`, and the caller must surface it. A button that quietly does nothing reads to HR as "the system is broken" with no clue why.
- **Report anything the form cannot fit:** when a template has a fixed row/column capacity, either split onto extra sheets (F-HR-014) or return a `truncatedCount` for the UI to show (F-HR-002). Never `slice()` overflow away in silence.
- **Explicit OpenXML MIME Type:** When creating a Blob for browser download, MUST explicitly specify `type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'`. Without this explicit MIME type, Chromium browsers categorize the blob as `application/octet-stream` and strip the filename into a random GUID string (e.g., `2138157d-7c12...`).
- **Filename Sanitization:** Always sanitize dynamic filename variables (such as department names like `QA/QC` or `HR&GA`) by replacing slashes `/`, spaces, and special symbols with underscores `_` (e.g., `selectedDept.replace(/[^a-zA-Z0-9-_]/g, '_')`). Slashes in filename attributes trigger Chromium path traversal protection, causing the download manager to reject the custom filename.

---

## 6. Verification Checklist Before Commit

Before pushing any changes to Git:
1. Run `cmd /c npx oxlint` and ensure **0 errors / 0 warnings**.
2. Run `cmd /c npm run build` and ensure TypeScript compilation & Vite build succeed.
3. Test responsiveness and verify font rendering consistency.

---

## 7. 📝 Real Exam Documents & Master Question Bank Specification

Source Documents in Workspace (`D:\HrSkill\Flow Chart _ทักษะความสามารถของพนักงาน\`):
- `แบบทดสอบประเมินผลการปฐมนิเทศ-กระดาษคำตอบ-เฉลย (ใช้ตัวนี้).xlsx`
- `แบบทดสอบทัศนคติเกี่ยวกับความปลอดภัย.docx`

### A. แบบทดสอบประเมินผลการปฐมนิเทศ (30 ข้อ - 20 นาที - ผ่าน 80% = 24/30 คะแนน)
**ตารางเฉลยคำตอบจริง (Master Answer Key):**

| ข้อ | หมวดวิชา | โจทย์สรุป | ตัวเลือกเฉลยถูกต้อง |
| :---: | :--- | :--- | :---: |
| 1 | ความปลอดภัย | ผลเสียทางตรงจากอุบัติเหตุ | **ก.** ค่ารักษาพยาบาล |
| 2 | ความปลอดภัย | ปัจจัยการเกิดเพลิงไหม้ | **ข.** เชื้อเพลิง, ออกซิเจน, ความร้อน |
| 3 | ความปลอดภัย | เทคนิคการใช้ถังดับเพลิง | **ก.** ดึง ปลด กด ส่าย |
| 4 | ความปลอดภัย | เมื่อได้ยินสัญญาณฉุกเฉิน | **ก.** ตามผู้นำธง ไปที่จุดรวมพล |
| 5 | ความปลอดภัย | สีสัญลักษณ์ความปลอดภัย | **ก.** สีแดง หมายถึง ห้าม/อันตราย |
| 6 | ความปลอดภัย | สัญลักษณ์ระวังอันตรายไฟฟ้า | **ค.** สัญลักษณ์รูปไฟฟ้า/สายฟ้า |
| 7 | ความปลอดภัย | สาเหตุการเกิดอุบัติเหตุ | **ค.** ถูกทั้งข้อ ก. (สภาพไม่ปลอดภัย) และ ข. (การกระทำไม่ปลอดภัย) |
| 8 | ความปลอดภัย | ข้อใดกล่าวผิดงานบนที่สูง | **ง.** หากมีอาการผิดปกติ เจ็บป่วย ต้องทำงานต่อไปอย่างระมัดระวัง *(ผิด)* |
| 9 | ความปลอดภัย | ข้อใดกล่าวผิดเครื่องมือช่าง | **ก.** จับ หรือถือเครื่องมือให้หลวม ๆ *(ผิด)* |
| 10 | ความปลอดภัย | ผู้รับผิดชอบความปลอดภัย | **ง.** ความปลอดภัยเป็นหน้าที่ของพนักงานทุกคนในองค์กร |
| 11 | CCCF | การประเมินความรุนแรง | **ค.** 3 ระดับ คือ ระดับ A, B, C |
| 12 | CCCF | บาดเจ็บเล็กน้อย/ไม่หยุดงาน | **ค.** ระดับ Rank C |
| 13 | CCCF | ประเภทอุบัติเหตุใน CCCF | **ค.** 6 ประเภท |
| 14 | CCCF | ข้อใดไม่อันตรายระดับ A | **ง.** ถูกมีดคัตเตอร์บาดขณะตัดเทปเปิดลัง |
| 15 | CCCF | ประโยชน์กิจกรรม CCCF | **ง.** ถูกทุกข้อ |
| 16 | ISO System | ความหมาย ISO 14001 | **ก.** ระบบการจัดการสิ่งแวดล้อม |
| 17 | ISO System | สีถังขยะคัดแยกถูกต้อง | **ก.** ถังขยะสีเหลือง หมายถึง ขยะรีไซเคิล |
| 18 | ISO System | หลักการ 5ส. องค์ประกอบ | **ค.** สะสาง สะดวก สะอาด สุขลักษณะ สร้างนิสัย |
| 19 | ISO System | ISO 9001 / IATF 16949 | **ก.** ระบบคุณภาพสำหรับอุตสาหกรรมยานยนต์ |
| 20 | ISO System | นิยามคำว่า "คุณภาพ" | **ง.** ไม่มีข้อใดถูกต้อง |
| 21 | ค่านิยม/พลังงาน | นโยบายอนุรักษ์พลังงาน CAR | **ค.** ถูกทั้งข้อ ก. (ลดค่าใช้จ่าย) และ ข. (พนักงานมีส่วนร่วม) |
| 22 | ค่านิยม/พลังงาน | CORE VALUES CAR | **ข.** 4 ข้อ |
| 23 | กฎระเบียบโรงงาน | ลำดับกระบวนการผลิต CAR | **ค.** ผสมยาง ➔ ซอยยาง ➔ อัดขึ้นรูป ➔ ตบแต่ง ➔ ตรวจสอบคุณภาพ ➔ สโตร์&จัดส่ง |
| 24 | กฎระเบียบโรงงาน | สิทธิการลาป่วยตามกฎหมาย | **ค.** พนักงานมีสิทธิลาป่วยเท่าที่ป่วยจริง โดยได้รับค่าจ้างปีละไม่เกิน 30 วัน |
| 25 | กฎระเบียบโรงงาน | ระเบียบการจ่ายค่าจ้าง CAR | **ค.** จ่ายค่าจ้าง, OT, ค่าทำงานวันหยุด ให้พนักงานทุกวันที่ 1 ผ่านบัญชีธนาคาร |
| 26 | กฎระเบียบโรงงาน | ระเบียบลาออก/เลิกจ้าง | **ง.** ถูกทุกข้อ (แจ้งล่วงหน้า 1 งวดค่าจ้าง / ทำผิดซ้ำคำเตือนเลิกจ้างไม่จ่ายชดเชย) |
| 27 | กฎระเบียบโรงงาน | ข้อห้ามแต่งกายพนักงาน | **ง.** ถูกทุกข้อ (ชายไม่ไว้ผมยาว/หนวดเครา, หญิงมัดรวบผม, ห้ามใส่กางเกงยีนส์) |
| 28 | กฎระเบียบโรงงาน | เงื่อนไขลากิจได้รับค่าจ้าง | **ค.** เป็นพนักงานประจำ ลาล่วงหน้าอย่างน้อย 2 วัน (ใช้สิทธิ์ได้ 3 วัน/ปี) |
| 29 | กฎระเบียบโรงงาน | โทษสาย 3 ครั้งใน 1 เดือน | **ก.** ตักเตือนด้วยวาจา |
| 30 | กฎระเบียบโรงงาน | โทษขาดงานครั้งแรก | **ข.** ตักเตือนเป็นหนังสือ |

---

### B. แบบทดสอบทัศนคติเกี่ยวกับความปลอดภัย (`แบบทดสอบทัศนคติเกี่ยวกับความปลอดภัย.docx` & `กระดาษคำตอบ.xlsx`)
- **วัตถุประสงค์:** ประเมินเจตคติและทัศนคติความปลอดภัย (Safety Attitude) ก่อนเข้าปฏิบัติงานในโรงงาน CAR
- **เกณฑ์ประเมิน:** ทำผิดเกิน 2 ข้อถือว่ายังไม่มีเจตคติความปลอดภัยที่ดีพอ (ผ่าน = ตอบถูกต้องตั้งแต่ 12/14 ข้อขึ้นไป)

**ตารางเฉลยคำตอบจริง 14 ข้อ (Master Safety Attitude Answer Key):**

| ข้อ | สถานการณ์โจทย์ | คำตอบเฉลยที่ถูกต้อง | ข้อเลือก |
| :---: | :--- | :--- | :---: |
| 1 | สั่งให้คุมเครื่องจักรใหม่ที่ไม่คุ้นเคย | เรียกหัวหน้างานกลับมา และบอกเขาว่ายังไม่ทราบวิธีการทำงาน | **ข.** |
| 2 | เห็นคนเอาหนังสติ๊กเล็งใส่พนักงานคุมเครื่อง | รีบเดินเข้าไปหาคนเล็งหนังสติ๊ก แล้วพยายามบอกให้หยุดการล้อเล่นทันที | **ก.** |
| 3 | ขนของด่วนเหลือ 10 นาทีจะเที่ยง | หยุดขนของตอนเที่ยงตรง ไปกินข้าวแล้วกลับมาทำต่อ ยอมเสี่ยงโดนหัวหน้าดุ | **ค.** |
| 4 | ยกลังไม้หนักเทอะทะ มีผู้จัดการอยู่ใกล้ๆ | ถามผู้จัดการโรงงานว่า พอจะช่วยคุณยกลังไม้นั้นได้ไหม | **ข.** |
| 5 | พบคราบน้ำมันหล่อลื่นหกบนทางเดิน | ส่งข่าวให้คนทำความสะอาดทราบ แล้วยืนเฝ้าระวังคอยบอกคนอื่นให้ระวังตัว | **ก.** |
| 6 | ทำงานด่วนจนรกรุงรัง นายจ้างสั่งทำความสะอาด | หยุดทำงานทั้งหมด แล้วรีบทำความสะอาดสถานที่ทันที | **ก.** |
| 7 | โดนท้าทายยกเหล็กเทอะทะในเวลาพัก | บอกผู้ท้าพนันว่า จะรับคำท้าก็ต่อเมื่อใช้อุปกรณ์ยกน้ำหนักจริงๆ (บาเบล) | **ก.** |
| 8 | ซ่อมไฟบนบันได มึนศีรษะเจ็บหน้าอก | ลงมาบอกหัวหน้าว่าไม่สบายและพบแพทย์ แม้งานทั้งโรงงานต้องหยุดชะงัก | **ข.** |
| 9 | อยากสูบบุหรี่ในเขตห้ามสูบ | ตัดสินใจยอมอดบุหรี่ไว้ ไม่แอบจุดสูบในพื้นที่อันตราย | **ข.** |
| 10 | หน้ากากป้องกันหายขณะเทโซดาไฟ | ไม่ยอมทำงานโดยไม่มีเครื่องป้องกันหน้า | **ค.** |
| 11 | พบวิธีทำงานปลอดภัยกว่าแต่ช้าลงเล็กน้อย | แนะนำให้หัวหน้างานลองทำตามวิธีใหม่ของคุณ | **ค.** |
| 12 | ลูกตกบันไดที่ไม่มีราวกั้นที่บ้าน | หาทางทำราวบันไดโดยเร็ว ถึงแม้จะทำให้บ้านสวยงามลดลง | **ค.** |
| 13 | บริษัทจัดฉายหนังการขับรถปลอดภัย | ไปชมภาพยนตร์นั้น ถึงแม้จะรู้ว่าตนเองเป็นนักขับรถที่ดีอยู่แล้ว | **ก.** |
| 14 | บริษัทใหม่เงินดีแต่มีประวัติอุบัติเหตุร้ายแรง | พิจารณาความปลอดภัยชีวิตมากกว่าเงินทองคำนึงถึงอันตราย | **ก. / ข. / ค.** |

