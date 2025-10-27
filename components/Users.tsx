import React, { useState, useMemo } from 'react';
import { useUsers, useCompanies, useActivityLogs } from '../hooks/useApiData';
import { useSortableData } from '../hooks/useSortableData';
import { usePagination } from '../hooks/usePagination';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from './ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import { Loader2, ChevronsUpDown, ArrowUp, ArrowDown } from './icons';
import UserModal from './UserModal';
import ConfirmationDialog from './ConfirmationDialog';
import Pagination from './Pagination';
import type { User, ActivityLog } from '../types';

type AugmentedUser = User & { companyName: string; };

const Users: React.FC = () => {
  const { data: users, isLoading: usersLoading, addItem, updateItem, deleteItem } = useUsers();
  const { data: companiesData, isLoading: companiesLoading } = useCompanies();
  const { addItem: addActivityLog } = useActivityLogs();
  const { user: currentUser } = useAuth();

  const [isModalOpen, setModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const companyMap = useMemo(() => new Map(companiesData?.map(c => [c.id, c.name])), [companiesData]);

  const augmentedUsers = useMemo(() => {
    return (users || []).map(user => ({
        ...user,
        companyName: companyMap.get(user.companyId) ?? 'N/A',
    }));
  }, [users, companyMap]);

  const filteredUsers = useMemo(() => {
    if (!augmentedUsers || !currentUser) return [];
    
    let usersForRole = augmentedUsers;
    if (currentUser.role === 'Manager') {
        usersForRole = augmentedUsers.filter(user => user.companyId === currentUser.companyId);
    }

    return usersForRole.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCompany = !companyFilter || user.companyId === companyFilter;
      const matchesRole = !roleFilter || user.role === roleFilter;
      return matchesSearch && matchesCompany && matchesRole;
    });
  }, [augmentedUsers, searchTerm, companyFilter, roleFilter, currentUser]);

  const { items: sortedUsers, requestSort, sortConfig } = useSortableData<AugmentedUser>(filteredUsers);
  const { paginatedData: paginatedUsers, ...paginationProps } = usePagination({ data: sortedUsers, itemsPerPage: 10 });
  
  const getSortIcon = (key: keyof AugmentedUser) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronsUpDown className="h-4 w-4 ml-2 opacity-40" />;
    if (sortConfig.direction === 'ascending') return <ArrowUp className="h-4 w-4 ml-2" />;
    return <ArrowDown className="h-4 w-4 ml-2" />;
  };

  const handleOpenModal = (user: User | null = null) => {
    setUserToEdit(user);
    setModalOpen(true);
  };
  
  const handleSave = (userData: Omit<User, 'id' | 'createdAt'> | User) => {
      if ('id' in userData) {
        // Extract id and get remaining properties for update
        const { id, ...updateData } = userData;
        updateItem(id, updateData);
        if (currentUser) {
            addActivityLog({
                userId: currentUser.id,
                action: 'update',
                entityType: 'User',
                entityName: userData.name,
                createdAt: new Date().toISOString(),
                details: null,
            });
        }
      } else {
        const newUserWithDate = { ...userData, createdAt: new Date().toISOString() };
        addItem(newUserWithDate);
        if (currentUser) {
            addActivityLog({
                userId: currentUser.id,
                action: 'create',
                entityType: 'User',
                entityName: userData.name,
                createdAt: new Date().toISOString(),
                details: null,
            });
        }
      }
      setModalOpen(false);
      setUserToEdit(null);
  };

  const handleDelete = (id: string) => {
    const userToDelete = users?.find(u => u.id === id);
    deleteItem(id);
    if (userToDelete && currentUser) {
        addActivityLog({
            userId: currentUser.id,
            action: 'delete',
            entityType: 'User',
            entityName: userToDelete.name,
            createdAt: new Date().toISOString(),
            details: null,
        });
    }
    setItemToDeleteId(null);
  };

  const isLoading = usersLoading || companiesLoading;
  const canManageUsers = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Users</h1>
        {canManageUsers && <Button onClick={() => handleOpenModal()}>Add New User</Button>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
          <CardDescription>Add, edit, and manage user accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
             <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-sm"
            />
            {currentUser?.role === 'Admin' && (
                <Select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="w-full sm:w-auto">
                    <option value="">All Companies</option>
                    {companiesData?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
            )}
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full sm:w-auto">
              <option value="">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="User">User</option>
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
                  <TableHead>
                     <Button variant="ghost" onClick={() => requestSort('name')}>Name {getSortIcon('name')}</Button>
                  </TableHead>
                  <TableHead>
                     <Button variant="ghost" onClick={() => requestSort('email')}>Email {getSortIcon('email')}</Button>
                  </TableHead>
                  <TableHead>
                     <Button variant="ghost" onClick={() => requestSort('role')}>Role {getSortIcon('role')}</Button>
                  </TableHead>
                  <TableHead>
                     <Button variant="ghost" onClick={() => requestSort('companyName')}>Company {getSortIcon('companyName')}</Button>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.length > 0 ? paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.companyName}</TableCell>
                    <TableCell>
                       {currentUser?.role === 'Admin' || (currentUser?.role === 'Manager' && user.id !== currentUser.id && user.role === 'User') ? (
                          <Button variant="ghost" size="sm" className="mr-2" onClick={() => handleOpenModal(user)}>Edit</Button>
                       ) : null}
                       {currentUser?.role === 'Admin' && user.id !== currentUser.id && (
                          <Button variant="destructive" size="sm" onClick={() => setItemToDeleteId(user.id)}>Delete</Button>
                       )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No users found.</TableCell>
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

      <UserModal 
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        userToEdit={userToEdit}
        companies={companiesData || []}
      />
      
       <ConfirmationDialog
        isOpen={!!itemToDeleteId}
        onClose={() => setItemToDeleteId(null)}
        onConfirm={() => itemToDeleteId && handleDelete(itemToDeleteId)}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
      />
    </>
  );
};

export default Users;