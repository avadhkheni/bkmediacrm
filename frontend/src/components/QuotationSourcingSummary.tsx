"use client";

import { Warehouse, Truck } from "lucide-react";
import { QuotationLineItem } from "@/lib/equipmentAvailability";
import { summarizeQuotationSourcing } from "@/lib/quotationSourcing";

type Props = {
  items: QuotationLineItem[];
};

export default function QuotationSourcingSummary({ items }: Props) {
  const s = summarizeQuotationSourcing(items);
  if (s.totalUnits === 0) return null;

  return (
    <div className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 p-4">
      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
        Quotation mix (for your records)
      </p>
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 border border-emerald-200/50 font-medium">
          <Warehouse className="w-4 h-4" />
          {s.inHouseUnits} from BK Media ({s.inHouseLines} line{s.inHouseLines !== 1 ? "s" : ""})
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 px-3 py-1.5 border border-blue-200/50 font-medium">
          <Truck className="w-4 h-4" />
          {s.vendorUnits} from vendor ({s.vendorLines} line{s.vendorLines !== 1 ? "s" : ""})
          {s.vendorNames.length > 0 && (
            <span className="font-normal opacity-90"> — {s.vendorNames.join(", ")}</span>
          )}
        </span>
        <span className="text-slate-500 dark:text-slate-400 self-center text-xs">
          Total {s.totalUnits} units on this quotation
        </span>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
        Tip: add separate rows — e.g. one row for 3 qty in-house and another for 2 qty from a vendor.
        This is saved in workflow history when you generate the quotation.
      </p>
    </div>
  );
}
