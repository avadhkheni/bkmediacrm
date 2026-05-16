"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { ArrowRightLeft, Clock, User, Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { format } from "date-fns";

interface StockMovement {
  id: number;
  warehouse: { name: string };
  videoEquipment?: { name: string; serialNumber: string };
  ledStock?: { companyName: string; ledType: string };
  action: string;
  quantity: number;
  notes: string;
  createdAt: string;
}

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      const { data } = await api.get("/warehouse/movements/all");
      setMovements(data);
    } catch (error) {
      console.error("Failed to load stock movements", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionConfig = (action: string) => {
    switch(action) {
      case 'SENT_TO_ORDER': return { icon: ArrowUpFromLine, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/50', label: 'Dispatched' };
      case 'RETURNED': return { icon: ArrowDownToLine, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/50', label: 'Returned' };
      case 'DAMAGED': return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/50', label: 'Damaged' };
      default: return { icon: Package, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/50', label: action };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <ArrowRightLeft className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Stock Movements
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">A chronological timeline of all inventory dispatch and return activity.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        {loading ? (
          <p className="text-center text-slate-400 py-8">Loading history...</p>
        ) : movements.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No Movements Yet</h3>
            <p className="text-slate-500 max-w-md mx-auto">Dispatch or return equipment to see activity logs here.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-100 dark:border-slate-700 ml-4 space-y-8">
            {movements.map((mov) => {
              const conf = getActionConfig(mov.action);
              const Icon = conf.icon;
              const equipName = mov.videoEquipment ? `${mov.videoEquipment.name} (${mov.videoEquipment.serialNumber})` : 
                                mov.ledStock ? `${mov.ledStock.companyName} ${mov.ledStock.ledType}` : 'Unknown Equipment';
              
              return (
                <div key={mov.id} className="relative pl-8 group">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-4 border-white dark:border-slate-800 flex items-center justify-center ${conf.bg} ${conf.color}`}>
                    <Icon className="w-3.5 h-3.5" strokeWidth={3} />
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700 transition-colors group-hover:bg-slate-100/50 dark:group-hover:bg-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${conf.bg} ${conf.color}`}>
                            {conf.label}
                          </span>
                          <span className="text-xs font-bold text-slate-400 uppercase">{mov.warehouse.name}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">
                          {mov.quantity}x {equipName}
                        </p>
                        {mov.notes && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{mov.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 text-xs shrink-0 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(mov.createdAt), "MMM d, h:mm a")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
