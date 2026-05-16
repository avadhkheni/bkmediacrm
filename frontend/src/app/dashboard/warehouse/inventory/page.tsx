"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Search, Boxes } from "lucide-react";

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
              totalQuantity: 1,
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
      });
      setInventory(allInventory);
    } catch (error) {
      console.error("Failed to load inventory", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = inventory.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.category.toLowerCase().includes(search.toLowerCase()) ||
    item.warehouseName.toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search equipment or warehouse..." 
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
                        item.type === 'VIDEO' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400'
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
