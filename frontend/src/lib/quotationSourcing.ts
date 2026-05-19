import { isVendorSourcedItem, QuotationLineItem } from '@/lib/equipmentAvailability';

export type SourcingSummary = {
  inHouseLines: number;
  vendorLines: number;
  inHouseUnits: number;
  vendorUnits: number;
  totalUnits: number;
  vendorNames: string[];
};

export function isVendorQuotationLine(item: QuotationLineItem): boolean {
  return isVendorSourcedItem(item);
}

export function lineUnitCount(item: QuotationLineItem): number {
  return Math.max(1, Number(item.nos || 1));
}

export function summarizeQuotationSourcing(items: QuotationLineItem[]): SourcingSummary {
  let inHouseLines = 0;
  let vendorLines = 0;
  let inHouseUnits = 0;
  let vendorUnits = 0;
  const vendorNames = new Set<string>();

  for (const item of items) {
    const units = lineUnitCount(item);
    if (isVendorQuotationLine(item)) {
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

  return {
    inHouseLines,
    vendorLines,
    inHouseUnits,
    vendorUnits,
    totalUnits: inHouseUnits + vendorUnits,
    vendorNames: [...vendorNames],
  };
}

export function buildSourcingLogLine(items: QuotationLineItem[]): string {
  const s = summarizeQuotationSourcing(items);
  if (s.totalUnits === 0) return '';
  const vendorPart =
    s.vendorUnits > 0
      ? `${s.vendorUnits} unit(s) outside vendor (${s.vendorLines} line(s)${
          s.vendorNames.length ? `: ${s.vendorNames.join(', ')}` : ''
        })`
      : '0 outside vendor';
  const inHousePart = `${s.inHouseUnits} unit(s) BK Media warehouse (${s.inHouseLines} line(s))`;
  return `[SOURCING] ${inHousePart}; ${vendorPart}.`;
}

export function mergeQuotationNotes(userNotes: string | undefined, items: QuotationLineItem[]): string {
  const sourcingLine = buildSourcingLogLine(items);
  const cleaned = (userNotes || '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('[SOURCING]'))
    .join('\n')
    .trim();
  if (!sourcingLine) return cleaned;
  return cleaned ? `${sourcingLine}\n\n${cleaned}` : sourcingLine;
}

export function parseSourcingFromNotes(notes?: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/\[SOURCING\]\s*([\s\S]+?)(?:\n\n|$)/);
  return match ? match[1].trim() : null;
}

/** Flatten saved quotation DB shape into line items for display/history. */
export function flattenQuotationItems(quotation: any): QuotationLineItem[] {
  const lines: QuotationLineItem[] = [];
  (quotation.videoQuotationItems || []).forEach((it: any) => {
    lines.push({
      category: 'VIDEO',
      placeName: it.placeName,
      equipmentType: it.equipmentType,
      nos: it.nos || 1,
      days: it.days,
      isVendorRented: (it.equipmentType || '').startsWith('[VENDOR:'),
    });
  });
  (quotation.soundQuotationItems || []).forEach((it: any) => {
    lines.push({
      category: 'SOUND',
      placeName: it.placeName,
      equipmentType: it.equipmentType,
      nos: it.nos || 1,
      days: it.days,
      isVendorRented: (it.equipmentType || '').startsWith('[VENDOR:'),
    });
  });
  (quotation.ledQuotationItems || []).forEach((it: any) => {
    lines.push({
      category: 'LED',
      placeName: it.placeName,
      ledType: it.ledType,
      nos: it.nos,
      days: it.days,
      isVendorRented: (it.ledType || '').startsWith('[VENDOR:'),
    });
  });
  (quotation.officeQuotationItems || []).forEach((it: any) => {
    lines.push({
      category: 'OFFICE',
      equipmentType: it.serviceName,
      nos: it.quantity,
      days: it.days,
      isVendorRented: (it.serviceName || '').startsWith('[VENDOR:'),
    });
  });
  return lines;
}

export function getSupplySourceLabel(item: QuotationLineItem): string {
  return isVendorQuotationLine(item) ? 'Outside vendor' : 'BK Media (in-house)';
}
