"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { UserPlus, Trash2 } from "lucide-react";
import { usePermission } from "@/lib/usePermission";

export default function StaffPage() {
  const { hasPermission } = usePermission();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    role: "TECHNICIAN",
    phone: "",
    email: "",
    department: "VIDEO",
    perDayRate: "",
    staffType: "CONTRACT",
    aadharNumber: "",
    address: ""
  });

  const fetchStaff = async () => {
    try {
      const { data } = await api.get("/staff");
      setStaff(data);
    } catch (error) {
      console.error("Failed to load staff", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/staff/${editingId}`, formData);
      } else {
        await api.post("/staff", formData);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({
        name: "",
        role: "TECHNICIAN",
        phone: "",
        email: "",
        department: "VIDEO",
        perDayRate: "",
        staffType: "CONTRACT",
        aadharNumber: "",
        address: ""
      });
      fetchStaff();
    } catch (error) {
      console.error("Failed to create staff", error);
      alert("Failed to create staff. Please check required fields.");
    } finally {
      setSubmitting(false);
    }
  };
  const handleEdit = (s: any) => {
    setFormData({
      name: s.name,
      role: s.role,
      phone: s.phone,
      email: s.email || "",
      department: s.department || "VIDEO",
      perDayRate: (s.perDayRate !== null && s.perDayRate !== undefined) ? String(s.perDayRate) : "",
      staffType: s.staffType,
      aadharNumber: s.aadharNumber || "",
      address: s.address || ""
    });
    setEditingId(s.id);
    setShowModal(true);
  };

  const handleAddClick = () => {
    setFormData({
      name: "",
      role: "TECHNICIAN",
      phone: "",
      email: "",
      department: "VIDEO",
      perDayRate: "",
      staffType: "CONTRACT",
      aadharNumber: "",
      address: ""
    });
    setEditingId(null);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this staff member? It will be archived for 30 days.")) {
      try {
        await api.delete(`/staff/${id}`);
        fetchStaff();
      } catch (error) {
        console.error("Failed to delete staff", error);
        alert("Failed to delete staff");
      }
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Staff & Users</h2>
        {hasPermission("STAFF", "canCreate") && (
          <button 
            onClick={handleAddClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 shadow-sm shadow-blue-200 dark:shadow-none"
          >
            <UserPlus className="w-4 h-4" /> Add Staff
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Source</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right">Rate / Day</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={4} className="py-8 text-center text-gray-500 dark:text-slate-400">Loading staff...</td></tr>
              ) : staff.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-gray-500 dark:text-slate-400">No staff found.</td></tr>
              ) : (
                staff.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                          {s.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">{s.email || s.phone || "No contact info"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 dark:text-slate-300">
                      <span className="capitalize">{s.role.replace('_', ' ').toLowerCase()}</span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${s.staffType === 'IN_HOUSE' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>
                        {s.staffType === 'IN_HOUSE' ? 'In-house' : 'External'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {s.perDayRate ? `₹${Number(s.perDayRate).toLocaleString()}` : '-'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        {hasPermission("STAFF", "canUpdate") && (
                          <button 
                            onClick={() => handleEdit(s)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                          </button>
                        )}
                        {hasPermission("STAFF", "canDelete") && (
                          <button 
                            onClick={() => handleDelete(s.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{editingId ? 'Edit Staff Member' : 'Add New Staff'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Rahul Kumar"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number *</label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="TECHNICIAN">Technician</option>
                    <option value="OPERATOR">Operator</option>
                    <option value="ENGINEER">Engineer</option>
                    <option value="LABOUR">Labour</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="VIDEO">Video</option>
                    <option value="LED">LED</option>
                    <option value="SOUND">Sound</option>
                    <option value="OFFICE">Office</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Staff Type</label>
                  <select
                    value={formData.staffType}
                    onChange={(e) => setFormData({...formData, staffType: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="CONTRACT">Contract / Freelance</option>
                    <option value="IN_HOUSE">In-House</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Per Day Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.perDayRate}
                    onChange={(e) => setFormData({...formData, perDayRate: Math.max(0, Number(e.target.value)).toString()})}
                    placeholder="e.g. 1500"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aadhar Number</label>
                  <input
                    type="text"
                    maxLength={12}
                    value={formData.aadharNumber}
                    onChange={(e) => setFormData({...formData, aadharNumber: e.target.value})}
                    onInput={(e) => {
                      e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                    }}
                    placeholder="12 digit Aadhar number"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</label>
                  <textarea
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Full residential address..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400 resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                {(editingId ? hasPermission("STAFF", "canUpdate") : hasPermission("STAFF", "canCreate")) && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : editingId ? "Update Staff" : "Create Staff"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
