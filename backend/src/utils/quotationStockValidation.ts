import { prisma } from './prisma';

type QuotationItemInput = {
  category?: string;
  equipmentType?: string;
  ledType?: string;
  nos?: number;
  widthFt?: number;
  heightFt?: number;
  isVendorRented?: boolean;
};

function isVendorItem(item: QuotationItemInput): boolean {
  if (item.isVendorRented) return true;
  const label = (item.equipmentType || item.ledType || '').trim();
  return label.startsWith('[VENDOR:');
}

function formatLabel(eq: { name: string; brand?: string | null; model?: string | null }) {
  const brand = eq.brand?.trim() || '';
  const model = eq.model?.trim() || '';
  if (brand || model) return `${eq.name} (${brand} ${model})`.replace(/\s+/g, ' ').trim();
  return eq.name;
}

export async function validateQuotationItemsStock(
  items: QuotationItemInput[]
): Promise<string | null> {
  const [videoEquip, soundEquip, ledStock] = await Promise.all([
    prisma.videoEquipment.findMany({ where: { deletedAt: null } }),
    prisma.soundEquipment.findMany({ where: { deletedAt: null } }),
    prisma.ledStock.findMany({ where: { deletedAt: null } }),
  ]);

  const usageByEquip = new Map<string, number>();
  const usageSqftByLed = new Map<string, number>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (isVendorItem(item)) continue;

    const category = (item.category || '').toUpperCase();

    if (category === 'VIDEO' || category === 'SOUND') {
      const key = (item.equipmentType || '').trim();
      if (!key) continue;
      const pool = category === 'VIDEO' ? videoEquip : soundEquip;
      const match =
        pool.find((e) => formatLabel(e) === key) ||
        pool.find((e) => e.name.toLowerCase() === key.toLowerCase());
      if (!match) continue;

      const qty = Math.max(1, Number(item.nos || 1));
      const avail =
        match.availableQuantity !== undefined
          ? Number(match.availableQuantity)
          : Number(match.totalQuantity ?? 0);
      const used = (usageByEquip.get(`${category}:${key}`) || 0) + qty;
      usageByEquip.set(`${category}:${key}`, used);

      if (used > avail) {
        return `Line ${i + 1}: requested ${used} unit(s) of "${match.name}" but only ${avail} available in warehouse. Use vendor rental or reduce quantity.`;
      }
    }

    if (category === 'LED') {
      const ledType = (item.ledType || '')
        .replace(/^\[VENDOR:[^\]]+\]\s*/i, '')
        .trim();
      if (!ledType) continue;
      const w = Number(item.widthFt || 0);
      const h = Number(item.heightFt || 0);
      const n = Math.max(1, Number(item.nos || 1));
      if (w <= 0 || h <= 0) continue;

      const requestedSqft = w * h * n;
      const stocks = ledStock.filter(
        (s) => s.ledType?.toLowerCase() === ledType.toLowerCase()
      );
      const availableSqft = stocks.reduce((acc, s) => {
        const heightM = (s.cabinetHeightMm || 500) / 1000;
        const widthM = (s.cabinetWidthMm || 500) / 1000;
        const qty =
          s.availableQuantity !== undefined
            ? Number(s.availableQuantity)
            : Number(s.totalCabinets ?? 0);
        return acc + heightM * widthM * qty * 10.7639;
      }, 0);

      const used = (usageSqftByLed.get(ledType.toLowerCase()) || 0) + requestedSqft;
      usageSqftByLed.set(ledType.toLowerCase(), used);

      if (used > availableSqft + 0.01) {
        return `Line ${i + 1}: requested ${Math.round(requestedSqft)} sq ft of ${ledType} but only ${Math.round(availableSqft)} sq ft available in-house. Use a vendor for the remainder.`;
      }
    }
  }

  return null;
}
