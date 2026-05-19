export function isQuotationLocked(quotation: {
  invoice?: { status?: string } | null;
}): boolean {
  return quotation.invoice?.status === 'PAID';
}

export const QUOTATION_LOCKED_MESSAGE =
  'This quotation is locked because the linked invoice is fully paid. You can view and download it only.';
