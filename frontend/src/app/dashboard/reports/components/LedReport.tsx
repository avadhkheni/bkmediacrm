"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import PageSkeleton from "@/components/PageSkeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Monitor, Download, FileDown, Layers, Box } from 'lucide-react';
import { exportToCSV } from "@/lib/exportUtils";
import { generateLedReportPDF } from "@/lib/pdfGenerator";

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];

export default function LedReport() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/led').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleExportCSV = () => {
    if (!data) return;
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Entries', data.totalEntries],
      ['Total Cabinets', data.totalCabinets],
      ['Total Boxes', data.totalBoxes],
      ['Active Allocations', data.activeAllocations]
    ];
    exportToCSV(headers, rows, `LED_Report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportPDF = () => {
    if (!data) return;
    generateLedReportPDF(data);
  };

  if (loading) return <PageSkeleton variant="report" />;
  if (!data) return <div className="py-12 text-center text-red-500">Failed to load data.</div>;

  const cards = [
    { title: "Stock Entries", value: data.totalEntries, icon: Monitor, color: "blue" },
    { title: "Total Cabinets", value: data.totalCabinets, icon: Layers, color: "green" },
    { title: "Total Boxes", value: data.totalBoxes, icon: Box, color: "purple" },
    { title: "Active Allocations", value: data.activeAllocations, icon: Layers, color: "orange" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-3">
        <button onClick={handleExportCSV} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
        <button onClick={handleExportPDF} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none">
          <FileDown className="w-4 h-4" /> Export PDF
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c,i) => (
          <div key={i} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/20 dark:border-slate-700 p-5 rounded-2xl shadow-sm">
            <c.icon className={`w-6 h-6 text-${c.color}-600 dark:text-${c.color}-400 mb-2`} strokeWidth={1.75} />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{c.title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">By LED Type</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={data.byType} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                {data.byType?.map((_:any,i:number)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie><Tooltip/></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">{data.byType?.map((e:any,i:number)=>(<div key={i} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor:COLORS[i%COLORS.length]}}/><span className="text-xs text-slate-500">{e.name}</span></div>))}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">By Company</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byCompany}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:11}}/>
                <YAxis axisLine={false} tickLine={false}/>
                <Tooltip cursor={{fill:'#f1f5f9'}}/>
                <Bar dataKey="value" fill="#10b981" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
