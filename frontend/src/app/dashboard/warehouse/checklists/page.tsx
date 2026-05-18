"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ClipboardCheck, ClipboardX, PackageCheck, PackageOpen } from "lucide-react";
import { useUIStore } from "@/store/uiStore";

export default function ChecklistsPage() {
  const [activeTab, setActiveTab] = useState<'dispatch' | 'return'>('dispatch');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            {activeTab === 'dispatch' ? <ClipboardCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" /> : <ClipboardX className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
            {activeTab === 'dispatch' ? 'Dispatch Checklist' : 'Return Checklist'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {activeTab === 'dispatch' 
              ? 'Verify equipment condition before sending it out for an event.' 
              : 'Verify returned equipment and record damages or missing parts.'}
          </p>
        </div>
        
        {/* Tab Buttons */}
        <div className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl flex shadow-sm border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'dispatch' 
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-600' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
            }`}
          >
            Dispatch
          </button>
          <button
            onClick={() => setActiveTab('return')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'return' 
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-600' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-transparent'
            }`}
          >
            Return
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {activeTab === 'dispatch' ? <DispatchView /> : <ReturnView />}
      </div>
    </div>
  );
}

function DispatchView() {
  const router = useRouter();
  const { addToast } = useUIStore();
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
    equipmentType: "VIDEO",
    equipmentId: "",
    warehouseId: "",
    quantity: 1
  });

  const [checklist, setChecklist] = useState([
    { name: "Equipment Checked", isPassed: false, notes: "" },
    { name: "Battery Included", isPassed: false, notes: "" },
    { name: "Charger Included", isPassed: false, notes: "" },
    { name: "Cable Included", isPassed: false, notes: "" },
    { name: "Tested", isPassed: false, notes: "" },
    { name: "No Damage", isPassed: false, notes: "" },
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [whRes, vidRes, ledRes, sndRes, inqRes] = await Promise.all([
        api.get("/warehouse"),
        api.get("/video/equipment?status=AVAILABLE"),
        api.get("/led/stock"),
        api.get("/sound/equipment?status=AVAILABLE"),
        api.get("/inquiries")
      ]);
      setWarehouses(whRes.data || []);
      setVideoStock(vidRes.data || []);
      setLedStock((ledRes.data || []).filter((l: any) => l.status === 'AVAILABLE'));
      setSoundStock(sndRes.data || []);
      setInquiries((inqRes.data || []).filter((i: any) => i.status === 'CONFIRMED' || i.status === 'APPROVED'));
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
      addToast("Please select Inquiry, Warehouse, and Equipment", "error");
      return;
    }
    
    setSubmitting(true);
    try {
      const itemToDispatch = {
        videoEquipId: form.equipmentType === 'VIDEO' ? Number(form.equipmentId) : null,
        ledStockId: form.equipmentType === 'LED' ? Number(form.equipmentId) : null,
        soundEquipId: form.equipmentType === 'SOUND' ? Number(form.equipmentId) : null,
        warehouseId: Number(form.warehouseId),
        quantity: Number(form.quantity)
      };

      await api.post("/warehouse/dispatch", {
        inquiryId: Number(form.inquiryId),
        staffName: form.staffName,
        notes: form.notes,
        items: [itemToDispatch],
        itemsToCheck: checklist
      });
      
      addToast("Dispatch recorded successfully!", "success");
      router.push("/dashboard/warehouse/inventory");
    } catch (error: any) {
      console.error("Dispatch failed", error);
      addToast(error.response?.data?.message || "Failed to submit dispatch. Ensure stock is available.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
      {/* Basic Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Select Approved Inquiry *</label>
          <select
            required
            value={form.inquiryId}
            onChange={(e) => setForm({ ...form, inquiryId: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none"
          >
            <option value="">Select Inquiry...</option>
            {inquiries.map((inq: any) => (
              <option key={inq.id} value={String(inq.id)}>
                #{inq.inquiryNumber || inq.id} - {inq.eventName} ({inq.client?.name || "No Client"})
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
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            placeholder="Who is verifying?"
          />
        </div>
      </div>

      {/* Equipment Selection */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
          <PackageCheck className="w-5 h-5 text-slate-400" /> Equipment Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Source Warehouse *</label>
            <select
              required
              value={form.warehouseId}
              onChange={(e) => setForm({ ...form, warehouseId: e.target.value, equipmentId: "" })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">Select Warehouse</option>
              {warehouses.map(w => <option key={w.id} value={String(w.id)}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Equipment Type</label>
            <select
              value={form.equipmentType}
              onChange={(e) => setForm({ ...form, equipmentType: e.target.value, equipmentId: "" })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              <option value="VIDEO">Video Equipment</option>
              <option value="LED">LED Stock</option>
              <option value="SOUND">Sound Equipment</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Select Equipment *</label>
            <select
              required
              value={form.equipmentId}
              onChange={(e) => setForm({ ...form, equipmentId: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">Select Item...</option>
              {form.equipmentType === 'VIDEO' && (
                videoStock
                  .filter(v => form.warehouseId && v.warehouseId === Number(form.warehouseId))
                  .map(v => {
                    const whName = warehouses.find(w => w.id === v.warehouseId)?.name || "Unassigned Warehouse";
                    return (
                      <option key={v.id} value={String(v.id)}>
                        {v.name} ({v.availableQuantity} avail / {v.totalQuantity} total) [{whName}]
                      </option>
                    );
                  })
              )}
              {form.equipmentType === 'LED' && (
                ledStock
                  .filter(l => form.warehouseId && l.warehouseId === Number(form.warehouseId))
                  .map(l => {
                    const whName = warehouses.find(w => w.id === l.warehouseId)?.name || "Unassigned Warehouse";
                    return (
                      <option key={l.id} value={String(l.id)}>
                        {l.companyName} {l.ledType} ({l.availableQuantity} avail / {l.totalCabinets} total) [{whName}]
                      </option>
                    );
                  })
              )}
              {form.equipmentType === 'SOUND' && (
                soundStock
                  .filter(s => form.warehouseId && s.warehouseId === Number(form.warehouseId))
                  .map(s => {
                    const whName = warehouses.find(w => w.id === s.warehouseId)?.name || "Unassigned Warehouse";
                    return (
                      <option key={s.id} value={String(s.id)}>
                        {s.name} ({s.availableQuantity} avail / {s.totalQuantity} total) [{whName}]
                      </option>
                    );
                  })
              )}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Quantity To Dispatch *</label>
            <input
              type="number"
              required
              min="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Verification Checklist</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checklist.map((item, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 w-48 shrink-0">
                <input 
                  type="checkbox" 
                  checked={item.isPassed}
                  onChange={() => toggleCheck(idx)}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-bold text-slate-800 dark:text-white">{item.name}</span>
              </div>
              <input 
                type="text" 
                placeholder="Optional notes..." 
                value={item.notes}
                onChange={(e) => handleNotesChange(idx, e.target.value)}
                className="flex-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">General Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium resize-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          placeholder="Any additional comments before dispatch..."
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-md disabled:opacity-70 flex justify-center items-center gap-2"
      >
        {submitting ? 'Processing Dispatch...' : 'Confirm Dispatch & Update Stock'}
      </button>
    </form>
  );
}

function ReturnView() {
  const router = useRouter();
  const { addToast } = useUIStore();
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
        api.get("/video/equipment"), 
        api.get("/led/stock"),
        api.get("/sound/equipment"),
        api.get("/inquiries")
      ]);
      setWarehouses(whRes.data || []);
      setVideoStock((vidRes.data || []).filter((v: any) => v.inUseQuantity > 0 || v.status === 'IN_USE'));
      setLedStock((ledRes.data || []).filter((l: any) => l.inUseQuantity > 0 || l.status === 'IN_USE'));
      setSoundStock((sndRes.data || []).filter((s: any) => s.inUseQuantity > 0 || s.status === 'IN_USE'));
      setInquiries(inqRes.data || []);
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
      addToast("Please select Inquiry, Warehouse, and Equipment", "error");
      return;
    }
    
    setSubmitting(true);
    try {
      const itemToReturn = {
        videoEquipId: form.equipmentType === 'VIDEO' ? Number(form.equipmentId) : null,
        ledStockId: form.equipmentType === 'LED' ? Number(form.equipmentId) : null,
        soundEquipId: form.equipmentType === 'SOUND' ? Number(form.equipmentId) : null,
        warehouseId: Number(form.warehouseId),
        quantity: Number(form.quantity),
        isDamaged: form.isDamaged
      };

      await api.post("/warehouse/return", {
        inquiryId: Number(form.inquiryId),
        staffName: form.staffName,
        notes: form.notes,
        penaltyAmount: form.penaltyAmount,
        items: [itemToReturn],
        itemsToCheck: checklist
      });
      
      addToast("Return recorded successfully!", "success");
      router.push("/dashboard/warehouse/inventory");
    } catch (error: any) {
      console.error("Return failed", error);
      addToast(error.response?.data?.message || "Failed to process return.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
      {/* Basic Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Select Dispatched Inquiry *</label>
          <select
            required
            value={form.inquiryId}
            onChange={(e) => setForm({ ...form, inquiryId: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
          >
            <option value="">Select Inquiry...</option>
            {inquiries.map((inq: any) => (
              <option key={inq.id} value={String(inq.id)}>
                #{inq.inquiryNumber || inq.id} - {inq.eventName} ({inq.client?.name || "No Client"})
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
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
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
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="">Select Warehouse</option>
              {warehouses.map(w => <option key={w.id} value={String(w.id)}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Equipment Type</label>
            <select
              value={form.equipmentType}
              onChange={(e) => setForm({ ...form, equipmentType: e.target.value, equipmentId: "" })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
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
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="">Select Item...</option>
              {form.equipmentType === 'VIDEO' && (
                videoStock
                  .filter(v => form.warehouseId && v.warehouseId === Number(form.warehouseId))
                  .map(v => {
                    const whName = warehouses.find(w => w.id === v.warehouseId)?.name || "Unassigned Warehouse";
                    return (
                      <option key={v.id} value={String(v.id)}>
                        {v.name} ({v.inUseQuantity || 0} dispatched) [{whName}]
                      </option>
                    );
                  })
              )}
              {form.equipmentType === 'LED' && (
                ledStock
                  .filter(l => form.warehouseId && l.warehouseId === Number(form.warehouseId))
                  .map(l => {
                    const whName = warehouses.find(w => w.id === l.warehouseId)?.name || "Unassigned Warehouse";
                    return (
                      <option key={l.id} value={String(l.id)}>
                        {l.companyName} {l.ledType} ({l.inUseQuantity || 0} dispatched) [{whName}]
                      </option>
                    );
                  })
              )}
              {form.equipmentType === 'SOUND' && (
                soundStock
                  .filter(s => form.warehouseId && s.warehouseId === Number(form.warehouseId))
                  .map(s => {
                    const whName = warehouses.find(w => w.id === s.warehouseId)?.name || "Unassigned Warehouse";
                    return (
                      <option key={s.id} value={String(s.id)}>
                        {s.name} ({s.inUseQuantity || 0} dispatched) [{whName}]
                      </option>
                    );
                  })
              )}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Quantity Returned *</label>
            <input
              type="number"
              required
              min="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Receiving Checklist</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checklist.map((item, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700">
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
                className="flex-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Final Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox"
              checked={form.isDamaged}
              onChange={(e) => setForm({...form, isDamaged: e.target.checked})}
              className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Mark as Damaged / Sent to Mnt.</span>
          </label>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Penalty Amount (Optional)</label>
          <input
            type="number"
            value={form.penaltyAmount}
            onChange={(e) => setForm({ ...form, penaltyAmount: e.target.value })}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            placeholder="₹ 0.00"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">General Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium resize-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            placeholder="Any additional comments..."
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-md disabled:opacity-70 flex justify-center items-center gap-2"
      >
        {submitting ? 'Processing Return...' : 'Confirm Return & Update Stock'}
      </button>
    </form>
  );
}
