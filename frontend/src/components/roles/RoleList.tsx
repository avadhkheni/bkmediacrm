import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Shield, ShieldCheck, Users } from "lucide-react";
import { Role } from "./types";
import { usePermission } from "@/lib/usePermission";

interface RoleListProps {
  roles: Role[];
  selectedRole: Role | null;
  onSelectRole: (role: Role) => void;
  onCreateClick: () => void;
  loading: boolean;
}

export function RoleList({ roles, selectedRole, onSelectRole, onCreateClick, loading }: RoleListProps) {
  const { hasPermission } = usePermission();
  const [search, setSearch] = useState("");

  const filteredRoles = roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-full sticky top-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-500" />
          System Roles
        </h3>
        {hasPermission("STAFF", "canCreate") && (
          <button
            onClick={onCreateClick}
            className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg shadow-sm transition-all"
            title="Create Custom Role"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search roles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
        />
      </div>

      <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar pr-1 min-h-[300px] max-h-[600px]">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-full h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))
        ) : filteredRoles.length > 0 ? (
          <AnimatePresence>
            {filteredRoles.map((role) => {
              const isActive = selectedRole?.name === role.name;
              return (
                <motion.button
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={role.name}
                  onClick={() => onSelectRole(role)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 relative overflow-hidden group ${
                    isActive
                      ? "bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm"
                      : "bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeRoleIndicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-500"
                    />
                  )}
                  <div className="flex justify-between items-start gap-2">
                    <span className={`font-bold text-sm tracking-wide flex items-center gap-1.5 ${isActive ? "text-blue-900 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}`}>
                      {role.name === "ADMIN" ? <ShieldCheck className="w-4 h-4 text-amber-500" /> : null}
                      {role.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                      <Users className="w-3 h-3" />
                      {role._count?.users || 0}
                    </span>
                  </div>
                  <p className="text-xs mt-1.5 text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {role.description || "No description provided for this role."}
                  </p>
                </motion.button>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="text-center py-10 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">No roles found matching "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
