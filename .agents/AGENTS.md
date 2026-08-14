# CAR HR Skill Matrix & Exam System Memory & Project Rules

> ไฟล์นี้คือ "ความจำถาวร" ของ agent สำหรับโปรเจกต์ `D:\HrSkill\app`
> ทุกข้อในนี้ยืนยันจากโค้ดจริงแล้ว ไม่ใช่การเดา — ถ้าแก้โค้ดจนขัดกับข้อไหน **ต้องมาแก้ไฟล์นี้ด้วย**
> เอกสารคู่กัน: `app/CLAUDE.md` (มาตรฐานการเขียนโค้ด + ตารางเฉลยข้อสอบเต็ม), `backend/README.md` (endpoint + setup)

---

## 1. Exam Data Sources & Reference Files
- **14-Question Safety Attitude Exam (แบบทดสอบทัศนคติเกี่ยวกับความปลอดภัยในการทำงาน 14 ข้อ):**
  - **โจทย์คำถาม:** อ้างอิงจาก `D:\HrSkill\Flow Chart _ทักษะความสามารถของพนักงาน\แบบทดสอบทัศนคติเกี่ยวกับความปลอดภัยในการทำงาน\แบบทดสอบทัศนคติเกี่ยวกับความปลอดภัยในการทำงาน\แบบทดสอบทัศนคติเกี่ยวกับความปลอดภัย.docx`
  - **เฉลยคำตอบ:** อ้างอิงช่องไฮไลท์สีเหลือง (`fill=FFFF00`) จาก `D:\HrSkill\Flow Chart _ทักษะความสามารถของพนักงาน\แบบทดสอบทัศนคติเกี่ยวกับความปลอดภัยในการทำงาน\แบบทดสอบทัศนคติเกี่ยวกับความปลอดภัยในการทำงาน\กระดาษคำตอบ.xlsx`
- **30-Question Orientation Exam (แบบทดสอบประเมินผลการปฐมนิเทศพนักงานใหม่ 30 ข้อ):**
  - **โจทย์และเฉลยคำตอบ:** อ้างอิงชีต "แบบทดสอบประเมินผลการปฐมนิเทศ" และ "กระดาษคำตอบ-เฉลย" จาก `D:\HrSkill\Flow Chart _ทักษะความสามารถของพนักงาน\แบบทดสอบประเมินผลการปฐมนิเทศ-กระดาษคำตอบ-เฉลย (ใช้ตัวนี้).xlsx`

**ที่อยู่ในโค้ด (source of truth ฝั่งแอป):** `src/services/googleFormSync.ts`
| Bank | บรรทัด | จำนวนข้อ |
|---|---|---|
| `SAFETY_ATTITUDE_QUESTIONS_BANK` | 17 | 14 ข้อ |
| `MASTER_QUESTIONS_BANK` | 90 | 30 ข้อ |

ตารางเฉลยฉบับเต็มพร้อมหมวดวิชาอยู่ใน `app/CLAUDE.md` หัวข้อ 7 — ใช้เป็นตัวเทียบเวลาตรวจสอบ

---

## 2. Exam Phase Lock & HR Control Workflow
- **Pre-Test Lock Status:** รอบการทำแบบทดสอบหลังการอบรม (Post-Test) จะถูก **ล็อคไว้เสมอ (`🔒 รอดำเนินการอบรม`)**
- **Post-Test Unlock Trigger:** จะปลดล็อคให้เข้าทำแบบทดสอบหลังอบรมและรับคะแนนได้ **ต่อเมื่อ HR กดปิด Pre-Test ในระบบแล้วเท่านั้น** (`🔒 HR กดปิด Pre-Test`)
- **Factory WiFi & Exam Delivery Policy:**
  - บริษัทไม่มีนโยบายแจกรหัส WiFi ให้ผู้เข้าอบรมในโรงงาน ดังนั้น **ไม่มีการทำข้อสอบบนระบบเว็บในเครื่องคอมพิวเตอร์**
  - ข้อสอบจัดส่งผ่าน **Google Forms 100%** (ผู้เข้าอบรมใช้สมาร์ทโฟน/เน็ต 4G ของตนเอง)
  - ระบบมี **[ExamQrModal.tsx](file:///d:/HrSkill/app/src/components/exam/ExamQrModal.tsx)** สำหรับ Generate QR Code ความละเอียดสูง ให้ HR เปิดขึ้นจอโปรเจกเตอร์หรือพิมพ์ติดห้องอบรม เพื่อให้ผู้เข้าอบรมสแกนเข้าทำข้อสอบได้ทันที

**Implementation (ยืนยันแล้ว) — `src/components/ExamEngine.tsx` & `src/components/exam/`:**
- `src/components/ExamEngine.tsx` ทำหน้าที่เป็น Main Orchestrator (State + Live Auto-Sync 15s)
- `src/components/exam/ExamDirectoryTable.tsx`: ตารางทะเบียนติดตามผลสอบ HR, KPI Summary, และปุ่ม Toggle Pre/Post Test Lock รายบุคคล/รายรุ่น
- `src/components/exam/ExamDetailDrawer.tsx`: แสดงรายละเอียดผลสอบและข้อที่ตอบผิด (มี Gate `isHR`)
- `src/components/exam/ExamConfigModal.tsx`: หน้าต่างตั้งค่า URL Google Forms & Apps Script
- `src/components/exam/ExamQrModal.tsx`: หน้าต่างแสดง QR Code สำหรับสแกนเข้าสอบ (พร้อมโหมดพิมพ์ใบ QR Code)
- lock แยกกันรายบุคคล **และ** รายชุดข้อสอบ: type คือ `Record<empCode, Record<ExamType, boolean>>` (`PreTestLockMap` ใน `src/types/index.ts:229`)

---

## 3. Security & Access Control
- **Itemized Answer Breakdown (ข้อที่ตอบผิด/ตอบถูก):** สงวนสิทธิ์ให้เฉพาะ **HR / Admin** (`ADMIN`, `SUPERVISOR`) เป็นผู้เปิดดูรายละเอียดได้เท่านั้น
- **Non-HR Employee View:** พนักงานทั่วไปเห็นเฉพาะคะแนนรวมและสถานะ ผ่าน/ไม่ผ่าน แต่ไม่เห็นเฉลยรายข้อเพื่อป้องกันการรั่วไหลของข้อสอบ

**Implementation:** `const isHR = currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR'` ถูกส่งเข้าไปตรวจสอบที่ `src/components/exam/ExamDetailDrawer.tsx`
⚠️ ถ้าเพิ่มหน้า/ปุ่มใหม่ที่แสดง `answersDetail` **ต้องผ่าน `isHR` ทุกครั้ง** — เป็นบทเรียนแบบเดียวกับ ERR-0009 ใน `D:\MEMORY` (เพิ่ม permission check ที่ gate เดียวแล้วลืม path อื่น)

---

## 4. STRICT RULE: NEVER GUESS OR INVENT EXAM QUESTIONS & ANSWERS
- **ห้ามคิดคำถาม ตัวเลือก หรือเฉลยข้อสอบขึ้นมาเองโดยเด็ดขาด (Strict No-Guessing Rule):**
- โครงสร้างข้อสอบ ตัวเลือกคำตอบ และเฉลยทุกข้อ **ต้องมาจากไฟล์ต้นฉบับ Word (`.docx`) และ Excel (`.xlsx`) ที่คุณพลับกำหนดไว้ 100% เท่านั้น**
- กฎนี้ครอบคลุมถึง **Google Apps Script** ที่ใช้สร้างฟอร์มด้วย (`backend/apps-script/`) — ข้อสอบในฟอร์มกับใน `googleFormSync.ts` ต้องตรงกันเป๊ะ ถ้าแก้ที่ใดที่หนึ่งต้องแก้อีกที่ทันที ไม่งั้นการเทียบเฉลยจะเพี้ยน

---

## 5. สถาปัตยกรรมระบบ (3 ชั้น)

```text
┌──────────────────────┐   fetch()    ┌──────────────────────┐
│  Frontend (Vite)     │ ───────────► │  Backend (Express)   │
│  React 19 + TS       │              │  Prisma + MySQL 8.4  │
│  localStorage = หลัก │ ◄─────────── │  Phase 1 = F-HR-002  │
└──────────────────────┘              └──────────▲───────────┘
         ▲                                       │ POST /api/webhook/exam-result
         │ sync ผลสอบ (doGet)                    │ (X-Webhook-Secret)
         └──────────── Google Apps Script ───────┘
                       (Forms + Sheets)
```

**หลักการสำคัญ:** frontend **ยังไม่ได้ย้ายไปพึ่ง backend เต็มตัว** — `localStorage` ยังเป็น source of truth ของโมดูลส่วนใหญ่ backend ทำหน้าที่เฉพาะ F-HR-002 (รายชื่อพนักงานใหม่ + ผลสอบจาก Google Form) ตามที่เขียนไว้ใน `src/utils/api.ts:45-48`

---

## 6. Backend & Database

**ที่อยู่:** `app/backend/` — Express 4 + Prisma 6 + MySQL 8.4 (ESM, `"type": "module"` → import ต้องลงท้าย `.js`)

### Prisma models (Phase 1 เท่านั้น)
`Employee` · `TrainingCourse` · `TrainingAttendance` · `ExamSubmission`
> ตาราง Certificate / SkillEvaluation / OJT **ยังไม่มีใน DB** — จะเพิ่มทีละตารางในเฟสถัดไป (ระบุไว้ใน `schema.prisma:10-12`)

### กฎเรื่อง Port (สำคัญมาก — เครื่องคุณพลับมีของชนกัน)
| บริการ | Host port | Container port | เหตุผล |
|---|---|---|---|
| frontend (dev) | 5173 | — | ค่า default ของ Vite, ตรงกับ `CORS_ORIGIN` |
| frontend (docker) | 8088 | 80 | nginx |
| backend | **4001** | 4000 | 4000 ถูก Windows/WSL networking จองไว้แล้ว |
| MySQL | **3307** | 3306 | เครื่องมี mysqld local ใช้ 3306 อยู่ |

⚠️ **จุดที่ต้องระวัง:** `.env.example` ตั้ง `VITE_API_BASE_URL=http://localhost:4000` ซึ่งถูกเฉพาะตอนรัน backend แบบ `npm run dev` — **ถ้ารันผ่าน Docker ต้องเปลี่ยนเป็น `4001`** ไม่งั้น frontend เรียก API ไม่เจอ

### Webhook Auth
`requireWebhookSecret` (`backend/src/middleware/webhookAuth.ts`) — **fail closed**: ถ้าไม่ได้ตั้ง `WEBHOOK_SECRET` จะตอบ 500 ไม่ใช่ปล่อยผ่าน **ห้ามแก้ให้ปล่อยผ่าน** เพราะนี่คือ auth ชั้นเดียวของ endpoint นี้

### เกณฑ์ผ่าน (ต้องตรงกันทั้ง 3 ชั้น)
| ชุดข้อสอบ | เกณฑ์ผ่าน |
|---|---|
| **REGULATION** (ปฐมนิเทศ 30 ข้อ) | ≥ 80% (24/30) |
| **SAFETY** (ทัศนคติ 14 ข้อ) | ผิดไม่เกิน 2 ข้อ (≥ 12/14) |

`orientationPassed` ของพนักงานจะ flip เป็น `true` อัตโนมัติเมื่อผ่านครบทั้ง 2 หมวด

---

## 7. Google Apps Script (`backend/apps-script/`)

| ไฟล์ | หน้าที่ |
|---|---|
| `Code.gs` | ตัวรวม — สร้างฟอร์มทั้ง 2 ชุด + เป็น Web App API (`doGet`/`doPost`) |
| `Code_Combined_Forms_And_Webhook.gs` | เวอร์ชันรวม forms + webhook |
| `Create_Form_Safety_14Q.gs` | สร้างเฉพาะฟอร์ม 14 ข้อ |
| `Create_Form_Orientation_30Q.gs` | สร้างเฉพาะฟอร์ม 30 ข้อ |

**กฎการ deploy:** Execute as **"Me"**, Who has access **"Anyone"** แล้วเอา Web App URL มาใส่หน้าตั้งค่าในระบบ
**ฟอร์มต้องมีช่อง "รหัสพนักงาน (Employee ID)" เป็น required เสมอ** — เป็นกุญแจเดียวที่ใช้จับคู่ผลสอบกับพนักงาน (`empCode`)
⚠️ empCode ต้อง **normalize เป็นตัวพิมพ์ใหญ่** ก่อนจับคู่เสมอ (บทเรียนจาก commit `7695516`)

**Default URLs ที่ hardcode ไว้** (`googleFormSync.ts:4-13`) ผูกกับ deployment ปัจจุบัน — ถ้า deploy ใหม่ต้องมาแก้ที่นี่ หรือให้ HR กรอกทับในหน้าตั้งค่า

---

## 8. Excel Export — วิธีที่ใช้จริง

### เลือก library ให้ถูกงาน

| Library | ใช้ที่ไหน |
|---|---|
| `jszip` | `excelTemplateExporter.ts`, `fhr002Exporter.ts` — เติมข้อมูลลง template ของจริง (แก้ raw OpenXML) |
| `xlsx` (SheetJS) | `AuditReportExporter.tsx` (สร้าง workbook ใหม่), `googleFormSync.ts` (`parseExcelOrCsvFile` — อ่านไฟล์ที่ HR import), `downloadExcelWorkbook()` |
| `exceljs` | ❌ **ถอดออกจาก `package.json` แล้ว** (2026-08-04) — ไม่มีใครใช้ และมันรักษา drawing/merge ของ template นี้ไม่ได้ ห้ามใส่กลับ |

> เดิม `app/CLAUDE.md` เขียนว่าให้ใช้ ExcelJS ซึ่งไม่ตรงกับโค้ด — **แก้เอกสารทั้ง 2 ไฟล์แล้ว** (ดู ERR-0030)

### `downloadExcelWorkbook()` รับได้ทั้ง 2 แบบ
เดิมรองรับเฉพาะ workbook แบบ ExcelJS (`workbook.xlsx.writeBuffer`) แต่ `AuditReportExporter` ส่ง workbook แบบ SheetJS มา → เงื่อนไขไม่ผ่าน **ฟังก์ชันเลยไม่ทำอะไรเลย ปุ่ม Export Excel หน้า Audit กดแล้วเงียบ ไม่มีไฟล์ ไม่มี error** (แก้แล้ว 2026-08-04)
ตอนนี้รองรับทั้ง SheetJS และ ExcelJS และ **`throw` ถ้าเจอรูปแบบที่ไม่รู้จัก** — ห้ามแก้กลับไปเป็น no-op เงียบๆ

### หลักการร่วม (`excelTemplateExporter.ts`)
1. **โหลด template ต้นฉบับเสมอ** ห้ามสร้างกริดเปล่าเอง — merged cells / border / โลโก้ / legend ต้องคงเดิม
2. เขียนค่าลงเซลล์ผ่าน `setCellInSheetXml()` / ล้างด้วย `clearCellInSheetXml()` — ทั้งคู่ **รักษา `s=` (style index) ของเซลล์เดิมไว้** และเขียนเป็น `t="inlineStr"` เพื่อไม่ต้องยุ่งกับ sharedStrings
3. escape XML ทุกค่าผ่าน `escapeXml()` เสมอ
4. บันทึกไฟล์ผ่าน `saveBlobFile()` เท่านั้น — มันจัดการ 2 เรื่องที่เคยพังมาแล้ว:
   - ระบุ MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` ชัดเจน (ไม่งั้น Chromium เปลี่ยนชื่อไฟล์เป็น GUID)
   - ใช้ `showSaveFilePicker` ถ้ามี, fallback เป็น `<a download>` และกลืน `AbortError` ตอนผู้ใช้กดยกเลิก
5. **sanitize ชื่อไฟล์ทุกครั้ง**: `.replace(/[^a-zA-Z0-9-_]/g, '_')` — แผนกอย่าง `QA/QC`, `HR&GA` มี `/` ที่ทำให้ Chromium ตีเป็น path traversal แล้วทิ้งชื่อไฟล์

### F-HR-002 (Orientation) — `src/utils/fhr002Exporter.ts`
- Template: `/templates/F-HR-002_Rev6_Template.xlsx`
- **sheet1.xml = REGULATION, sheet2.xml = SAFETY** — offset ของแถวต่างกัน 1 แถว **มาจากตัว template เอง ไม่ใช่เราเลือก** ห้ามปรับให้ "เท่ากัน"

| | REGULATION | SAFETY |
|---|---|---|
| วันที่อบรม | A9 | A10 |
| เวลา | F9 | F10 |
| วิทยากร | B10 | B11 |
| สถานที่ | F10 | F11 |
| แถวข้อมูล | 14–35 | 15–36 |

- ความจุ **22 แถว/ครั้ง** (`ORIENTATION_ROW_CAPACITY`) เกินกว่านั้นถูกตัดและรายงานกลับเป็น `truncatedCount` — ต้องแสดงให้ HR เห็น ห้ามตัดเงียบ
- คอลัมน์: A=ลำดับ, B=แผนก, C=รหัส, D=ชื่อ, F=ตำแหน่ง, G=เวลาเช้า, I=เวลาบ่าย
- **H และ J (ช่องลงชื่อ เช้า/บ่าย) ต้องเว้นว่างเสมอ** — ตั้งใจให้เซ็นด้วยมือบนกระดาษที่พิมพ์ออกมา
- วันที่ต้องแปลงเป็น **พ.ศ.** รูปแบบ `DD/MM/YYYY` ผ่าน `toThaiBuddhistDate()`
- แถวที่ไม่มีคนต้องถูก `clearCellInSheetXml` ทิ้ง ไม่ใช่ปล่อยค่าเก่าค้าง

### F-HR-014 (Skill Matrix) — `src/utils/excelTemplateExporter.ts`
- Template: `/templates/F-HR-014_Rev4_Template.xlsx` → แก้ `xl/worksheets/sheet2.xml` + `xl/drawings/drawing2.xml`
- **วงกลมคะแนนต้องเป็นรูป PNG ต้นฉบับเท่านั้น** ห้ามวาดรูปทรงเองหรือใช้ตัวอักษร — ผูก rId ไว้แล้วใน `xl/drawings/_rels/drawing2.xml.rels`:

| ระดับ | rId | ไฟล์ใน template |
|---|---|---|
| 0% | `rId_c0` | `media/image2.png` |
| 25% | `rId_c25` | `media/image4.png` |
| 50% | `rId_c50` | `media/image5.png` |
| 75% | `rId_c75` | `media/image6.png` |
| 100% | `rId_c100` | `media/image3.png` |

  (ไฟล์ต้นฉบับสำหรับอ้างอิง/ทำ template ใหม่อยู่ที่ `public/templates/circle_icons/circle_{0,25,50,75,100}.png`)
- แทรกรูปด้วย `addCircleOneCellAnchor()` — ขนาดคงที่ `310274 x 310274` EMU, `colOff=130000`, `rowOff=2000` (ค่าที่จูนแล้วให้อยู่กลางเซลล์พอดี **ห้ามเปลี่ยนโดยไม่ทดสอบเปิดไฟล์จริง**)
- **ต้องลบ `Group 980` twoCellAnchor ออก** ทุกครั้ง (วงกลมประจุดพื้นหลังที่พาดแถว 14-52 ของ template) และแก้ `<a:srcRect r="6885"/>` เป็น `<a:srcRect/>` เพื่อไม่ให้โลโก้ CAR ถูก crop
- คอลัมน์ทักษะ 6 ช่อง: **F(5) / J(9) / N(13) / R(17) / V(21) / Z(25)** — ชื่อทักษะอยู่แถว 10 และต้อง **นำหน้าด้วยเลขลำดับ** เช่น `1. ชื่อทักษะ`
- offset ในแต่ละกลุ่มทักษะ: `+0` = Target ครั้งที่ 1, `+1` = ผลครั้งที่ 1, `+2` = Target ครั้งที่ 2, `+3` = ผลครั้งที่ 2
- แถวพนักงานเริ่มแถว 14 และ **เพิ่มทีละ 2** (`13 + empIdx * 2` แบบ 0-based)
- Target วาดเสมอแม้ยังไม่ได้ประเมิน / ผลที่ยังไม่ประเมินวาดวงกลม 0%

#### ความจุ 1 แผ่น = 6 ทักษะ × 20 คน (เกินแล้วแตกชีต)
ทั้ง 2 ตัวเลขมาจาก template ไม่ใช่ความชอบ: 6 = กลุ่มคอลัมน์ F/J/N/R/V/Z, 20 = แถวพนักงานที่ merge ไว้ `A14:A15` … `A52:A53` (**แถว 54 ขึ้นไปคือส่วน legend/ลงนาม ถ้าเขียนทับจะทำฟอร์มพัง**)

- ค่าคงที่: `FHR014_SKILLS_PER_SHEET` / `FHR014_EMPLOYEES_PER_SHEET`
- เกินแล้วจะ **clone ชีตเพิ่ม** ตั้งชื่อ `Topic 1-6` / `Emp 1-20` / `Topic 7-12 Emp 21-40` (ถ้าพอดี 1 แผ่นจะคงชื่อเดิม `F-HR-014 Rev.4`)
- เลขลำดับทักษะและลำดับพนักงานเป็น **global** — ชีตที่ 2 ขึ้นต้นด้วย `7.` ต่อจากชีตแรก
- การ clone 1 ชีตต้องเขียนครบ 7 จุด ไม่งั้น Excel เปิดไม่ขึ้น: `worksheets/sheetN.xml` · `worksheets/_rels/sheetN.xml.rels` · `drawings/drawingN.xml` · `drawings/_rels/drawingN.xml.rels` · `workbook.xml` (`<sheet>` + `_xlnm.Print_Area` โดย `localSheetId` = ลำดับ 0-based ใน `<sheets>`) · `workbook.xml.rels` · `[Content_Types].xml`
- chunk แรกใช้ `sheet2`/`drawing2` เดิมของ template (ได้ rels/printerSettings/print area ติดมาฟรี) chunk ถัดไปเริ่มที่ `sheet3`/`drawing3`
- ฟังก์ชันคืน `{ employeeCount, skillCount, sheetNames }` → `SkillMatrixView` แจ้ง HR เมื่อแตกเกิน 1 ชีต **ห้ามตัดข้อมูลทิ้งเงียบ**

#### ✅ วิธีตรวจหลังแก้ exporter (บังคับ)
```bash
cmd /c node --experimental-strip-types scratch/verify_fhr014.mts
cmd /c node --experimental-strip-types scratch/verify_audit_export.mts
```
`verify_fhr014.mts` stub `fetch`/`Blob`/`document` แล้วเรียกฟังก์ชันจริง → เขียนไฟล์ออกมา → **เปิดซ้ำด้วย parser จริง** และนับจำนวนพนักงาน/ทักษะ/วงกลมว่าครบ พร้อมเช็คว่า drawing rels + Content_Types ของชีตที่ clone มาครบ (ครอบคลุม 6 เคส: พอดี / เต็มพอดี / ทักษะเกิน / คนเกิน / เกินทั้งคู่ / ไม่มีข้อมูล)

---

## 9. State & Persistence

| Key | ที่มา | เก็บอะไร |
|---|---|---|
| `hrskill_<key>` | `App.tsx:36-45` (`usePersistentState`) | state ของทุกโมดูล (employees, certificates, OJT, probation, skill eval ฯลฯ) |
| `car_orientation_exam_results_v2` | `googleFormSync.ts:355` | ผลสอบทั้งหมด (map by empCode) |
| `car_pre_test_lock_status_v1` | `googleFormSync.ts:356` | สถานะ HR กดปิด Pre-Test |

- key มี version suffix (`_v1`/`_v2`) — **ถ้าเปลี่ยน shape ของข้อมูล ต้องขึ้น version ใหม่** ไม่ใช่แก้ shape ทับ key เดิม (ของเก่าใน browser ผู้ใช้จะ parse พัง)
- `mockData.ts` **ยังใช้ seed อยู่** สำหรับ employees / skill / OJT / probation / certificates / courses / notifications
- แต่ **ข้อมูลผลสอบ mock ถูกถอดออกหมดแล้ว** (commit `bf9e4ad`) — `INITIAL_DEMO_EXAM_RESULTS = {}` ระบบสอบใช้ข้อมูลจริงจาก Google Form 100% **ห้ามใส่ผลสอบปลอมกลับเข้าไป**
- `EXAM_QUESTIONS` / `INITIAL_EXAM_SUBMISSIONS` ใน `mockData.ts` เป็นของค้างจากยุคเก่า **`App.tsx` ไม่ได้ import แล้ว** — อย่าเผลอเอามาใช้ ให้ใช้ bank ใน `googleFormSync.ts` เท่านั้น

---

## 10. Data Privacy (เคยหลุดมาแล้ว — ห้ามซ้ำ)
- repo `CAR_STATUS` เคยเป็น **public** และมีชื่อ-อีเมลพนักงานจริง 5 คนหลุดเข้า git history มาแล้ว (ล้างด้วย `git-filter-repo` + force-push ไปแล้ว — ดู `ERR-0019` ใน `D:\MEMORY`)
- **ห้าม commit ชื่อจริง / อีเมลจริง / เบอร์โทรจริง ของพนักงาน** ใช้ชื่อสมมติเท่านั้น (`สมหญิง ใจดี`, `EMP-1001`, โดเมน `@example.com`)
- โฟลเดอร์ `D:\HrSkill\HR Skill Management design\` มีฟอร์ม HR ตัวจริงของบริษัท — ถ้าจะ push **ต้อง private เท่านั้น และต้องตรวจด้วย API ว่า private จริงก่อน push**
- `scratch/` ถูก gitignore ไว้แล้ว (มีไฟล์ bank/สคริปต์ทดสอบ) — อย่าย้ายไฟล์จาก `scratch/` เข้า `src/` โดยไม่ตรวจเนื้อหาก่อน

---

## 11. Verification & Git Workflow

**ก่อน commit ทุกครั้ง** (รันใน `d:/HrSkill/app` ผ่าน `cmd /c` เพื่อเลี่ยง PowerShell execution policy):
```bash
cmd /c npx oxlint      # ต้อง 0 error / 0 warning
cmd /c npm run build   # tsc -b && vite build ต้องผ่าน
```
ถ้าแตะ backend เพิ่ม: `cd backend && cmd /c npm run build`

**Branch ปัจจุบัน:** `main` (ตาม `origin/main`)
ยังมี branch ค้างไว้ 2 อัน — `backup-before-push-main`, `experiment-ui` (อย่าเผลอลบ, ยังไม่ได้เช็คว่ามีอะไรที่ยังไม่ merge)

---

## 12. งานที่ยังค้าง (สถานะ ณ 2026-08-04)

| # | เรื่อง | สถานะ |
|---|---|---|
| 1 | F-HR-014 chunking (ทักษะ > 6 / พนักงาน > 20) | ✅ **แก้แล้ว 2026-08-04** — แตกชีตอัตโนมัติ + แจ้ง HR, ผ่าน `verify_fhr014.mts` 6/6 เคส |
| 2 | ปุ่ม Export Excel หน้า Audit กดแล้วเงียบ (no-op) | ✅ **แก้แล้ว 2026-08-04** — `downloadExcelWorkbook` รองรับ SheetJS + throw เมื่อไม่รู้จัก |
| 3 | `VITE_API_BASE_URL` ชี้ 4000 แต่ Docker map 4001 | ✅ **แก้แล้ว** — เขียนหมายเหตุทั้ง 2 กรณีใน `.env.example` |
| 4 | `exceljs` เป็น dead dependency | ✅ **ถอดออกแล้ว** (`npm uninstall exceljs`, -84 packages) |
| 5 | เอกสาร `CLAUDE.md` ทั้ง 2 ไฟล์ไม่ตรงโค้ด | ✅ **แก้แล้ว** — ดู ERR-0030 |
| 6 | Login จริง (email+password แยก role) แทนปุ่มสลับ user | ✅ **เสร็จแล้ว (2026-08-11)** — สร้าง `LoginView.tsx` (Glassmorphism + CAR Full-bleed), จัดการ Session ผ่าน `localStorage`, เพิ่มปุ่ม Logout ใน Navbar, และจำกัดสิทธิ์ให้ HR/Admin เข้าใช้งาน |
| 7 | ผังองค์กร Org Chart Builder (Interactive Drag & Drop) | ✅ **เสร็จแล้ว (2026-08-11)** — ผสาน `@xyflow/react` + `dagre` ร่วมกับการคำนวณอายุงาน `calculateTenure` |
| 8 | ตรวจสอบคะแนนและการซิงค์ Google Forms 14Q/30Q | ✅ **เสร็จแล้ว (2026-08-11)** — ยืนยันผลคะแนนและการตัดเกรดตรงตามมาตรฐาน 100%, ผ่านการทดสอบ `verify_all_modules_e2e.mts` (26/26 ผ่าน) |
| 9 | ตาราง Certificate / SkillEvaluation / OJT ใน DB | ❌ Phase ถัดไป |
| 10 | ย้ายโมดูลอื่นจาก localStorage ไป backend | ❌ Phase ถัดไป |

| 9 | `ExamEngine.tsx` มีการแก้ค้างยังไม่ commit (+56/-10) | ⚠️ ของเดิมก่อนหน้า ไม่ใช่ของรอบนี้ — ตรวจก่อนทำงานต่อ |
