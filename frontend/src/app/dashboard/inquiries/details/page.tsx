"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { 
  ChevronLeft, 
  Plus, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  X,
  Check,
  FilePlus,
  Clock,
  Send,
  AlertCircle,
  History,
  FileText,
  Download,
  HardDrive,
  Video,
  Monitor,
  Truck,
  Calendar,
  DollarSign,
  ClipboardList
} from "lucide-react";
import { generateInquiryPDF, generateQuotationPDF, generateInvoicePDF } from "@/lib/pdfGenerator";
import DispatchTab from "./DispatchTab";
import VideoDataSheetTab from "./VideoDataSheetTab";
import OfficeTasksTab from "./OfficeTasksTab";
import VideoSetupTab from "./VideoSetupTab";

function InquiryDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  
  const [inquiry, setInquiry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quotations' | 'invoices' | 'workflows' | 'dispatch' | 'video-setup' | 'data-sheet' | 'office-tasks' | 'vendor-rentals'>('quotations');
  const [qFilter, setQFilter] = useState<'ALL' | 'DRAFT' | 'APPROVED'>('ALL');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [declineReason, setDeclineReason] = useState("");

  // Outside Vendor Rentals states
  const [vendors, setVendors] = useState<any[]>([]);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [rentalSubmitting, setRentalSubmitting] = useState(false);
  const [editingRentalId, setEditingRentalId] = useState<number | null>(null);
  const [rentalFormData, setRentalFormData] = useState({
    vendorId: "",
    itemName: "",
    quantity: "1",
    pricePerDay: "",
    totalCost: "",
    rentedDate: new Date().toISOString().split("T")[0],
    endDate: "",
    notes: "",
    status: "RENTED",
    returnedFromEventDate: "",
    returnedToVendorDate: ""
  });

  useEffect(() => {
    if (!id) return;
    
    const fetchInquiry = async () => {
      try {
        const { data } = await api.get(`/inquiries/${id}`);
        setInquiry(data);
      } catch (error) {
        console.error("Failed to load inquiry", error);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchVendors = async () => {
      try {
        const { data } = await api.get("/vendors");
        setVendors(data);
      } catch (err) {
        console.error("Failed to load vendors", err);
      }
    };
    
    fetchInquiry();
    fetchVendors();
  }, [id]);

  const handleRentalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rentalFormData.vendorId || !rentalFormData.itemName || !rentalFormData.pricePerDay) {
      alert("Please fill in Select Vendor, Item Name, and Price per Day.");
      return;
    }
    setRentalSubmitting(true);
    try {
      const payload = {
        vendorId: Number(rentalFormData.vendorId),
        itemName: rentalFormData.itemName,
        quantity: Number(rentalFormData.quantity || 1),
        pricePerDay: Number(rentalFormData.pricePerDay),
        totalCost: Number(rentalFormData.totalCost || (Number(rentalFormData.pricePerDay) * Number(rentalFormData.quantity || 1))),
        inquiryId: Number(id),
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

      // Re-fetch inquiry to reload vendorRentals list!
      const { data } = await api.get(`/inquiries/${id}`);
      setInquiry(data);

      setShowRentalModal(false);
      setEditingRentalId(null);
      setRentalFormData({
        vendorId: "",
        itemName: "",
        quantity: "1",
        pricePerDay: "",
        totalCost: "",
        rentedDate: new Date().toISOString().split("T")[0],
        endDate: "",
        notes: "",
        status: "RENTED",
        returnedFromEventDate: "",
        returnedToVendorDate: ""
      });
    } catch (error) {
      console.error("Failed to save vendor rental", error);
      alert("Failed to save rental record.");
    } finally {
      setRentalSubmitting(false);
    }
  };

  const handleCreateInvoice = (q: any) => {
    // Check readiness based on department
    let isReady = true;
    let message = "";

    if (inquiry.department === 'VIDEO') {
      const allDone = inquiry.videoDataSheets?.every((ds: any) => ds.isDayComplete);
      if (!allDone) {
        isReady = false;
        message = "Warning: Not all Video Data Sheets are marked as complete. Proceed anyway?";
      }
    } else if (inquiry.department === 'OFFICE') {
      const allDone = inquiry.officeTasks?.every((task: any) => task.readyForDelivery);
      if (!allDone) {
        isReady = false;
        message = "Warning: Not all Office Tasks are marked as 'Ready for Delivery'. Proceed anyway?";
      }
    } else if (inquiry.department === 'SOUND') {
      if (!inquiry.soundSetup?.soundCheckDone) {
        isReady = false;
        message = "Warning: Sound Check is not marked as complete. Proceed anyway?";
      }
    }

    if (!isReady && !confirm(message)) return;

    router.push(`/dashboard/invoices/new?quotationId=${q.id}&inquiryId=${id}`);
  };

  const handleDecline = async () => {
    if (!selectedQuotation) return;
    try {
      await api.patch(`/quotations/${selectedQuotation.id}/status`, { 
        status: 'REJECTED', 
        reason: declineReason 
      });
      setShowDeclineModal(false);
      setDeclineReason("");
      window.location.reload();
    } catch (err) {
      alert('Failed to decline quotation');
    }
  };

  if (!id) return <div className="p-8">No Inquiry ID provided.</div>;
  if (loading) return <div className="p-8 text-gray-500 dark:text-slate-400">Loading inquiry details...</div>;
  if (!inquiry) return <div className="p-8 text-red-500 dark:text-red-400">Inquiry not found.</div>;

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'INQUIRY': return 'bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
      case 'CONFIRMED': return 'bg-emerald-50 dark:bg-green-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/20';
      case 'IN_PROGRESS': return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/20';
      case 'COMPLETED': return 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200/20';
      case 'CANCELLED': return 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-450 border border-red-200/20';
      default: return 'bg-slate-150 text-slate-700';
    }
  };
  
  const getHistoryEvents = () => {
    if (!inquiry) return [];
    const events: any[] = [
      {
        type: 'INQUIRY',
        title: 'Inquiry Created',
        description: `Inquiry #${inquiry.inquiryNumber || 'Draft'} received for ${inquiry.eventName}`,
        date: new Date(inquiry.createdAt),
        icon: Plus,
        color: 'bg-blue-500'
      }
    ];

    inquiry.quotations?.forEach((q: any) => {
      // Quotation Created
      events.push({
        type: 'QUOTATION_CREATED',
        title: `Quotation Drafted`,
        description: `Revision ${q.revisionNumber} (#${q.quotationNumber}) created`,
        date: new Date(q.createdAt),
        icon: FilePlus,
        color: 'bg-indigo-500'
      });

      // Quotation Sent
      if (q.sentAt) {
        events.push({
          type: 'QUOTATION_SENT',
          title: `Quotation Sent`,
          description: `Quotation #${q.quotationNumber} sent to client`,
          date: new Date(q.sentAt),
          icon: Send,
          color: 'bg-cyan-500'
        });
      }

      // Quotation Approved
      if (q.approvedAt) {
        events.push({
          type: 'QUOTATION_APPROVED',
          title: `Quotation Approved`,
          description: `Quotation #${q.quotationNumber} officially approved`,
          date: new Date(q.approvedAt),
          icon: CheckCircle2,
          color: 'bg-green-500'
        });
      }

      // Quotation Rejected
      if (q.status === 'REJECTED') {
        const reason = q.notes?.includes('[REJECTED]') 
          ? q.notes.split('[REJECTED]:')[1]?.trim() 
          : q.notes?.includes('[DECLINED]') 
            ? q.notes.split('[DECLINED]:')[1]?.trim() 
            : 'Client declined the quotation';
            
        events.push({
          type: 'QUOTATION_REJECTED',
          title: `Quotation Declined`,
          description: `Reason: ${reason}`,
          date: new Date(q.updatedAt),
          icon: X,
          color: 'bg-red-500'
        });
      }
    });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const historyEvents = getHistoryEvents();

  return (
    <div className="w-full space-y-6">
      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/10 transform animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                <X className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Decline Quotation</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Please provide a reason for the record.</p>
              </div>
            </div>

            <textarea 
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g., Client chose another vendor, Budget issues, etc."
              className="w-full h-32 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none mb-6"
            />

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason("");
                }}
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDecline}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all active:scale-95"
              >
                Decline Now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => router.push('/dashboard/inquiries')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-slate-300" strokeWidth={1.75} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{inquiry.inquiryNumber || `INQ-${inquiry.id}`}</h2>
            <select
              value={inquiry.status}
              onChange={async (e) => {
                const newStatus = e.target.value;
                try {
                  await api.put(`/inquiries/${id}/status`, { status: newStatus });
                  setInquiry({ ...inquiry, status: newStatus });
                } catch (error) {
                  alert('Failed to update status');
                }
              }}
              className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wide cursor-pointer transition-all outline-none bg-transparent ${getStatusBadge(inquiry.status)}`}
            >
              <option value="INQUIRY" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">INQUIRY</option>
              <option value="CONFIRMED" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">CONFIRMED</option>
              <option value="IN_PROGRESS" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">IN PROGRESS</option>
              <option value="COMPLETED" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">COMPLETED</option>
              <option value="CANCELLED" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">CANCELLED</option>
            </select>
          </div>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{inquiry.eventName}</p>
        </div>
        <div className="ml-auto">
          <button 
            onClick={() => generateInquiryPDF(inquiry)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Client Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-4">Client Details</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400">Name</p>
              <p className="font-medium text-gray-900 dark:text-white">{inquiry.client.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400">Company</p>
              <p className="font-medium text-gray-900 dark:text-white">{inquiry.client.company || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400">Contact</p>
              <p className="font-medium text-gray-900 dark:text-white">{inquiry.client.phone}</p>
              <p className="text-sm text-gray-600 dark:text-slate-300">{inquiry.client.email}</p>
            </div>
          </div>
        </div>

        {/* Event Card */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Event Details</h3>
            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
              {inquiry.department} DEPT
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400">Dates</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {new Date(inquiry.startDate).toLocaleDateString()} - {new Date(inquiry.endDate).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{inquiry.totalDays} Days</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-400">Venue</p>
              <p className="font-medium text-gray-900 dark:text-white">{inquiry.venue}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 dark:text-slate-400">Special Notes</p>
              <p className="text-sm text-gray-700 dark:text-slate-300 mt-1 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg border border-gray-100 dark:border-slate-600">
                {inquiry.specialNotes || 'No special notes provided.'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quotations / Invoices Tabs area */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="flex border-b border-gray-100 dark:border-slate-700">
          <button 
            onClick={() => setActiveTab('quotations')}
            className={`px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'quotations' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700'
            }`}
          >
            Quotations
          </button>
          <button 
            onClick={() => setActiveTab('invoices')}
            className={`px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'invoices' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700'
            }`}
          >
            Invoices
          </button>
          <button 
            onClick={() => setActiveTab('workflows')}
            className={`px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'workflows' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700'
            }`}
          >
            Workflows
          </button>
          <button 
            onClick={() => setActiveTab('dispatch')}
            className={`px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'dispatch' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700'
            }`}
          >
            Dispatch & Logistics
          </button>
          {inquiry?.department === 'VIDEO' && (
            <>
              <button 
                onClick={() => setActiveTab('video-setup')}
                className={`px-6 py-4 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'video-setup' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700'
                }`}
              >
                <Video className="w-4 h-4" /> Video Setup
              </button>
              <button 
                onClick={() => setActiveTab('data-sheet')}
                className={`px-6 py-4 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'data-sheet' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700'
                }`}
              >
                <HardDrive className="w-4 h-4" /> Data Sheet
              </button>
            </>
          )}
          {inquiry?.department === 'OFFICE' && (
            <button 
              onClick={() => setActiveTab('office-tasks')}
              className={`px-6 py-4 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'office-tasks' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700'
              }`}
            >
              <Monitor className="w-4 h-4" /> Office Tasks
            </button>
          )}
          <button 
            onClick={() => setActiveTab('vendor-rentals')}
            className={`px-6 py-4 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'vendor-rentals' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700'
            }`}
          >
            <Truck className="w-4 h-4" /> Vendor Rentals
          </button>
        </div>
        
        <div className="p-6">
          {activeTab === 'quotations' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-50 dark:border-slate-700/50">
                <div className="flex items-center gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Quotations</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      {inquiry.quotations?.filter((q: any) => q.status === 'APPROVED').length || 0} Approved / {inquiry.quotations?.length || 0} Total
                    </p>
                  </div>
                  <div className="flex bg-gray-50 dark:bg-slate-700/50 p-1 rounded-xl border border-gray-100 dark:border-slate-600">
                    <button 
                      onClick={() => setQFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${qFilter === 'ALL' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setQFilter('APPROVED')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${qFilter === 'APPROVED' ? 'bg-white dark:bg-slate-600 text-green-600 dark:text-green-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                      Approved
                    </button>
                    <button 
                      onClick={() => setQFilter('DRAFT')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${qFilter === 'DRAFT' ? 'bg-white dark:bg-slate-600 text-blue-500 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                      Draft
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => router.push(`/dashboard/inquiries/details/quotation/new?id=${id}`)}
                  className="bg-blue-600 dark:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-sm flex items-center gap-2"
                >
                  <FilePlus className="w-4 h-4" strokeWidth={1.75} />
                  Generate Quotation
                </button>
              </div>
              
              {inquiry.quotations?.length === 0 ? (
                <div className="text-center py-12 bg-gray-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                  <p className="text-gray-500 dark:text-slate-400 text-sm">No quotations generated yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inquiry.quotations?.filter((q: any) => qFilter === 'ALL' || q.status === qFilter).map((q: any) => (
                    <div key={q.id} className="flex justify-between items-center p-4 border border-gray-100 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{q.quotationNumber}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Revision {q.revisionNumber} • {new Date(q.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-white">₹{q.totalAmount.toLocaleString()}</p>
                          <span className={`text-xs font-medium ${
                            q.status === 'APPROVED' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                          }`}>{q.status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {q.status !== 'REVISED' && (
                            <button 
                              onClick={() => router.push(`/dashboard/inquiries/details/quotation/edit?id=${id}&quotationId=${q.id}`)}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="Edit Quotation"
                            >
                              <Pencil className="w-5 h-5" strokeWidth={1.75} />
                            </button>
                          )}
                          <button 
                            onClick={() => generateQuotationPDF(q, inquiry)}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            title="Download Quotation PDF"
                          >
                            <Download className="w-5 h-5" strokeWidth={1.75} />
                          </button>
                          {q.status !== 'REJECTED' && q.status !== 'REVISED' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedQuotation(q);
                                setShowDeclineModal(true);
                              }}
                              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Decline Quotation"
                            >
                              <X className="w-5 h-5" strokeWidth={1.75} />
                            </button>
                          )}
                          {q.status !== 'APPROVED' && q.status !== 'REVISED' && (
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm('Approve this quotation? This will proceed to generate the invoice.')) {
                                  try {
                                    await api.patch(`/quotations/${q.id}/status`, { status: 'APPROVED' });
                                    router.push(`/dashboard/invoices/new?quotationId=${q.id}&inquiryId=${id}`);
                                  } catch (err) {
                                    alert('Failed to approve quotation');
                                  }
                                }
                              }}
                              className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-2 rounded-lg hover:bg-green-100 transition-colors"
                              title="Approve Quotation"
                            >
                              <CheckCircle2 className="w-5 h-5" strokeWidth={1.75} />
                            </button>
                          )}
                          {q.status === 'APPROVED' && !q.invoice && (
                            <button 
                              onClick={() => handleCreateInvoice(q)}
                              className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-100 transition-colors flex items-center gap-1 shadow-sm"
                              title="Convert to Invoice"
                            >
                              <FileText className="w-4 h-4" strokeWidth={2} /> 
                              Convert to Invoice
                            </button>
                          )}
                          {q.status === 'APPROVED' && q.invoice && (
                            <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded uppercase tracking-wider">
                              Invoiced
                            </span>
                          )}
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}


          {activeTab === 'invoices' && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Invoices</h3>
              </div>
              {inquiry.invoices?.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                  <p className="text-gray-500 dark:text-slate-400 text-sm">No invoices generated yet. Quotation must be approved first.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inquiry.invoices?.map((inv: any) => (
                    <div 
                      key={inv.id} 
                      className="flex justify-between items-center p-4 border border-gray-100 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer"
                      onClick={() => router.push(`/dashboard/invoices/view?id=${inv.id}`)}
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{inv.invoiceNumber}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-gray-900 dark:text-white">₹{inv.grossTotal.toLocaleString()}</p>
                          <span className="text-xs font-medium text-orange-600 dark:text-orange-400">{inv.status}</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            // We need to fetch the full invoice details or ensure inv has enough data
                            // For simplicity, let's just use the current data or pass it if possible
                            // The generateInvoicePDF needs specific structure
                            generateInvoicePDF({
                              ...inv,
                              inquiry: {
                                inquiryNumber: inquiry.inquiryNumber,
                                eventName: inquiry.eventName,
                                startDate: inquiry.startDate,
                                endDate: inquiry.endDate,
                                venue: inquiry.venue,
                                client: inquiry.client
                              },
                              quotation: inv.quotation || inquiry.quotations.find((q: any) => q.id === inv.quotationId) || {}
                            });
                          }}
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                          title="Download Invoice PDF"
                        >
                          <Download className="w-5 h-5" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {activeTab === 'workflows' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Standard Workflow Steps */}
              <div className="space-y-6">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  Workflow Progress
                </h3>
                <div className="relative pl-4 border-l-2 border-gray-100 dark:border-slate-700 space-y-8 ml-4">
                  {/* Step 1: Inquiry */}
                  <div className="relative">
                    <div className="absolute -left-[25px] top-0 w-4 h-4 rounded-full bg-green-500 shadow-sm"></div>
                    <div className="pl-4">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Inquiry Received</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Confirmed on {new Date(inquiry.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Step 2: Quotation */}
                  <div className="relative">
                    <div className={`absolute -left-[25px] top-0 w-4 h-4 rounded-full shadow-sm ${inquiry.quotations?.length > 0 ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
                    <div className="pl-4">
                      <h4 className={`text-sm font-bold ${inquiry.quotations?.length > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500'}`}>Quotation Phase</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        {inquiry.quotations?.length > 0 ? `${inquiry.quotations.length} revision(s) created` : 'Pending generation'}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Approval */}
                  <div className="relative">
                    {(() => {
                      const isApproved = inquiry.status === 'CONFIRMED' || inquiry.quotations?.some((q: any) => q.status === 'APPROVED');
                      const isRejected = inquiry.quotations?.some((q: any) => q.status === 'REJECTED');
                      return (
                        <>
                          <div className={`absolute -left-[25px] top-0 w-4 h-4 rounded-full shadow-sm ${isApproved ? 'bg-green-500' : isRejected ? 'bg-red-500' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
                          <div className="pl-4">
                            <h4 className={`text-sm font-bold ${isApproved ? 'text-green-600' : isRejected ? 'text-red-600' : 'text-gray-400 dark:text-slate-500'}`}>
                              {isApproved ? 'Client Approved' : isRejected ? 'Declined / Revision Required' : 'Awaiting Approval'}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                              {isApproved ? 'Client confirmed the quotation' : isRejected ? 'Rejected by client' : 'Quotation sent to client'}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Step 4: Confirmation */}
                  <div className="relative">
                    <div className={`absolute -left-[25px] top-0 w-4 h-4 rounded-full shadow-sm ${inquiry.status === 'CONFIRMED' ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
                    <div className="pl-4">
                      <h4 className={`text-sm font-bold ${inquiry.status === 'CONFIRMED' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500'}`}>Event Confirmed</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        {inquiry.status === 'CONFIRMED' ? 'Added to production schedule' : 'Awaiting final confirmation'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Detailed Activity History */}
              <div className="space-y-6">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-500" />
                  Activity History
                </h3>
                <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 h-[400px] overflow-y-auto custom-scrollbar">
                  <div className="space-y-6">
                    {historyEvents.map((event, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className={`mt-1 w-8 h-8 rounded-full ${event.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <event.icon className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h5 className="text-sm font-bold text-gray-900 dark:text-white">{event.title}</h5>
                            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {event.date.toLocaleDateString()} {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'dispatch' && (
            <DispatchTab inquiryId={inquiry.id} department={inquiry.department} />
          )}
          {activeTab === 'video-setup' && inquiry?.department === 'VIDEO' && (
            <VideoSetupTab inquiryId={inquiry.id} />
          )}
          {activeTab === 'data-sheet' && inquiry?.department === 'VIDEO' && (
            <VideoDataSheetTab inquiryId={inquiry.id} />
          )}
          {activeTab === 'office-tasks' && inquiry?.department === 'OFFICE' && (
            <OfficeTasksTab inquiryId={inquiry.id} />
          )}

          {activeTab === 'vendor-rentals' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Outside Hired Logistics & Rentals
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Manage vendor items booked for this specific event to fulfill stock shortage.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingRentalId(null);
                    setRentalFormData({
                      vendorId: "",
                      itemName: "",
                      quantity: "1",
                      pricePerDay: "",
                      totalCost: "",
                      rentedDate: new Date().toISOString().split("T")[0],
                      endDate: "",
                      notes: "",
                      status: "RENTED",
                      returnedFromEventDate: "",
                      returnedToVendorDate: ""
                    });
                    setShowRentalModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all hover:shadow active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Log Outside Vendor Rental
                </button>
              </div>

              {/* Vendor Rentals Order Log Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                      <th className="py-3.5 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Rented Item & Vendor</th>
                      <th className="py-3.5 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Qty</th>
                      <th className="py-3.5 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Price / Cost</th>
                      <th className="py-3.5 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Rented Period</th>
                      <th className="py-3.5 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Returned from Event</th>
                      <th className="py-3.5 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Returned to Vendor</th>
                      <th className="py-3.5 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {!inquiry.vendorRentals || inquiry.vendorRentals.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-sm text-slate-400">
                          No outside rentals logged for this inquiry/event. Click "+ Log Outside Vendor Rental" to add.
                        </td>
                      </tr>
                    ) : (
                      inquiry.vendorRentals.map((rental: any) => (
                        <tr key={rental.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                          {/* Item & Vendor */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 dark:text-white text-sm">{rental.itemName}</span>
                              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5 flex items-center gap-1">
                                🏢 {rental.vendor?.name || 'Unknown Vendor'}
                              </span>
                            </div>
                          </td>

                          {/* Qty */}
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold w-7 h-7 rounded-full">
                              {rental.quantity}
                            </span>
                          </td>

                          {/* Cost */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                                ₹{Number(rental.totalCost).toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5">
                                ₹{Number(rental.pricePerDay).toLocaleString('en-IN')} / day
                              </span>
                            </div>
                          </td>

                          {/* Period */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col text-xs text-slate-600 dark:text-slate-350">
                              <span className="font-semibold flex items-center gap-1">
                                📅 {new Date(rental.rentedDate).toLocaleDateString()}
                              </span>
                              {rental.endDate && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                                  to {new Date(rental.endDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Returned from Event */}
                          <td className="py-4 px-4 text-center">
                            {rental.returnedFromEventDate ? (
                              <span className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full text-[10px] font-bold border border-green-200/30">
                                <Check className="w-3 h-3" /> {new Date(rental.returnedFromEventDate).toLocaleDateString()}
                              </span>
                            ) : (
                              <button
                                onClick={async () => {
                                  if (!confirm("Mark this item as returned from the event/venue?")) return;
                                  try {
                                    await api.patch(`/vendors/rentals/${rental.id}`, {
                                      status: "RETURNED_FROM_EVENT",
                                      returnedFromEventDate: new Date().toISOString().split("T")[0]
                                    });
                                    // reload
                                    const { data } = await api.get(`/inquiries/${id}`);
                                    setInquiry(data);
                                  } catch (err) {
                                    alert("Failed to update rental status");
                                  }
                                }}
                                className="bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 dark:bg-slate-800 dark:border-slate-700 text-slate-500 hover:text-orange-600 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all"
                              >
                                Mark Returned
                              </button>
                            )}
                          </td>

                          {/* Returned to Vendor */}
                          <td className="py-4 px-4 text-center">
                            {rental.returnedToVendorDate ? (
                              <span className="inline-flex items-center gap-1 bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 px-2.5 py-1 rounded-full text-[10px] font-bold border border-teal-200/30">
                                <Check className="w-3 h-3" /> {new Date(rental.returnedToVendorDate).toLocaleDateString()}
                              </span>
                            ) : (
                              <button
                                disabled={!rental.returnedFromEventDate}
                                onClick={async () => {
                                  if (!confirm("Confirm that this item has been sent back to the vendor?")) return;
                                  try {
                                    await api.patch(`/vendors/rentals/${rental.id}`, {
                                      status: "RETURNED_TO_VENDOR",
                                      returnedToVendorDate: new Date().toISOString().split("T")[0]
                                    });
                                    // reload
                                    const { data } = await api.get(`/inquiries/${id}`);
                                    setInquiry(data);
                                  } catch (err) {
                                    alert("Failed to update rental status");
                                  }
                                }}
                                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                                  rental.returnedFromEventDate
                                    ? "bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-emerald-200 dark:bg-slate-800 dark:border-slate-700 text-slate-500 hover:text-emerald-600"
                                    : "bg-slate-100/50 border-slate-100 text-slate-300 dark:bg-slate-800/30 dark:border-slate-800 dark:text-slate-600 cursor-not-allowed"
                                }`}
                              >
                                Return Vendor
                              </button>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingRentalId(rental.id);
                                  setRentalFormData({
                                    vendorId: String(rental.vendorId),
                                    itemName: rental.itemName,
                                    quantity: String(rental.quantity),
                                    pricePerDay: String(rental.pricePerDay),
                                    totalCost: String(rental.totalCost),
                                    rentedDate: rental.rentedDate ? new Date(rental.rentedDate).toISOString().split("T")[0] : "",
                                    endDate: rental.endDate ? new Date(rental.endDate).toISOString().split("T")[0] : "",
                                    notes: rental.notes || "",
                                    status: rental.status,
                                    returnedFromEventDate: rental.returnedFromEventDate ? new Date(rental.returnedFromEventDate).toISOString().split("T")[0] : "",
                                    returnedToVendorDate: rental.returnedToVendorDate ? new Date(rental.returnedToVendorDate).toISOString().split("T")[0] : ""
                                  });
                                  setShowRentalModal(true);
                                }}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                                title="Edit Rental"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm("Are you sure you want to permanently delete this vendor rental record?")) return;
                                  try {
                                    await api.delete(`/vendors/rentals/${rental.id}`);
                                    // reload
                                    const { data } = await api.get(`/inquiries/${id}`);
                                    setInquiry(data);
                                  } catch (err) {
                                    alert("Failed to delete rental record.");
                                  }
                                }}
                                className="p-1.5 hover:bg-slate-105 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                                title="Delete Rental"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Log Outside Vendor Rental Modal Form */}
              {showRentalModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-in fade-in duration-200">
                  <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-white/5 transform animate-in scale-in duration-200 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">
                            {editingRentalId ? 'Edit Outside Vendor Rental' : 'Log Outside Vendor Rental'}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Log equipment hired from outside vendors and trace its return timeline.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowRentalModal(false)}
                        className="p-1 hover:bg-slate-100 rounded-full text-slate-450 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleRentalSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Select Vendor */}
                        <div>
                          <label className="block text-xs font-bold text-slate-450 uppercase mb-1.5 tracking-wider">Select Vendor *</label>
                          <select
                            required
                            value={rentalFormData.vendorId}
                            onChange={(e) => setRentalFormData({ ...rentalFormData, vendorId: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                          >
                            <option value="">-- Choose Vendor --</option>
                            {vendors.map((vendor) => (
                              <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Category / Dept */}
                        <div>
                          <label className="block text-xs font-bold text-slate-450 uppercase mb-1.5 tracking-wider">Category / Dept</label>
                          <input
                            type="text"
                            disabled
                            value={inquiry.department || 'GENERAL'}
                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed uppercase"
                          />
                        </div>

                        {/* Item Name */}
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-xs font-bold text-slate-450 uppercase mb-1.5 tracking-wider">Item Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Video Switcher v-160HD"
                            value={rentalFormData.itemName}
                            onChange={(e) => setRentalFormData({ ...rentalFormData, itemName: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="block text-xs font-bold text-slate-450 uppercase mb-1.5 tracking-wider">Quantity *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={rentalFormData.quantity}
                            onChange={(e) => {
                              const qty = e.target.value;
                              const price = rentalFormData.pricePerDay;
                              const total = qty && price ? String(Number(qty) * Number(price)) : "";
                              setRentalFormData({ ...rentalFormData, quantity: qty, totalCost: total });
                            }}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>

                        {/* Price per Day */}
                        <div>
                          <label className="block text-xs font-bold text-slate-450 uppercase mb-1.5 tracking-wider">Price / Day (₹) *</label>
                          <input
                            type="number"
                            required
                            placeholder="1000"
                            value={rentalFormData.pricePerDay}
                            onChange={(e) => {
                              const price = e.target.value;
                              const qty = rentalFormData.quantity;
                              const total = qty && price ? String(Number(qty) * Number(price)) : "";
                              setRentalFormData({ ...rentalFormData, pricePerDay: price, totalCost: total });
                            }}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>

                        {/* Total Cost */}
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-xs font-bold text-slate-450 uppercase mb-1.5 tracking-wider">Total Rental Cost (₹)</label>
                          <input
                            type="text"
                            disabled
                            value={rentalFormData.totalCost ? `₹${Number(rentalFormData.totalCost).toLocaleString('en-IN')}` : "₹0"}
                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-extrabold text-slate-650 dark:text-slate-400 cursor-not-allowed"
                          />
                        </div>

                        {/* Rented Date */}
                        <div>
                          <label className="block text-xs font-bold text-slate-450 uppercase mb-1.5 tracking-wider">Rented From (Start) *</label>
                          <input
                            type="date"
                            required
                            value={rentalFormData.rentedDate}
                            onChange={(e) => setRentalFormData({ ...rentalFormData, rentedDate: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>

                        {/* End Date */}
                        <div>
                          <label className="block text-xs font-bold text-slate-450 uppercase mb-1.5 tracking-wider">Rented To (End)</label>
                          <input
                            type="date"
                            value={rentalFormData.endDate}
                            onChange={(e) => setRentalFormData({ ...rentalFormData, endDate: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>

                        {/* Deployed to Event */}
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-xs font-bold text-slate-450 uppercase mb-1.5 tracking-wider">Deployed to Event</label>
                          <input
                            type="text"
                            disabled
                            value={`${inquiry.inquiryNumber || `INQ-${inquiry.id}`} - ${inquiry.eventName}`}
                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed"
                          />
                        </div>

                        {/* Notes */}
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-xs font-bold text-slate-450 uppercase mb-1.5 tracking-wider">Internal Notes</label>
                          <textarea
                            placeholder="Rental terms, driver contact, or logistics details..."
                            value={rentalFormData.notes}
                            onChange={(e) => setRentalFormData({ ...rentalFormData, notes: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 h-20 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                        <button
                          type="button"
                          onClick={() => setShowRentalModal(false)}
                          className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 dark:text-slate-350 dark:hover:bg-slate-700 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={rentalSubmitting}
                          className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/10 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {rentalSubmitting ? 'Logging...' : editingRentalId ? 'Update Rental' : 'Log Rental'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'office-tasks' && inquiry?.department === 'OFFICE' && (
            <OfficeTasksTab inquiryId={inquiry.id} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function InquiryDetailPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <InquiryDetailsContent />
    </Suspense>
  );
}
