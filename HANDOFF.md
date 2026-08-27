# 📋 คู่มือการส่งมอบและติดตั้งระบบ (Production & Developer Handoff Guide)
**โครงการ:** CAR HR Skill Management Platform (บริษัท คอมพลีท โอโต รับเบอร์ จำกัด)  
**วันที่อัปเดตล่าสุด:** 21 สิงหาคม 2026  
**สถานะโปรเจกต์:** 🟢 **Full-Stack Production Ready** (Express 4 + Prisma 6 + MySQL 8.4 + React 19 Vite + Nginx Alpine)  
- **Dev Local Path:** `D:\HrSkill\app`
- **Prod Server Path:** `D:\Skill\CAR_STATUS` (Server: `10.255.255.173`)
- **GitHub Repository:** https://github.com/punnawichplub2547-boop/CAR_STATUS

---

## 1. ข้อมูลภาพรวมและระบบมาตรฐานที่รองรับ (Supported Standards)
ระบบบริหารจัดการทักษะความสามารถพนักงาน (Skill Matrix) และการประเมินผลสำหรับโรงงานผลิตชิ้นส่วนยางยานยนต์ รองรับมาตรฐานสากล **IATF 16949**, **ISO 9001** และ **ISO 14001**:

- **F-HR-002**: รายชื่อและประวัติผู้เข้ารับการฝึกอบรม (ปฐมนิเทศกฎระเบียบ & ความปลอดภัย)
- **F-HR-004 (Form A)**: แบบบันทึกการฝึกอบรมเฉพาะงานพนักงานเข้าใหม่ (New Hire OJT - สูงสุด 25 ทักษะ)
- **F-HR-004 (Form B)**: แบบบันทึกการฝึกอบรมเฉพาะงานกรณีเปลี่ยนงาน / 4M1E Change
- **F-HR-005**: มาตรฐานทักษะความสามารถตามตำแหน่ง (Skill Competency Standards)
- **F-HR-009**: แบบประเมินผลการทดลองงาน 30 / 90 / 119 วัน (เกรด A+ ถึง D คำนวณถ่วงน้ำหนัก 80/20)
- **F-HR-014**: แบบประเมินทักษะความสามารถพนักงานประจำรอบ 6 เดือน (Multi-sheet OpenXML Exporter พร้อมวงกลม PNG ต้นฉบับ)
- **Exam Engine**: ข้อสอบปฐมนิเทศออนไลน์ 30 ข้อ (ผ่าน ≥80%) และแบบทดสอบทัศนคติความปลอดภัย 14 ข้อ (ผิดได้ ≤2) ซิงก์ Google Forms อัตโนมัติ

---

## 2. สถาปัตยกรรมและพอร์ตระบบ (Port Mappings & Networking)

```text
┌─────────────────────────────────────────────────────────────┐
│  Host Server (10.255.255.173 / Local Machine)               │
│                                                             │
│  ┌───────────────────────┐        ┌──────────────────────┐  │
│  │  Nginx Frontend (8088)│ ─────► │ Backend API (4002)   │  │
│  │  (proxy_pass /api/)   │        │ Express 4 + Prisma 6 │  │
│  └───────────────────────┘        └──────────┬───────────┘  │
│                                              │              │
│                                   ┌──────────▼───────────┐  │
│                                   │ MySQL 8.4 (3308)     │  │
│                                   └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

| บริการ (Service) | Host Port | Container Port | คำอธิบาย |
|---|---|---|---|
| **Frontend Web App** | `8088` (Dev: `5173`) | `80` | Nginx Alpine ให้บริการหน้าเว็บ + Reverse Proxy `/api/` |
| **Backend API** | `4002` | `4000` | Express 4 RESTful API + JWT Auth Service |
| **MySQL Database** | `3308` | `3306` | ฐานข้อมูล MySQL 8.4 สำหรับระบบ CAR Status |

---

## 3. บัญชีผู้ใช้งานระบบทดสอบเริ่มต้น (Default Seed Accounts)

| รหัสพนักงาน | ชื่อ-นามสกุล | Role | รหัสผ่านเริ่มต้น | แผนก / ตำแหน่ง |
|---|---|---|---|---|
| `EMP-1001` | นางสาว สมหญิง ใจดี | `ADMIN` | `admin1234` | HR&GA IT Officer |
| `EMP-1002` | นางสาว วรรณา สุขเจริญ | `HR` | `hr1234` | HR&GA Safety (จป.อาวุโส) |
| `EMP-1004` | นาย มานพ ตั้งมั่น | `SUPERVISOR` | `super1234` | FMG-A Production Manager |
| `EMP-1003` | นาย ประเสริฐ ยิ้มแย้ม | `EMPLOYEE` | `emp1234` | FMG-A พนักงานทั่วไป (ทดลองงาน) |

---

## 4. ขั้นตอนการ Deploy บนเซิร์ฟเวอร์จริง (Production Deployment via Docker)

เมื่อเชื่อมต่อเข้าไปยังเครื่องเซิร์ฟเวอร์ (ผ่าน TightVNC หรือ Terminal):

```bash
# 1. เข้าสู่โฟลเดอร์โปรเจกต์
cd D:\Skill\CAR_STATUS

# 2. ดึงโค้ดล่าสุดจาก GitHub
git pull origin main

# 3. สั่ง Build และเริ่มต้น Container ด้วย Docker Compose
docker compose build --no-cache
docker compose up -d

# 4. สั่ง Seed ข้อมูลเริ่มต้นและตรวจสอบความพร้อม
docker compose exec car-status-backend npm run prisma:seed

# 5. ตรวจสอบสถานะการทำงานของคอนเทนเนอร์
docker compose ps
```

---

## 5. คำสั่งสำหรับการพัฒนาและตรวจสอบ (Development & Audit Commands)

```bash
# รัน Frontend Dev Server
cmd /c npm run dev

# รัน Backend Dev Server
cd backend && cmd /c npm run dev

# ตรวจสอบ Code Quality & Type Safety
cmd /c npx oxlint
cmd /c npm run build

# รัน Master Test Suite (7 โมดูล 26 รายการ)
cmd /c node --experimental-strip-types scratch/verify_all_modules_e2e.mts

# รัน Backend Authentication & RBAC Suite
cd backend && cmd /c npx tsx src/verify_auth.ts
```
