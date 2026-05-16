/**
 * GST Calculation Service
 * Intra-state Gujarat: CGST 9% + SGST 9% (not IGST)
 */

export function calculateGst(subtotal: number) {
  const cgst = parseFloat((subtotal * 0.09).toFixed(2));
  const sgst = parseFloat((subtotal * 0.09).toFixed(2));
  const total = parseFloat((subtotal + cgst + sgst).toFixed(2));
  return { cgst, sgst, total };
}
