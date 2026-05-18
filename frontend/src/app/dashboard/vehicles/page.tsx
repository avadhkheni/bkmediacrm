"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  Plus, 
  Search, 
  Truck, 
  Pencil, 
  Trash2, 
  Loader2, 
  Navigation,
  FileText,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Hash
} from "lucide-react";

interface Vehicle {
  id: number;
  name: string;
  numberPlate: string;
  vehicleType: string;
  capacityNotes: string | null;
  isActive: boolean;
  dispatchStaffAssignments: any[];
}

export default function VehiclesMasterPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    numberPlate: "",
    vehicleType: "TRUCK",
    capacityNotes: "",
    isActive: true
  });

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/vehicles");
      setVehicles(data || []);
    } catch (error) {
      console.error("Failed to fetch vehicles", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/vehicles/${editingId}`, formData);
      } else {
        await api.post("/vehicles", formData);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({
        name: "",
        numberPlate: "",
        vehicleType: "TRUCK",
        capacityNotes: "",
        isActive: true
      });
      fetchVehicles();
    } catch (error) {
      console.error("Failed to save vehicle", error);
      alert("Failed to save vehicle. Please check that number plate is unique.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (v: Vehicle) => {
    setFormData({
      name: v.name,
      numberPlate: v.numberPlate,
      vehicleType: v.vehicleType,
      capacityNotes: v.capacityNotes || "",
      isActive: v.isActive
    });
    setEditingId(v.id);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    const v = vehicles.find(item => item.id === id);
    if (!v) return;
    
    if (v.dispatchStaffAssignments && v.dispatchStaffAssignments.length > 0) {
      alert("Cannot delete this vehicle because it has active event dispatch assignments.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        await api.delete(`/vehicles/${id}`);
        fetchVehicles();
      } catch (error) {
        console.error("Failed to delete vehicle", error);
        alert("Failed to delete vehicle.");
      }
    }
  };

  const handleToggleActive = async (v: Vehicle) => {
    try {
      await api.put(`/vehicles/${v.id}`, { isActive: !v.isActive });
      fetchVehicles();
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesType = selectedType === "ALL" || v.vehicleType === selectedType;
    const matchesQuery = 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.numberPlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.capacityNotes || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesQuery;
  });

  const vehicleTypes = ["ALL", "TRUCK", "VAN", "TEMPO", "CAR", "BIKE"];

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-4 md:p-6 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Truck className="w-8 h-8 text-blue-600" />
            Company Fleet & Vehicles
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage company vehicles, driver logs, capacities, and active dispatches.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: "", numberPlate: "", vehicleType: "TRUCK", capacityNotes: "", isActive: true });
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" /> Add New Vehicle
        </button>
      </div>

      {/* Grid of Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Fleet", value: vehicles.filter(v => v.isActive).length, icon: Truck, color: "bg-blue-500 text-white" },
          { label: "Total Fleet", value: vehicles.length, icon: Navigation, color: "bg-slate-900 dark:bg-slate-700 text-white" },
          { label: "Active Dispatches", value: vehicles.filter(v => v.dispatchStaffAssignments && v.dispatchStaffAssignments.length > 0).length, icon: Hash, color: "bg-emerald-500 text-white" },
          { label: "In Maintenance / Inactive", value: vehicles.filter(v => !v.isActive).length, icon: ShieldAlert, color: "bg-orange-500 text-white" },
        ].map((item, index) => (
          <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center justify-between group hover:border-blue-500/30 transition-all duration-300">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{item.label}</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1 transition-transform duration-300 origin-left">{item.value}</h3>
            </div>
            <div className={`p-4 rounded-2xl ${item.color} flex items-center justify-center shrink-0`}>
              <item.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="flex bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-x-auto self-start">
          {vehicleTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedType === type
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-700"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by vehicle name, plate number, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Fleet Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
          <p className="font-semibold text-sm">Loading company fleet...</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="py-24 text-center text-slate-400">
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-sm">No vehicles found in fleet.</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting filters or registering a new company vehicle.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => {
            const hasDispatches = vehicle.dispatchStaffAssignments && vehicle.dispatchStaffAssignments.length > 0;
            return (
              <div 
                key={vehicle.id} 
                className={`bg-white dark:bg-slate-800 rounded-3xl border ${
                  vehicle.isActive 
                    ? "border-slate-200/60 dark:border-slate-700/60" 
                    : "border-slate-100 dark:border-slate-900 opacity-60"
                } shadow-sm p-6 hover:shadow-md hover:border-blue-500/30 transition-all duration-300 relative group flex flex-col justify-between`}
              >
                <div>
                  {/* Top Stats */}
                  <div className="flex justify-between items-start">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${
                      vehicle.vehicleType === "TRUCK" ? "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-450 border-rose-100 dark:border-rose-900/30" :
                      vehicle.vehicleType === "VAN" ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-450 border-blue-100 dark:border-blue-900/30" :
                      vehicle.vehicleType === "TEMPO" ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-450 border-amber-100 dark:border-amber-900/30" :
                      vehicle.vehicleType === "CAR" ? "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-450 border-purple-100 dark:border-purple-900/30" :
                      vehicle.vehicleType === "BIKE" ? "bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-450 border-teal-100 dark:border-teal-900/30" :
                      "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-700"
                    }`}>
                      {vehicle.vehicleType}
                    </span>
                    <button 
                      onClick={() => handleToggleActive(vehicle)}
                      title={vehicle.isActive ? "Deactivate Vehicle" : "Activate Vehicle"}
                      className="text-slate-400 hover:text-blue-500 transition-colors"
                    >
                      {vehicle.isActive ? <ToggleRight className="w-6 h-6 text-blue-600" /> : <ToggleLeft className="w-6 h-6 text-slate-350" />}
                    </button>
                  </div>

                  {/* Title & Plate */}
                  <div className="mt-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white leading-tight flex items-center gap-2">
                      {vehicle.name}
                    </h3>
                    <div className="mt-2 inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-850 font-mono text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                      {vehicle.numberPlate}
                    </div>
                  </div>

                  {/* Capacity / notes */}
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 leading-relaxed font-medium">
                    {vehicle.capacityNotes || "No capacity logs or special notes registered."}
                  </p>
                </div>

                {/* Bottom section */}
                <div className="mt-6 pt-4 border-t border-slate-50 dark:border-slate-750 flex items-center justify-between">
                  <div>
                    {hasDispatches ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        On Dispatch Assignment
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                        Available in Yard
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleEdit(vehicle)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                      title="Edit Fleet Details"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle.id)}
                      disabled={hasDispatches}
                      className={`p-2 rounded-xl transition-all ${
                        hasDispatches 
                          ? "text-slate-200 cursor-not-allowed dark:text-slate-800" 
                          : "text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                      }`}
                      title={hasDispatches ? "Cannot delete assigned vehicle" : "Delete Vehicle"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CRUD Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                <Truck className="w-6 h-6 text-blue-500" />
                {editingId ? "Edit Fleet Vehicle" : "Register Fleet Vehicle"}
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">Add fleet asset name, type, registration plate, and capacity details.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">Vehicle Name / Model *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
                    placeholder="e.g. Tata Ultra T.7 (17ft Container)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">Vehicle Type *</label>
                    <select
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
                    >
                      <option value="TRUCK">TRUCK</option>
                      <option value="VAN">VAN</option>
                      <option value="TEMPO">TEMPO</option>
                      <option value="CAR">CAR</option>
                      <option value="BIKE">BIKE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">Number Plate *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.numberPlate}
                      onChange={(e) => setFormData({...formData, numberPlate: e.target.value.toUpperCase()})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm font-mono uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white font-bold tracking-widest"
                      placeholder="MH 12 AB 1234"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">Capacity Details / Logs</label>
                  <textarea 
                    value={formData.capacityNotes}
                    onChange={(e) => setFormData({...formData, capacityNotes: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white resize-none"
                    rows={3}
                    placeholder="Describe load capacity, volumetric space, driver name, insurance details..."
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-2xl transition-all disabled:opacity-50 text-sm shadow-md"
                >
                  {submitting ? "Saving..." : editingId ? "Update Asset" : "Register Asset"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold py-3.5 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
