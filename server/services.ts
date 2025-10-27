import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const db = new PrismaClient();

// Bank operations
export const bankService = {
  getAll: async () => {
    return await db.bank.findMany();
  },

  getById: async (id: string) => {
    return await db.bank.findUnique({ where: { id } });
  },

  create: async (data: { name: string; accountNumber: string; ownerName: string }) => {
    return await db.bank.create({ data });
  },

  update: async (id: string, data: { name: string; accountNumber: string; ownerName: string }) => {
    return await db.bank.update({ where: { id }, data });
  },

  delete: async (id: string) => {
    return await db.bank.delete({ where: { id } });
  },
};

// Company operations
export const companyService = {
  getAll: async () => {
    return await db.company.findMany();
  },

  getById: async (id: string) => {
    return await db.company.findUnique({ where: { id } });
  },

  create: async (data: { name: string, address?: string, phone?: string, email?: string, website?: string }) => {
    return await db.company.create({ 
      data: { 
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        createdAt: new Date()
      } 
    });
  },

  update: async (id: string, data: { name?: string, address?: string, phone?: string, email?: string, website?: string }) => {
    return await db.company.update({ where: { id }, data });
  },

  delete: async (id: string) => {
    return await db.company.delete({ where: { id } });
  },
};

// Role operations
export const roleService = {
  getAll: async () => {
    return await db.role.findMany();
  },

  getById: async (id: string) => {
    return await db.role.findUnique({ where: { id } });
  },

  getByName: async (name: string) => {
    return await db.role.findUnique({ where: { name } });
  },

  create: async (data: { name: string; description?: string }) => {
    return await db.role.create({ data });
  },

  update: async (id: string, data: { name?: string; description?: string }) => {
    return await db.role.update({ where: { id }, data });
  },

  delete: async (id: string) => {
    return await db.role.delete({ where: { id } });
  },
};

// Menu operations
export const menuService = {
  getAll: async () => {
    return await db.menu.findMany({
      include: { parent: true }
    });
  },

  getById: async (id: string) => {
    return await db.menu.findUnique({ 
      where: { id },
      include: { parent: true, children: true }
    });
  },

  getByName: async (name: string) => {
    return await db.menu.findUnique({ where: { name } });
  },

  getByPath: async (path: string) => {
    return await db.menu.findUnique({ where: { path } });
  },

  create: async (data: { name: string; path: string; parentId?: string | null; order: number }) => {
    return await db.menu.create({ 
      data: {
        ...data,
        parentId: data.parentId || null
      }
    });
  },

  update: async (id: string, data: { name?: string; path?: string; parentId?: string | null; order?: number }) => {
    return await db.menu.update({ 
      where: { id }, 
      data: {
        ...data,
        parentId: data.parentId !== undefined ? data.parentId || null : undefined
      }
    });
  },

  delete: async (id: string) => {
    return await db.menu.delete({ where: { id } });
  },
};

// Role Permission operations
export const rolePermissionService = {
  getAll: async () => {
    return await db.rolePermission.findMany({
      include: { role: true, menu: true }
    });
  },

  getById: async (id: string) => {
    return await db.rolePermission.findUnique({ 
      where: { id },
      include: { role: true, menu: true }
    });
  },

  getByRoleIdAndMenuId: async (roleId: string, menuId: string) => {
    return await db.rolePermission.findUnique({ 
      where: { 
        roleId_menuId: { roleId, menuId } 
      },
      include: { role: true, menu: true }
    });
  },

  getByRoleId: async (roleId: string) => {
    return await db.rolePermission.findMany({ 
      where: { roleId },
      include: { role: true, menu: true }
    });
  },

  getByMenuId: async (menuId: string) => {
    return await db.rolePermission.findMany({ 
      where: { menuId },
      include: { role: true, menu: true }
    });
  },

  create: async (data: { roleId: string; menuId: string; canView?: boolean; canCreate?: boolean; canEdit?: boolean; canDelete?: boolean }) => {
    return await db.rolePermission.create({ 
      data: {
        ...data,
        canView: data.canView || false,
        canCreate: data.canCreate || false,
        canEdit: data.canEdit || false,
        canDelete: data.canDelete || false
      },
      include: { role: true, menu: true }
    });
  },

  update: async (id: string, data: { canView?: boolean; canCreate?: boolean; canEdit?: boolean; canDelete?: boolean }) => {
    return await db.rolePermission.update({ 
      where: { id }, 
      data,
      include: { role: true, menu: true }
    });
  },

  delete: async (id: string) => {
    return await db.rolePermission.delete({ where: { id } });
  },

  setPermissions: async (roleId: string, menuId: string, permissions: { canView?: boolean; canCreate?: boolean; canEdit?: boolean; canDelete?: boolean }) => {
    // Try to update first, if not found then create
    try {
      return await db.rolePermission.update({
        where: {
          roleId_menuId: { roleId, menuId }
        },
        data: permissions,
        include: { role: true, menu: true }
      });
    } catch {
      // If update fails, create a new record
      return await db.rolePermission.create({
        data: {
          roleId,
          menuId,
          ...permissions,
          canView: permissions.canView || false,
          canCreate: permissions.canCreate || false,
          canEdit: permissions.canEdit || false,
          canDelete: permissions.canDelete || false
        },
        include: { role: true, menu: true }
      });
    }
  }
};

// User operations
export const userService = {
  getAll: async (email?: string) => {
    if (email) {
      // For case-insensitive email search in SQLite, search for users and filter
      const allUsers = await db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          roleId: true,
          companyId: true,
          createdAt: true,
          // Don't include password for general user lookups (security)
          company: {
            select: {
              id: true,
              name: true
            }
          },
          roleRef: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      });
      
      // Filter results on the application level for case-insensitive matching
      return allUsers.filter(user => 
        user.email.toLowerCase().includes(email.toLowerCase())
      );
    } else {
      // If no email filter, return all users
      return await db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          roleId: true,
          companyId: true,
          createdAt: true,
          // Don't include password for general user lookups (security)
          company: {
            select: {
              id: true,
              name: true
            }
          },
          roleRef: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      });
    }
  },

  getById: async (id: string) => {
    return await db.user.findUnique({ 
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleId: true,
        companyId: true,
        createdAt: true,
        // Don't include password for security
        company: {
          select: {
            id: true,
            name: true
          }
        },
        roleRef: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });
  },

  getByEmail: async (email: string) => {
    return await db.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleId: true,
        companyId: true,
        createdAt: true,
        password: true, // Include password for authentication
        company: {
          select: {
            id: true,
            name: true
          }
        },
        roleRef: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });
  },

  create: async (data: { name: string; email: string; password: string; role?: string; roleId?: string; companyId: string }) => {
    // In a real application, you would hash the password before storing
    // For now we'll store it directly, but it should be hashed using bcrypt
    return await db.user.create({ 
      data: { 
        ...data, 
        createdAt: new Date() 
      },
      include: { company: true, roleRef: true }
    });
  },

  update: async (id: string, data: { name?: string; email?: string; password?: string; role?: string; roleId?: string; companyId?: string }) => {
    return await db.user.update({ 
      where: { id }, 
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleId: true,
        companyId: true,
        createdAt: true,
        // Don't include password for security
        company: {
          select: {
            id: true,
            name: true
          }
        },
        roleRef: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });
  },

  delete: async (id: string) => {
    return await db.user.delete({ where: { id } });
  },
};

// Product operations
export const productService = {
  getAll: async () => {
    return await db.product.findMany();
  },

  getById: async (id: string) => {
    return await db.product.findUnique({ where: { id } });
  },

  create: async (data: { name: string; description: string }) => {
    return await db.product.create({ data });
  },

  update: async (id: string, data: { name: string; description: string }) => {
    return await db.product.update({ where: { id }, data });
  },

  delete: async (id: string) => {
    return await db.product.delete({ where: { id } });
  },
};

// Plan operations
export const planService = {
  getAll: async () => {
    return await db.plan.findMany();
  },

  getById: async (id: string) => {
    return await db.plan.findUnique({ where: { id } });
  },

  getByProductId: async (productId: string) => {
    return await db.plan.findMany({ where: { productId } });
  },

  create: async (data: { productId: string; name: string; price: number; deviceLimit: number; durationDays: number }) => {
    return await db.plan.create({ data });
  },

  update: async (id: string, data: { name: string; price: number; deviceLimit: number; durationDays: number }) => {
    return await db.plan.update({ where: { id }, data });
  },

  delete: async (id: string) => {
    return await db.plan.delete({ where: { id } });
  },
};

// License operations
export const licenseService = {
  getAll: async () => {
    // Check for any licenses that have expired and update their status
    await db.licenseKey.updateMany({
      where: {
        status: 'Active',
        expiresAt: {
          lte: new Date()
        }
      },
      data: {
        status: 'Expired'
      }
    });

    return await db.licenseKey.findMany({
      include: { 
        product: true, 
        plan: true, 
        user: true, 
        invoice: true,
        devices: true 
      }
    });
  },

  getById: async (id: string) => {
    // Check if this specific license has expired and update its status if needed
    const license = await db.licenseKey.findUnique({ 
      where: { id },
      include: { 
        product: true, 
        plan: true, 
        user: true, 
        invoice: true,
        devices: true 
      }
    });
    
    if (license && license.status === 'Active' && license.expiresAt && license.expiresAt < new Date()) {
      return await db.licenseKey.update({
        where: { id },
        data: { status: 'Expired' },
        include: { 
          product: true, 
          plan: true, 
          user: true, 
          invoice: true,
          devices: true 
        }
      });
    }
    
    return license;
  },
  
  getByKey: async (key: string) => {
    // Check if this specific license has expired and update its status if needed
    const license = await db.licenseKey.findUnique({ 
      where: { key },
      include: { 
        product: true, 
        plan: true, 
        user: true, 
        invoice: true,
        devices: true 
      }
    });
    
    if (license && license.status === 'Active' && license.expiresAt && license.expiresAt < new Date()) {
      return await db.licenseKey.update({
        where: { key },
        data: { status: 'Expired' },
        include: { 
          product: true, 
          plan: true, 
          user: true, 
          invoice: true,
          devices: true 
        }
      });
    }
    
    return license;
  },

  create: async (data: { key: string; productId: string; planId: string; userId?: string; status?: string; expiresAt?: Date | null; invoiceId?: string | null }) => {
    // If the license is associated with an invoice, get the invoice status to determine initial license status
    let finalStatus = data.status;
    
    // If no status is provided and the license is linked to an invoice, use the invoice status
    if (!data.status && data.invoiceId) {
      const invoice = await db.invoice.findUnique({
        where: { id: data.invoiceId }
      });
      
      if (invoice) {
        // Set initial status based on invoice status
        finalStatus = invoice.status === 'Paid' ? 'Active' : 'Inactive';
      }
    }
    
    // If no status is provided and not linked to an invoice, default to 'Inactive'
    if (!finalStatus) {
      finalStatus = 'Inactive';
    }
    
    // Automatically set status to 'Expired' if the license would be active but the expiry date has passed
    if (finalStatus === 'Active' && data.expiresAt && data.expiresAt < new Date()) {
      finalStatus = 'Expired';
    }
    
    return await db.licenseKey.create({ 
      data: { 
        ...data, 
        status: finalStatus, 
        createdAt: new Date() 
      },
      include: { 
        product: true, 
        plan: true, 
        user: true, 
        invoice: true,
        devices: true 
      }
    });
  },

  update: async (id: string, data: { key?: string; productId?: string; planId?: string; userId?: string; status?: string; expiresAt?: Date | null; invoiceId?: string | null }) => {
    // Automatically set status to 'Expired' if the license is active but the expiry date has passed
    if (data.status === 'Active' && data.expiresAt && data.expiresAt < new Date()) {
      data.status = 'Expired';
    }
    
    return await db.licenseKey.update({ 
      where: { id }, 
      data,
      include: { 
        product: true, 
        plan: true, 
        user: true, 
        invoice: true,
        devices: true 
      }
    });
  },

  delete: async (id: string) => {
    return await db.licenseKey.delete({ where: { id } });
  },
};

// Device operations
export const deviceService = {
  getAll: async () => {
    return await db.device.findMany({
      include: { license: true }
    });
  },

  getById: async (id: string) => {
    return await db.device.findUnique({ 
      where: { id },
      include: { license: true }
    });
  },

  getByLicenseId: async (licenseId: string) => {
    return await db.device.findMany({ 
      where: { licenseId },
      include: { license: true }
    });
  },

  create: async (data: { licenseId: string; computerId: string; name: string; processor?: string; os?: string; ram?: string; isActive?: boolean }) => {
    return await db.device.create({ 
      data: { 
        ...data, 
        activatedAt: new Date(),
        lastSeenAt: new Date()
      },
      include: { license: true }
    });
  },

  update: async (id: string, data: { name?: string; processor?: string; os?: string; ram?: string; isActive?: boolean }) => {
    return await db.device.update({ 
      where: { id }, 
      data: { ...data, lastSeenAt: new Date() },
      include: { license: true }
    });
  },

  delete: async (id: string) => {
    return await db.device.delete({ where: { id } });
  },
};

// Invoice operations
export const invoiceService = {
  getAll: async () => {
    return await db.invoice.findMany({
      include: { 
        company: true,
        bank: true,
        lineItems: {
          include: { plan: true }
        },
        licenses: true
      }
    });
  },

  getById: async (id: string) => {
    return await db.invoice.findUnique({ 
      where: { id },
      include: { 
        company: true,
        bank: true,
        lineItems: {
          include: { plan: true }
        },
        licenses: true
      }
    });
  },

  create: async (data: { invoiceNumber: string; companyId: string; issueDate: Date; dueDate: Date; total: number; paymentMethod: string; bankId?: string | null; lineItems: { planId: string; description: string; quantity: number; unitPrice: number; total: number }[] }) => {
    console.log('InvoiceService.create - Input data:', data);
    try {
      const { lineItems, ...invoiceData } = data;
      
      // Create invoice and its line items, set status to default 'Unpaid'
      const createdInvoice = await db.invoice.create({ 
        data: {
          ...invoiceData,
          status: 'Unpaid',  // Set default status to 'Unpaid'
          createdAt: new Date(),
          lineItems: {
            create: lineItems
          }
        },
        include: { 
          company: true,
          bank: true,
          lineItems: {
            include: { plan: true }
          }
        }
      });
      
      console.log('InvoiceService.create - Created invoice:', createdInvoice);
      
      // If the invoice is created with 'Paid' status, update associated license statuses to 'Active'
      if (createdInvoice.status === 'Paid') {
        // Get all licenses associated with this invoice
        const associatedLicenses = await db.licenseKey.findMany({
          where: { invoiceId: createdInvoice.id }
        });
        
        console.log('InvoiceService.create - Found associated licenses to update:', associatedLicenses.length);
        
        const licenseUpdates = associatedLicenses.map(license => {
          // Only update if the license is not already expired
          if (license.status !== 'Expired') {
            return db.licenseKey.update({
              where: { id: license.id },
              data: { status: 'Active' }
            });
          }
          // If it's already expired, don't change the status
          return Promise.resolve(license);
        });
        
        await Promise.all(licenseUpdates);
      }
      
      // Return the created invoice with its associated data
      const result = await db.invoice.findUnique({
        where: { id: createdInvoice.id },
        include: { 
          company: true,
          bank: true,
          lineItems: {
            include: { plan: true }
          },
          licenses: true
        }
      });
      
      console.log('InvoiceService.create - Final result:', result);
      return result;
    } catch (error) {
      console.error('InvoiceService.create - Error creating invoice:', error);
      throw error;
    }
  },

  update: async (id: string, data: { invoiceNumber?: string; issueDate?: Date; dueDate?: Date; total?: number; status?: string; paymentMethod?: string; bankId?: string | null }) => {
    const updatedInvoice = await db.invoice.update({ 
      where: { id }, 
      data,
      include: { 
        company: true,
        bank: true,
        lineItems: {
          include: { plan: true }
        },
        // Note: This relationship might not load licenses if they're not directly related
        // So we'll need to query licenses separately after the update
      }
    });
    
    // If the invoice status changed, update associated license statuses
    if (data.status !== undefined) {
      // Get all licenses associated with this invoice
      const associatedLicenses = await db.licenseKey.findMany({
        where: { invoiceId: id }
      });
      
      // Update their status based on the new invoice status
      const licenseUpdates = associatedLicenses.map(license => {
        // Only update if the license is not already expired
        if (license.status !== 'Expired') {
          const newStatus = data.status === 'Paid' ? 'Active' : 'Inactive';
          return db.licenseKey.update({
            where: { id: license.id },
            data: { status: newStatus }
          });
        }
        // If it's already expired, don't change the status
        return Promise.resolve(license);
      });
      
      await Promise.all(licenseUpdates);
    }
    
    // Return the updated invoice with its associated data
    return await db.invoice.findUnique({
      where: { id },
      include: { 
        company: true,
        bank: true,
        lineItems: {
          include: { plan: true }
        },
        licenses: true
      }
    });
  },

  delete: async (id: string) => {
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        lineItems: true, // Include line items to delete them first
        licenses: true   // Include licenses to update their status
      }
    });
    
    if (invoice) {
      // First, update all licenses associated with this invoice
      if (invoice.licenses && invoice.licenses.length > 0) {
        // When deleting an invoice, reset license statuses to 'Inactive'
        const licenseUpdates = invoice.licenses.map(license => {
          // Only update if the license is not already expired
          if (license.status !== 'Expired') {
            return db.licenseKey.update({
              where: { id: license.id },
              data: { status: 'Inactive' }
            });
          }
          // If it's already expired, don't change the status
          return Promise.resolve(license);
        });
        
        await Promise.all(licenseUpdates);
      }
      
      // Then, delete all related line items first (to handle foreign key constraints)
      if (invoice.lineItems && invoice.lineItems.length > 0) {
        await db.invoiceLineItem.deleteMany({
          where: { invoiceId: id }
        });
      }
    }
    
    // Finally, delete the invoice itself
    return await db.invoice.delete({ where: { id } });
  },
};

// Activity Log operations
export const activityLogService = {
  getAll: async () => {
    return await db.activityLog.findMany({
      include: { user: true }
    });
  },

  getById: async (id: string) => {
    return await db.activityLog.findUnique({ 
      where: { id },
      include: { user: true }
    });
  },

  create: async (data: { userId: string; action: string; entityType: string; entityName: string; details?: any }) => {
    return await db.activityLog.create({ 
      data: { 
        ...data, 
        createdAt: new Date(),
        details: data.details ? data.details : null
      },
      include: { user: true }
    });
  },

  delete: async (id: string) => {
    return await db.activityLog.delete({ where: { id } });
  },

  deleteAll: async () => {
    console.log('ActivityLogService.deleteAll - Attempting to delete all activity logs');
    try {
      const result = await db.activityLog.deleteMany({});
      console.log('ActivityLogService.deleteAll - Successfully deleted', result.count, 'activity logs');
      return result;
    } catch (error) {
      console.error('ActivityLogService.deleteAll - Error deleting activity logs:', error);
      throw error;
    }
  },
};