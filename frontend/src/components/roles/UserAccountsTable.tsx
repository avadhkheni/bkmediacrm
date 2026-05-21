import { useState } from "react";
import { Search, Shield, Trash2, ToggleRight, ToggleLeft, Users, Filter } from "lucide-react";
import { User } from "./types";
import { usePermission } from "@/lib/usePermission";

interface UserAccountsTableProps {
  users: User[];
  loading: boolean;
  onToggleStatus: (userId: number, currentStatus: boolean) => Promise<void>;
  onDeleteUser: (userId: number) => Promise<void>;
}

export function UserAccountsTable({ users, loading, onToggleStatus, onDeleteUser }: UserAccountsTableProps) {
  const { hasPermission } = usePermission();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const filteredUsers = users.filter(user => {
    if (user.deletedAt) return false;

    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) || 
                          user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const uniqueRoles = Array.from(new Set(users.map(u => u.role)));

  const getRoleColor = (role: string) => {
    if (role === "ADMIN") return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    if (role === "FINANCE" || role === "ACCOUNTS") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    if (role === "VIDEO_DEPT" || role === "LED_DEPT") return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Authorized User Accounts
            <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full ml-1">
              {users.length}
            </span>
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage system access, roles, and login statuses for your staff.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer min-w-[120px]"
            >
              <option value="ALL">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar relative">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-full h-16 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700">
              <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No users found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              {search || roleFilter !== "ALL" 
                ? "Try adjusting your search or role filter to find what you're looking for." 
                : "No user login accounts configured. Link a staff member to set active access."}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm z-10 shadow-sm border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">User Details</th>
                <th className="p-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">System Role</th>
                <th className="p-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Linked Profile</th>
                <th className="p-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">Login Access</th>
                <th className="p-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
              {filteredUsers.map((userItem) => (
                <tr key={userItem.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm uppercase">
                        {userItem.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-white">{userItem.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{userItem.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-widest border ${getRoleColor(userItem.role)}`}>
                      <Shield className="w-3.5 h-3.5" />
                      {userItem.role}
                    </span>
                  </td>

                  <td className="p-4">
                    {userItem.staff ? (
                      <div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{userItem.staff.name}</span>
                        <span className="text-[10px] block text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider mt-0.5">
                          {userItem.staff.department || "General Team"} • {userItem.staff.phone}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 font-semibold text-xs bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                        Independent User
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-center">
                    {hasPermission("STAFF", "canUpdate") ? (
                      <button
                        onClick={() => onToggleStatus(userItem.id, userItem.isActive)}
                        disabled={userItem.role === 'ADMIN'}
                        className={`p-1.5 rounded-xl transition-all inline-flex ${
                          userItem.role === 'ADMIN'
                            ? 'opacity-40 cursor-not-allowed text-emerald-500'
                            : userItem.isActive 
                            ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' 
                            : 'text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800'
                        }`}
                        title={userItem.isActive ? "Deactivate Account" : "Activate Account"}
                      >
                        {userItem.isActive ? (
                          <ToggleRight className="w-7 h-7" />
                        ) : (
                          <ToggleLeft className="w-7 h-7" />
                        )}
                      </button>
                    ) : (
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        userItem.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {userItem.isActive ? "Active" : "Inactive"}
                      </div>
                    )}
                  </td>

                  <td className="p-4 text-center">
                    {hasPermission("STAFF", "canDelete") && (
                      <button
                        onClick={() => onDeleteUser(userItem.id)}
                        disabled={userItem.role === 'ADMIN'}
                        className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/30 disabled:opacity-30 disabled:cursor-not-allowed inline-flex"
                        title="Delete User Account"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
