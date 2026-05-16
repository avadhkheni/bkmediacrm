"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import api from "@/lib/api";
import SearchableSelect from "@/components/SearchableSelect";

function EditQuotationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inquiryId = searchParams.get("id");
  const quotationId = searchParams.get("quotationId");
  
  const [inquiry, setInquiry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ledStockOptions, setLedStockOptions] = useState<any[]>([]);
  const [videoEquipOptions, setVideoEquipOptions] = useState<any[]>([]);
  const [soundEquipOptions, setSoundEquipOptions] = useState<any[]>([]);
  const [ledRates, setLedRates] = useState<any[]>([]);

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      items: [] as any[],
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
        const [inqRes, qRes, ledRes, videoRes, soundRes, ratesRes] = await Promise.all([
          api.get(`/inquiries/${inquiryId}`),
          api.get(`/quotations/${quotationId}`),
          api.get('/led/stock'),
          api.get('/video/equipment'),
          api.get('/sound/equipment'),
          api.get('/led/type-rates').catch(() => ({ data: [] }))
        ]);
        
        setInquiry(inqRes.data);
        setLedStockOptions(ledRes.data || []);
        setVideoEquipOptions(videoRes.data || []);
        setSoundEquipOptions(soundRes.data || []);
        setLedRates(ratesRes.data || []);
        
        const qData = qRes.data;
        
        // Combine all items with their categories
        const items = [
          ...(qData.videoQuotationItems || []).map((it: any) => ({ ...it, category: 'VIDEO' })),
          ...(qData.ledQuotationItems || []).map((it: any) => ({ ...it, category: 'LED' })),
          ...(qData.soundQuotationItems || []).map((it: any) => ({ ...it, category: 'SOUND' })),
          ...(qData.officeQuotationItems || []).map((it: any) => ({ 
            ...it, 
            category: 'OFFICE',
            equipmentType: it.serviceName,
            ratePerDay: it.rate,
            nos: it.quantity
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
    setValue(`items.${index}.ledType`, ledType);
    const rate = ledRates.find((r: any) => r.ledType === ledType);
    if (rate) {
      setValue(`items.${index}.ratePerSqft`, rate.ratePerSqftPerDay);
    }
  };

  const handleVideoEquipChange = (index: number, equipName: string) => {
    setValue(`items.${index}.equipmentType`, equipName);
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
    try {
      const payload = {
        items: data.items.map((item: any) => {
          const category = item.category || inquiry.department;
          const base = { ...item };
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
        notes: data.notes
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

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Edit Quotation</h2>
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">Cancel</button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Quotation Items</h3>
            <button 
              type="button" 
              onClick={() => append({ category: inquiry.department, placeName: '', nos: 1, days: 1 })}
              className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
            >
              + Add Row
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => {
              const currentCategory = watchItems[index]?.category || inquiry.department;
              
              return (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border border-slate-100 dark:border-slate-700 rounded-xl relative group">
                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Category</label>
                    <select 
                      {...register(`items.${index}.category`)}
                      className="w-full text-sm p-2 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white"
                    >
                      <option value="VIDEO">Video</option>
                      <option value="LED">LED Wall</option>
                      <option value="SOUND">Sound</option>
                      <option value="OFFICE">Office</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">Place Name</label>
                    <input {...register(`items.${index}.placeName`)} className="w-full text-sm p-2 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" placeholder="e.g. Stage" />
                  </div>
                  
                  {currentCategory === 'VIDEO' || currentCategory === 'SOUND' ? (
                    <>
                      <div className="md:col-span-3">
                        <SearchableSelect 
                          label="Equipment / Service"
                          options={[
                            ...(currentCategory === 'VIDEO' ? videoEquipOptions : soundEquipOptions).map((eq: any) => ({
                              id: `${eq.name} (${eq.brand} ${eq.model})`,
                              name: eq.name,
                              subtext: `${eq.brand || ''} ${eq.model || ''} [${eq.category}]`
                            })),
                            { id: '__custom', name: '✏️ Custom entry...' }
                          ]}
                          value={watchItems[index]?.equipmentType}
                          onChange={(val) => handleVideoEquipChange(index, val.toString())}
                          placeholder="Select equipment..."
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs text-slate-500 mb-1">Qty</label>
                        <input type="number" min="1" {...register(`items.${index}.nos`)} className="w-full text-sm p-2 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs text-slate-500 mb-1">Rate / Day</label>
                        <input type="number" min="0" {...register(`items.${index}.ratePerDay`)} className="w-full text-sm p-2 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" />
                      </div>
                    </>
                  ) : currentCategory === 'LED' ? (
                    <>
                      <div className="md:col-span-2">
                        <SearchableSelect 
                          label="LED Type"
                          options={[...new Set(ledStockOptions.map((s: any) => s.ledType))].map((type: any) => ({
                            id: type,
                            name: type,
                            subtext: ledStockOptions.filter((s: any) => s.ledType === type).map((s: any) => s.companyName).join(', ')
                          }))}
                          value={watchItems[index]?.ledType || ''}
                          onChange={(val) => handleLedTypeChange(index, val.toString())}
                          placeholder="Select LED type..."
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs text-slate-500 mb-1">W(ft)</label>
                        <input type="number" min="0" {...register(`items.${index}.widthFt`)} className="w-full text-sm p-2 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs text-slate-500 mb-1">H(ft)</label>
                        <input type="number" min="0" {...register(`items.${index}.heightFt`)} className="w-full text-sm p-2 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs text-slate-500 mb-1">Qty</label>
                        <input type="number" min="1" {...register(`items.${index}.nos`)} className="w-full text-sm p-2 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs text-slate-500 mb-1">Rate/sqft</label>
                        <input type="number" min="0" {...register(`items.${index}.ratePerSqft`)} className="w-full text-sm p-2 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" />
                      </div>
                    </>
                  ) : (
                    // OFFICE
                    <>
                      <div className="md:col-span-4">
                        <label className="block text-xs text-slate-500 mb-1">Service / Item Name</label>
                        <input {...register(`items.${index}.equipmentType`)} className="w-full text-sm p-2 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" placeholder="e.g. Editing" />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs text-slate-500 mb-1">Qty</label>
                        <input type="number" min="1" {...register(`items.${index}.nos`)} className="w-full text-sm p-2 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs text-slate-500 mb-1">Rate</label>
                        <input type="number" min="0" {...register(`items.${index}.ratePerDay`)} className="w-full text-sm p-2 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" />
                      </div>
                    </>
                  )}
                  
                  <div className="md:col-span-1">
                    <label className="block text-xs text-slate-500 mb-1">Days</label>
                    <input type="number" min="1" {...register(`items.${index}.days`)} className="w-full text-sm p-2 rounded-md border border-slate-200 bg-white dark:bg-slate-700 dark:border-slate-600 text-slate-900 dark:text-white" />
                  </div>
                  
                  <div className="md:col-span-1 text-right self-end pb-2">
                    <p className="text-xs text-slate-400">Total</p>
                    <p className="text-sm font-bold dark:text-white">
                      ₹{(() => {
                        const item = watchItems[index];
                        if (currentCategory === 'VIDEO' || currentCategory === 'SOUND' || currentCategory === 'OFFICE') {
                          return (Number(item?.ratePerDay || 0) * Number(item?.days || 1) * Number(item?.nos || 1)).toLocaleString();
                        } else {
                          return (Number(item?.widthFt || 0) * Number(item?.heightFt || 0) * Number(item?.nos || 1) * Number(item?.ratePerSqft || 0) * Number(item?.days || 1)).toLocaleString();
                        }
                      })()}
                    </p>
                  </div>

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
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-md disabled:opacity-70"
            >
              {isSubmitting ? "Updating..." : "Update Quotation"}
            </button>
          </div>
        </div>
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
