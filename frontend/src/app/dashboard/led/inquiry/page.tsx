"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { ArrowLeft, Truck, DollarSign, Trash2, ShieldAlert } from "lucide-react";

function LedInquiryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  
  const [inquiry, setInquiry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [dispatchBoxes, setDispatchBoxes] = useState<any[]>([]);
  const [ledStock, setLedStock] = useState<any[]>([]);
  const [arrangements, setArrangements] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  // Allocation Modal
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [allocForm, setAllocForm] = useState({ ledStockId: '', allocatedSqft: '' });
  const [allocSaving, setAllocSaving] = useState(false);

  // Dispatch Box Modal
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [boxForm, setBoxForm] = useState({ vehicleName: '', vehicleNumber: '', companyName: '', numBoxes: '', cabinetsPerBox: '' });
  const [boxSaving, setBoxSaving] = useState(false);

  // Arrangement Modal
  const [showArrangementModal, setShowArrangementModal] = useState(false);
  const [arrangementForm, setArrangementForm] = useState({
    vendorId: '',
    ledType: 'P2.5',
    sqftArranged: '',
    costRatePerSqftPerDay: '',
    days: '1'
  });
  const [arrangementSaving, setArrangementSaving] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      const [inquiryRes, allocRes, boxRes, stockRes, arrangementsRes, vendorsRes] = await Promise.all([
        api.get(`/inquiries/${id}`),
        api.get(`/led/allocations?inquiryId=${id}`),
        api.get(`/led/dispatch-boxes?inquiryId=${id}`),
        api.get(`/led/stock`),
        api.get(`/led/arrangements?inquiryId=${id}`),
        api.get(`/vendors?department=LED`)
      ]);
      setInquiry(inquiryRes.data);
      setAllocations(allocRes.data);
      setDispatchBoxes(boxRes.data);
      setLedStock(stockRes.data);
      setArrangements(arrangementsRes.data || []);
      const activeLedVendors = (vendorsRes.data || []).filter((v: any) => v.isActive);
      setVendors(activeLedVendors);
      if (activeLedVendors.length > 0) {
        setArrangementForm(p => ({ ...p, vendorId: activeLedVendors[0].id.toString() }));
      }
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

  const handleCreateArrangement = async () => {
    if (!arrangementForm.vendorId || !arrangementForm.sqftArranged || !arrangementForm.costRatePerSqftPerDay || !arrangementForm.days) {
      return alert('Please fill all required fields');
    }
    setArrangementSaving(true);
    try {
      await api.post('/led/arrangements', {
        inquiryId: Number(id),
        vendorId: Number(arrangementForm.vendorId),
        ledType: arrangementForm.ledType,
        sqftArranged: Number(arrangementForm.sqftArranged),
        costRatePerSqftPerDay: Number(arrangementForm.costRatePerSqftPerDay),
        days: Number(arrangementForm.days)
      });
      setShowArrangementModal(false);
      setArrangementForm(p => ({
        ...p,
        sqftArranged: '',
        costRatePerSqftPerDay: '',
        days: '1'
      }));
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating arrangement');
    } finally {
      setArrangementSaving(false);
    }
  };

  const handleDeleteArrangement = async (arrangementId: number) => {
    if (!confirm('Are you sure you want to delete this outsourcing arrangement?')) return;
    try {
      await api.delete(`/led/arrangements/${arrangementId}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete arrangement');
    }
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock from Warehouse */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-slate-800 dark:text-white">Stock from Warehouse</h3>
              <button onClick={() => setShowAllocModal(true)} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">+ Use Our Stock</button>
            </div>
            <div className="space-y-3">
              {allocations.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No items assigned from our warehouse yet.</p>
              ) : (
                allocations.map((a) => (
                  <div key={a.id} className="p-4 border border-slate-100 dark:border-slate-700 rounded-xl flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{a.ledStock?.companyName} {a.ledStock?.ledType}</p>
                      <p className="text-xs text-slate-500">{a.allocatedSqft} Sq Ft Used</p>
                    </div>
                    <span className="text-[10px] font-semibold tracking-wider text-green-600 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded border border-green-200/20 uppercase">OUR STOCK</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Rent from Vendors */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Truck className="w-4.5 h-4.5 text-purple-500" /> Rent from Vendors
              </h3>
              <button 
                onClick={() => setShowArrangementModal(true)} 
                className="text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-lg font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
              >
                + Rent Extra Stock
              </button>
            </div>
            <div className="space-y-3">
              {arrangements.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No outside rented panels logged yet.</p>
              ) : (
                arrangements.map((arr) => (
                  <div key={arr.id} className="p-4 border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white leading-tight">{arr.vendorName}</p>
                        <p className="text-[9px] uppercase font-semibold tracking-wider text-purple-600 dark:text-purple-400 mt-1 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded inline-block border border-purple-200/20">
                          {arr.ledType} Panel
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDeleteArrangement(arr.id)}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 text-[10px] font-semibold text-slate-500">
                      <div>
                        <p>AREA: <span className="text-slate-800 dark:text-white font-semibold">{arr.sqftArranged} sq ft</span></p>
                        <p>RENT DAYS: <span className="text-slate-800 dark:text-white font-semibold">{arr.days} days</span></p>
                      </div>
                      <div className="text-right">
                        <p>DAY RATE: <span className="text-slate-800 dark:text-white font-semibold">₹{arr.costRatePerSqftPerDay}/sq ft</span></p>
                        <p className="text-purple-600 dark:text-purple-400 font-semibold uppercase">Total Cost: ₹{arr.totalCost}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Dispatch Box Entries */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 dark:text-white">Dispatch Boxes</h3>
              <button onClick={() => setShowBoxModal(true)} className="text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors">+ Add Box</button>
            </div>
            <div className="space-y-3">
              {dispatchBoxes.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No dispatch entries yet.</p>
              ) : (
                dispatchBoxes.map((b) => (
                  <div key={b.id} className="p-4 border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/10">
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

      {/* Sourcing Modal */}
      {showArrangementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white leading-none">Rent Outside Stock</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Rent extra LED panels from outside suppliers to meet requirements.</p>
              </div>
              <button onClick={() => setShowArrangementModal(false)} className="text-slate-400 hover:text-slate-650 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-all">✕</button>
            </div>
            
            <div className="p-6 space-y-4">
              {vendors.length === 0 ? (
                <div className="flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/20">
                  <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">No outside LED suppliers found</p>
                    <p className="mt-0.5 leading-relaxed font-medium">Please add a supplier for the **LED Department** under Team -&gt; Suppliers first.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Choose Supplier *</label>
                    <select 
                      value={arrangementForm.vendorId} 
                      onChange={e => setArrangementForm(p => ({...p, vendorId: e.target.value}))} 
                      className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white outline-none"
                    >
                      {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.specialization || "LED Sourcing"})</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">LED Type *</label>
                      <select 
                        value={arrangementForm.ledType} 
                        onChange={e => setArrangementForm(p => ({...p, ledType: e.target.value}))} 
                        className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white outline-none"
                      >
                        <option>P2.5</option>
                        <option>P3.9</option>
                        <option>P4.8</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Rent Days *</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={arrangementForm.days} 
                        onChange={e => setArrangementForm(p => ({...p, days: e.target.value}))} 
                        className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white outline-none" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Total Sq Ft *</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={arrangementForm.sqftArranged} 
                        onChange={e => setArrangementForm(p => ({...p, sqftArranged: e.target.value}))} 
                        placeholder="e.g. 200" 
                        className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white outline-none" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Rate / Sq Ft / Day (₹) *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">₹</span>
                        <input 
                          type="number" 
                          min="0" 
                          value={arrangementForm.costRatePerSqftPerDay} 
                          onChange={e => setArrangementForm(p => ({...p, costRatePerSqftPerDay: e.target.value}))} 
                          placeholder="e.g. 150" 
                          className="w-full text-sm pl-7 pr-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-white outline-none font-semibold" 
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/10">
              <button onClick={() => setShowArrangementModal(false)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded-xl">Cancel</button>
              <button 
                onClick={handleCreateArrangement} 
                disabled={arrangementSaving || vendors.length === 0} 
                className="px-4 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl disabled:opacity-50 transition-all shadow-md"
              >
                {arrangementSaving ? 'Saving...' : 'Add Outsourced Rental'}
              </button>
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
