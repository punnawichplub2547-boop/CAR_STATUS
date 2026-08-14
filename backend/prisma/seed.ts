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
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
