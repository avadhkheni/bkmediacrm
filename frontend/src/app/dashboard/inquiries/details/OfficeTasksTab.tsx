"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
  Monitor, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Plus, 
  Pencil, 
  Trash2,
  Calendar,
  Layers,
  ChevronRight,
  ClipboardList
} from "lucide-react";

interface OfficeTasksTabProps {
  inquiryId: number;
}

export default function OfficeTasksTab({ inquiryId }: OfficeTasksTabProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subDepartment: "VIDEO_EDITING",
    priority: "MEDIUM",
    deadline: "",
    assignedStaffId: "",
  });

  useEffect(() => {
    fetchData();
  }, [inquiryId]);

  const fetchData = async () => {
    try {
      const [tasksRes, staffRes] = await Promise.all([
        api.get(`/office/tasks?inquiryId=${inquiryId}`),
        api.get("/staff?department=OFFICE")
      ]);
      setTasks(tasksRes.data);
      setStaff(staffRes.data);
    } catch (error) {
      console.error("Failed to fetch office data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (task: any = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || "",
        subDepartment: task.subDepartment,
        priority: task.priority,
        deadline: task.deadline ? task.deadline.split('T')[0] : "",
        assignedStaffId: task.assignedStaffId?.toString() || "",
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: "",
        description: "",
        subDepartment: "VIDEO_EDITING",
        priority: "MEDIUM",
        deadline: "",
        assignedStaffId: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        inquiryId,
        assignedStaffId: formData.assignedStaffId ? parseInt(formData.assignedStaffId) : null
      };

      if (editingTask) {
        await api.patch(`/office/tasks/${editingTask.id}`, payload);
      } else {
        await api.post("/office/tasks", payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert("Failed to save task.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleWorkflow = async (taskId: number, field: string, currentValue: boolean) => {
    try {
      await api.patch(`/office/tasks/${taskId}/workflow`, {
        field,
        value: !currentValue
      });
      fetchData();
    } catch (error) {
      alert("Failed to update task progress.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this task?")) return;
    try {
      await api.delete(`/office/tasks/${id}`);
      fetchData();
    } catch (error) {
      alert("Failed to delete task.");
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Office Tasks...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Office & Editing Workflow</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track post-production, design, and delivery status.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" /> Create Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <div key={task.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                task.priority === 'URGENT' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                task.priority === 'HIGH' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {task.priority}
              </span>
              <div className="flex gap-1">
                <button onClick={() => handleOpenModal(task)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-400 transition-all">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(task.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-500 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">{task.title}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{task.description || "No description provided."}</p>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned To</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{task.assignedStaff?.name || "Unassigned"}</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-50 dark:border-slate-700 pt-4">
               {[
                 { label: "Raw Footage Recv", field: "rawFootageRecv" },
                 { label: "Editing Started", field: "editingStarted" },
                 { label: "Internal Review", field: "reviewDone" },
                 { label: "Ready for Delivery", field: "readyForDelivery" }
               ].map((step) => (
                 <button 
                   key={step.field}
                   onClick={() => toggleWorkflow(task.id, step.field, task[step.field])}
                   className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                     task[step.field] 
                     ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400" 
                     : "bg-slate-50 border-slate-100 text-slate-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-500"
                   }`}
                 >
                   <span>{step.label}</span>
                   {task[step.field] ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-200 dark:border-slate-700" />}
                 </button>
               ))}
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
             <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
             <p className="text-slate-500 dark:text-slate-400 font-medium">No tasks created for this inquiry yet.</p>
             <button onClick={() => handleOpenModal()} className="mt-4 text-blue-600 font-bold hover:underline">Add first task</button>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700">
            <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingTask ? "Edit Task" : "New Office Task"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Task Title</label>
                <input 
                  required
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g. Highlight Video Editing"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Sub-Department</label>
                  <select 
                    value={formData.subDepartment}
                    onChange={e => setFormData({...formData, subDepartment: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="VIDEO_EDITING">Video Editing</option>
                    <option value="GRAPHIC_DESIGN">Graphic Design</option>
                    <option value="SOCIAL_MEDIA">Social Media / Reels</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Priority</label>
                  <select 
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Assigned Staff</label>
                <select 
                  value={formData.assignedStaffId}
                  onChange={e => setFormData({...formData, assignedStaffId: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white"
                >
                  <option value="">Unassigned</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Deadline</label>
                <input 
                  type="date" 
                  value={formData.deadline}
                  onChange={e => setFormData({...formData, deadline: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300">Cancel</button>
                <button disabled={submitting} type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/20">{submitting ? "Saving..." : "Save Task"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
