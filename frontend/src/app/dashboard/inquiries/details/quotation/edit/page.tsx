"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import api from "@/lib/api";
import SearchableSelect from "@/components/SearchableSelect";
import QuotationStockHint from "@/components/QuotationStockHint";
import { generateQuotationPDF } from "@/lib/pdfGenerator";
import { isQuotationLocked, QUOTATION_LOCKED_MESSAGE } from "@/lib/quotation";
import {
  formatEquipmentLabel,
  getEquipmentAvailableUnits,
  getMaxQuantityForRow,
  validateQuotationStock,
} from "@/lib/equipmentAvailability";
import { filterVendorsByDepartment } from "@/lib/vendor";
import { mergeQuotationNotes } from "@/lib/quotationSourcing";
import QuotationSourcingSummary from "@/components/QuotationSourcingSummary";
import QuotationLineSourceBadge from "@/components/QuotationLineSourceBadge";

const LED_SIZE_PRESETS = [
  { id: '12x10', name: '12 × 10 ft (Main Backdrop)', w: 12, h: 10 },
  { id: '16x9', name: '16 × 9 ft (Widescreen)', w: 16, h: 9 },
  { id: '10x8', name: '10 × 8 ft (Medium Backdrop)', w: 10, h: 8 },
  { id: '8x6', name: '8 × 6 ft (Side Columns)', w: 8, h: 6 },
  { id: '20x10', name: '20 × 10 ft (Large Concert)', w: 20, h: 10 },
  { id: 'custom', name: '✏️ Custom size...', w: 0, h: 0 }
];

interface QuotationItem {
  category?: string;
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
  presetSize?: string;
  isVendorRented?: boolean;
  vendorId?: string;
  isCustomEquipment?: boolean;
  isCustomLed?: boolean;
}

interface QuotationFormValues {
  items: QuotationItem[];
  gstRate: number;
  notes: string;
}

function EditQuotationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inquiryId = searchParams.get("id");
  const quotationId = searchParams.get("quotationId");
  
  const [inquiry, setInquiry] = useState<any>(null);
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ledStockOptions, setLedStockOptions] = useState<any[]>([]);
  const [videoEquipOptions, setVideoEquipOptions] = useState<any[]>([]);
  const [soundEquipOptions, setSoundEquipOptions] = useState<any[]>([]);
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
    if (!inquiryId || !quotationId) return;
    const fetchData = async () => {
      try {
        const [inqRes, qRes, ledRes, videoRes, soundRes, ratesRes, vendorsRes] = await Promise.all([
          api.get(`/inquiries/${inquiryId}`),
          api.get(`/quotations/${quotationId}`),
          api.get('/led/stock'),
          api.get('/video/equipment'),
          api.get('/sound/equipment'),
          api.get('/led/type-rates').catch(() => ({ data: [] })),
          api.get('/vendors').catch(() => ({ data: [] }))
        ]);
        
        setInquiry(inqRes.data);
        setLedStockOptions(ledRes.data || []);
        setVideoEquipOptions(videoRes.data || []);
        setSoundEquipOptions(soundRes.data || []);
        setLedRates(ratesRes.data || []);
        const allVendors = vendorsRes.data || [];
        setVendorsOptions(allVendors);
        
        const qData = qRes.data;
        setQuotation(qData);
        
        const getVendorIdFromName = (label: string) => {
          const m = (label || '').match(/^\[VENDOR:\s*([^\]]+)\]/);
          if (m) {
            const name = m[1].trim();
            const found = allVendors.find((v: any) => v.name.trim().toLowerCase() === name.toLowerCase());
            return found ? found.id.toString() : '';
          }
          return '';
        };

        // Combine all items with their categories
        const items = [
          ...(qData.videoQuotationItems || []).map((it: any) => {
            const isVendor = (it.equipmentType || '').startsWith('[VENDOR:');
            return {
              ...it,
              category: 'VIDEO',
              isVendorRented: isVendor,
              vendorId: getVendorIdFromName(it.equipmentType)
            };
          }),
          ...(qData.ledQuotationItems || []).map((it: any) => {
            const isVendor = (it.ledType || '').startsWith('[VENDOR:');
            return { 
              ...it, 
              category: 'LED',
              presetSize: LED_SIZE_PRESETS.find(p => p.w === it.widthFt && p.h === it.heightFt)?.id || 'custom',
              isVendorRented: isVendor,
              vendorId: getVendorIdFromName(it.ledType)
            };
          }),
          ...(qData.soundQuotationItems || []).map((it: any) => {
            const isVendor = (it.equipmentType || '').startsWith('[VENDOR:');
            return {
              ...it,
              category: 'SOUND',
              isVendorRented: isVendor,
              vendorId: getVendorIdFromName(it.equipmentType)
            };
          }),
          ...(qData.officeQuotationItems || []).map((it: any) => ({ 
            ...it, 
            category: 'OFFICE',
            equipmentType: it.serviceName,
            ratePerDay: it.rate,
            nos: it.quantity,
            isVendorRented: false,
            vendorId: ''
          })),
        ];
          
        setValue("items", items);
        setValue("gstRate", qData.gstRate);
        setValue("notes", qData.notes);
        
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [inquiryId, quotationId, setValue]);

  const handleLedTypeChange = (index: number, ledType: string) => {
    const vId = watchItems[index]?.vendorId;
    const chosenVendor = vId ? vendorsOptions.find((v: any) => v.id === Number(vId)) : null;
    const finalLedType = chosenVendor ? `[VENDOR: ${chosenVendor.name}] ${ledType}` : ledType;
    setValue(`items.${index}.ledType`, finalLedType);
    const rate = ledRates.find((r: any) => r.ledType === ledType);
    if (rate) {
      setValue(`items.${index}.ratePerSqft`, rate.ratePerSqftPerDay);
    } else {
      const stock = ledStockOptions.find((s: any) => s.ledType === ledType);
      if (stock) {
        setValue(`items.${index}.ratePerSqft`, stock.pricingSqft || 0);
      }
    }
  };

  const handlePresetSizeChange = (index: number, val: string) => {
    setValue(`items.${index}.presetSize`, val);
    if (val !== 'custom') {
      const preset = LED_SIZE_PRESETS.find(p => p.id === val);
      if (preset) {
        setValue(`items.${index}.widthFt`, preset.w);
        setValue(`items.${index}.heightFt`, preset.h);
      }
    }
  };

  const handleVideoEquipChange = (index: number, equipName: string) => {
    const vId = watchItems[index]?.vendorId;
    const chosenVendor = vId ? vendorsOptions.find((v: any) => v.id === Number(vId)) : null;
    const finalEquipName = chosenVendor ? `[VENDOR: ${chosenVendor.name}] ${equipName}` : equipName;
    setValue(`items.${index}.equipmentType`, finalEquipName);
  };

  const calculateSubtotal = () => {
    return watchItems.reduce((acc, item: any) => {
      const category = item.category || inquiry?.department;
      if (category === 'VIDEO' || category === 'SOUND' || category === 'OFFICE') {
        return acc + (Number(item.ratePerDay || 0) * Number(item.days || 0) * Number(item.nos || 1));
      } else if (category === 'LED') {
        const sqft = Number(item.heightFt || 0) * Number(item.widthFt || 0) * Number(item.nos || 1);
        return acc + (sqft * Number(item.ratePerSqft || 0) * Number(item.days || 0));
      }
      return acc;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const gstAmount = (subtotal * (Number(watchGstRate) / 100));
  const totalAmount = subtotal + gstAmount;

  const onSubmit = async (data: any) => {
    if (quotation && isQuotationLocked(quotation)) {
      alert(QUOTATION_LOCKED_MESSAGE);
      return;
    }
    const stockError = validateQuotationStock(data.items, {
      videoEquipOptions,
      soundEquipOptions,
      ledStockOptions,
    });
    if (stockError) {
      alert(stockError);
      return;
    }
    try {
      const payload = {
        items: data.items.map((item: any) => {
          const category = item.category || inquiry.department;
          const base = { ...item };
          // Strip out temporary UI-only preset fields
          delete base.presetSize;
          if (category === 'VIDEO' || category === 'SOUND' || category === 'OFFICE') {
            base.totalAmount = Number(item.ratePerDay) * Number(item.days) * Number(item.nos || 1);
          } else {
            const sqft = Number(item.heightFt) * Number(item.widthFt) * Number(item.nos);
            base.sqftPerDay = sqft;
            base.totalAmount = sqft * Number(item.ratePerSqft) * Number(item.days);
          }
          return base;
        }),
        subtotal,
        gstRate: data.gstRate,
        notes: mergeQuotationNotes(data.notes, data.items),
      };

      await api.put(`/quotations/${quotationId}`, payload);
      router.push(`/dashboard/inquiries/details?id=${inquiryId}`);
    } catch (error) {
      console.error("Failed to update quotation", error);
      alert("Failed to update quotation.");
    }
  };

  if (!inquiryId || !quotationId) return <div className="p-8">Missing parameters.</div>;
  if (loading) return <div className="p-8">Loading quotation data...</div>;

  const locked = quotation ? isQuotationLocked(quotation) : false;
  const stockCtx = { videoEquipOptions, soundEquipOptions, ledStockOptions };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {locked ? "View Quotation" : "Edit Quotation"}
          </h2>
          {quotation?.quotationNumber && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{quotation.quotationNumber}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {locked && inquiry && quotation && (
            <button
              type="button"
              onClick={() => generateQuotationPDF(quotation, inquiry)}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Download PDF
            </button>
          )}
          <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">Back</button>
        </div>
      </div>

      {locked && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-sm text-emerald-800 dark:text-emerald-300">
          {QUOTATION_LOCKED_MESSAGE}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20">
        <fieldset disabled={locked} className="space-y-6 border-0 p-0 m-0 min-w-0">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Quotation Items</h3>
            <button 
              type="button" 
              onClick={() => append({ category: inquiry.department, placeName: 'Main Venue', position: '', equipmentType: '', ratePerDay: 0, days: inquiry?.totalDays || 1, totalAmount: 0, heightFt: 10, widthFt: 12, nos: 1, ratePerSqft: 0, ledType: '', presetSize: '12x10', isVendorRented: false, vendorId: '' })}
              className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
            >
              + Add Row
            </button>
          </div>

          <QuotationSourcingSummary items={watchItems} />

          <div className="space-y-4">
            {fields.map((field, index) => {
              const currentCategory = watchItems[index]?.category || inquiry.department;
              const rowItem = watchItems[index] || {};
              const maxQty = getMaxQuantityForRow(watchItems, index, rowItem, stockCtx);
              const qtyCap = maxQty === null ? undefined : Math.max(1, maxQty);
              const vendorsForLine = filterVendorsByDepartment(vendorsOptions, currentCategory);
              const fromVendor = !!rowItem.isVendorRented;
              
              return (
                <div
                  key={field.id}
                  className={`grid grid-cols-1 md:grid-cols-[repeat(14,minmax(0,1fr))] gap-2 p-2.5 border rounded-xl relative group items-end bg-slate-50/20 dark:bg-slate-800/10 border-l-4 ${
                    fromVendor
                      ? "border-l-blue-500 border-slate-100 dark:border-slate-700"
                      : "border-l-emerald-500 border-slate-100 dark:border-slate-700"
                  }`}
                >
                  <div className="col-span-full flex items-center justify-between gap-2 pb-1">
                    <QuotationLineSourceBadge item={rowItem} />
                    <span className="text-[10px] text-slate-400 font-medium">Line {index + 1}</span>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-slate-500 mb-1">Category</label>
                    <select 
                      {...register(`items.${index}.category`)}
                      className="w-full text-xs p-1.5 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="VIDEO">Video</option>
                      <option value="LED">LED Wall</option>
                      <option value="SOUND">Sound</option>
                      <option value="OFFICE">Office</option>
                    </select>
                  </div>

                  <div className={currentCategory === 'LED' ? "md:col-span-1" : "md:col-span-2"}>
                    <label className="block text-[11px] text-slate-500 mb-1">Place Name</label>
                    <input {...register(`items.${index}.placeName`)} className="w-full text-xs p-1.5 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" placeholder="e.g. Stage" />
                  </div>
                  
                  {currentCategory === 'VIDEO' || currentCategory === 'SOUND' ? (
                    <>
                      <div className="md:col-span-5">
                        <label className="block text-[11px] text-slate-500 mb-1">Equipment / Service</label>
                        {(() => {
                          const eqVal = watchItems[index]?.equipmentType || '';
                          const cleanEqVal = eqVal.replace(/^\[VENDOR:[^\]]+\]\s*/i, '').trim();
                          const opts = currentCategory === 'VIDEO' ? videoEquipOptions : soundEquipOptions;
                          const isCustom = watchItems[index]?.isCustomEquipment || (cleanEqVal && !opts.some((s: any) => {
                            const brand = s.brand?.trim() || '';
                            const model = s.model?.trim() || '';
                            const label = brand || model ? `${s.name} (${brand} ${model})` : s.name;
                            return label.replace(/\s+/g, ' ').trim() === cleanEqVal;
                          }));
                          
                          if (isCustom) {
                            return (
                              <div className="flex gap-1">
                                <input 
                                  {...register(`items.${index}.equipmentType`, { required: 'Required' })} 
                                  className="w-full text-xs p-1.5 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white"
                                  placeholder="Type custom equipment..."
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setValue(`items.${index}.isCustomEquipment`, false);
                                    setValue(`items.${index}.equipmentType`, '');
                                  }}
                                  className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-[10px] text-slate-500 dark:text-slate-350 border border-slate-200 dark:border-slate-600"
                                >
                                  List
                                </button>
                              </div>
                            );
                          }

                          return (
                            <SearchableSelect 
                              options={[
                                ...opts
                                  .filter((eq: any) => {
                                    const label = formatEquipmentLabel(eq);
                                    const selectedInOtherRows = watchItems
                                      .map((it: any, idx: number) => {
                                        if (idx === index) return null;
                                        const cat = (it.category || '').toUpperCase();
                                        if (cat !== currentCategory) return null;
                                        if (it.isVendorRented) return null;
                                        return (it.equipmentType || '').replace(/^\[VENDOR:[^\]]+\]\s*/i, '').trim();
                                      })
                                      .filter(Boolean);
                                    return !selectedInOtherRows.includes(label) && !selectedInOtherRows.includes(eq.name);
                                  })
                                  .map((eq: any) => ({
                                    id: formatEquipmentLabel(eq),
                                    name: eq.name,
                                    subtext: `${eq.brand || ''} ${eq.model || ''} · ${getEquipmentAvailableUnits(eq)} in stock`
                                  })),
                                { id: '__custom', name: '✏️ Custom entry...' }
                              ]}
                              value={cleanEqVal}
                              onChange={(val) => {
                                if (val === '__custom') {
                                  setValue(`items.${index}.isCustomEquipment`, true);
                                  setValue(`items.${index}.equipmentType`, '');
                                } else {
                                  handleVideoEquipChange(index, val.toString());
                                  const matched = opts.find((eq: any) => formatEquipmentLabel(eq) === val);
                                  if (matched?.ratePerDay) {
                                    setValue(`items.${index}.ratePerDay`, Number(matched.ratePerDay));
                                  }
                                  const cap = getMaxQuantityForRow(watchItems, index, { ...rowItem, equipmentType: val.toString() }, stockCtx);
                                  if (cap !== null && cap > 0) {
                                    const currentNos = Number(watchItems[index]?.nos || 1);
                                    if (currentNos > cap) setValue(`items.${index}.nos`, cap);
                                  }
                                }
                              }}
                              placeholder="Select equipment..."
                              compact
                            />
                          );
                        })()}
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-[11px] text-slate-500 mb-1">Qty{qtyCap !== undefined ? ` (max ${qtyCap})` : ''}</label>
                        <input type="number" min={1} max={qtyCap} {...register(`items.${index}.nos`, { min: 1, max: qtyCap, valueAsNumber: true })} className="w-full text-xs p-1.5 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] text-slate-500 mb-1">Rate / Day</label>
                        <input type="number" min="0" {...register(`items.${index}.ratePerDay`)} className="w-full text-xs p-1.5 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] text-slate-500 mb-1">Days</label>
                        <input type="number" min="1" {...register(`items.${index}.days`)} className="w-full text-xs p-1.5 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" />
                      </div>
                    </>
                  ) : currentCategory === 'LED' ? (
                    <>
                      <div className="md:col-span-3">
                        <label className="block text-[11px] text-slate-500 mb-1">LED Type</label>
                        {(() => {
                          const ledVal = watchItems[index]?.ledType || '';
                          const cleanLedVal = ledVal.replace(/^\[VENDOR:[^\]]+\]\s*/i, '').trim();
                          const isCustom = watchItems[index]?.isCustomLed || (cleanLedVal && ledStockOptions.length > 0 && !ledStockOptions.some((s: any) => s.ledType === cleanLedVal));
                          
                          if (isCustom) {
                            return (
                              <div className="flex gap-1">
                                <input 
                                  {...register(`items.${index}.ledType`, { required: 'Required' })} 
                                  className="w-full text-xs p-1.5 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white"
                                  placeholder="P2.5"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setValue(`items.${index}.isCustomLed`, false);
                                    setValue(`items.${index}.ledType`, '');
                                  }}
                                  className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-[10px] text-slate-500 dark:text-slate-350 border border-slate-200 dark:border-slate-600"
                                >
                                  List
                                </button>
                              </div>
                            );
                          }

                          return (
                            <SearchableSelect 
                              options={[
                                ...[...new Set(ledStockOptions.map((s: any) => s.ledType))]
                                  .filter(Boolean)
                                  .filter((type: any) => {
                                    const selectedInOtherRows = watchItems
                                      .map((it: any, idx: number) => {
                                        if (idx === index) return null;
                                        if ((it.category || '').toUpperCase() !== 'LED') return null;
                                        if (it.isVendorRented) return null;
                                        return (it.ledType || '').replace(/^\[VENDOR:[^\]]+\]\s*/i, '').trim();
                                      })
                                      .filter(Boolean);
                                    return !selectedInOtherRows.includes(type);
                                  })
                                  .map((type: any) => ({
                                    id: type,
                                    name: type,
                                    subtext: ledStockOptions.filter((s: any) => s.ledType === type).map((s: any) => `${s.companyName || ''}`).join(', ')
                                  })),
                                { id: '__custom', name: '✏️ Custom entry...' }
                              ]}
                              value={cleanLedVal}
                              onChange={(val) => {
                                if (val === '__custom') {
                                  setValue(`items.${index}.isCustomLed`, true);
                                  setValue(`items.${index}.ledType`, '');
                                } else {
                                  handleLedTypeChange(index, val.toString());
                                }
                              }}
                              placeholder="Select LED type..."
                              compact
                            />
                          );
                        })()}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Dimension Preset</label>
                        <select
                          value={watchItems[index]?.presetSize || 'custom'}
                          onChange={(e) => handlePresetSizeChange(index, e.target.value)}
                          className="w-full text-xs p-1.5 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white font-medium cursor-pointer"
                        >
                          {LED_SIZE_PRESETS.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-[11px] text-slate-500 mb-1">W(ft)</label>
                        <input 
                          type="number" 
                          min="0.1" 
                          step="any"
                          readOnly={watchItems[index]?.presetSize !== 'custom'}
                          {...register(`items.${index}.widthFt`, { min: 0 })} 
                          className={`w-full text-xs p-1.5 rounded-md border border-slate-200 text-slate-900 dark:text-white ${
                            watchItems[index]?.presetSize !== 'custom'
                              ? 'bg-slate-100 dark:bg-slate-800 opacity-80 cursor-not-allowed font-semibold' 
                              : 'bg-white dark:bg-slate-700'
                          }`} 
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-[11px] text-slate-500 mb-1">H(ft)</label>
                        <input 
                          type="number" 
                          min="0.1" 
                          step="any"
                          readOnly={watchItems[index]?.presetSize !== 'custom'}
                          {...register(`items.${index}.heightFt`, { min: 0 })} 
                          className={`w-full text-xs p-1.5 rounded-md border border-slate-200 text-slate-900 dark:text-white ${
                            watchItems[index]?.presetSize !== 'custom'
                              ? 'bg-slate-100 dark:bg-slate-800 opacity-80 cursor-not-allowed font-semibold' 
                              : 'bg-white dark:bg-slate-700'
                          }`} 
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-[11px] text-slate-500 mb-1">Qty{qtyCap !== undefined ? ` (max ${qtyCap})` : ''}</label>
                        <input type="number" min={1} max={qtyCap} {...register(`items.${index}.nos`, { min: 1, max: qtyCap, valueAsNumber: true })} className="w-full text-xs p-1.5 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] text-slate-500 mb-1">Rate/sqft</label>
                        <input type="number" min="0" {...register(`items.${index}.ratePerSqft`)} className="w-full text-xs p-1.5 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-[11px] text-slate-500 mb-1">Days</label>
                        <input type="number" min="1" {...register(`items.${index}.days`)} className="w-full text-xs p-1.5 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" />
                      </div>
                    </>
                  ) : (
                    // OFFICE
                    <>
                      <div className="md:col-span-5">
                        <label className="block text-[11px] text-slate-500 mb-1">Service / Item Name</label>
                        <input {...register(`items.${index}.equipmentType`)} className="w-full text-xs p-1.5 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" placeholder="e.g. Editing" />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-[11px] text-slate-500 mb-1">Qty</label>
                        <input type="number" min="1" {...register(`items.${index}.nos`)} className="w-full text-xs p-1.5 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] text-slate-500 mb-1">Rate</label>
                        <input type="number" min="0" {...register(`items.${index}.ratePerDay`)} className="w-full text-xs p-1.5 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[11px] text-slate-500 mb-1">Days</label>
                        <input type="number" min="1" {...register(`items.${index}.days`)} className="w-full text-xs p-1.5 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" />
                      </div>
                    </>
                  )}

                  {/* Vendor Sourcing selection panel */}
                  {(currentCategory === 'VIDEO' || currentCategory === 'SOUND' || currentCategory === 'LED') && (
                    <div className="col-span-full w-full mt-2 bg-blue-50/20 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-750">
                      <label className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 cursor-pointer whitespace-nowrap">
                        <input 
                          type="checkbox" 
                          {...register(`items.${index}.isVendorRented`, {
                            onChange: (e) => {
                              const checked = e.target.checked;
                              if (!checked) {
                                setValue(`items.${index}.vendorId`, '');
                                if (currentCategory === 'LED') {
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
                        <p className="mt-2 text-[11px] text-blue-700 dark:text-blue-300">
                          Outside vendor supply — not limited by in-house warehouse quantity.
                        </p>
                      )}

                      {watchItems[index]?.isVendorRented && (
                        <div className="flex flex-wrap gap-4 items-center mt-3 w-full">
                          <div className="flex-1">
                            <select
                              {...register(`items.${index}.vendorId`)}
                              onChange={(e) => {
                                const vId = e.target.value;
                                setValue(`items.${index}.vendorId`, vId);
                                const chosenVendor = vendorsForLine.find((v: any) => v.id === Number(vId));
                                if (chosenVendor) {
                                  if (currentCategory === 'LED') {
                                    const currentVal = (watchItems[index]?.ledType || '').replace(/^\[VENDOR:[^\]]+\]\s*/i, '').trim();
                                    setValue(`items.${index}.ledType`, `[VENDOR: ${chosenVendor.name}] ${currentVal}`);
                                  } else {
                                    const currentVal = (watchItems[index]?.equipmentType || '').replace(/^\[VENDOR:[^\]]+\]\s*/i, '').trim();
                                    setValue(`items.${index}.equipmentType`, `[VENDOR: ${chosenVendor.name}] ${currentVal}`);
                                  }
                                } else {
                                  if (currentCategory === 'LED') {
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
                              {vendorsForLine.length === 0 ? (
                                <option value="" disabled>No suppliers for {currentCategory} — add under Vendors</option>
                              ) : (
                                vendorsForLine.map((v: any) => (
                                  <option key={v.id} value={v.id}>{v.name} ({v.specialization || 'Supplier'})</option>
                                ))
                              )}
                            </select>
                          </div>

                          {watchItems[index]?.vendorId && (
                            <div className="flex-1">
                              <select
                                onChange={(e) => {
                                  const prodId = e.target.value;
                                  if (!prodId) return;
                                  const chosenVendor = vendorsForLine.find((v: any) => v.id === Number(watchItems[index]?.vendorId));
                                  const prod = chosenVendor?.products?.find((p: any) => p.id === Number(prodId));
                                  if (prod) {
                                    if (currentCategory === 'LED') {
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
                                {(() => {
                                  const prods = (vendorsForLine.find((v: any) => v.id === Number(watchItems[index]?.vendorId))?.products || [])
                                    .filter((p: any) => p.category === currentCategory);
                                  if (prods.length === 0) {
                                    return <option value="" disabled>Add products for this vendor in Vendors page</option>;
                                  }
                                  return prods.map((p: any) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} (Qty: {p.quantity || 1}, ₹{p.ratePerDay}/day)
                                    </option>
                                  ));
                                })()}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {(currentCategory === 'VIDEO' || currentCategory === 'SOUND' || currentCategory === 'LED') && (
                    <QuotationStockHint
                      items={watchItems}
                      rowIndex={index}
                      item={rowItem}
                      videoEquipOptions={videoEquipOptions}
                      soundEquipOptions={soundEquipOptions}
                      ledStockOptions={ledStockOptions}
                    />
                  )}

                  <button 
                    type="button" 
                    onClick={() => remove(index)}
                    className="absolute -right-2 -top-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              );
            })}
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
            {!locked && (
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-md disabled:opacity-70"
              >
                {isSubmitting ? "Updating..." : "Update Quotation"}
              </button>
            )}
          </div>
        </div>
        </fieldset>
      </form>
    </div>
  );
}

export default function EditQuotationPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <EditQuotationContent />
    </Suspense>
  );
}
