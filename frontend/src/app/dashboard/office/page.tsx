"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { usePermission } from "@/lib/usePermission";
import { 
  FileVideo, 
  Palette, 
  Share2, 
  Plus, 
  Search, 
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Pencil,
  ExternalLink,
  ChevronRight,
  HardDrive,
  MessageSquare,
  Link2
} from "lucide-react";
import { format } from "date-fns";

interface OfficeTask {
  id: number;
  title: string;
  description: string | null;
  subDepartment: string;
  priority: string;
  status: string;
  deadline: string | null;
  assignedStaffId: number | null;
  assignedStaff: {
    id: number;
    name: string;
    role: string;
  } | null;
  inquiry: {
    id: number;
    eventName: string;
    inquiryNumber: string | null;
    startDate: string;
  } | null;
  inquiryId: number | null;
  rawFootageRecv: boolean;
  editingStarted: boolean;
  reviewDone: boolean;
  readyForDelivery: boolean;
  previewUrl: string | null;
  comments: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function OfficeDashboard() {
  const router = useRouter();
  const { hasPermission } = usePermission();

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname === "/dashboard/office") {
      router.replace("/dashboard/teams?tab=office");
    }
  }, [router]);

  const [activeTab, setActiveTab] = useState<'tasks'>('tasks');
  const [tasks, setTasks] = useState<OfficeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [subDeptFilter, setSubDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<OfficeTask | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subDepartment: "VIDEO_EDITING",
    priority: "MEDIUM",
    deadline: "",
    assignedStaffId: "",
    inquiryId: "",
    previewUrl: "",
    comments: "",
    notes: ""
  });

  const [staffList, setStaffList] = useState<any[]>([]);
  const [inquiriesList, setInquiriesList] = useState<any[]>([]);

  useEffect(() => {
    fetchTasks();
    fetchSupportData();
  }, [subDeptFilter, statusFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let url = "/office/tasks";
      const params = new URLSearchParams();
      if (subDeptFilter !== "ALL") params.append("subDepartment", subDeptFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      
      const res = await api.get(url + "?" + params.toString());
      setTasks(res.data);
    } catch (error) {
      console.error("Failed to fetch office tasks", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportData = async () => {
    try {
      const [staffRes, inquiryRes] = await Promise.all([
        api.get("/staff"),
        api.get("/inquiries")
      ]);
      setStaffList(staffRes.data);
      setInquiriesList(inquiryRes.data.data || []);
    } catch (error) {
      console.error("Failed to fetch support data", error);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await api.patch(`/office/tasks/${editingTask.id}`, formData);
      } else {
        await api.post("/office/tasks", formData);
      }
      setShowModal(false);
      setEditingTask(null);
      resetForm();
      fetchTasks();
    } catch (error) {
      console.error("Failed to save task", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/office/tasks/${id}`);
      fetchTasks();
    } catch (error) {
      console.error("Failed to delete task", error);
    }
  };

  const toggleWorkflow = async (task: OfficeTask, field: string) => {
    try {
      // @ts-ignore
      const newValue = !task[field];
      await api.patch(`/office/tasks/${task.id}`, { [field]: newValue });
      fetchTasks();
    } catch (error) {
      console.error("Failed to update workflow", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      subDepartment: "VIDEO_EDITING",
      priority: "MEDIUM",
      deadline: "",
      assignedStaffId: "",
      inquiryId: "",
      previewUrl: "",
      comments: "",
      notes: ""
    });
  };

  const openEditModal = (task: OfficeTask) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      subDepartment: task.subDepartment,
      priority: task.priority,
      deadline: task.deadline ? task.deadline.split("T")[0] : "",
      assignedStaffId: task.assignedStaffId?.toString() || "",
      inquiryId: task.inquiryId?.toString() || "",
      previewUrl: task.previewUrl || "",
      comments: task.comments || "",
      notes: task.notes || ""
    });
    setShowModal(true);
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.inquiry?.eventName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "REVIEW": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "text-red-600 dark:text-red-400 font-bold";
      case "HIGH": return "text-orange-600 dark:text-orange-400 font-bold";
      default: return "text-slate-500 dark:text-slate-400";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Office Department</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Post-production, Creative Workflow & Client Proofing</p>
        </div>
        {activeTab === 'tasks' && hasPermission("WORK_TEAMS", "canCreate") && (
          <button 
            onClick={() => { resetForm(); setEditingTask(null); setShowModal(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Task
          </button>
        )}
      </div>

      {/* Premium Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 bg-white dark:bg-slate-800/50 rounded-t-xl overflow-hidden shadow-sm">
        <button 
          onClick={() => setActiveTab('tasks')}
          className={`px-6 py-4 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'tasks' 
              ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
          }`}
        >
          Office Tasks & Proofing
        </button>
      </div>

      {activeTab === 'tasks' ? (
        <>
          {/* Filters & Search */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by task title or event name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select 
                value={subDeptFilter}
                onChange={(e) => setSubDeptFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl py-2 px-3 text-sm font-medium outline-none"
              >
                <option value="ALL">All Departments</option>
                <option value="VIDEO_EDITING">Video Editing</option>
                <option value="GRAPHIC_DESIGN">Graphic Design</option>
                <option value="SOCIAL_MEDIA">Social Media</option>
              </select>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl py-2 px-3 text-sm font-medium outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Under Review</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Task Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Task Details</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Assigned To</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Proofing Link</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Delivery Workflow</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm font-medium">Loading Office Workflow...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        No tasks found matching your filters.
                      </td>
                    </tr>
                  ) : filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            task.subDepartment === "VIDEO_EDITING" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                            task.subDepartment === "GRAPHIC_DESIGN" ? "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" :
                            "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
                          }`}>
                            {task.subDepartment === "VIDEO_EDITING" ? <FileVideo className="w-4 h-4" /> :
                             task.subDepartment === "GRAPHIC_DESIGN" ? <Palette className="w-4 h-4" /> :
                             <Share2 className="w-4 h-4" />}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white">{task.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                                {task.inquiry?.inquiryNumber || "GLOBAL"}
                              </span>
                              <span className="text-[11px] text-slate-550 dark:text-slate-405 font-medium">
                                {task.inquiry?.eventName || "In-house Work"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                            {task.assignedStaff?.name.charAt(0) || "U"}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
                              {task.assignedStaff?.name || "Unassigned"}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {task.deadline ? format(new Date(task.deadline), "MMM dd, yyyy") : "No Deadline"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {task.previewUrl ? (
                          <div className="flex flex-col gap-1">
                            <a 
                              href={task.previewUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                              View Export
                            </a>
                            {task.comments && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold" title={task.comments}>
                                <MessageSquare className="w-3 h-3" />
                                Proof Comments
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">No Link Added</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toggleWorkflow(task, "rawFootageRecv")}
                            className={`p-1.5 rounded-lg transition-all ${task.rawFootageRecv ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400" : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"}`}
                            title="Raw Footage Received"
                          >
                            <HardDrive className="w-4 h-4" />
                          </button>
                          <ChevronRight className="w-3 h-3 text-slate-300" />
                          <button 
                            onClick={() => toggleWorkflow(task, "editingStarted")}
                            className={`p-1.5 rounded-lg transition-all ${task.editingStarted ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"}`}
                            title="Editing Started"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <ChevronRight className="w-3 h-3 text-slate-300" />
                          <button 
                            onClick={() => toggleWorkflow(task, "reviewDone")}
                            className={`p-1.5 rounded-lg transition-all ${task.reviewDone ? "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400" : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"}`}
                            title="Review Completed"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <ChevronRight className="w-3 h-3 text-slate-300" />
                          <button 
                            onClick={() => toggleWorkflow(task, "readyForDelivery")}
                            className={`p-1.5 rounded-lg transition-all ${task.readyForDelivery ? "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400" : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"}`}
                            title="Ready for Delivery"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(task.status)}`}>
                          {task.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {hasPermission("WORK_TEAMS", "canUpdate") && (
                            <button 
                              onClick={() => openEditModal(task)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission("WORK_TEAMS", "canDelete") && (
                            <button 
                              onClick={() => handleDelete(task.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {/* Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingTask ? "Edit Office Task" : "Create Office Task"}</h3>
                <p className="text-sm text-slate-500">Define work requirements and client proofing URL</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all">
                <Clock className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Task Title *</label>
                <input 
                  type="text" 
                  required 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="e.g. Wedding Cinematic Edit"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Department</label>
                  <select 
                    value={formData.subDepartment}
                    onChange={(e) => setFormData({...formData, subDepartment: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                  >
                    <option value="VIDEO_EDITING">Video Editing</option>
                    <option value="GRAPHIC_DESIGN">Graphic Design</option>
                    <option value="SOCIAL_MEDIA">Social Media</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Priority</label>
                  <select 
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Related Inquiry</label>
                  <select 
                    value={formData.inquiryId}
                    onChange={(e) => setFormData({...formData, inquiryId: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                  >
                    <option value="">None (Global Task)</option>
                    {inquiriesList.map(inq => (
                      <option key={inq.id} value={inq.id}>{inq.inquiryNumber} - {inq.eventName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Assign Staff</label>
                  <select 
                    value={formData.assignedStaffId}
                    onChange={(e) => setFormData({...formData, assignedStaffId: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                  >
                    <option value="">Unassigned</option>
                    {staffList.filter(s => s.department === 'OFFICE' || s.role === 'EDITOR').map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Deadline</label>
                  <input 
                    type="date" 
                    value={formData.deadline}
                    onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Task Status</label>
                  <select 
                    value={formData.notes || "NOT_STARTED"}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">Under Review</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Proofing / Export Preview Link</label>
                <input 
                  type="url" 
                  value={formData.previewUrl}
                  onChange={(e) => setFormData({...formData, previewUrl: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="e.g. https://vimeo.com/frame-approval-link"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Proof / Revision Comments</label>
                <textarea 
                  value={formData.comments}
                  onChange={(e) => setFormData({...formData, comments: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="e.g. Client requested color grading tweaks on first 10 seconds."
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Description / Internal Notes</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none"
                  placeholder="Provide general workflow context..."
                  rows={2}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all"
                >
                  {editingTask ? "Update Task" : "Create Task"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
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
