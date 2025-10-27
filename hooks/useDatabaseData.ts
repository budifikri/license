import { useState, useEffect, useCallback } from 'react';
import { productService, planService, companyService, userService, licenseService, deviceService, invoiceService, activityLogService, bankService } from '@/lib/services';
import type { Product, Plan, Company, User, LicenseKey, Device, Invoice, ActivityLog, Bank } from '../types';

// Generic hook factory
function createDataHook<T>(
  fetchService: () => Promise<T[]>, 
  createService: (data: any) => Promise<T>, 
  updateService: (id: string, data: any) => Promise<T>, 
  deleteService: (id: string) => Promise<T>
) {
  return () => {
    const [data, setData] = useState<T[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      const fetchData = async () => {
        try {
          const result = await fetchService();
          setData(result);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('An error occurred'));
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }, []);

    const addItem = useCallback(async (itemData: Omit<T, 'id'> | T) => {
      try {
        const newItem = await createService(itemData);
        setData(prev => prev ? [...prev, newItem] : [newItem]);
        return newItem;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
        throw err;
      }
    }, []);

    const updateItem = useCallback(async (id: string, updatedData: Partial<T>) => {
      try {
        const updatedItem = await updateService(id, updatedData);
        setData(prev => prev ? prev.map(item => (item['id' as keyof T] === id ? updatedItem : item)) : [updatedItem]);
        return updatedItem;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
        throw err;
      }
    }, []);

    const deleteItem = useCallback(async (id: string) => {
      try {
        await deleteService(id);
        setData(prev => prev ? prev.filter(item => item['id' as keyof T] !== id) : []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
        throw err;
      }
    }, []);

    return { data, isLoading, error, addItem, updateItem, deleteItem };
  };
}

// Specific hooks for each data type
export const useProducts = createDataHook<Product>(
  productService.getAll,
  productService.create,
  productService.update,
  productService.delete
);

export const usePlans = createDataHook<Plan>(
  planService.getAll,
  planService.create,
  planService.update,
  planService.delete
);

export const useCompanies = createDataHook<Company>(
  companyService.getAll,
  companyService.create,
  companyService.update,
  companyService.delete
);

export const useUsers = createDataHook<User>(
  userService.getAll,
  userService.create,
  userService.update,
  userService.delete
);

export const useLicenses = createDataHook<LicenseKey>(
  licenseService.getAll,
  licenseService.create,
  licenseService.update,
  licenseService.delete
);

export const useDevices = createDataHook<Device>(
  deviceService.getAll,
  deviceService.create,
  deviceService.update,
  deviceService.delete
);

export const useInvoices = createDataHook<Invoice>(
  invoiceService.getAll,
  invoiceService.create,
  invoiceService.update,
  invoiceService.delete
);

export const useActivityLogs = createDataHook<ActivityLog>(
  activityLogService.getAll,
  activityLogService.create,
  activityLogService.delete, // No update function for activity logs
  activityLogService.delete
);

export const useBanks = createDataHook<Bank>(
  bankService.getAll,
  bankService.create,
  bankService.update,
  bankService.delete
);