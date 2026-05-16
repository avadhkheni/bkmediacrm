"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
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
  Users
} from "lucide-react";
import VendorSection from "@/components/VendorSection";
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
  const [activeTab, setActiveTab] = useState<'inventory' | 'vendors'>('inventory');
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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

  useEffect(() => {
    fetchEquipment();
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

  const filteredEquip = equipment.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalSpeakers: equipment.filter(e => e.category === 'Speakers').reduce((sum, e) => sum + e.totalQuantity, 0),
    totalAmps: equipment.filter(e => e.category === 'Amplifiers').reduce((sum, e) => sum + e.totalQuantity, 0),
    totalMics: equipment.filter(e => e.category === 'Microphones').reduce((sum, e) => sum + e.totalQuantity, 0),
    inUse: equipment.reduce((sum, e) => sum + e.inUseQuantity, 0)
  };

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Sound Dept Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage professional audio inventory and live setups.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-200 transition-all">
            <Warehouse className="w-4 h-4" /> Warehouse View
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Equipment
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Main PA Units", value: stats.totalSpeakers, icon: Speaker, color: "bg-blue-500", shadow: "shadow-blue-500/20" },
          { label: "Amplifiers", value: stats.totalAmps, icon: Zap, color: "bg-amber-500", shadow: "shadow-amber-500/20" },
          { label: "Microphones", value: stats.totalMics, icon: Mic2, color: "bg-purple-500", shadow: "shadow-purple-500/20" },
          { label: "Active Deployments", value: stats.inUse, icon: Activity, color: "bg-emerald-500", shadow: "shadow-emerald-500/20" },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 ${stat.color} rounded-2xl text-white ${stat.shadow}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg">Realtime</span>
            </div>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white">{stat.value}</h3>
            <p className="text-sm font-bold text-slate-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>


      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 bg-white dark:bg-slate-800/50 rounded-t-xl overflow-hidden">
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'inventory' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
          } flex items-center gap-2`}
        >
          <Activity className="w-4 h-4" /> Equipment Inventory
        </button>
        <button 
          onClick={() => setActiveTab('vendors')}
          className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'vendors' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
          } flex items-center gap-2`}
        >
          <Users className="w-4 h-4" /> Vendors
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
             <button className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50 transition-all">
               <Filter className="w-5 h-5" />
             </button>
             <button className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50 transition-all">
               <MoreVertical className="w-5 h-5" />
             </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Asset Name</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Stock Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Rate (Day)</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400">Loading audio assets...</td></tr>
              ) : filteredEquip.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                        {item.category === 'Speakers' ? <Speaker className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">{item.name}</p>
                        <p className="text-[10px] font-black text-slate-400 mt-0.5">{item.brand} {item.model}</p>
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
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          {item.inUseQuantity} In-Use
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-800 dark:text-white">₹{item.ratePerDay?.toLocaleString() || "0"}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(item)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'vendors' && (
        <VendorSection department="SOUND" />
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
                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                  {editingItem ? "Edit Equipment" : "Add New Equipment"}
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Sound Department Inventory</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Asset Name</label>
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
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Category</label>
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
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Brand</label>
                  <input 
                    type="text" 
                    value={formData.brand}
                    onChange={e => setFormData({...formData, brand: e.target.value})}
                    placeholder="e.g. JBL"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Total Stock</label>
                  <input 
                    type="number" 
                    min="1"
                    value={formData.totalQuantity}
                    onChange={e => setFormData({...formData, totalQuantity: parseInt(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Daily Rate (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.ratePerDay}
                    onChange={e => setFormData({...formData, ratePerDay: parseInt(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Notes / Specs</label>
                  <textarea 
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder="Technical specifications, serial numbers, etc."
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={submitting}
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50"
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
