"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Trash2, Eye, Download, Loader2, Filter } from "lucide-react";
import { generateInquiryPDF } from "@/lib/pdfGenerator";
import PageSkeleton from "@/components/PageSkeleton";

interface Inquiry {
  id: number;
  inquiryNumber: string;
  eventName: string;
  department: string;
  startDate: string;
  endDate: string;
  status: string;
  client: { name: string; company?: string };
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Advanced Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const { data } = await api.get("/inquiries");
      setInquiries(data.data);
    } catch (error) {
      console.error("Failed to load inquiries", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this inquiry? It will be archived for 30 days.")) {
      try {
        await api.delete(`/inquiries/${id}`);
        fetchInquiries();
      } catch (error) {
        console.error("Failed to delete inquiry", error);
        alert("Failed to delete inquiry");
      }
    }
  };

  const handleDownloadPDF = async (id: number) => {
    setDownloadingId(id);
    try {
      const { data } = await api.get(`/inquiries/${id}`);
      generateInquiryPDF(data);
    } catch (error) {
      console.error("Failed to generate PDF", error);
      alert("Failed to generate PDF details.");
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "INQUIRY": return "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50";
      case "CONFIRMED": return "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200/20";
      case "IN_PROGRESS": return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/20";
      case "COMPLETED": return "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 border border-teal-200/20";
      case "CANCELLED": return "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/20";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Filter inquiries based on selected parameters
  const filtered = inquiries.filter((inq) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      inq.inquiryNumber?.toLowerCase().includes(term) ||
      inq.eventName.toLowerCase().includes(term) ||
      inq.client.name.toLowerCase().includes(term) ||
      inq.client.company?.toLowerCase().includes(term);

    const matchesDept = selectedDept === "ALL" || inq.department === selectedDept;
    const matchesStatus = selectedStatus === "ALL" || inq.status === selectedStatus;

    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(inq.startDate) >= new Date(startDate);
    }
    if (endDate) {
      matchesDate = matchesDate && new Date(inq.endDate) <= new Date(endDate);
    }

    return matchesSearch && matchesDept && matchesStatus && matchesDate;
  });

  const hasActiveFilters = searchTerm || selectedDept !== "ALL" || selectedStatus !== "ALL" || startDate || endDate;

  if (loading) return <PageSkeleton variant="table" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Inquiries</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition-all active:scale-95 flex items-center justify-center relative ${
              showFilters || hasActiveFilters
                ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400"
                : "bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
            title="Toggle Filters"
          >
            <Filter className="w-5 h-5" strokeWidth={2} />
            {hasActiveFilters && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 border-2 border-white dark:border-slate-800 animate-pulse"></span>
            )}
          </button>
          <Link 
            href="/dashboard/inquiries/new" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center gap-1 text-sm"
          >
            + New Inquiry
          </Link>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-250 ease-out">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-[11px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest flex items-center gap-2">
              🔍 Filter Inquiries ({filtered.length} of {inquiries.length})
            </h3>
            {hasActiveFilters && (
              <button 
                onClick={() => {
                  setSearchTerm("");
                  setSelectedDept("ALL");
                  setSelectedStatus("ALL");
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs font-extrabold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors uppercase tracking-wider"
              >
                Clear All Filters
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search Term */}
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Search Event / Client</label>
              <input
                type="text"
                placeholder="e.g. Wedding, Client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Department Selector */}
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                <option value="VIDEO">Video</option>
                <option value="LED">LED</option>
                <option value="SOUND">Sound</option>
              </select>
            </div>

            {/* Status Selector */}
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="INQUIRY">Inquiry</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Event From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Event To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Number</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Event Name</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dates</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dept</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500">No matching inquiries found.</td></tr>
              ) : (
                filtered.map((inq) => (
                  <tr key={inq.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-slate-900 dark:text-white">{inq.inquiryNumber || `INQ-${inq.id}`}</td>
                    <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300">{inq.eventName}</td>
                    <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300">
                      {inq.client.name} <span className="text-slate-400 text-xs block">{inq.client.company}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300">
                      {new Date(inq.startDate).toLocaleDateString()} - {new Date(inq.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                        inq.department === 'VIDEO' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 
                        inq.department === 'LED' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : 
                        inq.department === 'SOUND' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 
                        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>
                        {inq.department}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(inq.status)}`}>
                        {inq.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <Link 
                          href={`/dashboard/inquiries/details?id=${inq.id}`} 
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDownloadPDF(inq.id)}
                          disabled={downloadingId !== null}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all disabled:opacity-50"
                          title="Download PDF"
                        >
                          {downloadingId === inq.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                        <button 
                          onClick={() => handleDelete(inq.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
