"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Plus, Trash2, Pencil, Phone, Mail, MapPin, BadgeCheck, Loader2 } from "lucide-react";

interface Vendor {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  department: string | null;
  specialization: string | null;
  address: string | null;
  gstNumber: string | null;
}

interface VendorSectionProps {
  department: string;
}

export default function VendorSection({ department }: VendorSectionProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
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
    department: department
  });

  const fetchVendors = async () => {
    try {
      const { data } = await api.get(`/vendors?department=${department}`);
      setVendors(data);
    } catch (error) {
      console.error("Failed to load vendors", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [department]);

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
        department: department
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
      department: v.department || department
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">External Vendors</h3>
          <p className="text-sm text-slate-500">Manage third-party equipment and service providers for {department}</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ name: "", phone: "", email: "", specialization: "", address: "", gstNumber: "", department });
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p>Loading vendors...</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
            No vendors registered for this department.
          </div>
        ) : (
          vendors.map((vendor) => (
            <div key={vendor.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                  <BadgeCheck className="w-6 h-6" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(vendor)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(vendor.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{vendor.name}</h4>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4">
                {vendor.specialization || "General Vendor"}
              </p>

              <div className="space-y-2.5">
                {vendor.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Phone className="w-4 h-4" />
                    {vendor.phone}
                  </div>
                )}
                {vendor.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Mail className="w-4 h-4" />
                    {vendor.email}
                  </div>
                )}
                {vendor.address && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">{vendor.address}</span>
                  </div>
                )}
              </div>

              {vendor.gstNumber && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GST Number</span>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{vendor.gstNumber}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingId ? "Edit Vendor" : "Add New Vendor"}</h3>
              <p className="text-sm text-slate-500">Department: {department}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Vendor Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="e.g. Sharp Sight Solutions"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Phone Number</label>
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Specialization</label>
                    <input 
                      type="text" 
                      value={formData.specialization}
                      onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="e.g. 4K Cameras"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="vendor@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">GST Number (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({...formData, gstNumber: e.target.value.toUpperCase()})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Office Address</label>
                  <textarea 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    rows={3}
                    placeholder="Full business address..."
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingId ? "Update Vendor" : "Create Vendor"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
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
