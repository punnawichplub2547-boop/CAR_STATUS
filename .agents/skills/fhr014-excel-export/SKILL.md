---
name: fhr014-excel-export
description: Guidelines and instructions for exporting F-HR-014 Skill Matrix Excel files using ExcelJS with original circle rating PNG images and template grid layout.
---

# F-HR-014 Skill Matrix Excel Export Skill & Guidelines

## Overview
This skill documents the precise rules, template structure, cell mappings, and image placement logic for exporting Skill Matrix evaluation forms (Form F-HR-014 Rev.4) in the HR Skill Management web application.

## Core Directives
1. **Do NOT generate new circle shapes or text symbols**: Use the exact extracted PNG images located at `app/public/templates/circle_icons/`:
   - `circle_0.png`: 0% Rating (Empty circle with cross line)
   - `circle_25.png`: 25% Rating (1 quadrant black filled)
   - `circle_50.png`: 50% Rating (2 quadrants / half black filled)
   - `circle_75.png`: 75% Rating (3 quadrants black filled)
   - `circle_100.png`: 100% Rating (4 quadrants / full black filled)
2. **Template Retention**: Always load the original blank template `/templates/F-HR-014_Rev4_Template.xlsx` using `ExcelJS` to preserve original merged cells, borders, header logos, and legend text. Do NOT construct a blank grid from scratch.
3. **Numbered Skill Headers**: In Row 10 (merged cells F10:I11, J10:M11, N10:Q11, R10:U11, V10:Y11, Z10:AC11), prepend 1-based index numbers to skill names (e.g. `1. ข้อกำหนดระบบ ISO 9001/IATF 16949`).
4. **Sheet Chunking**: Limit skills per sheet to 6. If a department has > 6 skills, create/clone sheets named `Topic 1-6`, `Topic 7-12`, `Topic 13-18`... matching reference file `F-HR-014 Re.4 แบบการประเมินทักษะความสามารถ_รอบ-1 ver.แก้ไข.xls`.
5. **Employee Grid Alignment**: Each employee spans 2 rows starting at Row 14 (Sequence No in Col A, Code in Col B, Name in Col C:D, Position in Col E):
   - Row 14: Target levels & Attempt 1 Result levels
   - Row 15: Attempt 2 Result levels (if re-evaluated)
6. **ExcelJS Image Insertion**: Insert PNG icons into rating cells using `sheet.addImage(imageId, { tl: { col, row }, ext: { width: 14, height: 14 } })`.

## Cell Reference Table
| Cell | Description | Content / Format |
|---|---|---|
| `C4` | Assessor Name | E.g. `นางสาว สมหญิง ใจดี (Admin/Supervisor)` |
| `H5` | Assessor Position | E.g. `ผู้จัดการ` |
| `J5` | Dept & Section | `DEPT......${dept}………  SECTION…............-................` |
| `AD6` | Action Date | Attempt 1 assessment date / cycle |
| `F10` | Skill 1 Title | `${globalIndex + 1}. ${skillName}` |
| `J10` | Skill 2 Title | `${globalIndex + 2}. ${skillName}` |
| `N10` | Skill 3 Title | `${globalIndex + 3}. ${skillName}` |
| `R10` | Skill 4 Title | `${globalIndex + 4}. ${skillName}` |
| `V10` | Skill 5 Title | `${globalIndex + 5}. ${skillName}` |
| `Z10` | Skill 6 Title | `${globalIndex + 6}. ${skillName}` |
| `A14` | Emp Sequence | 1, 2, 3... |
| `B14` | Emp Code | E.g. `5508006` |
| `C14` | Emp Name | E.g. `น.ส.รัชนี ศุภชารี` |
| `E14` | Emp Position | E.g. `หัวหน้าแผนก` |
| `F14` | Skill 1 Target | Image `circle_*.png` |
| `G14` | Skill 1 Result 1 | Image `circle_*.png` |
| `I15` | Skill 1 Result 2 | Image `circle_*.png` |
