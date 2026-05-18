"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { usePermission } from "@/lib/usePermission";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Users,
  UserCog,
  IndianRupee,
  FilePlus,
  UserPlus,
  BarChart3,
  UsersRound,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { hasPermission } = usePermission();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get("/dashboard/stats");
        setStats(data);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const cards = [
    { title: "Total Inquiries", value: stats?.totalInquiries ?? 0, icon: ClipboardList, color: "blue", href: "/dashboard/inquiries" },
    { title: "Confirmed Events", value: stats?.confirmedInquiries ?? 0, icon: CheckCircle2, color: "green", href: "/dashboard/inquiries?status=CONFIRMED" },
    { title: "Pending Inquiries", value: stats?.pendingInquiries ?? 0, icon: Clock, color: "orange", href: "/dashboard/inquiries?status=INQUIRY" },
    { title: "Total Clients", value: stats?.totalClients ?? 0, icon: Users, color: "purple", href: "/dashboard/clients" },
    { title: "Active Staff", value: stats?.totalStaff ?? 0, icon: UserCog, color: "indigo", href: "/dashboard/staff" },
    { title: "This Month Revenue", value: `₹${(stats?.monthRevenue ?? 0).toLocaleString()}`, icon: IndianRupee, color: "emerald", href: "/dashboard/reports" },
  ];

  const colorMap: Record<string, { bg: string, icon: string, text: string }> = {
    blue:    { bg: "bg-blue-50 dark:bg-blue-900/20",    icon: "text-blue-600 dark:text-blue-400",    text: "text-blue-600 dark:text-blue-400" },
    green:   { bg: "bg-green-50 dark:bg-green-900/20",   icon: "text-green-600 dark:text-green-400",   text: "text-green-600 dark:text-green-400" },
    orange:  { bg: "bg-orange-50 dark:bg-orange-900/20",  icon: "text-orange-600 dark:text-orange-400",  text: "text-orange-600 dark:text-orange-400" },
    purple:  { bg: "bg-purple-50 dark:bg-purple-900/20",  icon: "text-purple-600 dark:text-purple-400",  text: "text-purple-600 dark:text-purple-400" },
    indigo:  { bg: "bg-indigo-50 dark:bg-indigo-900/20",  icon: "text-indigo-600 dark:text-indigo-400",  text: "text-indigo-600 dark:text-indigo-400" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: "text-emerald-600 dark:text-emerald-400", text: "text-emerald-600 dark:text-emerald-400" },
  };

  const quickActions = [
    { label: "New Inquiry", href: "/dashboard/inquiries", icon: FilePlus },
    { label: "Add Client", href: "/dashboard/clients", icon: UserPlus },
    { label: "View Reports", href: "/dashboard/reports", icon: BarChart3 },
    { label: "Manage Staff", href: "/dashboard/staff", icon: UsersRound },
  ];

  // Dynamic filter for stats cards
  const filteredCards = cards.filter(card => {
    if (card.title.includes("Inquiries") || card.title.includes("Events")) {
      return hasPermission("INQUIRIES", "canRead");
    }
    if (card.title.includes("Clients")) {
      return hasPermission("CLIENTS", "canRead");
    }
    if (card.title.includes("Staff")) {
      return hasPermission("STAFF", "canRead");
    }
    if (card.title.includes("Revenue")) {
      return hasPermission("FINANCE", "canRead");
    }
    return true;
  });

  // Dynamic filter for quick action options
  const filteredQuickActions = quickActions.filter(action => {
    if (action.label === "New Inquiry") {
      return hasPermission("INQUIRIES", "canCreate") && hasPermission("INQUIRIES", "canRead");
    }
    if (action.label === "Add Client") {
      return hasPermission("CLIENTS", "canCreate") && hasPermission("CLIENTS", "canRead");
    }
    if (action.label === "View Reports") {
      return hasPermission("FINANCE", "canRead");
    }
    if (action.label === "Manage Staff") {
      return hasPermission("STAFF", "canRead");
    }
    return true;
  });

  const showRecentInquiries = hasPermission("INQUIRIES", "canRead");

  return (
    <div className="w-full space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Welcome back. Here&apos;s your business overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCards.map((card) => {
          const colors = colorMap[card.color];
          const IconComponent = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all group block"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${colors.bg} ${colors.icon} group-hover:scale-110 transition-transform`}>
                  <IconComponent className="w-6 h-6" strokeWidth={1.75} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Inquiries */}
        {showRecentInquiries && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Inquiries</h3>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-slate-700">
              {stats?.recentInquiries?.length > 0 ? (
                stats.recentInquiries.slice(0, 5).map((inq: any) => (
                  <Link 
                    key={inq.id} 
                    href={`/dashboard/inquiries/details?id=${inq.id}`}
                    className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors block"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{inq.eventName}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{inq.client?.name || 'N/A'} • {inq.department}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                      inq.status === 'CONFIRMED' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                      inq.status === 'REJECTED' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                      'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    }`}>
                      {inq.status}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-sm text-gray-400 dark:text-slate-500">No recent inquiries</div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 ${!showRecentInquiries ? "lg:col-span-2 animate-fade-in" : ""}`}>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            {filteredQuickActions.map(action => {
              const IconComponent = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-100 dark:border-slate-600 hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
                >
                  <span className="mb-2 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:scale-110 transition-all">
                    <IconComponent className="w-6 h-6" strokeWidth={1.75} />
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

