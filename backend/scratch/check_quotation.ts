import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const quotation = await prisma.quotation.findUnique({
    where: { id: 1 }
  });
  console.log(JSON.stringify(quotation, null, 2));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
