"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { usePermission, PermissionModule } from "@/lib/usePermission";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";

const pathPermissionMap: Record<string, PermissionModule> = {
  "/dashboard/inquiries": "INQUIRIES",
  "/dashboard/clients": "CLIENTS",
  "/dashboard/availability": "AVAILABILITY",
  "/dashboard/teams": "WORK_TEAMS",
  "/dashboard/warehouse": "WAREHOUSE",
  "/dashboard/vendors": "WAREHOUSE",
  "/dashboard/vehicles": "WAREHOUSE",
  "/dashboard/invoices": "FINANCE",
  "/dashboard/reports": "FINANCE",
  "/dashboard/staff": "STAFF",
  "/dashboard/roles": "STAFF",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const { hasPermission } = usePermission();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated) return null; // Prevent flash of unauthorized content

  // Path authorization verification
  const matchedPathKey = Object.keys(pathPermissionMap).find(key => 
    pathname === key || pathname.startsWith(`${key}/`)
  );
  
  const hasAccess = matchedPathKey 
    ? hasPermission(pathPermissionMap[matchedPathKey], "canRead") 
    : true;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-slate-900 transition-colors">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-end px-8 shadow-sm transition-colors">
          <div className="flex items-center gap-4">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 flex flex-col">
          {hasAccess ? (
            children
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="max-w-md w-full text-center p-8 rounded-3xl border border-red-100 dark:border-red-950/30 bg-white/80 dark:bg-slate-950/80 shadow-2xl backdrop-blur-xl animate-fade-in transition-all">
                <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-500 dark:text-red-400 mx-auto mb-6 shadow-lg shadow-red-500/10">
                  <Lock className="w-8 h-8" />
                </div>
                
                <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white mb-2">
                  Access Restricted
                </h1>
                
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  Your system access role (<span className="font-semibold text-slate-700 dark:text-slate-350">{user?.role?.replace('_', ' ')}</span>) does not have dynamic privileges to view or read the <span className="font-semibold text-slate-700 dark:text-slate-350">{matchedPathKey ? pathPermissionMap[matchedPathKey].replace('_', ' ').toLowerCase() : 'requested'}</span> module.
                </p>

                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-950/20 text-[12px] text-amber-600 dark:text-amber-400 font-medium mb-8 leading-normal text-left flex gap-3">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500" />
                  <span>If you require access to this department, please request your platform administrator to adjust your credentials in the <strong>Users & Roles</strong> matrix.</span>
                </div>

                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-98 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Dashboard</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

