"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X } from "lucide-react";

interface Option {
  id: string | number;
  name: string;
  subtext?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  error?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  label,
  disabled = false,
  error
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.id.toString() === value?.toString());

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
          relative w-full flex items-center justify-between px-4 py-2 rounded-md border cursor-pointer transition-all
          ${disabled ? 'bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-60' : 'bg-white dark:bg-slate-700 hover:border-blue-400'}
          ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}
          ${isOpen ? 'ring-2 ring-blue-500/20 border-blue-500' : ''}
        `}
      >
        <span className={`block truncate ${!selectedOption ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="p-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              autoFocus
              type="text"
              className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-900 dark:text-white p-1"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <X 
                className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" 
                onClick={(e) => { e.stopPropagation(); setSearchTerm(""); }}
              />
            )}
          </div>
          
          <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-3 px-4 text-sm text-slate-500 text-center">No results found</div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`
                    px-4 py-2 rounded-md cursor-pointer text-sm transition-colors
                    ${opt.id.toString() === value?.toString() 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' 
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}
                  `}
                >
                  <div className="font-medium">{opt.name}</div>
                  {opt.subtext && <div className="text-[10px] text-slate-400 font-normal">{opt.subtext}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
