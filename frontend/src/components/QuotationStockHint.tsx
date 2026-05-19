"use client";

import {
  getStockHintForRow,
  QuotationLineItem,
  LedStockRow,
  StockEquipment,
} from "@/lib/equipmentAvailability";

type Props = {
  items: QuotationLineItem[];
  rowIndex: number;
  item: QuotationLineItem;
  videoEquipOptions: StockEquipment[];
  soundEquipOptions: StockEquipment[];
  ledStockOptions: LedStockRow[];
};

export default function QuotationStockHint({
  items,
  rowIndex,
  item,
  videoEquipOptions,
  soundEquipOptions,
  ledStockOptions,
}: Props) {
  const hint = getStockHintForRow(items, rowIndex, item, {
    videoEquipOptions,
    soundEquipOptions,
    ledStockOptions,
  });

  if (!hint || hint.kind === "vendor") return null;

  const styles: Record<string, string> = {
    custom:
      "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-slate-200/40",
    ok: "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border-green-200/30",
    warning:
      "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200/30",
    shortage:
      "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200/30",
  };

  return (
    <div className={`col-span-full w-full flex items-start gap-2 text-xs font-medium px-3 py-2 rounded-lg border mt-2 ${styles[hint.kind]}`}>
      <span>{hint.message}</span>
    </div>
  );
}
