import JSZip from 'jszip';
import { setCellInSheetXml, fillCheckboxInDrawingXml, addImageOneCellAnchor, clearCellInSheetXml, saveBlobFile } from './excelTemplateExporter';
import type { OjtPurposeType, OjtEvaluationMethod, OjtChangeReasonCategory, SkillLevel } from '../types';

export interface ExportOjtContentItem {
  description: string;
  trainingDate?: string; // YYYY-MM-DD
  timeFrom?: string;
  timeTo?: string;
  resultPercent?: number;
  remark?: string;
}

interface ExportFHR004AOptions {
  employeeName: string;
  empCode: string;
  position: string;
  department: string;
  startingDate: string; // YYYY-MM-DD
  purposeType: OjtPurposeType;
  evaluationMethod: OjtEvaluationMethod;
  hasAttachment: boolean;
  contentItems: ExportOjtContentItem[];
}

// Cell addresses inside F-HR-004A_Rev11_Template.xlsx — verified directly
// against the real template's raw sheet XML and merge ranges (single sheet,
// "HR-004 Rev.11(A)"). Rows 13–37 = the 25-line content band; column A in
// that band is pre-printed with sequence numbers 1–25 in the template
// itself and must never be written to.
const DATA_START_ROW = 13;
const DATA_END_ROW = 37;
export const FHR004A_ROW_CAPACITY = DATA_END_ROW - DATA_START_ROW + 1;

// ผลการประเมิน (column R, 0-indexed col 17) shows the same 25/50/75/100
// circle-fill icons as the form's own "หมายเหตุ" legend at the bottom of
// the page — reusing those already-embedded images (rId2-rId5) rather than
// writing "75%" as plain text, which is what the score actually looks like
// on the real paper form and in the app's own SkillLevel scale. 0% has no
// icon in the legend, so it's left blank, same as the legend itself.
const RESULT_COL_IDX = 17; // column R
const RESULT_ICON_RID: Record<number, string> = { 25: 'rId3', 50: 'rId4', 75: 'rId5', 100: 'rId2' };
// The visible ผลการประเมิน cell is a merged R:T range (R=3.7265625 +
// S=5.54296875 + T=5.54296875 chars ≈ 1,038,225 EMU wide), not column R
// alone — a oneCellAnchor doesn't know about merges, so colOff has to
// measure the full merged width from R's left edge to actually land in the
// middle of what's visibly one cell. Each content row is 20.15pt tall
// (~255905 EMU, not merged).
const RESULT_ICON_SIZE = { cx: 200000, cy: 200000, colOff: 419100, rowOff: 28000 };

// The 3 one-per-form choices aren't cells with checkboxes — each one is an
// empty "Rectangle" shape drawn in drawing1.xml just to the left of its
// label cell, not addressable via cell edits. We mark the chosen option by
// filling that shape via fillCheckboxInDrawingXml instead of touching the
// label cell's own text (which the template already has correct, and
// prefixing it with a ☑/☐ character used to draw a second, unrelated
// checkbox glyph right next to the real one).
const PURPOSE_LABELS: Record<OjtPurposeType, { cell: string }> = {
  NEW_HIRE: { cell: 'F7' },
  TRANSFER: { cell: 'K7' },
};

const EVAL_METHOD_LABELS: Record<OjtEvaluationMethod, { cell: string }> = {
  PRE_POST_TEST: { cell: 'F8' },
  PRACTICAL: { cell: 'K8' },
  Q_AND_A: { cell: 'Q8' },
};

const ATTACHMENT_LABELS: Record<'true' | 'false', { cell: string }> = {
  true: { cell: 'F9' },
  false: { cell: 'K9' },
};

function toThaiBuddhistDate(isoDate?: string): string {
  if (!isoDate) return '';
  // Accept both a plain 'YYYY-MM-DD' (what the form's own date input sends)
  // and a full ISO datetime like 'YYYY-MM-DDTHH:mm:ss.sssZ' (what a Prisma
  // DateTime field round-trips as through the backend API) — the date
  // portion is always the first 10 characters in either case.
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y + 543}`;
}

function cellRefToColRow0(cellRef: string): { col: number; row: number } {
  const match = /^([A-Z]+)(\d+)$/.exec(cellRef);
  if (!match) return { col: 0, row: 0 };
  const [, colLetters, rowStr] = match;
  let col = 0;
  for (let i = 0; i < colLetters.length; i++) {
    col = col * 26 + (colLetters.charCodeAt(i) - 64);
  }
  return { col: col - 1, row: Number(rowStr) - 1 };
}

function markChoice(drawingXml: string, options: { cell: string }[], selectedCell: string): string {
  const selected = options.find((opt) => opt.cell === selectedCell);
  if (!selected) return drawingXml;
  const { col, row } = cellRefToColRow0(selected.cell);
  return fillCheckboxInDrawingXml(drawingXml, col - 1, row);
}

export async function exportFHR004A({
  employeeName,
  empCode,
  position,
  department,
  startingDate,
  purposeType,
  evaluationMethod,
  hasAttachment,
  contentItems,
}: ExportFHR004AOptions): Promise<{ exportedCount: number; truncatedCount: number }> {
  const tplResp = await fetch('/templates/F-HR-004A_Rev11_Template.xlsx');
  if (!tplResp.ok) throw new Error(`โหลดเทมเพลตไม่สำเร็จ (HTTP ${tplResp.status})`);
  const templateBuffer = await tplResp.arrayBuffer();

  const zip = await JSZip.loadAsync(templateBuffer);
  const sheetPath = 'xl/worksheets/sheet1.xml';
  const sheetFile = zip.file(sheetPath);
  if (!sheetFile) throw new Error(`ไม่พบ ${sheetPath} ในเทมเพลต`);
  let sheetXml = await sheetFile.async('string');

  const drawingPath = 'xl/drawings/drawing1.xml';
  const drawingFile = zip.file(drawingPath);
  if (!drawingFile) throw new Error(`ไม่พบ ${drawingPath} ในเทมเพลต`);
  let drawingXml = await drawingFile.async('string');

  // The template also draws an unrelated decoration ("Group 3"): 25 empty
  // white circle-with-cross placeholder shapes running down column S
  // (rows 13-37), one per content row regardless of whether that row has
  // any actual score — sitting right next to the ผลการประเมิน icons we
  // place in column R below, which reads as a second, unfilled icon per
  // row. Stripped out entirely (same technique as F-HR-014's "Group 980"
  // background-pattern removal in excelTemplateExporter.ts).
  const decorativeGroupPattern = /<xdr:twoCellAnchor[^>]*>(?:(?!<\/xdr:twoCellAnchor>).)*?Group 3"(?:(?!<\/xdr:twoCellAnchor>).)*?<\/xdr:twoCellAnchor>/s;
  drawingXml = drawingXml.replace(decorativeGroupPattern, '');

  // Header
  sheetXml = setCellInSheetXml(sheetXml, 'C5', employeeName);
  sheetXml = setCellInSheetXml(sheetXml, 'K5', empCode);
  sheetXml = setCellInSheetXml(sheetXml, 'P5', position);
  sheetXml = setCellInSheetXml(sheetXml, 'D6', department);
  sheetXml = setCellInSheetXml(sheetXml, 'K6', toThaiBuddhistDate(startingDate));

  // 3 one-per-form choices — see markChoice/fillCheckboxInDrawingXml for
  // why this fills a drawn shape rather than writing cell text.
  drawingXml = markChoice(drawingXml, Object.values(PURPOSE_LABELS), PURPOSE_LABELS[purposeType].cell);
  drawingXml = markChoice(drawingXml, Object.values(EVAL_METHOD_LABELS), EVAL_METHOD_LABELS[evaluationMethod].cell);
  drawingXml = markChoice(
    drawingXml,
    Object.values(ATTACHMENT_LABELS),
    ATTACHMENT_LABELS[hasAttachment ? 'true' : 'false'].cell
  );

  // Content rows — never write column A (sequence 1-25 is pre-printed)
  const rowsToWrite = contentItems.slice(0, FHR004A_ROW_CAPACITY);
  rowsToWrite.forEach((item, i) => {
    const r = DATA_START_ROW + i;
    sheetXml = setCellInSheetXml(sheetXml, `B${r}`, item.description);
    if (item.trainingDate) sheetXml = setCellInSheetXml(sheetXml, `L${r}`, toThaiBuddhistDate(item.trainingDate));
    if (item.timeFrom) sheetXml = setCellInSheetXml(sheetXml, `N${r}`, item.timeFrom);
    if (item.timeTo) sheetXml = setCellInSheetXml(sheetXml, `O${r}`, item.timeTo);
    const iconRid = item.resultPercent !== undefined ? RESULT_ICON_RID[item.resultPercent] : undefined;
    if (iconRid) {
      drawingXml = addImageOneCellAnchor(drawingXml, RESULT_COL_IDX, r - 1, iconRid, RESULT_ICON_SIZE);
      sheetXml = clearCellInSheetXml(sheetXml, `R${r}`); // icon replaces the plain "75%" text
    }
    if (item.remark) sheetXml = setCellInSheetXml(sheetXml, `U${r}`, item.remark);
  });

  // Rows 45-48 (the 4 approval-signature blocks) are intentionally left
  // untouched — signed by hand on the printed page, same convention as
  // F-HR-002's H/J signature columns.

  zip.file(sheetPath, sheetXml);
  zip.file(drawingPath, drawingXml);

  const safeEmpCode = empCode.replace(/[^a-zA-Z0-9-_]/g, '_');
  const safeDate = new Date().toISOString().split('T')[0];
  const fileName = `F-HR-004A_${safeEmpCode}_${safeDate}.xlsx`;

  const outputBuffer = await zip.generateAsync({ type: 'arraybuffer' });
  await saveBlobFile(outputBuffer, fileName);

  return {
    exportedCount: rowsToWrite.length,
    truncatedCount: Math.max(0, contentItems.length - FHR004A_ROW_CAPACITY),
  };
}

// ---------------------------------------------------------------------------
// F-HR-004 Form(B) — 4M1E change/transfer OJT, one course trains up to 10
// employees at once (opposite of Form A, which is 1 employee × up to 25
// topics). Cell addresses verified against the real template's raw sheet
// XML + merge ranges (single sheet "HR-004 Rev.11(B)").
// ---------------------------------------------------------------------------

export interface ExportOjtParticipant {
  empCode: string;
  employeeName: string;
  position?: string;
  preScore?: number;
  postScore?: number;
  instructorScorePercent: SkillLevel;
  isPassed: boolean;
  remarks?: string;
}

interface ExportFHR004BOptions {
  courseTitle: string;
  contentSubItems: string[]; // up to 4 lines — the template's numbered 1.1-1.4
  department: string;
  trainingDate?: string; // YYYY-MM-DD
  timeFrom?: string;
  timeTo?: string;
  location?: string;
  instructorName1?: string;
  instructorName2?: string;
  changeReasonCategory: OjtChangeReasonCategory;
  changeReasonOtherDetail?: string;
  evaluationMethod: OjtEvaluationMethod;
  hasAttachment: boolean;
  participants: ExportOjtParticipant[];
}

// Rows 25-34 = the 10-trainee band; column A in that band is pre-printed
// with sequence numbers 1-10 in the template itself and must never be
// written to (same convention as Form A's column A).
const DATA_START_ROW_B = 25;
const DATA_END_ROW_B = 34;
export const FHR004B_ROW_CAPACITY = DATA_END_ROW_B - DATA_START_ROW_B + 1;

// "2. สำหรับผู้สอนประเมิน" has two icon columns per trainee row: เกณฑ์ผ่าน
// การประเมิน (P) — the fixed 75% passing bar, same for every row — and
// ผลการประเมิน (R) — the trainee's actual instructor score. Unlike Form A's
// legend (no 0% icon), this template's own legend at rows 37-41 has an icon
// for every level 0-100, so the export can show 0% the same way it shows
// the others.
const PASS_CRITERIA_COL_IDX_B = 15; // column P
const RESULT_COL_IDX_B = 17; // column R
const RESULT_ICON_RID_B: Record<number, string> = { 0: 'rId2', 25: 'rId3', 50: 'rId4', 75: 'rId5', 100: 'rId6' };
// Both header labels (P23:Q23, R23:S23) are merged two columns wide, but the
// data rows only ever write into the single left column (P/R) — column Q/S
// stays empty. Centering the icon within P/R alone would still look
// left-shifted against that wider merged visual block above it, so the
// offset centers it across the merged pair's combined width instead: single
// column ≈333,375 EMU (width 5 @ Calibri 11) → pair ≈666,750 EMU, minus the
// 200,000 EMU icon, halved. Row 25-34 are 21pt (266,700 EMU) tall.
const RESULT_ICON_SIZE_B = { cx: 200000, cy: 200000, colOff: 233000, rowOff: 33000 };

// Both icon columns ship with a decorative unfilled "⊕" AutoShape per row
// (one per cell, not grouped like Form A's "Group 3") — remove the one at
// this exact position before overlaying the real icon, or the two render
// stacked on top of each other.
function removeDecorativeAutoShape(drawingXml: string, colIdx: number, rowIdx: number): string {
  const anchorPattern = /<xdr:twoCellAnchor(?:\s+[^>]*)?>[\s\S]*?<\/xdr:twoCellAnchor>/g;
  return drawingXml.replace(anchorPattern, (anchor) => {
    if (!anchor.includes('name="AutoShape')) return anchor;
    const fromMatch = /<xdr:from><xdr:col>(\d+)<\/xdr:col>[^<]*<xdr:colOff>\d+<\/xdr:colOff><xdr:row>(\d+)<\/xdr:row>/.exec(anchor);
    if (!fromMatch) return anchor;
    if (Number(fromMatch[1]) !== colIdx || Number(fromMatch[2]) !== rowIdx) return anchor;
    return '';
  });
}

// The 11 one-per-form choices (6 สาเหตุที่อบรม + 3 ประเมินผลโดยการ + 2
// บันทึกผลการประเมิน) are drawn "Rectangle" shapes in drawing1.xml, same
// mechanism as Form A's 3 choices (see fillCheckboxInDrawingXml) — but this
// template's shapes aren't spaced at a uniform "one column left of the
// label" offset, so each one's (col, row) is hardcoded from the template's
// own drawing XML rather than derived from the label cell.
const REASON_RECT: Record<OjtChangeReasonCategory, { col: number; row: number }> = {
  DOCUMENT: { col: 3, row: 13 },
  METHOD: { col: 8, row: 13 },
  MATERIAL: { col: 12, row: 13 },
  MACHINE: { col: 3, row: 14 },
  ANNUAL_REVIEW: { col: 8, row: 14 },
  OTHER: { col: 12, row: 14 },
};
const EVAL_METHOD_RECT_B: Record<OjtEvaluationMethod, { col: number; row: number }> = {
  PRE_POST_TEST: { col: 1, row: 16 },
  PRACTICAL: { col: 7, row: 16 },
  Q_AND_A: { col: 12, row: 16 },
};
const ATTACHMENT_RECT_B: Record<'true' | 'false', { col: number; row: number }> = {
  true: { col: 1, row: 18 },
  false: { col: 7, row: 18 },
};

export async function exportFHR004B({
  courseTitle,
  contentSubItems,
  department,
  trainingDate,
  timeFrom,
  timeTo,
  location,
  instructorName1,
  instructorName2,
  changeReasonCategory,
  changeReasonOtherDetail,
  evaluationMethod,
  hasAttachment,
  participants,
}: ExportFHR004BOptions): Promise<{ exportedCount: number; truncatedCount: number }> {
  const tplResp = await fetch('/templates/F-HR-004B_Rev11_Template.xlsx');
  if (!tplResp.ok) throw new Error(`โหลดเทมเพลตไม่สำเร็จ (HTTP ${tplResp.status})`);
  const templateBuffer = await tplResp.arrayBuffer();

  const zip = await JSZip.loadAsync(templateBuffer);
  const sheetPath = 'xl/worksheets/sheet1.xml';
  const sheetFile = zip.file(sheetPath);
  if (!sheetFile) throw new Error(`ไม่พบ ${sheetPath} ในเทมเพลต`);
  let sheetXml = await sheetFile.async('string');

  const drawingPath = 'xl/drawings/drawing1.xml';
  const drawingFile = zip.file(drawingPath);
  if (!drawingFile) throw new Error(`ไม่พบ ${drawingPath} ในเทมเพลต`);
  let drawingXml = await drawingFile.async('string');

  // Header
  sheetXml = setCellInSheetXml(sheetXml, 'D5', courseTitle);
  sheetXml = setCellInSheetXml(sheetXml, 'Q5', department);
  contentSubItems.slice(0, 4).forEach((desc, i) => {
    if (desc) sheetXml = setCellInSheetXml(sheetXml, `D${7 + i}`, desc);
  });
  if (trainingDate) sheetXml = setCellInSheetXml(sheetXml, 'C11', toThaiBuddhistDate(trainingDate));
  if (timeFrom) sheetXml = setCellInSheetXml(sheetXml, 'L11', timeFrom);
  if (timeTo) sheetXml = setCellInSheetXml(sheetXml, 'P11', timeTo);
  if (instructorName1) sheetXml = setCellInSheetXml(sheetXml, 'F12', instructorName1);
  if (instructorName2) sheetXml = setCellInSheetXml(sheetXml, 'M12', instructorName2);
  if (location) sheetXml = setCellInSheetXml(sheetXml, 'E13', location);
  if (changeReasonCategory === 'OTHER' && changeReasonOtherDetail) {
    sheetXml = setCellInSheetXml(sheetXml, 'R15', changeReasonOtherDetail);
  }

  // 11 one-per-form choices — filled shapes, not cell text (see REASON_RECT etc above).
  drawingXml = fillCheckboxInDrawingXml(drawingXml, REASON_RECT[changeReasonCategory].col, REASON_RECT[changeReasonCategory].row);
  drawingXml = fillCheckboxInDrawingXml(
    drawingXml,
    EVAL_METHOD_RECT_B[evaluationMethod].col,
    EVAL_METHOD_RECT_B[evaluationMethod].row
  );
  const attachmentKey = hasAttachment ? 'true' : 'false';
  drawingXml = fillCheckboxInDrawingXml(drawingXml, ATTACHMENT_RECT_B[attachmentKey].col, ATTACHMENT_RECT_B[attachmentKey].row);

  // Trainee rows — never write column A (sequence 1-10 is pre-printed)
  const rowsToWrite = participants.slice(0, FHR004B_ROW_CAPACITY);
  rowsToWrite.forEach((p, i) => {
    const r = DATA_START_ROW_B + i;
    const rowIdx0 = r - 1;
    sheetXml = setCellInSheetXml(sheetXml, `B${r}`, p.empCode);
    sheetXml = setCellInSheetXml(sheetXml, `D${r}`, p.employeeName);
    if (p.position) sheetXml = setCellInSheetXml(sheetXml, `I${r}`, p.position);
    if (p.preScore !== undefined) sheetXml = setCellInSheetXml(sheetXml, `K${r}`, p.preScore);
    if (p.postScore !== undefined) sheetXml = setCellInSheetXml(sheetXml, `L${r}`, p.postScore);

    // เกณฑ์ผ่านการประเมิน — fixed reference icon at the 75% passing bar
    drawingXml = removeDecorativeAutoShape(drawingXml, PASS_CRITERIA_COL_IDX_B, rowIdx0);
    drawingXml = addImageOneCellAnchor(drawingXml, PASS_CRITERIA_COL_IDX_B, rowIdx0, RESULT_ICON_RID_B[75], RESULT_ICON_SIZE_B);

    // ผลการประเมิน — this trainee's actual instructor score
    const iconRid = RESULT_ICON_RID_B[p.instructorScorePercent];
    if (iconRid) {
      drawingXml = removeDecorativeAutoShape(drawingXml, RESULT_COL_IDX_B, rowIdx0);
      drawingXml = addImageOneCellAnchor(drawingXml, RESULT_COL_IDX_B, rowIdx0, iconRid, RESULT_ICON_SIZE_B);
      sheetXml = clearCellInSheetXml(sheetXml, `R${r}`);
    }
    if (p.remarks) sheetXml = setCellInSheetXml(sheetXml, `T${r}`, p.remarks);
  });

  // Rows 43-46 (the 4 approval-signature blocks) are intentionally left
  // untouched — signed by hand on the printed page, same convention as
  // Form A's rows 45-48.

  zip.file(sheetPath, sheetXml);
  zip.file(drawingPath, drawingXml);

  const safeDate = new Date().toISOString().split('T')[0];
  const fileName = `F-HR-004B_${safeDate}.xlsx`;

  const outputBuffer = await zip.generateAsync({ type: 'arraybuffer' });
  await saveBlobFile(outputBuffer, fileName);

  return {
    exportedCount: rowsToWrite.length,
    truncatedCount: Math.max(0, participants.length - FHR004B_ROW_CAPACITY),
  };
}
