"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Search, Boxes, Filter, RotateCcw } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  warehouseName: string;
  totalQuantity: number;
  status: string;
  type: string;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Advanced Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterWarehouse, setFilterWarehouse] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [minQty, setMinQty] = useState<number | "">("");
  const [maxQty, setMaxQty] = useState<number | "">("");

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data } = await api.get("/warehouse");
      
      const allInventory: InventoryItem[] = [];
      data.forEach((warehouse: any) => {
        if (warehouse.videoStock) {
          warehouse.videoStock.forEach((v: any) => {
            allInventory.push({
              id: `vid-${v.id}`,
              name: v.name,
              category: v.category,
              brand: v.brand || 'N/A',
              warehouseName: warehouse.name,
              totalQuantity: v.totalQuantity || 1,
              status: v.status,
              type: 'VIDEO'
            });
          });
        }
        if (warehouse.ledStock) {
          warehouse.ledStock.forEach((l: any) => {
            allInventory.push({
              id: `led-${l.id}`,
              name: `${l.companyName} ${l.ledType}`,
              category: 'LED SCREEN',
              brand: l.companyName,
              warehouseName: warehouse.name,
              totalQuantity: l.totalCabinets,
              status: l.status,
              type: 'LED'
            });
          });
        }
        if (warehouse.soundStock) {
          warehouse.soundStock.forEach((s: any) => {
            allInventory.push({
              id: `snd-${s.id}`,
              name: s.name,
              category: s.category,
              brand: s.brand || 'N/A',
              warehouseName: warehouse.name,
              totalQuantity: s.totalQuantity || 1,
              status: s.status,
              type: 'SOUND'
            });
          });
        }
      });
      setInventory(allInventory);
    } catch (error) {
      console.error("Failed to load inventory", error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic selection lists extracted from active inventory
  const warehousesList = Array.from(new Set(inventory.map(item => item.warehouseName))).sort();
  const categoriesList = Array.from(new Set(inventory.map(item => item.category))).sort();

  const filtered = inventory.filter(item => {
    // 1. Text Search matching
    const matchesSearch = 
      item.name.toLowerCase().includes(search.toLowerCase()) || 
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.warehouseName.toLowerCase().includes(search.toLowerCase());
      
    // 2. Department/Type matching
    const matchesType = filterType === "ALL" || item.type === filterType;
    
    // 3. Warehouse location matching
    const matchesWarehouse = filterWarehouse === "ALL" || item.warehouseName === filterWarehouse;
    
    // 4. Status matching
    const matchesStatus = filterStatus === "ALL" || item.status === filterStatus;
    
    // 5. Category matching
    const matchesCategory = filterCategory === "ALL" || item.category === filterCategory;
    
    // 6. Range total quantity matching
    const matchesMinQty = minQty === "" || item.totalQuantity >= Number(minQty);
    const matchesMaxQty = maxQty === "" || item.totalQuantity <= Number(maxQty);
    
    return matchesSearch && matchesType && matchesWarehouse && matchesStatus && matchesCategory && matchesMinQty && matchesMaxQty;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Equipment Stock
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Global view of all equipment across all warehouses.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex justify-between items-center gap-4">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search equipment or warehouse..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-center ${
                showFilters 
                  ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
              title="Advanced Filters"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
              {/* Type/Department Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">Department</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="ALL">All Departments</option>
                  <option value="VIDEO">Video</option>
                  <option value="LED">LED Screen</option>
                  <option value="SOUND">Sound</option>
                </select>
              </div>

              {/* Warehouse Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">Warehouse</label>
                <select
                  value={filterWarehouse}
                  onChange={(e) => setFilterWarehouse(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="ALL">All Warehouses</option>
                  {warehousesList.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="BOOKED">Booked</option>
                  <option value="IN_USE">In Use</option>
                  <option value="DAMAGED">Damaged</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="ALL">All Categories</option>
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Quantity Min/Max Range */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">Min Qty</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minQty}
                    onChange={(e) => setMinQty(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs font-semibold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">Max Qty</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxQty}
                    onChange={(e) => setMaxQty(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs font-semibold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Reset Control */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterType("ALL");
                    setFilterWarehouse("ALL");
                    setFilterStatus("ALL");
                    setFilterCategory("ALL");
                    setMinQty("");
                    setMaxQty("");
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
                <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Type</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Equipment Name</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Category</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Warehouse</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Qty</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading inventory...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No equipment found.</td>
                </tr>
              ) : (
                filtered.map((item) => (
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
                    <td className="py-4 px-6">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{item.warehouseName}</p>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{item.totalQuantity}</p>
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
