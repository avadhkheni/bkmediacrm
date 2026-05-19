import { Request, Response } from 'express';
import {
  generateQuotationPdf,
  generateInvoicePdf,
  generateVideoRequirementsPdf,
  generateLedRequirementsPdf,
  generateLedClearSizePdf,
  generateDispatchPdf,
  generateExpenseReportPdf,
  generateVendorRentalsPdf,
  generateIndividualVendorRentalPdf,
} from '../services/pdf.service';

export const getQuotationPdf = async (req: Request, res: Response) => {
  try {
    const pdf = await generateQuotationPdf(Number(req.params.quotationId));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=quotation-${req.params.quotationId}.pdf`);
    res.send(pdf);
  } catch (error: any) {
    res.status(error.message === 'Quotation not found' ? 404 : 500).json({ message: error.message || 'Error generating PDF' });
  }
};

export const getInvoicePdf = async (req: Request, res: Response) => {
  try {
    const pdf = await generateInvoicePdf(Number(req.params.invoiceId));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=invoice-${req.params.invoiceId}.pdf`);
    res.send(pdf);
  } catch (error: any) {
    res.status(error.message === 'Invoice not found' ? 404 : 500).json({ message: error.message || 'Error generating PDF' });
  }
};

export const getVideoRequirementsPdf = async (req: Request, res: Response) => {
  try {
    const pdf = await generateVideoRequirementsPdf(Number(req.params.inquiryId));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=video-requirements-${req.params.inquiryId}.pdf`);
    res.send(pdf);
  } catch (error: any) {
    res.status(error.message === 'Inquiry not found' ? 404 : 500).json({ message: error.message || 'Error generating PDF' });
  }
};

export const getLedRequirementsPdf = async (req: Request, res: Response) => {
  try {
    const pdf = await generateLedRequirementsPdf(Number(req.params.inquiryId));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=led-requirements-${req.params.inquiryId}.pdf`);
    res.send(pdf);
  } catch (error: any) {
    res.status(error.message === 'Inquiry not found' ? 404 : 500).json({ message: error.message || 'Error generating PDF' });
  }
};

export const getLedClearSizePdf = async (req: Request, res: Response) => {
  try {
    const pdf = await generateLedClearSizePdf(Number(req.params.inquiryId));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=led-clear-size-${req.params.inquiryId}.pdf`);
    res.send(pdf);
  } catch (error: any) {
    res.status(error.message === 'Inquiry not found' ? 404 : 500).json({ message: error.message || 'Error generating PDF' });
  }
};

export const getDispatchPdf = async (req: Request, res: Response) => {
  try {
    const pdf = await generateDispatchPdf(Number(req.params.inquiryId));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=dispatch-${req.params.inquiryId}.pdf`);
    res.send(pdf);
  } catch (error: any) {
    res.status(error.message === 'Inquiry not found' ? 404 : 500).json({ message: error.message || 'Error generating PDF' });
  }
};

export const getExpenseReportPdf = async (req: Request, res: Response) => {
  try {
    const pdf = await generateExpenseReportPdf(Number(req.params.inquiryId));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=expense-report-${req.params.inquiryId}.pdf`);
    res.send(pdf);
  } catch (error: any) {
    res.status(error.message === 'Expense report not found' ? 404 : 500).json({ message: error.message || 'Error generating PDF' });
  }
};

export const getVendorRentalsPdf = async (req: Request, res: Response) => {
  try {
    const pdf = await generateVendorRentalsPdf();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=vendor-rentals-report.pdf');
    res.send(pdf);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error generating PDF' });
  }
};

export const getIndividualVendorRentalPdf = async (req: Request, res: Response) => {
  try {
    const { rentalId } = req.params;
    const pdf = await generateIndividualVendorRentalPdf(Number(rentalId));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=vendor-rental-challan-${rentalId}.pdf`);
    res.send(pdf);
  } catch (error: any) {
    res.status(error.message === 'Vendor rental record not found' ? 404 : 500).json({ message: error.message || 'Error generating PDF' });
  }
};
