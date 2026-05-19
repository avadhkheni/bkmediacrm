import { Invoice, Quotation } from '@prisma/client';

export type QuotationWithInvoice = Quotation & { invoice?: Invoice | null };

export function isQuotationLocked(quotation: QuotationWithInvoice): boolean {
  return quotation.invoice?.status === 'PAID';
}

export const QUOTATION_LOCKED_MESSAGE =
  'This quotation is locked because the linked invoice is fully paid. You can view and download it only.';
