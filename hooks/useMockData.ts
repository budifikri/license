import React, { useState, useEffect, useCallback } from 'react';
import type { Product, Plan, LicenseKey, Company, User, ActivityLog, Invoice, Device, Bank } from '../types';
import { v4 as uuidv4 } from 'uuid';

// --- START OF SEED DATA (used for initial population) ---

const initialData = {
  banks: [
      { id: 'clxshq3s100003b6wbank001', name: 'Bank Central Asia (BCA)', accountNumber: '1234567890', ownerName: 'Innovate Corp' },
      { id: 'clxshq3s100003b6wbank002', name: 'Bank Mandiri', accountNumber: '0987654321', ownerName: 'Innovate Corp' },
      { id: 'clxshq3s100003b6wbank003', name: 'Bank Rakyat Indonesia (BRI)', accountNumber: '1122334455', ownerName: 'Innovate Corp' },
  ],
  companies: [
    { id: 'clxshq3s100003b6wfg53k59b', name: 'Innovate Corp', createdAt: new Date('2023-01-15T09:00:00.000Z').toISOString() },
    { id: 'clxshq3s100013b6w05s9b867', name: 'Future Solutions', createdAt: new Date('2023-02-20T10:30:00.000Z').toISOString() },
    { id: 'clxshq3s100023b6wcq7749ke', name: 'QuantumLeap Tech', createdAt: new Date('2023-03-10T14:00:00.000Z').toISOString() },
  ],
  users: (companies: Company[]): User[] => [
    { id: 'clxshq3s100073b6wadmin123', name: 'Admin User', email: 'admin@gmail.com', role: 'Admin', companyId: companies[0].id, createdAt: new Date('2023-01-15T09:00:00.000Z').toISOString() },
    { id: 'clxshq3s100033b6wha2n6410', name: 'Alice Johnson', email: 'alice@innovate.com', role: 'Admin', companyId: companies[0].id, createdAt: new Date('2023-01-15T09:05:00.000Z').toISOString() },
    { id: 'clxshq3s100043b6wl1s4k9p4', name: 'Bob Smith', email: 'bob@future.com', role: 'Manager', companyId: companies[1].id, createdAt: new Date('2023-02-20T10:35:00.000Z').toISOString() },
    { id: 'clxshq3s100053b6wz8q7m2v9', name: 'Charlie Brown', email: 'charlie@quantum.com', role: 'User', companyId: companies[2].id, createdAt: new Date('2023-03-10T14:05:00.000Z').toISOString() },
    { id: 'clxshq3s100063b6w5y3f0c7a', name: 'Diana Prince', email: 'diana@innovate.com', role: 'User', companyId: companies[0].id, createdAt: new Date('2023-04-01T11:00:00.000Z').toISOString() },
  ],
  products: [
    { id: 'clxshq3s100073b6wk1p2b4b2', name: 'NexusDB', description: 'A high-performance, scalable NoSQL database for modern applications.' },
    { id: 'clxshq3s100083b6w5q8x7s8g', name: 'CodeGenius', description: 'An AI-powered code completion tool that boosts developer productivity.' },
    { id: 'clxshq3s100093b6w7h3s9c4f', name: 'PixelPerfect', description: 'A collaborative design platform for UI/UX teams.' },
  ],
  plans: (products: Product[]) => [
    { id: 'clxshq3s1000a3b6w1r2b3k4d', productId: products[0].id, name: 'Basic', price: 735000, deviceLimit: 1, durationDays: 365 },
    { id: 'clxshq3s1000b3b6w5g6h7j8k', productId: products[0].id, name: 'Pro', price: 1485000, deviceLimit: 5, durationDays: 365 },
    { id: 'clxshq3s1000c3b6w9m8n7b6v', productId: products[0].id, name: 'Enterprise', price: 7485000, deviceLimit: 50, durationDays: 0 },
    { id: 'clxshq3s1000d3b6w3c4x5z6a', productId: products[1].id, name: 'Individual', price: 150000, deviceLimit: 1, durationDays: 30 },
    { id: 'clxshq3s1000e3b6w7s8d9f0g', productId: products[1].id, name: 'Team', price: 675000, deviceLimit: 5, durationDays: 365 },
    { id: 'clxshq3s1000f3b6w1h2j3k4l', productId: products[2].id, name: 'Free', price: 0, deviceLimit: 2, durationDays: 0 },
    { id: 'clxshq3s1000g3b6w5z4x3c2v', productId: products[2].id, name: 'Professional', price: 375000, deviceLimit: 10, durationDays: 365 },
  ],
  licenses: (plans: Plan[], users: User[]) => {
      const licenses: Omit<LicenseKey, 'id'>[] = [];
      for (let i = 0; i < 10; i++) { // Generate 10 un-invoiced licenses
          const plan = plans[i % plans.length];
          const user = users[i % users.length];
          const isActive = Math.random() > 0.2;
          const hasExpiry = plan.durationDays > 0;
          const expiresAtDate = hasExpiry ? new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000) : null;
          const isExpired = expiresAtDate ? expiresAtDate < new Date() : false;
          
          licenses.push({
              key: uuidv4().toUpperCase(),
              productId: plan.productId,
              planId: plan.id,
              userId: user.id,
              status: isExpired ? 'Expired' : isActive ? 'Active' : 'Inactive',
              expiresAt: expiresAtDate ? expiresAtDate.toISOString() : null,
              createdAt: new Date(Date.now() - (i + 5) * 24 * 60 * 60 * 1000).toISOString(),
          });
      }
      return licenses.map(l => ({...l, id: uuidv4()}));
  },
  devices: (licenses: LicenseKey[], plans: Plan[]) => {
      const devices: Device[] = [];
      licenses.slice(0, 15).forEach(license => {
          const plan = plans.find(p => p.id === license.planId)!;
          if (plan.deviceLimit === 0) return;
          const deviceCount = Math.floor(Math.random() * plan.deviceLimit) + 1;
          for (let i = 0; i < deviceCount; i++) {
              if (i >= plan.deviceLimit) break;
              devices.push({
                  id: uuidv4(),
                  licenseId: license.id,
                  computerId: uuidv4(),
                  name: `STATION-${license.key.slice(0, 4)}-${i}`,
                  os: ['Windows 11', 'macOS Sonoma', 'Ubuntu 22.04'][Math.floor(Math.random() * 3)],
                  processor: ['Intel i7', 'AMD Ryzen 9', 'Apple M2'][Math.floor(Math.random() * 3)],
                  ram: ['8GB', '16GB', '32GB'][Math.floor(Math.random() * 3)],
                  isActive: true,
                  activatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                  lastSeenAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
              });
          }
      });
      return devices;
  },
  activityLogs: (users: User[], licenses: LicenseKey[]): ActivityLog[] => [
    { id: 'act-1', userId: users[1].id, action: 'create', entityType: 'Product', entityName: 'NexusDB', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), details: null },
    { id: 'act-2', userId: users[2].id, action: 'create', entityType: 'Company', entityName: 'Future Solutions', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), details: null },
    { id: 'act-3', userId: users[1].id, action: 'update', entityType: 'Plan', entityName: 'Basic', createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), details: { field: 'Price', from: 'Rp 735.000', to: 'Rp 800.000' } },
    { id: 'act-4', userId: users[3].id, action: 'create', entityType: 'License', entityName: licenses[5].key.substring(0, 8) + '...', createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), details: null },
    { id: 'act-5', userId: users[1].id, action: 'delete', entityType: 'User', entityName: 'Old User', createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), details: null },
    { id: 'act-6', userId: users[2].id, action: 'update', entityType: 'License', entityName: licenses[2].key.substring(0, 8) + '...', createdAt: new Date(Date.now() - 75 * 60 * 60 * 1000).toISOString(), details: { field: 'Status', from: 'Active', to: 'Inactive'} },
  ],
  invoices: (companies: Company[], plans: Plan[], products: Product[], banks: Bank[]): Invoice[] => {
      const nexusProPlan = plans.find(p => p.productId === products[0].id && p.name === 'Pro')!;
      const codegeniusTeamPlan = plans.find(p => p.productId === products[1].id && p.name === 'Team')!;
      const pixelProPlan = plans.find(p => p.productId === products[2].id && p.name === 'Professional')!;
      return [
        { id: uuidv4(), invoiceNumber: 'INV-2024-001', companyId: companies[0].id, issueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), status: 'Unpaid', paymentMethod: 'Bank', bankId: banks[0].id, lineItems: [{ id: uuidv4(), planId: nexusProPlan.id, description: `${products[0].name} - ${nexusProPlan.name}`, quantity: 2, unitPrice: nexusProPlan.price },{ id: uuidv4(), planId: codegeniusTeamPlan.id, description: `${products[1].name} - ${codegeniusTeamPlan.name}`, quantity: 1, unitPrice: codegeniusTeamPlan.price },], total: (nexusProPlan.price * 2) + codegeniusTeamPlan.price },
        { id: uuidv4(), invoiceNumber: 'INV-2024-002', companyId: companies[1].id, issueDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), status: 'Overdue', paymentMethod: 'Qris', lineItems: [{ id: uuidv4(), planId: pixelProPlan.id, description: `${products[2].name} - ${pixelProPlan.name}`, quantity: 5, unitPrice: pixelProPlan.price },], total: pixelProPlan.price * 5 },
        { id: uuidv4(), invoiceNumber: 'INV-2024-003', companyId: companies[2].id, issueDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), status: 'Paid', paymentMethod: 'Cash', lineItems: [{ id: uuidv4(), planId: nexusProPlan.id, description: `${products[0].name} - ${nexusProPlan.name}`, quantity: 10, unitPrice: nexusProPlan.price },], total: nexusProPlan.price * 10 },
      ];
  }
};

const getInitialData = () => {
    const banks = initialData.banks;
    const companies = initialData.companies;
    const users = initialData.users(companies);
    const products = initialData.products;
    const plans = initialData.plans(products);
    
    // Create invoices first
    const invoices = initialData.invoices(companies, plans, products, banks);
    
    // Create licenses from invoices
    const invoiceLicenses: LicenseKey[] = [];
    invoices.forEach(invoice => {
        const companyUsers = users.filter(u => u.companyId === invoice.companyId);
        if(companyUsers.length > 0) {
            invoice.lineItems.forEach(item => {
                const plan = plans.find(p => p.id === item.planId);
                if(plan) {
                    for(let i = 0; i < item.quantity; i++) {
                        const hasExpiry = plan.durationDays > 0;
                        const expiresAtDate = hasExpiry ? new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000) : null;
                        const isExpired = expiresAtDate ? expiresAtDate < new Date() : false;
                        
                        let status: LicenseKey['status'] = 'Inactive';
                        if (isExpired) {
                            status = 'Expired';
                        } else if (invoice.status === 'Paid') {
                            status = 'Active';
                        }

                        invoiceLicenses.push({
                            id: uuidv4(),
                            key: uuidv4().toUpperCase(),
                            productId: plan.productId,
                            planId: plan.id,
                            userId: companyUsers[0].id,
                            status: status,
                            expiresAt: expiresAtDate ? expiresAtDate.toISOString() : null,
                            createdAt: new Date(invoice.issueDate).toISOString(),
                            invoiceId: invoice.id,
                            devices: []
                        });
                    }
                }
            });
        }
    });

    let licenses = [...initialData.licenses(plans, users), ...invoiceLicenses];
    const devices = initialData.devices(licenses, plans);

    licenses.forEach(license => {
      license.devices = devices.filter(d => d.licenseId === license.id);
    });
    
    const activityLogs = initialData.activityLogs(users, licenses);
    
    return { banks, companies, users, products, plans, licenses, devices, activityLogs, invoices };
};

// --- END OF SEED DATA ---

function usePersistentState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      let data = item ? JSON.parse(item) : initialValue;

      // Automatically deactivate expired licenses on load
      if (key === 'licenses' && Array.isArray(data)) {
        const now = new Date();
        (data as LicenseKey[]).forEach(license => {
          if (license.expiresAt && new Date(license.expiresAt) < now && license.status === 'Active') {
            license.status = 'Expired';
          }
        });
      }

      return data;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState] as const;
}

function createPersistentDataHook<T extends { id: string }>(storageKey: string, initialData: T[]) {
  return () => {
    const [data, setData] = usePersistentState<T[]>(storageKey, initialData);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }, []);

    const addItem = useCallback((item: Omit<T, 'id'> | T) => {
        const newItem = 'id' in item ? item : { ...item, id: uuidv4() } as T;
        setData(prev => [...prev, newItem]);
    }, [setData]);

    const updateItem = useCallback((updatedItem: T) => {
      setData(prev => prev.map(item => (item.id === updatedItem.id ? updatedItem : item)));
    }, [setData]);

    const deleteItem = useCallback((id: string) => {
      setData(prev => prev.filter(item => item.id !== id));
    }, [setData]);
    
    const addMultipleItems = useCallback((items: T[]) => {
      setData(prev => [...prev, ...items]);
    }, [setData]);

    return { data, isLoading, addItem, updateItem, deleteItem, addMultipleItems };
  };
}

const allInitialData = getInitialData();

export const useProducts = createPersistentDataHook<Product>('products', allInitialData.products);
export const usePlans = createPersistentDataHook<Plan>('plans', allInitialData.plans);
export const useCompanies = createPersistentDataHook<Company>('companies', allInitialData.companies);
export const useUsers = createPersistentDataHook<User>('users', allInitialData.users);
export const useLicenses = createPersistentDataHook<LicenseKey>('licenses', allInitialData.licenses);
export const useActivityLogs = createPersistentDataHook<ActivityLog>('activityLogs', allInitialData.activityLogs);
export const useInvoices = createPersistentDataHook<Invoice>('invoices', allInitialData.invoices);
export const useDevices = createPersistentDataHook<Device>('devices', allInitialData.devices);
export const useBanks = createPersistentDataHook<Bank>('banks', allInitialData.banks);