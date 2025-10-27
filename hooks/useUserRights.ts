import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import type { RolePermission, Menu } from '../types';

interface UserRights {
  user: {
    id: string;
    name: string;
    role: {
      id: string;
      name: string;
      description?: string;
    } | null;
  };
  permissions: (RolePermission & { menu: Menu })[];
}

export const useUserRights = (userId: string | null) => {
  const [userRights, setUserRights] = useState<UserRights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchUserRights = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get<UserRights>(`user-rights/${userId}`);
        if (response.error) {
          throw new Error(response.error);
        }
        setUserRights(response.data || null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user rights'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRights();
  }, [userId]);

  return { userRights, isLoading, error };
};