"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { usePermission } from "@/lib/usePermission";
import { FileText, CheckCircle2, AlertCircle, IndianRupee, Download } from "lucide-react";
import { generateInvoicePDF } from "@/lib/pdfGenerator";

interface Invoice {
  id: number;
  invoiceNumber: string;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  grossTotal: number;
  advanceAmount: number;
  balanceAmount: number;
  status: string;
  dueDate: string;
  createdAt: string;
  quotation: any;
  inquiry: { eventName: string; client: { name: string } };
  payments: { amount: number; paymentMethod: string; receivedAt: string }[];
}

export default function InvoicesPage() {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data } = await api.get("/invoices");
      setInvoices(data);
    } catch (error) {
      console.error("Failed to load invoices", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "PARTIAL": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "PAID": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "OVERDUE": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const filtered = statusFilter === "ALL" ? invoices : invoices.filter(i => i.status === statusFilter);
  const totalOutstanding = invoices.reduce((sum, i) => sum + Number(i.balanceAmount || 0), 0);
  const totalCollected = invoices.reduce((sum, i) => {
    const payments = i.payments?.reduce((s, p) => s + Number(p.amount), 0) || 0;
    return sum + payments;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Invoices</h2>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Invoices</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{invoices.length}</p>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
            <FileText className="w-5 h-5" strokeWidth={1.75} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Collected</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">₹{totalCollected.toLocaleString()}</p>
          </div>
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-5 h-5" strokeWidth={1.75} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Outstanding</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">₹{totalOutstanding.toLocaleString()}</p>
          </div>
          <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-5 h-5" strokeWidth={1.75} />
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["ALL", "PENDING", "PARTIAL", "PAID", "OVERDUE"].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${statusFilter === s ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"}`}
          >
            {s === "ALL" ? "All" : s}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invoice #</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Event</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Gross Total</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Balance</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Due Date</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500">Loading invoices...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500">No invoices found.</td></tr>
              ) : (
                filtered.map(inv => (
                  <tr 
                    key={inv.id} 
                    onClick={() => router.push(`/dashboard/invoices/view?id=${inv.id}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-6 text-sm font-medium text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                    <td className="py-3 px-6 text-sm text-slate-700 dark:text-slate-300">{inv.inquiry?.eventName || "-"}</td>
                    <td className="py-3 px-6 text-sm text-slate-700 dark:text-slate-300">{inv.inquiry?.client?.name || "-"}</td>
                    <td className="py-3 px-6 text-sm text-right font-medium text-slate-900 dark:text-white">₹{Number(inv.grossTotal).toLocaleString()}</td>
                    <td className="py-3 px-6 text-sm text-right font-medium text-amber-600 dark:text-amber-400">₹{Number(inv.balanceAmount || 0).toLocaleString()}</td>
                    <td className="py-3 px-6 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inv.status)}`}>{inv.status}</span>
                    </td>
                    <td className="py-3 px-6 text-sm text-slate-700 dark:text-slate-300">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}</td>
                    <td className="py-3 px-6 text-right">
                      {hasPermission("FINANCE", "canRead") && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            generateInvoicePDF({
                              ...inv,
                              inquiry: inv.inquiry,
                              quotation: inv.quotation
                            });
                          }}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                          title="Download Invoice PDF"
                        >
                          <Download className="w-5 h-5" strokeWidth={1.75} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
