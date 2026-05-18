"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import api from "@/lib/api";

export default function NewQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const inquiryId = params.id as string;
  
  const [inquiry, setInquiry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [warehouseStock, setWarehouseStock] = useState<any[]>([]);

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      items: [
        { placeName: '', position: '', equipmentType: '', ratePerDay: 0, days: 1, totalAmount: 0, heightFt: 0, widthFt: 0, nos: 1, ratePerSqft: 0, ledType: '' }
      ],
      gstRate: 18,
      notes: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchItems = watch("items");
  const watchGstRate = watch("gstRate");

  useEffect(() => {
    const fetchInquiryAndStock = async () => {
      try {
        const { data } = await api.get(`/inquiries/${inquiryId}`);
        setInquiry(data);

        // Fetch corresponding warehouse stock levels based on department
        let stockRes;
        if (data.department === 'LED') {
          stockRes = await api.get('/led/stock');
        } else if (data.department === 'VIDEO') {
          stockRes = await api.get('/video/equipment');
        } else if (data.department === 'SOUND') {
          stockRes = await api.get('/sound/equipment');
        }
        if (stockRes) {
          setWarehouseStock(stockRes.data || []);
        }

        // Pre-fill days for all items
        setValue("items", [{ 
          placeName: 'Main Venue', 
          position: '', 
          equipmentType: '', 
          ratePerDay: 0, 
          days: data.totalDays, 
          totalAmount: 0,
          heightFt: 10,
          widthFt: 12,
          nos: 1,
          ratePerSqft: 0,
          ledType: ''
        }]);
      } catch (error) {
        console.error("Failed to load inquiry or stock", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInquiryAndStock();
  }, [inquiryId, setValue]);

  // Stock Check Helper Functions
  const getAvailableSqftForType = (type: string) => {
    if (!type || !warehouseStock || warehouseStock.length === 0) return 0;
    const stocksOfType = warehouseStock.filter((s: any) => s.ledType?.toLowerCase() === type.toLowerCase());
    return stocksOfType.reduce((acc: number, s: any) => {
      const heightM = (s.cabinetHeightMm || 500) / 1000;
      const widthM = (s.cabinetWidthMm || 500) / 1000;
      const qty = s.availableQuantity !== undefined ? s.availableQuantity : s.totalCabinets;
      const sqMeters = heightM * widthM * qty;
      const sqFt = sqMeters * 10.7639;
      return acc + sqFt;
    }, 0);
  };

  const getEquipmentStockInfo = (equipmentName: string) => {
    if (!equipmentName || !warehouseStock || warehouseStock.length === 0) return null;
    const cleanName = equipmentName.toLowerCase().trim();
    const match = warehouseStock.find((e: any) => e.name?.toLowerCase().trim() === cleanName) ||
                  warehouseStock.find((e: any) => e.name?.toLowerCase().includes(cleanName));
    return match || null;
  };

  // Calculation logic
  const calculateSubtotal = () => {
    return watchItems.reduce((acc, item: any) => {
      if (inquiry?.department === 'VIDEO' || inquiry?.department === 'SOUND') {
        return acc + (Number(item.ratePerDay) * Number(item.days));
      } else {
        const sqft = Number(item.heightFt) * Number(item.widthFt) * Number(item.nos);
        return acc + (sqft * Number(item.ratePerSqft) * Number(item.days));
      }
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const gstAmount = (subtotal * (Number(watchGstRate) / 100));
  const totalAmount = subtotal + gstAmount;

  const onSubmit = async (data: any) => {
    // Frontend validation: check all items have required fields
    const hasEmptyItems = data.items.some((item: any) => {
      if (!item.placeName || item.placeName.trim() === '') return true;
      if (inquiry.department === 'VIDEO' || inquiry.department === 'SOUND') {
        if (!item.equipmentType || item.equipmentType.trim() === '') return true;
        if (!item.ratePerDay || Number(item.ratePerDay) <= 0) return true;
        if (!item.days || Number(item.days) <= 0) return true;
      } else {
        if (!item.ledType || item.ledType.trim() === '') return true;
        if (!item.heightFt || Number(item.heightFt) <= 0) return true;
        if (!item.widthFt || Number(item.widthFt) <= 0) return true;
        if (!item.ratePerSqft || Number(item.ratePerSqft) <= 0) return true;
        if (!item.days || Number(item.days) <= 0) return true;
      }
      return false;
    });
    if (hasEmptyItems) {
      alert('Please fill in all required fields for each item. Place name, equipment/LED details, rates, and days are required.');
      return;
    }
    if (subtotal <= 0) {
      alert('Subtotal must be greater than 0. Please check item rates and quantities.');
      return;
    }

    try {
      const payload = {
        inquiryId,
        items: data.items.map((item: any) => {
          const base = { ...item };
          if (inquiry.department === 'VIDEO' || inquiry.department === 'SOUND') {
            base.totalAmount = Number(item.ratePerDay) * Number(item.days);
          } else {
            const sqft = Number(item.heightFt) * Number(item.widthFt) * Number(item.nos);
            base.sqftPerDay = sqft;
            base.totalAmount = sqft * Number(item.ratePerSqft) * Number(item.days);
          }
          return base;
        }),
        subtotal,
        gstRate: data.gstRate,
        totalAmount,
        notes: data.notes
      };

      await api.post("/quotations", payload);
      router.push(`/dashboard/inquiries/${inquiryId}`);
    } catch (error) {
      console.error("Failed to create quotation", error);
      alert("Failed to create quotation.");
    }
  };

  if (loading) return <div className="p-8">Loading form...</div>;

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Generate {inquiry.department} Quotation</h2>
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">Cancel</button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Quotation Items</h3>
            <button 
              type="button" 
              onClick={() => append({ placeName: '', position: '', equipmentType: '', ratePerDay: 0, days: 1, totalAmount: 0, heightFt: 0, widthFt: 0, nos: 1, ratePerSqft: 0, ledType: '' })}
              className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
            >
              + Add Row
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border border-slate-100 dark:border-slate-700 rounded-xl relative group">
                <div className="md:col-span-3">
                  <label className="block text-xs text-slate-500 mb-1">Place Name</label>
                  <input {...register(`items.${index}.placeName`, { required: 'Place name is required' })} className={`w-full text-sm p-2 rounded-md border ${errors.items?.[index]?.placeName ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'} dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white`} placeholder="Main Venue" />
                </div>
                
                {inquiry.department === 'VIDEO' || inquiry.department === 'SOUND' ? (
                  <>
                    <div className="md:col-span-3">
                      <label className="block text-xs text-slate-500 mb-1">Equipment / Service</label>
                      <input {...register(`items.${index}.equipmentType`, { required: 'Required' })} className={`w-full text-sm p-2 rounded-md border ${errors.items?.[index]?.equipmentType ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'} dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white`} placeholder="Sony A7R IV" />
                      {errors.items?.[index]?.equipmentType && <p className="text-xs text-red-500 mt-1">Required</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-slate-500 mb-1">Rate / Day</label>
                      <input type="number" {...register(`items.${index}.ratePerDay`, { required: 'Required', min: { value: 1, message: '> 0' } })} className={`w-full text-sm p-2 rounded-md border ${errors.items?.[index]?.ratePerDay ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'} dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white`} />
                      {errors.items?.[index]?.ratePerDay && <p className="text-xs text-red-500 mt-1">{errors.items[index].ratePerDay?.message}</p>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-slate-500 mb-1">LED Type</label>
                      <input {...register(`items.${index}.ledType`, { required: 'Required' })} className={`w-full text-sm p-2 rounded-md border ${errors.items?.[index]?.ledType ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'} dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white`} placeholder="P2.5" />
                      {errors.items?.[index]?.ledType && <p className="text-xs text-red-500 mt-1">Required</p>}
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-xs text-slate-500 mb-1">W (ft)</label>
                      <input type="number" {...register(`items.${index}.widthFt`, { required: 'Required', min: { value: 0.1, message: '> 0' } })} className={`w-full text-sm p-2 rounded-md border ${errors.items?.[index]?.widthFt ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'} dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white`} />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-xs text-slate-500 mb-1">H (ft)</label>
                      <input type="number" {...register(`items.${index}.heightFt`, { required: 'Required', min: { value: 0.1, message: '> 0' } })} className={`w-full text-sm p-2 rounded-md border ${errors.items?.[index]?.heightFt ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'} dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white`} />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-xs text-slate-500 mb-1">Qty</label>
                      <input type="number" {...register(`items.${index}.nos`)} className="w-full text-sm p-2 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-xs text-slate-500 mb-1">Rate/sqft</label>
                      <input type="number" {...register(`items.${index}.ratePerSqft`, { required: 'Required', min: { value: 1, message: '> 0' } })} className={`w-full text-sm p-2 rounded-md border ${errors.items?.[index]?.ratePerSqft ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'} dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white`} />
                    </div>
                  </>
                )}
                
                <div className="md:col-span-1">
                  <label className="block text-xs text-slate-500 mb-1">Days</label>
                  <input type="number" {...register(`items.${index}.days`, { required: 'Required', min: { value: 1, message: 'Min 1' } })} className={`w-full text-sm p-2 rounded-md border ${errors.items?.[index]?.days ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'} dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white`} />
                </div>
                
                <div className="md:col-span-2 text-right self-end pb-2">
                  <p className="text-xs text-slate-400">Total</p>
                  <p className="text-sm font-bold dark:text-white">
                    ₹{inquiry.department === 'VIDEO' || inquiry.department === 'SOUND'
                      ? (Number(watchItems[index]?.ratePerDay || 0) * Number(watchItems[index]?.days || 1)).toLocaleString()
                      : (Number(watchItems[index]?.widthFt || 0) * Number(watchItems[index]?.heightFt || 0) * Number(watchItems[index]?.nos || 1) * Number(watchItems[index]?.ratePerSqft || 0) * Number(watchItems[index]?.days || 1)).toLocaleString()
                    }
                  </p>
                </div>

                {/* Real-time Warehouse Stock Check & Shortage Outsourcing Warning */}
                {inquiry.department === 'LED' ? (() => {
                  const ledType = watchItems[index]?.ledType || '';
                  if (!ledType) return null;
                  const availableSqft = getAvailableSqftForType(ledType);
                  const requestedSqft = Number(watchItems[index]?.widthFt || 0) * Number(watchItems[index]?.heightFt || 0) * Number(watchItems[index]?.nos || 1);
                  if (requestedSqft === 0) return null;

                  if (requestedSqft > availableSqft) {
                    const shortage = requestedSqft - availableSqft;
                    return (
                      <div className="md:col-span-12 flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-lg border border-amber-200/20 mt-1">
                        <span>⚠️ Stock Shortage: BK Media has {Math.round(availableSqft)} sq ft of {ledType} in-house. You need to outsource the remaining {Math.round(shortage)} sq ft from outside vendors.</span>
                      </div>
                    );
                  } else {
                    return (
                      <div className="md:col-span-12 flex items-center gap-2 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-3 py-2 rounded-lg border border-green-200/20 mt-1">
                        <span>✓ Sufficient Stock: {Math.round(availableSqft)} sq ft of {ledType} available in-house.</span>
                      </div>
                    );
                  }
                })() : (() => {
                  const gearName = watchItems[index]?.equipmentType || '';
                  if (!gearName || gearName.trim() === '') return null;
                  const stockInfo = getEquipmentStockInfo(gearName);
                  if (!stockInfo) {
                    return (
                      <div className="md:col-span-12 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-800 mt-1">
                        <span>ℹ️ Custom Asset / Service: Confirm in-house availability or vendor source.</span>
                      </div>
                    );
                  }
                  
                  const availQty = stockInfo.availableQuantity !== undefined ? stockInfo.availableQuantity : stockInfo.totalQuantity;
                  if (availQty <= 0) {
                    return (
                      <div className="md:col-span-12 flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-lg border border-amber-200/20 mt-1">
                        <span>⚠️ Out of Stock: "{stockInfo.name}" is currently booked or unavailable in warehouse. You will need to outsource this item.</span>
                      </div>
                    );
                  } else {
                    return (
                      <div className="md:col-span-12 flex items-center gap-2 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-3 py-2 rounded-lg border border-green-200/20 mt-1">
                        <span>✓ Sufficient Stock: {availQty} units of "{stockInfo.name}" available in-house.</span>
                      </div>
                    );
                  }
                })()}

                <button 
                  type="button" 
                  onClick={() => remove(index)}
                  className="absolute -right-2 -top-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Additional Notes</h3>
            <textarea 
              {...register("notes")} 
              rows={4} 
              className="w-full p-3 text-sm rounded-xl border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white"
              placeholder="Terms and conditions, transport details, etc."
            />
          </div>

          <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg space-y-4">
            <h3 className="text-lg font-semibold">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between opacity-80">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="opacity-80">GST Rate (%)</span>
                <input type="number" {...register("gstRate")} className="w-16 bg-blue-500 border border-blue-400 rounded text-right px-1" />
              </div>
              <div className="flex justify-between opacity-80">
                <span>GST Amount</span>
                <span>₹{gstAmount.toLocaleString()}</span>
              </div>
              <div className="pt-4 border-t border-blue-400 flex justify-between text-lg font-bold">
                <span>Total Amount</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting || subtotal <= 0}
              className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-md disabled:opacity-70"
            >
              {isSubmitting ? "Generating..." : subtotal <= 0 ? "Fill in items first" : "Generate Quotation"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
