import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));

interface SkillStandardSeedRow {
  department: string;
  position: string;
  category: string;
  skillName: string;
  targetLevel: number;
}

async function main() {
  await prisma.trainingCourse.upsert({
    where: { code: 'F-HR-002-REG' },
    update: {},
    create: {
      code: 'F-HR-002-REG',
      title: 'กฎระเบียบข้อบังคับในการทำงาน',
      category: 'REGULATION',
    },
  });

  await prisma.trainingCourse.upsert({
    where: { code: 'F-HR-002-SAF' },
    update: {},
    create: {
      code: 'F-HR-002-SAF',
      title: 'ความปลอดภัย อาชีวอนามัย และสภาพแวดล้อมในการทำงาน',
      category: 'SAFETY',
    },
  });

  const skillStandardsSeed: SkillStandardSeedRow[] = JSON.parse(
    readFileSync(join(__dirname, 'skillStandardsSeed.json'), 'utf-8')
  );
  for (const s of skillStandardsSeed) {
    await prisma.skillStandard.upsert({
      where: {
        department_position_category_skillName: {
          department: s.department,
          position: s.position,
          category: s.category,
          skillName: s.skillName,
        },
      },
      update: {},
      create: s,
    });
  }

  const sampleEmployees = [
    {
      empCode: 'EMP-1001',
      name: 'นางสาว สมหญิง ใจดี',
      email: 'somying.j@example.com',
      department: 'HR&GA IT',
      section: 'IT / HR System',
      position: 'เจ้าหน้าที่ (IT SUPPORT)',
      startingDate: new Date('2015-03-12'),
      status: 'PERMANENT',
      role: 'ADMIN',
      plainPassword: 'admin1234',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    {
      empCode: 'EMP-1002',
      name: 'นางสาว วรรณา สุขเจริญ',
      email: 'wanna.s@example.com',
      department: 'HR&GA',
      section: 'Safety & Environment',
      position: 'เจ้าหน้าที่ (จป.อาวุโส)',
      startingDate: new Date('2022-06-15'),
      status: 'PERMANENT',
      role: 'HR',
      plainPassword: 'hr1234',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
    {
      empCode: 'EMP-1003',
      name: 'นาย ประเสริฐ ยิ้มแย้ม',
      email: 'prasert.y@example.com',
      department: 'FMG-A',
      section: 'FMG Production',
      position: 'พนักงานทั่วไป',
      startingDate: new Date('2026-06-22'),
      status: 'PROBATION',
      role: 'EMPLOYEE',
      plainPassword: 'emp1234',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      empCode: 'EMP-1004',
      name: 'นาย มานพ ตั้งมั่น',
      email: 'manop.t@example.com',
      department: 'FMG-A',
      section: 'FMG Management',
      position: 'ผู้จัดการแผนก (Section Manager)',
      startingDate: new Date('2018-01-10'),
      status: 'PERMANENT',
      role: 'SUPERVISOR',
      plainPassword: 'super1234',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      empCode: 'EMP-1005',
      name: 'นาย สมเกียรติ มั่นคง',
      email: 'somkiat.m@example.com',
      department: 'QA/QC',
      section: 'QA Inspection',
      position: 'พนักงานตรวจสอบคุณภาพอาวุโส',
      startingDate: new Date('2020-11-05'),
      status: 'PERMANENT',
      role: 'EMPLOYEE',
      plainPassword: 'emp1234',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  ];

  for (const emp of sampleEmployees) {
    const passwordHash = await bcrypt.hash(emp.plainPassword, 10);
    const { plainPassword: _, ...empData } = emp;

    await prisma.employee.upsert({
      where: { empCode: emp.empCode },
      update: {
        role: empData.role,
        name: empData.name,
        email: empData.email,
        department: empData.department,
        section: empData.section,
        position: empData.position,
        avatar: empData.avatar,
        passwordHash,
      },
      create: {
        ...empData,
        passwordHash,
        orientationPassed: false,
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
