"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { Users, Building2, CalendarDays, FileText, Download } from 'lucide-react';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];

export default function ClientReport() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/clients').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleExport = () => {
    if (!data) return;
    const rows = [['Metric','Value'],['Total Clients',data.totalClients],['New This Month',data.newThisMonth],['New Today',data.newToday],['With Company',data.withCompany],['With GST',data.withGst]];
    const csv = "data:text/csv;charset=utf-8," + rows.map(r=>r.join(",")).join("\n");
    const link = document.createElement("a"); link.href = encodeURI(csv); link.download = `Clients_Report_${new Date().toISOString().split('T')[0]}.csv`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (loading) return <div className="py-12 text-center text-slate-500">Loading client analytics...</div>;
  if (!data) return <div className="py-12 text-center text-red-500">Failed to load data.</div>;

  const cards = [
    { title: "Total Clients", value: data.totalClients, icon: Users, color: "blue" },
    { title: "New This Month", value: data.newThisMonth, icon: CalendarDays, color: "green" },
    { title: "With Company", value: data.withCompany, icon: Building2, color: "purple" },
    { title: "With GST", value: data.withGst, icon: FileText, color: "orange" },
  ];

  const pieData = [
    { name: 'With Company', value: data.withCompany },
    { name: 'Without Company', value: data.totalClients - data.withCompany },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={handleExport} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c,i) => (
          <div key={i} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/20 dark:border-slate-700 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <c.icon className={`w-6 h-6 text-${c.color}-600 dark:text-${c.color}-400`} strokeWidth={1.75} />
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{c.title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Client Growth (6 Months)</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyGrowth}>
                <defs><linearGradient id="cgc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize:12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize:12}} />
                <Tooltip contentStyle={{backgroundColor:'#1e293b',border:'none',borderRadius:'12px',color:'#fff'}} />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#cgc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Company Profile</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                {pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie><Tooltip/></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">{pieData.map((e,i)=>(<div key={i} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor:COLORS[i]}}/><span className="text-xs text-slate-500">{e.name}</span></div>))}</div>
        </div>
      </div>

      {data.topClients?.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Top Clients by Inquiries</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topClients}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:11}}/>
                <YAxis axisLine={false} tickLine={false}/>
                <Tooltip cursor={{fill:'#f1f5f9'}}/>
                <Bar dataKey="inquiries" fill="#8b5cf6" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
