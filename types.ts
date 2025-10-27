export interface Product {
  id: string;
  name: string;
  description: string;
}

export interface Plan {
  id: string;
  productId: string;
  name: string;
  price: number;
  deviceLimit: number;
  durationDays: number; // 0 for permanent
}

export interface Device {
  id: string;
  licenseId: string;
  computerId: string;
  name: string;
  processor?: string;
  os?: string;
  ram?: string;
  isActive: boolean;
  activatedAt: string;
  lastSeenAt: string;
}

export interface LicenseKey {
  id: string;
  key: string;
  productId: string;
  planId: string;
  userId?: string;
  status: 'Active' | 'Inactive' | 'Expired';
  expiresAt: string | null;
  createdAt: string;
  invoiceId?: string | null;
  devices?: Device[];
}

export interface Company {
    id: string;
    name: string;
    createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Menu {
  id: string;
  name: string;
  path: string;
  parentId?: string | null;
  order: number;
  createdAt: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  menuId: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId?: string | null;
  role?: Role | null;
  companyId: string;
  createdAt: string;
}

export interface ActivityLog {
  id:string;
  userId: string;
  action: 'create' | 'update' | 'delete';
  entityType: 'Product' | 'Plan' | 'License' | 'User' | 'Company' | 'Invoice' | 'Device';
  entityName: string;
  createdAt: string;
  details?: {
    field: string;
    from: string;
    to: string;
  } | null;
}

export interface InvoiceLineItem {
  id: string;
  planId: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  companyId: string;
  issueDate: string;
  dueDate: string;
  total: number;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  paymentMethod: 'Cash' | 'Bank' | 'Qris';
  bankId?: string | null;
  lineItems: InvoiceLineItem[];
}

export interface Bank {
  id: string;
  name: string;
  accountNumber: string;
  ownerName: string;
}