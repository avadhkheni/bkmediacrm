"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import PageSkeleton from "@/components/PageSkeleton";
import { 
  ArrowLeft, FileText, CheckCircle2, AlertCircle, 
  IndianRupee, CreditCard, Calendar, User, 
  Plus, History, Printer, Download
} from "lucide-react";
import { useUIStore } from "@/store/uiStore";

interface InvoiceDetail {
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
  quotation: {
    quotationNumber: string;
    items: any[];
  };
  inquiry: {
    eventName: string;
    client: {
      name: string;
      company: string;
      email: string;
      phone: string;
    };
  };
  payments: {
    id: number;
    amount: number;
    paymentType: string;
    paymentMethod: string;
    referenceNo: string;
    notes: string;
    createdAt: string;
  }[];
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const { addToast } = useUIStore();

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentType: "PARTIAL",
    paymentMethod: "CASH",
    referenceNo: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInvoiceDetails();
  }, [id]);

  const fetchInvoiceDetails = async () => {
    try {
      const { data } = await api.get(`/invoices/${id}`);
      setInvoice(data);
      // Pre-fill payment amount with balance
      setPaymentForm(prev => ({ ...prev, amount: data.balanceAmount.toString() }));
    } catch (error) {
      console.error("Failed to load invoice details", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/invoices/${id}/record-payment`, {
        ...paymentForm,
        amount: Number(paymentForm.amount)
      });
      addToast("Payment recorded successfully", "success");
      setShowPaymentModal(false);
      fetchInvoiceDetails();
    } catch (error: any) {
      addToast(error.response?.data?.message || "Failed to record payment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageSkeleton variant="page" />;
  if (!invoice) return <div className="p-8 text-center text-red-500">Invoice not found.</div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400";
      case "PARTIAL": return "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400";
      case "PAID": return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
      case "OVERDUE": return "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
      default: return "text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{invoice.invoiceNumber}</h2>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${getStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{invoice.inquiry.eventName}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button 
            onClick={() => setShowPaymentModal(true)}
            disabled={invoice.status === 'PAID'}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200 dark:shadow-none disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Amount</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white flex items-center">
                <IndianRupee className="w-5 h-5" /> {invoice.grossTotal.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Paid To Date</p>
              <p className="text-2xl font-black text-green-600 dark:text-green-400 flex items-center">
                <IndianRupee className="w-5 h-5" /> {(invoice.grossTotal - invoice.balanceAmount).toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Balance Due</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 flex items-center">
                <IndianRupee className="w-5 h-5" /> {invoice.balanceAmount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" /> Payment History
              </h3>
            </div>
            <div className="p-0">
              {invoice.payments.length === 0 ? (
                <div className="p-10 text-center text-slate-400">No payments recorded yet.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase">Date</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase">Method</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase">Reference</th>
                      <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {invoice.payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-300 font-medium">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-6">
                          <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider">{p.paymentMethod}</span>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-500">{p.referenceNo || "-"}</td>
                        <td className="py-4 px-6 text-sm font-bold text-green-600 text-right">₹{p.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Client Info</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Name</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{invoice.inquiry.client.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Company</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{invoice.inquiry.client.company || "-"}</p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 font-medium">
                  <CreditCard className="w-3 h-3" /> {invoice.inquiry.client.phone}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 font-medium">
                  <FileText className="w-3 h-3" /> {invoice.inquiry.client.email}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Dates</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 text-blue-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Issued On</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Due Date</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "No due date"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" /> Record Payment
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black text-xl">&times;</button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Amount (₹) *</label>
                <input 
                  type="number"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Method *</label>
                <select 
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Type *</label>
                <select 
                  value={paymentForm.paymentType}
                  onChange={(e) => setPaymentForm({...paymentForm, paymentType: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="PARTIAL">Partial</option>
                  <option value="FULL">Full Payment</option>
                  <option value="ADVANCE">Advance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Reference No. (Optional)</label>
                <input 
                  type="text"
                  value={paymentForm.referenceNo}
                  onChange={(e) => setPaymentForm({...paymentForm, referenceNo: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium outline-none"
                  placeholder="Txn ID, Cheque No, etc."
                />
              </div>
              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg disabled:opacity-70 mt-2"
              >
                {submitting ? "Recording..." : "Confirm & Save Payment"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
