import { Router, type Request, type Response } from 'express';
import { prisma } from '../db.js';

export const certificatesRouter = Router();

// GET /api/certificates
certificatesRouter.get('/certificates', async (req: Request, res: Response) => {
  try {
    const { empCode } = req.query;
    const where = empCode ? { empCode: String(empCode).toUpperCase() } : {};
    const certificates = await prisma.certificate.findMany({
      where,
      orderBy: { expiryDate: 'asc' },
    });
    res.json(certificates);
  } catch (err) {
    console.error('Fetch certificates error:', err);
    res.status(500).json({ error: 'ไม่สามารถโหลดข้อมูล Certificate ได้' });
  }
});

// POST /api/certificates
certificatesRouter.post('/certificates', async (req: Request, res: Response) => {
  try {
    const {
      empCode,
      employeeName,
      department,
      position,
      certName,
      issuer,
      issueDate,
      expiryDate,
      certNumber,
      attachmentUrl,
    } = req.body;

    if (!empCode || !employeeName || !certName || !issuer || !issueDate || !expiryDate) {
      res.status(400).json({ error: 'กรุณาระบุข้อมูลที่จำเป็น (empCode, employeeName, certName, issuer, issueDate, expiryDate)' });
      return;
    }

    const employee = await prisma.employee.findUnique({
      where: { empCode: String(empCode).toUpperCase() },
    });

    const newCert = await prisma.certificate.create({
      data: {
        employeeId: employee?.id ?? null,
        empCode: String(empCode).toUpperCase(),
        employeeName,
        department: department || employee?.department || '-',
        position: position || employee?.position || '-',
        certName,
        issuer,
        issueDate: new Date(issueDate),
        expiryDate: new Date(expiryDate),
        certNumber: certNumber || null,
        attachmentUrl: attachmentUrl || null,
      },
    });

    res.status(201).json(newCert);
  } catch (err) {
    console.error('Create certificate error:', err);
    res.status(500).json({ error: 'สร้าง Certificate ไม่สำเร็จ' });
  }
});

// PUT /api/certificates/:id
certificatesRouter.put('/certificates/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid certificate id' });
    return;
  }

  try {
    const {
      empCode,
      employeeName,
      department,
      position,
      certName,
      issuer,
      issueDate,
      expiryDate,
      certNumber,
      attachmentUrl,
    } = req.body;

    const employee = empCode
      ? await prisma.employee.findUnique({ where: { empCode: String(empCode).toUpperCase() } })
      : null;

    const updated = await prisma.certificate.update({
      where: { id },
      data: {
        ...(employee?.id ? { employeeId: employee.id } : {}),
        ...(empCode ? { empCode: String(empCode).toUpperCase() } : {}),
        ...(employeeName ? { employeeName } : {}),
        ...(department ? { department } : {}),
        ...(position ? { position } : {}),
        ...(certName ? { certName } : {}),
        ...(issuer ? { issuer } : {}),
        ...(issueDate ? { issueDate: new Date(issueDate) } : {}),
        ...(expiryDate ? { expiryDate: new Date(expiryDate) } : {}),
        ...(certNumber !== undefined ? { certNumber } : {}),
        ...(attachmentUrl !== undefined ? { attachmentUrl } : {}),
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Update certificate error:', err);
    res.status(404).json({ error: 'ไม่พบ Certificate หรืออัปเดตไม่สำเร็จ' });
  }
});

// DELETE /api/certificates/:id
certificatesRouter.delete('/certificates/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid certificate id' });
    return;
  }

  try {
    await prisma.certificate.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    console.error('Delete certificate error:', err);
    res.status(404).json({ error: 'ไม่พบ Certificate หรือลบไม่สำเร็จ' });
  }
});
