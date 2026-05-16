"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, FunnelChart, Funnel, LabelList
} from 'recharts';
import { motion } from 'framer-motion';
import {
  ClipboardList, CheckCircle2, Clock, XCircle, TrendingUp,
  CalendarDays, CalendarRange, Download, FileDown,
  Eye, Users, CalendarCheck, Video, Monitor, UserCog,
} from 'lucide-react';

import ClientReport from './components/ClientReport';
import AvailabilityReport from './components/AvailabilityReport';
import VideoReport from './components/VideoReport';
import LedReport from './components/LedReport';
import StaffReport from './components/StaffReport';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const REPORT_TABS = [
  { key: 'inquiries', label: 'Inquiries', icon: ClipboardList },
  { key: 'clients', label: 'Clients', icon: Users },
  { key: 'availability', label: 'Availability', icon: CalendarCheck },
  { key: 'video', label: 'Video Dept', icon: Video },
  { key: 'led', label: 'LED Dept', icon: Monitor },
  { key: 'staff', label: 'Staff & Users', icon: UserCog },
];

// ─── INQUIRY REPORT (original, preserved) ────────────────
function InquiryReport() {
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    startDate: '', endDate: '', status: '', source: '', priority: '', category: '', dept: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(Object.entries(filters).filter(([_, v]) => v !== '')).toString();
      const [statsRes, chartsRes] = await Promise.all([
        api.get(`/analytics/stats?${queryParams}`),
        api.get(`/analytics/charts?${queryParams}`)
      ]);
      setStats(statsRes.data);
      setCharts(chartsRes.data);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleExportCSV = () => {
    if (!stats || !stats.recentInquiries || stats.recentInquiries.length === 0) {
      alert("No data available to export.");
      return;
    }
    const headers = ["Inquiry Number", "Client Name", "Event Name", "Venue", "Status", "Total Days", "Start Date", "End Date", "Special Notes"];
    const rows = stats.recentInquiries.map((inq: any) => [
      inq.inquiryNumber || `INQ-${inq.id}`, inq.client?.name || "-", inq.eventName, inq.venue, inq.status, inq.totalDays,
      new Date(inq.startDate).toLocaleDateString(), new Date(inq.endDate).toLocaleDateString(),
      (inq.specialNotes || "").replace(/,/g, ";")
    ]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map((e: any) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BK_Media_Inquiries_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (loading && !stats) return <div className="p-8 text-slate-500">Preparing insights...</div>;

  const summaryCards = [
    { title: "Total Inquiries", value: stats?.totalInquiries, icon: ClipboardList, color: "blue" },
    { title: "Approved", value: stats?.approvedInquiries, icon: CheckCircle2, color: "green" },
    { title: "Pending", value: stats?.pendingInquiries, icon: Clock, color: "orange" },
    { title: "Rejected", value: stats?.rejectedInquiries, icon: XCircle, color: "red" },
    { title: "Conversion Rate", value: `${stats?.conversionRate}%`, icon: TrendingUp, color: "purple" },
    { title: "This Month", value: stats?.monthInquiries, icon: CalendarRange, color: "pink" },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Start Date</label>
            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">End Date</label>
            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white">
              <option value="">All Status</option><option value="INQUIRY">Inquiry</option><option value="QUOTATION_SENT">Quotation Sent</option><option value="CONFIRMED">Confirmed</option><option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Department</label>
            <select name="dept" value={filters.dept} onChange={handleFilterChange} className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white">
              <option value="">All Depts</option><option value="VIDEO">Video</option><option value="LED">LED</option><option value="SOUND">Sound</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Source</label>
            <select name="source" value={filters.source} onChange={handleFilterChange} className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white">
              <option value="">All Sources</option><option value="INSTAGRAM">Instagram</option><option value="WEBSITE">Website</option><option value="WHATSAPP">WhatsApp</option><option value="REFERRAL">Referral</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Priority</label>
            <select name="priority" value={filters.priority} onChange={handleFilterChange} className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-white">
              <option value="">All Priority</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => setFilters({ startDate: '', endDate: '', status: '', source: '', priority: '', category: '', dept: '' })} className="w-full text-xs p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 transition-colors">Reset</button>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <button onClick={handleExportCSV} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2">
          <Download className="w-4 h-4" strokeWidth={1.75} /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={card.title}
            className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/20 dark:border-slate-700 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-2">
              <span className={`group-hover:scale-110 transition-transform text-${card.color}-600 dark:text-${card.color}-400`}><card.icon className="w-6 h-6" strokeWidth={1.75} /></span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Inquiry Growth Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.monthlyTrends}>
                <defs><linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Status Breakdown</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={charts?.statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                {charts?.statusDistribution?.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {charts?.statusDistribution?.map((entry: any, index: number) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-xs text-slate-600 dark:text-slate-400">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Department Performance</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.departmentStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Inquiry Sources</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={charts?.sourceStats} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                {charts?.sourceStats?.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />))}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN REPORTS HUB ────────────────────────────────────
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('inquiries');

  return (
    <div className="w-full space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Reports & Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Comprehensive insights across all departments.</p>
      </div>

      {/* Tab Navigation Pills */}
      <div className="flex gap-2 flex-wrap">
        {REPORT_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/40'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" strokeWidth={1.75} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'inquiries' && <InquiryReport />}
        {activeTab === 'clients' && <ClientReport />}
        {activeTab === 'availability' && <AvailabilityReport />}
        {activeTab === 'video' && <VideoReport />}
        {activeTab === 'led' && <LedReport />}
        {activeTab === 'staff' && <StaffReport />}
      </div>
    </div>
  );
}
