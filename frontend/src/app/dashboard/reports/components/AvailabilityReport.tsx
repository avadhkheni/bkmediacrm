"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import PageSkeleton from "@/components/PageSkeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Monitor, Layers, Download, FileDown } from 'lucide-react';
import { exportToCSV } from "@/lib/exportUtils";
import { generateAvailabilityReportPDF } from "@/lib/pdfGenerator";

const COLORS = ['#10b981','#ef4444','#f59e0b','#3b82f6','#8b5cf6'];

export default function AvailabilityReport() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/availability-report').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleExportCSV = () => {
    if (!data) return;
    const headers = ['Resource Category', 'Available / Free', 'Total Assets', 'Utilization Rate'];
    const rows = [
      ['Staff Members', `${data.staff.available} / ${data.staff.total}`, data.staff.total, `${data.staff.utilization}%`],
      ['LED Screen SqFt', `${data.led.freeSqft} SqFt / ${data.led.freeSqft + data.led.bookedSqft} SqFt`, data.led.freeSqft + data.led.bookedSqft, `${data.led.utilization}%`],
      ['Video Equipment', `${data.video.free} / ${data.video.total}`, data.video.total, `${data.video.utilization}%`]
    ];
    exportToCSV(headers, rows, `Resource_Availability_Report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportPDF = () => {
    if (!data) return;
    generateAvailabilityReportPDF(data);
  };

  if (loading) return <PageSkeleton variant="report" />;
  if (!data) return <div className="py-12 text-center text-red-500">Failed to load data.</div>;

  const staffPie = [{ name: 'Available', value: data.staff.available },{ name: 'Busy', value: data.staff.busy }];
  const ledPie = [{ name: 'Free SqFt', value: data.led.freeSqft },{ name: 'Booked SqFt', value: data.led.bookedSqft }];
  const videoPie = [{ name: 'Free', value: data.video.free },{ name: 'Booked', value: data.video.booked }];
  const utilBar = [
    { name: 'Staff', utilization: Number(data.staff.utilization) },
    { name: 'LED', utilization: Number(data.led.utilization) },
    { name: 'Video', utilization: Number(data.video.utilization) },
  ];

  const cards = [
    { title: "Staff Available", value: `${data.staff.available}/${data.staff.total}`, icon: Users, color: "green", sub: `${data.staff.utilization}% utilized` },
    { title: "LED Free SqFt", value: data.led.freeSqft, icon: Monitor, color: "blue", sub: `${data.led.utilization}% utilized` },
    { title: "Video Free", value: `${data.video.free}/${data.video.total}`, icon: Layers, color: "purple", sub: `${data.video.utilization}% utilized` },
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c,i) => (
          <div key={i} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/20 dark:border-slate-700 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-2"><c.icon className={`w-6 h-6 text-${c.color}-600 dark:text-${c.color}-400`} strokeWidth={1.75} /></div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{c.title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{c.value}</p>
            <p className="text-xs text-slate-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Utilization Overview (%)</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={utilBar}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
              <XAxis dataKey="name" axisLine={false} tickLine={false}/>
              <YAxis axisLine={false} tickLine={false} domain={[0,100]}/>
              <Tooltip cursor={{fill:'#f1f5f9'}}/>
              <Bar dataKey="utilization" fill="#3b82f6" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[{title:'Staff',d:staffPie},{title:'LED SqFt',d:ledPie},{title:'Video Equipment',d:videoPie}].map((section,si)=>(
          <div key={si} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{section.title}</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={section.d} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {section.d.map((_: any,i: number)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie><Tooltip/></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">{section.d.map((e: any,i: number)=>(<div key={i} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor:COLORS[i]}}/><span className="text-xs text-slate-500">{e.name}: {e.value}</span></div>))}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
