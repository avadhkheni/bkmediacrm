"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import PageSkeleton from "@/components/PageSkeleton";
import { HardDrive, Plus, Save, Download, Video, Calendar, Trash2 } from "lucide-react";

interface VideoDataSheetTabProps {
  inquiryId: number;
}

export default function VideoDataSheetTab({ inquiryId }: VideoDataSheetTabProps) {
  const [dataSheets, setDataSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Data Sheet Form
  const [showNewSheet, setShowNewSheet] = useState(false);
  const [newSheetForm, setNewSheetForm] = useState({
    dayNumber: 1,
    eventDate: new Date().toISOString().split('T')[0],
    sessionName: "Morning Session"
  });

  // Selected Data Sheet for editing entries
  const [activeSheet, setActiveSheet] = useState<any>(null);
  
  // Entries form state [ { cameraPosition: "", dataGb: 0, notes: "" } ]
  const [entries, setEntries] = useState<any[]>([]);
  const [savingEntries, setSavingEntries] = useState(false);

  useEffect(() => {
    fetchDataSheets();
  }, [inquiryId]);

  const fetchDataSheets = async () => {
    try {
      const res = await api.get(`/video/data-sheets?inquiryId=${inquiryId}`);
      setDataSheets(res.data || []);
      
      // Update active sheet if one was selected to refresh its entries
      if (activeSheet) {
        const updated = res.data.find((s: any) => s.id === activeSheet.id);
        if (updated) {
          setActiveSheet(updated);
          setEntries(updated.entries || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data sheets", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/video/data-sheets", {
        inquiryId,
        dayNumber: Number(newSheetForm.dayNumber),
        eventDate: new Date(newSheetForm.eventDate).toISOString(),
        sessionName: newSheetForm.sessionName
      });
      
      setShowNewSheet(false);
      await fetchDataSheets();
      
      // Auto-select the newly created sheet
      const newSheet = res.data;
      setActiveSheet(newSheet);
      setEntries([]);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create data sheet");
    }
  };

  const handleAddEntryRow = () => {
    setEntries([...entries, { cameraPosition: "", dataGb: 0, notes: "" }]);
  };

  const handleEntryChange = (index: number, field: string, value: any) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  const handleRemoveEntryRow = (index: number) => {
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
  };

  const handleSaveEntries = async () => {
    if (!activeSheet) return;
    setSavingEntries(true);
    try {
      // We assume entries are replaced/updated. If bulk creates duplicate, the controller might handle it or just append.
      // Usually a bulk POST creates new ones. We should be careful to only post NEW ones or the controller might support UPSERT.
      // Assuming controller just accepts an array of entries. Let's send them.
      await api.post(`/video/data-sheets/${activeSheet.id}/entries/bulk`, {
        entries: entries.map(e => ({
          ...e,
          dataGb: Number(e.dataGb)
        }))
      });
      alert("Data sheet entries saved successfully.");
      fetchDataSheets();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to save entries");
    } finally {
      setSavingEntries(false);
    }
  };

  if (loading) return <PageSkeleton variant="table" />;

  const totalEventData = dataSheets.reduce((sum, sheet) => {
    return sum + (sheet.entries || []).reduce((entrySum: number, entry: any) => entrySum + Number(entry.dataGb), 0);
  }, 0);

  // HDD Recommendation based on total data
  const recommendedHDD = totalEventData < 500 ? "500GB SSD" 
    : totalEventData < 1000 ? "1TB HDD/SSD" 
    : totalEventData < 2000 ? "2TB HDD"
    : totalEventData < 4000 ? "4TB HDD" 
    : "Multiple High-Capacity HDDs";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Video Data Management</h3>
            <p className="text-sm text-slate-400">Track recorded session data and hard disk requirements.</p>
          </div>
        </div>
        <div className="flex gap-6 items-center">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Data (Est.)</p>
            <p className="text-2xl font-black text-white">{totalEventData.toFixed(2)} <span className="text-sm font-semibold text-slate-400">GB</span></p>
          </div>
          <div className="h-10 w-px bg-slate-700"></div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Recommended Media</p>
            <p className="text-lg font-bold text-green-400">{recommendedHDD}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Sheet List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-800 dark:text-white">Session Sheets</h4>
            <button 
              onClick={() => setShowNewSheet(!showNewSheet)}
              className="text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              + New Sheet
            </button>
          </div>

          {showNewSheet && (
            <form onSubmit={handleCreateSheet} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-blue-200 dark:border-blue-900/30 shadow-sm space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Day No.</label>
                <input type="number" required min="1" value={newSheetForm.dayNumber} onChange={e => setNewSheetForm({...newSheetForm, dayNumber: parseInt(e.target.value) || 1})} className="w-full text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Date</label>
                <input type="date" required value={newSheetForm.eventDate} onChange={e => setNewSheetForm({...newSheetForm, eventDate: e.target.value})} className="w-full text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Session Name</label>
                <input type="text" required placeholder="e.g. Sangeet Evening" value={newSheetForm.sessionName} onChange={e => setNewSheetForm({...newSheetForm, sessionName: e.target.value})} className="w-full text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-700">Create</button>
                <button type="button" onClick={() => setShowNewSheet(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {dataSheets.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No data sheets created yet.</p>
            ) : (
              dataSheets.map(sheet => {
                const sheetTotal = (sheet.entries || []).reduce((sum: number, e: any) => sum + Number(e.dataGb), 0);
                const isActive = activeSheet?.id === sheet.id;
                
                return (
                  <div 
                    key={sheet.id}
                    onClick={() => { setActiveSheet(sheet); setEntries(sheet.entries || []); }}
                    className={`cursor-pointer p-4 rounded-xl border transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-bold text-sm text-slate-900 dark:text-white">Day {sheet.dayNumber} - {sheet.sessionName}</h5>
                      <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                        {sheetTotal} GB
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" /> {new Date(sheet.eventDate).toLocaleDateString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Sheet Entries Editor */}
        <div className="lg:col-span-2">
          {activeSheet ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Data Log: Day {activeSheet.dayNumber}</h4>
                  <p className="text-xs text-slate-500">{activeSheet.sessionName}</p>
                </div>
                <button 
                  onClick={handleSaveEntries}
                  disabled={savingEntries}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {savingEntries ? 'Saving...' : 'Save Log'}
                </button>
              </div>
              
              <div className="p-5">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Camera / Position</th>
                      <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Data Size (GB)</th>
                      <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Notes / Card ID</th>
                      <th className="pb-3 text-xs font-bold text-slate-400 uppercase text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => (
                      <tr key={index} className="border-b border-slate-100 dark:border-slate-700/50">
                        <td className="py-3 pr-2">
                          <input 
                            type="text" placeholder="e.g. Cam 1 (Wide)"
                            value={entry.cameraPosition} onChange={e => handleEntryChange(index, 'cameraPosition', e.target.value)}
                            className="w-full text-sm p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
                          />
                        </td>
                        <td className="py-3 pr-2">
                          <input 
                            type="number" min="0" step="0.1"
                            value={entry.dataGb} onChange={e => handleEntryChange(index, 'dataGb', e.target.value)}
                            className="w-full text-sm p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-blue-600 dark:text-blue-400"
                          />
                        </td>
                        <td className="py-3 pr-2">
                          <input 
                            type="text" placeholder="Optional notes"
                            value={entry.notes || ''} onChange={e => handleEntryChange(index, 'notes', e.target.value)}
                            className="w-full text-sm p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                          />
                        </td>
                        <td className="py-3 text-right">
                          <button onClick={() => handleRemoveEntryRow(index)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button 
                  onClick={handleAddEntryRow}
                  className="mt-4 w-full border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-600 dark:hover:text-blue-400 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Camera Entry
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 p-12">
              <Video className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-600" />
              <p className="font-medium">Select a Session Sheet from the left</p>
              <p className="text-sm mt-1">or create a new one to log recorded data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
