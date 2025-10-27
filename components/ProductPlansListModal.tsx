import React from 'react';
import type { Product, Plan } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/Dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import Button from './ui/Button';

interface ProductPlansListModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  plans: Plan[];
  onPurchaseLicense?: (productId: string) => void; // Optional function to handle purchase
}

interface ProductPlansListModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  plans: Plan[];
  onPurchaseLicense?: (productId: string) => void; // Optional function to handle purchase
}

const ProductPlansListModal: React.FC<ProductPlansListModalProps> = ({ isOpen, onClose, product, plans, onPurchaseLicense }) => {
  if (!product) return null;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);

  const handlePurchase = () => {
    if (product && onPurchaseLicense) {
      onPurchaseLicense(product.id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle>Plans for {product.name}</DialogTitle>
          <DialogDescription>
            Showing all pricing plans available for this product.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-0 max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Device Limit</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length > 0 ? plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{formatCurrency(plan.price)}</TableCell>
                  <TableCell>{plan.deviceLimit}</TableCell>
                  <TableCell>{plan.durationDays === 0 ? 'Permanent' : `${plan.durationDays} days`}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No plans found for this product.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <div className="flex w-full justify-between">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={handlePurchase}>Purchase License</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductPlansListModal;
