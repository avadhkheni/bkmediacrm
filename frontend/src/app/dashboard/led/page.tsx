"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { usePermission } from "@/lib/usePermission";
import { Plus, Pencil, Trash2, Users } from "lucide-react";

interface LedStock {
  id: number;
  companyName: string;
  ledType: string;
  cabinetHeightMm: number;
  cabinetWidthMm: number;
  cabinetsPerBox: number;
  totalCabinets: number;
  availableQuantity?: number;
  inUseQuantity?: number;
  maintenanceQuantity?: number;
  pricingSqft: number;
  totalBoxes: number;
  status: string;
}

export default function LedDepartmentPage() {
  const router = useRouter();
  const { hasPermission } = usePermission();

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname === "/dashboard/led") {
      router.replace("/dashboard/teams?tab=led");
    }
  }, [router]);

  const [stock, setStock] = useState<LedStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stock' | 'calculator' | 'dispatch'>('stock');
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  // Calculator State
  const [calcHeight, setCalcHeight] = useState(10);
  const [calcWidth, setCalcWidth] = useState(12);
  const [calcType, setCalcType] = useState('P2.5');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stockRes, inquiriesRes] = await Promise.all([
        api.get("/led/stock"),
        api.get("/inquiries?dept=LED")
      ]);
      setStock(stockRes.data);
      setUpcomingEvents(inquiriesRes.data.data || []);
    } catch (error) {
      console.error("Failed to load LED data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this LED stock? It will be archived for 30 days.")) {
      try {
        await api.delete(`/led/stock/${id}`);
        fetchData();
      } catch (error) {
        console.error("Failed to delete stock", error);
        alert("Failed to delete stock");
      }
    }
  };

  const calculateCabinets = () => {
    // 0.5m x 0.5m standard cabinet for simplicity in calculation (500mm x 500mm)
    // height ft to meters: ft * 0.3048
    const heightM = calcHeight * 0.3048;
    const widthM = calcWidth * 0.3048;
    
    // Cabinets needed (assuming 0.5m x 0.5m)
    const cabsH = Math.ceil(heightM / 0.5);
    const cabsW = Math.ceil(widthM / 0.5);
    const total = cabsH * cabsW;
    const sqft = calcHeight * calcWidth;

    return { cabsH, cabsW, total, sqft };
  };

  const calcResults = calculateCabinets();

  return (
    <div className="space-y-6 transition-colors">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">LED Department</h2>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 bg-white dark:bg-slate-800/50 rounded-t-xl overflow-hidden">
        <button 
          onClick={() => setActiveTab('stock')}
          className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'stock' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
          }`}
        >
          Stock Inventory
        </button>
        <button 
          onClick={() => setActiveTab('calculator')}
          className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'calculator' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
          }`}
        >
          Screen Size Calculator
        </button>
        <button 
          onClick={() => setActiveTab('dispatch')}
          className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'dispatch' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
          }`}
        >
          Dispatch Overview
        </button>
        
      </div>

      {activeTab === 'stock' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">LED Inventory</h3>
              <p className="text-xs text-slate-500 mt-1">Manage your warehouse stock</p>
            </div>
            {hasPermission("WORK_TEAMS", "canCreate") && (
              <button 
                onClick={() => router.push('/dashboard/led/new')}
                className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add LED Stock
              </button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Company</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Type</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cabinet Size</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Capacity</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Rate/Sqft</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Packaging</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {loading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-slate-400">Loading stock...</td></tr>
                ) : stock.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-slate-400">No LED stock registered yet.</td></tr>
                ) : (
                  stock.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="py-4 px-6">
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{item.companyName}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold uppercase">
                          {item.ledType}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                        {item.cabinetWidthMm}×{item.cabinetHeightMm} mm
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex flex-col items-center">
                          <p className="text-sm font-bold text-slate-800 dark:text-white">
                            {(item.availableQuantity || 0) + (item.inUseQuantity || 0) + (item.maintenanceQuantity || 0) || item.totalCabinets || 0}
                          </p>
                          <div className="flex gap-1.5 mt-1 justify-center text-[9px] font-medium text-slate-500 dark:text-slate-400">
                            <span className="text-green-600 dark:text-green-400">Av: {item.availableQuantity ?? item.totalCabinets}</span>
                            <span className="text-blue-600 dark:text-blue-400">Use: {item.inUseQuantity || 0}</span>
                            <span className="text-orange-600 dark:text-orange-400">Mnt: {item.maintenanceQuantity || 0}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-black text-blue-600 dark:text-blue-400">
                        ₹{item.pricingSqft}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.totalBoxes} Boxes</p>
                        <p className="text-[10px] text-slate-400">{item.cabinetsPerBox} per box</p>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          {hasPermission("WORK_TEAMS", "canUpdate") && (
                            <button 
                              onClick={() => router.push(`/dashboard/led/new?id=${item.id}`)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission("WORK_TEAMS", "canDelete") && (
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white">Dimensions</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Height (Feet)</label>
                <input 
                  type="number" 
                  min="0"
                  value={calcHeight} 
                  onChange={(e) => setCalcHeight(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Width (Feet)</label>
                <input 
                  type="number" 
                  min="0"
                  value={calcWidth} 
                  onChange={(e) => setCalcWidth(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">LED Pitch</label>
                <select 
                  value={calcType}
                  onChange={(e) => setCalcType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold"
                >
                  <option>P2.5</option>
                  <option>P3.9</option>
                  <option>P4.8</option>
                </select>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-lg flex flex-col justify-between">
              <div>
                <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-2">Total Cabinets Needed</p>
                <h4 className="text-5xl font-black">{calcResults.total}</h4>
              </div>
              <div className="mt-8 flex gap-4">
                <div className="bg-blue-500/50 rounded-xl p-3 flex-1">
                  <p className="text-[10px] opacity-70 uppercase font-black">Width</p>
                  <p className="font-bold">{calcResults.cabsW} Cabs</p>
                </div>
                <div className="bg-blue-500/50 rounded-xl p-3 flex-1">
                  <p className="text-[10px] opacity-70 uppercase font-black">Height</p>
                  <p className="font-bold">{calcResults.cabsH} Cabs</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Total Square Feet</p>
                <h4 className="text-4xl font-black text-slate-800 dark:text-white">{calcResults.sqft} <span className="text-xl opacity-50 font-medium">sqft</span></h4>
              </div>
              <div className="mt-8 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Actual Size (m)</span>
                  <span className="font-bold text-slate-800 dark:text-white">{(calcResults.cabsW * 0.5).toFixed(2)}m × {(calcResults.cabsH * 0.5).toFixed(2)}m</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Pixels (approx)</span>
                  <span className="font-bold text-slate-800 dark:text-white">{(calcResults.cabsW * 192)} × {(calcResults.cabsH * 192)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dispatch' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white">Upcoming LED Dispatches</h3>
            <p className="text-xs text-slate-500 mt-1">Events requiring LED screens in the next 7 days</p>
          </div>
          
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {upcomingEvents.length === 0 ? (
              <div className="py-12 text-center text-slate-400">No upcoming LED events found.</div>
            ) : (
              upcomingEvents.map((ev) => (
                <div key={ev.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex flex-col items-center justify-center">
                      <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase">{new Date(ev.startDate).toLocaleString('default', { month: 'short' })}</p>
                      <p className="text-lg font-black text-slate-800 dark:text-white">{new Date(ev.startDate).getDate()}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">{ev.eventName}</h4>
                      <p className="text-xs text-slate-500">{ev.venue}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Status</p>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                        ev.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {ev.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Inquiry #</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{ev.inquiryNumber}</p>
                    </div>
                    <button 
                      onClick={() => router.push(`/dashboard/led/inquiry?id=${ev.id}`)}
                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-80 transition-opacity"
                    >
                      Dispatch
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      
    </div>
  );
}
