"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Truck, Users, Package, Plus, Trash2, Box } from "lucide-react";

interface DispatchTabProps {
  inquiryId: number;
  department: string;
}

export default function DispatchTab({ inquiryId, department }: DispatchTabProps) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  
  const [staffAssignments, setStaffAssignments] = useState<any[]>([]);
  const [ledBoxes, setLedBoxes] = useState<any[]>([]);

  // Form states
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  
  const [ledBoxForm, setLedBoxForm] = useState({
    vehicleName: "",
    vehicleNumber: "",
    companyName: "",
    numBoxes: 1,
    cabinetsPerBox: 6,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [inquiryId]);

  const fetchData = async () => {
    try {
      const [vRes, sRes, saRes, lbRes] = await Promise.all([
        api.get("/settings/vehicles"), // Need to make sure this endpoint exists or just use a mock or fetch if it exists. Actually, we can fetch from generic /vehicles if settings/vehicles is what was made before. Let's try /settings/vehicles. Wait, in Sidebar it says /dashboard/settings?tab=vehicles so the API might be /vehicles.
        api.get("/staff"),
        api.get(`/dispatch/staff?inquiryId=${inquiryId}`),
        department === 'LED' ? api.get(`/dispatch/led-boxes?inquiryId=${inquiryId}`) : Promise.resolve({ data: [] })
      ]);

      setVehicles(vRes.data || []);
      setStaff(sRes.data || []);
      setStaffAssignments(saRes.data || []);
      setLedBoxes(lbRes.data || []);
    } catch (error) {
      console.error("Failed to load dispatch data", error);
      // Fallback if /settings/vehicles doesn't exist
      try {
        const vRes = await api.get("/vehicles");
        setVehicles(vRes.data || []);
      } catch (e) {
        console.log("No vehicles found");
      }
    } finally {
      setLoading(false);
    }
  };

  const assignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !selectedStaffId) return;
    try {
      await api.post("/dispatch/staff", {
        inquiryId,
        vehicleId: selectedVehicleId,
        staffId: selectedStaffId
      });
      setSelectedStaffId("");
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to assign staff");
    }
  };

  const removeStaff = async (id: number) => {
    if (!window.confirm("Remove this staff from the vehicle?")) return;
    try {
      await api.delete(`/dispatch/staff/${id}`);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const addLedBox = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/dispatch/led-boxes", {
        inquiryId,
        ...ledBoxForm
      });
      setLedBoxForm({
        vehicleName: "",
        vehicleNumber: "",
        companyName: "",
        numBoxes: 1,
        cabinetsPerBox: 6,
      });
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to add box");
    }
  };

  const removeLedBox = async (id: number) => {
    if (!window.confirm("Remove this box entry?")) return;
    try {
      await api.delete(`/dispatch/led-boxes/${id}`);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Dispatch Data...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* LEFT: Staff & Vehicle Assignment */}
      <div className="space-y-6">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Truck className="w-5 h-5 text-blue-500" />
          Vehicle & Staff Assignments
        </h3>

        <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm">
          <form onSubmit={assignStaff} className="flex flex-col gap-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Vehicle</label>
                <select 
                  required
                  value={selectedVehicleId} 
                  onChange={e => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-medium text-slate-900 dark:text-white"
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.numberPlate})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Staff Member</label>
                <select 
                  required
                  value={selectedStaffId} 
                  onChange={e => setSelectedStaffId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-medium text-slate-900 dark:text-white"
                >
                  <option value="">Select Staff</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - {s.role}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
              <Plus className="w-4 h-4" /> Assign to Vehicle
            </button>
          </form>

          <div className="space-y-3">
            {staffAssignments.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">No staff assigned to vehicles yet.</p>
            ) : (
              staffAssignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{assignment.staff.name}</p>
                    <p className="text-xs text-slate-500">Vehicle: <span className="font-semibold text-slate-700 dark:text-slate-300">{assignment.vehicle.name} ({assignment.vehicle.numberPlate})</span></p>
                  </div>
                  <button onClick={() => removeStaff(assignment.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: LED Box Dispatch */}
      {department === 'LED' && (
        <div className="space-y-6">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-500" />
            LED Manual Box Loading
          </h3>

          <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm">
            <form onSubmit={addLedBox} className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Company / Lot</label>
                  <input 
                    required type="text" placeholder="e.g. Novastar Lot A"
                    value={ledBoxForm.companyName} onChange={e => setLedBoxForm({...ledBoxForm, companyName: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Vehicle Name/No.</label>
                  <input 
                    required type="text" placeholder="e.g. Tempo GJ05XX"
                    value={ledBoxForm.vehicleName} onChange={e => setLedBoxForm({...ledBoxForm, vehicleName: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Number of Boxes</label>
                  <input 
                    required type="number" min="1"
                    value={ledBoxForm.numBoxes} onChange={e => setLedBoxForm({...ledBoxForm, numBoxes: parseInt(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Cabinets per Box</label>
                  <input 
                    required type="number" min="1"
                    value={ledBoxForm.cabinetsPerBox} onChange={e => setLedBoxForm({...ledBoxForm, cabinetsPerBox: parseInt(e.target.value)})}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                <Box className="w-4 h-4" /> Log Loaded Boxes
              </button>
            </form>

            <div className="space-y-3">
              {ledBoxes.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">No boxes logged for dispatch yet.</p>
              ) : (
                ledBoxes.map((box) => (
                  <div key={box.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-xs font-black">{box.numBoxes}</span>
                        <span className="text-[8px] uppercase font-bold">Boxes</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{box.companyName}</p>
                        <p className="text-xs text-slate-500">
                          {box.totalCabinets} Total Cabinets ({box.cabinetsPerBox}/box) via {box.vehicleName}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => removeLedBox(box.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
