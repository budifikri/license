import React, { useState, useMemo } from 'react';
import { useLicenses, useProducts, usePlans, useActivityLogs, useInvoices } from '../hooks/useApiData';
import { useSortableData } from '../hooks/useSortableData';
import { usePagination } from '../hooks/usePagination';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from './ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import { Loader2, ChevronsUpDown, ArrowUp, ArrowDown } from './icons';

import LicenseModal from './LicenseModal';
import ConfirmationDialog from './ConfirmationDialog';
import DeviceListModal from './DeviceListModal';
import Pagination from './Pagination';
import type { LicenseKey, Plan, ActivityLog } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { formatDate } from '../utils/date';

type AugmentedLicense = LicenseKey & { 
  productName: string; 
  planName: string;
  invoiceNumber: string;
};

const Licenses: React.FC = () => {
  const { data: licenses, isLoading: licensesLoading, error: licensesError, addItem, updateItem, deleteItem } = useLicenses();
  const { data: productsData, isLoading: productsLoading, error: productsError } = useProducts();
  const { data: plansData, isLoading: plansLoading, error: plansError } = usePlans();
  const { data: invoicesData, isLoading: invoicesLoading, error: invoicesError, addItem: addInvoice } = useInvoices();
  const { data: activityLogsData, isLoading: activityLogsLoading, error: activityLogsError, addItem: addActivityLog } = useActivityLogs();
  const { user } = useAuth();
  const isManagerOrAdmin = user?.role === 'Admin' || user?.role === 'Manager';

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [licenseToEdit, setLicenseToEdit] = useState<AugmentedLicense | null>(null);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [isDeviceListModalOpen, setDeviceListModalOpen] = useState(false);
  const [selectedLicenseForDevices, setSelectedLicenseForDevices] = useState<AugmentedLicense | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const productMap = useMemo(() => new Map(productsData?.map(p => [p.id, p.name])), [productsData]);
  const planMap = useMemo(() => new Map(plansData?.map(p => [p.id, p])), [plansData]);
  const invoiceMap = useMemo(() => new Map(invoicesData?.map(i => [i.id, i.invoiceNumber])), [invoicesData]);
  
  const augmentedLicenses = useMemo(() => {
    if (!licenses) return [];
    
    // Filter licenses by userId for non-admin/non-manager users
    let userLicenses = licenses;
    if (user?.role !== 'Admin' && user?.role !== 'Manager') {
      userLicenses = licenses.filter(license => license.userId === user?.id);
    }
    
    return userLicenses.map(license => ({
        ...license,
        productName: productMap.get(license.productId) ?? 'Unknown',
        planName: planMap.get(license.planId)?.name ?? 'Unknown',
        invoiceNumber: license.invoiceId ? invoiceMap.get(license.invoiceId) ?? 'N/A' : 'N/A',
    }));
  }, [licenses, productMap, planMap, invoiceMap, user]);


  const filteredLicenses = useMemo(() => {
    if (!augmentedLicenses) return [];
    return augmentedLicenses.filter(license => {
      const matchesSearch = license.key.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProduct = !productFilter || license.productId === productFilter;
      const matchesPlan = !planFilter || license.planId === planFilter;
      const matchesStatus = !statusFilter || license.status === statusFilter;
      
      // For regular users, only show active licenses
      const matchesActiveStatus = user?.role === 'User' ? license.status === 'Active' : true;

      return matchesSearch && matchesProduct && matchesPlan && matchesStatus && matchesActiveStatus;
    });
  }, [augmentedLicenses, searchTerm, productFilter, planFilter, statusFilter, user]);
  
  const { items: sortedLicenses, requestSort, sortConfig } = useSortableData<AugmentedLicense>(filteredLicenses);
  const { paginatedData: paginatedLicenses, ...paginationProps } = usePagination({ data: sortedLicenses, itemsPerPage: 10 });
  
  const getSortIcon = (key: keyof AugmentedLicense) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronsUpDown className="h-4 w-4 ml-2 opacity-40" />;
    if (sortConfig.direction === 'ascending') return <ArrowUp className="h-4 w-4 ml-2" />;
    return <ArrowDown className="h-4 w-4 ml-2" />;
  };

  const handleOpenEditModal = (license: AugmentedLicense) => {
    setLicenseToEdit(license);
    setEditModalOpen(true);
  };

  const handleOpenDeviceListModal = (license: AugmentedLicense) => {
    setSelectedLicenseForDevices(license);
    setDeviceListModalOpen(true);
  };

  const handleSaveLicense = async (updatedLicense: LicenseKey) => {
    const finalLicense = { ...updatedLicense };

    // Automatically set status to 'Expired' if the license is active but the expiry date has passed.
    if (finalLicense.status === 'Active' && finalLicense.expiresAt && new Date(finalLicense.expiresAt) < new Date()) {
      finalLicense.status = 'Expired';
    }
    
    try {
      await updateItem(finalLicense.id, finalLicense);
      if(user) {
         await addActivityLog({
            userId: user.id,
            action: 'update',
            entityType: 'License',
            entityName: finalLicense.key.substring(0, 8) + '...',
            details: null
          });
      }
      setEditModalOpen(false);
      setLicenseToEdit(null);
    } catch (error) {
      console.error("Error updating license:", error);
    }
  };

  const handleGenerate = async (data: { productId: string; planId: string; count: number }) => {
    const plan = plansData?.find(p => p.id === data.planId);
    if (!plan) return;
    
    try {
      for (let i = 0; i < data.count; i++) {
        const hasExpiry = plan.durationDays > 0;
        const newLicense = {
          key: uuidv4().toUpperCase(),
          productId: data.productId,
          planId: data.planId,
          status: 'Active',
          expiresAt: hasExpiry ? new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000) : null,
        };
        
        await addItem(newLicense);
      }
      
      if (user) {
        const productName = productsData?.find(p => p.id === data.productId)?.name;
        if (plan && productName) {
          console.log('Attempting to create activity log for license generation:', {
             userId: user.id,
             action: 'create',
             entityType: 'License',
             entityName: `${data.count} keys for ${productName} - ${plan.name}`,
             details: null
          });
          try {
            await addActivityLog({
               userId: user.id,
               action: 'create',
               entityType: 'License',
               entityName: `${data.count} keys for ${productName} - ${plan.name}`,
               details: null
           });
           console.log('Activity log created successfully for license generation');
          } catch (error) {
            console.error('Failed to create activity log (this is non-blocking):', error);
            // Don't throw the error - allow the main operation to succeed
          }
        }
      }
  
      setGenerateModalOpen(false);
    } catch (error) {
      console.error("Error generating licenses:", error);
    }
  };
  
  const handleDelete = async (id: string) => {
    const licenseToDelete = licenses?.find(l => l.id === id);
    try {
      await deleteItem(id);
      if(licenseToDelete && user) {
      console.log('Attempting to create activity log for license deletion:', {
        userId: user.id,
        action: 'delete',
        entityType: 'License',
        entityName: licenseToDelete.key.substring(0, 8) + '...',
        details: null
      });
      try {
        await addActivityLog({
          userId: user.id,
          action: 'delete',
          entityType: 'License',
          entityName: licenseToDelete.key.substring(0, 8) + '...',
          details: null
        });
        console.log('Activity log created successfully for license deletion');
      } catch (error) {
        console.error('Failed to create activity log for deletion (this is non-blocking):', error);
        // Don't throw the error - allow the main operation to succeed
      }
    }
      setItemToDeleteId(null);
    } catch (error) {
      console.error("Error deleting license:", error);
    }
  };




  const isLoading = licensesLoading || productsLoading || plansLoading || invoicesLoading || activityLogsLoading;
  const hasError = licensesError || productsError || plansError || invoicesError || activityLogsError;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Licenses</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage License Keys</CardTitle>
          <CardDescription>View and manage all license keys.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
            <Input
              placeholder="Search by license key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-sm"
            />
            <Select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="w-full sm:w-auto">
              <option value="">All Products</option>
              {productsData?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
            <Select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="w-full sm:w-auto">
              <option value="">All Plans</option>
              {plansData?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
             <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-auto">
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Expired">Expired</option>
            </Select>
          </div>
          {hasError && (
            <div className="p-4 text-red-500 bg-red-50 rounded-lg">
              <p>Error loading data: {(licensesError || productsError || plansError || invoicesError || activityLogsError)?.message}</p>
              <p>Please check your database connection.</p>
            </div>
          )}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !hasError && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('key')}>License Key {getSortIcon('key')}</Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('invoiceNumber')}>Invoice # {getSortIcon('invoiceNumber')}</Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('productName')}>Product {getSortIcon('productName')}</Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('planName')}>Plan {getSortIcon('planName')}</Button>
                  </TableHead>
                  <TableHead>
                    Devices
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('status')}>Status {getSortIcon('status')}</Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('createdAt')}>Created At {getSortIcon('createdAt')}</Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('expiresAt')}>Expires At {getSortIcon('expiresAt')}</Button>
                  </TableHead>
                  {isManagerOrAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLicenses.length > 0 ? paginatedLicenses.map((license) => {
                  const deviceLimit = planMap.get(license.planId)?.deviceLimit;
                  return (
                  <TableRow key={license.id}>
                    <TableCell className="font-mono text-xs break-all">{license.key}</TableCell>
                    <TableCell>{license.invoiceNumber}</TableCell>
                    <TableCell>{license.productName}</TableCell>
                    <TableCell>{license.planName}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{`${license.devices?.length || 0} / ${deviceLimit}`}</span>
                        <Button variant="outline" size="sm" className="h-8" onClick={() => handleOpenDeviceListModal(license)}>
                          View
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        license.status === 'Active' ? 'bg-green-100 text-green-800' :
                        license.status === 'Expired' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {license.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {formatDate(license.createdAt)}
                    </TableCell>
                    <TableCell>
                      {license.expiresAt ? formatDate(license.expiresAt) : 'Never'}
                    </TableCell>
                    {isManagerOrAdmin && (
                      <TableCell>
                        <Button variant="ghost" size="sm" className="mr-2" onClick={() => handleOpenEditModal(license)}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => setItemToDeleteId(license.id)}>Delete</Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              }) : (
                  <TableRow>
                    <TableCell colSpan={isManagerOrAdmin ? 9 : 8} className="text-center">No licenses found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter>
          <Pagination {...paginationProps} />
        </CardFooter>
      </Card>
      

      <LicenseModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveLicense}
        licenseToEdit={licenseToEdit}
      />
       <ConfirmationDialog
        isOpen={!!itemToDeleteId}
        onClose={() => setItemToDeleteId(null)}
        onConfirm={() => itemToDeleteId && handleDelete(itemToDeleteId)}
        title="Delete License Key"
        description="Are you sure you want to delete this license key? This action cannot be undone."
      />
      <DeviceListModal
        isOpen={isDeviceListModalOpen}
        onClose={() => setDeviceListModalOpen(false)}
        license={selectedLicenseForDevices}
      />
    </>
  );
};

export default Licenses;