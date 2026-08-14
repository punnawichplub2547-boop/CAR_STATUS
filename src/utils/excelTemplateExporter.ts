import JSZip from 'jszip';
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

// Some templates (e.g. F-HR-004A's 3 one-per-form choices) draw their
// checkboxes as empty "Rectangle" shapes in the sheet's drawing XML rather
// than as cell content — there's no cell to write a ☑/☐ character into, and
// doing so anyway just draws a second, unrelated checkbox glyph next to the
// real (still empty) one. This fills the matching rectangle shape solid
// black instead, so exactly one box ends up looking checked. Matched by the
// shape's anchor position: col/row are 0-indexed drawing-XML coordinates,
// i.e. one column left of and on the same row as the label cell it marks.
export function fillCheckboxInDrawingXml(drawingXml: string, colIdx: number, rowIdx: number): string {
  const anchorPattern = /<xdr:twoCellAnchor(?:\s+[^>]*)?>.*?<\/xdr:twoCellAnchor>/gs;
  return drawingXml.replace(anchorPattern, (anchor) => {
    if (!anchor.includes('name="Rectangle')) return anchor;
    const fromMatch = /<xdr:from><xdr:col>(\d+)<\/xdr:col>[^<]*<xdr:colOff>\d+<\/xdr:colOff><xdr:row>(\d+)<\/xdr:row>/.exec(anchor);
    if (!fromMatch) return anchor;
    if (Number(fromMatch[1]) !== colIdx || Number(fromMatch[2]) !== rowIdx) return anchor;
    if (anchor.includes('<a:solidFill>')) return anchor; // already filled — don't double-inject
    return anchor.replace('</a:prstGeom>', '</a:prstGeom><a:solidFill><a:srgbClr val="000000"/></a:solidFill>');
  });
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

// Generic version of addCircleOneCellAnchor for exporters that reuse a
// template's own already-embedded images (referenced by their existing
// rId) rather than a purpose-built rIdMap of freshly-added ones — e.g.
// F-HR-004A's legend icons, which the exported score column overlays
// reuse as-is. Same anchorCounter, so ids stay unique across every
// exporter's calls within one generated file.
export function addImageOneCellAnchor(
  drawingXml: string,
  colIdx: number,
  rowIdx: number,
  rId: string,
  size: { cx: number; cy: number; colOff?: number; rowOff?: number }
): string {
  anchorCounter++;
  const colOff = size.colOff ?? 0;
  const rowOff = size.rowOff ?? 0;
  const anchorXml = `<xdr:oneCellAnchor>
  <xdr:from><xdr:col>${colIdx}</xdr:col><xdr:colOff>${colOff}</xdr:colOff><xdr:row>${rowIdx}</xdr:row><xdr:rowOff>${rowOff}</xdr:rowOff></xdr:from>
  <xdr:ext cx="${size.cx}" cy="${size.cy}"/>
  <xdr:pic>
    <xdr:nvPicPr>
      <xdr:cNvPr id="${anchorCounter}" name="Icon_${anchorCounter}"/>
      <xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr>
    </xdr:nvPicPr>
    <xdr:blipFill>
      <a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${rId}"/>
      <a:stretch><a:fillRect/></a:stretch>
    </xdr:blipFill>
    <xdr:spPr>
      <a:xfrm><a:off x="0" y="0"/><a:ext cx="${size.cx}" cy="${size.cy}"/></a:xfrm>
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

export async function exportExactFHR014Template({
  employees,
  standards,
  evaluations,
  department,
  cycle,
  assessorName = 'นางสาว สมหญิง ใจดี (Admin/Supervisor)',
  customEmployees,
}: ExportOptions): Promise<void> {
  const deptEmployees = customEmployees || employees.filter((e) => e.department === department);
  const deptStandards = standards.filter((s) => s.department === department);

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

  // 3. Ensure drawing2.xml.rels has rIds for all 5 PNG circle images
  const drawingRelsPath = 'xl/drawings/_rels/drawing2.xml.rels';
  let relsXml = await zip.file(drawingRelsPath)?.async('string');
  if (relsXml) {
    const requiredRels = [
      '<Relationship Id="rId_c0" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image2.png"/>',
      '<Relationship Id="rId_c25" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image4.png"/>',
      '<Relationship Id="rId_c50" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image5.png"/>',
      '<Relationship Id="rId_c75" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image6.png"/>',
      '<Relationship Id="rId_c100" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image3.png"/>',
    ];
    requiredRels.forEach((rel) => {
      if (!relsXml!.includes(rel)) {
        relsXml = relsXml!.replace('</Relationships>', `${rel}</Relationships>`);
      }
    });
    zip.file(drawingRelsPath, relsXml);
  }

  // 4. Load sheet2.xml (F-HR-014 Rev.4) & drawing2.xml
  const sheetPath = 'xl/worksheets/sheet2.xml';
  const drawingPath = 'xl/drawings/drawing2.xml';

  const sheetFile = zip.file(sheetPath);
  const drawingFile = zip.file(drawingPath);

  if (!sheetFile || !drawingFile) {
    throw new Error('Sheet2 or Drawing2 XML missing in template');
  }

  let sheetXml: string = await sheetFile.async('string');
  let drawingXml: string = await drawingFile.async('string');

  // Remove top cropping on CAR logo image
  drawingXml = drawingXml.replace('<a:srcRect r="6885"/>', '<a:srcRect/>');

  // Remove Group 980 twoCellAnchor (background dotted circle shape group across rows 14-52)
  const patternGroup980 = /<xdr:twoCellAnchor[^>]*>(?:(?!<\/xdr:twoCellAnchor>).)*?Group 980(?:(?!<\/xdr:twoCellAnchor>).)*?<\/xdr:twoCellAnchor>/s;
  drawingXml = drawingXml.replace(patternGroup980, '');

  // 5. Populate Header Text Cells
  sheetXml = setCellInSheetXml(sheetXml, 'C4', assessorName);
  sheetXml = setCellInSheetXml(sheetXml, 'C7', assessorName);
  sheetXml = setCellInSheetXml(sheetXml, 'H5', 'ผู้จัดการ');
  sheetXml = setCellInSheetXml(sheetXml, 'H8', 'ผู้จัดการ');
  sheetXml = setCellInSheetXml(sheetXml, 'J5', `DEPT......${department}………  SECTION…............-................`);
  sheetXml = setCellInSheetXml(sheetXml, 'AD6', cycle);

  // Skill Col Mapping in sheet (0-based col index for drawing anchors & col letter for cells)
  const skillCols = [
    { textCol: 'F', colIdx: 5 },
    { textCol: 'J', colIdx: 9 },
    { textCol: 'N', colIdx: 13 },
    { textCol: 'R', colIdx: 17 },
    { textCol: 'V', colIdx: 21 },
    { textCol: 'Z', colIdx: 25 },
  ];

  // Numbered Skill Titles in Row 10
  deptStandards.slice(0, 6).forEach((std, sIdx) => {
    const colInfo = skillCols[sIdx];
    sheetXml = setCellInSheetXml(sheetXml, `${colInfo.textCol}10`, `${sIdx + 1}. ${std.skillName}`);
  });

  // Target and Result Col offsets for drawing anchors:
  // Target -> colIdx
  // Result 1 -> colIdx + 1
  // Result 2 -> colIdx + 3
  deptEmployees.forEach((emp, empIdx) => {
    const rowIdxZero = 13 + empIdx * 2; // 0-indexed row: Row 14 = 13, Row 16 = 15...
    const cellRowNumber = rowIdxZero + 1; // 1-indexed row number: 14, 16...

    sheetXml = setCellInSheetXml(sheetXml, `A${cellRowNumber}`, empIdx + 1);
    sheetXml = setCellInSheetXml(sheetXml, `B${cellRowNumber}`, emp.empCode);
    sheetXml = setCellInSheetXml(sheetXml, `C${cellRowNumber}`, emp.name);
    sheetXml = setCellInSheetXml(sheetXml, `E${cellRowNumber}`, emp.position);

    deptStandards.slice(0, 6).forEach((std, sIdx) => {
      const colInfo = skillCols[sIdx];
      const targetColIdx = colInfo.colIdx; // Col F = 5
      const res1ColIdx = colInfo.colIdx + 1; // Col G = 6
      const target2ColIdx = colInfo.colIdx + 2; // Col H = 7
      const res2ColIdx = colInfo.colIdx + 3; // Col I = 8

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

      // Unified Big 310274 Circle Image Drawing Anchor for Target 1 & Target 2
      // Targets are pre-set skill standards, independent of whether the employee has been scored yet
      if (std.targetLevel !== null && std.targetLevel !== undefined) {
        drawingXml = addCircleOneCellAnchor(drawingXml, targetColIdx, rowIdxZero, std.targetLevel);
        drawingXml = addCircleOneCellAnchor(drawingXml, target2ColIdx, rowIdxZero, std.targetLevel);
      }

      // Unified Big 310274 Circle Image Drawing Anchor for Attempt 1 Result (0-level circle until actually scored)
      const result1Level = evAttempt1?.resultLevel ?? 0;
      drawingXml = addCircleOneCellAnchor(drawingXml, res1ColIdx, rowIdxZero, result1Level);

      // Unified Big 310274 Circle Image Drawing Anchor for Attempt 2 Result (0-level circle until actually scored)
      const result2Level = evAttempt2?.resultLevel ?? 0;
      drawingXml = addCircleOneCellAnchor(drawingXml, res2ColIdx, rowIdxZero, result2Level);
    });
  });

  // Re-write updated XMLs back to zip
  zip.file(sheetPath, sheetXml);
  zip.file(drawingPath, drawingXml);

  // Generate output zip buffer
  const outputBuffer = await zip.generateAsync({ type: 'arraybuffer' });
  await saveBlobFile(outputBuffer, fileName);
}

export async function downloadExcelWorkbook(workbook: any, fileName: string): Promise<void> {
  if (workbook && workbook.xlsx && typeof workbook.xlsx.writeBuffer === 'function') {
    const buf = await workbook.xlsx.writeBuffer();
    await saveBlobFile(buf, fileName);
  }
}
