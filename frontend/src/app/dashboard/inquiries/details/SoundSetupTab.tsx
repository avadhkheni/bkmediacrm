"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  Speaker, 
  Zap, 
  Users, 
  Layout, 
  Save, 
  CheckCircle2, 
  Circle,
  Activity,
  Mic2,
  Radio,
  Plus,
  Trash2,
  Search
} from "lucide-react";

interface SoundSetupTabProps {
  inquiryId: number;
}

export default function SoundSetupTab({ inquiryId }: SoundSetupTabProps) {
  const [setup, setSetup] = useState<any>(null);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [bookedGear, setBookedGear] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSetup();
  }, [inquiryId]);

  const fetchSetup = async () => {
    try {
      const [setupRes, equipRes, bookingRes] = await Promise.all([
        api.get(`/sound/setup?inquiryId=${inquiryId}`),
        api.get("/sound/equipment"),
        api.get(`/sound/bookings?inquiryId=${inquiryId}`) // Need to create this endpoint
      ]);
      setSetup(setupRes.data);
      setEquipmentList(equipRes.data);
      setBookedGear(bookingRes.data || []);
    } catch (error) {
      console.error("Failed to fetch sound data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGear = async (item: any) => {
    try {
      const position = prompt("Where will this be placed? (e.g. Stage Left, Front Fill)", "Main PA");
      if (!position) return;

      await api.post("/sound/bookings", {
        inquiryId,
        equipmentId: item.id,
        position,
        bookedFrom: new Date().toISOString(), // Use Inquiry dates ideally
        bookedTo: new Date().toISOString()
      });
      setSearchQuery("");
      fetchSetup();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to book gear");
    }
  };

  const handleRemoveGear = async (bookingId: number) => {
    if (!confirm("Remove this equipment from the event?")) return;
    try {
      await api.delete(`/sound/bookings/${bookingId}`);
      fetchSetup();
    } catch (error) {
      alert("Failed to remove gear");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/sound/setup", setup);
      alert("Sound setup saved successfully!");
    } catch (error) {
      alert("Failed to save setup.");
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkflow = async (field: string) => {
    try {
      const newValue = !setup[field];
      const res = await api.patch(`/sound/setup/${inquiryId}/workflow`, {
        field,
        value: newValue
      });
      setSetup(res.data);
    } catch (error) {
      alert("Failed to update workflow.");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Sound Setup...</div>;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900 dark:bg-slate-800 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Speaker className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Sound Setup & Design</h3>
            <p className="text-sm text-slate-400">Configure PA system, power, and stage requirements.</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requirement Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Layout className="w-4 h-4 text-blue-500" /> Basic Requirements
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Event Type</label>
                <select 
                  value={setup.eventType || ""}
                  onChange={(e) => setSetup({...setup, eventType: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                >
                  <option value="">Select Type...</option>
                  <option value="CONCERT">Live Concert / Gig</option>
                  <option value="WEDDING">Wedding / Reception</option>
                  <option value="SEMINAR">Seminar / Corporate</option>
                  <option value="DJ_PARTY">DJ Party / EDM</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Stage Size (LxW)</label>
                <input 
                  type="text" placeholder="e.g. 40x30 ft"
                  value={setup.stageSize || ""}
                  onChange={(e) => setSetup({...setup, stageSize: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Expected Audience</label>
                <input 
                  type="number" placeholder="e.g. 500"
                  value={setup.audienceSize || ""}
                  onChange={(e) => setSetup({...setup, audienceSize: Number(e.target.value)})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Venue Type</label>
                <select 
                  value={setup.venueType || ""}
                  onChange={(e) => setSetup({...setup, venueType: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                >
                  <option value="">Select Venue...</option>
                  <option value="INDOOR">Indoor Hall</option>
                  <option value="OUTDOOR">Outdoor Ground</option>
                  <option value="STADIUM">Stadium / Arena</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Speaker className="w-4 h-4 text-purple-500" /> PA & Audio Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">PA System Type</label>
                <select 
                  value={setup.paSystemType || ""}
                  onChange={(e) => setSetup({...setup, paSystemType: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                >
                  <option value="">Select PA...</option>
                  <option value="LINE_ARRAY">Line Array (Flying)</option>
                  <option value="POINT_SOURCE">Point Source (Ground Stack)</option>
                  <option value="COLUMN">Column Array</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Total PA Wattage (W)</label>
                <input 
                  type="number" placeholder="e.g. 10000"
                  value={setup.totalWattage || ""}
                  onChange={(e) => setSetup({...setup, totalWattage: Number(e.target.value)})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white font-bold text-blue-600 dark:text-blue-400 outline-none"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Monitor Count</label>
                  <div className="relative">
                    <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="number" value={setup.monitorCount || 0}
                      onChange={(e) => setSetup({...setup, monitorCount: Number(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Wireless Mics</label>
                  <div className="relative">
                    <Radio className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="number" value={setup.wirelessMicCount || 0}
                      onChange={(e) => setSetup({...setup, wirelessMicCount: Number(e.target.value)})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 flex items-center gap-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg text-amber-600 dark:text-amber-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Recommended Power</p>
                  <p className="text-lg font-black text-slate-800 dark:text-white">
                    {(setup.powerRequiredKw || 0).toString()} <span className="text-xs font-bold text-slate-500">KW</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gear Booking Section */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mt-6">
            <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Speaker className="w-4 h-4 text-indigo-500" /> Gear Booking & Allocation
            </h4>
            
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search speakers, mixers, mics..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {searchQuery && (
              <div className="mb-6 space-y-2 max-h-60 overflow-y-auto custom-scrollbar p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                {equipmentList.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{item.name}</p>
                      <p className="text-[10px] text-slate-500">{item.category} • {item.availableQuantity} available</p>
                    </div>
                    <button 
                      onClick={() => handleAddGear(item)}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {bookedGear.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">No gear booked for this event yet.</p>
              ) : (
                bookedGear.map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Speaker className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{booking.equipment?.name || "Equipment"}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-black">{booking.position || "Main PA"}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveGear(booking.id)}
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Workflow & Summary */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h4 className="font-bold text-slate-800 dark:text-white mb-6">Setup Workflow</h4>
            <div className="space-y-4">
              <button 
                onClick={() => toggleWorkflow("riggingDone")}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${setup.riggingDone ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500'}`}
              >
                <div className="flex items-center gap-3">
                  {setup.riggingDone ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  <span className="text-sm font-bold">PA Rigging Complete</span>
                </div>
              </button>
              <button 
                onClick={() => toggleWorkflow("paTuned")}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${setup.paTuned ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500'}`}
              >
                <div className="flex items-center gap-3">
                  {setup.paTuned ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  <span className="text-sm font-bold">System Alignment & Tuning</span>
                </div>
              </button>
              <button 
                onClick={() => toggleWorkflow("soundCheckDone")}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${setup.soundCheckDone ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500'}`}
              >
                <div className="flex items-center gap-3">
                  {setup.soundCheckDone ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  <span className="text-sm font-bold">Artist Sound Check Done</span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
             <div className="flex items-center gap-2 mb-4">
               <Mic2 className="w-4 h-4 text-purple-400" />
               <h4 className="font-bold">Setup Notes</h4>
             </div>
             <textarea 
               value={setup.notes || ""}
               onChange={(e) => setSetup({...setup, notes: e.target.value})}
               placeholder="Write specialized setup instructions here..."
               className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
             />
          </div>
        </div>
      </div>
    </div>
  );
}
