import React, { useMemo } from 'react';
import { useLicenses, useProducts, useInvoices, useUsers, useActivityLogs, useDevices } from '../hooks/useApiData';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Loader2, KeyRound, Box, Users as UsersIcon, Receipt, Monitor } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTime } from '../utils/date';
import type { ActivityLog } from '../types';

type AugmentedActivity = ActivityLog & { userName: string };

const Dashboard: React.FC = () => {
  const { data: licenses, isLoading: licensesLoading } = useLicenses();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: activityLogs, isLoading: activityLogsLoading } = useActivityLogs();
  const { data: devices, isLoading: devicesLoading } = useDevices();
  const { user: currentUser } = useAuth();

  const userMap = useMemo(() => new Map(users?.map(u => [u.id, u.name])), [users]);

  const stats = useMemo(() => {
    let companyFilteredLicenses = licenses || [];
    let companyFilteredInvoices = invoices || [];
    let companyFilteredUsers = users || [];
    let companyFilteredDevices = devices || [];

    // Filter data for different roles
    if (currentUser?.role === 'Manager') {
      const managerCompanyId = currentUser.companyId;
      
      const companyUserIds = new Set((users || []).filter(u => u.companyId === managerCompanyId).map(u => u.id));
      
      companyFilteredLicenses = (licenses || []).filter(l => l.userId && companyUserIds.has(l.userId));
      companyFilteredInvoices = (invoices || []).filter(i => i.companyId === managerCompanyId);
      companyFilteredUsers = (users || []).filter(u => u.companyId === managerCompanyId);
      // For Manager, filter devices by user IDs in their company
      const companyLicenseIds = new Set(companyFilteredLicenses.map(l => l.id));
      companyFilteredDevices = (devices || []).filter(d => companyLicenseIds.has(d.licenseId));
    } else if (currentUser?.role === 'User') {
      // For regular users, only show their own licenses
      companyFilteredLicenses = (licenses || []).filter(l => l.userId === currentUser.id);
      // Regular users don't see invoices or other users in stats
      companyFilteredInvoices = [];
      companyFilteredUsers = [currentUser];
      // For User, filter devices by their own license IDs
      const userLicenseIds = new Set(companyFilteredLicenses.map(l => l.id));
      companyFilteredDevices = (devices || []).filter(d => userLicenseIds.has(d.licenseId));
    } else {
      // For Admin, show all data
      companyFilteredDevices = devices || [];
    }
    
    const activeLicenses = companyFilteredLicenses.filter(l => l.status === 'Active').length || 0;
    const totalRevenue = companyFilteredInvoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.total, 0) || 0;
    const activeDevices = companyFilteredDevices.filter(d => d.isActive).length || 0;
    
    return {
      totalProducts: (products || []).length || 0, // Products are global
      activeLicenses,
      totalUsers: companyFilteredUsers.length || 0,
      totalRevenue,
      activeDevices,
    };
  }, [licenses, products, invoices, users, devices, currentUser]);

  const recentActivities = useMemo(() => {
    if (!activityLogs || !userMap) return [];

    const augmented = activityLogs.map(log => ({
      ...log,
      userName: userMap.get(log.userId) ?? 'Unknown User',
    }));
    
    let logsForRole = augmented;
    // Filter activities based on user role
    if (currentUser?.role === 'Manager') {
      const managerCompanyId = currentUser.companyId;
      const companyUserIds = new Set((users || []).filter(u => u.companyId === managerCompanyId).map(u => u.id));
      logsForRole = augmented.filter(log => companyUserIds.has(log.userId));
    } else if (currentUser?.role === 'User') {
      // For regular users, only show their own activities
      logsForRole = augmented.filter(log => log.userId === currentUser.id);
    }

    return logsForRole
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [activityLogs, userMap, users, currentUser]);

  const isLoading = licensesLoading || productsLoading || invoicesLoading || usersLoading || activityLogsLoading || devicesLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);

  const getActionText = (log: AugmentedActivity) => {
    const actionVerb = {
        create: 'created',
        update: 'updated',
        delete: 'deleted'
    }[log.action];

    return (
        <>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{log.userName}</span> {actionVerb} the {log.entityType.toLowerCase()} <span className="font-semibold text-gray-900 dark:text-gray-100">{log.entityName}</span>.
        </>
    );
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      {currentUser?.role === 'User' ? (
        // Simplified dashboard for regular users
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
              <KeyRound className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeLicenses}</div>
              <p className="text-xs text-muted-foreground">Your active licenses</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeDevices}</div>
              <p className="text-xs text-muted-foreground">Your connected devices</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Full dashboard for Admin and Manager
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">From all paid invoices</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
              <KeyRound className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeLicenses}</div>
              <p className="text-xs text-muted-foreground">Across all products</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">Available for licensing</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">In the system</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeDevices}</div>
              <p className="text-xs text-muted-foreground">Currently connected</p>
            </CardContent>
          </Card>
        </div>
      )}

      {currentUser?.role !== 'User' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>A log of the most recent changes in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivities.length > 0 ? recentActivities.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>{log.userName}</TableCell>
                    <TableCell>{getActionText(log)}</TableCell>
                    <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">No recent activity.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default Dashboard;
