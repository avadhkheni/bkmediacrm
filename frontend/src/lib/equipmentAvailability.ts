/** Shared stock helpers for quotation / usage forms (not warehouse item creation). */

export type StockEquipment = {
  name: string;
  brand?: string | null;
  model?: string | null;
  availableQuantity?: number;
  totalQuantity?: number;
  ratePerDay?: number;
  pricingDay?: number;
};

export type LedStockRow = {
  ledType: string;
  companyName?: string;
  cabinetHeightMm?: number;
  cabinetWidthMm?: number;
  availableQuantity?: number;
  totalCabinets?: number;
  pricingSqft?: number;
};

export type QuotationLineItem = {
  category?: string;
  equipmentType?: string;
  ledType?: string;
  nos?: number;
  widthFt?: number;
  heightFt?: number;
  isVendorRented?: boolean;
  placeName?: string;
  days?: number;
  ratePerDay?: number;
  ratePerSqft?: number;
  totalAmount?: number;
};

export function isVendorSourcedItem(item: QuotationLineItem): boolean {
  if (item.isVendorRented) return true;
  const label = (item.equipmentType || item.ledType || '').trim();
  return label.startsWith('[VENDOR:');
}

export function formatEquipmentLabel(eq: StockEquipment): string {
  const brand = eq.brand?.trim() || '';
  const model = eq.model?.trim() || '';
  if (brand || model) {
    return `${eq.name} (${brand} ${model})`.replace(/\s+/g, ' ').trim();
  }
  return eq.name;
}

export function matchVideoSoundEquipment(
  options: StockEquipment[],
  equipmentType: string
): StockEquipment | null {
  if (!equipmentType?.trim()) return null;
  const exact = options.find((eq) => formatEquipmentLabel(eq) === equipmentType);
  if (exact) return exact;
  const lower = equipmentType.toLowerCase();
  return (
    options.find((eq) => eq.name?.toLowerCase() === lower) ||
    options.find((eq) => formatEquipmentLabel(eq).toLowerCase() === lower) ||
    null
  );
}

export function getEquipmentAvailableUnits(eq: StockEquipment): number {
  if (eq.availableQuantity !== undefined && eq.availableQuantity !== null) {
    return Math.max(0, Number(eq.availableQuantity));
  }
  return Math.max(0, Number(eq.totalQuantity ?? 0));
}

/** LED sq ft available in warehouse for a type (in-house stock only). */
export function getLedAvailableSqft(ledStock: LedStockRow[], ledType: string): number {
  const type = ledType?.replace(/^\[VENDOR:[^\]]+\]\s*/i, '').trim();
  if (!type) return 0;
  const stocksOfType = ledStock.filter(
    (s) => s.ledType?.toLowerCase() === type.toLowerCase()
  );
  return stocksOfType.reduce((acc, s) => {
    const heightM = (s.cabinetHeightMm || 500) / 1000;
    const widthM = (s.cabinetWidthMm || 500) / 1000;
    const qty =
      s.availableQuantity !== undefined ? s.availableQuantity : s.totalCabinets ?? 0;
    const sqFt = heightM * widthM * qty * 10.7639;
    return acc + sqFt;
  }, 0);
}

/** Units of the same equipment already requested on other rows in this form. */
export function sumUnitsUsedElsewhere(
  items: QuotationLineItem[],
  rowIndex: number,
  equipmentKey: string,
  category: 'VIDEO' | 'SOUND'
): number {
  return items.reduce((sum, item, i) => {
    if (i === rowIndex) return sum;
    const cat = (item.category || '').toUpperCase();
    if (cat !== category) return sum;
    if (isVendorSourcedItem(item)) return sum;
    if ((item.equipmentType || '').trim() !== equipmentKey.trim()) return sum;
    return sum + Math.max(1, Number(item.nos || 1));
  }, 0);
}

/** Sq ft of same LED type on other rows (in-house only). */
export function sumLedSqftUsedElsewhere(
  items: QuotationLineItem[],
  rowIndex: number,
  ledType: string
): number {
  const typeNorm = ledType?.replace(/^\[VENDOR:[^\]]+\]\s*/i, '').trim().toLowerCase();
  if (!typeNorm) return 0;
  return items.reduce((sum, item, i) => {
    if (i === rowIndex) return sum;
    if ((item.category || '').toUpperCase() !== 'LED') return sum;
    if (isVendorSourcedItem(item)) return sum;
    const t = (item.ledType || '')
      .replace(/^\[VENDOR:[^\]]+\]\s*/i, '')
      .trim()
      .toLowerCase();
    if (t !== typeNorm) return sum;
    const w = Number(item.widthFt || 0);
    const h = Number(item.heightFt || 0);
    const n = Math.max(1, Number(item.nos || 1));
    return sum + w * h * n;
  }, 0);
}

export function getMaxQuantityForRow(
  items: QuotationLineItem[],
  rowIndex: number,
  item: QuotationLineItem,
  ctx: {
    videoEquipOptions: StockEquipment[];
    soundEquipOptions: StockEquipment[];
    ledStockOptions: LedStockRow[];
  }
): number | null {
  if (isVendorSourcedItem(item)) return null;

  const category = (item.category || '').toUpperCase();

  if (category === 'VIDEO' || category === 'SOUND') {
    const key = (item.equipmentType || '').trim();
    if (!key) return null;
    const options =
      category === 'VIDEO' ? ctx.videoEquipOptions : ctx.soundEquipOptions;
    const stock = matchVideoSoundEquipment(options, key);
    if (!stock) return null;
    const available = getEquipmentAvailableUnits(stock);
    const usedElsewhere = sumUnitsUsedElsewhere(
      items,
      rowIndex,
      key,
      category as 'VIDEO' | 'SOUND'
    );
    return Math.max(0, available - usedElsewhere);
  }

  if (category === 'LED') {
    const ledType = (item.ledType || '').trim();
    if (!ledType) return null;
    const w = Number(item.widthFt || 0);
    const h = Number(item.heightFt || 0);
    if (w <= 0 || h <= 0) return null;
    const sqftPerUnit = w * h;
    const totalAvail = getLedAvailableSqft(ctx.ledStockOptions, ledType);
    const usedElsewhere = sumLedSqftUsedElsewhere(items, rowIndex, ledType);
    const remainingSqft = Math.max(0, totalAvail - usedElsewhere);
    return Math.max(0, Math.floor(remainingSqft / sqftPerUnit));
  }

  return null;
}

export type StockHint =
  | { kind: 'vendor'; message: string }
  | { kind: 'custom'; message: string }
  | { kind: 'ok'; message: string }
  | { kind: 'warning'; message: string }
  | { kind: 'shortage'; message: string };

export function getStockHintForRow(
  items: QuotationLineItem[],
  rowIndex: number,
  item: QuotationLineItem,
  ctx: {
    videoEquipOptions: StockEquipment[];
    soundEquipOptions: StockEquipment[];
    ledStockOptions: LedStockRow[];
  }
): StockHint | null {
  if (isVendorSourcedItem(item)) {
    return {
      kind: 'vendor',
      message:
        'Outside vendor supply — not limited by in-house warehouse quantity.',
    };
  }

  const category = (item.category || '').toUpperCase();

  if (category === 'VIDEO' || category === 'SOUND') {
    const key = (item.equipmentType || '').trim();
    if (!key) return null;
    const options =
      category === 'VIDEO' ? ctx.videoEquipOptions : ctx.soundEquipOptions;
    const stock = matchVideoSoundEquipment(options, key);
    if (!stock) {
      return {
        kind: 'custom',
        message:
          'Custom item — confirm in-house stock or use “Rent from Outside Supplier”.',
      };
    }
    const maxQty = getMaxQuantityForRow(items, rowIndex, item, ctx);
    const requested = Math.max(1, Number(item.nos || 1));
    const avail = getEquipmentAvailableUnits(stock);
    if (maxQty !== null && maxQty <= 0) {
      return {
        kind: 'shortage',
        message: `Out of stock: “${stock.name}” has 0 units available. Enable vendor rental or choose another item.`,
      };
    }
    if (maxQty !== null && requested > maxQty) {
      return {
        kind: 'shortage',
        message: `Only ${maxQty} unit(s) of “${stock.name}” available in-house (${avail} total in warehouse). Reduce quantity or use a vendor.`,
      };
    }
    return {
      kind: 'ok',
      message: `In-house stock: ${avail} unit(s) available — you can use up to ${maxQty ?? avail} on this line.`,
    };
  }

  if (category === 'LED') {
    const ledType = (item.ledType || '').trim();
    if (!ledType) return null;
    const w = Number(item.widthFt || 0);
    const h = Number(item.heightFt || 0);
    const n = Math.max(1, Number(item.nos || 1));
    if (w <= 0 || h <= 0) return null;
    const requestedSqft = w * h * n;
    const availableSqft = getLedAvailableSqft(ctx.ledStockOptions, ledType);
    const usedElsewhere = sumLedSqftUsedElsewhere(items, rowIndex, ledType);
    const remaining = Math.max(0, availableSqft - usedElsewhere);
    const cleanType = ledType.replace(/^\[VENDOR:[^\]]+\]\s*/i, '');

    if (requestedSqft > remaining) {
      const shortage = requestedSqft - remaining;
      return {
        kind: 'shortage',
        message: `Short by ${Math.round(shortage)} sq ft of ${cleanType} in-house (${Math.round(remaining)} sq ft left for this line). Use a vendor for the rest.`,
      };
    }
    return {
      kind: 'ok',
      message: `In-house LED: ${Math.round(remaining)} sq ft of ${cleanType} available for this line.`,
    };
  }

  return null;
}

export function validateQuotationStock(
  items: QuotationLineItem[],
  ctx: {
    videoEquipOptions: StockEquipment[];
    soundEquipOptions: StockEquipment[];
    ledStockOptions: LedStockRow[];
  }
): string | null {
  for (let i = 0; i < items.length; i++) {
    const hint = getStockHintForRow(items, i, items[i], ctx);
    if (hint?.kind === 'shortage') return hint.message;
    const maxQty = getMaxQuantityForRow(items, i, items[i], ctx);
    if (maxQty !== null && maxQty <= 0 && !isVendorSourcedItem(items[i])) {
      return `Line ${i + 1}: no in-house stock available. Use vendor rental or change the item.`;
    }
    const cat = (items[i].category || '').toUpperCase();
    if ((cat === 'VIDEO' || cat === 'SOUND') && maxQty !== null) {
      const req = Math.max(1, Number(items[i].nos || 1));
      if (req > maxQty) {
        return `Line ${i + 1}: quantity ${req} exceeds available in-house stock (${maxQty}).`;
      }
    }
  }
  return null;
}
