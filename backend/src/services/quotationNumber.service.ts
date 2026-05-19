import { prisma } from '../utils/prisma';

export async function generateQuotationNumber(date: Date = new Date()): Promise<string> {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  const isAfterMarch = date.getMonth() >= 3;
  const fy = isAfterMarch
    ? `${String(year).slice(2)}-${String(year + 1).slice(2)}`
    : `${String(year - 1).slice(2)}-${String(year).slice(2)}`;
    
  const fyStart = isAfterMarch
    ? new Date(year, 3, 1)
    : new Date(year - 1, 3, 1);
    
  const fyEnd = new Date(fyStart.getFullYear() + 1, 3, 1);
  
  const count = await prisma.quotation.count({
    where: { createdAt: { gte: fyStart, lt: fyEnd }, deletedAt: null }
  });
  
  return `BKM/${fy}/${month}/${String(count + 1).padStart(3, '0')}`;
}
