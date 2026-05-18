"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { ClipboardCheck, ClipboardX } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import SearchableMultiSelect from "@/components/SearchableMultiSelect";

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

  const [form, setForm] = useState<{
    inquiryId: string;
    staffName: string;
    notes: string;
    equipmentType: string;
    warehouseId: string;
    selectedEquipments: { id: string | number; quantity: number }[];
  }>({
    inquiryId: "",
    staffName: "",
    notes: "",
    equipmentType: "VIDEO",
    warehouseId: "",
    selectedEquipments: []
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
      
      const inquiriesList = Array.isArray(inqRes.data) 
        ? inqRes.data 
        : inqRes.data?.data || [];
      setInquiries(inquiriesList.filter((i: any) => i.status === 'CONFIRMED' || i.status === 'APPROVED' || i.status === 'INQUIRY'));
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
    if (!form.warehouseId || !form.inquiryId || form.selectedEquipments.length === 0) {
      addToast("Please select Inquiry, Warehouse, and at least one Equipment", "error");
      return;
    }
    
    setSubmitting(true);
    try {
      const itemsToDispatch = form.selectedEquipments.map(item => ({
        videoEquipId: form.equipmentType === 'VIDEO' ? Number(item.id) : null,
        ledStockId: form.equipmentType === 'LED' ? Number(item.id) : null,
        soundEquipId: form.equipmentType === 'SOUND' ? Number(item.id) : null,
        warehouseId: Number(form.warehouseId),
        quantity: item.quantity
      }));

      await api.post("/warehouse/dispatch", {
        inquiryId: Number(form.inquiryId),
        staffName: form.staffName,
        notes: form.notes,
        items: itemsToDispatch,
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
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          >
            <option value="">Select Inquiry...</option>
            {inquiries.map(i => <option key={i.id} value={String(i.id)}>{i.inquiryNumber} - {i.eventName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Staff Assigned *</label>
          <input
            required
            type="text"
            value={form.staffName}
            onChange={(e) => setForm({ ...form, staffName: e.target.value })}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            placeholder="Name of staff taking equipment"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Dispatching Warehouse *</label>
          <select
            required
            value={form.warehouseId}
            onChange={(e) => setForm({ ...form, warehouseId: e.target.value, selectedEquipments: [] })}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          >
            <option value="">Select Warehouse First...</option>
            {warehouses.map(w => <option key={w.id} value={String(w.id)}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Equipment Type</label>
          <select
            value={form.equipmentType}
            onChange={(e) => setForm({ ...form, equipmentType: e.target.value, selectedEquipments: [] })}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          >
            <option value="VIDEO">Video Equipment</option>
            <option value="LED">LED Stock</option>
            <option value="SOUND">Sound Equipment</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <SearchableMultiSelect
            label="Select Dispatched Equipment *"
            placeholder={form.warehouseId ? "Search & select items..." : "Please select a warehouse first to load available items"}
            disabled={!form.warehouseId}
            emptyMessage={form.warehouseId ? "No items found for this warehouse" : "Select a warehouse first"}
            options={(() => {
              if (!form.warehouseId) return [];
              if (form.equipmentType === 'VIDEO') {
                return videoStock
                  .filter(v => v.warehouseId === Number(form.warehouseId))
                  .map(v => ({ id: v.id, name: v.name, subtext: `${v.availableQuantity} available`, maxQuantity: v.availableQuantity }));
              }
              if (form.equipmentType === 'LED') {
                return ledStock
                  .filter(l => l.warehouseId === Number(form.warehouseId))
                  .map(l => ({ id: l.id, name: `${l.companyName} ${l.ledType}`, subtext: `${l.availableQuantity} available`, maxQuantity: l.availableQuantity }));
              }
              if (form.equipmentType === 'SOUND') {
                return soundStock
                  .filter(s => s.warehouseId === Number(form.warehouseId))
                  .map(s => ({ id: s.id, name: s.name, subtext: `${s.availableQuantity} available`, maxQuantity: s.availableQuantity }));
              }
              return [];
            })()}
            selectedItems={form.selectedEquipments}
            onChange={(items) => setForm({ ...form, selectedEquipments: items })}
          />
        </div>
      </div>

      {/* Checklist */}
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Dispatch Checklist</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checklist.map((item, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 w-56 shrink-0">
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
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium resize-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          placeholder="Any additional comments..."
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

  const [form, setForm] = useState<{
    inquiryId: string;
    staffName: string;
    notes: string;
    penaltyAmount: string;
    equipmentType: string;
    warehouseId: string;
    selectedEquipments: { id: string | number; quantity: number }[];
    isDamaged: boolean;
  }>({
    inquiryId: "",
    staffName: "",
    notes: "",
    penaltyAmount: "",
    equipmentType: "VIDEO",
    warehouseId: "",
    selectedEquipments: [],
    isDamaged: false
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
        api.get("/video/equipment"),
        api.get("/led/stock"),
        api.get("/sound/equipment"),
        api.get("/inquiries")
      ]);
      setWarehouses(whRes.data || []);
      setVideoStock(vidRes.data || []);
      setLedStock(ledRes.data || []);
      setSoundStock(sndRes.data || []);
      
      const inquiriesList = Array.isArray(inqRes.data) 
        ? inqRes.data 
        : inqRes.data?.data || [];
      setInquiries(inquiriesList.filter((i: any) => i.status === 'CONFIRMED' || i.status === 'APPROVED' || i.status === 'COMPLETED' || i.status === 'INQUIRY'));
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
    if (!form.warehouseId || !form.inquiryId || form.selectedEquipments.length === 0) {
      addToast("Please select Inquiry, Warehouse, and at least one Equipment", "error");
      return;
    }
    
    setSubmitting(true);
    try {
      const itemsToReturn = form.selectedEquipments.map(item => ({
        videoEquipId: form.equipmentType === 'VIDEO' ? Number(item.id) : null,
        ledStockId: form.equipmentType === 'LED' ? Number(item.id) : null,
        soundEquipId: form.equipmentType === 'SOUND' ? Number(item.id) : null,
        warehouseId: Number(form.warehouseId),
        quantity: item.quantity,
        isDamaged: form.isDamaged
      }));

      await api.post("/warehouse/return", {
        inquiryId: Number(form.inquiryId),
        staffName: form.staffName,
        notes: form.notes,
        penaltyAmount: form.penaltyAmount ? Number(form.penaltyAmount) : undefined,
        items: itemsToReturn,
        itemsToCheck: checklist
      });
      
      addToast("Return recorded successfully!", "success");
      router.push("/dashboard/warehouse/inventory");
    } catch (error: any) {
      console.error("Return failed", error);
      addToast(error.response?.data?.message || "Failed to submit return.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
      {/* Basic Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Select Inquiry *</label>
          <select
            required
            value={form.inquiryId}
            onChange={(e) => setForm({ ...form, inquiryId: e.target.value })}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          >
            <option value="">Select Inquiry...</option>
            {inquiries.map(i => <option key={i.id} value={String(i.id)}>{i.inquiryNumber} - {i.eventName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Staff Returning *</label>
          <input
            required
            type="text"
            value={form.staffName}
            onChange={(e) => setForm({ ...form, staffName: e.target.value })}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            placeholder="Name of staff returning equipment"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Return to Warehouse *</label>
          <select
            required
            value={form.warehouseId}
            onChange={(e) => setForm({ ...form, warehouseId: e.target.value, selectedEquipments: [] })}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          >
            <option value="">Select Warehouse First...</option>
            {warehouses.map(w => <option key={w.id} value={String(w.id)}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Equipment Type</label>
          <select
            value={form.equipmentType}
            onChange={(e) => setForm({ ...form, equipmentType: e.target.value, selectedEquipments: [] })}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          >
            <option value="VIDEO">Video Equipment</option>
            <option value="LED">LED Stock</option>
            <option value="SOUND">Sound Equipment</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <SearchableMultiSelect
            label="Select Returning Equipment *"
            placeholder={form.warehouseId ? "Search & select items..." : "Please select a warehouse first to load dispatched items"}
            disabled={!form.warehouseId}
            emptyMessage={form.warehouseId ? "No dispatched items found for this warehouse" : "Select a warehouse first"}
            options={(() => {
              if (!form.warehouseId) return [];
              if (form.equipmentType === 'VIDEO') {
                return videoStock
                  .filter(v => v.warehouseId === Number(form.warehouseId))
                  .map(v => ({ id: v.id, name: v.name, subtext: `${v.inUseQuantity || 0} dispatched`, maxQuantity: v.inUseQuantity || 0 }));
              }
              if (form.equipmentType === 'LED') {
                return ledStock
                  .filter(l => l.warehouseId === Number(form.warehouseId))
                  .map(l => ({ id: l.id, name: `${l.companyName} ${l.ledType}`, subtext: `${l.inUseQuantity || 0} dispatched`, maxQuantity: l.inUseQuantity || 0 }));
              }
              if (form.equipmentType === 'SOUND') {
                return soundStock
                  .filter(s => s.warehouseId === Number(form.warehouseId))
                  .map(s => ({ id: s.id, name: s.name, subtext: `${s.inUseQuantity || 0} dispatched`, maxQuantity: s.inUseQuantity || 0 }));
              }
              return [];
            })()}
            selectedItems={form.selectedEquipments}
            onChange={(items) => setForm({ ...form, selectedEquipments: items })}
          />
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
