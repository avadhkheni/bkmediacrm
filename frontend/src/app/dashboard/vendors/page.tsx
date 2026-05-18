"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  Plus, 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Pencil, 
  Trash2, 
  Loader2, 
  Briefcase, 
  ShieldCheck,
  CheckCircle2,
  Video,
  Monitor,
  Speaker
} from "lucide-react";

interface Vendor {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  department: string | null;
  specialization: string | null;
  address: string | null;
  gstNumber: string | null;
  isActive: boolean;
}

export default function VendorsMasterPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<"ALL" | "VIDEO" | "LED" | "SOUND">("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    specialization: "",
    address: "",
    gstNumber: "",
    department: "VIDEO"
  });

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/vendors");
      setVendors(data);
    } catch (error) {
      console.error("Failed to fetch all vendors", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`/vendors/${editingId}`, formData);
      } else {
        await api.post("/vendors", formData);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({
        name: "",
        phone: "",
        email: "",
        specialization: "",
        address: "",
        gstNumber: "",
        department: "VIDEO"
      });
      fetchVendors();
    } catch (error) {
      console.error("Failed to save vendor", error);
      alert("Failed to save vendor details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (v: Vendor) => {
    setFormData({
      name: v.name,
      phone: v.phone || "",
      email: v.email || "",
      specialization: v.specialization || "",
      address: v.address || "",
      gstNumber: v.gstNumber || "",
      department: v.department || "VIDEO"
    });
    setEditingId(v.id);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      try {
        await api.delete(`/vendors/${id}`);
        fetchVendors();
      } catch (error) {
        console.error("Failed to delete vendor", error);
      }
    }
  };

  // Filter vendors based on department tab and search query
  const filteredVendors = vendors.filter((v) => {
    const matchesDept = selectedDept === "ALL" || v.department === selectedDept;
    const matchesQuery = 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.specialization?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (v.phone || "").includes(searchQuery) ||
      (v.email?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    return matchesDept && matchesQuery;
  });

  const stats = {
    total: vendors.length,
    video: vendors.filter(v => v.department === "VIDEO").length,
    led: vendors.filter(v => v.department === "LED").length,
    sound: vendors.filter(v => v.department === "SOUND").length,
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-4 md:p-6 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Suppliers (Rent) Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage outside equipment suppliers and partners across all departments.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: "", phone: "", email: "", specialization: "", address: "", gstNumber: "", department: "VIDEO" });
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5" /> Add New Supplier
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Suppliers", value: stats.total, icon: Briefcase, color: "bg-slate-900 dark:bg-slate-700 text-white", shadow: "shadow-slate-500/10" },
          { label: "Video Team", value: stats.video, icon: Video, color: "bg-blue-500 text-white", shadow: "shadow-blue-500/10" },
          { label: "LED Team", value: stats.led, icon: Monitor, color: "bg-purple-500 text-white", shadow: "shadow-purple-500/10" },
          { label: "Sound Team", value: stats.sound, icon: Speaker, color: "bg-emerald-500 text-white", shadow: "shadow-emerald-500/10" },
        ].map((item, index) => (
          <div key={index} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center justify-between group hover:border-blue-500/30 transition-all duration-300">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{item.label}</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1 group-hover:scale-105 transition-transform duration-300 origin-left">{item.value}</h3>
            </div>
            <div className={`p-4 rounded-2xl ${item.color} ${item.shadow} flex items-center justify-center shrink-0`}>
              <item.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Search and Tabs Panel */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Department Tabs */}
        <div className="flex bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 self-start">
          {[
            { label: "All Teams", value: "ALL" },
            { label: "Video Team", value: "VIDEO" },
            { label: "LED Team", value: "LED" },
            { label: "Sound Team", value: "SOUND" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedDept(tab.value as any)}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                selectedDept === tab.value
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-700"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by supplier name, specialty, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Directory Table View */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
            <p className="font-semibold text-sm">Loading supplier profiles...</p>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold text-sm">No suppliers found matching your criteria.</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting filters or registering a new supplier profile.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-700/60">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Supplier Info</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Team / Dept</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Specialty / Service</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">GST & Contact Details</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors group">
                    {/* Name & Basic Details */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform duration-300">
                          {vendor.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 dark:text-white text-base leading-tight">{vendor.name}</span>
                            <ShieldCheck className="w-4.5 h-4.5 text-blue-500" />
                          </div>
                          {vendor.address && (
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 max-w-xs truncate" title={vendor.address}>
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              {vendor.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Department Tag */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold uppercase tracking-wider ${
                        vendor.department === "VIDEO" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200/30" :
                        vendor.department === "LED" ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-200/30" :
                        "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/30"
                      }`}>
                        {vendor.department === "VIDEO" && <Video className="w-3.5 h-3.5" />}
                        {vendor.department === "LED" && <Monitor className="w-3.5 h-3.5" />}
                        {vendor.department === "SOUND" && <Speaker className="w-3.5 h-3.5" />}
                        {vendor.department}
                      </span>
                    </td>

                    {/* Specialization */}
                    <td className="py-4 px-6 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {vendor.specialization || "General Supplier"}
                    </td>

                    {/* Contact & GST details */}
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {vendor.phone && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                            <Phone className="w-3.5 h-3.5" />
                            {vendor.phone}
                          </p>
                        )}
                        {vendor.email && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                            <Mail className="w-3.5 h-3.5" />
                            {vendor.email}
                          </p>
                        )}
                        {vendor.gstNumber && (
                          <p className="text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800 w-fit mt-1 uppercase tracking-wider">
                            GST Tax ID: {vendor.gstNumber}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(vendor)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                          title="Edit Profile"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vendor.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                          title="Delete Vendor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CRUD Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white tracking-tight">
                {editingId ? "Edit Supplier Profile" : "Register New Supplier"}
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">Add supplier contact registry, specialty details and tax information.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-4">
                {/* Supplier Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">Supplier Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
                    placeholder="e.g. Dynamic Stagecraft Ltd."
                  />
                </div>

                {/* Grid fields */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Department Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">Team / Dept *</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
                    >
                      <option value="VIDEO">Video Team</option>
                      <option value="LED">LED Screen Team</option>
                      <option value="SOUND">Sound/Audio Team</option>
                    </select>
                  </div>

                  {/* Specialization */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">Specialty / Service</label>
                    <input 
                      type="text" 
                      value={formData.specialization}
                      onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
                      placeholder="e.g. P2.5 LED Panels"
                    />
                  </div>
                </div>

                {/* Contact grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">Phone Number</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
                      placeholder="9876543210"
                    />
                  </div>

                  {/* GST */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">GST Tax ID</label>
                    <input 
                      type="text" 
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({...formData, gstNumber: e.target.value.toUpperCase()})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm font-mono uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
                    placeholder="supplier@example.com"
                  />
                </div>

                {/* Office Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider">Office / Business Address</label>
                  <textarea 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white resize-none"
                    rows={3}
                    placeholder="Provide details about office, warehouse or workshop address..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-3">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-2xl transition-all disabled:opacity-50 text-sm shadow-md"
                >
                  {submitting ? "Saving..." : editingId ? "Update Supplier" : "Register Supplier"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-3.5 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-650 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
