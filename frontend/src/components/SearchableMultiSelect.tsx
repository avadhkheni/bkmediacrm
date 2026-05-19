"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X, Check } from "lucide-react";

export interface MultiSelectOption {
  id: string | number;
  name: string;
  subtext?: string;
  maxQuantity?: number;
}

export interface SelectedItem {
  id: string | number;
  quantity: number;
}

interface SearchableMultiSelectProps {
  options: MultiSelectOption[];
  selectedItems: SelectedItem[];
  onChange: (items: SelectedItem[]) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  error?: string;
  emptyMessage?: string;
}

export default function SearchableMultiSelect({
  options,
  selectedItems,
  onChange,
  placeholder = "Select options...",
  label,
  disabled = false,
  error,
  emptyMessage = "No results found"
}: SearchableMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opt.subtext?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (optId: string | number) => {
    const existing = selectedItems.find(item => item.id.toString() === optId.toString());
    if (existing) {
      onChange(selectedItems.filter(item => item.id.toString() !== optId.toString()));
    } else {
      onChange([...selectedItems, { id: optId, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (optId: string | number, qty: number, maxQty?: number) => {
    let validQty = qty;
    if (validQty < 1) validQty = 1;
    if (maxQty !== undefined && validQty > maxQty) validQty = maxQty;

    onChange(
      selectedItems.map(item =>
        item.id.toString() === optId.toString() ? { ...item, quantity: validQty } : item
      )
    );
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          relative w-full flex items-center justify-between rounded-xl border cursor-pointer transition-all px-4 py-3 text-sm
          ${disabled ? 'bg-slate-50 dark:bg-slate-900/60 cursor-not-allowed opacity-60' : 'bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500'}
          ${error ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}
          ${isOpen ? 'ring-2 ring-blue-500/20 border-blue-500' : ''}
        `}
      >
        <div className="flex-1 truncate">
          {selectedItems.length === 0 ? (
            <span className="text-slate-400 font-medium">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedItems.map(item => {
                const opt = options.find(o => o.id.toString() === item.id.toString());
                if (!opt) return null;
                return (
                  <span key={item.id} className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded text-xs font-semibold">
                    {opt.name} <span className="text-blue-600 dark:text-blue-400">x{item.quantity}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOption(item.id);
                      }}
                      className="hover:text-red-500 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <ChevronDown className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''} w-4 h-4 ml-2`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              autoFocus
              type="text"
              className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-900 dark:text-white p-1 outline-none"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button type="button" onClick={(e) => { e.stopPropagation(); setSearchTerm(""); }}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
          
          <div className="max-h-64 overflow-y-auto p-1.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-4 text-sm text-slate-500 text-center flex flex-col items-center">
                <span className="block mb-1 opacity-50">🔍</span>
                {emptyMessage}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredOptions.map((opt) => {
                  const isSelected = selectedItems.find(item => item.id.toString() === opt.id.toString());
                  const isUnavailable = opt.maxQuantity === 0;

                  return (
                    <div
                      key={opt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isUnavailable) toggleOption(opt.id);
                      }}
                      className={`
                        group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all
                        ${isUnavailable ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/30' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750'}
                        ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
                      `}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`
                          w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors
                          ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}
                        `}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="truncate">
                          <div className={`font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
                            {opt.name}
                          </div>
                          {opt.subtext && <div className="text-[10px] text-slate-500 font-medium mt-0.5">{opt.subtext}</div>}
                        </div>
                      </div>

                      {isSelected && !isUnavailable && (
                        <div className="flex items-center gap-2 pl-3" onClick={e => e.stopPropagation()}>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Qty:</span>
                          <input
                            type="number"
                            min="1"
                            max={opt.maxQuantity}
                            value={isSelected.quantity}
                            onChange={(e) => handleQuantityChange(opt.id, parseInt(e.target.value) || 1, opt.maxQuantity)}
                            className="w-16 px-2 py-1 text-xs font-bold text-center text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-md outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      
      {error && <p className="mt-1.5 text-xs font-medium text-red-500 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-500"></span> {error}</p>}
    </div>
  );
}
