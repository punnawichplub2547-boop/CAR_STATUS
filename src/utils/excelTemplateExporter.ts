import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import type { Employee, SkillStandard, SkillEvaluation, EvaluationCycle } from '../types';

interface ExportOptions {
  employees: Employee[];
  standards: SkillStandard[];
  evaluations: SkillEvaluation[];
  department: string;
  cycle: EvaluationCycle;
  assessorName?: string;
  customEmployees?: Employee[];
}

export function formatSkillLevelWithIcon(level: number | null | undefined): string {
  if (level === null || level === undefined) return '-';
  if (level >= 100) return `● 100%`;
  if (level >= 75) return `◕ 75%`;
  if (level >= 50) return `◑ 50%`;
  if (level >= 25) return `◔ 25%`;
  return `○ 0%`;
}

export function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function setCellInSheetXml(xml: string, cellRef: string, textVal: string | number): string {
  const safeText = escapeXml(String(textVal));
  const pattern = new RegExp(`<c r="${cellRef}"(?:\\s+[^/>]*)?>.*?</c>|<c r="${cellRef}"(?:\\s+[^/>]*)?/>`, 's');
  const match = pattern.exec(xml);
  if (match) {
    const fullMatch = match[0];
    const sMatch = /\bs="([^"]*)"/.exec(fullMatch);
    const sAttr = sMatch ? ` s="${sMatch[1]}"` : '';
    const newCell = `<c r="${cellRef}"${sAttr} t="inlineStr"><is><t>${safeText}</t></is></c>`;
    return xml.slice(0, match.index) + newCell + xml.slice(match.index + fullMatch.length);
  }
  return xml;
}

export function clearCellInSheetXml(xml: string, cellRef: string): string {
  const pattern = new RegExp(`<c r="${cellRef}"(?:\\s+[^/>]*)?>.*?</c>|<c r="${cellRef}"(?:\\s+[^/>]*)?/>`, 's');
  const match = pattern.exec(xml);
  if (match) {
    const fullMatch = match[0];
    const sMatch = /\bs="([^"]*)"/.exec(fullMatch);
    const sAttr = sMatch ? ` s="${sMatch[1]}"` : '';
    const newCell = `<c r="${cellRef}"${sAttr}/>`;
    return xml.slice(0, match.index) + newCell + xml.slice(match.index + fullMatch.length);
  }
  return xml;
}

const circleRidMap: Record<number, string> = {
  0: 'rId_c0',
  25: 'rId_c25',
  50: 'rId_c50',
  75: 'rId_c75',
  100: 'rId_c100',
};

let anchorCounter = 9900;

// Unified Big 310274x310274 circle at perfect cell horizontal center (colOff=130000)
function addCircleOneCellAnchor(drawingXml: string, colIdx: number, rowIdx: number, level: number): string {
  anchorCounter++;
  const rId = circleRidMap[level] || circleRidMap[0];
  const anchorXml = `<xdr:oneCellAnchor>
  <xdr:from><xdr:col>${colIdx}</xdr:col><xdr:colOff>130000</xdr:colOff><xdr:row>${rowIdx}</xdr:row><xdr:rowOff>2000</xdr:rowOff></xdr:from>
  <xdr:ext cx="310274" cy="310274"/>
  <xdr:pic>
    <xdr:nvPicPr>
      <xdr:cNvPr id="${anchorCounter}" name="RatingCircle_${anchorCounter}"/>
      <xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr>
    </xdr:nvPicPr>
    <xdr:blipFill>
      <a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${rId}"/>
      <a:stretch><a:fillRect/></a:stretch>
    </xdr:blipFill>
    <xdr:spPr>
      <a:xfrm><a:off x="0" y="0"/><a:ext cx="310274" cy="310274"/></a:xfrm>
      <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
    </xdr:spPr>
  </xdr:pic>
  <xdr:clientData/>
</xdr:oneCellAnchor>`;

  return drawingXml.replace('</xdr:wsDr>', `${anchorXml}</xdr:wsDr>`);
}

export async function saveBlobFile(buffer: ArrayBuffer | Uint8Array, fileName: string): Promise<void> {
  const blob = new Blob([buffer as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'Excel Workbook (*.xlsx)',
            accept: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn('showSaveFilePicker fallback:', err);
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// F-HR-014 Rev.4 — capacity of one printed sheet
// ---------------------------------------------------------------------------
// Both numbers are dictated by the template, not by preference:
//  - 6 skill column groups: F / J / N / R / V / Z
//  - 20 employee rows: the merged pairs A14:A15 … A52:A53. Row 54 onward is
//    the legend / sign-off block, so writing past row 53 would overwrite the
//    footer of the form.
// Anything beyond either limit goes onto an extra sheet instead of being
// dropped silently.
export const FHR014_SKILLS_PER_SHEET = 6;
export const FHR014_EMPLOYEES_PER_SHEET = 20;

const FHR014_BASE_SHEET_NAME = 'F-HR-014 Rev.4';
const FHR014_PRINT_AREA = '$A$1:$AG$68';
const FHR014_FIRST_EMPLOYEE_ROW_INDEX = 13; // 0-based; row 14 in Excel

// Within one skill group the 4 columns are:
// Target#1 (+0) · Result#1 (+1) · Target#2 (+2) · Result#2 (+3)
const SKILL_COLS = [
  { textCol: 'F', colIdx: 5 },
  { textCol: 'J', colIdx: 9 },
  { textCol: 'N', colIdx: 13 },
  { textCol: 'R', colIdx: 17 },
  { textCol: 'V', colIdx: 21 },
  { textCol: 'Z', colIdx: 25 },
];

function chunkList<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

interface ChunkInput {
  chunkEmployees: Employee[];
  chunkStandards: SkillStandard[];
  employeeOffset: number;
  skillOffset: number;
  evaluations: SkillEvaluation[];
  department: string;
  cycle: EvaluationCycle;
  assessorName: string;
}

// Fills one copy of the template sheet (+ its drawing) with a single
// employee × skill chunk. Numbering stays global so "7. Skill" on sheet 2
// keeps counting on from sheet 1.
function buildChunkSheet(
  baseSheetXml: string,
  baseDrawingXml: string,
  {
    chunkEmployees,
    chunkStandards,
    employeeOffset,
    skillOffset,
    evaluations,
    department,
    cycle,
    assessorName,
  }: ChunkInput
): { sheetXml: string; drawingXml: string } {
  let sheetXml = baseSheetXml;
  let drawingXml = baseDrawingXml;

  // Header text cells — repeated on every sheet so each printed page stands alone
  sheetXml = setCellInSheetXml(sheetXml, 'C4', assessorName);
  sheetXml = setCellInSheetXml(sheetXml, 'C7', assessorName);
  sheetXml = setCellInSheetXml(sheetXml, 'H5', 'ผู้จัดการ');
  sheetXml = setCellInSheetXml(sheetXml, 'H8', 'ผู้จัดการ');
  sheetXml = setCellInSheetXml(sheetXml, 'J5', `DEPT......${department}………  SECTION…............-................`);
  sheetXml = setCellInSheetXml(sheetXml, 'AD6', cycle);

  // Numbered skill titles in row 10
  chunkStandards.forEach((std, sIdx) => {
    const colInfo = SKILL_COLS[sIdx];
    sheetXml = setCellInSheetXml(sheetXml, `${colInfo.textCol}10`, `${skillOffset + sIdx + 1}. ${std.skillName}`);
  });

  chunkEmployees.forEach((emp, empIdx) => {
    const rowIdxZero = FHR014_FIRST_EMPLOYEE_ROW_INDEX + empIdx * 2; // rows 14, 16, 18…
    const cellRowNumber = rowIdxZero + 1;

    sheetXml = setCellInSheetXml(sheetXml, `A${cellRowNumber}`, employeeOffset + empIdx + 1);
    sheetXml = setCellInSheetXml(sheetXml, `B${cellRowNumber}`, emp.empCode);
    sheetXml = setCellInSheetXml(sheetXml, `C${cellRowNumber}`, emp.name);
    sheetXml = setCellInSheetXml(sheetXml, `E${cellRowNumber}`, emp.position);

    chunkStandards.forEach((std, sIdx) => {
      const colInfo = SKILL_COLS[sIdx];
      const targetColIdx = colInfo.colIdx;
      const res1ColIdx = colInfo.colIdx + 1;
      const target2ColIdx = colInfo.colIdx + 2;
      const res2ColIdx = colInfo.colIdx + 3;

      const evAttempt1 = evaluations.find(
        (ev) =>
          ev.employeeId === emp.id &&
          ev.skillName === std.skillName &&
          ev.cycle === cycle &&
          (ev.attemptNumber === 1 || !ev.attemptNumber)
      );

      const evAttempt2 = evaluations.find(
        (ev) =>
          ev.employeeId === emp.id &&
          ev.skillName === std.skillName &&
          ev.cycle === cycle &&
          ev.attemptNumber === 2
      );

      // Targets are pre-set skill standards — drawn whether or not the
      // employee has been scored yet
      if (std.targetLevel !== null && std.targetLevel !== undefined) {
        drawingXml = addCircleOneCellAnchor(drawingXml, targetColIdx, rowIdxZero, std.targetLevel);
        drawingXml = addCircleOneCellAnchor(drawingXml, target2ColIdx, rowIdxZero, std.targetLevel);
      }

      // Results fall back to a 0% circle until actually scored
      drawingXml = addCircleOneCellAnchor(drawingXml, res1ColIdx, rowIdxZero, evAttempt1?.resultLevel ?? 0);
      drawingXml = addCircleOneCellAnchor(drawingXml, res2ColIdx, rowIdxZero, evAttempt2?.resultLevel ?? 0);
    });
  });

  return { sheetXml, drawingXml };
}

export interface ExportFHR014Result {
  employeeCount: number;
  skillCount: number;
  sheetNames: string[];
}

export async function exportExactFHR014Template({
  employees,
  standards,
  evaluations,
  department,
  cycle,
  assessorName = 'นางสาว สมหญิง ใจดี (Admin/Supervisor)',
  customEmployees,
}: ExportOptions): Promise<ExportFHR014Result> {
  const deptEmployees = customEmployees || employees.filter((e) => e.department === department);
  const deptStandards = standards.filter((s) => s.department === department);

  anchorCounter = 9900; // keep drawing ids deterministic per export

  const safeDept = department.replace(/[^a-zA-Z0-9-_]/g, '_');
  const safeCycle = String(cycle).replace(/[^a-zA-Z0-9-_]/g, '_');
  const fileName = `F-HR-014_Skill_Matrix_Rev4_${safeDept}_${safeCycle}.xlsx`;

  // 1. Fetch pristine original template file
  const tplResp = await fetch('/templates/F-HR-014_Rev4_Template.xlsx');
  if (!tplResp.ok) throw new Error(`Template load error: ${tplResp.status}`);
  const templateBuffer = await tplResp.arrayBuffer();

  const zip = await JSZip.loadAsync(templateBuffer);

  // 2. Fetch and replace official CAR Logo
  try {
    const logoResp = await fetch('/templates/CARLOGO.png');
    if (logoResp.ok) {
      const logoBuf = await logoResp.arrayBuffer();
      zip.file('xl/media/image1.png', logoBuf);
    }
  } catch {
    // Keep embedded logo
  }

  // 3. Ensure drawing rels carry rIds for all 5 PNG circle images
  const drawingRelsPath = 'xl/drawings/_rels/drawing2.xml.rels';
  let baseDrawingRels = await zip.file(drawingRelsPath)?.async('string');
  if (baseDrawingRels) {
    const requiredRels = [
      '<Relationship Id="rId_c0" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image2.png"/>',
      '<Relationship Id="rId_c25" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image4.png"/>',
      '<Relationship Id="rId_c50" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image5.png"/>',
      '<Relationship Id="rId_c75" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image6.png"/>',
      '<Relationship Id="rId_c100" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image3.png"/>',
    ];
    requiredRels.forEach((rel) => {
      if (!baseDrawingRels!.includes(rel)) {
        baseDrawingRels = baseDrawingRels!.replace('</Relationships>', `${rel}</Relationships>`);
      }
    });
    zip.file(drawingRelsPath, baseDrawingRels);
  }

  // 4. Load the pristine sheet + drawing that every chunk is stamped from
  const baseSheetPath = 'xl/worksheets/sheet2.xml';
  const baseDrawingPath = 'xl/drawings/drawing2.xml';

  const sheetFile = zip.file(baseSheetPath);
  const drawingFile = zip.file(baseDrawingPath);
  if (!sheetFile || !drawingFile) {
    throw new Error('Sheet2 or Drawing2 XML missing in template');
  }

  const baseSheetXml: string = await sheetFile.async('string');
  let baseDrawingXml: string = await drawingFile.async('string');

  // Remove top cropping on CAR logo image
  baseDrawingXml = baseDrawingXml.replace('<a:srcRect r="6885"/>', '<a:srcRect/>');

  // Remove Group 980 twoCellAnchor (background dotted circle shape group across rows 14-52)
  const patternGroup980 = /<xdr:twoCellAnchor[^>]*>(?:(?!<\/xdr:twoCellAnchor>).)*?Group 980(?:(?!<\/xdr:twoCellAnchor>).)*?<\/xdr:twoCellAnchor>/s;
  baseDrawingXml = baseDrawingXml.replace(patternGroup980, '');

  const baseSheetRels = (await zip.file('xl/worksheets/_rels/sheet2.xml.rels')?.async('string')) ?? '';

  // 5. Split into sheet-sized chunks — skills first, then employees, so the
  // printed order reads "Topic 1-6 for everyone, then Topic 7-12".
  const skillChunks = chunkList(deptStandards, FHR014_SKILLS_PER_SHEET);
  const employeeChunks = chunkList(deptEmployees, FHR014_EMPLOYEES_PER_SHEET);
  const multiSkill = skillChunks.length > 1;
  const multiEmployee = employeeChunks.length > 1;

  const plan: Array<ChunkInput & { sheetName: string }> = [];
  skillChunks.forEach((chunkStandards, sChunkIdx) => {
    const skillOffset = sChunkIdx * FHR014_SKILLS_PER_SHEET;
    employeeChunks.forEach((chunkEmployees, eChunkIdx) => {
      const employeeOffset = eChunkIdx * FHR014_EMPLOYEES_PER_SHEET;

      const namePieces: string[] = [];
      if (multiSkill) namePieces.push(`Topic ${skillOffset + 1}-${skillOffset + chunkStandards.length}`);
      if (multiEmployee) namePieces.push(`Emp ${employeeOffset + 1}-${employeeOffset + chunkEmployees.length}`);

      plan.push({
        chunkEmployees,
        chunkStandards,
        employeeOffset,
        skillOffset,
        evaluations,
        department,
        cycle,
        assessorName,
        sheetName: namePieces.length ? namePieces.join(' ') : FHR014_BASE_SHEET_NAME,
      });
    });
  });

  // 6. Chunk 0 reuses the template's own sheet2/drawing2 (keeps its rels,
  // printer settings and print area). Extra chunks get cloned parts.
  let workbookXml = (await zip.file('xl/workbook.xml')?.async('string')) ?? '';
  let workbookRels = (await zip.file('xl/_rels/workbook.xml.rels')?.async('string')) ?? '';
  let contentTypes = (await zip.file('[Content_Types].xml')?.async('string')) ?? '';

  plan.forEach((chunk, idx) => {
    const { sheetXml, drawingXml } = buildChunkSheet(baseSheetXml, baseDrawingXml, chunk);

    if (idx === 0) {
      zip.file(baseSheetPath, sheetXml);
      zip.file(baseDrawingPath, drawingXml);

      if (chunk.sheetName !== FHR014_BASE_SHEET_NAME) {
        // Rename the template sheet and the print-area defined name that
        // refers to it by name.
        workbookXml = workbookXml.replace(
          `name="${FHR014_BASE_SHEET_NAME}"`,
          `name="${escapeXml(chunk.sheetName)}"`
        );
        workbookXml = workbookXml.split(`'${FHR014_BASE_SHEET_NAME}'!`).join(`'${chunk.sheetName}'!`);
      }
      return;
    }

    // Cloned parts are numbered from sheet3/drawing3 onward (1 and 2 are taken)
    const partNo = idx + 2;
    const sheetPath = `xl/worksheets/sheet${partNo}.xml`;
    const drawingPath = `xl/drawings/drawing${partNo}.xml`;

    zip.file(sheetPath, sheetXml);
    zip.file(drawingPath, drawingXml);
    zip.file(
      `xl/worksheets/_rels/sheet${partNo}.xml.rels`,
      baseSheetRels.replace('../drawings/drawing2.xml', `../drawings/drawing${partNo}.xml`)
    );
    if (baseDrawingRels) {
      zip.file(`xl/drawings/_rels/drawing${partNo}.xml.rels`, baseDrawingRels);
    }

    const relId = `rIdChunk${partNo}`;
    workbookRels = workbookRels.replace(
      '</Relationships>',
      `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${partNo}.xml"/></Relationships>`
    );
    workbookXml = workbookXml.replace(
      '</sheets>',
      `<sheet name="${escapeXml(chunk.sheetName)}" sheetId="${1000 + partNo}" r:id="${relId}"/></sheets>`
    );
    // localSheetId is the 0-based position in <sheets>; the template ships 2
    // sheets, so cloned ones start at index 2.
    workbookXml = workbookXml.replace(
      '</definedNames>',
      `<definedName name="_xlnm.Print_Area" localSheetId="${idx + 1}">'${chunk.sheetName}'!${FHR014_PRINT_AREA}</definedName></definedNames>`
    );
    contentTypes = contentTypes.replace(
      '</Types>',
      `<Override PartName="/${sheetPath}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `<Override PartName="/${drawingPath}" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>`
    );
  });

  zip.file('xl/workbook.xml', workbookXml);
  zip.file('xl/_rels/workbook.xml.rels', workbookRels);
  zip.file('[Content_Types].xml', contentTypes);

  const outputBuffer = await zip.generateAsync({ type: 'arraybuffer' });
  await saveBlobFile(outputBuffer, fileName);

  return {
    employeeCount: deptEmployees.length,
    skillCount: deptStandards.length,
    sheetNames: plan.map((c) => c.sheetName),
  };
}

// Accepts either a SheetJS workbook (what AuditReportExporter builds) or an
// ExcelJS-style one. Anything else is a programming error and must not fail
// silently — a download button that quietly does nothing is worse than a throw.
export async function downloadExcelWorkbook(workbook: any, fileName: string): Promise<void> {
  if (workbook && workbook.xlsx && typeof workbook.xlsx.writeBuffer === 'function') {
    const buf = await workbook.xlsx.writeBuffer();
    await saveBlobFile(buf, fileName);
    return;
  }

  if (workbook && Array.isArray(workbook.SheetNames) && workbook.Sheets) {
    const buf = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    await saveBlobFile(buf, fileName);
    return;
  }

  throw new Error('ไม่รู้จักรูปแบบ workbook ที่ส่งมา — export ไม่สำเร็จ');
}
