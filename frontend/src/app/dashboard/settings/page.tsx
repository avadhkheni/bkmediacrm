"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";

interface LedTypeRate {
  id: number;
  ledType: string;
  ratePerSqftPerDay: number;
}

interface Vehicle {
  id: number;
  name: string;
  numberPlate: string;
  vehicleType: string;
  capacityNotes?: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"led-rates" | "vehicles">(tab === "vehicles" ? "vehicles" : "led-rates");
  const [ledRates, setLedRates] = useState<LedTypeRate[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // LED rate edit state
  const [editingRate, setEditingRate] = useState<number | null>(null);
  const [rateValue, setRateValue] = useState("");

  // Vehicle form state
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const [vehicleForm, setVehicleForm] = useState({ name: "", numberPlate: "", vehicleType: "TRUCK", capacityNotes: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [ratesRes, vehiclesRes] = await Promise.all([
        api.get("/led/type-rates"),
        api.get("/vehicles"),
      ]);
      setLedRates(ratesRes.data);
      setVehicles(vehiclesRes.data);
    } catch (error) {
      console.error("Failed to load settings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRateSave = async (id: number) => {
    try {
      await api.put(`/led/type-rates/${id}`, { ratePerSqftPerDay: Number(rateValue) });
      setEditingRate(null);
      fetchAll();
    } catch (error) {
      console.error("Failed to update rate", error);
      alert("Failed to update rate");
    }
  };

  const handleSubmitVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingVehicleId) {
        await api.put(`/vehicles/${editingVehicleId}`, vehicleForm);
      } else {
        await api.post("/vehicles", vehicleForm);
      }
      setShowVehicleForm(false);
      setEditingVehicleId(null);
      setVehicleForm({ name: "", numberPlate: "", vehicleType: "TRUCK", capacityNotes: "" });
      fetchAll();
    } catch (error) {
      console.error("Failed to save vehicle", error);
      alert("Failed to save vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditVehicle = (v: Vehicle) => {
    setVehicleForm({
      name: v.name,
      numberPlate: v.numberPlate,
      vehicleType: v.vehicleType,
      capacityNotes: v.capacityNotes || ""
    });
    setEditingVehicleId(v.id);
    setShowVehicleForm(true);
  };

  const handleDeleteVehicle = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this vehicle? It will be archived for 30 days.")) {
      try {
        await api.delete(`/vehicles/${id}`);
        fetchAll();
      } catch (error: any) {
        console.error("Failed to delete vehicle", error);
        alert(error.response?.data?.message || "Failed to delete vehicle");
      }
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Settings</h2>

      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab("led-rates")}
          className={`px-4 py-2 border-b-2 font-medium text-sm ${activeTab === "led-rates" ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          LED Type Rates
        </button>
        <button
          onClick={() => setActiveTab("vehicles")}
          className={`px-4 py-2 border-b-2 font-medium text-sm ${activeTab === "vehicles" ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Vehicles
        </button>
      </div>

      {activeTab === "led-rates" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-white">LED Type Rates</h3>
            <p className="text-xs text-slate-500 mt-1">Per sq.ft per day rates. These are used when creating LED quotations.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase">LED Type</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase text-right">Rate (₹/sq.ft/day)</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {ledRates.map(rate => (
                  <tr key={rate.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-6 text-sm font-medium text-slate-900 dark:text-white">
                      <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs font-bold">{rate.ledType}</span>
                    </td>
                    <td className="py-3 px-6 text-sm text-right">
                      {editingRate === rate.id ? (
                        <input
                          type="number"
                          value={rateValue}
                          onChange={e => setRateValue(e.target.value)}
                          className="w-24 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-right"
                          autoFocus
                        />
                      ) : (
                        <span className="font-bold text-slate-900 dark:text-white">₹{rate.ratePerSqftPerDay}</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-sm text-right">
                      {editingRate === rate.id ? (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => handleRateSave(rate.id)} className="text-green-600 font-medium hover:text-green-800">Save</button>
                          <button onClick={() => setEditingRate(null)} className="text-slate-500 font-medium hover:text-slate-700">Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingRate(rate.id); setRateValue(String(rate.ratePerSqftPerDay)); }}
                          className="text-blue-600 font-medium hover:text-blue-800"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "vehicles" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowVehicleForm(!showVehicleForm);
                if (!showVehicleForm) {
                  setEditingVehicleId(null);
                  setVehicleForm({ name: "", numberPlate: "", vehicleType: "TRUCK", capacityNotes: "" });
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm"
            >
              {showVehicleForm ? "Cancel" : "+ Add Vehicle"}
            </button>
          </div>

          {showVehicleForm && (
            <form onSubmit={handleSubmitVehicle} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">
                {editingVehicleId ? "Edit Vehicle" : "Add New Vehicle"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
                  <input type="text" required placeholder="e.g. Tata Ace, Mahindra Pickup" value={vehicleForm.name} onChange={e => setVehicleForm({ ...vehicleForm, name: e.target.value })} className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Number Plate *</label>
                  <input type="text" required placeholder="e.g. MH-01-AB-1234" value={vehicleForm.numberPlate} onChange={e => setVehicleForm({ ...vehicleForm, numberPlate: e.target.value })} className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type *</label>
                  <select value={vehicleForm.vehicleType} onChange={e => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })} className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                    <option value="TRUCK">Truck</option>
                    <option value="TEMPO">Tempo</option>
                    <option value="CAR">Car</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Capacity Notes</label>
                  <input type="text" placeholder="e.g. 1.5 Ton, Fits 20 LED cabinets" value={vehicleForm.capacityNotes} onChange={e => setVehicleForm({ ...vehicleForm, capacityNotes: e.target.value })} className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-70">
                  {submitting ? "Saving..." : editingVehicleId ? "Update Vehicle" : "Create Vehicle"}
                </button>
              </div>
            </form>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase">Name</th>
                    <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase">Number Plate</th>
                    <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase">Type</th>
                    <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase">Capacity</th>
                    <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {vehicles.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-6 text-sm font-medium text-slate-900 dark:text-white">{v.name}</td>
                      <td className="py-3 px-6 text-sm text-slate-700 dark:text-slate-300 font-mono">{v.numberPlate}</td>
                      <td className="py-3 px-6 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${v.vehicleType === "TRUCK" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" : v.vehicleType === "TEMPO" ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600" : "bg-slate-100 dark:bg-slate-700 text-slate-600"}`}>
                          {v.vehicleType}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-sm text-slate-700 dark:text-slate-300">{v.capacityNotes || "-"}</td>
                      <td className="py-3 px-6 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${v.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700"}`}>
                          {v.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex justify-end gap-3">
                          <button 
                            onClick={() => handleEditVehicle(v)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteVehicle(v.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {vehicles.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">No vehicles registered.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
