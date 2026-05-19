/** Vendors can belong to multiple departments, stored as "LED,VIDEO,SOUND". */

export function vendorDepartments(vendor: { department?: string | null }): string[] {
  return (vendor.department || '')
    .split(',')
    .map((d) => d.trim().toUpperCase())
    .filter(Boolean);
}

export function vendorMatchesDepartment(
  vendor: { department?: string | null },
  department: string
): boolean {
  const dept = department.trim().toUpperCase();
  if (!dept) return true;
  const depts = vendorDepartments(vendor);
  if (depts.length === 0) return true;
  return depts.includes(dept);
}

export function filterVendorsByDepartment<T extends { department?: string | null }>(
  vendors: T[],
  department: string
): T[] {
  return vendors.filter((v) => vendorMatchesDepartment(v, department));
}
