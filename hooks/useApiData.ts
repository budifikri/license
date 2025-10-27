import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import type { Product, Plan, Company, User, LicenseKey, Device, Invoice, ActivityLog, Bank } from '../types';

// Generic hook factory for API calls
function createApiHook<T>(
  endpoint: string,
  initialData: T[] = []
) {
  return () => {
    const [data, setData] = useState<T[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      const fetchData = async () => {
        try {
          setIsLoading(true);
          const response = await apiClient.get<T[]>(endpoint);
          if (response.error) {
            throw new Error(response.error);
          }
          setData(response.data || initialData);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('An error occurred'));
          console.error(`Error fetching ${endpoint}:`, err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }, []);

    const addItem = useCallback(async (itemData: Omit<T, 'id'> | T) => {
      try {
        const response = await apiClient.post<T>(endpoint, itemData);
        if (response.error) {
          throw new Error(response.error);
        }
        const newItem = response.data!;
        setData(prev => prev ? [...prev, newItem] : [newItem]);
        return newItem;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
        throw err;
      }
    }, [endpoint]);

    const updateItem = useCallback(async (id: string, updatedData: Partial<T>) => {
      try {
        const response = await apiClient.put<T>(`${endpoint}/${id}`, updatedData);
        if (response.error) {
          throw new Error(response.error);
        }
        const updatedItem = response.data!;
        setData(prev => prev ? prev.map(item => (item['id' as keyof T] === id ? updatedItem : item)) : [updatedItem]);
        return updatedItem;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
        throw err;
      }
    }, [endpoint]);

    const deleteItem = useCallback(async (id: string) => {
      try {
        const response = await apiClient.delete(`${endpoint}/${id}`);
        if (response.error) {
          throw new Error(response.error);
        }
        setData(prev => prev ? prev.filter(item => item['id' as keyof T] !== id) : []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
        throw err;
      }
    }, [endpoint]);

    const refetch = useCallback(async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get<T[]>(endpoint);
        if (response.error) {
          throw new Error(response.error);
        }
        setData(response.data || initialData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
        console.error(`Error refetching ${endpoint}:`, err);
      } finally {
        setIsLoading(false);
      }
    }, [endpoint, initialData]);

    return { data, isLoading, error, addItem, updateItem, deleteItem, refetch };
  };
}

// Specific hooks for each data type
export const useProducts = createApiHook<Product>('products');
export const usePlans = createApiHook<Plan>('plans');
export const useCompanies = createApiHook<Company>('companies');
export const useUsers = createApiHook<User>('users');
export const useLicenses = createApiHook<LicenseKey>('licenses');
export const useDevices = createApiHook<Device>('devices');
export const useInvoices = createApiHook<Invoice>('invoices');
export const useActivityLogs = createApiHook<ActivityLog>('activity-logs');
export const useBanks = createApiHook<Bank>('banks');