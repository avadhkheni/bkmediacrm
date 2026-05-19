type QuotationItemInput = {
  category?: string;
  equipmentType?: string;
  ledType?: string;
  nos?: number;
  isVendorRented?: boolean;
  days?: number;
  ratePerDay?: number;
  heightFt?: number;
  widthFt?: number;
  ratePerSqft?: number;
  rate?: number;
  serviceName?: string;
  description?: string;
  quantity?: number;
};

export function isVendorItem(item: QuotationItemInput): boolean {
  if (item.isVendorRented) return true;
  const label = (item.equipmentType || item.ledType || '').trim();
  return label.startsWith('[VENDOR:');
}

function lineUnits(item: QuotationItemInput): number {
  return Math.max(1, Number(item.nos || 1));
}

export function buildSourcingLogLine(items: QuotationItemInput[]): string {
  let inHouseLines = 0;
  let vendorLines = 0;
  let inHouseUnits = 0;
  let vendorUnits = 0;
  const vendorNames = new Set<string>();

  for (const item of items) {
    const units = lineUnits(item);
    if (isVendorItem(item)) {
      vendorLines += 1;
      vendorUnits += units;
      const label = item.equipmentType || item.ledType || '';
      const match = label.match(/^\[VENDOR:\s*([^\]]+)\]/i);
      if (match) vendorNames.add(match[1].trim());
    } else {
      inHouseLines += 1;
      inHouseUnits += units;
    }
  }

  if (inHouseLines + vendorLines === 0) return '';

  const vendorPart =
    vendorUnits > 0
      ? `${vendorUnits} unit(s) outside vendor (${vendorLines} line(s)${
          vendorNames.size ? `: ${[...vendorNames].join(', ')}` : ''
        })`
      : '0 outside vendor';

  return `[SOURCING] ${inHouseUnits} unit(s) BK Media warehouse (${inHouseLines} line(s)); ${vendorPart}.`;
}

export function mergeQuotationNotes(
  userNotes: string | undefined | null,
  items: QuotationItemInput[]
): string {
  const sourcingLine = buildSourcingLogLine(items);
  const cleaned = (userNotes || '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('[SOURCING]'))
    .join('\n')
    .trim();
  if (!sourcingLine) return cleaned;
  return cleaned ? `${sourcingLine}\n\n${cleaned}` : sourcingLine;
}

export function itemTotalAmount(item: QuotationItemInput, category: string): number {
  const cat = (item.category || category || '').toUpperCase();
  const nos = Math.max(1, Number(item.nos || 1));
  const days = Math.max(1, Number(item.days || 1));

  if (cat === 'VIDEO' || cat === 'SOUND') {
    return Number(item.ratePerDay) * days * nos;
  }
  if (cat === 'LED') {
    const sqft =
      Number(item.heightFt || 0) * Number(item.widthFt || 0) * nos;
    return sqft * Number(item.ratePerSqft) * days;
  }
  if (cat === 'OFFICE') {
    return Number(item.ratePerDay || (item as any).rate || 0) * nos * days;
  }
  return 0;
}
