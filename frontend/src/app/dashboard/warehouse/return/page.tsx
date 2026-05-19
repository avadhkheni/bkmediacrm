"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ClipboardX, PackageOpen } from "lucide-react";

export default function ReturnChecklistPage() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [videoStock, setVideoStock] = useState<any[]>([]);
  const [ledStock, setLedStock] = useState<any[]>([]);
  const [soundStock, setSoundStock] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    inquiryId: "",
    staffName: "",
    notes: "",
    penaltyAmount: "",
    equipmentType: "VIDEO",
    equipmentId: "",
    warehouseId: "",
    quantity: 1,
    isDamaged: false
  });

  const [checklist, setChecklist] = useState([
    { name: "Equipment Returned", isPassed: false, notes: "" },
    { name: "Accessories Returned", isPassed: false, notes: "" },
    { name: "No Damage Found", isPassed: false, notes: "" },
    { name: "No Missing Parts", isPassed: false, notes: "" },
    { name: "Working Condition Checked", isPassed: false, notes: "" },
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [whRes, vidRes, ledRes, sndRes, inqRes] = await Promise.all([
        api.get("/warehouse"),
        api.get("/video/equipment?status=IN_USE"),
        api.get("/led/stock?status=IN_USE"),
        api.get("/sound/equipment?status=IN_USE"),
        api.get("/inquiries")
      ]);
      setWarehouses(whRes.data || []);
      setVideoStock(vidRes.data || []);
      setLedStock(ledRes.data || []);
      setSoundStock(sndRes.data || []);
      setInquiries(inqRes.data?.data || []);
    } catch (error) {
      console.error("Failed to load data", error);
    }
  };

  const toggleCheck = (index: number) => {
    const newChecklist = [...checklist];
    newChecklist[index].isPassed = !newChecklist[index].isPassed;
    setChecklist(newChecklist);
  };

  const handleNotesChange = (index: number, notes: string) => {
    const newChecklist = [...checklist];
    newChecklist[index].notes = notes;
    setChecklist(newChecklist);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.equipmentId || !form.warehouseId || !form.inquiryId) {
      alert("Please select Inquiry ID, Warehouse, and Equipment");
      return;
    }
    
    setSubmitting(true);
    try {
      const itemToReturn = {
        videoEquipId: form.equipmentType === 'VIDEO' ? form.equipmentId : null,
        ledStockId: form.equipmentType === 'LED' ? form.equipmentId : null,
        soundEquipId: form.equipmentType === 'SOUND' ? form.equipmentId : null,
        warehouseId: form.warehouseId,
        quantity: form.quantity,
        isDamaged: form.isDamaged
      };

      await api.post("/warehouse/return", {
        inquiryId: form.inquiryId,
        staffName: form.staffName,
        notes: form.notes,
        penaltyAmount: form.penaltyAmount,
        items: [itemToReturn],
        itemsToCheck: checklist
      });
      
      router.push("/dashboard/warehouse/inventory");
    } catch (error) {
      console.error("Return failed", error);
      alert("Failed to process return.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <ClipboardX className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Return Checklist
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Verify returned equipment and record damages or missing parts.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 space-y-8">
        
        {/* Basic Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Inquiry / Event *</label>
            <select
              required
              value={form.inquiryId}
              onChange={(e) => setForm({ ...form, inquiryId: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer"
            >
              <option value="">Select Approved Inquiry / Event</option>
              {inquiries.map(inq => (
                <option key={inq.id} value={inq.id}>
                  {inq.inquiryNumber || `INQ-${inq.id}`} - {inq.eventName} ({inq.status})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Staff Name *</label>
            <input
              type="text"
              required
              value={form.staffName}
              onChange={(e) => setForm({ ...form, staffName: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium"
              placeholder="Who is verifying?"
            />
          </div>
        </div>

        {/* Equipment Selection */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <PackageOpen className="w-5 h-5 text-slate-400" /> Equipment Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Returning To Warehouse *</label>
              <select
                required
                value={form.warehouseId}
                onChange={(e) => setForm({ ...form, warehouseId: e.target.value, equipmentId: "" })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium appearance-none"
              >
                <option value="">Select Warehouse</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Equipment Type</label>
              <select
                value={form.equipmentType}
                onChange={(e) => setForm({ ...form, equipmentType: e.target.value, equipmentId: "" })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium appearance-none"
              >
                <option value="VIDEO">Video Equipment</option>
                <option value="LED">LED Stock</option>
                <option value="SOUND">Sound Equipment</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Select Dispatched Equipment *</label>
              <select
                required
                value={form.equipmentId}
                onChange={(e) => setForm({ ...form, equipmentId: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer"
              >
                <option value="">Select Item...</option>
                {form.equipmentType === 'VIDEO' ? (
                  videoStock.filter(v => !form.warehouseId || !v.warehouseId || v.warehouseId === Number(form.warehouseId)).map(v => {
                    const whName = warehouses.find(w => w.id === v.warehouseId)?.name || "Unassigned Warehouse";
                    return (
                      <option key={v.id} value={v.id}>{v.name} ({v.serialNumber || 'No Serial'}) [{whName}]</option>
                    );
                  })
                ) : form.equipmentType === 'LED' ? (
                  ledStock.filter(l => !form.warehouseId || !l.warehouseId || l.warehouseId === Number(form.warehouseId)).map(l => {
                    const whName = warehouses.find(w => w.id === l.warehouseId)?.name || "Unassigned Warehouse";
                    return (
                      <option key={l.id} value={l.id}>{l.companyName} {l.ledType} [{whName}]</option>
                    );
                  })
                ) : (
                  soundStock.filter(s => !form.warehouseId || !s.warehouseId || s.warehouseId === Number(form.warehouseId)).map(s => {
                    const whName = warehouses.find(w => w.id === s.warehouseId)?.name || "Unassigned Warehouse";
                    return (
                      <option key={s.id} value={s.id}>{s.name} ({s.serialNumber || 'No Serial'}) [{whName}]</option>
                    );
                  })
                )}
              </select>
            </div>
            {form.equipmentType === 'LED' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Quantity Returned (Cabinets) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium"
                />
              </div>
            )}
          </div>
        </div>

        {/* Checklist */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-4">Receiving Checklist</label>
          <div className="space-y-3">
            {checklist.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 w-56 shrink-0">
                  <input 
                    type="checkbox" 
                    checked={item.isPassed}
                    onChange={() => toggleCheck(idx)}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{item.name}</span>
                </div>
                <input 
                  type="text" 
                  placeholder="Optional notes..." 
                  value={item.notes}
                  onChange={(e) => handleNotesChange(idx, e.target.value)}
                  className="flex-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Final Checks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border-t border-slate-100 dark:border-slate-700">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox"
                checked={form.isDamaged}
                onChange={(e) => setForm({...form, isDamaged: e.target.checked})}
                className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Mark as Damaged</span>
            </label>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Penalty Amount (Optional)</label>
            <input
              type="number"
              min="0"
              value={form.penaltyAmount}
              onChange={(e) => setForm({ ...form, penaltyAmount: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium"
              placeholder="₹ 0.00"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">General Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium resize-none placeholder:text-slate-400"
              placeholder="Any additional comments..."
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-70 flex justify-center items-center gap-2"
        >
          {submitting ? 'Processing Return...' : 'Confirm Return & Update Stock'}
        </button>
      </form>
    </div>
  );
}
