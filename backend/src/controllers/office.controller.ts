import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { inquiryId, status, subDepartment, assignedStaffId } = req.query;
    const where: any = {};
    if (inquiryId) where.inquiryId = Number(inquiryId);
    if (status) where.status = status as string;
    if (subDepartment) where.subDepartment = subDepartment as string;
    if (assignedStaffId) where.assignedStaffId = Number(assignedStaffId);

    const tasks = await prisma.officeTask.findMany({
      where,
      include: {
        inquiry: {
          select: {
            id: true,
            eventName: true,
            inquiryNumber: true,
            startDate: true
          }
        },
        assignedStaff: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { deadline: 'asc' }
    });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching office tasks:', error);
    res.status(500).json({ message: 'Error fetching office tasks' });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const { inquiryId, title, description, subDepartment, priority, deadline, assignedStaffId, previewUrl, comments } = req.body;
    const task = await prisma.officeTask.create({
      data: {
        inquiryId: inquiryId ? Number(inquiryId) : null,
        title,
        description,
        subDepartment,
        priority: priority || 'MEDIUM',
        deadline: deadline ? new Date(deadline) : null,
        assignedStaffId: assignedStaffId ? Number(assignedStaffId) : null,
        status: 'NOT_STARTED',
        previewUrl,
        comments
      },
      include: {
        inquiry: true,
        assignedStaff: true
      }
    });
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating office task:', error);
    res.status(500).json({ message: 'Error creating office task' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      subDepartment, 
      priority, 
      status, 
      deadline, 
      assignedStaffId,
      rawFootageRecv,
      editingStarted,
      reviewDone,
      readyForDelivery,
      previewUrl,
      comments,
      notes
    } = req.body;

    const task = await prisma.officeTask.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        subDepartment,
        priority,
        status,
        deadline: deadline ? new Date(deadline) : undefined,
        assignedStaffId: assignedStaffId !== undefined ? (assignedStaffId ? Number(assignedStaffId) : null) : undefined,
        rawFootageRecv,
        editingStarted,
        reviewDone,
        readyForDelivery,
        previewUrl,
        comments,
        notes
      },
      include: {
        inquiry: true,
        assignedStaff: true
      }
    });
    res.json(task);
  } catch (error) {
    console.error('Error updating office task:', error);
    res.status(500).json({ message: 'Error updating office task' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.officeTask.delete({
      where: { id: Number(id) }
    });
    res.json({ message: 'Office task deleted successfully' });
  } catch (error) {
    console.error('Error deleting office task:', error);
    res.status(500).json({ message: 'Error deleting office task' });
  }
};
