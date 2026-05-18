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
  Speaker,
  Video
} from "lucide-react";
import { generateInquiryPDF, generateQuotationPDF, generateInvoicePDF } from "@/lib/pdfGenerator";
import DispatchTab from "./DispatchTab";
import VideoDataSheetTab from "./VideoDataSheetTab";
import SoundSetupTab from "./SoundSetupTab";
import OfficeTasksTab from "./OfficeTasksTab";
import VideoSetupTab from "./VideoSetupTab";

function InquiryDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  
  const [inquiry, setInquiry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quotations' | 'invoices' | 'workflows'>('quotations');
  const [qFilter, setQFilter] = useState<'ALL' | 'DRAFT' | 'APPROVED'>('ALL');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [declineReason, setDeclineReason] = useState("");

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
    
    fetchInquiry();
  }, [id]);

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
      case 'INQUIRY': return 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300';
      case 'CONFIRMED': return 'bg-[#e6f4ea] dark:bg-green-900/30 text-[#137333] dark:text-green-400';
      case 'IN_PROGRESS': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
      case 'COMPLETED': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400';
      default: return 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300';
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
            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusBadge(inquiry.status)}`}>
              {inquiry.status.replace('_', ' ')}
            </span>
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
          {inquiry?.department === 'SOUND' && (
            <button 
              onClick={() => setActiveTab('sound-setup')}
              className={`px-6 py-4 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'sound-setup' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700'
              }`}
            >
              <Speaker className="w-4 h-4" /> Sound Setup
            </button>
          )}
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
          {activeTab === 'sound-setup' && inquiry?.department === 'SOUND' && (
            <SoundSetupTab inquiryId={inquiry.id} />
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
