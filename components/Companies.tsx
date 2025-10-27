import React, { useState, useMemo } from 'react';
import { useCompanies, useActivityLogs, useUsers, useLicenses, useProducts, usePlans } from '../hooks/useApiData';
import { useSortableData } from '../hooks/useSortableData';
import { usePagination } from '../hooks/usePagination';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from './ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import Button from './ui/Button';
import Input from './ui/Input';
import { Loader2, ChevronsUpDown, ArrowUp, ArrowDown, Eye } from './icons';
import CompanyModal from './CompanyModal';
import ConfirmationDialog from './ConfirmationDialog';
import CompanyLicenseListModal from './CompanyLicenseListModal';
import Pagination from './Pagination';
import type { Company, ActivityLog, LicenseKey } from '../types';
import { formatDate } from '../utils/date';

const Companies: React.FC = () => {
  const { data: companies, isLoading: companiesLoading, addItem, updateItem, deleteItem } = useCompanies();
  const { data: usersData } = useUsers();
  const { data: licensesData } = useLicenses();
  const { data: productsData } = useProducts();
  const { data: plansData } = usePlans();
  const { addItem: addActivityLog } = useActivityLogs();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [isModalOpen, setModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLicenseListModalOpen, setLicenseListModalOpen] = useState(false);
  const [selectedCompanyForLicenses, setSelectedCompanyForLicenses] = useState<Company | null>(null);
  
  const filteredCompanies = useMemo(() => {
    return (companies || []).filter(company =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companies, searchTerm]);
  
  const { items: sortedCompanies, requestSort, sortConfig } = useSortableData<Company>(filteredCompanies);
  const { paginatedData: paginatedCompanies, ...paginationProps } = usePagination({ data: sortedCompanies, itemsPerPage: 10 });

  const getSortIcon = (key: keyof Company) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronsUpDown className="h-4 w-4 ml-2 opacity-40" />;
    if (sortConfig.direction === 'ascending') return <ArrowUp className="h-4 w-4 ml-2" />;
    return <ArrowDown className="h-4 w-4 ml-2" />;
  };

  const handleOpenModal = (company: Company | null = null) => {
    setCompanyToEdit(company);
    setModalOpen(true);
  };
  
  const handleSave = (companyData: Omit<Company, 'id'> | Company) => {
    if ('id' in companyData) {
      updateItem(companyData);
      if (user) {
        addActivityLog({
          userId: user.id,
          action: 'update',
          entityType: 'Company',
          entityName: companyData.name,
          createdAt: new Date().toISOString(),
          details: null,
        });
      }
    } else {
      addItem(companyData);
       if (user) {
        addActivityLog({
          userId: user.id,
          action: 'create',
          entityType: 'Company',
          entityName: companyData.name,
          createdAt: new Date().toISOString(),
          details: null,
        });
      }
    }
    setModalOpen(false);
    setCompanyToEdit(null);
  };

  const handleDelete = (id: string) => {
    const companyToDelete = companies?.find(c => c.id === id);
    deleteItem(id);
    if (companyToDelete && user) {
      addActivityLog({
        userId: user.id,
        action: 'delete',
        entityType: 'Company',
        entityName: companyToDelete.name,
        createdAt: new Date().toISOString(),
        details: null,
      });
    }
    setItemToDeleteId(null);
  };
  
  const handleOpenLicenseListModal = (company: Company) => {
    setSelectedCompanyForLicenses(company);
    setLicenseListModalOpen(true);
  };

  const companyLicenses = useMemo(() => {
    if (!selectedCompanyForLicenses || !usersData || !licensesData || !productsData || !plansData) return [];
    
    const companyUserIds = new Set(usersData.filter(u => u.companyId === selectedCompanyForLicenses.id).map(u => u.id));
    
    return licensesData
      .filter(license => license.userId && companyUserIds.has(license.userId))
      .map(license => {
          const product = productsData.find(p => p.id === license.productId);
          const plan = plansData.find(p => p.id === license.planId);
          return {
              ...license,
              productName: product?.name || 'Unknown',
              planName: plan?.name || 'Unknown',
          }
      });
  }, [selectedCompanyForLicenses, usersData, licensesData, productsData, plansData]);

  const isLoading = companiesLoading;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Companies</h1>
        {isAdmin && <Button onClick={() => handleOpenModal()}>Add New Company</Button>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Companies</CardTitle>
          <CardDescription>View, add, and edit client companies.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
             <Input
              placeholder="Search by company name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('name')}>Name {getSortIcon('name')}</Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('createdAt')}>Created At {getSortIcon('createdAt')}</Button>
                  </TableHead>
                  {isAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCompanies.length > 0 ? paginatedCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{formatDate(company.createdAt)}</TableCell>
                    {isAdmin && (
                      <TableCell className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenLicenseListModal(company)} title="View Licenses">
                           <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(company)}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => setItemToDeleteId(company.id)}>Delete</Button>
                      </TableCell>
                    )}
                  </TableRow>
                )) : (
                   <TableRow>
                    <TableCell colSpan={isAdmin ? 3 : 2} className="text-center">No companies found.</TableCell>
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
      
      <CompanyModal 
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        companyToEdit={companyToEdit}
      />
      
      <ConfirmationDialog
        isOpen={!!itemToDeleteId}
        onClose={() => setItemToDeleteId(null)}
        onConfirm={() => itemToDeleteId && handleDelete(itemToDeleteId)}
        title="Delete Company"
        description="Are you sure you want to delete this company? This action cannot be undone."
      />
      
      <CompanyLicenseListModal
        isOpen={isLicenseListModalOpen}
        onClose={() => setLicenseListModalOpen(false)}
        company={selectedCompanyForLicenses}
        licenses={companyLicenses}
      />
    </>
  );
};

export default Companies;