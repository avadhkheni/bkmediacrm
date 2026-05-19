"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Plus, X, Search, UserPlus, Pencil, Trash2 } from "lucide-react";

interface Client {
  id: number;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  company?: string;
  gstNumber?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", contactPerson: "", phone: "", email: "", company: "", gstNumber: "", address: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data } = await api.get("/clients?limit=200");
      setClients(data.data || data);
    } catch (error) {
      console.error("Failed to load clients", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/clients/${editingId}`, form);
      } else {
        await api.post("/clients", form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: "", contactPerson: "", phone: "", email: "", company: "", gstNumber: "", address: "" });
      fetchClients();
    } catch (error) {
      console.error("Failed to save client", error);
      alert("Failed to save client");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (c: Client) => {
    setForm({
      name: c.name,
      contactPerson: c.contactPerson || "",
      phone: c.phone,
      email: c.email || "",
      company: c.company || "",
      gstNumber: c.gstNumber || "",
      address: c.address || ""
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleAddClick = () => {
    setForm({ name: "", contactPerson: "", phone: "", email: "", company: "", gstNumber: "", address: "" });
    setEditingId(null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this client? It will be archived for 30 days.")) {
      try {
        await api.delete(`/clients/${id}`);
        fetchClients();
      } catch (error) {
        console.error("Failed to delete client", error);
        alert("Failed to delete client");
      }
    }
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company || "").toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Clients</h2>
        <button
          onClick={handleAddClick}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            showForm && !editingId
            ? "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200" 
            : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {showForm && !editingId ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {showForm && !editingId ? "Cancel" : "Add Client"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
            {editingId ? "Edit Client" : "Add New Client"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
              <input type="text" required placeholder="Full Name (e.g. Rahul Sharma)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone *</label>
              <input 
                type="text" 
                required 
                placeholder="9876543210" 
                value={form.phone} 
                onChange={e => setForm({ ...form, phone: e.target.value })} 
                onInput={(e) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                }}
                className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company</label>
              <input type="text" placeholder="BK Media Pvt Ltd" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input type="email" placeholder="client@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Person</label>
              <input type="text" placeholder="Main Contact Person" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">GST Number</label>
              <input type="text" placeholder="22AAAAA0000A1Z5" value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })} className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
              <input type="text" placeholder="Street, City, State, ZIP" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-70">
              {submitting ? "Saving..." : editingId ? "Update Client" : "Create Client"}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="ml-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name & Contact</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Company</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone / Email</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Address</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">GST</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500">Loading clients...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500">No clients found.</td></tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-6">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Contact: {c.contactPerson || "N/A"}</p>
                    </td>
                    <td className="py-3 px-6 text-sm text-slate-700 dark:text-slate-300">{c.company || "-"}</td>
                    <td className="py-3 px-6">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{c.phone}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{c.email || "No email"}</p>
                    </td>
                    <td className="py-3 px-6 text-sm text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                      {c.address || "-"}
                    </td>
                    <td className="py-3 px-6 text-sm text-slate-700 dark:text-slate-300">{c.gstNumber || "-"}</td>
                    <td className="py-3 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => router.push(`/dashboard/clients/details?id=${c.id}`)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(c)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)}
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
