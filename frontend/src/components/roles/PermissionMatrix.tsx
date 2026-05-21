import { useState, useEffect, useMemo } from "react";
import { ShieldAlert, Save, Undo2, Key, CheckSquare, Square, Trash2 } from "lucide-react";
import { Role, Permission, MODULES, formatModuleName } from "./types";
import { usePermission } from "@/lib/usePermission";

interface PermissionMatrixProps {
  role: Role | null;
  onSave: (roleName: string, permissions: Permission[]) => Promise<void>;
  onDelete?: (roleName: string) => Promise<void>;
  saving: boolean;
}

export function PermissionMatrix({ role, onSave, onDelete, saving }: PermissionMatrixProps) {
  const { hasPermission } = usePermission();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize permissions when role changes
  useEffect(() => {
    if (role) {
      const initialPerms = MODULES.map(mod => {
        const existing = role.permissions.find(p => p.module === mod);
        return {
          module: mod,
          canCreate: existing ? existing.canCreate : false,
          canRead: existing ? existing.canRead : false,
          canUpdate: existing ? existing.canUpdate : false,
          canDelete: existing ? existing.canDelete : false,
        };
      });
      setPermissions(initialPerms);
      setIsDirty(false);
    } else {
      setPermissions([]);
      setIsDirty(false);
    }
  }, [role]);

  const isAdmin = role?.name === "ADMIN";
  const canUpdateStaff = hasPermission("STAFF", "canUpdate");
  const canDeleteStaff = hasPermission("STAFF", "canDelete");

  const handleToggle = (moduleName: string, action: keyof Omit<Permission, "id" | "module">) => {
    if (isAdmin) return;

    setPermissions(prev => {
      const next = [...prev];
      const idx = next.findIndex(p => p.module === moduleName);
      if (idx > -1) {
        const p = { ...next[idx] };
        p[action] = !p[action];

        // Dependency Logic: If setting Create/Update/Delete to TRUE, Read MUST be TRUE
        if ((action === "canCreate" || action === "canUpdate" || action === "canDelete") && p[action]) {
          p.canRead = true;
        }

        // Dependency Logic: If setting Read to FALSE, Create/Update/Delete MUST be FALSE
        if (action === "canRead" && !p[action]) {
          p.canCreate = false;
          p.canUpdate = false;
          p.canDelete = false;
        }

        next[idx] = p;
      }
      setIsDirty(true);
      return next;
    });
  };

  const handleRowToggle = (moduleName: string, enable: boolean) => {
    if (isAdmin) return;
    setPermissions(prev => {
      const next = [...prev];
      const idx = next.findIndex(p => p.module === moduleName);
      if (idx > -1) {
        next[idx] = {
          ...next[idx],
          canRead: enable,
          canCreate: enable,
          canUpdate: enable,
          canDelete: enable
        };
      }
      setIsDirty(true);
      return next;
    });
  };

  const handleColumnToggle = (action: keyof Omit<Permission, "id" | "module">, enable: boolean) => {
    if (isAdmin) return;
    setPermissions(prev => {
      const next = prev.map(p => {
        const np = { ...p, [action]: enable };
        if (enable && action !== "canRead") np.canRead = true;
        if (!enable && action === "canRead") {
          np.canCreate = false;
          np.canUpdate = false;
          np.canDelete = false;
        }
        return np;
      });
      setIsDirty(true);
      return next;
    });
  };

  const handleGlobalToggle = (enable: boolean) => {
    if (isAdmin) return;
    setPermissions(prev => {
      const next = prev.map(p => ({
        ...p,
        canRead: enable,
        canCreate: enable,
        canUpdate: enable,
        canDelete: enable
      }));
      setIsDirty(true);
      return next;
    });
  };

  const handleUndo = () => {
    if (role) {
      const initialPerms = MODULES.map(mod => {
        const existing = role.permissions.find(p => p.module === mod);
        return {
          module: mod,
          canCreate: existing ? existing.canCreate : false,
          canRead: existing ? existing.canRead : false,
          canUpdate: existing ? existing.canUpdate : false,
          canDelete: existing ? existing.canDelete : false,
        };
      });
      setPermissions(initialPerms);
      setIsDirty(false);
    }
  };

  // Calculate global checked states (must be before any early returns)
  const allGlobalChecked = useMemo(() => permissions.every(p => p.canRead && p.canCreate && p.canUpdate && p.canDelete), [permissions]);
  const someGlobalChecked = useMemo(() => permissions.some(p => p.canRead || p.canCreate || p.canUpdate || p.canDelete), [permissions]);

  const colChecked = useMemo(() => {
    const calc = (action: keyof Omit<Permission, "id" | "module">) => ({
      all: permissions.every(p => p[action]),
      some: permissions.some(p => p[action])
    });
    return {
      canRead: calc("canRead"),
      canCreate: calc("canCreate"),
      canUpdate: calc("canUpdate"),
      canDelete: calc("canDelete"),
    };
  }, [permissions]);

  if (!role) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[400px]">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700">
          <Key className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">No Role Selected</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
          Select a role from the left panel to view and configure its system permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-wide uppercase">
              {role.name} Permissions
            </h3>
            {isAdmin && (
              <span className="text-[10px] font-black tracking-widest px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase flex items-center gap-1">
                <Key className="w-3 h-3" /> System Immutable
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            {role.description || "Manage access levels across all CRM modules for this role."}
          </p>
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-2">
            {isDirty && (
              <button
                onClick={handleUndo}
                disabled={saving}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent disabled:opacity-50"
                title="Discard Changes"
              >
                <Undo2 className="w-5 h-5" />
              </button>
            )}
            
            {onDelete && canDeleteStaff && (
              <button
                onClick={() => onDelete(role.name)}
                disabled={saving}
                className="text-red-500 hover:text-red-700 dark:text-red-400 p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent transition-all disabled:opacity-50"
                title="Delete Role"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            {canUpdateStaff && (
              <button
                onClick={() => onSave(role.name, permissions).then(() => setIsDirty(false))}
                disabled={saving || !isDirty}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-sm disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Matrix"}
              </button>
            )}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="mx-6 mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-900/30 flex gap-3 text-amber-800 dark:text-amber-300">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">
            <strong>Administrator Privileges:</strong> The system administrator role has full absolute access. These permissions are hardcoded and cannot be modified to prevent accidental system lockout.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="p-6 overflow-x-auto flex-1">
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 w-1/3">
                  <div className="flex items-center gap-2">
                    {!isAdmin && (
                      <button
                        onClick={() => handleGlobalToggle(!allGlobalChecked)}
                        className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none"
                        title={allGlobalChecked ? "Deselect All" : "Select All"}
                      >
                        {allGlobalChecked ? <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-500" /> : someGlobalChecked ? <CheckSquare className="w-4 h-4 text-blue-400 opacity-60" /> : <Square className="w-4 h-4" />}
                      </button>
                    )}
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Module / System</span>
                  </div>
                </th>
                
                {([
                  { key: "canRead", label: "Read" },
                  { key: "canCreate", label: "Create" },
                  { key: "canUpdate", label: "Update" },
                  { key: "canDelete", label: "Delete" }
                ] as const).map(({ key, label }) => (
                  <th key={key} className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 flex-col">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>
                      {!isAdmin && (
                        <button
                          onClick={() => handleColumnToggle(key, !colChecked[key].all)}
                          className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none mt-1"
                        >
                          {colChecked[key].all ? <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" /> : colChecked[key].some ? <CheckSquare className="w-3.5 h-3.5 text-blue-400 opacity-60" /> : <Square className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
              {permissions.map((perm) => {
                const allRow = perm.canRead && perm.canCreate && perm.canUpdate && perm.canDelete;
                const someRow = perm.canRead || perm.canCreate || perm.canUpdate || perm.canDelete;
                
                return (
                  <tr key={perm.module} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {!isAdmin && (
                          <button
                            onClick={() => handleRowToggle(perm.module, !allRow)}
                            className="text-slate-300 dark:text-slate-600 hover:text-blue-500 transition-colors focus:outline-none opacity-0 group-hover:opacity-100"
                          >
                            {allRow ? <CheckSquare className="w-4 h-4 text-blue-500" /> : someRow ? <CheckSquare className="w-4 h-4 text-blue-400 opacity-60" /> : <Square className="w-4 h-4" />}
                          </button>
                        )}
                        <span className={`font-bold text-sm ${someRow ? "text-slate-800 dark:text-slate-200" : "text-slate-500 dark:text-slate-500"}`}>
                          {formatModuleName(perm.module)}
                        </span>
                      </div>
                    </td>
                    
                    {([
                      { key: "canRead", color: "blue" },
                      { key: "canCreate", color: "emerald" },
                      { key: "canUpdate", color: "amber" },
                      { key: "canDelete", color: "red" }
                    ] as const).map(({ key, color }) => (
                      <td key={key} className="p-4 text-center border-l border-slate-50 dark:border-slate-800/50">
                        <label className="flex items-center justify-center w-full h-full cursor-pointer group/chk">
                          <input
                            type="checkbox"
                            checked={perm[key as keyof typeof perm] as boolean}
                            disabled={isAdmin}
                            onChange={() => handleToggle(perm.module, key)}
                            className={`
                              w-5 h-5 rounded transition-all cursor-pointer
                              border-slate-300 dark:border-slate-600
                              ${isAdmin ? "opacity-40 cursor-not-allowed" : `hover:border-${color}-400 focus:ring-${color}-500/20`}
                              ${perm[key as keyof typeof perm] ? `text-${color}-500` : "bg-transparent"}
                            `}
                            // Note: Tailwind dynamic classes might not compile if not safelisted.
                            // We will use standard blue for the checkbox text color and rely on focus rings.
                            style={perm[key as keyof typeof perm] ? { color: color === 'emerald' ? '#10b981' : color === 'amber' ? '#f59e0b' : color === 'red' ? '#ef4444' : '#3b82f6' } : {}}
                          />
                        </label>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
