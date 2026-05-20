"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import PageSkeleton from "@/components/PageSkeleton";
import api from "@/lib/api";
import SearchableSelect from "@/components/SearchableSelect";
import { isQuotationLocked, QUOTATION_LOCKED_MESSAGE } from "@/lib/quotation";
import { filterVendorsByDepartment } from "@/lib/vendor";

interface QuotationItem {
  placeName: string;
  position?: string;
  equipmentType?: string;
  ratePerDay?: number;
  days?: number;
  totalAmount?: number;
  heightFt?: number;
  widthFt?: number;
  nos?: number;
  ratePerSqft?: number;
  ledType?: string;
  isCustomEquipment?: boolean;
  isCustomLed?: boolean;
  isVendorRented?: boolean;
  vendorId?: number | string;
}

interface QuotationFormValues {
  items: QuotationItem[];
  gstRate: number;
  notes: string;
}

export default function EditQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const inquiryId = params.id as string;
  const quotationId = params.quotationId as string;
  
  const [inquiry, setInquiry] = useState<any>(null);
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [warehouseStock, setWarehouseStock] = useState<any[]>([]);
  const [ledRates, setLedRates] = useState<any[]>([]);
  const [vendorsOptions, setVendorsOptions] = useState<any[]>([]);

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<QuotationFormValues>({
    defaultValues: {
      items: [],
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
    const fetchData = async () => {
      try {
        const [inquiryRes, quotationRes] = await Promise.all([
          api.get(`/inquiries/${inquiryId}`),
          api.get(`/quotations/${quotationId}`)
        ]);
        
        setInquiry(inquiryRes.data);
        setQuotation(quotationRes.data);

        // Fetch corresponding warehouse stock levels based on department
        try {
          let stockRes;
          let ratesRes;
          if (inquiryRes.data.department === 'LED') {
            const [stock, rates] = await Promise.all([
              api.get('/led/stock'),
              api.get('/led/type-rates')
            ]);
            stockRes = stock;
            ratesRes = rates;
          } else if (inquiryRes.data.department === 'VIDEO') {
            stockRes = await api.get('/video/equipment');
          } else if (inquiryRes.data.department === 'SOUND') {
            stockRes = await api.get('/sound/equipment');
          }
          
          if (stockRes) {
            setWarehouseStock(stockRes.data || []);
          }
          if (ratesRes) {
            setLedRates(ratesRes.data || []);
          }
        } catch (stockError) {
          console.error("Failed to load stock data", stockError);
        }

        // Fetch vendors list
        const vendorsRes = await api.get('/vendors').catch(() => ({ data: [] }));
        setVendorsOptions(vendorsRes.data || []);

        // Pre-fill form with existing quotation data
        let items = [];
        if (inquiryRes.data.department === 'VIDEO') {
          items = (quotationRes.data.videoQuotationItems || []).map((item: any) => ({
            placeName: item.placeName,
            position: item.position || '',
            equipmentType: item.equipmentType,
            ratePerDay: Number(item.ratePerDay),
            days: Number(item.days),
            totalAmount: Number(item.totalAmount),
            heightFt: 0,
            widthFt: 0,
            nos: Number(item.nos || 1),
            ratePerSqft: 0,
            ledType: '',
            isCustomEquipment: false,
            isCustomLed: false,
            isVendorRented: item.isVendorRented || false,
            vendorId: item.vendorId || ''
          }));
        } else if (inquiryRes.data.department === 'SOUND') {
          items = (quotationRes.data.soundQuotationItems || []).map((item: any) => ({
            placeName: item.placeName,
            position: item.position || '',
            equipmentType: item.equipmentType,
            ratePerDay: Number(item.ratePerDay),
            days: Number(item.days),
            totalAmount: Number(item.totalAmount),
            heightFt: 0,
            widthFt: 0,
            nos: Number(item.nos || 1),
            ratePerSqft: 0,
            ledType: '',
            isCustomEquipment: false,
            isCustomLed: false,
            isVendorRented: item.isVendorRented || false,
            vendorId: item.vendorId || ''
          }));
        } else {
          items = (quotationRes.data.ledQuotationItems || []).map((item: any) => ({
            placeName: item.placeName,
            position: '',
            equipmentType: '',
            ratePerDay: 0,
            days: Number(item.days),
            totalAmount: Number(item.totalAmount),
            heightFt: Number(item.heightFt),
            widthFt: Number(item.widthFt),
            nos: Number(item.nos),
            ratePerSqft: Number(item.ratePerSqft),
            ledType: item.ledType,
            isCustomEquipment: false,
            isCustomLed: false,
            isVendorRented: item.isVendorRented || false,
            vendorId: item.vendorId || ''
          }));
        }

        setValue("items", items);
        setValue("gstRate", Number(quotationRes.data.gstRate));
        setValue("notes", quotationRes.data.notes || '');
      } catch (error) {
        console.error("Failed to load quotation", error);
        alert("Failed to load quotation data");
        router.push(`/dashboard/inquiries/${inquiryId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [inquiryId, quotationId, setValue, router]);

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

  const handleEquipmentChange = (index: number, equipName: string) => {
    const vId = watchItems[index]?.vendorId;
    const chosenVendor = vId ? vendorsOptions.find((v: any) => v.id === Number(vId)) : null;
    const finalEquipName = chosenVendor ? `[VENDOR: ${chosenVendor.name}] ${equipName}` : equipName;
    
    setValue(`items.${index}.equipmentType`, finalEquipName);
    
    if (!chosenVendor) {
      const match = warehouseStock.find(s => s.name === equipName);
      if (match && match.pricingDay) {
        setValue(`items.${index}.ratePerDay`, Number(match.pricingDay));
      }
    }
  };

  const handleLedTypeChange = (index: number, ledType: string) => {
    const vId = watchItems[index]?.vendorId;
    const chosenVendor = vId ? vendorsOptions.find((v: any) => v.id === Number(vId)) : null;
    const finalLedType = chosenVendor ? `[VENDOR: ${chosenVendor.name}] ${ledType}` : ledType;
    
    setValue(`items.${index}.ledType`, finalLedType);
    
    if (!chosenVendor) {
      const matchedRate = ledRates.find(r => r.ledType === ledType);
      if (matchedRate) {
        setValue(`items.${index}.ratePerSqft`, Number(matchedRate.ratePerSqftPerDay));
      } else {
        const matchedStock = warehouseStock.find(s => s.ledType === ledType);
        if (matchedStock && matchedStock.pricingSqft) {
          setValue(`items.${index}.ratePerSqft`, Number(matchedStock.pricingSqft));
        }
      }
    }
  };

  // Calculation logic
  const calculateSubtotal = () => {
    return watchItems.reduce((acc, item: any) => {
      if (inquiry?.department === 'VIDEO' || inquiry?.department === 'SOUND') {
        return acc + (Number(item.ratePerDay || 0) * Number(item.days || 1) * Number(item.nos || 1));
      } else {
        const sqft = Number(item.heightFt || 0) * Number(item.widthFt || 0) * Number(item.nos || 1);
        return acc + (sqft * Number(item.ratePerSqft || 0) * Number(item.days || 1));
      }
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const gstAmount = (subtotal * (Number(watchGstRate) / 100));
  const totalAmount = subtotal + gstAmount;

  const onSubmit = async (data: any) => {
    // Frontend validation
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
      alert('Please fill in all required fields for each item.');
      return;
    }
    if (subtotal <= 0) {
      alert('Subtotal must be greater than 0.');
      return;
    }

    // Stock validation: block submission if in-house stock is exceeded for non-vendor items
    if (inquiry.department === 'VIDEO' || inquiry.department === 'SOUND') {
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        if (item.isVendorRented || (item.equipmentType || '').startsWith('[VENDOR:')) continue;
        const stockInfo = getEquipmentStockInfo(item.equipmentType);
        if (!stockInfo) continue;
        const availQty = stockInfo.availableQuantity !== undefined ? stockInfo.availableQuantity : stockInfo.totalQuantity;
        if (Number(item.nos || 1) > availQty) {
          alert(`Line ${i + 1}: You have requested ${item.nos} unit(s) of "${stockInfo.name}" but only ${availQty} unit(s) are available in-house.\n\nEither reduce the quantity, or check "Rent from Outside Supplier" for this item.`);
          return;
        }
      }
    } else if (inquiry.department === 'LED') {
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        if (item.isVendorRented || (item.ledType || '').startsWith('[VENDOR:')) continue;
        const availableSqft = getAvailableSqftForType(item.ledType);
        const requestedSqft = Number(item.widthFt || 0) * Number(item.heightFt || 0) * Number(item.nos || 1);
        if (requestedSqft > availableSqft) {
          const shortage = Math.round(requestedSqft - availableSqft);
          alert(`Line ${i + 1}: Stock shortage of ${shortage} sq ft for "${item.ledType}".\n\nEither reduce the dimensions/quantity, or check "Rent from Outside Supplier" for this item.`);
          return;
        }
      }
    }

    try {
      const payload = {
        items: data.items.map((item: any) => {
          const base = { ...item };
          if (inquiry.department === 'VIDEO' || inquiry.department === 'SOUND') {
            base.totalAmount = Number(item.ratePerDay || 0) * Number(item.days || 1) * Number(item.nos || 1);
          } else {
            const sqft = Number(item.heightFt || 0) * Number(item.widthFt || 0) * Number(item.nos || 1);
            base.sqftPerDay = sqft;
            base.totalAmount = sqft * Number(item.ratePerSqft || 0) * Number(item.days || 1);
          }
          return base;
        }),
        subtotal,
        gstRate: data.gstRate,
        totalAmount,
        notes: data.notes
      };

      await api.put(`/quotations/${quotationId}`, payload);
      router.push(`/dashboard/inquiries/${inquiryId}`);
    } catch (error: any) {
      console.error("Failed to update quotation", error);
      alert(error.response?.data?.message || "Failed to update quotation.");
    }
  };

  if (loading) return <PageSkeleton variant="form" />;
  if (quotation && isQuotationLocked(quotation)) {
    return (
      <div className="p-8">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-emerald-800 dark:text-emerald-300 mb-2">Quotation Completed</h2>
          <p className="text-sm text-emerald-700 dark:text-emerald-400">{QUOTATION_LOCKED_MESSAGE}</p>
          <button 
            onClick={() => router.push(`/dashboard/inquiries/${inquiryId}`)}
            className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Back to Inquiry
          </button>
        </div>
      </div>
    );
  }
  if (!quotation || (quotation.status !== 'DRAFT' && quotation.status !== 'REJECTED' && quotation.status !== 'APPROVED')) {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Cannot Edit Quotation</h2>
          <p className="text-sm text-red-600 dark:text-red-300">
            Only DRAFT, REJECTED, or APPROVED (unpaid) quotations can be edited. Status: {quotation?.status || 'Unknown'}
          </p>
          <button 
            onClick={() => router.push(`/dashboard/inquiries/${inquiryId}`)}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Inquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Edit Quotation</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{quotation.quotationNumber}</p>
        </div>
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">Cancel</button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Quotation Items</h3>
            <button 
              type="button" 
              onClick={() => append({ placeName: '', position: '', equipmentType: '', ratePerDay: 0, days: 1, totalAmount: 0, heightFt: 0, widthFt: 0, nos: 1, ratePerSqft: 0, ledType: '', isCustomEquipment: false, isCustomLed: false, isVendorRented: false, vendorId: '' })}
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
                      {watchItems[index]?.isCustomEquipment || (watchItems[index]?.equipmentType && warehouseStock.length > 0 && !warehouseStock.some((s: any) => s.name === (watchItems[index]?.equipmentType || '').replace(/^\[VENDOR:[^\]]+\]\s*/i, '').trim())) ? (
                        <div className="flex gap-1">
                          <input 
                            {...register(`items.${index}.equipmentType`, { required: 'Required' })} 
                            className={`w-full text-sm p-2 rounded-md border ${errors.items?.[index]?.equipmentType ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'} dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white`}
                            placeholder="Sony A7R IV"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setValue(`items.${index}.isCustomEquipment`, false);
                              setValue(`items.${index}.equipmentType`, '');
                            }}
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                            title="Select from list"
                          >
                            List
                          </button>
                        </div>
                      ) : (
                        (() => {
                            const selectedEquipInOtherRows = watchItems
                              .map((it: any, idx: number) => idx !== index ? (it.equipmentType || '').replace(/^\[VENDOR:[^\]]+\]\s*/i, '').trim() : null)
                              .filter(Boolean);
                            return (
                              <SearchableSelect 
                                options={[
                                  ...warehouseStock
                                    .filter((eq: any) => !selectedEquipInOtherRows.includes(eq.name))
                                    .map((eq: any) => ({
                                      id: eq.name,
                                      name: eq.name,
                                      subtext: `${eq.brand || ''} ${eq.model || ''} [Available: ${eq.availableQuantity !== undefined ? eq.availableQuantity : eq.totalQuantity}]`
                                    })),
                                  { id: '__custom', name: '✏️ Custom entry...' }
                                ]}
                                value={(watchItems[index]?.equipmentType || '').replace(/^\[VENDOR:[^\]]+\]\s*/i, '').trim()}
                                onChange={(val) => {
                                  if (val === '__custom') {
                                    setValue(`items.${index}.isCustomEquipment`, true);
                                    setValue(`items.${index}.equipmentType`, '');
                                  } else {
                                    handleEquipmentChange(index, val.toString());
                                  }
                                }}
                                placeholder="Select equipment..."
                                error={errors.items?.[index]?.equipmentType ? 'Required' : undefined}
                                compact
                              />
                            );
                          })()
                      )}
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-xs text-slate-500 mb-1">Qty</label>
                      <input type="number" {...register(`items.${index}.nos`, { required: 'Required', min: { value: 1, message: 'Min 1' }, valueAsNumber: true })} className="w-full text-sm p-2 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" />
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
                      {watchItems[index]?.isCustomLed || (watchItems[index]?.ledType && warehouseStock.length > 0 && !warehouseStock.some((s: any) => s.ledType === (watchItems[index]?.ledType || '').replace(/^\[VENDOR:[^\]]+\]\s*/i, '').trim())) ? (
                        <div className="flex gap-1">
                          <input 
                            {...register(`items.${index}.ledType`, { required: 'Required' })} 
                            className={`w-full text-sm p-2 rounded-md border ${errors.items?.[index]?.ledType ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'} dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white`}
                            placeholder="P2.5"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setValue(`items.${index}.isCustomLed`, false);
                              setValue(`items.${index}.ledType`, '');
                            }}
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                            title="Select from list"
                          >
                            List
                          </button>
                        </div>
                      ) : (
                        (() => {
                            const selectedLedInOtherRows = watchItems
                              .map((it: any, idx: number) => idx !== index ? (it.ledType || '').replace(/^\[VENDOR:[^\]]+\]\s*/i, '').trim() : null)
                              .filter(Boolean);
                            return (
                              <SearchableSelect 
                                options={[
                                  ...[...new Set(warehouseStock.map((s: any) => s.ledType))]
                                    .filter(Boolean)
                                    .filter((type: any) => !selectedLedInOtherRows.includes(type))
                                    .map((type: any) => ({
                                      id: type,
                                      name: type,
                                      subtext: warehouseStock.filter((s: any) => s.ledType === type).map((s: any) => `${s.companyName || ''}`).join(', ')
                                    })),
                                  { id: '__custom', name: '✏️ Custom entry...' }
                                ]}
                                value={(watchItems[index]?.ledType || '').replace(/^\[VENDOR:[^\]]+\]\s*/i, '').trim()}
                                onChange={(val) => {
                                  if (val === '__custom') {
                                    setValue(`items.${index}.isCustomLed`, true);
                                    setValue(`items.${index}.ledType`, '');
                                  } else {
                                    handleLedTypeChange(index, val.toString());
                                  }
                                }}
                                placeholder="Select LED type..."
                                error={errors.items?.[index]?.ledType ? 'Required' : undefined}
                                compact
                              />
                            );
                          })()
                      )}
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
                      ? (Number(watchItems[index]?.ratePerDay || 0) * Number(watchItems[index]?.days || 1) * Number(watchItems[index]?.nos || 1)).toLocaleString()
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
                  const requestedQty = Number(watchItems[index]?.nos || 1);
                  if (availQty <= 0) {
                    return (
                      <div className="md:col-span-12 flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-lg border border-amber-200/20 mt-1">
                        <span>⚠️ Out of Stock: "{stockInfo.name}" is currently booked or unavailable in warehouse. You will need to outsource this item.</span>
                      </div>
                    );
                  } else if (requestedQty > availQty) {
                    const shortage = requestedQty - availQty;
                    return (
                      <div className="md:col-span-12 flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-lg border border-amber-200/20 mt-1">
                        <span>⚠️ Stock Shortage: BK Media has {availQty} unit(s) of "{stockInfo.name}" in-house. You need to outsource the remaining {shortage} unit(s). Check "Rent from Outside Supplier" below.</span>
                      </div>
                    );
                  } else {
                    return (
                      <div className="md:col-span-12 flex items-center gap-2 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-3 py-2 rounded-lg border border-green-200/20 mt-1">
                        <span>✓ Sufficient Stock: {availQty} unit(s) of "{stockInfo.name}" available in-house.</span>
                      </div>
                    );
                  }
                })()}

                {/* Vendor Sourcing selection panel */}
                {(inquiry.department === 'VIDEO' || inquiry.department === 'SOUND' || inquiry.department === 'LED') && (
                  <div className="col-span-full mt-2 bg-blue-50/20 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-750 flex flex-wrap gap-4 items-center w-full">
                    <label className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 cursor-pointer">
                      <input 
                        type="checkbox" 
                        {...register(`items.${index}.isVendorRented`, {
                          onChange: (e) => {
                            const checked = e.target.checked;
                            if (!checked) {
                              setValue(`items.${index}.vendorId`, '');
                              if (inquiry.department === 'LED') {
                                const currentVal = (watchItems[index]?.ledType || '').replace(/^\[VENDOR:[^\]]+\]\s*/i, '').trim();
                                setValue(`items.${index}.ledType`, currentVal);
                              } else {
                                const currentVal = (watchItems[index]?.equipmentType || '').replace(/^\[VENDOR:[^\]]+\]\s*/i, '').trim();
                                setValue(`items.${index}.equipmentType`, currentVal);
                              }
                            }
                          }
                        })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Rent from Outside Supplier?
                    </label>

                    {watchItems[index]?.isVendorRented && (
                      <p className="w-full text-[11px] text-blue-700 dark:text-blue-300">
                        Outside vendor supply — not limited by in-house warehouse quantity.
                      </p>
                    )}

                    {watchItems[index]?.isVendorRented && (
                      <div className="flex gap-4 items-center flex-1 min-w-[280px]">
                        <div className="flex-1">
                          <select
                            {...register(`items.${index}.vendorId`)}
                            onChange={(e) => {
                              const vId = e.target.value;
                              setValue(`items.${index}.vendorId`, vId);
                              const chosenVendor = vendorsOptions.find((v: any) => v.id === Number(vId));
                              if (chosenVendor) {
                                if (inquiry.department === 'LED') {
                                  const currentVal = (watchItems[index]?.ledType || '').replace(/^\[VENDOR:[^\]]+\]\s*/i, '').trim();
                                  setValue(`items.${index}.ledType`, `[VENDOR: ${chosenVendor.name}] ${currentVal}`);
                                } else {
                                  const currentVal = (watchItems[index]?.equipmentType || '').replace(/^\[VENDOR:[^\]]+\]\s*/i, '').trim();
                                  setValue(`items.${index}.equipmentType`, `[VENDOR: ${chosenVendor.name}] ${currentVal}`);
                                }
                              } else {
                                if (inquiry.department === 'LED') {
                                  const currentVal = (watchItems[index]?.ledType || '').replace(/^\[VENDOR:[^\]]+\]\s*/i, '').trim();
                                  setValue(`items.${index}.ledType`, currentVal);
                                } else {
                                  const currentVal = (watchItems[index]?.equipmentType || '').replace(/^\[VENDOR:[^\]]+\]\s*/i, '').trim();
                                  setValue(`items.${index}.equipmentType`, currentVal);
                                }
                              }
                            }}
                            className="w-full text-xs p-1.5 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white font-medium"
                          >
                            <option value="">-- Select Registered Supplier --</option>
                            {filterVendorsByDepartment(vendorsOptions, inquiry.department).map((v: any) => (
                              <option key={v.id} value={v.id}>{v.name} ({v.specialization || 'Supplier'})</option>
                            ))}
                          </select>
                        </div>

                        {watchItems[index]?.vendorId && (
                          <div className="flex-1">
                            <select
                              onChange={(e) => {
                                const prodId = e.target.value;
                                if (!prodId) return;
                                const chosenVendor = vendorsOptions.find((v: any) => v.id === Number(watchItems[index]?.vendorId));
                                const prod = chosenVendor?.products?.find((p: any) => p.id === Number(prodId));
                                if (prod) {
                                  if (inquiry.department === 'LED') {
                                    setValue(`items.${index}.ledType`, `[VENDOR: ${chosenVendor.name}] ${prod.name}`);
                                    setValue(`items.${index}.ratePerSqft`, Number(prod.ratePerDay));
                                  } else {
                                    setValue(`items.${index}.equipmentType`, `[VENDOR: ${chosenVendor.name}] ${prod.name}`);
                                    setValue(`items.${index}.ratePerDay`, Number(prod.ratePerDay));
                                  }
                                }
                              }}
                              className="w-full text-xs p-1.5 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white font-medium"
                            >
                              <option value="">-- Choose Supplier Rental Item --</option>
                              {(vendorsOptions.find((v: any) => v.id === Number(watchItems[index]?.vendorId))?.products || [])
                                .filter((p: any) => p.category === inquiry.department)
                                .map((p: any) => (
                                  <option key={p.id} value={p.id}>{p.name} (₹{p.ratePerDay}/day)</option>
                                ))
                              }
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

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
              {isSubmitting ? "Updating..." : subtotal <= 0 ? "Fill in items first" : "Update Quotation"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
