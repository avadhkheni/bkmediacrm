"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { ArrowLeft } from "lucide-react";

function LedInquiryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  
  const [inquiry, setInquiry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [dispatchBoxes, setDispatchBoxes] = useState<any[]>([]);
  const [ledStock, setLedStock] = useState<any[]>([]);

  // Allocation Modal
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [allocForm, setAllocForm] = useState({ ledStockId: '', allocatedSqft: '' });
  const [allocSaving, setAllocSaving] = useState(false);

  // Dispatch Box Modal
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [boxForm, setBoxForm] = useState({ vehicleName: '', vehicleNumber: '', companyName: '', numBoxes: '', cabinetsPerBox: '' });
  const [boxSaving, setBoxSaving] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      const [inquiryRes, allocRes, boxRes, stockRes] = await Promise.all([
        api.get(`/inquiries/${id}`),
        api.get(`/led/allocations?inquiryId=${id}`),
        api.get(`/led/dispatch-boxes?inquiryId=${id}`),
        api.get(`/led/stock`)
      ]);
      setInquiry(inquiryRes.data);
      setAllocations(allocRes.data);
      setDispatchBoxes(boxRes.data);
      setLedStock(stockRes.data);
    } catch (error) {
      console.error("Failed to load LED management data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAllocate = async () => {
    if (!allocForm.ledStockId || !allocForm.allocatedSqft) return alert('Please fill all fields');
    setAllocSaving(true);
    try {
      await api.post('/led/allocations', { inquiryId: Number(id), ledStockId: Number(allocForm.ledStockId), allocatedSqft: Number(allocForm.allocatedSqft) });
      setShowAllocModal(false);
      setAllocForm({ ledStockId: '', allocatedSqft: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating allocation');
    } finally { setAllocSaving(false); }
  };

  const handleAddBox = async () => {
    if (!boxForm.vehicleName || !boxForm.companyName || !boxForm.numBoxes || !boxForm.cabinetsPerBox) return alert('Please fill all required fields');
    setBoxSaving(true);
    try {
      await api.post('/led/dispatch-boxes', { inquiryId: Number(id), ...boxForm, numBoxes: Number(boxForm.numBoxes), cabinetsPerBox: Number(boxForm.cabinetsPerBox) });
      setShowBoxModal(false);
      setBoxForm({ vehicleName: '', vehicleNumber: '', companyName: '', numBoxes: '', cabinetsPerBox: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating dispatch box');
    } finally { setBoxSaving(false); }
  };

  if (!id) return <div className="p-8">No Inquiry ID provided.</div>;
  if (loading) return <div className="p-8">Loading LED management...</div>;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">LED Management: {inquiry?.inquiryNumber}</h2>
          <p className="text-sm text-slate-500">{inquiry?.eventName} @ {inquiry?.venue}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Warehouse Allocation */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white">Warehouse Allocation</h3>
            <button onClick={() => setShowAllocModal(true)} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">+ Allocate</button>
          </div>
          <div className="space-y-3">
            {allocations.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No stock allocated from warehouse.</p>
            ) : (
              allocations.map((a) => (
                <div key={a.id} className="p-4 border border-slate-100 dark:border-slate-700 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{a.ledStock?.companyName} {a.ledStock?.ledType}</p>
                    <p className="text-xs text-slate-500">{a.allocatedSqft} Sqft Allocated</p>
                  </div>
                  <span className="text-xs font-bold text-green-600">ALLOCATED</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dispatch Box Entries */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white">Dispatch Boxes</h3>
            <button onClick={() => setShowBoxModal(true)} className="text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors">+ Add Box</button>
          </div>
          <div className="space-y-3">
            {dispatchBoxes.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No dispatch entries yet.</p>
            ) : (
              dispatchBoxes.map((b) => (
                <div key={b.id} className="p-4 border border-slate-100 dark:border-slate-700 rounded-xl">
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{b.vehicleName} ({b.vehicleNumber})</p>
                    <p className="text-sm font-black text-blue-600">{b.numBoxes} Boxes</p>
                  </div>
                  <p className="text-xs text-slate-500">{b.companyName} • {b.totalCabinets} Cabinets</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Allocate Modal */}
      {showAllocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Allocate Stock</h3>
              <button onClick={() => setShowAllocModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">LED Stock</label>
                <select value={allocForm.ledStockId} onChange={e => setAllocForm(p => ({...p, ledStockId: e.target.value}))} className="w-full text-sm p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white">
                  <option value="">Select stock...</option>
                  {ledStock.map(s => <option key={s.id} value={s.id}>{s.companyName} — {s.ledType} ({s.totalCabinets} cabs)</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Allocated SqFt</label>
                <input type="number" value={allocForm.allocatedSqft} onChange={e => setAllocForm(p => ({...p, allocatedSqft: e.target.value}))} placeholder="e.g. 500" className="w-full text-sm p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button onClick={() => setShowAllocModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded-lg">Cancel</button>
              <button onClick={handleAllocate} disabled={allocSaving} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{allocSaving ? 'Saving...' : 'Allocate'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Box Modal */}
      {showBoxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Dispatch Box</h3>
              <button onClick={() => setShowBoxModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Vehicle Name *</label>
                <input value={boxForm.vehicleName} onChange={e => setBoxForm(p => ({...p, vehicleName: e.target.value}))} placeholder="e.g. Large Truck 1" className="w-full text-sm p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Vehicle Number</label>
                <input value={boxForm.vehicleNumber} onChange={e => setBoxForm(p => ({...p, vehicleNumber: e.target.value}))} placeholder="e.g. GJ-06-AB-0001" className="w-full text-sm p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Company Name *</label>
                <input value={boxForm.companyName} onChange={e => setBoxForm(p => ({...p, companyName: e.target.value}))} placeholder="e.g. Absen" className="w-full text-sm p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Num Boxes *</label>
                  <input type="number" value={boxForm.numBoxes} onChange={e => setBoxForm(p => ({...p, numBoxes: e.target.value}))} placeholder="e.g. 5" className="w-full text-sm p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Cabs/Box *</label>
                  <input type="number" value={boxForm.cabinetsPerBox} onChange={e => setBoxForm(p => ({...p, cabinetsPerBox: e.target.value}))} placeholder="e.g. 8" className="w-full text-sm p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button onClick={() => setShowBoxModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded-lg">Cancel</button>
              <button onClick={handleAddBox} disabled={boxSaving} className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-lg hover:bg-slate-700 disabled:opacity-50">{boxSaving ? 'Saving...' : 'Add Box'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LedInquiryManagementPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <LedInquiryContent />
    </Suspense>
  );
}
