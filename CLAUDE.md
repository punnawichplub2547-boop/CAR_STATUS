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

---

## 6. Verification Checklist Before Commit

Before pushing any changes to Git:
1. Run `cmd /c npx oxlint` and ensure **0 errors / 0 warnings**.
2. Run `cmd /c npm run build` and ensure TypeScript compilation & Vite build succeed.
3. Test responsiveness and verify font rendering consistency.
