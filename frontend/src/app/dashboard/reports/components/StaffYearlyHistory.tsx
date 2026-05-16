"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { 
  User, 
  Calendar, 
  IndianRupee, 
  ClipboardList, 
  Download,
  Search,
  ChevronRight,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { format } from "date-fns";

export default function StaffYearlyHistory() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [historyData, setHistoryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await api.get("/staff");
      setStaffList(res.data);
    } catch (error) {
      console.error("Failed to fetch staff list", error);
    }
  };

  const fetchHistory = async () => {
    if (!selectedStaffId) return;
    setLoading(true);
    try {
      const res = await api.get(`/analytics/staff-yearly-history?staffId=${selectedStaffId}&year=${selectedYear}`);
      setHistoryData(res.data);
    } catch (error) {
      console.error("Failed to fetch yearly history", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedStaffId, selectedYear]);

  const handleExport = () => {
    if (!historyData) return;
    const headers = ["Month", "Events", "Total Days", "Earnings"];
    const rows = historyData.monthlyBreakdown.map((m: any) => [m.month, m.events, m.days, m.earnings]);
    const csv = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map((r: any) => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `${historyData.staffName}_${selectedYear}_History.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Selector Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Select Staff Member</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-slate-900 dark:text-white outline-none ring-blue-500/20 focus:ring-4 transition-all appearance-none"
            >
              <option value="">Select a staff member...</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="w-full md:w-48 space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Year</label>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 dark:text-white outline-none ring-blue-500/20 focus:ring-4 transition-all"
          >
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        {historyData && (
          <button 
            onClick={handleExport}
            className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-xl transition-all"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Analyzing Yearly Data...</p>
        </div>
      ) : historyData ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-3xl text-white shadow-lg shadow-blue-200 dark:shadow-none">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white/20 rounded-xl"><ClipboardList className="w-6 h-6" /></div>
                <span className="text-xs font-black uppercase bg-white/20 px-2 py-1 rounded">Events</span>
              </div>
              <p className="text-4xl font-black">{historyData.summary.totalEvents}</p>
              <p className="text-sm font-medium opacity-80 mt-1">Total assignments in {selectedYear}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 rounded-3xl text-white shadow-lg shadow-emerald-200 dark:shadow-none">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white/20 rounded-xl"><Calendar className="w-6 h-6" /></div>
                <span className="text-xs font-black uppercase bg-white/20 px-2 py-1 rounded">Days</span>
              </div>
              <p className="text-4xl font-black">{historyData.summary.totalDays}</p>
              <p className="text-sm font-medium opacity-80 mt-1">Total working days</p>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-3xl text-white shadow-lg shadow-purple-200 dark:shadow-none">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-white/20 rounded-xl"><IndianRupee className="w-6 h-6" /></div>
                <span className="text-xs font-black uppercase bg-white/20 px-2 py-1 rounded">Earnings</span>
              </div>
              <p className="text-4xl font-black">₹{historyData.summary.totalEarnings.toLocaleString()}</p>
              <p className="text-sm font-medium opacity-80 mt-1">Estimated yearly payout</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Monthly Earnings Chart */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" /> Monthly Earning Curve
                </h3>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historyData.monthlyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: 'rgba(59, 130, 246, 0.05)'}}
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                    />
                    <Bar dataKey="earnings" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Events Stats */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Workload Intensity</h3>
              <div className="space-y-4">
                {historyData.monthlyBreakdown.filter((m: any) => m.events > 0).map((m: any) => (
                  <div key={m.month} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-500">
                        {m.month.substring(0, 3)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{m.events} Events</p>
                        <p className="text-[11px] text-slate-500">{m.days} working days</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{m.earnings.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {historyData.summary.totalEvents === 0 && (
                  <p className="text-center py-10 text-slate-400 text-sm italic">No working data found for this year.</p>
                )}
              </div>
            </div>
          </div>

          {/* Event History Table */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-800 dark:text-white">Detailed Event Log</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Inquiry / Event</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Period</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Work Days</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Earning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {historyData.events.map((event: any) => (
                    <tr key={event.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">
                            {event.eventName}
                          </p>
                          <p className="text-[10px] font-black text-slate-400 mt-0.5">{event.inquiryNumber}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(event.startDate), "MMM dd")} - {format(new Date(event.endDate), "MMM dd, yyyy")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{event.days} Days</span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">
                        ₹{event.earnings.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-slate-200 dark:text-slate-700" />
          <h3 className="text-xl font-bold text-slate-400">Select a staff member to view history</h3>
          <p className="text-sm text-slate-400 mt-1">Get a detailed breakdown of yearly earnings and event performance.</p>
        </div>
      )}
    </div>
  );
}
