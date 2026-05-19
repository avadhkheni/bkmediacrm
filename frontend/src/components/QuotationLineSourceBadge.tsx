"use client";

import { QuotationLineItem } from "@/lib/equipmentAvailability";
import { getSupplySourceLabel, isVendorQuotationLine } from "@/lib/quotationSourcing";

export default function QuotationLineSourceBadge({ item }: { item: QuotationLineItem }) {
  const vendor = isVendorQuotationLine(item);
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
        vendor
          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
      }`}
    >
      {getSupplySourceLabel(item)}
    </span>
  );
}
