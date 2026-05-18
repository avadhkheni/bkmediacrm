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
  LogOut,
  Warehouse,
  Boxes,
  ArrowRightLeft,
  ClipboardCheck,
  ClipboardX,
  BarChart3,
  Speaker,
  Briefcase,
  Home,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    exact: true,
    icon: LayoutGrid,
  },
  { 
    name: "Orders & Inquiries", 
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
    name: "Video Team", 
    href: "/dashboard/video",
    icon: Video,
    section: "Work Teams"
  },
  { 
    name: "LED Screen Team", 
    href: "/dashboard/led",
    icon: Monitor,
    section: "Work Teams"
  },
  { 
    name: "Sound/Audio Team", 
    href: "/dashboard/sound",
    icon: Speaker,
    section: "Work Teams"
  },
  { 
    name: "Office Team", 
    href: "/dashboard/office",
    icon: Briefcase,
    section: "Work Teams"
  },
  { 
    name: "Warehouse", 
    href: "/dashboard/warehouse",
    exact: true,
    icon: Home,
    section: "Inventory"
  },
  { 
    name: "Item Stock", 
    href: "/dashboard/warehouse/inventory",
    icon: Boxes,
    section: "Inventory"
  },
  { 
    name: "To-Do & Checklists", 
    href: "/dashboard/warehouse/checklists",
    icon: ClipboardCheck,
    section: "Inventory"
  },
  { 
    name: "Invoices & Bills", 
    href: "/dashboard/invoices",
    icon: FileText,
    section: "Bills & Money"
  },
  { 
    name: "Profit Reports", 
    href: "/dashboard/reports",
    icon: BarChart3,
    section: "Bills & Money"
  },
  { 
    name: "Staff List", 
    href: "/dashboard/staff",
    icon: UserCog,
    section: "Team"
  },
  { 
    name: "Suppliers (Rent)", 
    href: "/dashboard/vendors",
    icon: Briefcase,
    section: "Team"
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsCollapsed(true);
      else setIsCollapsed(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`relative ${isCollapsed ? "w-20" : "w-64"} bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-r border-gray-200 dark:border-slate-800 h-full flex flex-col transition-all duration-300 ease-in-out group`}>
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 z-50 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className={`p-6 ${isCollapsed ? "px-4 items-center" : ""} flex flex-col`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">BK Media</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {navItems.map((item, index) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          
          const IconComponent = item.icon;
          const showSection = !isCollapsed && item.section && (index === 0 || navItems[index - 1].section !== item.section);
            
          return (
            <div key={item.name}>
              {showSection && (
                <div className="px-3 pt-5 pb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.section}</p>
                </div>
              )}
              <Link
                href={item.href}
                title={isCollapsed ? item.name : ""}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span className={`${isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400"} transition-colors`}>
                  <IconComponent className="w-5 h-5" strokeWidth={2} />
                </span>
                {!isCollapsed && <span className="text-sm tracking-tight">{item.name}</span>}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className={`p-4 border-t border-gray-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 ${isCollapsed ? "items-center" : ""}`}>
        {!isCollapsed ? (
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-sm font-semibold shadow-lg shadow-blue-500/10">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name || "User"}</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-sm font-semibold shadow-lg mb-4 mx-auto">
            {user?.name?.charAt(0) || "U"}
          </div>
        )}
        
        <button
          onClick={logout}
          title="Logout"
          className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl transition-all border border-red-100 dark:border-red-900/20 ${isCollapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-4 h-4" strokeWidth={2.5} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
