"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  Users, 
  Monitor, 
  Layers, 
  Camera, 
  Settings,
  Calendar,
  ChevronRight
} from "lucide-react";

export default function AvailabilityPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [staffFilter, setStaffFilter] = useState("All");
  const [videoFilter, setVideoFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        // Fetch each section separately for the new API
        const [staffRes, ledRes, videoRes] = await Promise.all([
          api.get(`/availability/staff?startDate=${startDate || today}&endDate=${endDate || today}`),
          api.get(`/availability/led?startDate=${startDate || today}&endDate=${endDate || today}`),
          api.get(`/availability/video-equipment?startDate=${startDate || today}&endDate=${endDate || today}`),
        ]);
        setData({
          summary: {
            staffAvailable: staffRes.data.filter((s: any) => s.status === 'AVAILABLE').length,
            staffBusy: staffRes.data.filter((s: any) => s.status === 'BUSY').length,
            staffPartial: staffRes.data.filter((s: any) => s.status === 'PARTIAL').length,
            ledFreeSqft: ledRes.data.reduce((sum: number, l: any) => sum + l.availableSqft, 0),
            ledBookedSqft: ledRes.data.reduce((sum: number, l: any) => sum + l.bookedSqft, 0),
            videoItemsFree: videoRes.data.filter((v: any) => v.status === 'AVAILABLE').length,
            videoItemsBusy: videoRes.data.filter((v: any) => v.status === 'IN_USE').length,
          },
          details: {
            staff: staffRes.data,
            led: ledRes.data,
            video: videoRes.data,
          }
        });
      } catch (error) {
        console.error("Failed to load availability", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, [startDate, endDate]);

  const staffCategories = [
    { label: "All", value: "All" },
    { label: "Technician", value: "TECHNICIAN" },
    { label: "Operator", value: "OPERATOR" },
    { label: "Engineer", value: "ENGINEER" },
    { label: "Labour", value: "LABOUR" },
  ];

  const videoCategories = [
    { label: "All", value: "All" },
    { label: "Cameras", value: "CAMERA" },
    { label: "Stabilizers", value: "STABILIZER" },
    { label: "Lighting", value: "LIGHTING" },
    { label: "Audio", value: "AUDIO" },
    { label: "Editing", value: "EDITING_SYSTEM" },
  ];

  if (loading) return <div className="p-8 text-gray-500 dark:text-slate-400">Loading availability dashboard...</div>;

  return (
    <div className="w-full space-y-6 transition-colors">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Availability Dashboard</h2>
        <div className="flex gap-2 items-center">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" />
          <span className="text-slate-500 dark:text-slate-400">to</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Column: Staff Availability */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gray-600 dark:text-slate-300" strokeWidth={1.75} />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Staff availability</h2>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {staffCategories.map(cat => (
              <button 
                key={cat.value}
                onClick={() => setStaffFilter(cat.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  staffFilter === cat.value 
                  ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400" 
                  : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {data?.details.staff
              .filter((s:any) => staffFilter === "All" || s.role === staffFilter)
              .map((s: any) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-700/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    s.status === 'AVAILABLE' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}>
                    {s.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{s.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">
                      {s.role.replace('_', ' ').toLowerCase()} • ₹{s.perDayRate?.toLocaleString() || s.ratePerDay?.toLocaleString() || 0}/day • {s.staffType === 'IN_HOUSE' ? 'In-house' : 'External'}
                    </p>
                  </div>
                </div>
                <div>
                  {s.status === 'AVAILABLE' ? (
                    <span className="inline-flex px-3 py-1 bg-[#e6f4ea] dark:bg-green-900/30 text-[#137333] dark:text-green-400 rounded-md text-xs font-semibold tracking-wide">
                      Free
                    </span>
                  ) : (
                    <span className="inline-flex px-3 py-1 bg-[#fce8e6] dark:bg-red-900/30 text-[#c5221f] dark:text-red-400 rounded-md text-xs font-semibold tracking-wide">
                      Booked
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: LED & Video Availability */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* LED Panels */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 mb-6">
            <Monitor className="w-5 h-5 text-gray-600 dark:text-slate-300" strokeWidth={1.75} />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">LED panels availability</h2>
          </div>

          <div className="space-y-6">
            {data?.details.led.map((l: any) => (
              <div key={l.id} className="border-b border-gray-100 dark:border-slate-700 pb-6 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gray-400 dark:text-slate-500" strokeWidth={1.75} />
                    <span className="font-semibold text-gray-900 dark:text-white">{l.companyName}</span>
                    <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-medium">{l.ledType}</span>
                    <span className="text-gray-500 dark:text-slate-400 text-xs">{l.cabinetWidthMm}×{l.cabinetHeightMm}mm</span>
                  </div>
                  {l.status === 'ALL_FREE' ? (
                    <span className="text-[#137333] dark:text-green-400 text-sm font-medium">All free</span>
                  ) : l.availableSqft > 0 ? (
                    <span className="text-orange-600 dark:text-orange-400 text-sm font-medium">Partial</span>
                  ) : (
                    <span className="text-[#c5221f] dark:text-red-400 text-sm font-medium">Fully booked</span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2 text-center border border-gray-100 dark:border-slate-600">
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-1">Total</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{l.pricingSqft.toLocaleString()} sq.ft</p>
                  </div>
                  <div className="bg-[#fce8e6]/30 dark:bg-red-900/20 rounded-lg p-2 text-center border border-[#fce8e6] dark:border-red-900/30">
                    <p className="text-xs text-[#c5221f] dark:text-red-400 font-medium mb-1">Booked</p>
                    <p className="text-sm font-bold text-[#c5221f] dark:text-red-400">{l.bookedSqft.toLocaleString()} sq.ft</p>
                  </div>
                  <div className="bg-[#e6f4ea]/50 dark:bg-green-900/20 rounded-lg p-2 text-center border border-[#e6f4ea] dark:border-green-900/30">
                    <p className="text-xs text-[#137333] dark:text-green-400 font-medium mb-1">Free</p>
                    <p className="text-sm font-bold text-[#137333] dark:text-green-400">{l.availableSqft.toLocaleString()} sq.ft</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-slate-300">
              <span>Total sq.ft</span>
              <span className="font-semibold text-gray-900 dark:text-white">{(data?.summary.ledFreeSqft + data?.summary.ledBookedSqft).toLocaleString()} sq.ft</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-slate-300">
              <span>Booked</span>
              <span className="font-semibold text-[#c5221f] dark:text-red-400">{data?.summary.ledBookedSqft.toLocaleString()} sq.ft</span>
            </div>
            <div className="flex justify-between text-gray-900 dark:text-white font-bold pt-2 border-t border-gray-50 dark:border-slate-700/50">
              <span>Available</span>
              <span className="text-[#137333] dark:text-green-400">{data?.summary.ledFreeSqft.toLocaleString()} sq.ft</span>
            </div>
          </div>
        </div>

        {/* Video Equipment */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="w-5 h-5 text-gray-600 dark:text-slate-300" strokeWidth={1.75} />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Video equipment availability</h2>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {videoCategories.map(cat => (
              <button 
                key={cat.value}
                onClick={() => setVideoFilter(cat.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  videoFilter === cat.value 
                  ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400" 
                  : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {data?.details.video
              .filter((v:any) => videoFilter === "All" || v.category === videoFilter)
              .map((v: any) => (
              <div key={v.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-gray-400 dark:text-slate-400" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{v.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">{v.category}</p>
                  </div>
                </div>
                <div>
                  {v.status === 'AVAILABLE' ? (
                    <span className="inline-flex px-3 py-1 bg-[#e6f4ea] dark:bg-green-900/30 text-[#137333] dark:text-green-400 rounded-md text-xs font-semibold tracking-wide">
                      Free
                    </span>
                  ) : (
                    <span className="inline-flex px-3 py-1 bg-[#fce8e6] dark:bg-red-900/30 text-[#c5221f] dark:text-red-400 rounded-md text-xs font-semibold tracking-wide">
                      In Use
                    </span>
                  )}
                </div>
              </div>
            ))}
            {data?.details.video.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-slate-400">No equipment found.</p>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
