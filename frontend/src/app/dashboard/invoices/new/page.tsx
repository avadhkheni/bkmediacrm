"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { 
  ChevronLeft, 
  FileText, 
  Calendar, 
  IndianRupee, 
  Save, 
  AlertCircle,
  Clock
} from "lucide-react";

function NewInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quotationId = searchParams.get("quotationId");
  const inquiryId = searchParams.get("inquiryId");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quotation, setQuotation] = useState<any>(null);
  const [formData, setFormData] = useState({
    subtotal: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    grossTotal: 0,
    advanceAmount: 0,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 7 days
    notes: ""
  });

  useEffect(() => {
    if (!quotationId) return;

    const fetchQuotation = async () => {
      try {
        const { data } = await api.get(`/quotations/${quotationId}`);
        setQuotation(data);
        
        // Auto-fill form with quotation data
        const sub = Number(data.subtotal);
        const cgst = Number(data.cgstAmount || (sub * 0.09));
        const sgst = Number(data.sgstAmount || (sub * 0.09));
        const total = Number(data.totalAmount || (sub + cgst + sgst));

        setFormData(prev => ({
          ...prev,
          subtotal: sub,
          cgstAmount: cgst,
          sgstAmount: sgst,
          grossTotal: total,
        }));
      } catch (error) {
        console.error("Failed to fetch quotation", error);
        alert("Failed to load quotation details");
      } finally {
        setLoading(false);
      }
    };

    fetchQuotation();
  }, [quotationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/invoices", {
        inquiryId: Number(inquiryId),
        quotationId: Number(quotationId),
        subtotal: formData.subtotal,
        advanceAmount: formData.advanceAmount,
        dueDate: formData.dueDate,
        notes: formData.notes
      });
      alert("Invoice generated successfully!");
      router.push(`/dashboard/inquiries/details?id=${inquiryId}`);
    } catch (error: any) {
      console.error("Failed to create invoice", error);
      alert(error.response?.data?.message || "Failed to create invoice");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Loading quotation data...</div>;
  if (!quotation) return <div className="p-8 text-red-500">Quotation not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" strokeWidth={1.75} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Generate Manual Invoice</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Review and finalize invoice details for {quotation.quotationNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form id="invoice-form" onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Invoice Configuration
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Due Date
                  </label>
                  <input 
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5" /> Advance Amount
                  </label>
                  <input 
                    type="number"
                    min="0"
                    value={formData.advanceAmount}
                    onChange={(e) => setFormData({...formData, advanceAmount: Math.max(0, Number(e.target.value))})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Enter advance if any"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  Internal Notes
                </label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full h-24 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  placeholder="Any internal notes or specific instructions for the client..."
                />
              </div>
            </div>
          </form>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Generating this invoice will lock the quotation and mark the event as confirmed in the production schedule.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Summary
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹{formData.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">CGST (9%)</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹{formData.cgstAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">SGST (9%)</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹{formData.sgstAmount.toLocaleString()}</span>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <span className="font-bold text-slate-900 dark:text-white">Gross Total</span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400">₹{formData.grossTotal.toLocaleString()}</span>
              </div>
              
              {formData.advanceAmount > 0 && (
                <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-400 font-medium">
                  <span>Advance Paid</span>
                  <span>-₹{formData.advanceAmount.toLocaleString()}</span>
                </div>
              )}
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Balance Due</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  ₹{(formData.grossTotal - formData.advanceAmount).toLocaleString()}
                </span>
              </div>
            </div>

            <button 
              type="submit"
              form="invoice-form"
              disabled={saving}
              className="w-full mt-8 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
              {saving ? "Generating..." : <><Save className="w-5 h-5" /> Generate Invoice</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <NewInvoiceContent />
    </Suspense>
  );
}
