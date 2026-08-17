import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
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
    { empCode: 'EMP-1001', name: 'นาย สมศักดิ์ ใจดี', department: 'FMG-A', position: 'พนักงานฝ่ายผลิต', startingDate: new Date('2026-05-01') },
    { empCode: 'EMP-1002', name: 'น.ส. สมหญิง จริงใจ', department: 'QA/QC', position: 'เจ้าหน้าที่ตรวจสอบคุณภาพ', startingDate: new Date('2026-06-01') },
    { empCode: 'EMP-1003', name: 'นาย วิชัย ขยันยิ่ง', department: 'HR&GA IT', position: 'เจ้าหน้าที่ไอที', startingDate: new Date('2026-06-15') },
    { empCode: 'EMP-1004', name: 'น.ส. อารียา สุขสันต์', department: 'HR&GA', position: 'เจ้าหน้าที่ฝ่ายบุคคล', startingDate: new Date('2026-07-01') },
    { empCode: 'EMP-1005', name: 'นาย สมลักษณ์ คำทราย', department: 'FMG-A', position: 'พนักงานคลังสินค้า', startingDate: new Date('2026-07-15') },
  ];

  for (const emp of sampleEmployees) {
    await prisma.employee.upsert({
      where: { empCode: emp.empCode },
      update: {},
      create: {
        ...emp,
        status: 'PROBATION',
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
