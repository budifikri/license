import React, { useState, useMemo } from 'react';
import { useInvoices, useCompanies, useProducts, usePlans, useActivityLogs, useUsers } from '../hooks/useApiData';
import { useLicenses } from '../hooks/useApiData';
import { useSortableData } from '../hooks/useSortableData';
import { usePagination } from '../hooks/usePagination';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from './ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import { Loader2, ChevronsUpDown, ArrowUp, ArrowDown, Eye, Pencil, Trash2, Check } from './icons';
import InvoiceModal from './InvoiceModal';
import InvoiceViewModal from './InvoiceViewModal';
import ConfirmationDialog from './ConfirmationDialog';
import Pagination from './Pagination';
import type { Invoice, Company, LicenseKey } from '../types';
import { formatDate } from '../utils/date';
import { v4 as uuidv4 } from 'uuid';

type AugmentedInvoice = Invoice & { 
  companyName: string;
  licenseIds: string[];
  userLicenseIds: string[];
  userSpecificLicenseIds: string[];
};

const Invoices: React.FC = () => {
  const { data: invoices, isLoading: invoicesLoading, addItem, updateItem, deleteItem } = useInvoices();
  const { data: companiesData, isLoading: companiesLoading } = useCompanies();
  const { data: productsData } = useProducts();
  const { data: plansData } = usePlans();
  const { data: allLicenses, addItem: addLicenseItem, addMultipleItems: addLicenses, updateItem: updateLicense } = useLicenses();
  const { data: allUsers } = useUsers();
  const { addItem: addActivityLog } = useActivityLogs();
  const { user } = useAuth();
  const isManagerOrAdmin = user?.role === 'Admin' || user?.role === 'Manager';

  const [isModalOpen, setModalOpen] = useState(false);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
  const [invoiceToView, setInvoiceToView] = useState<AugmentedInvoice | null>(null);
  const [licensesForView, setLicensesForView] = useState<LicenseKey[]>([]);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [invoiceNumberFilter, setInvoiceNumberFilter] = useState('');
  const [licenseIdFilter, setLicenseIdFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const companyMap = useMemo(() => new Map(companiesData?.map(c => [c.id, c.name])), [companiesData]);

  // Filter users based on selected company
  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    return !companyFilter 
      ? allUsers 
      : allUsers.filter(u => u.companyId === companyFilter);
  }, [allUsers, companyFilter]);

  const augmentedInvoices = useMemo(() => {
    if (!invoices) return [];
    return invoices.map(invoice => {
      // Get associated licenses for this invoice
      const associatedLicenses = allLicenses?.filter(l => l.invoiceId === invoice.id) || [];
      const licenseIds = associatedLicenses.map(l => l.id);
      
      // Get unique user IDs associated with the licenses in this invoice
      const uniqueUserIds = Array.from(
        new Set(associatedLicenses.map(l => l.userId).filter(Boolean))
      ) as string[];
      
      // Get user-specific licenses (licenses that belong to the current user)
      const userSpecificLicenses = user ? associatedLicenses.filter(l => l.userId === user.id) : [];
      const userSpecificLicenseIds = userSpecificLicenses.map(l => l.id);
      
      return {
        ...invoice,
        companyName: companyMap.get(invoice.companyId) ?? 'Unknown Company',
        licenseIds, // Include all license IDs for filtering
        userLicenseIds: uniqueUserIds, // Include all user IDs associated with licenses in this invoice
        userSpecificLicenseIds // Include only the license IDs that belong to the current user
      };
    });
  }, [invoices, companyMap, allLicenses, user]);


  const filteredInvoices = useMemo(() => {
    if (!augmentedInvoices) return [];
    
    // For users with User role, only show invoices related to their licenses
    const userInvoices = isManagerOrAdmin 
      ? augmentedInvoices 
      : augmentedInvoices.filter(invoice => 
          user && invoice.userSpecificLicenseIds.length > 0
        );
    
    return userInvoices.filter(invoice => {
      const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || invoice.companyName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCompany = !companyFilter || invoice.companyId === companyFilter;
      const matchesStatus = !statusFilter || invoice.status === statusFilter;
      const matchesInvoiceNumber = !invoiceNumberFilter || invoice.invoiceNumber.toLowerCase().includes(invoiceNumberFilter.toLowerCase());
      const matchesLicenseId = !licenseIdFilter || invoice.licenseIds.some(licenseId => licenseId.toLowerCase().includes(licenseIdFilter.toLowerCase()));
      const matchesUser = !userFilter || invoice.userLicenseIds.includes(userFilter);
      return matchesSearch && matchesCompany && matchesStatus && matchesInvoiceNumber && matchesLicenseId && matchesUser;
    });
  }, [augmentedInvoices, searchTerm, companyFilter, statusFilter, invoiceNumberFilter, licenseIdFilter, userFilter, isManagerOrAdmin, user]);
  
  const { items: sortedInvoices, requestSort, sortConfig } = useSortableData<AugmentedInvoice>(filteredInvoices);
  const { paginatedData: paginatedInvoices, ...paginationProps } = usePagination({ data: sortedInvoices, itemsPerPage: 10 });
  
  const getSortIcon = (key: keyof AugmentedInvoice) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronsUpDown className="h-4 w-4 ml-2 opacity-40" />;
    if (sortConfig.direction === 'ascending') return <ArrowUp className="h-4 w-4 ml-2" />;
    return <ArrowDown className="h-4 w-4 ml-2" />;
  };

  const handleOpenModal = (invoice: Invoice | null = null) => {
    setInvoiceToEdit(invoice);
    setModalOpen(true);
  };
  
  const handleOpenViewModal = (invoice: AugmentedInvoice) => {
    const associatedLicenses = allLicenses.filter(l => l.invoiceId === invoice.id);
    setLicensesForView(associatedLicenses);
    setInvoiceToView(invoice);
    setViewModalOpen(true);
  };

  const handleSave = async (invoiceData: Omit<Invoice, 'id'> | Invoice) => {
    const isEditing = 'id' in invoiceData;
    console.log('handleSave called with invoiceData:', invoiceData, 'isEditing:', isEditing);

    const companyUsers = allUsers.filter(u => u.companyId === invoiceData.companyId);
    
    if (companyUsers.length === 0 && invoiceData.lineItems.some(l => l.quantity > 0)) {
        alert("Cannot create licenses as there are no users in the selected company.");
        return;
    }

    if (isEditing) {
        const wasPaidBefore = invoices?.find(inv => inv.id === invoiceData.id)?.status === 'Paid';
        const isNowPaid = invoiceData.status === 'Paid';
        
        console.log('Invoice status change - wasPaidBefore:', wasPaidBefore, 'isNowPaid:', isNowPaid);
        
        // Update the invoice
        await updateItem(invoiceData.id, { status: invoiceData.status });

        // Only update license statuses if the invoice status changed
        if (wasPaidBefore !== isNowPaid) {
            console.log('Invoice status changed, updating licenses...');
            const associatedLicenses = allLicenses.filter(l => l.invoiceId === invoiceData.id);
            console.log('Associated licenses:', associatedLicenses);
            
            for (const license of associatedLicenses) {
                // Check if license has expired based on current time
                const isExpired = license.expiresAt && new Date(license.expiresAt) < new Date();
                console.log(`License ${license.key} is expired: ${isExpired}, current status: ${license.status}`);
                
                let newStatus: LicenseKey['status'];
                if (isExpired) {
                    newStatus = 'Expired';
                } else if (invoiceData.status === 'Paid') {
                    newStatus = 'Active';
                } else {
                    // If invoice is not paid, license should be inactive
                    newStatus = 'Inactive';
                }
                
                console.log(`License ${license.key} will be updated to status: ${newStatus}`);
                if (license.status !== newStatus) {
                    console.log(`Updating license ${license.key} from ${license.status} to ${newStatus}`);
                    try {
                      await updateLicense(license.id, { status: newStatus });
                      console.log(`Successfully updated license ${license.key} status to ${newStatus}`);
                    } catch (error) {
                      console.error(`Error updating license ${license.key}:`, error);
                    }
                } else {
                    console.log(`License ${license.key} status unchanged: ${license.status}`);
                }
            }
        } else {
            console.log('Invoice status did not change, skipping license updates');
        }

        if(user) {
            addActivityLog({
                userId: user.id, action: 'update', entityType: 'Invoice',
                entityName: invoiceData.invoiceNumber, createdAt: new Date().toISOString(),
            });
        }
    } else {
        console.log('Creating new invoice...');
        // Prepare invoice data - ensure proper formatting
        const invoiceToCreate = { 
          ...invoiceData,
          // Server will generate invoice number
          invoiceNumber: undefined, // Let the server handle this
        };

        try {
          // Prepare invoice data - generate invoice number since it's required and format dates properly
          const invoiceToSend = {
            ...invoiceData,
            // Generate invoice number since it's required in the schema
            invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
            // Ensure dates are in proper ISO string format
            issueDate: new Date(invoiceData.issueDate).toISOString(),
            dueDate: new Date(invoiceData.dueDate).toISOString(),
            // Handle bankId properly - null if not needed for payment method
            bankId: invoiceData.paymentMethod === 'Bank' ? invoiceData.bankId : null,
            // Clean up line items to remove temporary IDs
            lineItems: invoiceData.lineItems ? 
              invoiceData.lineItems.map(({ id: tempId, ...item }) => ({ 
                ...item,
                // Calculate total for each line item (quantity * unitPrice)
                total: (item.quantity || 0) * (item.unitPrice || 0)
              })) 
              : []
          };
          
          // Create the invoice first
          const createdInvoice = await addItem(invoiceToSend);
          console.log('Invoice created:', createdInvoice);
          
          // Then create associated licenses based on line items
          if (createdInvoice.lineItems && createdInvoice.lineItems.length > 0) {
            const companyUsers = allUsers?.filter(u => u.companyId === createdInvoice.companyId) || [];
            if (companyUsers.length > 0) {
              for (const item of createdInvoice.lineItems) {
                const plan = plansData?.find(p => p.id === item.planId);
                if (plan) {
                  for (let i = 0; i < item.quantity; i++) {
                    const expiresAtDate = plan.durationDays > 0 ? new Date(new Date(createdInvoice.issueDate).getTime() + plan.durationDays * 24 * 60 * 60 * 1000) : null;
                    const isExpired = expiresAtDate ? expiresAtDate < new Date() : false;
                    
                    // New business rule: if invoice is paid, license is active; if unpaid, license is inactive
                    let status: LicenseKey['status'];
                    if (isExpired) {
                      status = 'Expired';
                    } else if (createdInvoice.status === 'Paid') {
                      status = 'Active';
                    } else {
                      // For Unpaid or Overdue invoices, license should be inactive
                      status = 'Inactive';
                    }

                    const newLicenseData = {
                      key: uuidv4().toUpperCase(),
                      productId: plan.productId,
                      planId: plan.id,
                      userId: companyUsers[0].id,
                      status: status,
                      expiresAt: expiresAtDate ? new Date(expiresAtDate).toISOString() : null,
                      createdAt: new Date(createdInvoice.issueDate).toISOString(),
                      invoiceId: createdInvoice.id,
                    };

                    try {
                      await addLicenseItem(newLicenseData);
                      console.log('Created license:', newLicenseData.key, 'with status:', status);
                    } catch (error) {
                      console.error('Error creating license:', error);
                    }
                  }
                }
              }
            } else {
              console.warn('No users found for the company, skipping license creation');
            }
          }
          
          if(user) {
            try {
              await addActivityLog({
                  userId: user.id, 
                  action: 'create', 
                  entityType: 'Invoice',
                  entityName: createdInvoice.invoiceNumber || createdInvoice.id, 
                  createdAt: new Date().toISOString(),
              });
            } catch (error) {
              console.error('Failed to create activity log:', error);
            }
          }
          
          // Close the modal and reset state
          setModalOpen(false);
          setInvoiceToEdit(null);
        } catch (error) {
          console.error("Error creating invoice:", error);
          alert("Error creating invoice: " + (error as Error).message);
        }
    }
    
    setModalOpen(false);
    setInvoiceToEdit(null);
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    console.log('handleMarkAsPaid called for invoice:', invoice);
    console.log('Current allLicenses data:', allLicenses);
    const updatedInvoice = { ...invoice, status: 'Paid' as const };
    updateItem(updatedInvoice.id, { status: 'Paid' });

    const associatedLicenses = allLicenses.filter(l => l.invoiceId === invoice.id);
    console.log('Found associated licenses for invoice ID', invoice.id, ':', associatedLicenses);
    
    for (const license of associatedLicenses) {
        // Check if license has expired based on current time
        const isExpired = license.expiresAt && new Date(license.expiresAt) < new Date();
        console.log(`License ${license.key} is expired: ${isExpired}, current status: ${license.status}`);
        const newStatus = isExpired ? 'Expired' : 'Active';
        console.log(`License ${license.key} will be updated to status: ${newStatus}`);
        
        if (license.status !== newStatus) {
            console.log(`Updating license ${license.key} from ${license.status} to ${newStatus}`);
            try {
              await updateLicense(license.id, { status: newStatus });
              console.log(`Successfully updated license ${license.key} status to ${newStatus}`);
            } catch (error) {
              console.error(`Error updating license ${license.key}:`, error);
            }
        } else {
            console.log(`License ${license.key} status unchanged: ${license.status}`);
        }
    }

     if(user) {
        console.log('Attempting to create activity log for invoice status update:', {
          userId: user.id, action: 'update', entityType: 'Invoice',
          entityName: invoice.invoiceNumber,
          details: { field: 'Status', from: invoice.status, to: 'Paid' }
        });
        try {
          await addActivityLog({
            userId: user.id, action: 'update', entityType: 'Invoice',
            entityName: invoice.invoiceNumber, createdAt: new Date().toISOString(),
            details: { field: 'Status', from: invoice.status, to: 'Paid' }
          });
          console.log('Activity log created successfully for invoice status update');
        } catch (error) {
          console.error('Failed to create activity log for invoice update (this is non-blocking):', error);
          // Don't throw the error - allow the main operation to succeed
        }
      }
  };
  
  const handleDelete = (id: string) => {
    const invoiceToDelete = invoices?.find(i => i.id === id);
    deleteItem(id);
    if(invoiceToDelete && user) {
        addActivityLog({
          userId: user.id, action: 'delete', entityType: 'Invoice',
          entityName: invoiceToDelete.invoiceNumber, createdAt: new Date().toISOString(),
        });
    }
    setItemToDeleteId(null);
  };
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  
  const isLoading = invoicesLoading || companiesLoading;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Invoices</h1>
        {isManagerOrAdmin && <Button onClick={() => handleOpenModal()}>Create Invoice</Button>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Invoices</CardTitle>
          <CardDescription>View, create, and manage all client invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
            <Input
              placeholder="Search by invoice # or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-sm"
            />
            <Input
              placeholder="Filter by invoice #..."
              value={invoiceNumberFilter}
              onChange={(e) => setInvoiceNumberFilter(e.target.value)}
              className="w-full sm:max-w-sm"
            />
            <Input
              placeholder="Filter by license ID..."
              value={licenseIdFilter}
              onChange={(e) => setLicenseIdFilter(e.target.value)}
              className="w-full sm:max-w-sm"
            />
            <Select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="w-full sm:w-auto">
              <option value="">All Users</option>
              {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
            <Select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="w-full sm:w-auto">
              <option value="">All Companies</option>
              {companiesData?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
             <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-auto">
              <option value="">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Overdue">Overdue</option>
            </Select>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Button variant="ghost" onClick={() => requestSort('invoiceNumber')}>Invoice # {getSortIcon('invoiceNumber')}</Button></TableHead>
                  <TableHead><Button variant="ghost" onClick={() => requestSort('companyName')}>Company {getSortIcon('companyName')}</Button></TableHead>
                  <TableHead><Button variant="ghost" onClick={() => requestSort('dueDate')}>Due Date {getSortIcon('dueDate')}</Button></TableHead>
                  <TableHead><Button variant="ghost" onClick={() => requestSort('total')}>Total {getSortIcon('total')}</Button></TableHead>
                  <TableHead><Button variant="ghost" onClick={() => requestSort('status')}>Status {getSortIcon('status')}</Button></TableHead>
                  {isManagerOrAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedInvoices.length > 0 ? paginatedInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.companyName}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>{formatCurrency(invoice.total)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        invoice.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        invoice.status === 'Overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {invoice.status}
                      </span>
                    </TableCell>
                    {isManagerOrAdmin && (
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenViewModal(invoice)} title="View Invoice"><Eye className="h-4 w-4" /></Button>
                          {invoice.status !== 'Paid' && (
                            <Button variant="ghost" size="icon" onClick={() => handleMarkAsPaid(invoice)} title="Mark as Paid"><Check className="h-4 w-4 text-green-600" /></Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleOpenModal(invoice)} title="Edit Invoice"><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setItemToDeleteId(invoice.id)} title="Delete Invoice"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={isManagerOrAdmin ? 6 : 5} className="text-center">No invoices found.</TableCell>
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
      
      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        invoiceToEdit={invoiceToEdit}
        companies={companiesData || []}
        plans={plansData || []}
        products={productsData || []}
      />
      <InvoiceViewModal
        isOpen={isViewModalOpen}
        onClose={() => setViewModalOpen(false)}
        invoice={invoiceToView}
        company={companiesData?.find(c => c.id === invoiceToView?.companyId) ?? null}
        licenses={licensesForView}
      />
       <ConfirmationDialog
        isOpen={!!itemToDeleteId}
        onClose={() => setItemToDeleteId(null)}
        onConfirm={() => itemToDeleteId && handleDelete(itemToDeleteId)}
        title="Delete Invoice"
        description="Are you sure you want to delete this invoice? This action cannot be undone."
      />
    </>
  );
};

export default Invoices;