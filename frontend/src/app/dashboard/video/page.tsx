"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { 
  Camera, 
  Aperture, 
  Lightbulb, 
  Mic, 
  Film, 
  Plane, 
  Wrench,
  Plus,
  Eye,
  Calendar,
  Package,
  Monitor,
  Trash2,
  Pencil
} from "lucide-react";

interface VideoEquipment {
  id: number;
  name: string;
  category: string;
  brand: string;
  model: string;
  serialNumber: string;
  totalQuantity: number;
  availableQuantity: number;
  inUseQuantity: number;
  maintenanceQuantity: number;
  status: string;
  notes: string;
  warehouseId?: number | null;
  createdAt: string;
}

export default function VideoDepartmentPage() {
  const router = useRouter();
  const [equipment, setEquipment] = useState<VideoEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'equipment' | 'events' | 'add'>('equipment');
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Add Equipment form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'CAMERA',
    brand: '',
    model: '',
    serialNumber: '',
    totalQuantity: 1,
    availableQuantity: 1,
    inUseQuantity: 0,
    maintenanceQuantity: 0,
    status: 'AVAILABLE',
    notes: '',
    warehouseId: '',
  });

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Auto-calculate totalQuantity from breakdown
  useEffect(() => {
    if (editingId) {
      const total = Number(formData.availableQuantity || 0) + 
                    Number(formData.inUseQuantity || 0) + 
                    Number(formData.maintenanceQuantity || 0);
      if (total !== formData.totalQuantity) {
        setFormData(prev => ({ ...prev, totalQuantity: total }));
      }
    }
  }, [formData.availableQuantity, formData.inUseQuantity, formData.maintenanceQuantity, editingId]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [equipRes, inquiriesRes, whRes] = await Promise.all([
        api.get("/video/equipment"),
        api.get("/inquiries?dept=VIDEO"),
        api.get("/warehouse"),
      ]);
      setEquipment(equipRes.data);
      setUpcomingEvents(inquiriesRes.data.data || []);
      setWarehouses(whRes.data || []);
    } catch (error) {
      console.error("Failed to load Video data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`/video/equipment/${editingId}`, formData);
      } else {
        await api.post("/video/equipment", formData);
      }
      setFormData({
        name: '',
        category: 'CAMERA',
        brand: '',
        model: '',
        serialNumber: '',
        totalQuantity: 1,
        availableQuantity: 1,
        inUseQuantity: 0,
        maintenanceQuantity: 0,
        status: 'AVAILABLE',
        notes: '',
        warehouseId: '',
      });
      setEditingId(null);
      setActiveTab('equipment');
      fetchData();
    } catch (error) {
      console.error("Failed to add equipment", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this equipment? It will be archived for 30 days.")) {
      try {
        await api.delete(`/video/equipment/${id}`);
        fetchData();
      } catch (error) {
        console.error("Failed to delete equipment", error);
        alert("Failed to delete equipment");
      }
    }
  };

  const handleEditClick = (item: VideoEquipment) => {
    setFormData({
      name: item.name,
      category: item.category,
      brand: item.brand || '',
      model: item.model || '',
      serialNumber: item.serialNumber || '',
      status: item.status,
      totalQuantity: item.totalQuantity || 1,
      availableQuantity: item.availableQuantity || 0,
      inUseQuantity: item.inUseQuantity || 0,
      maintenanceQuantity: item.maintenanceQuantity || 0,
      notes: item.notes || '',
      warehouseId: item.warehouseId?.toString() || '',
    });
    setEditingId(item.id);
    setActiveTab('add');
  };

  const handleAddClick = () => {
    setFormData({
      name: '',
      category: 'CAMERA',
      brand: '',
      model: '',
      serialNumber: '',
      status: 'AVAILABLE',
      notes: '',
    });
    setEditingId(null);
    setActiveTab('add');
  };

  const filteredEquipment = equipment.filter((item) => {
    if (filterCategory && item.category !== filterCategory) return false;
    if (filterStatus && item.status !== filterStatus) return false;
    return true;
  });

  const categories = [...new Set(equipment.map((e) => e.category))];
  const statuses = [...new Set(equipment.map((e) => e.status))];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'BOOKED':
        return 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
      case 'MAINTENANCE':
        return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'IN_USE':
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'RETIRED':
        return 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400';
      default:
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    }
  };

  const getCategoryLabel = (cat: string) => {
    const iconProps = { className: "w-4 h-4 inline-block mr-2", strokeWidth: 1.75 };
    switch (cat) {
      case 'CAMERA': return <span className="flex items-center"><Camera {...iconProps} /> Camera</span>;
      case 'LENS': return <span className="flex items-center"><Aperture {...iconProps} /> Lens</span>;
      case 'LIGHTING': return <span className="flex items-center"><Lightbulb {...iconProps} /> Lighting</span>;
      case 'AUDIO': return <span className="flex items-center"><Mic {...iconProps} /> Audio</span>;
      case 'STABILIZER': return <span className="flex items-center"><Film {...iconProps} /> Stabilizer</span>;
      case 'DRONE': return <span className="flex items-center"><Plane {...iconProps} /> Drone</span>;
      case 'EDITING_SYSTEM': return <span className="flex items-center"><Monitor {...iconProps} /> Editing System</span>;
      case 'ACCESSORY': return <span className="flex items-center"><Wrench {...iconProps} /> Accessory</span>;
      default: return cat;
    }
  };

  return (
    <div className="space-y-6 transition-colors">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Video Department</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-semibold border border-green-200 dark:border-green-800/30">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {equipment.filter(e => e.status === 'AVAILABLE').length} Available
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 font-semibold border border-orange-200 dark:border-orange-800/30">
              {equipment.filter(e => e.status === 'BOOKED').length} Booked
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-800/30">
              {equipment.filter(e => e.status === 'IN_USE').length} In Use
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 bg-white dark:bg-slate-800/50 rounded-t-xl overflow-hidden">
        <button
          onClick={() => setActiveTab('equipment')}
          className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'equipment' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
          }`}
        >
          Equipment Inventory
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'events' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
          }`}
        >
          Upcoming Events
        </button>
        <button
          onClick={handleAddClick}
          className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'add' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
          } flex items-center gap-2`}
        >
          <Plus className="w-4 h-4" /> {editingId ? 'Edit Equipment' : 'Add Equipment'}
        </button>
      </div>

      {/* Equipment Inventory Tab */}
      {activeTab === 'equipment' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Equipment Inventory</h3>
              <p className="text-xs text-slate-500 mt-1">{filteredEquipment.length} of {equipment.length} items shown</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="">All Statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Equipment</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Category</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Brand / Model</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Qty. Details</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {loading ? (
                  <tr><td colSpan={5} className="py-12 text-center text-slate-400">Loading equipment...</td></tr>
                ) : filteredEquipment.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-slate-400">
                    {equipment.length === 0 ? 'No equipment registered yet.' : 'No equipment matches the current filters.'}
                  </td></tr>
                ) : (
                  filteredEquipment.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="py-4 px-6">
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{item.name}</p>
                        {item.notes && <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">{item.notes}</p>}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-slate-600 dark:text-slate-300">{getCategoryLabel(item.category)}</span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.brand || '—'}</p>
                        <p className="text-[10px] text-slate-400">{item.model || ''}</p>
                        {item.serialNumber && <p className="text-[10px] font-mono text-slate-400 mt-1">SN: {item.serialNumber}</p>}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold text-slate-800 dark:text-white">
                            Total: {(item.availableQuantity || 0) + (item.inUseQuantity || 0) + (item.maintenanceQuantity || 0) || item.totalQuantity || 1}
                          </span>
                          <div className="flex gap-2 mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            <span className="text-green-600 dark:text-green-400" title="Available">Av: {item.availableQuantity ?? 1}</span>
                            <span className="text-blue-600 dark:text-blue-400" title="In Use">Use: {item.inUseQuantity || 0}</span>
                            <span className="text-orange-600 dark:text-orange-400" title="Maintenance">Mnt: {item.maintenanceQuantity || 0}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleEditClick(item)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
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
      )}

      {/* Upcoming Events Tab */}
      {activeTab === 'events' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white">Upcoming Video Events</h3>
            <p className="text-xs text-slate-500 mt-1">Video department inquiries and upcoming shoots</p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {upcomingEvents.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No upcoming video events found.</div>
            ) : (
              upcomingEvents.map((ev) => (
                <div key={ev.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex flex-col items-center justify-center">
                      <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase">
                        {new Date(ev.startDate).toLocaleString('default', { month: 'short' })}
                      </p>
                      <p className="text-lg font-black text-slate-800 dark:text-white">
                        {new Date(ev.startDate).getDate()}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">{ev.eventName}</h4>
                      <p className="text-xs text-slate-500">{ev.venue}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Client</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{ev.client?.companyName || ev.client?.contactPerson || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Days</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{ev.totalDays || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Status</p>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                        ev.status === 'CONFIRMED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        ev.status === 'COMPLETED' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                        'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                      }`}>
                        {ev.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Inquiry #</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{ev.inquiryNumber}</p>
                    </div>
                    <button
                      onClick={() => router.push(`/dashboard/inquiries/${ev.id}`)}
                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-80 transition-opacity flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> View Details
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Equipment Tab */}
      {activeTab === 'add' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">{editingId ? 'Edit Equipment' : 'Add New Equipment'}</h3>
              <p className="text-xs text-slate-500 mt-1">{editingId ? 'Modify existing equipment details' : 'Register new video production equipment'}</p>
            </div>
            {editingId && (
              <button 
                onClick={handleAddClick}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Switch to Add New
              </button>
            )}
          </div>

          <form onSubmit={handleAddEquipment} className="p-6 space-y-5 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Equipment Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Sony A7 III"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium"
                >
                  <option value="CAMERA">Camera</option>
                  <option value="LENS">Lens</option>
                  <option value="LIGHTING">Lighting</option>
                  <option value="AUDIO">Audio</option>
                  <option value="STABILIZER">Stabilizer</option>
                  <option value="DRONE">Drone</option>
                  <option value="EDITING_SYSTEM">Editing System</option>
                  <option value="ACCESSORY">Accessory</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="e.g. Sony"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="e.g. ILCE-7M3"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Serial Number (Optional)</label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                  placeholder="e.g. SN-00123456"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium font-mono placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
                  {editingId ? "Total Stock (Auto)" : "Quantity to Add"}
                </label>
                <input
                  type="number"
                  min="1"
                  readOnly={!!editingId}
                  value={formData.totalQuantity}
                  onChange={(e) => !editingId && setFormData(prev => ({ ...prev, totalQuantity: Math.max(1, parseInt(e.target.value) || 1), availableQuantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium ${editingId ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
              </div>

              {editingId && (
                <div className="md:col-span-2 bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                  <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Current Inventory Breakdown
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Available</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.availableQuantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, availableQuantity: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">In Use / Booked</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.inUseQuantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, inUseQuantity: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Maintenance</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.maintenanceQuantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, maintenanceQuantity: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 italic">Note: Available + In Use + Maintenance should equal Total Stock.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="BOOKED">Booked</option>
                  <option value="IN_USE">In Use</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Assign to Warehouse (Optional)</label>
                <select
                  value={formData.warehouseId}
                  onChange={(e) => setFormData(prev => ({ ...prev, warehouseId: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium appearance-none"
                >
                  <option value="">None (Unassigned)</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>{wh.name} - {wh.location}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Additional notes about this equipment..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : editingId ? 'Update Equipment' : 'Add Equipment'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('equipment')}
                className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
