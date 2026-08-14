import JSZip from 'jszip';
import { setCellInSheetXml, fillCheckboxInDrawingXml, addImageOneCellAnchor, clearCellInSheetXml, saveBlobFile } from './excelTemplateExporter';
import type { OjtPurposeType, OjtEvaluationMethod } from '../types';

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
  const [y, m, d] = isoDate.split('-').map(Number);
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
