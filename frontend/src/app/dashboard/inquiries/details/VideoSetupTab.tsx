"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  Video, 
  Layers, 
  Save, 
  CheckCircle2, 
  Circle,
  Activity,
  Plus,
  Trash2,
  Search,
  Truck,
  DollarSign,
  AlertCircle,
  X,
  Camera
} from "lucide-react";

interface VideoSetupTabProps {
  inquiryId: number;
}

export default function VideoSetupTab({ inquiryId }: VideoSetupTabProps) {
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [bookedGear, setBookedGear] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Custom Allocation Modal State
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [selectedGear, setSelectedGear] = useState<any>(null);
  const [allocating, setAllocating] = useState(false);
  const [allocForm, setAllocForm] = useState({
    position: "Camera 1",
    isOutsourced: false,
    vendorId: "",
    vendorCost: ""
  });

  const fetchData = async () => {
    try {
      const [equipRes, bookingRes, vendorsRes] = await Promise.all([
        api.get("/video/equipment"),
        api.get(`/video/bookings?inquiryId=${inquiryId}`),
        api.get("/vendors?department=VIDEO")
      ]);
      setEquipmentList(equipRes.data);
      setBookedGear(bookingRes.data || []);
      setVendors(vendorsRes.data || []);
    } catch (error) {
      console.error("Failed to fetch video setup data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [inquiryId]);

  const handleOpenAllocModal = (item: any) => {
    setSelectedGear(item);
    setAllocForm({
      position: "Camera 1",
      isOutsourced: false,
      vendorId: vendors[0]?.id?.toString() || "",
      vendorCost: ""
    });
    setShowAllocModal(true);
  };

  const handleConfirmAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGear) return;
    setAllocating(true);
    try {
      const postData: any = {
        inquiryId,
        equipmentId: selectedGear.id,
        position: allocForm.position,
        bookedFrom: new Date().toISOString(), // Matches inquiry date range
        bookedTo: new Date().toISOString()
      };

      if (allocForm.isOutsourced) {
        if (!allocForm.vendorId) {
          alert("Please select a vendor.");
          setAllocating(false);
          return;
        }
        postData.vendorId = Number(allocForm.vendorId);
        postData.vendorCost = Number(allocForm.vendorCost || 0);
      }

      await api.post("/video/bookings", postData);
      setSearchQuery("");
      setShowAllocModal(false);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to book gear");
    } finally {
      setAllocating(false);
    }
  };

  const handleRemoveGear = async (bookingId: number) => {
    if (!confirm("Remove this equipment from the event?")) return;
    try {
      await api.delete(`/video/bookings/${bookingId}`);
      fetchData();
    } catch (error) {
      alert("Failed to remove gear");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Video Equipment Booking...</div>;

  return (
    <div className="space-y-6 relative">
      {/* Header Info */}
      <div className="bg-slate-900 dark:bg-slate-800 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Video Gear Allocation</h3>
            <p className="text-sm text-slate-400">Allocate cameras, lenses, mixers, and manage external video suppliers.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gear Booking Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-500" /> Allocate Video Gear
            </h4>
            
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search cameras, lenses, switchers, recorders..." 
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
                      <p className="text-[10px] text-slate-500">{item.category} • {item.availableQuantity} in warehouse stock</p>
                    </div>
                    <button 
                      onClick={() => handleOpenAllocModal(item)}
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
                <p className="text-sm text-slate-400 text-center py-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">No video gear allocated for this event yet.</p>
              ) : (
                bookedGear.map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Video className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{booking.equipment?.name || "Equipment"}</p>
                          {booking.vendor && (
                            <span className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-[10px] font-black px-2 py-0.5 rounded border border-purple-200/20 uppercase tracking-wide">
                              <Truck className="w-3 h-3" /> Outsourced: {booking.vendor.name} (₹{booking.vendorCost})
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 uppercase font-black mt-1">{booking.position || "Camera Position"}</p>
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

        {/* Right Col: Allocation Summary Stats */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h4 className="font-bold text-slate-800 dark:text-white mb-4">Allocation Summary</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-500 font-medium">Total Gear Allocated</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{bookedGear.length} units</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-sm text-slate-500 font-medium">In-House Gear</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{bookedGear.filter(b => !b.vendorId).length} units</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-sm text-slate-500 font-medium">Outsourced Rental Gear</span>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{bookedGear.filter(b => b.vendorId).length} units</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Allocation Custom Modal */}
      {showAllocModal && selectedGear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowAllocModal(false)}></div>
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl z-10 overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">Allocate Video Equipment</h3>
                <p className="text-xs text-slate-400 font-semibold mt-1 uppercase tracking-wide">{selectedGear.name}</p>
              </div>
              <button onClick={() => setShowAllocModal(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAllocation} className="p-6 space-y-4">
              {/* Placement Position */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Placement / Position *</label>
                <input 
                  type="text"
                  required
                  value={allocForm.position}
                  onChange={(e) => setAllocForm({...allocForm, position: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none"
                  placeholder="e.g. Camera 1, Wide Cam, Stage Crane"
                />
              </div>

              {/* Toggle Sourcing Option */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={allocForm.isOutsourced}
                    onChange={(e) => setAllocForm({...allocForm, isOutsourced: e.target.checked})}
                    className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500/20"
                  />
                  <div className="text-sm">
                    <p className="font-bold text-slate-800 dark:text-white leading-none">Outsource from External Vendor</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">Source this unit from an external supplier instead of warehouse stock.</p>
                  </div>
                </label>
              </div>

              {/* Outsourced Fields */}
              {allocForm.isOutsourced && (
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  {vendors.length === 0 ? (
                    <div className="flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/20">
                      <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">No Registered Vendors Found</p>
                        <p className="mt-0.5 leading-relaxed font-medium">Please add a vendor for the **Video Department** under Team -&gt; Vendor Directory first before outsourcing.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Vendor Selection */}
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Select Supplier *</label>
                        <select
                          required
                          value={allocForm.vendorId}
                          onChange={(e) => setAllocForm({...allocForm, vendorId: e.target.value})}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                        >
                          {vendors.map(v => (
                            <option key={v.id} value={v.id}>{v.name} ({v.specialization || "General"})</option>
                          ))}
                        </select>
                      </div>

                      {/* Vendor Cost */}
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Supplier Cost Rate (₹) *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
                          <input 
                            type="number"
                            required
                            min="0"
                            value={allocForm.vendorCost}
                            onChange={(e) => setAllocForm({...allocForm, vendorCost: e.target.value})}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-7 pr-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none"
                            placeholder="e.g. 3000"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={allocating || (allocForm.isOutsourced && vendors.length === 0)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl text-sm transition-all disabled:opacity-50 shadow-md"
                >
                  {allocating ? "Allocating..." : "Confirm Allocation"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAllocModal(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-2xl text-sm hover:bg-slate-200 transition-all"
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
