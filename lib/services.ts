import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

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

  create: async (data: { name: string }) => {
    return await db.company.create({ data: { ...data, createdAt: new Date() } });
  },

  update: async (id: string, data: { name: string }) => {
    return await db.company.update({ where: { id }, data });
  },

  delete: async (id: string) => {
    return await db.company.delete({ where: { id } });
  },
};

// User operations
export const userService = {
  getAll: async () => {
    return await db.user.findMany({
      include: { company: true }
    });
  },

  getById: async (id: string) => {
    return await db.user.findUnique({ 
      where: { id },
      include: { company: true }
    });
  },

  getByEmail: async (email: string) => {
    return await db.user.findUnique({ 
      where: { email },
      include: { company: true }
    });
  },

  create: async (data: { name: string; email: string; role: string; companyId: string }) => {
    return await db.user.create({ 
      data: { 
        ...data, 
        createdAt: new Date() 
      },
      include: { company: true }
    });
  },

  update: async (id: string, data: { name: string; email: string; role: string; companyId: string }) => {
    return await db.user.update({ 
      where: { id }, 
      data,
      include: { company: true }
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
    return await db.licenseKey.findUnique({ 
      where: { id },
      include: { 
        product: true, 
        plan: true, 
        user: true, 
        invoice: true,
        devices: true 
      }
    });
  },
  
  getByKey: async (key: string) => {
    return await db.licenseKey.findUnique({ 
      where: { key },
      include: { 
        product: true, 
        plan: true, 
        user: true, 
        invoice: true,
        devices: true 
      }
    });
  },

  create: async (data: { key: string; productId: string; planId: string; userId?: string; status: string; expiresAt: Date | null; invoiceId?: string | null }) => {
    return await db.licenseKey.create({ 
      data: { ...data, createdAt: new Date() },
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

  create: async (data: { invoiceNumber: string; companyId: string; issueDate: Date; dueDate: Date; total: number; status: string; paymentMethod: string; bankId?: string | null; lineItems: { planId: string; description: string; quantity: number; unitPrice: number; total: number }[] }) => {
    const { lineItems, ...invoiceData } = data;
    
    return await db.invoice.create({ 
      data: {
        ...invoiceData,
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
        },
        licenses: true
      }
    });
  },

  update: async (id: string, data: { invoiceNumber?: string; issueDate?: Date; dueDate?: Date; total?: number; status?: string; paymentMethod?: string; bankId?: string | null }) => {
    return await db.invoice.update({ 
      where: { id }, 
      data,
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
};