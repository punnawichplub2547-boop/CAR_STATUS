import JSZip from 'jszip';
import { setCellInSheetXml, saveBlobFile } from './excelTemplateExporter';
import type { ProbationCriteriaScores, ProbationGrade, ProbationPeriod } from '../types';

interface ExportFHR009Options {
  employeeName: string;
  empCode: string;
  position: string;
  department: string;
  section?: string;
  startingDate: string; // YYYY-MM-DD
  evalDate: string; // YYYY-MM-DD
  period: ProbationPeriod;
  scores: ProbationCriteriaScores;
  criteriaTotalScore: number;
  criteriaPercentage: number;
  attendancePercentage: number;
  resultScore: number;
  grade: ProbationGrade;
}

// Cell addresses inside F-HR-009_Rev7_Template.xlsx — verified directly
// against the real template's raw sheet XML (single sheet,
// "Evaluation-ทดลองงานปกติ"). The sheet has 3 side-by-side score blocks
// (30/90/119-day rounds sharing the same 10 criteria rows) — each
// ProbationEvaluation record covers exactly one round, so only that
// round's block gets filled; the other two stay blank on this printout.
// F2/F3/M3/S3/D5/F5 hold VLOOKUP formulas against an external "ทะเบียน
// ลูกจ้าง" workbook in the original template — those don't resolve
// standalone, so they're overwritten with plain values here (same
// reasoning as every other cell write via setCellInSheetXml).
const PROBATION_ROUND_LABEL_ROWS = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26] as const;

// Matches the exact order of PROBATION_CRITERIA in ProbationEvaluator.tsx —
// row 8 = knowledge, row 10 = diligence, etc.
const CRITERIA_ORDER: (keyof ProbationCriteriaScores)[] = [
  'knowledge',
  'diligence',
  'responsibility',
  'teamwork',
  'attitude',
  'regulationCompliance',
  'problemSolving',
  'learningAbility',
  'ppeUse',
  'activityParticipation',
];

// Score 5→A+ down to 1→D, in the column order the template already prints
// (row 6/7 header: B/I/P=A+/5, C/J/Q=A/4, D/K/R=B/3, E/L/S=C/2, F/M/T=D/1).
const SCORE_TO_COLUMN_OFFSET: Record<number, number> = { 5: 0, 4: 1, 3: 2, 2: 3, 1: 4 };

interface RoundBlock {
  scoreStartCol: string; // 'B' | 'I' | 'P'
  periodFromCell: string;
  periodToCell: string;
  totalScoreCell: string;
}

const ROUND_BLOCKS: Record<ProbationPeriod, RoundBlock> = {
  '30_DAYS': { scoreStartCol: 'B', periodFromCell: 'D5', periodToCell: 'F5', totalScoreCell: 'H28' },
  '90_DAYS': { scoreStartCol: 'I', periodFromCell: 'K5', periodToCell: 'M5', totalScoreCell: 'O28' },
  '119_DAYS': { scoreStartCol: 'P', periodFromCell: 'R5', periodToCell: 'T5', totalScoreCell: 'V28' },
};

// A-Z only — the score columns never go past column T, so this simple
// offset is enough (no need for the AA/AB multi-letter case).
function shiftColumn(col: string, offset: number): string {
  return String.fromCharCode(col.charCodeAt(0) + offset);
}

function toThaiBuddhistDate(isoDate?: string): string {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y + 543}`;
}

export async function exportFHR009({
  employeeName,
  empCode,
  position,
  department,
  section,
  startingDate,
  evalDate,
  period,
  scores,
  criteriaTotalScore,
  criteriaPercentage,
  attendancePercentage,
  resultScore,
  grade,
}: ExportFHR009Options): Promise<void> {
  const tplResp = await fetch('/templates/F-HR-009_Rev7_Template.xlsx');
  if (!tplResp.ok) throw new Error(`โหลดเทมเพลตไม่สำเร็จ (HTTP ${tplResp.status})`);
  const templateBuffer = await tplResp.arrayBuffer();

  const zip = await JSZip.loadAsync(templateBuffer);
  const sheetPath = 'xl/worksheets/sheet1.xml';
  const sheetFile = zip.file(sheetPath);
  if (!sheetFile) throw new Error(`ไม่พบ ${sheetPath} ในเทมเพลต`);
  let sheetXml = await sheetFile.async('string');

  // Header
  sheetXml = setCellInSheetXml(sheetXml, 'F2', employeeName);
  sheetXml = setCellInSheetXml(sheetXml, 'M2', empCode);
  sheetXml = setCellInSheetXml(sheetXml, 'S2', toThaiBuddhistDate(startingDate));
  sheetXml = setCellInSheetXml(sheetXml, 'F3', position);
  if (section) sheetXml = setCellInSheetXml(sheetXml, 'M3', section);
  sheetXml = setCellInSheetXml(sheetXml, 'S3', department);

  // This round's evaluation period + per-criterion X marks + total score —
  // the other two rounds' blocks are left as-is (blank) since this record
  // doesn't cover them.
  const block = ROUND_BLOCKS[period];
  sheetXml = setCellInSheetXml(sheetXml, block.periodFromCell, toThaiBuddhistDate(startingDate));
  sheetXml = setCellInSheetXml(sheetXml, block.periodToCell, toThaiBuddhistDate(evalDate));

  CRITERIA_ORDER.forEach((key, i) => {
    const row = PROBATION_ROUND_LABEL_ROWS[i];
    const score = scores[key];
    const offset = SCORE_TO_COLUMN_OFFSET[score];
    if (offset === undefined) return; // guard against an out-of-range score (shouldn't happen — UI only offers 1-5)
    const col = shiftColumn(block.scoreStartCol, offset);
    sheetXml = setCellInSheetXml(sheetXml, `${col}${row}`, 'X');
  });

  sheetXml = setCellInSheetXml(sheetXml, block.totalScoreCell, criteriaTotalScore);

  // Final blended result — one instance regardless of which round this is.
  sheetXml = setCellInSheetXml(sheetXml, 'L43', `${criteriaPercentage}%`);
  sheetXml = setCellInSheetXml(sheetXml, 'L44', `${attendancePercentage}%`);
  sheetXml = setCellInSheetXml(sheetXml, 'L45', `${resultScore}%`);
  sheetXml = setCellInSheetXml(sheetXml, 'L46', grade);

  // Pass/fail checkboxes (rows 29-30 per block) and the signature/date
  // blocks below them are intentionally left untouched — signed by hand on
  // the printed page, same convention as F-HR-004A's approval section.

  zip.file(sheetPath, sheetXml);

  const safeEmpCode = empCode.replace(/[^a-zA-Z0-9-_]/g, '_');
  const safeDate = new Date().toISOString().split('T')[0];
  const fileName = `F-HR-009_${safeEmpCode}_${period}_${safeDate}.xlsx`;

  const outputBuffer = await zip.generateAsync({ type: 'arraybuffer' });
  await saveBlobFile(outputBuffer, fileName);
}
