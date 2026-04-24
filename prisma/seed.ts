
import { PrismaClient } from '@prisma/client';
import { DEFAULT_QUESTIONS } from '../constants';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');
  
  for (const q of DEFAULT_QUESTIONS) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {
        title: q.title,
        difficulty: q.difficulty,
        company: q.company,
        problemStatement: q.problemStatement,
      },
      create: {
        id: q.id,
        title: q.title,
        difficulty: q.difficulty,
        company: q.company,
        problemStatement: q.problemStatement,
      },
    });
  }
  
  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
