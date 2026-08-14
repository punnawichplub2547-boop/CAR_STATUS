import JSZip from 'jszip';
import { setCellInSheetXml, saveBlobFile } from './excelTemplateExporter';
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

// The 3 one-per-form choices aren't cells with checkboxes — the tick mark is
// drawn as a tiny shape in drawing1.xml, not addressable via cell edits. We
// mark the chosen option by prefixing its own label cell text instead,
// reusing setCellInSheetXml as-is (no new capability needed).
const PURPOSE_LABELS: Record<OjtPurposeType, { cell: string; text: string }> = {
  NEW_HIRE: { cell: 'F7', text: 'พนักงานเข้าใหม่' },
  TRANSFER: { cell: 'K7', text: 'โยกย้าย/สับเปลี่ยนตำแหน่งงาน' },
};

const EVAL_METHOD_LABELS: Record<OjtEvaluationMethod, { cell: string; text: string }> = {
  PRE_POST_TEST: { cell: 'F8', text: 'แบบทดสอบ ก่อน-หลังอบรม' },
  PRACTICAL: { cell: 'K8', text: 'ทดสอบการปฏิบัติจริง' },
  Q_AND_A: { cell: 'Q8', text: 'แจ้งให้ทราบและใช้การซักถาม' },
};

const ATTACHMENT_LABELS: Record<'true' | 'false', { cell: string; text: string }> = {
  true: { cell: 'F9', text: 'มีเอกสารแนบ' },
  false: { cell: 'K9', text: 'ไม่มีเอกสารแนบ' },
};

function toThaiBuddhistDate(isoDate?: string): string {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y + 543}`;
}

function markChoice(
  sheetXml: string,
  options: { cell: string; text: string }[],
  selectedCell: string
): string {
  let xml = sheetXml;
  options.forEach((opt) => {
    const mark = opt.cell === selectedCell ? '☑ ' : '☐ ';
    xml = setCellInSheetXml(xml, opt.cell, `${mark}${opt.text}`);
  });
  return xml;
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

  // Header
  sheetXml = setCellInSheetXml(sheetXml, 'C5', employeeName);
  sheetXml = setCellInSheetXml(sheetXml, 'K5', empCode);
  sheetXml = setCellInSheetXml(sheetXml, 'P5', position);
  sheetXml = setCellInSheetXml(sheetXml, 'D6', department);
  sheetXml = setCellInSheetXml(sheetXml, 'K6', toThaiBuddhistDate(startingDate));

  // 3 one-per-form choices
  sheetXml = markChoice(sheetXml, Object.values(PURPOSE_LABELS), PURPOSE_LABELS[purposeType].cell);
  sheetXml = markChoice(sheetXml, Object.values(EVAL_METHOD_LABELS), EVAL_METHOD_LABELS[evaluationMethod].cell);
  sheetXml = markChoice(
    sheetXml,
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
    if (item.resultPercent !== undefined) sheetXml = setCellInSheetXml(sheetXml, `R${r}`, `${item.resultPercent}%`);
    if (item.remark) sheetXml = setCellInSheetXml(sheetXml, `U${r}`, item.remark);
  });

  // Rows 45-48 (the 4 approval-signature blocks) are intentionally left
  // untouched — signed by hand on the printed page, same convention as
  // F-HR-002's H/J signature columns.

  zip.file(sheetPath, sheetXml);

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
