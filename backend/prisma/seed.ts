import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
