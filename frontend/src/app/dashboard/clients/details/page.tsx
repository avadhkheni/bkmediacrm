"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import PageSkeleton from "@/components/PageSkeleton";
import { generateClientProfilePDF } from "@/lib/pdfGenerator";
import { 
  ArrowLeft, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Download,
  Calendar,
  Clock,
  ExternalLink,
  Search
} from "lucide-react";
import Link from "next/link";

function ClientDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchClient = async () => {
        try {
          const { data } = await api.get(`/clients/${id}`);
          setClient(data);
        } catch (error) {
          console.error("Failed to fetch client details", error);
        } finally {
          setLoading(false);
        }
      };
      fetchClient();
    }
  }, [id]);

  if (loading) return <PageSkeleton variant="page" />;
  if (!client) return <div className="p-8 text-red-500">Client not found</div>;

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{client.name}</h2>
            <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> {client.company || "No Company Specified"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => generateClientProfilePDF(client)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" /> Download Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Info */}
        <div className="w-full space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Contact Information</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Contact Person</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{client.contactPerson || client.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Phone</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{client.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Email</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{client.email || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                  <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Address</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                    {client.address || "No address provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-4 border-t border-slate-50 dark:border-slate-700">
                <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">GST Number</p>
                  <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">{client.gstNumber || "Unregistered"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-blue-600 rounded-3xl p-6 text-white shadow-xl">
             <h3 className="text-xs font-bold text-blue-300 dark:text-blue-100 uppercase tracking-widest mb-4">Account Summary</h3>
             <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-blue-300 dark:text-blue-100 uppercase font-bold tracking-wider">Total Inquiries</p>
                  <p className="text-3xl font-black">{client.inquiries?.length || 0}</p>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-[10px] text-blue-300 dark:text-blue-100 uppercase font-bold tracking-wider">Client Since</p>
                  <p className="text-sm font-bold">{new Date(client.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Inquiries & History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Inquiries</h3>
              <Link href={`/dashboard/inquiries/new?clientId=${client.id}`} className="text-sm font-bold text-blue-600 hover:text-blue-700">
                + New Inquiry
              </Link>
            </div>

            <div className="space-y-4">
              {client.inquiries && client.inquiries.length > 0 ? (
                client.inquiries.map((inq: any) => (
                  <div key={inq.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 dark:border-slate-700/50 hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600">
                        <Calendar className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{inq.eventName}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium mt-1">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(inq.startDate).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="uppercase">{inq.status}</span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/dashboard/inquiries/details?id=${inq.id}`} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No inquiry history found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientDetailsPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="page" />}>
      <ClientDetailsContent />
    </Suspense>
  );
}
