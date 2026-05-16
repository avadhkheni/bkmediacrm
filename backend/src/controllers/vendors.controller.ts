import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getVendors = async (req: Request, res: Response) => {
  try {
    const { department } = req.query;
    const where: any = { isActive: true };
    if (department) where.department = department as string;

    const vendors = await prisma.vendor.findMany({
      where,
      orderBy: { name: 'asc' }
    });
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
      }
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
      data
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
