"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Plus, X, Search, Warehouse, Pencil, Trash2, ArrowRight } from "lucide-react";
import { useUIStore } from "@/store/uiStore";

interface WarehouseItem {
  id: number;
  name: string;
  location: string;
  status: string;
  _count?: {
    videoStock: number;
    ledStock: number;
    soundStock: number;
  };
  createdAt: string;
}

export default function WarehousePage() {
  const router = useRouter();
  const { addToast, showConfirm } = useUIStore();
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", status: "ACTIVE" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const { data } = await api.get("/warehouse");
      setWarehouses(data);
    } catch (error) {
      console.error("Failed to load warehouses", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`/warehouse/${editingId}`, form);
      } else {
        await api.post("/warehouse", form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: "", location: "", status: "ACTIVE" });
      fetchWarehouses();
      addToast(editingId ? "Warehouse updated successfully" : "Warehouse created successfully", "success");
    } catch (error: any) {
      console.error("Failed to save warehouse", error);
      addToast(error.response?.data?.message || "Failed to save warehouse", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (w: WarehouseItem) => {
    setForm({
      name: w.name,
      location: w.location,
      status: w.status,
    });
    setEditingId(w.id);
    setShowForm(true);
  };

  const handleAddClick = () => {
    setForm({ name: "", location: "", status: "ACTIVE" });
    setEditingId(null);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    showConfirm({
      title: "Delete Warehouse",
      message: "Are you sure you want to delete this warehouse? This action cannot be undone and requires the warehouse to be empty.",
      confirmText: "Delete Warehouse",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await api.delete(`/warehouse/${id}`);
          fetchWarehouses();
          addToast("Warehouse deleted successfully", "success");
        } catch (error: any) {
          console.error("Failed to delete warehouse", error);
          addToast(error.response?.data?.message || "Failed to delete warehouse", "error");
        }
      }
    });
  };

  const filtered = warehouses.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Warehouses
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage physical locations and track overall inventory distribution.</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="bg-blue-600 text-white font-bold py-2.5 px-5 rounded-xl hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2 text-sm"
        >
          <Plus className="w-5 h-5" /> Add Warehouse
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search warehouses..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
                <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Name</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Location</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Video Equip.</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">LED Stock</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Sound Equip.</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading warehouses...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No warehouses found</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="py-4 px-6">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{item.name}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-slate-600 dark:text-slate-400">{item.location}</p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-md text-xs font-bold border border-indigo-200 dark:border-indigo-900/50">
                        {item._count?.videoStock || 0}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded-md text-xs font-bold border border-pink-200 dark:border-pink-900/50">
                        {item._count?.ledStock || 0}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-md text-xs font-bold border border-amber-200 dark:border-amber-900/50">
                        {item._count?.soundStock || 0}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'ACTIVE' ? 'bg-[#e6f4ea] dark:bg-green-900/30 text-[#137333] dark:text-green-400' :
                        'bg-[#fce8e6] dark:bg-red-900/30 text-[#c5221f] dark:text-red-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => router.push(`/dashboard/warehouse/${item.id}`)}
                          className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm"
                          title="View Details"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(item)}
                          className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm"
                          title="Edit Warehouse"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm"
                          title="Delete Warehouse"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
              <h3 className="font-bold text-slate-800 dark:text-white">{editingId ? 'Edit Warehouse' : 'Add New Warehouse'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Warehouse Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white text-sm"
                  placeholder="e.g. Main Hub"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Location *</label>
                <input
                  type="text"
                  required
                  value={form.location}
                  onChange={e => setForm({...form, location: e.target.value})}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white text-sm"
                  placeholder="e.g. Ahmedabad, Gujarat"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm({...form, status: e.target.value})}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white text-sm"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
