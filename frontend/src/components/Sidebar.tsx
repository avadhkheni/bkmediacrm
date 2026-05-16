"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  LayoutGrid,
  ClipboardList,
  Users,
  CalendarCheck,
  Video,
  Monitor,
  UserCog,
  FileText,
  Settings,
  LogOut,
  Warehouse,
  Boxes,
  ArrowRightLeft,
  ClipboardCheck,
  ClipboardX,
  BarChart3,
  Truck
} from "lucide-react";

const navItems = [
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    exact: true,
    icon: LayoutGrid,
  },
  { 
    name: "Inquiries", 
    href: "/dashboard/inquiries",
    icon: ClipboardList,
  },
  { 
    name: "Clients", 
    href: "/dashboard/clients",
    icon: Users,
  },
  { 
    name: "Availability", 
    href: "/dashboard/availability",
    icon: CalendarCheck,
  },
  { 
    name: "Video Dept", 
    href: "/dashboard/video",
    icon: Video,
  },
  { 
    name: "LED Dept", 
    href: "/dashboard/led",
    icon: Monitor,
  },
  { 
    name: "Warehouse", 
    href: "/dashboard/warehouse",
    exact: true,
    icon: Warehouse,
    section: "Inventory"
  },
  { 
    name: "Equipment Stock", 
    href: "/dashboard/warehouse/inventory",
    icon: Boxes,
    section: "Inventory"
  },
/*
  { 
    name: "Stock Movements", 
    href: "/dashboard/warehouse/movements",
    icon: ArrowRightLeft,
    section: "Inventory"
  },
*/
  { 
    name: "Checklists", 
    href: "/dashboard/warehouse/checklists",
    icon: ClipboardCheck,
    section: "Inventory"
  },
  { 
    name: "Staff", 
    href: "/dashboard/staff",
    icon: UserCog,
  },
  { 
    name: "Invoices", 
    href: "/dashboard/invoices",
    icon: FileText,
  },
  { 
    name: "Reports", 
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  { 
    name: "Fleet Management", 
    href: "/dashboard/settings?tab=vehicles",
    icon: Truck,
    section: "Logistics"
  },
  { 
    name: "Settings", 
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <div className="w-64 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-r border-gray-200 dark:border-slate-800 h-full flex flex-col transition-colors">
      <div className="p-6">
        <h2 className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">BK Media</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">CRM System</p>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 mt-2">
        {navItems.map((item, index) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          
          const IconComponent = item.icon;
          const showSection = item.section && (index === 0 || navItems[index - 1].section !== item.section);
            
          return (
            <div key={item.name}>
              {showSection && (
                <div className="px-3 pt-4 pb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.section}</p>
                </div>
              )}
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-600/10 text-blue-700 dark:text-blue-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span className={`${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"} transition-colors`}>
                  <IconComponent className="w-5 h-5" strokeWidth={1.75} />
                </span>
                <span className="text-sm">{item.name}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 flex items-center justify-center text-sm font-bold border border-blue-200 dark:border-blue-800/50">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name || "User"}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-transparent hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent dark:border-red-900/30"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.75} />
          Logout
        </button>
      </div>
    </div>
  );
}
