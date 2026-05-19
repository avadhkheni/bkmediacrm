import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

function vendorMatchesDepartment(
  departmentField: string | null | undefined,
  department: string
): boolean {
  const dept = department.trim().toUpperCase();
  const depts = (departmentField || '')
    .split(',')
    .map((d) => d.trim().toUpperCase())
    .filter(Boolean);
  if (!dept) return true;
  if (depts.length === 0) return true;
  return depts.includes(dept);
}

export const getVendors = async (req: Request, res: Response) => {
  try {
    const { department } = req.query;

    let vendors = await prisma.vendor.findMany({
      where: { isActive: true },
      include: { products: true },
      orderBy: { name: 'asc' }
    });

    if (department && typeof department === 'string') {
      vendors = vendors.filter((v) =>
        vendorMatchesDepartment(v.department, department)
      );
    }

    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ message: 'Error fetching vendors' });
  }
};

export const createVendor = async (req: Request, res: Response) => {
  try {
    const { name, phone, email, department, specialization, address, gstNumber } = req.body;
    const vendor = await prisma.vendor.create({
      data: {
        name,
        phone,
        email,
        department,
        specialization,
        address,
        gstNumber
      },
      include: { products: true }
    });
    res.status(201).json(vendor);
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ message: 'Error creating vendor' });
  }
};

export const updateVendor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const vendor = await prisma.vendor.update({
      where: { id: Number(id) },
      data,
      include: { products: true }
    });
    res.json(vendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ message: 'Error updating vendor' });
  }
};

export const deleteVendor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.vendor.update({
      where: { id: Number(id) },
      data: { isActive: false }
    });
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ message: 'Error deleting vendor' });
  }
};

export const createVendorProduct = async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const { name, category, ratePerDay, quantity } = req.body;

    if (!name || !category || ratePerDay === undefined) {
      return res.status(400).json({ message: 'name, category, and ratePerDay are required' });
    }

    const product = await prisma.vendorProduct.create({
      data: {
        vendorId: Number(vendorId),
        name,
        category,
        quantity: Number(quantity || 1),
        ratePerDay: Number(ratePerDay)
      }
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating vendor product:', error);
    res.status(500).json({ message: 'Error creating vendor product' });
  }
};

export const updateVendorProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { name, category, ratePerDay, quantity } = req.body;

    const product = await prisma.vendorProduct.update({
      where: { id: Number(productId) },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(ratePerDay !== undefined && { ratePerDay: Number(ratePerDay) })
      }
    });
    res.json(product);
  } catch (error) {
    console.error('Error updating vendor product:', error);
    res.status(500).json({ message: 'Error updating vendor product' });
  }
};

export const deleteVendorProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    await prisma.vendorProduct.delete({
      where: { id: Number(productId) }
    });
    res.json({ message: 'Vendor product deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor product:', error);
    res.status(500).json({ message: 'Error deleting vendor product' });
  }
};

export const getVendorRentals = async (req: Request, res: Response) => {
  try {
    const rentals = await prisma.vendorRental.findMany({
      include: {
        vendor: true,
        inquiry: {
          include: {
            client: true
          }
        }
      },
      orderBy: { rentedDate: 'desc' }
    });
    res.json(rentals);
  } catch (error) {
    console.error('Error fetching vendor rentals:', error);
    res.status(500).json({ message: 'Error fetching vendor rentals' });
  }
};

export const createVendorRental = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    if (Array.isArray(body)) {
      const createdRentals = [];
      for (const item of body) {
        const { vendorId, itemName, quantity, rentedDate, endDate, pricePerDay, totalCost, inquiryId, notes } = item;
        if (!vendorId || !itemName || !pricePerDay) {
          return res.status(400).json({ message: 'vendorId, itemName, and pricePerDay are required for all items' });
        }
        const rental = await prisma.vendorRental.create({
          data: {
            vendorId: Number(vendorId),
            itemName,
            quantity: Number(quantity || 1),
            rentedDate: rentedDate ? new Date(rentedDate) : new Date(),
            endDate: endDate ? new Date(endDate) : null,
            pricePerDay: Number(pricePerDay),
            totalCost: Number(totalCost || (Number(pricePerDay) * Number(quantity || 1))),
            inquiryId: inquiryId ? Number(inquiryId) : null,
            notes,
            status: 'RENTED'
          },
          include: {
            vendor: true,
            inquiry: true
          }
        });
        createdRentals.push(rental);
      }
      return res.status(201).json(createdRentals);
    }

    const { vendorId, itemName, quantity, rentedDate, endDate, pricePerDay, totalCost, inquiryId, notes } = req.body;

    if (!vendorId || !itemName || !pricePerDay) {
      return res.status(400).json({ message: 'vendorId, itemName, and pricePerDay are required' });
    }

    const rental = await prisma.vendorRental.create({
      data: {
        vendorId: Number(vendorId),
        itemName,
        quantity: Number(quantity || 1),
        rentedDate: rentedDate ? new Date(rentedDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        pricePerDay: Number(pricePerDay),
        totalCost: Number(totalCost || (Number(pricePerDay) * Number(quantity || 1))),
        inquiryId: inquiryId ? Number(inquiryId) : null,
        notes,
        status: 'RENTED'
      },
      include: {
        vendor: true,
        inquiry: true
      }
    });

    res.status(201).json(rental);
  } catch (error) {
    console.error('Error creating vendor rental:', error);
    res.status(500).json({ message: 'Error creating vendor rental' });
  }
};

export const updateVendorRental = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, returnedFromEventDate, returnedToVendorDate, notes, quantity, pricePerDay, totalCost, rentedDate, endDate, itemName, inquiryId } = req.body;

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (returnedFromEventDate !== undefined) data.returnedFromEventDate = returnedFromEventDate ? new Date(returnedFromEventDate) : null;
    if (returnedToVendorDate !== undefined) data.returnedToVendorDate = returnedToVendorDate ? new Date(returnedToVendorDate) : null;
    if (notes !== undefined) data.notes = notes;
    if (quantity !== undefined) data.quantity = Number(quantity);
    if (pricePerDay !== undefined) data.pricePerDay = Number(pricePerDay);
    if (totalCost !== undefined) data.totalCost = Number(totalCost);
    if (rentedDate !== undefined) data.rentedDate = new Date(rentedDate);
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
    if (itemName !== undefined) data.itemName = itemName;
    if (inquiryId !== undefined) data.inquiryId = inquiryId ? Number(inquiryId) : null;

    const rental = await prisma.vendorRental.update({
      where: { id: Number(id) },
      data,
      include: {
        vendor: true,
        inquiry: true
      }
    });

    res.json(rental);
  } catch (error) {
    console.error('Error updating vendor rental:', error);
    res.status(500).json({ message: 'Error updating vendor rental' });
  }
};

export const deleteVendorRental = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.vendorRental.delete({
      where: { id: Number(id) }
    });
    res.json({ message: 'Vendor rental record deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor rental:', error);
    res.status(500).json({ message: 'Error deleting vendor rental' });
  }
};
