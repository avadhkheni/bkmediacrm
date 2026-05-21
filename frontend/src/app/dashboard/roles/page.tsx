"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useUIStore } from "@/store/uiStore";
import { Shield, Settings, Users } from "lucide-react";
import { usePermission } from "@/lib/usePermission";
import { useAuthStore } from "@/store/authStore";

// Components
import { RoleList } from "@/components/roles/RoleList";
import { PermissionMatrix } from "@/components/roles/PermissionMatrix";
import { CreateUserForm } from "@/components/roles/CreateUserForm";
import { UserAccountsTable } from "@/components/roles/UserAccountsTable";
import { CreateRoleModal } from "@/components/roles/CreateRoleModal";
import { Role, Permission, User } from "@/components/roles/types";

export default function RolesPage() {
  const { addToast } = useUIStore();
  const { hasPermission } = usePermission();
  
  // Data States
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  
  // Loading States
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [creatingRole, setCreatingRole] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  
  // Selection States
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState<'permissions' | 'users'>('permissions');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
      setLoadingRoles(true);
      const res = await api.get("/roles");
      const fetchedRoles = res.data || [];
      setRoles(fetchedRoles);
      
      // Auto-select first role or preserve selection
      if (fetchedRoles.length > 0) {
        if (selectedRole) {
          const updatedSelected = fetchedRoles.find((r: Role) => r.name === selectedRole.name);
          setSelectedRole(updatedSelected || fetchedRoles[0]);
        } else {
          setSelectedRole(fetchedRoles[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load roles", error);
      addToast("Failed to load roles matrix", "error");
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleSavePermissions = async (roleName: string, permissions: Permission[]) => {
    setSavingPermissions(true);
    try {
      const roleToUpdate = roles.find(r => r.name === roleName);
      if (!roleToUpdate) throw new Error("Role not found");

      const response = await api.put(`/roles/${roleName}`, {
        description: roleToUpdate.description,
        permissions: permissions
      });

      const meta = response.data._meta;
      if (meta && meta.affectedUsersCount > 0) {
        addToast(meta.message, "success");
      } else {
        addToast(`Permissions for ${roleName} updated successfully!`, "success");
      }
      
      await fetchRoles();

      // Refresh current user permissions if editing own role
      const currentUser = useAuthStore.getState().user;
      if (currentUser && currentUser.role === roleName) {
        try {
          const freshUser = await api.get('/auth/me');
          useAuthStore.getState().setUser(freshUser.data);
          addToast("Your permissions have been refreshed automatically.", "info");
        } catch {
          // silent fail
        }
      }
    } catch (error) {
      console.error("Failed to update permissions", error);
      addToast("Failed to update role permissions", "error");
      throw error;
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleCreateRole = async (name: string, description: string) => {
    setCreatingRole(true);
    try {
      const res = await api.post("/roles", {
        name,
        description,
        permissions: [] // Default permissions can be set in backend or initialized here
      });
      addToast(`Role "${name}" created successfully!`, "success");
      setIsCreateModalOpen(false);
      setSelectedRole(res.data);
      await fetchRoles();
    } catch (error: any) {
      console.error("Failed to create role", error);
      addToast(error.response?.data?.message || "Failed to create new role", "error");
      throw error;
    } finally {
      setCreatingRole(false);
    }
  };

  const handleDeleteRole = async (roleName: string) => {
    try {
      await api.delete(`/roles/${roleName}`);
      addToast(`Role "${roleName}" deleted successfully!`, "success");
      setSelectedRole(null);
      await fetchRoles();
    } catch (error: any) {
      console.error("Failed to delete role", error);
      addToast(error.response?.data?.message || "Failed to delete role", "error");
    }
  };

  const handleCreateUser = async (data: any) => {
    setCreatingUser(true);
    try {
      await api.post("/roles/users", data);
      addToast("User login account created successfully!", "success");
      await fetchUsers();
      await fetchRoles();
    } catch (error: any) {
      console.error("Failed to create user", error);
      const errMsg = error.response?.data?.message || "Failed to create user account";
      addToast(errMsg, "error");
      throw error;
    } finally {
      setCreatingUser(false);
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      // Optimistic update
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
      await api.put(`/roles/users/${userId}/status`, { isActive: !currentStatus });
      addToast("User account status updated successfully!", "success");
    } catch (error: any) {
      // Revert on error
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: currentStatus } : u));
      console.error("Failed to toggle status", error);
      addToast(error.response?.data?.message || "Failed to toggle status", "error");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await api.delete(`/roles/users/${userId}`);
      addToast("User login account deleted successfully!", "success");
      await fetchUsers();
      await fetchRoles();
    } catch (error: any) {
      console.error("Failed to delete user", error);
      addToast(error.response?.data?.message || "Failed to delete user account", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            Users & Roles Matrix
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Configure system access privileges, security policies, and user accounts.
          </p>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/50 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center gap-2 ${
            activeTab === 'permissions'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Settings className="w-4 h-4" />
          Role Permissions Matrix
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Users className="w-4 h-4" />
          Login User Accounts
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'permissions' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-3 h-full">
            <RoleList 
              roles={roles} 
              selectedRole={selectedRole} 
              onSelectRole={setSelectedRole} 
              onCreateClick={() => setIsCreateModalOpen(true)}
              loading={loadingRoles}
            />
          </div>
          <div className="xl:col-span-9 h-full">
            <PermissionMatrix 
              role={selectedRole} 
              onSave={handleSavePermissions}
              onDelete={handleDeleteRole}
              saving={savingPermissions}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-3 h-full">
            <CreateUserForm 
              roles={roles}
              staffList={staffList}
              users={users}
              onSubmit={handleCreateUser}
              creating={creatingUser}
            />
          </div>
          <div className="xl:col-span-9 h-full">
            <UserAccountsTable 
              users={users}
              loading={loadingUsers}
              onToggleStatus={handleToggleUserStatus}
              onDeleteUser={handleDeleteUser}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateRoleModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSubmit={handleCreateRole}
        creating={creatingRole}
      />
    </div>
  );
}
