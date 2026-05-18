const fs = require('fs');
const file = 'src/app/dashboard/warehouse/checklists/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'import { useUIStore } from "@/store/uiStore";',
  'import { useUIStore } from "@/store/uiStore";\nimport SearchableMultiSelect, { MultiSelectOption } from "@/components/SearchableMultiSelect";'
);

// DispatchView state
content = content.replace(
  '  const [form, setForm] = useState({\n    inquiryId: "",\n    staffName: "",\n    notes: "",\n    equipmentType: "VIDEO",\n    equipmentId: "",\n    warehouseId: "",\n    quantity: 1\n  });',
  '  const [form, setForm] = useState<{\n    inquiryId: string;\n    staffName: string;\n    notes: string;\n    equipmentType: string;\n    warehouseId: string;\n    selectedEquipments: { id: string | number; quantity: number }[];\n  }>({\n    inquiryId: "",\n    staffName: "",\n    notes: "",\n    equipmentType: "VIDEO",\n    warehouseId: "",\n    selectedEquipments: []\n  });'
);

content = content.replace(
  '    if (!form.equipmentId || !form.warehouseId || !form.inquiryId) {\n      addToast("Please select Inquiry, Warehouse, and Equipment", "error");',
  '    if (!form.warehouseId || !form.inquiryId || form.selectedEquipments.length === 0) {\n      addToast("Please select Inquiry, Warehouse, and at least one Equipment", "error");'
);

content = content.replace(
  '      const itemToDispatch = {\n        videoEquipId: form.equipmentType === \'VIDEO\' ? Number(form.equipmentId) : null,\n        ledStockId: form.equipmentType === \'LED\' ? Number(form.equipmentId) : null,\n        soundEquipId: form.equipmentType === \'SOUND\' ? Number(form.equipmentId) : null,\n        warehouseId: Number(form.warehouseId),\n        quantity: Number(form.quantity)\n      };\n\n      await api.post("/warehouse/dispatch", {\n        inquiryId: Number(form.inquiryId),\n        staffName: form.staffName,\n        notes: form.notes,\n        items: [itemToDispatch],',
  '      const itemsToDispatch = form.selectedEquipments.map(item => ({\n        videoEquipId: form.equipmentType === \'VIDEO\' ? Number(item.id) : null,\n        ledStockId: form.equipmentType === \'LED\' ? Number(item.id) : null,\n        soundEquipId: form.equipmentType === \'SOUND\' ? Number(item.id) : null,\n        warehouseId: Number(form.warehouseId),\n        quantity: item.quantity\n      }));\n\n      await api.post("/warehouse/dispatch", {\n        inquiryId: Number(form.inquiryId),\n        staffName: form.staffName,\n        notes: form.notes,\n        items: itemsToDispatch,'
);

// DispatchView UI
const dispatchUIRegex = /<select[\s\S]*?value={form\.warehouseId}[\s\S]*?onChange={\(e\) => setForm\({ \.\.\.form, warehouseId: e\.target\.value, equipmentId: "" }\)}[\s\S]*?<option value="">Select Warehouse<\/option>[\s\S]*?onChange={\(e\) => setForm\({ \.\.\.form, equipmentType: e\.target\.value, equipmentId: "" }\)}[\s\S]*?<div className="md:col-span-2">[\s\S]*?<div>\s*<label className="block text-xs font-bold text-slate-400 uppercase mb-1\.5">Quantity To Dispatch \*<\/label>[\s\S]*?<input[\s\S]*?className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500\/20 focus:border-blue-500 outline-none transition-all"\s*\/>\s*<\/div>/m;

const dispatchUINew = `<select
              required
              value={form.warehouseId}
              onChange={(e) => setForm({ ...form, warehouseId: e.target.value, selectedEquipments: [] })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">Select Warehouse First...</option>
              {warehouses.map(w => <option key={w.id} value={String(w.id)}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Equipment Type</label>
            <select
              value={form.equipmentType}
              onChange={(e) => setForm({ ...form, equipmentType: e.target.value, selectedEquipments: [] })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              <option value="VIDEO">Video Equipment</option>
              <option value="LED">LED Stock</option>
              <option value="SOUND">Sound Equipment</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <SearchableMultiSelect
              label="Select Equipment *"
              placeholder={form.warehouseId ? "Search & select items..." : "Please select a warehouse first to load available items"}
              disabled={!form.warehouseId}
              emptyMessage={form.warehouseId ? "No items found for this warehouse" : "Select a warehouse first"}
              options={(() => {
                if (!form.warehouseId) return [];
                if (form.equipmentType === 'VIDEO') {
                  return videoStock
                    .filter(v => v.warehouseId === Number(form.warehouseId))
                    .map(v => ({ id: v.id, name: v.name, subtext: \`\${v.availableQuantity} available\`, maxQuantity: v.availableQuantity }));
                }
                if (form.equipmentType === 'LED') {
                  return ledStock
                    .filter(l => l.warehouseId === Number(form.warehouseId))
                    .map(l => ({ id: l.id, name: \`\${l.companyName} \${l.ledType}\`, subtext: \`\${l.availableQuantity} available\`, maxQuantity: l.availableQuantity }));
                }
                if (form.equipmentType === 'SOUND') {
                  return soundStock
                    .filter(s => s.warehouseId === Number(form.warehouseId))
                    .map(s => ({ id: s.id, name: s.name, subtext: \`\${s.availableQuantity} available\`, maxQuantity: s.availableQuantity }));
                }
                return [];
              })()}
              selectedItems={form.selectedEquipments}
              onChange={(items) => setForm({ ...form, selectedEquipments: items })}
            />`;

content = content.replace(dispatchUIRegex, dispatchUINew);


// ReturnView state
content = content.replace(
  '  const [form, setForm] = useState({\n    inquiryId: "",\n    staffName: "",\n    notes: "",\n    penaltyAmount: "",\n    equipmentType: "VIDEO",\n    equipmentId: "",\n    warehouseId: "",\n    quantity: 1,\n    isDamaged: false\n  });',
  '  const [form, setForm] = useState<{\n    inquiryId: string;\n    staffName: string;\n    notes: string;\n    penaltyAmount: string;\n    equipmentType: string;\n    warehouseId: string;\n    selectedEquipments: { id: string | number; quantity: number }[];\n    isDamaged: boolean;\n  }>({\n    inquiryId: "",\n    staffName: "",\n    notes: "",\n    penaltyAmount: "",\n    equipmentType: "VIDEO",\n    warehouseId: "",\n    selectedEquipments: [],\n    isDamaged: false\n  });'
);

content = content.replace(
  '    if (!form.equipmentId || !form.warehouseId || !form.inquiryId) {\n      addToast("Please select Inquiry, Warehouse, and Equipment", "error");',
  '    if (!form.warehouseId || !form.inquiryId || form.selectedEquipments.length === 0) {\n      addToast("Please select Inquiry, Warehouse, and at least one Equipment", "error");'
);

content = content.replace(
  '      const itemToReturn = {\n        videoEquipId: form.equipmentType === \'VIDEO\' ? Number(form.equipmentId) : null,\n        ledStockId: form.equipmentType === \'LED\' ? Number(form.equipmentId) : null,\n        soundEquipId: form.equipmentType === \'SOUND\' ? Number(form.equipmentId) : null,\n        warehouseId: Number(form.warehouseId),\n        quantity: Number(form.quantity),\n        isDamaged: form.isDamaged\n      };\n\n      await api.post("/warehouse/return", {\n        inquiryId: Number(form.inquiryId),\n        staffName: form.staffName,\n        notes: form.notes,\n        penaltyAmount: form.penaltyAmount,\n        items: [itemToReturn],',
  '      const itemsToReturn = form.selectedEquipments.map(item => ({\n        videoEquipId: form.equipmentType === \'VIDEO\' ? Number(item.id) : null,\n        ledStockId: form.equipmentType === \'LED\' ? Number(item.id) : null,\n        soundEquipId: form.equipmentType === \'SOUND\' ? Number(item.id) : null,\n        warehouseId: Number(form.warehouseId),\n        quantity: item.quantity,\n        isDamaged: form.isDamaged\n      }));\n\n      await api.post("/warehouse/return", {\n        inquiryId: Number(form.inquiryId),\n        staffName: form.staffName,\n        notes: form.notes,\n        penaltyAmount: form.penaltyAmount,\n        items: itemsToReturn,'
);

// ReturnView UI
const returnUIRegex = /<select[\s\S]*?value={form\.warehouseId}[\s\S]*?onChange={\(e\) => setForm\({ \.\.\.form, warehouseId: e\.target\.value, equipmentId: "" }\)}[\s\S]*?<option value="">Select Warehouse<\/option>[\s\S]*?onChange={\(e\) => setForm\({ \.\.\.form, equipmentType: e\.target\.value, equipmentId: "" }\)}[\s\S]*?<div className="md:col-span-2">[\s\S]*?<div>\s*<label className="block text-xs font-bold text-slate-400 uppercase mb-1\.5">Quantity Returned \*<\/label>[\s\S]*?<input[\s\S]*?className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500\/20 focus:border-indigo-500 outline-none transition-all"\s*\/>\s*<\/div>/m;

const returnUINew = `<select
              required
              value={form.warehouseId}
              onChange={(e) => setForm({ ...form, warehouseId: e.target.value, selectedEquipments: [] })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="">Select Warehouse First...</option>
              {warehouses.map(w => <option key={w.id} value={String(w.id)}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Equipment Type</label>
            <select
              value={form.equipmentType}
              onChange={(e) => setForm({ ...form, equipmentType: e.target.value, selectedEquipments: [] })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-medium appearance-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="VIDEO">Video Equipment</option>
              <option value="LED">LED Stock</option>
              <option value="SOUND">Sound Equipment</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <SearchableMultiSelect
              label="Select Dispatched Equipment *"
              placeholder={form.warehouseId ? "Search & select items..." : "Please select a warehouse first to load dispatched items"}
              disabled={!form.warehouseId}
              emptyMessage={form.warehouseId ? "No dispatched items found for this warehouse" : "Select a warehouse first"}
              options={(() => {
                if (!form.warehouseId) return [];
                if (form.equipmentType === 'VIDEO') {
                  return videoStock
                    .filter(v => v.warehouseId === Number(form.warehouseId))
                    .map(v => ({ id: v.id, name: v.name, subtext: \`\${v.inUseQuantity || 0} dispatched\`, maxQuantity: v.inUseQuantity || 0 }));
                }
                if (form.equipmentType === 'LED') {
                  return ledStock
                    .filter(l => l.warehouseId === Number(form.warehouseId))
                    .map(l => ({ id: l.id, name: \`\${l.companyName} \${l.ledType}\`, subtext: \`\${l.inUseQuantity || 0} dispatched\`, maxQuantity: l.inUseQuantity || 0 }));
                }
                if (form.equipmentType === 'SOUND') {
                  return soundStock
                    .filter(s => s.warehouseId === Number(form.warehouseId))
                    .map(s => ({ id: s.id, name: s.name, subtext: \`\${s.inUseQuantity || 0} dispatched\`, maxQuantity: s.inUseQuantity || 0 }));
                }
                return [];
              })()}
              selectedItems={form.selectedEquipments}
              onChange={(items) => setForm({ ...form, selectedEquipments: items })}
            />`;

content = content.replace(returnUIRegex, returnUINew);


fs.writeFileSync(file, content);
console.log('Successfully updated checklists/page.tsx');
