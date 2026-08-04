import JSZip from 'jszip';
import { setCellInSheetXml, clearCellInSheetXml, saveBlobFile } from './excelTemplateExporter';

export type OrientationCourseCategory = 'REGULATION' | 'SAFETY';

export interface OrientationAttendee {
  empCode: string;
  name: string;
  department: string;
  position: string;
}

interface ExportOrientationOptions {
  category: OrientationCourseCategory;
  trainingDate: string; // YYYY-MM-DD
  timeRange: string;
  morningTime: string;
  afternoonTime: string;
  instructor: string;
  location: string;
  attendees: OrientationAttendee[];
}

// Cell addresses inside F-HR-002_Rev6_Template.xlsx — mapped from the real
// company template (see backend/README.md for how it was sanitized before
// being committed). Sheet1 = REGULATION course, Sheet2 = SAFETY course; the
// row offset between them comes from the template itself, not our choice.
const SHEET_CONFIG: Record<OrientationCourseCategory, {
  file: string;
  dateCell: string;
  timeCell: string;
  instructorCell: string;
  locationCell: string;
  dataStartRow: number;
  dataEndRow: number;
}> = {
  REGULATION: {
    file: 'xl/worksheets/sheet1.xml',
    dateCell: 'A9',
    timeCell: 'F9',
    instructorCell: 'B10',
    locationCell: 'F10',
    dataStartRow: 14,
    dataEndRow: 35,
  },
  SAFETY: {
    file: 'xl/worksheets/sheet2.xml',
    dateCell: 'A10',
    timeCell: 'F10',
    instructorCell: 'B11',
    locationCell: 'F11',
    dataStartRow: 15,
    dataEndRow: 36,
  },
};

export const ORIENTATION_ROW_CAPACITY = SHEET_CONFIG.REGULATION.dataEndRow - SHEET_CONFIG.REGULATION.dataStartRow + 1;

function toThaiBuddhistDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y + 543}`;
}

export interface ExportOrientationResult {
  exportedCount: number;
  truncatedCount: number;
}

export async function exportOrientationFHR002({
  category,
  trainingDate,
  timeRange,
  morningTime,
  afternoonTime,
  instructor,
  location,
  attendees,
}: ExportOrientationOptions): Promise<ExportOrientationResult> {
  const config = SHEET_CONFIG[category];

  const tplResp = await fetch('/templates/F-HR-002_Rev6_Template.xlsx');
  if (!tplResp.ok) throw new Error(`โหลดเทมเพลตไม่สำเร็จ (HTTP ${tplResp.status})`);
  const templateBuffer = await tplResp.arrayBuffer();

  const zip = await JSZip.loadAsync(templateBuffer);
  const sheetFile = zip.file(config.file);
  if (!sheetFile) throw new Error(`ไม่พบ ${config.file} ในเทมเพลต`);
  let sheetXml = await sheetFile.async('string');

  sheetXml = setCellInSheetXml(sheetXml, config.dateCell, `วันที่อบรม :  ${toThaiBuddhistDate(trainingDate)}`);
  sheetXml = setCellInSheetXml(sheetXml, config.timeCell, timeRange);
  sheetXml = setCellInSheetXml(sheetXml, config.instructorCell, instructor);
  sheetXml = setCellInSheetXml(sheetXml, config.locationCell, location);

  const rowsAvailable = config.dataEndRow - config.dataStartRow + 1;
  const rowsToWrite = attendees.slice(0, rowsAvailable);

  for (let i = 0; i < rowsAvailable; i++) {
    const row = config.dataStartRow + i;
    const attendee = rowsToWrite[i];
    if (attendee) {
      sheetXml = setCellInSheetXml(sheetXml, `A${row}`, i + 1);
      sheetXml = setCellInSheetXml(sheetXml, `B${row}`, attendee.department);
      sheetXml = setCellInSheetXml(sheetXml, `C${row}`, attendee.empCode);
      sheetXml = setCellInSheetXml(sheetXml, `D${row}`, attendee.name);
      sheetXml = setCellInSheetXml(sheetXml, `F${row}`, attendee.position);
      sheetXml = setCellInSheetXml(sheetXml, `G${row}`, morningTime);
      sheetXml = setCellInSheetXml(sheetXml, `I${row}`, afternoonTime);
      // H/J (ลงชื่อ เช้า/บ่าย) stay blank on purpose — filled by hand when
      // the printed sheet is signed.
    } else {
      (['A', 'B', 'C', 'D', 'F', 'G', 'I'] as const).forEach((col) => {
        sheetXml = clearCellInSheetXml(sheetXml, `${col}${row}`);
      });
    }
  }

  zip.file(config.file, sheetXml);

  const safeDate = trainingDate.replace(/[^a-zA-Z0-9-_]/g, '_');
  const fileName = `F-HR-002_${category}_${safeDate}.xlsx`;

  const outputBuffer = await zip.generateAsync({ type: 'arraybuffer' });
  await saveBlobFile(outputBuffer, fileName);

  return {
    exportedCount: rowsToWrite.length,
    truncatedCount: Math.max(0, attendees.length - rowsAvailable),
  };
}
