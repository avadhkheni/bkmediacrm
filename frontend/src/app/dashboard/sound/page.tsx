"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { usePermission } from "@/lib/usePermission";
import { 
  Speaker, 
  Activity, 
  Zap, 
  Warehouse, 
  Plus, 
  Search,
  Filter,
  MoreVertical,
  Mic2,
  Music,
  ArrowUpRight,
  X,
  Pencil,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  Volume2,
  ShieldAlert,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";

const soundCategories = [
  { label: "All", value: "All" },
  { label: "Speakers", value: "Speakers" },
  { label: "Mixers", value: "Mixers" },
  { label: "Microphones", value: "Microphones" },
  { label: "Amplifiers", value: "Amplifiers" },
  { label: "Cables", value: "Cables" },
  { label: "Other", value: "Other" },
];

export default function SoundDashboard() {
  const router = useRouter();
  const { hasPermission } = usePermission();

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname === "/dashboard/sound") {
      router.replace("/dashboard/teams?tab=sound");
    }
  }, [router]);

  const [activeTab, setActiveTab] = useState<'inventory' | 'setups'>('inventory');
  
  // Inventory State
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "Speakers",
    brand: "",
    model: "",
    totalQuantity: 1,
    ratePerDay: 0,
    notes: ""
  });

  // Sound Setups State
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [selectedInquiryId, setSelectedInquiryId] = useState<number | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(false);
  const [savingSetup, setSavingSetup] = useState(false);
  const [setupFormData, setSetupFormData] = useState({
    stageSize: "",
    audienceSize: 0,
    eventType: "",
    powerRequiredKw: 0,
    venueType: "INDOOR",
    paSystemType: "LINE_ARRAY",
    monitorCount: 0,
    wirelessMicCount: 0,
    totalWattage: 0,
    riggingDone: false,
    paTuned: false,
    soundCheckDone: false,
    notes: ""
  });

  useEffect(() => {
    fetchEquipment();
    fetchSoundInquiries();
  }, []);

  const fetchEquipment = async () => {
    try {
      const res = await api.get("/sound/equipment");
      setEquipment(res.data);
    } catch (error) {
      console.error("Failed to fetch sound equipment", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSoundInquiries = async () => {
    setLoadingInquiries(true);
    try {
      const res = await api.get("/inquiries");
      const list = res.data.data || res.data || [];
      // Filter sound department inquiries
      const soundList = list.filter((inq: any) => inq.department === "SOUND");
      setInquiries(soundList);
      if (soundList.length > 0) {
        setSelectedInquiryId(soundList[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch inquiries for sound department", error);
    } finally {
      setLoadingInquiries(false);
    }
  };

  // Fetch SoundSetup when selected inquiry changes
  useEffect(() => {
    if (selectedInquiryId) {
      fetchSoundSetup(selectedInquiryId);
    }
  }, [selectedInquiryId]);

  const fetchSoundSetup = async (inquiryId: number) => {
    setLoadingSetup(true);
    try {
      const res = await api.get(`/sound/setup?inquiryId=${inquiryId}`);
      if (res.data) {
        setSetupFormData({
          stageSize: res.data.stageSize || "",
          audienceSize: res.data.audienceSize || 0,
          eventType: res.data.eventType || "",
          powerRequiredKw: Number(res.data.powerRequiredKw) || 0,
          venueType: res.data.venueType || "INDOOR",
          paSystemType: res.data.paSystemType || "LINE_ARRAY",
          monitorCount: res.data.monitorCount || 0,
          wirelessMicCount: res.data.wirelessMicCount || 0,
          totalWattage: res.data.totalWattage || 0,
          riggingDone: !!res.data.riggingDone,
          paTuned: !!res.data.paTuned,
          soundCheckDone: !!res.data.soundCheckDone,
          notes: res.data.notes || ""
        });
      }
    } catch (error) {
      console.error("Failed to fetch sound setup details", error);
    } finally {
      setLoadingSetup(false);
    }
  };

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        brand: item.brand || "",
        model: item.model || "",
        totalQuantity: item.totalQuantity,
        ratePerDay: item.ratePerDay || 0,
        notes: item.notes || ""
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        category: "Speakers",
        brand: "",
        model: "",
        totalQuantity: 1,
        ratePerDay: 0,
        notes: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingItem) {
        await api.patch(`/sound/equipment/${editingItem.id}`, formData);
      } else {
        await api.post("/sound/equipment", formData);
      }
      setIsModalOpen(false);
      fetchEquipment();
    } catch (error) {
      console.error("Error saving equipment", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this equipment?")) return;
    try {
      await api.delete(`/sound/equipment/${id}`);
      fetchEquipment();
    } catch (error) {
      console.error("Error deleting equipment", error);
    }
  };

  const handleSaveSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiryId) return;
    setSavingSetup(true);
    try {
      const payload = {
        inquiryId: selectedInquiryId,
        ...setupFormData
      };
      const res = await api.post("/sound/setup", payload);
      if (res.data) {
        setSetupFormData(prev => ({
          ...prev,
          powerRequiredKw: res.data.powerRequiredKw
        }));
        alert("Sound Setup specifications updated successfully!");
      }
    } catch (error) {
      console.error("Failed to save sound setup details", error);
      alert("Error saving setup specifications.");
    } finally {
      setSavingSetup(false);
    }
  };

  const toggleWorkflowCheckbox = async (field: 'riggingDone' | 'paTuned' | 'soundCheckDone') => {
    if (!selectedInquiryId) return;
    const newValue = !setupFormData[field];
    
    // Optimistic update
    setSetupFormData(prev => ({ ...prev, [field]: newValue }));

    try {
      await api.patch(`/sound/setup/${selectedInquiryId}/workflow`, {
        field,
        value: newValue
      });
    } catch (error) {
      console.error(`Failed to toggle workflow ${field}`, error);
      // Revert if error
      setSetupFormData(prev => ({ ...prev, [field]: !newValue }));
    }
  };

  const filteredEquip = equipment.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "All" || !filterCategory ? true : e.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Sound/Audio Team Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage sound assets, supplier rentals, and stage audio setups.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-slate-200 transition-all">
            <Warehouse className="w-4 h-4" /> Warehouse View
          </button>
          {activeTab === 'inventory' && hasPermission("WORK_TEAMS", "canCreate") && (
            <button 
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Equipment
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 bg-white dark:bg-slate-800/50 rounded-t-xl overflow-hidden shadow-sm">
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'inventory' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
          } flex items-center gap-2`}
        >
          <Activity className="w-4 h-4" /> Equipment Inventory
        </button>
        <button 
          onClick={() => setActiveTab('setups')}
          className={`px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'setups' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
          } flex items-center gap-2`}
        >
          <Volume2 className="w-4 h-4" /> Live Event Setups
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search speakers, mixers, amps..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl py-2 px-3 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
              >
                {soundCategories.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">
                    {cat.label === "All" ? "All Categories" : cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">Asset Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">Stock Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">Rate (Day)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {loading ? (
                  <tr><td colSpan={5} className="py-20 text-center text-slate-400">Loading audio assets...</td></tr>
                ) : filteredEquip.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-slate-450">No sound equipment registered in this category.</td></tr>
                ) : filteredEquip.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                          {item.category === 'Speakers' ? <Speaker className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">{item.name}</p>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{item.brand} {item.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-white">{item.availableQuantity} <span className="text-slate-400">/ {item.totalQuantity}</span></p>
                          <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full mt-1.5 overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${(item.availableQuantity / item.totalQuantity) * 100}%` }}
                            />
                          </div>
                        </div>
                        {item.inUseQuantity > 0 && (
                          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                            {item.inUseQuantity} In-Use
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">₹{item.ratePerDay?.toLocaleString() || "0"}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {hasPermission("WORK_TEAMS", "canUpdate") && (
                          <button 
                            onClick={() => handleOpenModal(item)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission("WORK_TEAMS", "canDelete") && (
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'setups' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Inquiry Selection List */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Audio Events</h3>
              <p className="text-xs text-slate-500 font-medium">Select a Sound Department event to manage setup</p>
            </div>
            
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {loadingInquiries ? (
                <div className="py-12 text-center text-slate-400">Loading audio events...</div>
              ) : inquiries.length === 0 ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8 text-slate-300" />
                  <span className="text-sm">No Sound Inquiries found.</span>
                </div>
              ) : inquiries.map((inq) => (
                <button
                  key={inq.id}
                  onClick={() => setSelectedInquiryId(inq.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-1.5 ${
                    selectedInquiryId === inq.id
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm"
                      : "border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/20"
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                      {inq.inquiryNumber || `INQ-${inq.id}`}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      inq.status === "CONFIRMED" || inq.status === "IN_PROGRESS"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}>
                      {inq.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">{inq.eventName}</h4>
                    <p className="text-xs text-slate-400 font-semibold truncate mt-0.5">{inq.venue}</p>
                  </div>
                  <div className="text-[10px] font-semibold text-slate-450 dark:text-slate-400 flex justify-between mt-1">
                    <span>{new Date(inq.startDate).toLocaleDateString()}</span>
                    <span>{inq.totalDays} Days</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Setup Specs & Checklist Form */}
          <div className="lg:col-span-2 space-y-6">
            {selectedInquiryId ? (
              <>
                {/* 1. Workflow Checklist Card */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Setup Status Checklist</h3>
                    <p className="text-xs text-slate-500 font-medium">Quick-toggle actual sound check milestones on stage</p>
                  </div>

                  {loadingSetup ? (
                    <div className="py-8 text-center text-slate-400">Loading checklist...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Rigging Checkbox */}
                      <button
                        onClick={() => toggleWorkflowCheckbox('riggingDone')}
                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                          setupFormData.riggingDone
                            ? "bg-emerald-55/40 dark:bg-emerald-950/10 border-emerald-500 text-emerald-700 dark:text-emerald-455"
                            : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700 text-slate-400"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                          setupFormData.riggingDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                        }`}>
                          {setupFormData.riggingDone && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <div className="text-left">
                          <p className={`text-sm font-bold ${setupFormData.riggingDone ? "text-emerald-800 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>Rigging Done</p>
                          <p className="text-[10px] text-slate-400">Line arrays flown & secured</p>
                        </div>
                      </button>

                      {/* PA System Tuned */}
                      <button
                        onClick={() => toggleWorkflowCheckbox('paTuned')}
                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                          setupFormData.paTuned
                            ? "bg-emerald-55/40 dark:bg-emerald-950/10 border-emerald-500 text-emerald-700 dark:text-emerald-455"
                            : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700 text-slate-400"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                          setupFormData.paTuned ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                        }`}>
                          {setupFormData.paTuned && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <div className="text-left">
                          <p className={`text-sm font-bold ${setupFormData.paTuned ? "text-emerald-800 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>PA Tuned</p>
                          <p className="text-[10px] text-slate-400">Time-aligned & EQ balanced</p>
                        </div>
                      </button>

                      {/* Sound Check Done */}
                      <button
                        onClick={() => toggleWorkflowCheckbox('soundCheckDone')}
                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                          setupFormData.soundCheckDone
                            ? "bg-emerald-55/40 dark:bg-emerald-950/10 border-emerald-500 text-emerald-700 dark:text-emerald-455"
                            : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700 text-slate-400"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                          setupFormData.soundCheckDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                        }`}>
                          {setupFormData.soundCheckDone && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <div className="text-left">
                          <p className={`text-sm font-bold ${setupFormData.soundCheckDone ? "text-emerald-800 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>Sound Check</p>
                          <p className="text-[10px] text-slate-400">Artist mic check completed</p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Setup Specification Details Card */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Technical Specifications</h3>
                    <p className="text-xs text-slate-500 font-medium">Stage audio layouts and total system load wattage</p>
                  </div>

                  {loadingSetup ? (
                    <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                      <span>Loading setup parameters...</span>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveSetup} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Stage Size</label>
                          <input
                            type="text"
                            value={setupFormData.stageSize}
                            onChange={(e) => setSetupFormData(prev => ({ ...prev, stageSize: e.target.value }))}
                            placeholder="e.g. 40x30 ft"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Audience Size</label>
                          <input
                            type="number"
                            value={setupFormData.audienceSize}
                            onChange={(e) => setSetupFormData(prev => ({ ...prev, audienceSize: parseInt(e.target.value) || 0 }))}
                            placeholder="e.g. 500"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Event Type</label>
                          <input
                            type="text"
                            value={setupFormData.eventType}
                            onChange={(e) => setSetupFormData(prev => ({ ...prev, eventType: e.target.value }))}
                            placeholder="Concert / Wedding / Corporate"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Venue Type</label>
                          <select
                            value={setupFormData.venueType}
                            onChange={(e) => setSetupFormData(prev => ({ ...prev, venueType: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none text-slate-900 dark:text-white"
                          >
                            <option value="INDOOR">Indoor</option>
                            <option value="OUTDOOR">Outdoor</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">PA System Type</label>
                          <select
                            value={setupFormData.paSystemType}
                            onChange={(e) => setSetupFormData(prev => ({ ...prev, paSystemType: e.target.value }))}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none text-slate-900 dark:text-white"
                          >
                            <option value="LINE_ARRAY">Line Array</option>
                            <option value="POINT_SOURCE">Point Source</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Total System Wattage (W)</label>
                          <input
                            type="number"
                            value={setupFormData.totalWattage}
                            onChange={(e) => setSetupFormData(prev => ({ ...prev, totalWattage: parseInt(e.target.value) || 0 }))}
                            placeholder="e.g. 25000"
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Monitor Count</label>
                          <input
                            type="number"
                            value={setupFormData.monitorCount}
                            onChange={(e) => setSetupFormData(prev => ({ ...prev, monitorCount: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Wireless Mic Count</label>
                          <input
                            type="number"
                            value={setupFormData.wirelessMicCount}
                            onChange={(e) => setSetupFormData(prev => ({ ...prev, wirelessMicCount: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            Power Required (kW)
                          </label>
                          <input
                            type="number"
                            readOnly
                            disabled
                            value={setupFormData.powerRequiredKw}
                            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-500 cursor-not-allowed outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Setup Engineering Notes</label>
                        <textarea
                          value={setupFormData.notes}
                          onChange={(e) => setSetupFormData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Stage patch list, wireless frequencies, crossover tuning details..."
                          rows={3}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none"
                        />
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={savingSetup}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-2xl text-sm transition-all shadow-lg shadow-blue-500/10 flex items-center gap-2"
                        >
                          {savingSetup ? "Saving Specifications..." : "Save Specifications"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <Speaker className="w-12 h-12 text-slate-300" />
                <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">No Audio Event Selected</h4>
                <p className="text-sm text-slate-500 max-w-sm">Please select a Sound Department event from the left sidebar list to configure specs & sound check checklist.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700"
          >
            <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                  {editingItem ? "Edit Equipment" : "Add New Equipment"}
                </h3>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Sound Team Inventory</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Asset Name *</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. JBL VRX 932LAP"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Category *</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
                  >
                    {soundCategories.filter(c => c.value !== 'All').map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Brand</label>
                  <input 
                    type="text" 
                    value={formData.brand}
                    onChange={e => setFormData({...formData, brand: e.target.value})}
                    placeholder="e.g. JBL"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Total Stock *</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.totalQuantity}
                    onChange={e => setFormData({...formData, totalQuantity: parseInt(e.target.value) || 1})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Daily Rental Rate (₹) *</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.ratePerDay}
                    onChange={e => setFormData({...formData, ratePerDay: parseInt(e.target.value) || 0})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Notes / Description</label>
                  <textarea 
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder="Technical specifications, description, serial numbers, etc."
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-2xl text-sm font-semibold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={submitting}
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-2xl text-sm font-semibold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingItem ? "Update Asset" : "Add to Inventory"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
