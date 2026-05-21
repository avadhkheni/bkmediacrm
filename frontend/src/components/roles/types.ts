export interface Permission {
  id?: number;
  module: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface Role {
  name: string;
  description: string | null;
  permissions: Permission[];
  _count?: {
    users: number;
  };
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  staffId: number | null;
  lastLogin?: string;
  staff?: {
    name: string;
    department: string;
    phone: string;
  };
}

export const MODULES = [
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

export const formatModuleName = (name: string) => {
  if (name === "TO_DO_CHECKLISTS") return "To-Do & Checklists";
  if (name === "PROFIT_REPORTS") return "Profit Reports";
  if (name === "WORK_TEAMS") return "Work Teams";
  return name.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};
