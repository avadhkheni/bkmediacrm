import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Get all roles
export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: true,
        _count: {
          select: { users: true }
        }
      }
    });
    res.json(roles);
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
};

// Create a new role
export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, description, permissions } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Role name is required' });
    }
    
    const existingRole = await prisma.role.findUnique({ where: { name } });
    if (existingRole) {
      return res.status(400).json({ message: 'Role already exists' });
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: {
          create: permissions?.map((p: any) => ({
            module: p.module,
            canCreate: p.canCreate || false,
            canRead: p.canRead || false,
            canUpdate: p.canUpdate || false,
            canDelete: p.canDelete || false
          })) || []
        }
      },
      include: {
        permissions: true
      }
    });
    
    res.status(201).json(role);
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ message: 'Failed to create role' });
  }
};

// Update a role
export const updateRole = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { description, permissions } = req.body;
    
    const role = await prisma.role.findUnique({ where: { name } });
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Update role details and recreate permissions
    const updatedRole = await prisma.$transaction(async (tx) => {
      if (permissions) {
        await tx.rolePermission.deleteMany({ where: { roleName: name } });
      }
      
      return tx.role.update({
        where: { name },
        data: {
          description,
          ...(permissions && {
            permissions: {
              create: permissions.map((p: any) => ({
                module: p.module,
                canCreate: p.canCreate || false,
                canRead: p.canRead || false,
                canUpdate: p.canUpdate || false,
                canDelete: p.canDelete || false
              }))
            }
          })
        },
        include: {
          permissions: true
        }
      });
    });

    // Count how many users are affected by this role update
    const affectedUsersCount = await prisma.user.count({
      where: { role: name }
    });

    res.json({
      ...updatedRole,
      _meta: {
        affectedUsersCount,
        message: affectedUsersCount > 0 
          ? `Role updated. ${affectedUsersCount} user(s) will need to refresh their permissions.`
          : 'Role updated successfully.'
      }
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Failed to update role' });
  }
};

// Delete a role
export const deleteRole = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    
    if (name === 'ADMIN') {
      return res.status(400).json({ message: 'Cannot delete ADMIN role' });
    }

    const role = await prisma.role.findUnique({ 
      where: { name },
      include: { 
        users: {
          select: { id: true, deletedAt: true }
        }
      }
    });
    
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    const activeUsers = role.users.filter(u => u.deletedAt === null);
    if (activeUsers.length > 0) {
      return res.status(400).json({ message: 'Cannot delete role that has active users assigned to it. Please reassign or delete those users first.' });
    }

    // If there are soft-deleted users, we must reassign their role before we can delete this role
    // because of the database foreign key constraint. We'll assign them to ADMIN (since they are deleted, it's safe).
    const deletedUsers = role.users.filter(u => u.deletedAt !== null);
    if (deletedUsers.length > 0) {
      await prisma.user.updateMany({
        where: { role: name },
        data: { role: 'ADMIN' }
      });
    }

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleName: name } }),
      prisma.role.delete({ where: { name } })
    ]);
    
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ message: 'Failed to delete role' });
  }
};

// GET all users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        staffId: true,
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
            department: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch user list' });
  }
};

// CREATE user account
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, staffId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    // Check if email already registered
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email address is already in use' });
    }

    // If linking staff, verify staff doesn't already have an account
    if (staffId) {
      const existingStaffAccount = await prisma.user.findUnique({
        where: { staffId: Number(staffId) }
      });
      if (existingStaffAccount) {
        return res.status(400).json({ message: 'Selected staff member already has a login account' });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        staffId: staffId ? Number(staffId) : null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        staffId: true
      }
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Create user account error:', error);
    res.status(500).json({ message: 'Failed to create user login account' });
  }
};

// TOGGLE user active status
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({ message: 'isActive status is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deactivating own account or admin
    if (user.role === 'ADMIN' && !isActive) {
      return res.status(400).json({ message: 'Cannot deactivate administrator account to prevent lockout' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ message: 'Failed to update user login status' });
  }
};

// DELETE user account
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'ADMIN') {
      return res.status(400).json({ message: 'Cannot delete ADMIN account' });
    }

    // Soft delete the user by setting deletedAt, deactivating, clearing the staff connection,
    // and renaming the email to release the unique constraints while preserving audit logs.
    await prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { userId: Number(id) } }),
      prisma.user.update({
        where: { id: Number(id) },
        data: {
          deletedAt: new Date(),
          isActive: false,
          email: `${user.email}_deleted_${Date.now()}`,
          staffId: null
        }
      })
    ]);

    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user login account' });
  }
};
