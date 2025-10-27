import React, { useState, useMemo } from 'react';
import { usePlans, useProducts, useActivityLogs } from '../hooks/useApiData';
import { useSortableData } from '../hooks/useSortableData';
import { usePagination } from '../hooks/usePagination';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from './ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import { Loader2, ChevronsUpDown, ArrowUp, ArrowDown } from './icons';
import PlanModal from './PlanModal';
import ConfirmationDialog from './ConfirmationDialog';
import Pagination from './Pagination';
import type { Plan, ActivityLog } from '../types';

type AugmentedPlan = Plan & { productName: string; };

const Plans: React.FC = () => {
  const { data: plans, isLoading: plansLoading, addItem, updateItem, deleteItem } = usePlans();
  const { data: productsData, isLoading: productsLoading } = useProducts();
  const { addItem: addActivityLog } = useActivityLogs();
  const { user } = useAuth();

  const [isModalOpen, setModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<Plan | null>(null);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('');


  const productMap = useMemo(() => new Map(productsData?.map(p => [p.id, p.name])), [productsData]);

  const augmentedPlans = useMemo(() => {
    return (plans || []).map(plan => ({
      ...plan,
      productName: productMap.get(plan.productId) ?? 'Unknown',
    }));
  }, [plans, productMap]);

  const filteredPlans = useMemo(() => {
    return augmentedPlans.filter(plan => {
      const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProduct = !productFilter || plan.productId === productFilter;
      return matchesSearch && matchesProduct;
    });
  }, [augmentedPlans, searchTerm, productFilter]);

  const { items: sortedPlans, requestSort, sortConfig } = useSortableData<AugmentedPlan>(filteredPlans);
  const { paginatedData: paginatedPlans, ...paginationProps } = usePagination({ data: sortedPlans, itemsPerPage: 10 });
  
  const getSortIcon = (key: keyof AugmentedPlan) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronsUpDown className="h-4 w-4 ml-2 opacity-40" />;
    if (sortConfig.direction === 'ascending') return <ArrowUp className="h-4 w-4 ml-2" />;
    return <ArrowDown className="h-4 w-4 ml-2" />;
  };

  const handleOpenModal = (plan: Plan | null = null) => {
    setPlanToEdit(plan);
    setModalOpen(true);
  };
  
  const handleSave = (planData: Omit<Plan, 'id'> | Plan) => {
    if ('id' in planData) {
      updateItem(planData);
      if (user) {
        addActivityLog({
          userId: user.id,
          action: 'update',
          entityType: 'Plan',
          entityName: planData.name,
          createdAt: new Date().toISOString(),
          details: null,
        });
      }
    } else {
      addItem(planData);
      if (user) {
        addActivityLog({
          userId: user.id,
          action: 'create',
          entityType: 'Plan',
          entityName: planData.name,
          createdAt: new Date().toISOString(),
          details: null,
        });
      }
    }
    setModalOpen(false);
    setPlanToEdit(null);
  };

  const handleDelete = (id: string) => {
    const planToDelete = plans?.find(p => p.id === id);
    deleteItem(id);
    if (planToDelete && user) {
      addActivityLog({
        userId: user.id,
        action: 'delete',
        entityType: 'Plan',
        entityName: planToDelete.name,
        createdAt: new Date().toISOString(),
        details: null,
      });
    }
    setItemToDeleteId(null);
  };

  const isLoading = plansLoading || productsLoading;
  const canManage = user?.role === 'Admin' || user?.role === 'Manager';
  const isAdmin = user?.role === 'Admin';


  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Plans</h1>
        {isAdmin && <Button onClick={() => handleOpenModal()}>Add New Plan</Button>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Plans</CardTitle>
          <CardDescription>Create and manage pricing plans for your products.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
             <Input
              placeholder="Search by plan name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-sm"
            />
            <Select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="w-full sm:w-auto">
              <option value="">All Products</option>
              {productsData?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
                     <Button variant="ghost" onClick={() => requestSort('productName')}>Product {getSortIcon('productName')}</Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('price')}>Price {getSortIcon('price')}</Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('deviceLimit')}>Device Limit {getSortIcon('deviceLimit')}</Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('durationDays')}>Duration {getSortIcon('durationDays')}</Button>
                  </TableHead>
                  {canManage && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPlans.length > 0 ? paginatedPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>{plan.productName}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        maximumFractionDigits: 0,
                      }).format(plan.price)}
                    </TableCell>
                    <TableCell>{plan.deviceLimit}</TableCell>
                    <TableCell>{plan.durationDays === 0 ? 'Permanent' : `${plan.durationDays} days`}</TableCell>
                    {canManage && (
                      <TableCell>
                        <Button variant="ghost" size="sm" className="mr-2" onClick={() => handleOpenModal(plan)}>Edit</Button>
                        {isAdmin && <Button variant="destructive" size="sm" onClick={() => setItemToDeleteId(plan.id)}>Delete</Button>}
                      </TableCell>
                    )}
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={canManage ? 6 : 5} className="text-center">No plans found.</TableCell>
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
      
      <PlanModal 
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        planToEdit={planToEdit}
        products={productsData || []}
      />

       <ConfirmationDialog
        isOpen={!!itemToDeleteId}
        onClose={() => setItemToDeleteId(null)}
        onConfirm={() => itemToDeleteId && handleDelete(itemToDeleteId)}
        title="Delete Plan"
        description="Are you sure you want to delete this plan? This action cannot be undone."
      />
    </>
  );
};

export default Plans;