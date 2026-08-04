# 📘 CLAUDE.md - Developer & Agent Guide

## 1. Project Overview
**Project:** HR Skill Management Platform (บริษัท คอมพลีท โอโต รับเบอร์ จำกัด)  
**Description:** Web application for managing automotive factory employee skill matrices, OJT evaluations, probation assessments, training records, certificate vaults, and ISO/IATF 16949 audit reports.

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
│   ├── components/               # Modular UI Components
│   │   ├── Dashboard.tsx         # Executive Overview & Recharts Visualizations
│   │   ├── EmployeeManagement.tsx # Org Chart & Employee Directory
│   │   ├── SkillMatrixView.tsx   # Skill Matrix & Competency Radar Charts
│   │   ├── OjtProbationEvaluator.tsx # Forms F-HR-016 (Form A/B) & Probation Evaluation
│   │   ├── CertificateVault.tsx  # Certification Expiry Tracking
│   │   ├── TrainingManagement.tsx# Training Calendar & QR/Check-in
│   │   ├── ExamEngine.tsx        # Online Skill Testing & Automatic Grading
│   │   ├── AuditReportExporter.tsx # ISO/IATF Audit Report Center
│   │   ├── Navbar.tsx            # Header & Test Login Switcher
│   │   ├── Sidebar.tsx           # Navigation Menu
│   │   └── TestLoginModal.tsx    # Role Switcher Modal (Admin/Supervisor/Employee)
│   ├── App.tsx                   # Master State Manager & LocalStorage Persistence
│   └── index.css                 # Global Design System Tokens & Glassmorphism Styles
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
- **Native Excel (.xlsx) Export:** Always use SheetJS (`xlsx`) to write native `.xlsx` binary buffers via `XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })`.
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

### B. แบบทดสอบทัศนคติเกี่ยวกับความปลอดภัย (14 ข้อสถานการณ์)
- **วัตถุประสงค์:** ประเมินเจตคติและทัศนคติความปลอดภัย (Safety Attitude) ก่อนเข้าปฏิบัติงานในโรงงาน
- **เกณฑ์ประเมิน:** ทำผิดเกิน 2 ข้อถือว่ายังไม่มีเจตคติความปลอดภัยที่ดีพอ (ผ่าน = ตอบถูกต้องตั้งแต่ 12/14 ข้อขึ้นไป)
- **หัวข้อสถานการณ์สำคัญ 14 ข้อ:**
  1. หัวหน้าสั่งให้คุมเครื่องจักรใหม่โดยไม่แน่ใจวิธีทำงาน ➔ *(ต้องบอกหัวหน้าว่ายังไม่รู้วิธีการทำงานกับเครื่องจักร)*
  2. เพื่อนยิงหนังสติ๊กใส่คนคุมเครื่องจักร ➔ *(ต้องรีบห้ามและบอกให้หยุดการเล่นตลกอันตรายทันที)*
  3. งานขนของเร่งด่วนเหลือ 10 นาทีจะเที่ยง ➔ *(หยุดกินข้าวตามเวลาแล้วกลับมาทำต่อ)*
  4. ยกของหนักเทอะทะคนเดียว มีผู้จัดการอยู่ข้างๆ ➔ *(ขอความช่วยเหลือจากผู้จัดการให้ช่วยยก)*
  5. พบคราบน้ำมันหล่อลื่นหกบนทางเดิน ➔ *(ไปหาผ้ามาเช็ดด้วยตนเอง/เฝ้าระวังเตือนผู้อื่น)*
  6. ทำงานเร่งด่วนจนสถานที่รกรุงรัง นายจ้างเห็นสั่งให้รีบทำความสะอาด ➔ *(อธิบายเหตุผลและสัญญาทำความสะอาดทันทีเมื่องานเสร็จ)*
  7. โดนท้าพนันยกน้ำหนักเหล็กเทอะทะในเวลาพัก ➔ *(ขอใช้เฉพาะอุปกรณ์บาร์เบลมาตรฐานสำหรับการออกกำลังกาย)*
  8. ซ่อมสายไฟฟ้าบนบันไดแล้วเกิดมึนศีรษะเจ็บหน้าอก ➔ *(ลงมาบอกหัวหน้าและพบแพทย์ แม้งานหยุดชะงัก)*
  9. นึกอยากสูบบุหรี่ในพื้นที่ห้ามสูบ ➔ *(อดใจไว้ ไม่แอบสูบในพื้นที่อันตราย)*
  10. เครื่องป้องกันหน้า (Face Shield) หายขณะเทโซดาไฟ ➔ *(ไม่ยอมทำงานถ้าไม่มีเครื่องป้องกันหน้า)*
  11. ค้นพบวิธีทำงานใหม่ที่ปลอดภัยกว่าแต่ช้าลงเล็กน้อย ➔ *(เสนอและแนะนำหัวหน้าทดลองวิธีใหม่)*
  12. บันไดที่บ้านไม่มีราวกั้น ลูกชายตกบันไดเจ็บเล็กน้อย ➔ *(รีบหาทางทำราวกั้นบันไดทันที)*
  13. บริษัทจัดฉายหนังวิธีการขับรถปลอดภัยในเวลาทำงาน ➔ *(ตั้งใจเข้าชมเพื่อรับความรู้ใหม่)*
  14. บริษัทใหม่ให้เงินดีแต่ประวัติอุบัติเหตุร้ายแรงสูง ➔ *(คำนึงถึงความปลอดภัยชีวิตก่อนเรื่องเงิน)*

