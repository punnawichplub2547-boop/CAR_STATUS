import XLSX from 'xlsx';
import fs from 'fs';

const path1 = "D:\\HrSkill\\Flow Chart _ทักษะความสามารถของพนักงาน\\Form_HR\\F-HR-014 แบบประเมินทักษะความสามารถ Rev.4.xlsx";
const path2 = "Y:\\programmer\\F-HR-014 Re.4 แบบการประเมินทักษะความสามารถ_รอบ-1 (ม.ค-มิ.ย 68) ver.แก้ไข.xls";

const wb1 = XLSX.readFile(path1);
const wb2 = XLSX.readFile(path2);

let output = [];
output.push("=== COMPLETE ANALYSIS REPORT: F-HR-014 EXCEL FILES ===");
output.push("\n1. FILE METADATA & SHEETS COMPARISON:");
output.push(`File 1 (Template Master): ${path1}`);
output.push(`- Format: XLSX (.xlsx)`);
output.push(`- Sheets count: ${wb1.SheetNames.length}`);
output.push(`- Sheet names: ${JSON.stringify(wb1.SheetNames)}`);

output.push(`\nFile 2 (Actual Data - รอบ-1 ม.ค-มิ.ย 68 ver.แก้ไข): ${path2}`);
output.push(`- Format: Excel 97-2003 (.xls)`);
output.push(`- Sheets count: ${wb2.SheetNames.length}`);
output.push(`- Sheet names: ${JSON.stringify(wb2.SheetNames)}`);

output.push("\n2. FILE 1 DETAILS (MASTER TEMPLATE):");
wb1.SheetNames.forEach((name) => {
  const ws = wb1.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  output.push(`\n[Sheet: ${name}] Total Rows: ${rows.length}`);
  rows.slice(0, 15).forEach((r, i) => {
    if (r && r.length > 0) output.push(`  L${i+1}: ${JSON.stringify(r.slice(0, 8))}`);
  });
});

output.push("\n3. FILE 2 DETAILS (ACTUAL HR DEPT EVALUATION):");
wb2.SheetNames.forEach((name) => {
  const ws = wb2.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  output.push(`\n[Sheet: ${name}] Total Rows: ${rows.length}`);
  rows.slice(0, 18).forEach((r, i) => {
    if (r && r.length > 0) output.push(`  L${i+1}: ${JSON.stringify(r.slice(0, 8))}`);
  });
});

fs.writeFileSync('compare_report.txt', output.join('\n'), 'utf8');
console.log("Report saved to compare_report.txt");
