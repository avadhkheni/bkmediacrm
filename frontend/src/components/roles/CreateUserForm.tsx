import { useState, useMemo, useEffect } from "react";
import { UserPlus, User, Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { Role } from "./types";
import { usePermission } from "@/lib/usePermission";

interface CreateUserFormProps {
  roles: Role[];
  staffList: any[];
  users: any[];
  onSubmit: (data: any) => Promise<void>;
  creating: boolean;
}

export function CreateUserForm({ roles, staffList, users, onSubmit, creating }: CreateUserFormProps) {
  const { hasPermission } = usePermission();
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Password strength calculation
  const strength = useMemo(() => {
    let score = 0;
    if (!userPassword) return score;
    if (userPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(userPassword)) score += 1;
    if (/[0-9]/.test(userPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(userPassword)) score += 1;
    return score;
  }, [userPassword]);

  const strengthColor = 
    strength === 0 ? "bg-slate-200 dark:bg-slate-700" :
    strength === 1 ? "bg-red-500" :
    strength === 2 ? "bg-amber-500" :
    strength === 3 ? "bg-emerald-400" :
    "bg-emerald-600";

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
      
      const matchedRole = roles.find(r => r.name.toUpperCase() === staff.role.toUpperCase());
      if (matchedRole) {
        setUserRole(matchedRole.name);
      } else {
        // Only auto-fill if the target role actually exists in the DB
        const normalized = staff.role.toUpperCase();
        let targetRole = "";
        
        if (normalized.includes("LED")) targetRole = "LED_DEPT";
        else if (normalized.includes("VIDEO")) targetRole = "VIDEO_DEPT";
        else if (normalized.includes("ADMIN")) targetRole = "ADMIN";
        else if (normalized.includes("FINANCE") || normalized.includes("ACCOUNT")) targetRole = "FINANCE";
        
        const exists = roles.some(r => r.name === targetRole);
        setUserRole(exists ? targetRole : "");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name: userName,
      email: userEmail,
      password: userPassword,
      role: userRole,
      staffId: selectedStaffId ? Number(selectedStaffId) : undefined
    });
    // On success, reset form
    setSelectedStaffId("");
    setUserName("");
    setUserEmail("");
    setUserPassword("");
    setUserRole("");
  };

  if (!hasPermission("STAFF", "canCreate")) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm text-center">
        <Shield className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-500">Access Restricted</h3>
        <p className="text-xs text-slate-400 mt-1">You don't have permission to create user accounts.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5 sticky top-6">
      <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
          <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        Create Login Account
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Link Staff Profile */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Link Staff Profile (Optional)
          </label>
          <select
            value={selectedStaffId}
            onChange={(e) => handleStaffSelect(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          >
            <option value="">-- Independent User (No Staff Link) --</option>
            {staffList.map((staff) => {
              const alreadyHasAccount = users.some(u => u.staffId === staff.id);
              return (
                <option key={staff.id} value={staff.id} disabled={alreadyHasAccount}>
                  {staff.name} ({staff.role}{alreadyHasAccount ? ' - Already Active' : ''})
                </option>
              );
            })}
          </select>
          <p className="text-[10px] text-slate-400 font-medium">
            Selecting a staff profile will pre-fill their name, email and matching role.
          </p>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Full Name *
          </label>
          <div className="relative group">
            <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              required
              placeholder="Enter full name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Email Address (Login ID) *
          </label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="email"
              required
              placeholder="name@bkmedia.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Login Password *
          </label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
          {/* Password Strength Meter */}
          {userPassword.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4].map((level) => (
                <div 
                  key={level} 
                  className={`h-1 w-full rounded-full transition-all duration-300 ${strength >= level ? strengthColor : "bg-slate-200 dark:bg-slate-700"}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Assigned Role */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Assign System Role *
          </label>
          <div className="relative group">
            <Shield className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <select
              required
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
            >
              <option value="" disabled>-- Choose Access Role --</option>
              {roles.map((r) => (
                <option key={r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={creating}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-bold py-3 px-4 rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm mt-4"
        >
          {creating ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          {creating ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </div>
  );
}
