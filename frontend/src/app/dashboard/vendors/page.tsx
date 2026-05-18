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
  Video,
  Monitor,
  Speaker,
  ChevronDown,
  ChevronUp,
  Package,
  DollarSign,
  PlusCircle,
  Tag,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  AlertCircle,
  Truck,
  FileText
} from "lucide-react";

interface VendorProduct {
  id: number;
  name: string;
  category: string;
  ratePerDay: number;
}

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
  products: VendorProduct[];
}

interface VendorRental {
  id: number;
  vendorId: number;
  vendor: {
    id: number;
    name: string;
    department: string | null;
  };
  itemName: string;
  quantity: number;
  rentedDate: string;
  pricePerDay: number;
  totalCost: number;
  inquiryId: number | null;
  inquiry: {
    id: number;
    inquiryNumber: string | null;
    eventName: string;
    startDate: string;
    endDate: string;
    client: {
      name: string;
    } | null;
  } | null;
  returnedFromEventDate: string | null;
  returnedToVendorDate: string | null;
  status: "RENTED" | "RETURNED_FROM_EVENT" | "RETURNED_TO_VENDOR";
  notes: string | null;
}

export default function VendorsMasterPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<"ALL" | "VIDEO" | "LED" | "SOUND">("ALL");
  const [expandedVendorId, setExpandedVendorId] = useState<number | null>(null);

  // Tab System
  const [activeTab, setActiveTab] = useState<"directory" | "rentals">("directory");

  // Rentals State
  const [rentals, setRentals] = useState<VendorRental[]>([]);
  const [loadingRentals, setLoadingRentals] = useState(false);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [editingRentalId, setEditingRentalId] = useState<number | null>(null);

  // Rental Form State
  const [rentalFormData, setRentalFormData] = useState({
    vendorId: "",
    itemName: "",
    quantity: "1",
    pricePerDay: "",
    totalCost: "",
    inquiryId: "",
    rentedDate: new Date().toISOString().split("T")[0],
    endDate: "",
    notes: "",
    status: "RENTED",
    returnedFromEventDate: "",
    returnedToVendorDate: ""
  });
  
  // Modals & Submitting
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<number | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [selectedVendorForProduct, setSelectedVendorForProduct] = useState<Vendor | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Vendor Form
  const [vendorFormData, setVendorFormData] = useState({
    name: "",
    phone: "",
    email: "",
    specialization: "",
    address: "",
    gstNumber: "",
    department: "VIDEO"
  });

  // Product Form
  const [productFormData, setProductFormData] = useState({
    name: "",
    category: "VIDEO",
    ratePerDay: ""
  });

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const response = await api.get("/pdf/vendor-rentals", {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `vendor-rentals-report-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export PDF", error);
      alert("Failed to export PDF report. Please check if backend server is fully running.");
    } finally {
      setDownloadingPdf(false);
    }
  };

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

  const fetchRentals = async () => {
    try {
      setLoadingRentals(true);
      const { data } = await api.get("/vendors/rentals");
      setRentals(data);
    } catch (error) {
      console.error("Failed to fetch vendor rentals", error);
    } finally {
      setLoadingRentals(false);
    }
  };

  const fetchInquiries = async () => {
    try {
      const { data } = await api.get("/inquiries");
      setInquiries(data.data || []);
    } catch (error) {
      console.error("Failed to fetch inquiries", error);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (activeTab === "rentals") {
      fetchRentals();
      fetchInquiries();
    }
  }, [activeTab]);

  const handleRentalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        vendorId: Number(rentalFormData.vendorId),
        itemName: rentalFormData.itemName,
        quantity: Number(rentalFormData.quantity || 1),
        pricePerDay: Number(rentalFormData.pricePerDay),
        totalCost: Number(rentalFormData.totalCost || (Number(rentalFormData.pricePerDay) * Number(rentalFormData.quantity || 1))),
        inquiryId: rentalFormData.inquiryId ? Number(rentalFormData.inquiryId) : null,
        rentedDate: rentalFormData.rentedDate,
        endDate: rentalFormData.endDate || null,
        notes: rentalFormData.notes,
        status: rentalFormData.status,
        returnedFromEventDate: rentalFormData.returnedFromEventDate || null,
        returnedToVendorDate: rentalFormData.returnedToVendorDate || null
      };

      if (editingRentalId) {
        await api.patch(`/vendors/rentals/${editingRentalId}`, payload);
      } else {
        await api.post("/vendors/rentals", payload);
      }

      setShowRentalModal(false);
      setEditingRentalId(null);
      setRentalFormData({
        vendorId: "",
        itemName: "",
        quantity: "1",
        pricePerDay: "",
        totalCost: "",
        inquiryId: "",
        rentedDate: new Date().toISOString().split("T")[0],
        endDate: "",
        notes: "",
        status: "RENTED",
        returnedFromEventDate: "",
        returnedToVendorDate: ""
      });
      fetchRentals();
    } catch (error) {
      console.error("Failed to save vendor rental", error);
      alert("Failed to save rental record. Please verify that Vendor, Item Name, and Rate are specified.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkReturnedFromEvent = async (rental: VendorRental) => {
    const today = new Date().toISOString().split("T")[0];
    try {
      await api.patch(`/vendors/rentals/${rental.id}`, {
        status: "RETURNED_FROM_EVENT",
        returnedFromEventDate: today
      });
      fetchRentals();
    } catch (error) {
      console.error("Failed to mark returned from event", error);
    }
  };

  const handleMarkReturnedToVendor = async (rental: VendorRental) => {
    const today = new Date().toISOString().split("T")[0];
    try {
      await api.patch(`/vendors/rentals/${rental.id}`, {
        status: "RETURNED_TO_VENDOR",
        returnedToVendorDate: today
      });
      fetchRentals();
    } catch (error) {
      console.error("Failed to mark returned to vendor", error);
    }
  };

  const handleRentalEdit = (r: VendorRental) => {
    setRentalFormData({
      vendorId: String(r.vendorId),
      itemName: r.itemName,
      quantity: String(r.quantity),
      pricePerDay: String(r.pricePerDay),
      totalCost: String(r.totalCost),
      inquiryId: r.inquiryId ? String(r.inquiryId) : "",
      rentedDate: r.rentedDate ? new Date(r.rentedDate).toISOString().split("T")[0] : "",
      endDate: (r as any).endDate ? new Date((r as any).endDate).toISOString().split("T")[0] : "",
      notes: r.notes || "",
      status: r.status,
      returnedFromEventDate: r.returnedFromEventDate ? new Date(r.returnedFromEventDate).toISOString().split("T")[0] : "",
      returnedToVendorDate: r.returnedToVendorDate ? new Date(r.returnedToVendorDate).toISOString().split("T")[0] : ""
    });
    setEditingRentalId(r.id);
    setShowRentalModal(true);
  };

  const handleRentalDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this rental record?")) {
      try {
        await api.delete(`/vendors/rentals/${id}`);
        fetchRentals();
      } catch (error) {
        console.error("Failed to delete rental record", error);
      }
    }
  };

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingVendorId) {
        await api.patch(`/vendors/${editingVendorId}`, vendorFormData);
      } else {
        await api.post("/vendors", vendorFormData);
      }
      setShowVendorModal(false);
      setEditingVendorId(null);
      setVendorFormData({
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

  const handleVendorEdit = (v: Vendor) => {
    setVendorFormData({
      name: v.name,
      phone: v.phone || "",
      email: v.email || "",
      specialization: v.specialization || "",
      address: v.address || "",
      gstNumber: v.gstNumber || "",
      department: v.department || "VIDEO"
    });
    setEditingVendorId(v.id);
    setShowVendorModal(true);
  };

  const handleVendorDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      try {
        await api.delete(`/vendors/${id}`);
        fetchVendors();
      } catch (error) {
        console.error("Failed to delete vendor", error);
      }
    }
  };

  // Product Actions
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorForProduct) return;
    setSubmitting(true);
    try {
      const payload = {
        name: productFormData.name,
        category: productFormData.category,
        ratePerDay: Number(productFormData.ratePerDay)
      };

      if (editingProductId) {
        await api.patch(`/vendors/products/${editingProductId}`, payload);
      } else {
        await api.post(`/vendors/${selectedVendorForProduct.id}/products`, payload);
      }

      setShowProductModal(false);
      setEditingProductId(null);
      setProductFormData({
        name: "",
        category: selectedVendorForProduct.department ? selectedVendorForProduct.department.split(",")[0] : "VIDEO",
        ratePerDay: ""
      });
      fetchVendors();
    } catch (error) {
      console.error("Failed to save vendor product", error);
      alert("Failed to save product details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProductEdit = (vendor: Vendor, product: VendorProduct) => {
    setSelectedVendorForProduct(vendor);
    setProductFormData({
      name: product.name,
      category: product.category,
      ratePerDay: String(product.ratePerDay)
    });
    setEditingProductId(product.id);
    setShowProductModal(true);
  };

  const handleProductDelete = async (productId: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await api.delete(`/vendors/products/${productId}`);
        fetchVendors();
      } catch (error) {
        console.error("Failed to delete vendor product", error);
      }
    }
  };

  const [rentalsSearchQuery, setRentalsSearchQuery] = useState("");

  const filteredVendors = vendors.filter((v) => {
    const matchesDept = selectedDept === "ALL" || (v.department ? v.department.split(",").includes(selectedDept) : false);
    const matchesQuery = 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.specialization?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (v.phone || "").includes(searchQuery) ||
      (v.products || []).some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDept && matchesQuery;
  });

  const filteredRentals = rentals.filter((r) => {
    const query = rentalsSearchQuery.toLowerCase();
    return (
      r.itemName.toLowerCase().includes(query) ||
      r.vendor.name.toLowerCase().includes(query) ||
      (r.inquiry?.eventName || "").toLowerCase().includes(query) ||
      (r.inquiry?.inquiryNumber || "").toLowerCase().includes(query)
    );
  });

  const stats = {
    total: vendors.length,
    video: vendors.filter(v => v.department ? v.department.split(",").includes("VIDEO") : false).length,
    led: vendors.filter(v => v.department ? v.department.split(",").includes("LED") : false).length,
    sound: vendors.filter(v => v.department ? v.department.split(",").includes("SOUND") : false).length,
  };

  const rentalsStats = {
    total: rentals.reduce((sum, r) => sum + r.quantity, 0),
    out: rentals.filter(r => r.status === "RENTED").reduce((sum, r) => sum + r.quantity, 0),
    pending: rentals.filter(r => r.status === "RETURNED_FROM_EVENT").reduce((sum, r) => sum + r.quantity, 0),
    returned: rentals.filter(r => r.status === "RETURNED_TO_VENDOR").reduce((sum, r) => sum + r.quantity, 0),
  };

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-4 md:p-6 transition-colors animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            Vendors & Rentals Catalog
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Manage outside equipment vendors, products catalog per department, and trace outside hired logistics.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            disabled={downloadingPdf}
            onClick={handleDownloadPdf}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-5 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all border border-slate-200 dark:border-slate-800 active:scale-95 disabled:opacity-50"
          >
            {downloadingPdf ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-500" />
            ) : (
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            )}
            {downloadingPdf ? "Generating PDF..." : "Export PDF Report"}
          </button>

          {activeTab === "directory" ? (
            <button
              onClick={() => {
                setEditingVendorId(null);
                setVendorFormData({ name: "", phone: "", email: "", specialization: "", address: "", gstNumber: "", department: "VIDEO" });
                setShowVendorModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <Plus className="w-5 h-5" /> Add New Vendor
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingRentalId(null);
                setRentalFormData({
                  vendorId: "",
                  itemName: "",
                  quantity: "1",
                  pricePerDay: "",
                  totalCost: "",
                  inquiryId: "",
                  rentedDate: new Date().toISOString().split("T")[0],
                  endDate: "",
                  notes: "",
                  status: "RENTED",
                  returnedFromEventDate: "",
                  returnedToVendorDate: ""
                });
                setShowRentalModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <Plus className="w-5 h-5" /> Log Outside Rental
            </button>
          )}
        </div>
      </div>

      {/* Main View Tabs Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800 max-w-md w-full">
        <button
          onClick={() => setActiveTab("directory")}
          className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === "directory"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md border border-slate-100 dark:border-slate-700"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Building2 className="w-4 h-4" /> Vendor Directory
        </button>
        <button
          onClick={() => setActiveTab("rentals")}
          className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === "rentals"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md border border-slate-100 dark:border-slate-700"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" /> Rentals & Return Tracker
        </button>
      </div>

      {/* ─── TAB 1: VENDOR DIRECTORY ─────────────────────────── */}
      {activeTab === "directory" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Total Vendors", value: stats.total, icon: Briefcase, color: "bg-slate-900 dark:bg-slate-700 text-white", shadow: "shadow-slate-500/10" },
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

          {/* Search and Filter Panel */}
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
                placeholder="Search vendors or equipment catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Vendors Table View */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
                <p className="font-semibold text-sm">Loading vendor profiles...</p>
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="py-24 text-center text-slate-400">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-450" />
                <p className="font-semibold text-sm">No vendors found matching criteria.</p>
                <p className="text-xs text-slate-500 mt-1">Try updating search filters or creating a profile.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-700/60">
                      <th className="py-4 px-6 w-10"></th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vendor Info</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Team / Dept</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Catalog Count</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">GST & Contact Details</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                    {filteredVendors.map((vendor) => {
                      const isExpanded = expandedVendorId === vendor.id;
                      return (
                        <tr key={`row-group-${vendor.id}`} className="contents">
                          <tr 
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors group cursor-pointer"
                            onClick={() => setExpandedVendorId(isExpanded ? null : vendor.id)}
                          >
                            <td className="py-4 px-6 text-center">
                              {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                            </td>
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
                            <td className="py-4 px-6">
                              <div className="flex flex-wrap gap-1.5">
                                {(vendor.department || "General").split(",").map((dept) => (
                                  <span key={dept} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                                    dept === "VIDEO" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200/30" :
                                    dept === "LED" ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-200/30" :
                                    dept === "SOUND" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/30" :
                                    "bg-slate-50 dark:bg-slate-900 text-slate-500 border border-slate-200/30"
                                  }`}>
                                    {dept === "VIDEO" && <Video className="w-3 h-3" />}
                                    {dept === "LED" && <Monitor className="w-3 h-3" />}
                                    {dept === "SOUND" && <Speaker className="w-3 h-3" />}
                                    {dept}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{vendor.products?.length || 0} items listed</div>
                              <div className="text-xs text-slate-400 mt-0.5">{vendor.specialization || "General Vendor"}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                                {vendor.phone && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {vendor.phone}
                                  </p>
                                )}
                                {vendor.email && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {vendor.email}
                                  </p>
                                )}
                                {vendor.gstNumber && (
                                  <p className="text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-800 w-fit mt-1 uppercase tracking-wider">
                                    GST Tax ID: {vendor.gstNumber}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleVendorEdit(vendor)}
                                  className="p-2 text-slate-400 hover:text-blue-650 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                                  title="Edit Profile"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleVendorDelete(vendor.id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                                  title="Delete Vendor"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-50/50 dark:bg-slate-900/40">
                              <td colSpan={6} className="p-6 border-b border-slate-200 dark:border-slate-800">
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <h4 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-2">
                                        <Package className="w-4 h-4 text-blue-500" />
                                        {vendor.name}'s Rental Products Catalog
                                      </h4>
                                      <p className="text-xs text-slate-450 mt-0.5">Register items available from this vendor to rent inside Quotation and Rental orders.</p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setSelectedVendorForProduct(vendor);
                                        setEditingProductId(null);
                                        setProductFormData({ name: "", category: vendor.department ? vendor.department.split(",")[0] : "VIDEO", ratePerDay: "" });
                                        setShowProductModal(true);
                                      }}
                                      className="text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-650 px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-black/10"
                                    >
                                      <PlusCircle className="w-4 h-4" /> Add Rental Item
                                    </button>
                                  </div>

                                  {(!vendor.products || vendor.products.length === 0) ? (
                                    <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40">
                                      <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                      <p className="text-xs font-semibold">No rental items cataloged for this vendor.</p>
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {vendor.products.map((prod) => (
                                        <div key={prod.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-105 dark:border-slate-800/80 shadow-sm flex items-center justify-between group/prod hover:border-blue-500/20 transition-all">
                                          <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                                              <Tag className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div>
                                              <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{prod.name}</p>
                                              <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded uppercase">{prod.category}</span>
                                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">₹{Number(prod.ratePerDay).toLocaleString()} / day</span>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-1 opacity-0 group-hover/prod:opacity-100 transition-opacity">
                                            <button
                                              onClick={() => handleProductEdit(vendor, prod)}
                                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={() => handleProductDelete(prod.id)}
                                              className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: RENTALS & RETURN TRACKER ──────────────────── */}
      {activeTab === "rentals" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Rentals Statistics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Total Rental Items", value: rentalsStats.total, icon: Package, color: "bg-slate-900 dark:bg-slate-700 text-white", shadow: "shadow-slate-500/10" },
              { label: "Deployed at Events", value: rentalsStats.out, icon: Truck, color: "bg-blue-500 text-white", shadow: "shadow-blue-500/10" },
              { label: "Warehouse Received (Pending Vendor)", value: rentalsStats.pending, icon: Clock, color: "bg-amber-500 text-white", shadow: "shadow-amber-500/10" },
              { label: "Returned to Vendors", value: rentalsStats.returned, icon: CheckCircle2, color: "bg-emerald-500 text-white", shadow: "shadow-emerald-500/10" },
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

          {/* Search bar and Filters */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by rented item, vendor, or event/order..."
                value={rentalsSearchQuery}
                onChange={(e) => setRentalsSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
              />
            </div>
            
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl w-fit self-end">
              <AlertCircle className="w-4 h-4 text-blue-500" />
              Logs trace logistics returns over the last year.
            </div>
          </div>

          {/* Interactive Rentals Ledger Table */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
            {loadingRentals ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
                <p className="font-semibold text-sm">Loading rentals history...</p>
              </div>
            ) : filteredRentals.length === 0 ? (
              <div className="py-24 text-center text-slate-450">
                <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-500" />
                <p className="font-semibold text-sm">No outside vendor rentals logged.</p>
                <p className="text-xs text-slate-500 mt-1">Hired equipment from vendors will list here for tracking return timelines.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-700/60">
                      <th className="py-4 px-6 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Rented Item & Vendor</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Qty</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Price / Cost</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Rented Period</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Where Hired (Event/Order)</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Returned from Event</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Returned to Vendor</th>
                      <th className="py-4 px-6 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                    {filteredRentals.map((rental) => (
                      <tr key={`rental-row-${rental.id}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center font-bold border border-slate-100 dark:border-slate-800 shrink-0">
                              {rental.itemName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 dark:text-white text-sm block leading-tight">{rental.itemName}</span>
                              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3.5 h-3.5 shrink-0" />
                                {rental.vendor?.name || "General Vendor"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm font-bold text-slate-700 dark:text-slate-350">
                          {rental.quantity}
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-extrabold text-slate-800 dark:text-white">₹{Number(rental.totalCost).toLocaleString()}</div>
                          <div className="text-xs text-slate-400 mt-0.5">₹{Number(rental.pricePerDay).toLocaleString()} / day</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-semibold text-slate-700 dark:text-slate-350">
                            {rental.rentedDate ? new Date(rental.rentedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                          </div>
                          {(rental as any).endDate && (
                            <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-1">
                              <span className="bg-slate-100 dark:bg-slate-900 text-slate-500 px-1 rounded uppercase tracking-wider text-[8px]">To</span>
                              {new Date((rental as any).endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {rental.inquiry ? (
                            <div className="max-w-[200px]">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block truncate" title={rental.inquiry.eventName}>{rental.inquiry.eventName}</span>
                              <span className="text-xs text-slate-450 block truncate mt-0.5">Client: {rental.inquiry.client?.name || "General"}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium italic">General Rental</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {rental.returnedFromEventDate ? (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-xl w-fit">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              {new Date(rental.returnedFromEventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-lg block w-fit border border-amber-200/20">
                                Expected: {rental.inquiry ? new Date(rental.inquiry.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "N/A"}
                              </span>
                              <button
                                onClick={() => handleMarkReturnedFromEvent(rental)}
                                className="text-[10px] font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-450 px-2 py-1 rounded-lg border border-blue-200/30 hover:border-blue-300 transition-all block text-center"
                              >
                                Mark Returned
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {rental.returnedToVendorDate ? (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-xl w-fit">
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                              {new Date(rental.returnedToVendorDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/60 px-2 py-0.5 rounded-lg block w-fit border border-slate-200/20">
                                {rental.returnedFromEventDate ? "At Warehouse" : "Awaiting Dispatch"}
                              </span>
                              <button
                                onClick={() => handleMarkReturnedToVendor(rental)}
                                disabled={!rental.returnedFromEventDate}
                                className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:hover:bg-emerald-600 px-2 py-1 rounded-lg transition-all block text-center shadow-sm shadow-emerald-500/10 active:scale-95"
                              >
                                Send to Vendor
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleRentalEdit(rental)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                              title="Edit Rental Details"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRentalDelete(rental.id)}
                              className="p-2 text-slate-400 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                              title="Delete Rental Record"
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
        </div>
      )}

      {/* ─── MODAL 1: REGISTER/EDIT VENDOR ─────────────────── */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowVendorModal(false)}></div>
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl z-10 overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                {editingVendorId ? "Edit Vendor Profile" : "Register New Vendor"}
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">Add vendor contact registry, specialty details, and tax information.</p>
            </div>
            
            <form onSubmit={handleVendorSubmit} className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider font-mono">Vendor Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={vendorFormData.name}
                    onChange={(e) => setVendorFormData({...vendorFormData, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white font-medium"
                    placeholder="e.g. Dynamic Stagecraft Ltd."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider font-mono">Team Categories *</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {["VIDEO", "LED", "SOUND"].map((dept) => {
                        const isChecked = vendorFormData.department ? vendorFormData.department.split(",").includes(dept) : false;
                        return (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => {
                              let depts = vendorFormData.department ? vendorFormData.department.split(",") : [];
                              if (depts.includes(dept)) {
                                depts = depts.filter(d => d !== dept);
                              } else {
                                depts.push(dept);
                              }
                              setVendorFormData({ ...vendorFormData, department: depts.join(",") });
                            }}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                              isChecked
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            {dept}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider font-mono">Specialty / Service</label>
                    <input 
                      type="text" 
                      value={vendorFormData.specialization}
                      onChange={(e) => setVendorFormData({...vendorFormData, specialization: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white font-medium"
                      placeholder="e.g. P2.5 LED Panels"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider font-mono">Phone Number</label>
                    <input 
                      type="tel" 
                      value={vendorFormData.phone}
                      onChange={(e) => setVendorFormData({...vendorFormData, phone: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white font-medium"
                      placeholder="9876543210"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider font-mono">GST Tax ID</label>
                    <input 
                      type="text" 
                      value={vendorFormData.gstNumber}
                      onChange={(e) => setVendorFormData({...vendorFormData, gstNumber: e.target.value.toUpperCase()})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm font-mono uppercase outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider font-mono">Email Address</label>
                  <input 
                    type="email" 
                    value={vendorFormData.email}
                    onChange={(e) => setVendorFormData({...vendorFormData, email: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white font-medium"
                    placeholder="vendor@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider font-mono">Office / Business Address</label>
                  <textarea 
                    value={vendorFormData.address}
                    onChange={(e) => setVendorFormData({...vendorFormData, address: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white resize-none font-medium"
                    rows={3}
                    placeholder="Provide details about office, warehouse or workshop address..."
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 text-sm shadow-md"
                >
                  {submitting ? "Saving..." : editingVendorId ? "Update Vendor" : "Register Vendor"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowVendorModal(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold py-4 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-705 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: REGISTER/EDIT VENDOR PRODUCT ─────────── */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowProductModal(false)}></div>
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl z-10 overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-500" />
                {editingProductId ? "Edit Rental Product" : "Add Rental Product for " + selectedVendorForProduct?.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">Define rental name, matching department category, and per-day rate.</p>
            </div>
            
            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider font-mono">Item Name / Model *</label>
                  <input 
                    type="text" 
                    required 
                    value={productFormData.name}
                    onChange={(e) => setProductFormData({...productFormData, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white font-medium"
                    placeholder="e.g. JBL SRX 828SP Active Subwoofer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider font-mono">Category / Dept *</label>
                    <select
                      value={productFormData.category}
                      onChange={(e) => setProductFormData({...productFormData, category: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white font-bold"
                    >
                      <option value="VIDEO">VIDEO</option>
                      <option value="LED">LED</option>
                      <option value="SOUND">SOUND</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider font-mono font-medium">Price / Day (₹) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={productFormData.ratePerDay}
                        onChange={(e) => setProductFormData({...productFormData, ratePerDay: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl pl-9 pr-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white font-bold"
                        placeholder="1500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all disabled:opacity-50 text-sm shadow-md"
                >
                  {submitting ? "Saving..." : editingProductId ? "Update Product" : "Add Product"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-705 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: LOG/EDIT OUTSIDE RENTAL ──────────────── */}
      {showRentalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowRentalModal(false)}></div>
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl z-10 overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-500" />
                {editingRentalId ? "Update Rental Record" : "Log Outside Vendor Rental"}
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">Log equipment hired from outside vendors and trace its return timeline.</p>
            </div>
            
            <form onSubmit={handleRentalSubmit} className="p-6 space-y-4">
              <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider font-mono">Select Vendor *</label>
                    <select
                      required
                      value={rentalFormData.vendorId}
                      onChange={(e) => {
                        const vId = e.target.value;
                        setRentalFormData({ ...rentalFormData, vendorId: vId });
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white font-bold"
                    >
                      <option value="">-- Choose Vendor --</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.department || "General"})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider font-mono">Category / Dept</label>
                    <div className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2 text-sm text-slate-500 dark:text-slate-400 block min-h-[48px] leading-tight font-semibold flex flex-wrap items-center gap-1.5">
                      {(() => {
                        const deptStr = vendors.find(v => String(v.id) === rentalFormData.vendorId)?.department || "General";
                        return deptStr.split(",").map((dept) => (
                          <span key={dept} className="text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 px-2 py-0.5 rounded uppercase">
                            {dept}
                          </span>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider font-mono">Item Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={rentalFormData.itemName}
                      onChange={(e) => setRentalFormData({...rentalFormData, itemName: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white font-medium"
                      placeholder="e.g. Video Switcher v-160HD"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider font-mono">Quantity *</label>
                    <input 
                      type="number" 
                      required 
                      min="1"
                      value={rentalFormData.quantity}
                      onChange={(e) => {
                        const qty = e.target.value;
                        const rate = rentalFormData.pricePerDay;
                        const total = Number(qty || 0) * Number(rate || 0);
                        setRentalFormData({...rentalFormData, quantity: qty, totalCost: String(total)});
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider font-mono">Price / Day (₹) *</label>
                    <input 
                      type="number" 
                      required 
                      min="0"
                      value={rentalFormData.pricePerDay}
                      onChange={(e) => {
                        const rate = e.target.value;
                        const qty = rentalFormData.quantity;
                        const total = Number(qty || 0) * Number(rate || 0);
                        setRentalFormData({...rentalFormData, pricePerDay: rate, totalCost: String(total)});
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white font-bold"
                      placeholder="1000"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider font-mono">Total Rental Cost (₹)</label>
                    <input 
                      type="number" 
                      readOnly
                      value={rentalFormData.totalCost}
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-slate-700 dark:text-slate-300 font-extrabold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider font-mono">Rented From (Start) *</label>
                    <input 
                      type="date" 
                      required 
                      value={rentalFormData.rentedDate}
                      onChange={(e) => setRentalFormData({...rentalFormData, rentedDate: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider font-mono">Rented To (End)</label>
                    <input 
                      type="date" 
                      value={rentalFormData.endDate}
                      onChange={(e) => setRentalFormData({...rentalFormData, endDate: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider font-mono font-medium">Deployed to Event</label>
                  <select
                    value={rentalFormData.inquiryId}
                    onChange={(e) => setRentalFormData({ ...rentalFormData, inquiryId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="">-- General Rental (No Event) --</option>
                    {inquiries.map(inq => (
                      <option key={inq.id} value={inq.id}>{inq.eventName} ({inq.inquiryNumber || `Code: ${inq.id}`})</option>
                    ))}
                  </select>
                </div>

                {editingRentalId && (
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 font-mono">Return from Event</label>
                      <input 
                        type="date" 
                        value={rentalFormData.returnedFromEventDate}
                        onChange={(e) => setRentalFormData({...rentalFormData, returnedFromEventDate: e.target.value})}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none text-slate-900 dark:text-white font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 font-mono">Returned to Vendor</label>
                      <input 
                        type="date" 
                        value={rentalFormData.returnedToVendorDate}
                        onChange={(e) => setRentalFormData({...rentalFormData, returnedToVendorDate: e.target.value})}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none text-slate-900 dark:text-white font-semibold"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1.5 tracking-wider font-mono font-medium">Internal Notes</label>
                  <textarea 
                    value={rentalFormData.notes}
                    onChange={(e) => setRentalFormData({...rentalFormData, notes: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white resize-none font-medium"
                    rows={2}
                    placeholder="Rental terms, driver contact, or logistics details..."
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 text-sm shadow-md active:scale-95"
                >
                  {submitting ? "Saving..." : editingRentalId ? "Update Record" : "Log Rental"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowRentalModal(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold py-4 rounded-2xl hover:bg-slate-205 dark:hover:bg-slate-700 transition-all text-sm active:scale-95"
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
