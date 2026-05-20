"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import PageSkeleton from "@/components/PageSkeleton";
import { FileText, ClipboardList, CheckCircle2, AlertCircle, IndianRupee, History, Settings } from "lucide-react";

export default function InquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [inquiry, setInquiry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quotations' | 'invoices' | 'workflows'>('quotations');
  const [quotationFilter, setQuotationFilter] = useState<string>('ALL'); // ALL, DRAFT, SENT, APPROVED, REJECTED

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

  if (loading) return <PageSkeleton variant="page" />;
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

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => router.push('/dashboard/inquiries')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
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
        </div>
        
        <div className="p-6">
          {activeTab === 'quotations' && (
            <>
              {/* Quotation Statistics & Filter */}
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4 border border-gray-100 dark:border-slate-700">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Stats Cards */}
                  <div className="flex flex-wrap gap-3">
                    {(() => {
                      const all = inquiry.quotations || [];
                      const approved = all.filter((q: any) => q.status === 'APPROVED').length;
                      const draft = all.filter((q: any) => q.status === 'DRAFT').length;
                      const sent = all.filter((q: any) => q.status === 'SENT').length;
                      const rejected = all.filter((q: any) => q.status === 'REJECTED').length;
                      const total = all.length;
                      
                      return (
                        <>
                          <div className="flex items-center gap-2 bg-white dark:bg-slate-700 px-3 py-2 rounded-lg shadow-sm">
                            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                            <span className="text-xs text-gray-500 dark:text-slate-400">Total:</span>
                            <span className="font-bold text-sm dark:text-white">{total}</span>
                          </div>
                          {approved > 0 && (
                            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span className="text-xs text-green-700 dark:text-green-400">Approved:</span>
                              <span className="font-bold text-sm text-green-700 dark:text-green-400">{approved}</span>
                            </div>
                          )}
                          {draft > 0 && (
                            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <span className="text-xs text-blue-700 dark:text-blue-400">Draft:</span>
                              <span className="font-bold text-sm text-blue-700 dark:text-blue-400">{draft}</span>
                            </div>
                          )}
                          {sent > 0 && (
                            <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg">
                              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                              <span className="text-xs text-purple-700 dark:text-purple-400">Sent:</span>
                              <span className="font-bold text-sm text-purple-700 dark:text-purple-400">{sent}</span>
                            </div>
                          )}
                          {rejected > 0 && (
                            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <span className="text-xs text-red-700 dark:text-red-400">Rejected:</span>
                              <span className="font-bold text-sm text-red-700 dark:text-red-400">{rejected}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Ratio Bar */}
                  {(() => {
                    const all = inquiry.quotations || [];
                    if (all.length === 0) return null;
                    const approved = all.filter((q: any) => q.status === 'APPROVED').length;
                    const ratio = all.length > 0 ? Math.round((approved / all.length) * 100) : 0;
                    
                    return (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-slate-400">Approval Rate:</span>
                        <div className="w-32 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${ratio}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-green-600 dark:text-green-400">{ratio}%</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
                  {['ALL', 'DRAFT', 'SENT', 'APPROVED', 'REJECTED'].map((status) => {
                    const count = status === 'ALL' 
                      ? (inquiry.quotations || []).length
                      : (inquiry.quotations || []).filter((q: any) => q.status === status).length;
                    
                    const isActive = quotationFilter === status;
                    return (
                      <button
                        key={status}
                        onClick={() => setQuotationFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600'
                        }`}
                      >
                        {status === 'ALL' ? 'All' : status}
                        <span className={`ml-1 ${isActive ? 'text-blue-200' : 'text-gray-400 dark:text-slate-500'}`}>
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Quotations</h3>
                <button 
                  onClick={() => router.push(`/dashboard/inquiries/${id}/quotation/new`)}
                  className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  + Generate Quotation
                </button>
              </div>
              
              {(() => {
                const filteredQuotations = quotationFilter === 'ALL' 
                  ? inquiry.quotations 
                  : inquiry.quotations?.filter((q: any) => q.status === quotationFilter);
                
                if (filteredQuotations?.length === 0) {
                  return (
                    <div className="text-center py-8 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                      <p className="text-gray-500 dark:text-slate-400 text-sm">No quotations found{quotationFilter !== 'ALL' ? ` with status "${quotationFilter}"` : ''}.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {filteredQuotations?.map((q: any) => (
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
                        {q.status === 'DRAFT' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => router.push(`/dashboard/inquiries/${id}/quotation/${q.id}/edit`)}
                              className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                              title="Edit Quotation"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm('Approve this quotation? This will update the inquiry status.')) {
                                  try {
                                    await api.patch(`/quotations/${q.id}/status`, { status: 'APPROVED' });
                                    window.location.reload();
                                  } catch (err) {
                                    alert('Failed to approve quotation');
                                  }
                                }
                              }}
                              className="bg-green-50 text-green-600 p-2 rounded-lg hover:bg-green-100 transition-colors"
                              title="Approve Quotation"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                const reason = prompt('Reason for declining (optional):');
                                if (confirm('Are you sure you want to decline this quotation?')) {
                                  try {
                                    await api.post(`/quotations/${q.id}/decline`, { reason: reason || '' });
                                    window.location.reload();
                                  } catch (err) {
                                    alert('Failed to decline quotation');
                                  }
                                }
                              }}
                              className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                              title="Decline Quotation"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        )}
                        {q.status === 'SENT' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm('Approve this quotation? This will update the inquiry status.')) {
                                  try {
                                    await api.patch(`/quotations/${q.id}/status`, { status: 'APPROVED' });
                                    window.location.reload();
                                  } catch (err) {
                                    alert('Failed to approve quotation');
                                  }
                                }
                              }}
                              className="bg-green-50 text-green-600 p-2 rounded-lg hover:bg-green-100 transition-colors"
                              title="Approve Quotation"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                const reason = prompt('Reason for declining (optional):');
                                if (confirm('Are you sure you want to decline this quotation?')) {
                                  try {
                                    await api.post(`/quotations/${q.id}/decline`, { reason: reason || '' });
                                    window.location.reload();
                                  } catch (err) {
                                    alert('Failed to decline quotation');
                                  }
                                }
                              }}
                              className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                              title="Decline Quotation"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        )}
                        {q.status === 'APPROVED' && !q.invoice && (
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm('Generate invoice for this quotation?')) {
                                try {
                                  await api.post('/invoices', {
                                    inquiryId: Number(id),
                                    quotationId: q.id,
                                    subtotal: q.totalAmount,
                                    advanceAmount: 0 // Default to 0, can be updated later
                                  });
                                  alert('Invoice generated successfully!');
                                  window.location.reload();
                                } catch (err: any) {
                                  alert(err.response?.data?.message || 'Failed to generate invoice');
                                }
                              }
                            }}
                            className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-100 transition-colors flex items-center gap-1"
                            title="Convert to Invoice"
                          >
                            <FileText className="w-4 h-4" /> Convert to Invoice
                          </button>
                        )}
                        {q.status === 'APPROVED' && q.invoice && (
                          <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">INVOICED</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                );
              })()}
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
                      onClick={() => router.push(`/dashboard/invoices/view?id=${inv.id}`)}
                      className="flex justify-between items-center p-4 border border-gray-100 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{inv.invoiceNumber}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">₹{inv.grossTotal.toLocaleString()}</p>
                        <span className="text-xs font-medium text-orange-600 dark:text-orange-400">{inv.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'workflows' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Inquiry Workflow</h3>
              <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-slate-700"></div>
                
                <div className="space-y-8 relative">
                  {/* Step 1: Inquiry */}
                  <div className="flex items-start gap-6">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center z-10 shadow-sm">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Inquiry Received</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Received on {new Date(inquiry.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Step 2: Quotation */}
                  <div className="flex items-start gap-6">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-sm ${
                      inquiry.quotations?.length > 0 ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-700'
                    }`}>
                      {inquiry.quotations?.length > 0 ? (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      ) : <div className="w-2 h-2 rounded-full bg-white dark:bg-slate-500"></div>}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${inquiry.quotations?.length > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500'}`}>Quotation Generation</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        {inquiry.quotations?.length > 0 ? `${inquiry.quotations.length} revision(s) generated` : 'Pending generation'}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Approval */}
                  <div className="flex items-start gap-6">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-sm ${
                      inquiry.status === 'APPROVED' || inquiry.status === 'CONFIRMED' ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-700'
                    }`}>
                      {inquiry.status === 'APPROVED' || inquiry.status === 'CONFIRMED' ? (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      ) : <div className="w-2 h-2 rounded-full bg-white dark:bg-slate-500"></div>}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${inquiry.status === 'APPROVED' || inquiry.status === 'CONFIRMED' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500'}`}>Client Approval</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        {inquiry.status === 'APPROVED' || inquiry.status === 'CONFIRMED' ? 'Approved by client' : 'Awaiting client response'}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Confirmation */}
                  <div className="flex items-start gap-6">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-sm ${
                      inquiry.status === 'CONFIRMED' ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-700'
                    }`}>
                      {inquiry.status === 'CONFIRMED' ? (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      ) : <div className="w-2 h-2 rounded-full bg-white dark:bg-slate-500"></div>}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${inquiry.status === 'CONFIRMED' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500'}`}>Event Confirmed</h4>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        {inquiry.status === 'CONFIRMED' ? 'Added to schedule' : 'Awaiting confirmation'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
