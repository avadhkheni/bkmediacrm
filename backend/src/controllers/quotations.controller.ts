import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateQuotationNumber } from '../services/quotationNumber.service';
import { uploadToCloudinary } from '../utils/cloudinary';
import { calculateGst } from '../services/gst.service';
import { isQuotationLocked, QUOTATION_LOCKED_MESSAGE } from '../utils/quotationLock';
import { validateQuotationItemsStock } from '../utils/quotationStockValidation';
import { mergeQuotationNotes, itemTotalAmount } from '../utils/quotationSourcing';

export const deleteQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.quotation.findUnique({
      where: { id: Number(id) },
      include: { invoice: true }
    });
    if (!existing) return res.status(404).json({ message: 'Quotation not found' });

    if (isQuotationLocked(existing) || existing.status === 'APPROVED') {
      return res.status(403).json({ message: 'Cannot delete an approved or locked quotation' });
    }

    if (existing.invoice) {
      return res.status(403).json({ message: 'Cannot delete a quotation that has an invoice' });
    }

    await prisma.quotation.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() }
    });

    res.json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    res.status(500).json({ message: 'Error deleting quotation' });
  }
};

export const getNextQuotationNumber = async (req: Request, res: Response) => {
  try {
    const quotationNumber = await generateQuotationNumber();
    res.json({ quotationNumber });
  } catch (error) {
    console.error('Error generating quotation number:', error);
    res.status(500).json({ message: 'Error generating quotation number' });
  }
};

export const createQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const { inquiryId, items, subtotal, gstRate, notes } = req.body;

    // --- Validation ---
    if (!inquiryId) return res.status(400).json({ message: 'inquiryId is required' });
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one quotation item is required' });
    }
    if (subtotal === undefined || subtotal === null || Number(subtotal) <= 0) {
      return res.status(400).json({ message: 'Subtotal must be greater than 0' });
    }

    const inquiry = await prisma.inquiry.findUnique({
      where: { id: Number(inquiryId) }
    });

    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    // Validate items based on department
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.placeName || item.placeName.trim() === '') {
        return res.status(400).json({ message: `Item ${i + 1}: Place name is required` });
      }
      if (inquiry.department === 'VIDEO') {
        if (!item.equipmentType || item.equipmentType.trim() === '') {
          return res.status(400).json({ message: `Item ${i + 1}: Equipment type is required` });
        }
        if (!item.ratePerDay || Number(item.ratePerDay) <= 0) {
          return res.status(400).json({ message: `Item ${i + 1}: Rate per day must be greater than 0` });
        }
        if (!item.days || Number(item.days) <= 0) {
          return res.status(400).json({ message: `Item ${i + 1}: Days must be at least 1` });
        }
      } else if (inquiry.department === 'LED') {
        if (!item.ledType || item.ledType.trim() === '') {
          return res.status(400).json({ message: `Item ${i + 1}: LED type is required` });
        }
        if (!item.heightFt || Number(item.heightFt) <= 0) {
          return res.status(400).json({ message: `Item ${i + 1}: Height must be greater than 0` });
        }
        if (!item.widthFt || Number(item.widthFt) <= 0) {
          return res.status(400).json({ message: `Item ${i + 1}: Width must be greater than 0` });
        }
        if (!item.ratePerSqft || Number(item.ratePerSqft) <= 0) {
          return res.status(400).json({ message: `Item ${i + 1}: Rate per sqft must be greater than 0` });
        }
        if (!item.days || Number(item.days) <= 0) {
          return res.status(400).json({ message: `Item ${i + 1}: Days must be at least 1` });
        }
      } else if (inquiry.department === 'SOUND') {
        if (!item.equipmentType || item.equipmentType.trim() === '') {
          return res.status(400).json({ message: `Item ${i + 1}: Equipment type is required` });
        }
        if (!item.ratePerDay || Number(item.ratePerDay) <= 0) {
          return res.status(400).json({ message: `Item ${i + 1}: Rate per day must be greater than 0` });
        }
        if (!item.days || Number(item.days) <= 0) {
          return res.status(400).json({ message: `Item ${i + 1}: Days must be at least 1` });
        }
      }
    }

    const stockError = await validateQuotationItemsStock(items);
    if (stockError) {
      return res.status(400).json({ message: stockError });
    }

    const quotationNumber = await generateQuotationNumber();

    // Compute GST
    const gst = calculateGst(Number(subtotal));
    const effectiveGstRate = Number(gstRate || 18);

    const mergedNotes = mergeQuotationNotes(notes, items);

    const quotation = await prisma.$transaction(async (tx) => {
      const q = await tx.quotation.create({
        data: {
          quotationNumber,
          inquiryId: Number(inquiryId),
          subtotal: Number(subtotal),
          gstRate: effectiveGstRate,
          cgstAmount: gst.cgst,
          sgstAmount: gst.sgst,
          totalAmount: gst.total,
          notes: mergedNotes,
          createdById: req.user?.userId,
          status: 'DRAFT'
        }
      });

      for (const item of items) {
        const category = item.category || inquiry.department;
        
        if (category === 'VIDEO') {
          await tx.videoQuotationItem.create({
            data: {
              quotationId: q.id,
              placeName: item.placeName || 'Default',
              position: item.position || '',
              equipmentType: item.equipmentType,
              ratePerDay: Number(item.ratePerDay),
              days: Number(item.days),
              nos: Number(item.nos || 1),
              totalAmount: itemTotalAmount(item, category),
              isVendorRented: !!item.isVendorRented,
              vendorId: item.vendorId ? Number(item.vendorId) : null
            }
          });
        } else if (category === 'LED') {
          const sqftPerDay = Number(item.heightFt) * Number(item.widthFt) * Number(item.nos || 1);
          const totalAmount = sqftPerDay * Number(item.ratePerSqft) * Number(item.days);
          await tx.ledQuotationItem.create({
            data: {
              quotationId: q.id,
              placeName: item.placeName || 'Default',
              locationName: item.locationName || '',
              ledType: item.ledType,
              heightFt: Number(item.heightFt),
              widthFt: Number(item.widthFt),
              nos: Number(item.nos || 1),
              sqftPerDay,
              ratePerSqft: Number(item.ratePerSqft),
              days: Number(item.days),
              totalAmount,
              isVendorRented: !!item.isVendorRented,
              vendorId: item.vendorId ? Number(item.vendorId) : null
            }
          });
        } else if (category === 'SOUND') {
          await tx.soundQuotationItem.create({
            data: {
              quotationId: q.id,
              placeName: item.placeName || 'Default',
              position: item.position || '',
              equipmentType: item.equipmentType,
              ratePerDay: Number(item.ratePerDay),
              days: Number(item.days),
              nos: Number(item.nos || 1),
              totalAmount: itemTotalAmount(item, category),
              isVendorRented: !!item.isVendorRented,
              vendorId: item.vendorId ? Number(item.vendorId) : null
            }
          });
        } else if (category === 'OFFICE') {
          await tx.officeQuotationItem.create({
            data: {
              quotationId: q.id,
              serviceName: item.equipmentType || item.placeName,
              description: item.notes || '',
              rate: Number(item.ratePerDay || item.rate || 0),
              quantity: Number(item.nos || 1),
              days: Number(item.days || 1),
              totalAmount: itemTotalAmount(item, category)
            }
          });
        }
      }

      await tx.inquiry.update({
        where: { id: Number(inquiryId) },
        data: { status: 'QUOTATION_DRAFT' }
      });

      return q;
    });

    res.status(201).json(quotation);
  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({ message: 'Error creating quotation' });
  }
};

export const getQuotationsByInquiry = async (req: Request, res: Response) => {
  try {
    const { inquiryId } = req.params;
    const quotations = await prisma.quotation.findMany({
      where: { inquiryId: Number(inquiryId), deletedAt: null },
      include: {
        videoQuotationItems: true,
        ledQuotationItems: true,
        soundQuotationItems: true,
        officeQuotationItems: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(quotations);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({ message: 'Error fetching quotations' });
  }
};

export const getQuotationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const quotation = await prisma.quotation.findUnique({
      where: { id: Number(id), deletedAt: null },
      include: {
        invoice: true,
        inquiry: {
          include: { client: true }
        },
        videoQuotationItems: true,
        ledQuotationItems: true,
        soundQuotationItems: true,
        officeQuotationItems: true
      }
    });
    
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    res.json({ ...quotation, isLocked: isQuotationLocked(quotation) });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    res.status(500).json({ message: 'Error fetching quotation' });
  }
};

export const updateQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { subtotal, gstRate, notes, items } = req.body;

    const existing = await prisma.quotation.findUnique({
      where: { id: Number(id) },
      include: { invoice: true }
    });
    if (!existing) return res.status(404).json({ message: 'Quotation not found' });
    if (isQuotationLocked(existing)) {
      return res.status(403).json({ message: QUOTATION_LOCKED_MESSAGE });
    }
    if (existing.status !== 'DRAFT' && existing.status !== 'APPROVED' && existing.status !== 'REJECTED') {
      return res.status(400).json({ message: 'Only DRAFT, APPROVED, or REJECTED quotations can be edited' });
    }

    if (items && items.length > 0) {
      const stockError = await validateQuotationItemsStock(items);
      if (stockError) {
        return res.status(400).json({ message: stockError });
      }
    }

    const gst = calculateGst(Number(subtotal));
    const mergedNotes =
      items && items.length > 0
        ? mergeQuotationNotes(notes ?? existing.notes, items)
        : notes ?? existing.notes;

    const updated = await prisma.$transaction(async (tx) => {
      const q = await tx.quotation.update({
        where: { id: Number(id) },
        data: {
          subtotal: Number(subtotal),
          gstRate: Number(gstRate || 18),
          cgstAmount: gst.cgst,
          sgstAmount: gst.sgst,
          totalAmount: gst.total,
          notes: mergedNotes,
          ...(existing.status === 'REJECTED' && { status: 'DRAFT' })
        }
      });

      if (existing.status === 'REJECTED') {
        await tx.inquiry.update({
          where: { id: q.inquiryId },
          data: { status: 'QUOTATION_DRAFT' }
        });
      }

      // If items provided, delete old and recreate
      if (items && items.length > 0) {
        const inquiry = await tx.inquiry.findUnique({ where: { id: q.inquiryId } });
        
        await tx.videoQuotationItem.deleteMany({ where: { quotationId: q.id } });
        await tx.ledQuotationItem.deleteMany({ where: { quotationId: q.id } });
        await tx.soundQuotationItem.deleteMany({ where: { quotationId: q.id } });
        await tx.officeQuotationItem.deleteMany({ where: { quotationId: q.id } });

        for (const item of items) {
          const category = item.category || inquiry?.department;
          
          if (category === 'VIDEO') {
            await tx.videoQuotationItem.create({
              data: {
                quotationId: q.id,
                placeName: item.placeName || 'Default',
                position: item.position || '',
                equipmentType: item.equipmentType,
                ratePerDay: Number(item.ratePerDay),
                days: Number(item.days),
                nos: Number(item.nos || 1),
                totalAmount: itemTotalAmount(item, category),
                isVendorRented: !!item.isVendorRented,
                vendorId: item.vendorId ? Number(item.vendorId) : null
              }
            });
          } else if (category === 'LED') {
            const sqftPerDay = Number(item.heightFt) * Number(item.widthFt) * Number(item.nos || 1);
            const totalAmount = itemTotalAmount(item, category);
            await tx.ledQuotationItem.create({
              data: {
                quotationId: q.id,
                placeName: item.placeName || 'Default',
                locationName: item.locationName || '',
                ledType: item.ledType,
                heightFt: Number(item.heightFt),
                widthFt: Number(item.widthFt),
                nos: Number(item.nos || 1),
                sqftPerDay,
                ratePerSqft: Number(item.ratePerSqft),
                days: Number(item.days),
                totalAmount,
                isVendorRented: !!item.isVendorRented,
                vendorId: item.vendorId ? Number(item.vendorId) : null
              }
            });
          } else if (category === 'SOUND') {
            await tx.soundQuotationItem.create({
              data: {
                quotationId: q.id,
                placeName: item.placeName || 'Default',
                position: item.position || '',
                equipmentType: item.equipmentType,
                ratePerDay: Number(item.ratePerDay),
                days: Number(item.days),
                nos: Number(item.nos || 1),
                totalAmount: itemTotalAmount(item, category),
                isVendorRented: !!item.isVendorRented,
                vendorId: item.vendorId ? Number(item.vendorId) : null
              }
            });
          } else if (category === 'OFFICE') {
            await tx.officeQuotationItem.create({
              data: {
                quotationId: q.id,
                serviceName: item.equipmentType || item.placeName,
                description: item.notes || '',
                rate: Number(item.ratePerDay || item.rate || 0),
                quantity: Number(item.nos || 1),
                days: Number(item.days || 1),
                totalAmount: itemTotalAmount(item, category)
              }
            });
          }
        }
      }

      // Sync with Invoice if it exists
      const linkedInvoice = await tx.invoice.findUnique({ 
        where: { quotationId: q.id },
        include: { payments: true }
      });
      
      if (linkedInvoice) {
        const totalPaid = (linkedInvoice as any).payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
        const newBalance = Math.max(0, gst.total - totalPaid);
        let newStatus = 'PENDING';
        if (newBalance <= 0) newStatus = 'PAID';
        else if (totalPaid > 0) newStatus = 'PARTIAL';

        await tx.invoice.update({
          where: { id: linkedInvoice.id },
          data: {
            subtotal: Number(subtotal),
            cgstAmount: gst.cgst,
            sgstAmount: gst.sgst,
            grossTotal: gst.total,
            balanceAmount: newBalance,
            status: newStatus
          }
        });
      }

      return tx.quotation.findUnique({
        where: { id: q.id },
        include: { videoQuotationItems: true, ledQuotationItems: true, soundQuotationItems: true }
      });
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating quotation:', error);
    res.status(500).json({ message: 'Error updating quotation' });
  }
};

export const reviseQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { items, subtotal, gstRate, notes } = req.body;

    const existing = await prisma.quotation.findUnique({
      where: { id: Number(id) },
      include: { videoQuotationItems: true, ledQuotationItems: true, soundQuotationItems: true }
    });
    if (!existing) return res.status(404).json({ message: 'Quotation not found' });

    const revisionNumber = existing.revisionNumber + 1;
    const revisionSuffix = `-${revisionNumber}`;
    const quotationNumber = `${existing.quotationNumber}${revisionSuffix}`;
    const gst = calculateGst(Number(subtotal));

    const revised = await prisma.$transaction(async (tx) => {
      // Mark old quotation as REVISED
      await tx.quotation.update({
        where: { id: Number(id) },
        data: { status: 'REVISED' }
      });

      const q = await tx.quotation.create({
        data: {
          quotationNumber,
          inquiryId: existing.inquiryId,
          revisionNumber,
          parentQuotationId: existing.id,
          subtotal: Number(subtotal),
          gstRate: Number(gstRate || 18),
          cgstAmount: gst.cgst,
          sgstAmount: gst.sgst,
          totalAmount: gst.total,
          notes,
          createdById: req.user?.userId,
          status: 'DRAFT'
        }
      });

      // Copy/create items
      const inquiry = await tx.inquiry.findUnique({ where: { id: q.inquiryId } });
      const itemsToCreate = items || (inquiry?.department === 'VIDEO' ? existing.videoQuotationItems : (inquiry?.department === 'LED' ? existing.ledQuotationItems : existing.soundQuotationItems));

      for (const item of itemsToCreate) {
        const category = item.category || inquiry?.department;
        
        if (category === 'VIDEO') {
          await tx.videoQuotationItem.create({
            data: {
              quotationId: q.id,
              placeName: item.placeName || 'Default',
              position: item.position || '',
              equipmentType: item.equipmentType,
              ratePerDay: Number(item.ratePerDay),
              days: Number(item.days),
              nos: Number(item.nos || 1),
              totalAmount: itemTotalAmount(item, category),
              isVendorRented: !!item.isVendorRented,
              vendorId: item.vendorId ? Number(item.vendorId) : null
            }
          });
        } else if (category === 'LED') {
          const sqftPerDay = Number(item.heightFt) * Number(item.widthFt) * Number(item.nos || 1);
          const totalAmount = sqftPerDay * Number(item.ratePerSqft) * Number(item.days);
          await tx.ledQuotationItem.create({
            data: {
              quotationId: q.id,
              placeName: item.placeName || 'Default',
              locationName: item.locationName || '',
              ledType: item.ledType,
              heightFt: Number(item.heightFt),
              widthFt: Number(item.widthFt),
              nos: Number(item.nos || 1),
              sqftPerDay,
              ratePerSqft: Number(item.ratePerSqft),
              days: Number(item.days),
              totalAmount,
              isVendorRented: !!item.isVendorRented,
              vendorId: item.vendorId ? Number(item.vendorId) : null
            }
          });
        } else if (category === 'SOUND') {
          await tx.soundQuotationItem.create({
            data: {
              quotationId: q.id,
              placeName: item.placeName || 'Default',
              position: item.position || '',
              equipmentType: item.equipmentType,
              ratePerDay: Number(item.ratePerDay),
              days: Number(item.days),
              nos: Number(item.nos || 1),
              totalAmount: itemTotalAmount(item, category),
              isVendorRented: !!item.isVendorRented,
              vendorId: item.vendorId ? Number(item.vendorId) : null
            }
          });
        } else if (category === 'OFFICE') {
          await tx.officeQuotationItem.create({
            data: {
              quotationId: q.id,
              serviceName: item.equipmentType || item.placeName,
              description: item.notes || '',
              rate: Number(item.ratePerDay || item.rate || 0),
              quantity: Number(item.nos || 1),
              days: Number(item.days || 1),
              totalAmount: Number(item.ratePerDay || item.rate || 0) * Number(item.nos || 1) * Number(item.days || 1)
            }
          });
        }
      }

      return q;
    });

    res.status(201).json(revised);
  } catch (error) {
    console.error('Error revising quotation:', error);
    res.status(500).json({ message: 'Error revising quotation' });
  }
};

export const approveQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { signedCopyPath } = req.body;

    const existing = await prisma.quotation.findUnique({
      where: { id: Number(id) },
      include: { invoice: true }
    });
    if (!existing) return res.status(404).json({ message: 'Quotation not found' });
    if (isQuotationLocked(existing)) {
      return res.status(403).json({ message: QUOTATION_LOCKED_MESSAGE });
    }
    if (existing.status !== 'DRAFT' && existing.status !== 'SENT') {
      return res.status(400).json({ message: 'Only DRAFT or SENT quotations can be approved' });
    }

    const updated = await prisma.quotation.update({
      where: { id: Number(id) },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        ...(signedCopyPath && { signedCopyPath })
      }
    });

    // Update inquiry status to CONFIRMED
    await prisma.inquiry.update({
      where: { id: updated.inquiryId },
      data: { status: 'CONFIRMED' }
    });

    // Automatically create vendor rentals for outside sourced items
    await autoCreateVendorRentalsForQuotation(updated.id);

    res.json(updated);
  } catch (error) {
    console.error('Error approving quotation:', error);
    res.status(500).json({ message: 'Error approving quotation' });
  }
};

export const declineQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const existing = await prisma.quotation.findUnique({
      where: { id: Number(id) },
      include: { invoice: true }
    });
    if (!existing) return res.status(404).json({ message: 'Quotation not found' });
    if (isQuotationLocked(existing)) {
      return res.status(403).json({ message: QUOTATION_LOCKED_MESSAGE });
    }
    if (existing.status !== 'DRAFT' && existing.status !== 'SENT' && existing.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Only DRAFT, SENT or APPROVED quotations can be declined' });
    }

    const updated = await prisma.quotation.update({
      where: { id: Number(id) },
      data: {
        status: 'REJECTED',
        notes: reason ? `${existing.notes || ''}\n[DECLINED]: ${reason}`.trim() : existing.notes,
      }
    });

    // If it was APPROVED, we might need to revert the inquiry status
    if (existing.status === 'APPROVED') {
      const otherApproved = await prisma.quotation.count({
        where: { inquiryId: existing.inquiryId, status: 'APPROVED', NOT: { id: Number(id) } }
      });
      if (otherApproved === 0) {
        await prisma.inquiry.update({
          where: { id: existing.inquiryId },
          data: { status: 'INQUIRY' }
        });
      }
    }

    res.json(updated);
  } catch (error) {
    console.error('Error declining quotation:', error);
    res.status(500).json({ message: 'Error declining quotation' });
  }
};

export const sendQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.quotation.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ message: 'Quotation not found' });
    if (existing.status !== 'DRAFT') {
      return res.status(400).json({ message: 'Only DRAFT quotations can be sent' });
    }

    const updated = await prisma.quotation.update({
      where: { id: Number(id) },
      data: {
        status: 'SENT',
        sentAt: new Date()
      }
    });

    // Update inquiry status
    await prisma.inquiry.update({
      where: { id: updated.inquiryId },
      data: { status: 'QUOTATION_SENT' }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error sending quotation:', error);
    res.status(500).json({ message: 'Error sending quotation' });
  }
};

export const uploadSignedCopy = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const file = req.file as Express.Multer.File;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: Number(id) },
      include: { invoice: true }
    });
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }
    if (isQuotationLocked(quotation)) {
      return res.status(403).json({ message: QUOTATION_LOCKED_MESSAGE });
    }

    const cloudinaryUrl = await uploadToCloudinary(file.buffer, 'signed-copies', 'auto');

    const updated = await prisma.quotation.update({
      where: { id: Number(id) },
      data: { signedCopyPath: cloudinaryUrl }
    });

    res.json({ message: 'Signed copy uploaded successfully', signedCopyPath: updated.signedCopyPath });
  } catch (error) {
    console.error('Error uploading signed copy:', error);
    res.status(500).json({ message: 'Error uploading signed copy' });
  }
};

export const updateQuotationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    // Validate allowed status values
    const allowedStatuses = ['DRAFT', 'SENT', 'APPROVED', 'REVISED', 'REJECTED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    const existing = await prisma.quotation.findUnique({
      where: { id: Number(id) },
      include: { invoice: true }
    });
    if (!existing) return res.status(404).json({ message: 'Quotation not found' });

    // If already in that status, just return success (idempotency)
    if (existing.status === status) {
      return res.json(existing);
    }

    if (isQuotationLocked(existing)) {
      return res.status(403).json({ message: QUOTATION_LOCKED_MESSAGE });
    }

    // Status transition validation
    const validTransitions: Record<string, string[]> = {
      'DRAFT': ['SENT', 'APPROVED', 'REJECTED'],
      'SENT': ['APPROVED', 'REJECTED'],
      'APPROVED': ['REJECTED'],
      'REVISED': [],
      'REJECTED': ['DRAFT', 'SENT', 'APPROVED'],
    };
    if (!validTransitions[existing.status]?.includes(status)) {
      return res.status(400).json({ message: `Cannot transition from ${existing.status} to ${status}` });
    }

    const updated = await prisma.quotation.update({
      where: { id: Number(id) },
      data: { 
        status,
        approvedAt: status === 'APPROVED' ? new Date() : existing.approvedAt,
        notes: (status === 'REJECTED' && reason) 
          ? `${existing.notes || ''}\n[REJECTED]: ${reason}`.trim() 
          : existing.notes
      }
    });

    // Inquiry status synchronization
    if (status === 'APPROVED') {
      await prisma.inquiry.update({
        where: { id: updated.inquiryId },
        data: { status: 'CONFIRMED' }
      });
      // Automatically create vendor rentals for outside sourced items
      await autoCreateVendorRentalsForQuotation(updated.id);
    } else if (status === 'REJECTED' && existing.status === 'APPROVED') {
      // Check if any other quotation is still approved for this inquiry
      const otherApproved = await prisma.quotation.count({
        where: { inquiryId: existing.inquiryId, status: 'APPROVED', NOT: { id: Number(id) } }
      });
      if (otherApproved === 0) {
        await prisma.inquiry.update({
          where: { id: existing.inquiryId },
          data: { status: 'INQUIRY' }
        });
      }
    } else if (status === 'SENT') {
      await prisma.inquiry.update({
        where: { id: updated.inquiryId },
        data: { status: 'QUOTATION_SENT' }
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating quotation status:', error);
    res.status(500).json({ message: 'Error updating quotation status' });
  }
};

export async function autoCreateVendorRentalsForQuotation(quotationId: number, tx: any = prisma) {
  try {
    const quotation = await tx.quotation.findUnique({
      where: { id: quotationId },
      include: {
        inquiry: true,
        videoQuotationItems: true,
        ledQuotationItems: true,
        soundQuotationItems: true
      }
    });
    if (!quotation || !quotation.inquiry) return;

    const inquiry = quotation.inquiry;

    // Helper to extract clean name
    const cleanName = (val: string) => val.replace(/^\[VENDOR:[^\]]+\]\s*/i, '').trim();

    // Process Video Items
    for (const item of quotation.videoQuotationItems) {
      if (item.isVendorRented && item.vendorId) {
        const name = cleanName(item.equipmentType);
        // Prevent duplicate rentals
        const existing = await tx.vendorRental.findFirst({
          where: {
            inquiryId: inquiry.id,
            vendorId: item.vendorId,
            itemName: name
          }
        });
        if (!existing) {
          await tx.vendorRental.create({
            data: {
              vendorId: item.vendorId,
              itemName: name,
              quantity: item.nos,
              rentedDate: inquiry.startDate,
              endDate: inquiry.endDate,
              pricePerDay: Number(item.ratePerDay),
              totalCost: Number(item.totalAmount),
              inquiryId: inquiry.id,
              status: 'RENTED',
              notes: `Auto-created from Quotation #${quotation.quotationNumber}`
            }
          });
        }
      }
    }

    // Process Sound Items
    for (const item of quotation.soundQuotationItems) {
      if (item.isVendorRented && item.vendorId) {
        const name = cleanName(item.equipmentType);
        const existing = await tx.vendorRental.findFirst({
          where: {
            inquiryId: inquiry.id,
            vendorId: item.vendorId,
            itemName: name
          }
        });
        if (!existing) {
          await tx.vendorRental.create({
            data: {
              vendorId: item.vendorId,
              itemName: name,
              quantity: item.nos,
              rentedDate: inquiry.startDate,
              endDate: inquiry.endDate,
              pricePerDay: Number(item.ratePerDay),
              totalCost: Number(item.totalAmount),
              inquiryId: inquiry.id,
              status: 'RENTED',
              notes: `Auto-created from Quotation #${quotation.quotationNumber}`
            }
          });
        }
      }
    }

    // Process LED Items
    for (const item of quotation.ledQuotationItems) {
      if (item.isVendorRented && item.vendorId) {
        const name = `${cleanName(item.ledType)} (${item.widthFt}x${item.heightFt} ft)`;
        const existing = await tx.vendorRental.findFirst({
          where: {
            inquiryId: inquiry.id,
            vendorId: item.vendorId,
            itemName: name
          }
        });
        if (!existing) {
          const pricePerDay = Number(item.ratePerSqft) * Number(item.widthFt) * Number(item.heightFt);
          await tx.vendorRental.create({
            data: {
              vendorId: item.vendorId,
              itemName: name,
              quantity: item.nos,
              rentedDate: inquiry.startDate,
              endDate: inquiry.endDate,
              pricePerDay: pricePerDay,
              totalCost: Number(item.totalAmount),
              inquiryId: inquiry.id,
              status: 'RENTED',
              notes: `Auto-created from Quotation #${quotation.quotationNumber}`
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error auto-creating vendor rentals:', error);
  }
}
