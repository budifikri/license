import React, { useState, useMemo } from 'react';
import { useBanks, useActivityLogs } from '../hooks/useApiData';
import { useSortableData } from '../hooks/useSortableData';
import { usePagination } from '../hooks/usePagination';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from './ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import Button from './ui/Button';
import Input from './ui/Input';
import { Loader2, ChevronsUpDown, ArrowUp, ArrowDown } from './icons';
import BankModal from './BankModal';
import ConfirmationDialog from './ConfirmationDialog';
import Pagination from './Pagination';
import type { Bank } from '../types';

const Banks: React.FC = () => {
  const { data: banks, isLoading, addItem, updateItem, deleteItem } = useBanks();
  const { addItem: addActivityLog } = useActivityLogs();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [isModalOpen, setModalOpen] = useState(false);
  const [bankToEdit, setBankToEdit] = useState<Bank | null>(null);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredBanks = useMemo(() => {
    return (banks || []).filter(bank =>
      bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [banks, searchTerm]);
  
  const { items: sortedBanks, requestSort, sortConfig } = useSortableData<Bank>(filteredBanks);
  const { paginatedData: paginatedBanks, ...paginationProps } = usePagination({ data: sortedBanks, itemsPerPage: 10 });

  const getSortIcon = (key: keyof Bank) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronsUpDown className="h-4 w-4 ml-2 opacity-40" />;
    if (sortConfig.direction === 'ascending') return <ArrowUp className="h-4 w-4 ml-2" />;
    return <ArrowDown className="h-4 w-4 ml-2" />;
  };

  const handleOpenModal = (bank: Bank | null = null) => {
    setBankToEdit(bank);
    setModalOpen(true);
  };
  
  const handleSave = (bankData: Omit<Bank, 'id'> | Bank) => {
    if ('id' in bankData) {
      updateItem(bankData);
      // Add activity log for update
    } else {
      addItem(bankData);
      // Add activity log for create
    }
    setModalOpen(false);
    setBankToEdit(null);
  };

  const handleDelete = (id: string) => {
    deleteItem(id);
    setItemToDeleteId(null);
    // Add activity log for delete
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Bank Accounts</h1>
        {isAdmin && <Button onClick={() => handleOpenModal()}>Add New Bank</Button>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Banks</CardTitle>
          <CardDescription>Add, edit, and manage your company's bank accounts for invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
             <Input
              placeholder="Search by bank name or account..."
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
                    <Button variant="ghost" onClick={() => requestSort('name')}>Bank Name {getSortIcon('name')}</Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('accountNumber')}>Account Number {getSortIcon('accountNumber')}</Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('ownerName')}>Owner Name {getSortIcon('ownerName')}</Button>
                  </TableHead>
                  {isAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBanks.length > 0 ? paginatedBanks.map((bank) => (
                  <TableRow key={bank.id}>
                    <TableCell className="font-medium">{bank.name}</TableCell>
                    <TableCell>{bank.accountNumber}</TableCell>
                    <TableCell>{bank.ownerName}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button variant="ghost" size="sm" className="mr-2" onClick={() => handleOpenModal(bank)}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => setItemToDeleteId(bank.id)}>Delete</Button>
                      </TableCell>
                    )}
                  </TableRow>
                )) : (
                   <TableRow>
                    <TableCell colSpan={isAdmin ? 4 : 3} className="text-center">No banks found.</TableCell>
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
      
      <BankModal 
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        bankToEdit={bankToEdit}
      />
      
      <ConfirmationDialog
        isOpen={!!itemToDeleteId}
        onClose={() => setItemToDeleteId(null)}
        onConfirm={() => itemToDeleteId && handleDelete(itemToDeleteId)}
        title="Delete Bank Account"
        description="Are you sure you want to delete this bank account? This action cannot be undone."
      />
    </>
  );
};

export default Banks;