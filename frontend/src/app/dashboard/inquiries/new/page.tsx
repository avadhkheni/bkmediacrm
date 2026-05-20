"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import { ChevronLeft, Plus, Calendar, User, Phone, MapPin } from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";
import { useSearchParams } from "next/navigation";

interface Client {
  id: number;
  name: string;
  company?: string;
}

interface InquiryFormData {
  clientId: string;
  department: "VIDEO" | "LED";
  eventName: string;
  eventType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  venue: string;
  specialNotes?: string;
  
  // New client fields (if creating new)
  isNewClient: boolean;
  newClientName?: string;
  newClientCompany?: string;
  newClientPhone?: string;
  newClientEmail?: string;
}

export default function NewInquiryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledClientId = searchParams.get("clientId");

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<InquiryFormData>({
    defaultValues: {
      department: "VIDEO",
      isNewClient: false,
      totalDays: 1,
    }
  });

  const isNewClient = watch("isNewClient");
  const startDate = watch("startDate");
  const endDate = watch("endDate");

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data } = await api.get("/clients?limit=100");
        setClients(data.data);
      } catch (error) {
        console.error("Failed to load clients", error);
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, []);

  useEffect(() => {
    if (prefilledClientId && !loadingClients) {
      setValue("clientId", prefilledClientId);
    }
  }, [prefilledClientId, loadingClients, setValue]);

  // Auto-calculate total days when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
        setValue("totalDays", diffDays);
      }
    }
  }, [startDate, endDate, setValue]);

  const onSubmit = async (data: InquiryFormData) => {
    try {
      let finalClientId = data.clientId;

      // If new client, create client first
      if (data.isNewClient) {
        const clientRes = await api.post("/clients", {
          name: data.newClientName,
          company: data.newClientCompany,
          phone: data.newClientPhone,
          email: data.newClientEmail,
        });
        finalClientId = clientRes.data.id.toString();
      }

      // Create inquiry
      const payload = {
        clientId: finalClientId,
        department: data.department,
        eventName: data.eventName,
        eventType: data.eventType,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: data.totalDays,
        venue: data.venue,
        specialNotes: data.specialNotes,
      };

      const { data: inquiry } = await api.post("/inquiries", payload);
      router.push(`/dashboard/inquiries/${inquiry.id}`);
    } catch (error: any) {
      console.error("Failed to create inquiry", error);
      if (error.response?.status === 409) {
        alert("A client with this phone number already exists. Please uncheck 'Create new client' and select them from the list.");
      } else {
        alert(error.response?.data?.message || "Failed to create inquiry. Please check the fields and try again.");
      }
    }
  };


  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Create New Inquiry</h2>
        <button 
          onClick={() => router.back()}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium flex items-center gap-1 group"
        >
          <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" strokeWidth={1.75} />
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Client Selection */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Client Details</h3>
          
          <div className="mb-4">
            <label className="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                {...register("isNewClient")}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Create new client instead of selecting existing</span>
            </label>
          </div>

          {!isNewClient ? (
            <div>
              <SearchableSelect 
                label="Select Existing Client"
                options={clients.map(c => ({
                  id: c.id,
                  name: c.name,
                  subtext: c.company
                }))}
                value={watch("clientId")}
                onChange={(val) => setValue("clientId", val.toString())}
                placeholder="Search and select a client..."
                disabled={loadingClients}
                error={errors.clientId?.message}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Rahul Sharma"
                    {...register("newClientName", { 
                      required: isNewClient ? "Name is required" : false 
                    })}
                    className={`w-full pl-10 pr-4 py-2 rounded-md border ${errors.newClientName ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} bg-white dark:bg-slate-700 text-slate-900 dark:text-white`}
                  />
                </div>
                {errors.newClientName && <p className="text-xs text-red-500 mt-1">{errors.newClientName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone (Only Numbers) *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="9876543210"
                    {...register("newClientPhone", { 
                      required: isNewClient ? "Phone is required" : false,
                      pattern: {
                        value: /^[0-9]+$/,
                        message: "Please enter only numbers"
                      },
                      minLength: {
                        value: 10,
                        message: "At least 10 digits required"
                      }
                    })}
                    onInput={(e) => {
                      // Force only numbers on input
                      e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                    }}
                    className={`w-full pl-10 pr-4 py-2 rounded-md border ${errors.newClientPhone ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} bg-white dark:bg-slate-700 text-slate-900 dark:text-white`}
                  />
                </div>
                {errors.newClientPhone && <p className="text-xs text-red-500 mt-1">{errors.newClientPhone.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company / Agency</label>
                  <input 
                    type="text" 
                    placeholder="e.g. BK Media Pvt Ltd"
                    {...register("newClientCompany")}
                    className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input 
                    type="email" 
                    placeholder="client@example.com"
                    {...register("newClientEmail")}
                    className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
              </div>
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Event Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Event Name *</label>
              <input 
                type="text" 
                {...register("eventName", { required: true })}
                className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                placeholder="e.g., Annual Tech Summit 2026"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department *</label>
              <select 
                {...register("department", { required: true })}
                className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="VIDEO">Video & Photography</option>
                <option value="LED">LED Screens</option>
                <option value="SOUND">Sound Systems</option>
                <option value="OFFICE">Office & Editing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Event Type</label>
              <input 
                type="text" 
                {...register("eventType")}
                className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                placeholder="Corporate, Wedding, Concert..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="date" 
                  {...register("startDate", { 
                    required: "Start date is required",
                    validate: (value) => {
                      const d = new Date(value);
                      if (isNaN(d.getTime())) return "Invalid date";
                      return true;
                    }
                  })}
                  className={`w-full pl-10 pr-4 py-2 rounded-md border ${errors.startDate ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all`}
                />
              </div>
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                  type="date" 
                  {...register("endDate", { 
                    required: "End date is required",
                    validate: (value) => {
                      if (!startDate) return true;
                      const start = new Date(startDate);
                      const end = new Date(value);
                      if (isNaN(end.getTime())) return "Invalid date";
                      if (end < start) return "End date cannot be before start date";
                      return true;
                    }
                  })}
                  className={`w-full pl-10 pr-4 py-2 rounded-md border ${errors.endDate ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all`}
                />
              </div>
              {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Venue / Location *</label>
              <input 
                type="text" 
                placeholder="e.g. JW Marriott, Mumbai"
                {...register("venue", { required: true })}
                className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Special Notes</label>
                <textarea 
                  {...register("specialNotes")}
                  rows={3}
                  placeholder="e.g. Need 4K recording, Stage dimensions are 20x40, etc."
                  className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-8 rounded-md transition-colors disabled:opacity-70"
          >
            {isSubmitting ? "Creating..." : "Create Inquiry"}
          </button>
        </div>
      </form>
    </div>
  );
}
