"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { 
  ArrowLeft, Package, CheckCircle2, Truck, RotateCcw, AlertTriangle, Search, Box
} from "lucide-react";

interface WarehouseDetail {
  id: number;
  name: string;
  location: string;
  status: string;
  videoStock: any[];
  ledStock: any[];
  soundStock?: any[];
}

export default function WarehouseDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const warehouseId = params.id;
  
  const [warehouse, setWarehouse] = useState<WarehouseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchWarehouseDetails();
  }, [warehouseId]);

  const fetchWarehouseDetails = async () => {
    try {
      const { data } = await api.get(`/warehouse/${warehouseId}`);
      setWarehouse(data);
    } catch (error) {
      console.error("Failed to load warehouse details", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-400 font-bold">Loading warehouse details...</div>;
  }

  if (!warehouse) {
    return <div className="flex h-64 items-center justify-center text-slate-400 font-bold">Warehouse not found.</div>;
  }

  // Aggregate inventory
  const allInventory = [
    ...warehouse.videoStock.map(v => ({
      id: `vid-${v.id}`,
      name: v.name,
      category: v.category,
      brand: v.brand,
      totalQuantity: v.totalQuantity || 1, // Display actual video stock total quantity
      availableQuantity: v.availableQuantity !== undefined ? v.availableQuantity : (v.totalQuantity || 1),
      inUseQuantity: v.inUseQuantity || 0,
      maintenanceQuantity: v.maintenanceQuantity || 0,
      status: v.status,
      type: 'VIDEO'
    })),
    ...warehouse.ledStock.map(l => ({
      id: `led-${l.id}`,
      name: `${l.companyName} ${l.ledType}`,
      category: 'LED SCREEN',
      brand: l.companyName,
      totalQuantity: l.totalCabinets,
      availableQuantity: l.availableQuantity !== undefined ? l.availableQuantity : l.totalCabinets,
      inUseQuantity: l.inUseQuantity || 0,
      maintenanceQuantity: l.maintenanceQuantity || 0,
      status: l.status,
      type: 'LED'
    })),
    ...(warehouse.soundStock || []).map(s => ({
      id: `snd-${s.id}`,
      name: s.name,
      category: s.category,
      brand: s.brand,
      totalQuantity: s.totalQuantity || 1, // Display actual sound stock total quantity
      availableQuantity: s.availableQuantity !== undefined ? s.availableQuantity : (s.totalQuantity || 1),
      inUseQuantity: s.inUseQuantity || 0,
      maintenanceQuantity: s.maintenanceQuantity || 0,
      status: s.status,
      type: 'SOUND'
    }))
  ];

  const filteredInventory = allInventory.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate Stats
  const totalEquip = allInventory.length > 0 
    ? allInventory.reduce((acc, curr) => acc + curr.totalQuantity, 0)
    : 0;

  const availableStock = allInventory.length > 0
    ? allInventory.reduce((acc, curr) => acc + (curr.availableQuantity ?? 0), 0)
    : 0;
  const outForOrders = allInventory.length > 0
    ? allInventory.reduce((acc, curr) => acc + (curr.inUseQuantity ?? 0), 0)
    : 0;
  const damagedStock = allInventory.length > 0
    ? allInventory.reduce((acc, curr) => acc + (curr.maintenanceQuantity ?? 0), 0)
    : 0;

  const stats = [
    { label: "Total Equipment", value: totalEquip, icon: Package, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/50" },
    { label: "Available Stock", value: availableStock, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/50" },
    { label: "Out for Orders", value: outForOrders, icon: Truck, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/50" },
    { label: "Damaged Items", value: damagedStock, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push('/dashboard/warehouse')}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{warehouse.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{warehouse.location} • <span className="font-bold uppercase text-blue-600">{warehouse.status}</span></p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{s.value}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Box className="w-5 h-5 text-slate-400" /> Current Inventory
          </h3>
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search equipment..." 
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
                <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Type</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Equipment Name</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Category</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Qty. Details</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">No inventory found in this warehouse.</td>
                </tr>
              ) : (
                filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        item.type === 'VIDEO' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' :
                        item.type === 'LED' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400' :
                        'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.brand}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{item.category}</p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-slate-800 dark:text-white">
                          Total: {item.totalQuantity}
                        </span>
                        <div className="flex gap-2 mt-1 text-[10px] font-semibold justify-center">
                          <span className="text-green-600 dark:text-green-400" title="Available">Av: {item.availableQuantity}</span>
                          <span className="text-blue-600 dark:text-blue-400" title="In Use">Use: {item.inUseQuantity}</span>
                          <span className="text-orange-600 dark:text-orange-400" title="Maintenance">Mnt: {item.maintenanceQuantity}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'AVAILABLE' ? 'bg-[#e6f4ea] dark:bg-green-900/30 text-[#137333] dark:text-green-400' :
                        item.status === 'DAMAGED' ? 'bg-[#fce8e6] dark:bg-red-900/30 text-[#c5221f] dark:text-red-400' :
                        'bg-[#fef7e0] dark:bg-yellow-900/30 text-[#b06000] dark:text-yellow-400'
                      }`}>
                        {item.status?.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
