"use client";

import { useAuthStore } from "@/store/authStore";

export type PermissionModule = 
  | "DASHBOARD"
  | "INQUIRIES"
  | "CLIENTS"
  | "AVAILABILITY"
  | "WORK_TEAMS"
  | "WAREHOUSE"
  | "STAFF"
  | "FINANCE";

export type PermissionAction = "canCreate" | "canRead" | "canUpdate" | "canDelete";

export const usePermission = () => {
  const { user } = useAuthStore();

  const hasPermission = (moduleName: PermissionModule, action: PermissionAction): boolean => {
    if (!user) return false;
    
    // 1. ADMIN bypasses all permission constraints
    if (user.role === "ADMIN") return true;

    // 2. Safely look up dynamic DB permissions
    const permissions = user.roleData?.permissions || [];
    const perm = permissions.find(p => p.module === moduleName);

    // If no permission record is created yet in DB, default to false for security (except canRead which defaults to true in Prisma model definition)
    if (!perm) {
      return action === "canRead";
    }

    return !!perm[action];
  };

  return { hasPermission };
};
