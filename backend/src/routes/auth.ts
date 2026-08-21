import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'car_hr_skill_matrix_jwt_secret_dev_key_2026';

// POST /api/auth/login
authRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ message: 'กรุณาระบุอีเมล/รหัสพนักงาน และรหัสผ่าน' });
      return;
    }

    const trimmedInput = String(identifier).trim();
    const isEmail = trimmedInput.includes('@');

    const employee = await prisma.employee.findFirst({
      where: isEmail
        ? { email: { equals: trimmedInput.toLowerCase() } }
        : { empCode: { equals: trimmedInput.toUpperCase() } },
    });

    if (!employee) {
      res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้งานนี้ในระบบ กรุณาตรวจสอบอีเมลหรือรหัสพนักงาน' });
      return;
    }

    // If employee has a passwordHash, verify it with bcrypt
    if (employee.passwordHash) {
      const isValid = await bcrypt.compare(String(password), employee.passwordHash);
      if (!isValid) {
        res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' });
        return;
      }
    } else {
      // Fallback for legacy accounts without hash: accept standard default passwords
      const defaultMatch =
        (employee.role === 'ADMIN' && password === 'admin1234') ||
        (employee.role === 'HR' && password === 'hr1234') ||
        (employee.role === 'SUPERVISOR' && password === 'super1234') ||
        (employee.role === 'EMPLOYEE' && password === 'emp1234');

      if (!defaultMatch) {
        res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' });
        return;
      }
    }

    const token = jwt.sign(
      {
        id: employee.id,
        empCode: employee.empCode,
        name: employee.name,
        role: employee.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...safeUser } = employee;

    res.json({
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบบนเซิร์ฟเวอร์' });
  }
});

// GET /api/auth/me
authRouter.get('/auth/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.header('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ (Missing or invalid token)' });
      return;
    }

    const token = authHeader.slice(7);
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      res.status(401).json({ message: 'Session หมดอายุหรือ Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่' });
      return;
    }

    const employee = await prisma.employee.findUnique({
      where: { id: payload.id },
    });

    if (!employee) {
      res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้งานในระบบ' });
      return;
    }

    const { passwordHash: _, ...safeUser } = employee;
    res.json({ user: safeUser });
  } catch (err) {
    console.error('Auth /me error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบ Session' });
  }
});

// POST /api/auth/change-password
authRouter.post('/auth/change-password', async (req: Request, res: Response) => {
  try {
    const authHeader = req.header('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อนเปลี่ยนรหัสผ่าน' });
      return;
    }

    const token = authHeader.slice(7);
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      res.status(401).json({ message: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่' });
      return;
    }

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      res.status(400).json({ message: 'กรุณาระบุรหัสผ่านเดิมและรหัสผ่านใหม่' });
      return;
    }

    if (String(newPassword).length < 4) {
      res.status(400).json({ message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร' });
      return;
    }

    const employee = await prisma.employee.findUnique({
      where: { id: payload.id },
    });

    if (!employee) {
      res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้งาน' });
      return;
    }

    // Verify old password
    if (employee.passwordHash) {
      const isValid = await bcrypt.compare(String(oldPassword), employee.passwordHash);
      if (!isValid) {
        res.status(400).json({ message: 'รหัสผ่านเดิมไม่ถูกต้อง' });
        return;
      }
    } else {
      const defaultMatch =
        (employee.role === 'ADMIN' && oldPassword === 'admin1234') ||
        (employee.role === 'HR' && oldPassword === 'hr1234') ||
        (employee.role === 'SUPERVISOR' && oldPassword === 'super1234') ||
        (employee.role === 'EMPLOYEE' && oldPassword === 'emp1234');
      if (!defaultMatch) {
        res.status(400).json({ message: 'รหัสผ่านเดิมไม่ถูกต้อง' });
        return;
      }
    }

    // Hash new password and save
    const newPasswordHash = await bcrypt.hash(String(newPassword), 10);
    await prisma.employee.update({
      where: { id: employee.id },
      data: { passwordHash: newPasswordHash },
    });

    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อย' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่านบนเซิร์ฟเวอร์' });
  }
});

