"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useUIStore } from "@/store/uiStore";
import { 
  Shield, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Save, 
  Key, 
  UserCheck, 
  Settings,
  UserPlus,
  Users,
  Lock,
  Mail,
  User,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { usePermission } from "@/lib/usePermission";

interface Permission {
  id?: number;
  module: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

interface Role {
  name: string;
  description: string | null;
  permissions: Permission[];
  _count?: {
    users: number;
  };
}

const MODULES = [
  "DASHBOARD",
  "INQUIRIES",
  "CLIENTS",
  "AVAILABILITY",
  "WORK_TEAMS",
  "WAREHOUSE",
  "ITEM_STOCK",
  "TO_DO_CHECKLISTS",
  "VENDORS",
  "VEHICLES",
  "INVOICES",
  "PROFIT_REPORTS",
  "STAFF"
];

const formatModuleName = (name: string) => {
  if (name === "TO_DO_CHECKLISTS") return "To-Do & Checklists";
  if (name === "PROFIT_REPORTS") return "Profit Reports";
  if (name === "WORK_TEAMS") return "Work Teams";
  return name.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

export default function RolesPage() {
  const { addToast } = useUIStore();
  const { hasPermission } = usePermission();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Create role form state
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  // Tab & User States
  const [activeTab, setActiveTab] = useState<'permissions' | 'users'>('permissions');
  const [users, setUsers] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // User account form state
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchUsers();
    fetchStaff();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.get("/roles/users");
      setUsers(res.data || []);
    } catch (error) {
      console.error("Failed to load system users", error);
      addToast("Failed to load user accounts list", "error");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await api.get("/staff");
      setStaffList(res.data || []);
    } catch (error) {
      console.error("Failed to load staff list", error);
    }
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await api.get("/roles");
      setRoles(res.data || []);
      
      // Auto-select first role or preserve selection
      if (res.data && res.data.length > 0) {
        if (selectedRole) {
          const updatedSelected = res.data.find((r: Role) => r.name === selectedRole.name);
          setSelectedRole(updatedSelected || res.data[0]);
        } else {
          setSelectedRole(res.data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load roles", error);
      addToast("Failed to load roles and permissions matrix", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (moduleName: string, action: "canCreate" | "canRead" | "canUpdate" | "canDelete") => {
    if (!selectedRole || selectedRole.name === "ADMIN") return; // Admin permissions cannot be changed

    const updatedPermissions = [...selectedRole.permissions];
    const permIndex = updatedPermissions.findIndex(p => p.module === moduleName);

    if (permIndex > -1) {
      updatedPermissions[permIndex] = {
        ...updatedPermissions[permIndex],
        [action]: !updatedPermissions[permIndex][action]
      };
    } else {
      // Create permission entry if not existing
      updatedPermissions.push({
        module: moduleName,
        canCreate: action === "canCreate",
        canRead: action === "canRead",
        canUpdate: action === "canUpdate",
        canDelete: action === "canDelete"
      });
    }

    setSelectedRole({
      ...selectedRole,
      permissions: updatedPermissions
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      // Map permissions to ensure all modules are represented
      const permissionsToSave = MODULES.map(mod => {
        const existing = selectedRole.permissions.find(p => p.module === mod);
        return {
          module: mod,
          canCreate: existing ? existing.canCreate : false,
          canRead: existing ? existing.canRead : false,
          canUpdate: existing ? existing.canUpdate : false,
          canDelete: existing ? existing.canDelete : false
        };
      });

      await api.put(`/roles/${selectedRole.name}`, {
        description: selectedRole.description,
        permissions: permissionsToSave
      });

      addToast(`Permissions for ${selectedRole.name} updated successfully!`, "success");
      fetchRoles();
    } catch (error) {
      console.error("Failed to update permissions", error);
      addToast("Failed to update role permissions", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const formattedName = newRoleName.toUpperCase().replace(/\s+/g, "_");

    try {
      // Initialize default read-only permissions for new role
      const initialPermissions = MODULES.map(mod => ({
        module: mod,
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false
      }));

      const res = await api.post("/roles", {
        name: formattedName,
        description: newRoleDesc,
        permissions: initialPermissions
      });

      addToast(`Role "${formattedName}" created successfully!`, "success");
      setNewRoleName("");
      setNewRoleDesc("");
      setIsCreateModalOpen(false);
      
      // Select the newly created role
      setSelectedRole(res.data);
      fetchRoles();
    } catch (error: any) {
      console.error("Failed to create role", error);
      addToast(error.response?.data?.message || "Failed to create new role", "error");
    }
  };

  const handleDeleteRole = async (roleName: string) => {
    if (roleName === "ADMIN") return;
    if (!confirm(`Are you absolutely sure you want to delete the "${roleName}" role? This action is permanent.`)) return;

    try {
      await api.delete(`/roles/${roleName}`);
      addToast(`Role "${roleName}" deleted successfully!`, "success");
      setSelectedRole(null);
      fetchRoles();
    } catch (error: any) {
      console.error("Failed to delete role", error);
      addToast(error.response?.data?.message || "Failed to delete role", "error");
    }
  };

  const handleStaffSelect = (staffId: string) => {
    setSelectedStaffId(staffId);
    if (!staffId) {
      setUserName("");
      setUserEmail("");
      setUserRole("");
      return;
    }
    const staff = staffList.find(s => s.id === Number(staffId));
    if (staff) {
      setUserName(staff.name || "");
      setUserEmail(staff.email || "");
      
      // Auto-pre-select a matching system role
      const matchedRole = roles.find(r => r.name.toUpperCase() === staff.role.toUpperCase());
      if (matchedRole) {
        setUserRole(matchedRole.name);
      } else {
        const normalized = staff.role.toUpperCase();
        if (normalized.includes("LED")) {
          setUserRole("LED_DEPT");
        } else if (normalized.includes("VIDEO")) {
          setUserRole("VIDEO_DEPT");
        } else if (normalized.includes("ADMIN")) {
          setUserRole("ADMIN");
        } else if (normalized.includes("FINANCE") || normalized.includes("ACCOUNT")) {
          setUserRole("FINANCE");
        } else {
          setUserRole("STAFF");
        }
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail || !userPassword || !userRole) {
      addToast("Please fill in all user login fields", "error");
      return;
    }
    setCreatingUser(true);
    try {
      await api.post("/roles/users", {
        name: userName,
        email: userEmail,
        password: userPassword,
        role: userRole,
        staffId: selectedStaffId ? Number(selectedStaffId) : undefined
      });
      addToast("User login account created successfully!", "success");
      
      // Reset form
      setSelectedStaffId("");
      setUserName("");
      setUserEmail("");
      setUserPassword("");
      setUserRole("");
      
      // Refresh database records
      fetchUsers();
      fetchRoles();
    } catch (error: any) {
      console.error("Failed to create user", error);
      const errMsg = error.response?.data?.message || "Failed to create user login account";
      addToast(errMsg, "error");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await api.put(`/roles/users/${userId}/status`, {
        isActive: !currentStatus
      });
      addToast("User account status updated successfully!", "success");
      fetchUsers();
    } catch (error: any) {
      console.error("Failed to toggle status", error);
      const errMsg = error.response?.data?.message || "Failed to toggle status";
      addToast(errMsg, "error");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this user login account? They will lose access to the system immediately.")) {
      return;
    }
    try {
      await api.delete(`/roles/users/${userId}`);
      addToast("User login account deleted successfully!", "success");
      fetchUsers();
      fetchRoles();
    } catch (error: any) {
      console.error("Failed to delete user", error);
      const errMsg = error.response?.data?.message || "Failed to delete user login account";
      addToast(errMsg, "error");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold text-sm tracking-wide">Loading authorization systems...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Users & Roles Matrix
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure system access privileges and operational permissions for your work teams.
          </p>
        </div>
        
        {hasPermission("STAFF", "canCreate") && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Custom Role
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 pb-px">
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-6 py-3 font-extrabold text-sm tracking-wider border-b-2 transition-all duration-200 flex items-center gap-2 ${
            activeTab === 'permissions'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Settings className="w-4.5 h-4.5" />
          Role Permissions Matrix
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 font-extrabold text-sm tracking-wider border-b-2 transition-all duration-200 flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4.5 h-4.5" />
          Login User Accounts
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Create User Login Account Form */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-700 pb-3">
              <UserPlus className="w-4.5 h-4.5 text-blue-500" />
              Create Login Account
            </h3>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Select Staff Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                  Link Staff Profile (Optional)
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => handleStaffSelect(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Independent User Account --</option>
                  {staffList.map((staff) => {
                    const alreadyHasAccount = users.some(u => u.staffId === staff.id);
                    return (
                      <option key={staff.id} value={staff.id} disabled={alreadyHasAccount}>
                        {staff.name} ({staff.role}{alreadyHasAccount ? ' - Already Active' : ''})
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Selecting a staff profile will pre-fill their name, email and matching role.
                </p>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                  Email Address (Login ID)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@bkmedia.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                  Login Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Assigned Role Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 dark:text-slate-400">
                  Assign System Role
                </label>
                <select
                  required
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Choose Access Role --</option>
                  {roles.map((r) => (
                    <option key={r.name} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {hasPermission("STAFF", "canCreate") && (
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm mt-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {creatingUser ? "Creating Account..." : "Create Account"}
                </button>
              )}
            </form>
          </div>

          {/* Active System Users List Table */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Users className="w-4.5 h-4.5 text-blue-500" />
              Authorized User Accounts ({users.length})
            </h3>

            {loadingUsers ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold text-xs tracking-wider">Retrieving logins...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-20 text-slate-400 dark:text-slate-500 text-sm font-semibold">
                No user login accounts configured. Link a staff member on the left to set active access.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700/70">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-150 dark:border-slate-700">
                      <th className="p-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">User Details</th>
                      <th className="p-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">System Role</th>
                      <th className="p-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Linked Staff Profile</th>
                      <th className="p-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Login Access</th>
                      <th className="p-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {users.map((userItem) => (
                      <tr key={userItem.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors">
                        {/* Name and Email */}
                        <td className="p-4">
                          <div className="font-bold text-sm text-slate-800 dark:text-white">{userItem.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{userItem.email}</div>
                        </td>
                        
                        {/* Role */}
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider ${
                            userItem.role === 'ADMIN' 
                              ? 'bg-red-500/10 text-red-500' 
                              : userItem.role === 'FINANCE' || userItem.role === 'ACCOUNTS'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-blue-500/10 text-blue-500'
                          }`}>
                            <Shield className="w-3 h-3" />
                            {userItem.role}
                          </span>
                        </td>

                        {/* Linked Staff */}
                        <td className="p-4 text-sm text-slate-700 dark:text-slate-350 font-bold">
                          {userItem.staff ? (
                            <div>
                              <span>{userItem.staff.name}</span>
                              <span className="text-[10px] block text-slate-500 uppercase font-bold tracking-wider">
                                {userItem.staff.department || "General Team"} • {userItem.staff.phone}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-550 font-semibold italic text-xs">Independent User</span>
                          )}
                        </td>

                        {/* Status Switch */}
                        <td className="p-4 text-center">
                          {hasPermission("STAFF", "canUpdate") && (
                            <button
                              onClick={() => handleToggleUserStatus(userItem.id, userItem.isActive)}
                              disabled={userItem.role === 'ADMIN'}
                              className={`p-1 rounded-lg transition-colors ${
                                userItem.role === 'ADMIN'
                                  ? 'opacity-40 cursor-not-allowed text-green-500'
                                  : userItem.isActive 
                                  ? 'text-green-500 hover:text-green-600' 
                                  : 'text-slate-300 dark:text-slate-600 hover:text-slate-500'
                              }`}
                              title={userItem.isActive ? "Deactivate Account" : "Activate Account"}
                            >
                              {userItem.isActive ? (
                                <ToggleRight className="w-8 h-8" />
                              ) : (
                                <ToggleLeft className="w-8 h-8" />
                              )}
                            </button>
                          )}
                        </td>

                        {/* Delete User Login */}
                        <td className="p-4 text-center">
                          {hasPermission("STAFF", "canDelete") && (
                            <button
                              onClick={() => handleDeleteUser(userItem.id)}
                              disabled={userItem.role === 'ADMIN'}
                              className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Delete User Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Role Selector Box */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-500" />
              Select Role to Configure
            </h3>
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar">
              {roles.map((role) => {
                const isActive = selectedRole?.name === role.name;
                return (
                  <button
                    key={role.name}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-950/30 border-blue-500/40 text-blue-900 dark:text-blue-200 shadow-sm"
                        : "bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/30 dark:hover:bg-slate-900/60 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-350"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-black text-sm tracking-wide">{role.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {role._count?.users || 0} Users
                      </span>
                    </div>
                    <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 line-clamp-2">
                      {role.description || "No description provided."}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Permission Rules Panel */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
            {selectedRole ? (
              <>
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">
                        {selectedRole.name} Permissions
                      </h3>
                      {selectedRole.name === "ADMIN" && (
                        <span className="text-[10px] font-black tracking-widest px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 uppercase flex items-center gap-1 animate-pulse">
                          <Key className="w-3.5 h-3.5" /> Immutable
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {selectedRole.description || "No description provided for this role."}
                    </p>
                  </div>

                  {selectedRole.name !== "ADMIN" && (
                    <div className="flex items-center gap-2">
                      {hasPermission("STAFF", "canDelete") && (
                        <button
                          onClick={() => handleDeleteRole(selectedRole.name)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 p-2.5 rounded-xl border border-transparent hover:border-red-200 dark:hover:border-red-900/30 transition-all"
                          title="Delete Role"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      {hasPermission("STAFF", "canUpdate") && (
                        <button
                          onClick={handleSavePermissions}
                          disabled={saving}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {saving ? "Saving..." : "Save Matrix"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Warning/Alert for ADMIN role */}
                {selectedRole.name === "ADMIN" && (
                  <div className="flex gap-3 bg-amber-500/5 border border-amber-500/25 p-4 rounded-xl text-amber-600 dark:text-amber-400 text-sm">
                    <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">ADMIN role has absolute privileges:</span> The system administrator bypassed standard permission guards. These permissions cannot be edited or restricted to ensure you don't accidentally lock yourself out.
                    </div>
                  </div>
                )}

                {/* Perm Table Matrix */}
                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700/70">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-150 dark:border-slate-700">
                        <th className="p-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-1/3">Module / System</th>
                        <th className="p-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Read</th>
                        <th className="p-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Create</th>
                        <th className="p-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Update</th>
                        <th className="p-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {MODULES.map(moduleName => {
                        const perm = selectedRole.permissions.find(p => p.module === moduleName) || {
                          canRead: false,
                          canCreate: false,
                          canUpdate: false,
                          canDelete: false
                        };
                        return (
                          <tr key={moduleName} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors">
                            <td className="p-4 font-bold text-sm text-slate-700 dark:text-slate-300">
                              {formatModuleName(moduleName)}
                            </td>
                            <td className="p-4 text-center">
                              <input
                                type="checkbox"
                                checked={perm.canRead}
                                disabled={selectedRole.name === "ADMIN"}
                                onChange={() => handlePermissionToggle(moduleName, "canRead")}
                                className="w-5 h-5 rounded border-slate-350 dark:border-slate-600 text-blue-600 focus:ring-blue-500/20 disabled:opacity-40 cursor-pointer"
                              />
                            </td>
                            <td className="p-4 text-center">
                              <input
                                type="checkbox"
                                checked={perm.canCreate}
                                disabled={selectedRole.name === "ADMIN"}
                                onChange={() => handlePermissionToggle(moduleName, "canCreate")}
                                className="w-5 h-5 rounded border-slate-350 dark:border-slate-600 text-blue-600 focus:ring-blue-500/20 disabled:opacity-40 cursor-pointer"
                              />
                            </td>
                            <td className="p-4 text-center">
                              <input
                                type="checkbox"
                                checked={perm.canUpdate}
                                disabled={selectedRole.name === "ADMIN"}
                                onChange={() => handlePermissionToggle(moduleName, "canUpdate")}
                                className="w-5 h-5 rounded border-slate-350 dark:border-slate-600 text-blue-600 focus:ring-blue-500/20 disabled:opacity-40 cursor-pointer"
                              />
                            </td>
                            <td className="p-4 text-center">
                              <input
                                type="checkbox"
                                checked={perm.canDelete}
                                disabled={selectedRole.name === "ADMIN"}
                                onChange={() => handlePermissionToggle(moduleName, "canDelete")}
                                className="w-5 h-5 rounded border-slate-350 dark:border-slate-600 text-blue-600 focus:ring-blue-500/20 disabled:opacity-40 cursor-pointer"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400">
                <Shield className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="font-bold text-sm">No Role Selected</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                  Select a role from the side panel to view and customize its module-level operational authorizations.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Create Custom Role
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Define a new access category. New roles are initialized with safe read-only defaults across all modules.
            </p>

            <form onSubmit={handleCreateRole} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Role Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. MARKETING_TEAM"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-950 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Description (Optional)</label>
                <textarea
                  placeholder="e.g. Manages marketing assets and vendor coordination."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-950 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-500 dark:text-slate-400 text-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                >
                  Cancel
                </button>
                {hasPermission("STAFF", "canCreate") && (
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Create Role
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
