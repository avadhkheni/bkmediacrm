import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getClients = async (req: Request, res: Response) => {
  try {
    const { search = '', page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const clients = await prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: search as string } },
          { company: { contains: search as string } },
          { phone: { contains: search as string } },
        ],
        isActive: true,
        deletedAt: null,
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.client.count({
      where: {
        OR: [
          { name: { contains: search as string } },
          { company: { contains: search as string } },
        ],
        isActive: true,
        deletedAt: null,
      },
    });

    res.json({ data: clients, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Error fetching clients' });
  }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    const { name, contactPerson, phone, email, company, gstNumber, address } = req.body;

    // --- Validation ---
    if (!name || name.trim() === '') return res.status(400).json({ message: 'Client name is required' });
    if (!phone || phone.trim() === '') return res.status(400).json({ message: 'Phone number is required' });

    // Check for duplicate
    const existing = await prisma.client.findFirst({
      where: { phone: phone.trim(), isActive: true, deletedAt: null }
    });
    if (existing) return res.status(409).json({ message: 'A client with this phone number already exists' });

    const client = await prisma.client.create({
      data: { name, contactPerson, phone, email, company, gstNumber, address },
    });
    
    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ message: 'Error creating client' });
  }
};

export const getClientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const client = await prisma.client.findUnique({
      where: { id: Number(id) },
      include: { inquiries: { where: { deletedAt: null }, take: 5, orderBy: { createdAt: 'desc' } } },
    });
    
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ message: 'Error fetching client' });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contactPerson, phone, email, company, gstNumber, address, isActive } = req.body;
    
    const client = await prisma.client.update({
      where: { id: Number(id) },
      data: { name, contactPerson, phone, email, company, gstNumber, address, isActive },
    });
    
    res.json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ message: 'Error updating client' });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.client.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() },
    });
    res.json({ message: 'Client soft-deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ message: 'Error deleting client' });
  }
};
