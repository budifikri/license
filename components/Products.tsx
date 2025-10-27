import React, { useState, useMemo } from 'react';
import { useProducts, useActivityLogs, usePlans } from '../hooks/useApiData';
import { useSortableData } from '../hooks/useSortableData';
import { usePagination } from '../hooks/usePagination';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from './ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import Button from './ui/Button';
import Input from './ui/Input';
import { Loader2, ChevronsUpDown, ArrowUp, ArrowDown, Eye, PlusCircle, Pencil, Trash2 } from './icons';
import ProductModal from './ProductModal';
import ConfirmationDialog from './ConfirmationDialog';
import ProductPlansListModal from './ProductPlansListModal';
import PlanModal from './PlanModal';
import Pagination from './Pagination';
import type { Product, Plan } from '../types';


const Products: React.FC = () => {
  const { data: products, isLoading, addItem, updateItem, deleteItem } = useProducts();
  const { data: plansData, addItem: addPlan } = usePlans();
  const { addItem: addActivityLog } = useActivityLogs();
  const { user } = useAuth();
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPlanListModalOpen, setPlanListModalOpen] = useState(false);
  const [selectedProductForPlans, setSelectedProductForPlans] = useState<Product | null>(null);
  const [isPlanModalOpen, setPlanModalOpen] = useState(false);
  const [productForNewPlan, setProductForNewPlan] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    return (products || []).filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const { items: sortedProducts, requestSort, sortConfig } = useSortableData<Product>(filteredProducts);
  const { paginatedData: paginatedProducts, ...paginationProps } = usePagination({ data: sortedProducts, itemsPerPage: 10 });

  const getSortIcon = (key: keyof Product) => {
    if (!sortConfig || sortConfig.key !== key) {
        return <ChevronsUpDown className="h-4 w-4 ml-2 opacity-40" />;
    }
    if (sortConfig.direction === 'ascending') {
        return <ArrowUp className="h-4 w-4 ml-2" />;
    }
    return <ArrowDown className="h-4 w-4 ml-2" />;
  };
  
  const handleOpenModal = (product: Product | null = null) => {
    setProductToEdit(product);
    setModalOpen(true);
  };

  const handleOpenPlanListModal = (product: Product) => {
    setSelectedProductForPlans(product);
    setPlanListModalOpen(true);
  };
  
  const handleOpenAddPlanModal = (product: Product) => {
    setProductForNewPlan(product);
    setPlanModalOpen(true);
  };

  const productPlans = useMemo(() => {
      if (!selectedProductForPlans || !plansData) return [];
      return plansData.filter(plan => plan.productId === selectedProductForPlans.id);
  }, [selectedProductForPlans, plansData]);


  const handleSave = (productData: Omit<Product, 'id'> | Product) => {
    if ('id' in productData) {
      updateItem(productData);
      if(user) {
        addActivityLog({
          userId: user.id,
          action: 'update',
          entityType: 'Product',
          entityName: productData.name,
          createdAt: new Date().toISOString(),
          details: null,
        });
      }
    } else {
      addItem(productData);
      if(user) {
        addActivityLog({
          userId: user.id,
          action: 'create',
          entityType: 'Product',
          entityName: productData.name,
          createdAt: new Date().toISOString(),
          details: null,
        });
      }
    }
    setModalOpen(false);
    setProductToEdit(null);
  };
  
  const handleSavePlan = (planData: Omit<Plan, 'id'> | Plan) => {
    if (!('id' in planData)) {
      addPlan(planData);
      if (user) {
        addActivityLog({
          userId: user.id,
          action: 'create',
          entityType: 'Plan',
          entityName: `${planData.name} for ${productForNewPlan?.name}`,
          createdAt: new Date().toISOString(),
          details: null,
        });
      }
    }
    setPlanModalOpen(false);
    setProductForNewPlan(null);
  };

  const handleDelete = (id: string) => {
    const productToDelete = products?.find(p => p.id === id);
    deleteItem(id);
    if(productToDelete && user) {
       addActivityLog({
          userId: user.id,
          action: 'delete',
          entityType: 'Product',
          entityName: productToDelete.name,
          createdAt: new Date().toISOString(),
          details: null
        });
    }
    setItemToDeleteId(null);
  };

  const canManage = user?.role === 'Admin' || user?.role === 'Manager';
  const isAdmin = user?.role === 'Admin';

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        {isAdmin && <Button onClick={() => handleOpenModal()}>Add New Product</Button>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Products</CardTitle>
          <CardDescription>Add, edit, and manage your software products.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
             <Input
              placeholder="Search by name or description..."
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
                    <Button variant="ghost" onClick={() => requestSort('name')}>
                        Name {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('description')}>
                        Description {getSortIcon('description')}
                    </Button>
                  </TableHead>
                  {canManage && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.length > 0 ? paginatedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.description}</TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenPlanListModal(product)} title="View Plans">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => handleOpenAddPlanModal(product)} title="Add Plan">
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleOpenModal(product)} title="Edit Product">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => setItemToDeleteId(product.id)} title="Delete Product">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )) : (
                   <TableRow>
                    <TableCell colSpan={canManage ? 3 : 2} className="text-center">No products found.</TableCell>
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
      
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        productToEdit={productToEdit}
      />
      
      <ConfirmationDialog
        isOpen={!!itemToDeleteId}
        onClose={() => setItemToDeleteId(null)}
        onConfirm={() => itemToDeleteId && handleDelete(itemToDeleteId)}
        title="Delete Product"
        description="Are you sure you want to delete this product? This will also affect associated plans and licenses. This action cannot be undone."
      />

      <ProductPlansListModal
        isOpen={isPlanListModalOpen}
        onClose={() => setPlanListModalOpen(false)}
        product={selectedProductForPlans}
        plans={productPlans}
        onPurchaseLicense={(productId) => {
          // Set the productId and change the page to product-license
          // We need to use window.location to navigate since setActivePage is in App.tsx
          // For now, we'll update the URL manually and assume App.tsx will handle it
          window.history.pushState({}, '', `/product_license?productId=${productId}`);
          
          // Update the state in App to navigate to the page
          // Since we can't access setActivePage directly, we'll need to use a custom event
          // Or update the App component to check for URL parameters on load
          const event = new CustomEvent('navigateToProductLicense', { detail: { productId } });
          window.dispatchEvent(event);
        }}
      />
      
      <PlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setPlanModalOpen(false)}
        onSave={handleSavePlan}
        planToEdit={null}
        products={products || []}
        defaultProductId={productForNewPlan?.id}
      />
    </>
  );
};

export default Products;