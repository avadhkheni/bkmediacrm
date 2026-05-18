"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import { useEffect } from "react";

export default function NewLedStockPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm();

  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const whRes = await api.get('/warehouse');
        setWarehouses(whRes.data);
        
        if (editId) {
          const res = await api.get(`/led/stock/${editId}`);
          reset(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      }
    };
    fetchInitialData();
  }, [editId, reset]);

  const available = watch("availableQuantity");
  const inUse = watch("inUseQuantity");
  const maintenance = watch("maintenanceQuantity");

  useEffect(() => {
    if (editId) {
      const total = Number(available || 0) + Number(inUse || 0) + Number(maintenance || 0);
      setValue("totalCabinets", total);
    }
  }, [available, inUse, maintenance, editId, setValue]);

  const onSubmit = async (data: any) => {
    try {
      if (editId) {
        await api.patch(`/led/stock/${editId}`, {
          ...data,
          cabinetHeightMm: Number(data.cabinetHeightMm),
          cabinetWidthMm: Number(data.cabinetWidthMm),
          cabinetsPerBox: Number(data.cabinetsPerBox),
          totalCabinets: Number(data.totalCabinets),
          pricingSqft: Number(data.pricingSqft),
        });
      } else {
        await api.post("/led/stock", {
          ...data,
          cabinetHeightMm: Number(data.cabinetHeightMm),
          cabinetWidthMm: Number(data.cabinetWidthMm),
          cabinetsPerBox: Number(data.cabinetsPerBox),
          totalCabinets: Number(data.totalCabinets),
          pricingSqft: Number(data.pricingSqft),
        });
      }
      router.push("/dashboard/teams?tab=led");
    } catch (error) {
      console.error("Failed to add LED stock", error);
      alert("Failed to add LED stock");
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          {editId ? 'Edit LED Stock' : 'Add New LED Stock'}
        </h2>
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">Cancel</button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Company Name</label>
            <input 
              {...register("companyName", { required: true })} 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold"
              placeholder="e.g. Absen, Unilumin"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">LED Type / Pitch</label>
            <input 
              {...register("ledType", { required: true })} 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold"
              placeholder="e.g. P2.5, P3.9"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">{editId ? 'Total Cabinets (Auto)' : 'Total Cabinets'}</label>
            <input 
              type="number"
              min="1"
              readOnly={!!editId}
              {...register("totalCabinets", { required: true, min: 1 })} 
              className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold ${editId ? 'opacity-70 cursor-not-allowed' : ''}`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Cabinet Width (mm)</label>
            <input 
              type="number"
              min="0"
              {...register("cabinetWidthMm", { required: true, min: 0 })} 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold"
              defaultValue={500}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Cabinet Height (mm)</label>
            <input 
              type="number"
              min="0"
              {...register("cabinetHeightMm", { required: true, min: 0 })} 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold"
              defaultValue={500}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Cabinets Per Box</label>
            <input 
              type="number"
              min="1"
              {...register("cabinetsPerBox", { required: true, min: 1 })} 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold"
              defaultValue={8}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Rate Per Sqft (₹)</label>
            <input 
              type="number"
              min="0"
              {...register("pricingSqft", { required: true, min: 0 })} 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold"
              placeholder="e.g. 150"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Status</label>
            <select 
              {...register("status")} 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold appearance-none"
              defaultValue="AVAILABLE"
            >
              <option value="AVAILABLE">Available</option>
              <option value="IN_MAINTENANCE">In Maintenance</option>
              <option value="DAMAGED">Damaged</option>
            </select>
          </div>

          {editId && (
            <div className="col-span-2 bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 grid grid-cols-3 gap-4">
              <h4 className="col-span-3 text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase mb-2 tracking-widest">Inventory Breakdown</h4>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Available</label>
                <input 
                  type="number"
                  min="0"
                  {...register("availableQuantity", { min: 0 })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">In Use</label>
                <input 
                  type="number"
                  min="0"
                  {...register("inUseQuantity", { min: 0 })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Maint.</label>
                <input 
                  type="number"
                  min="0"
                  {...register("maintenanceQuantity", { min: 0 })}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold text-sm"
                />
              </div>
            </div>
          )}
          
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Assign to Warehouse (Optional)</label>
            <select 
              {...register("warehouseId")} 
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold appearance-none"
            >
              <option value="">None (Unassigned)</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>{wh.name} - {wh.location}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg disabled:opacity-70"
        >
          {isSubmitting ? "Saving..." : editId ? "Update LED Stock" : "Register LED Stock"}
        </button>
      </form>
    </div>
  );
}
