import React, { useState, useEffect, useMemo } from 'react';
import type { Product, Plan } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/Dialog';
import Button from './ui/Button';
import Label from './ui/Label';
import Input from './ui/Input';
import Select from './ui/Select';

interface GenerateLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: { productId: string; planId: string; count: number }) => void;
  products: Product[];
  plans: Plan[];
}

const GenerateLicenseModal: React.FC<GenerateLicenseModalProps> = ({ isOpen, onClose, onGenerate, products, plans }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [count, setCount] = useState<number>(1);

  const filteredPlans = useMemo(() => {
    if (!selectedProductId) return [];
    return plans.filter(plan => plan.productId === selectedProductId);
  }, [selectedProductId, plans]);

  useEffect(() => {
    if (isOpen) {
      if (products.length > 0) {
        setSelectedProductId(products[0].id);
      } else {
        setSelectedProductId('');
      }
      setCount(1);
    }
  }, [isOpen, products]);

  useEffect(() => {
    if (filteredPlans.length > 0) {
      setSelectedPlanId(filteredPlans[0].id);
    } else {
      setSelectedPlanId('');
    }
  }, [filteredPlans]);

  const handleSubmit = () => {
    if (!selectedProductId || !selectedPlanId || count < 1) {
        alert("Please select a product, plan, and enter a valid count.");
        return;
    }
    onGenerate({
      productId: selectedProductId,
      planId: selectedPlanId,
      count: Number(count),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle>Generate New Licenses</DialogTitle>
          <DialogDescription>
            Select a product and plan to generate one or more new license keys.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 p-6 pt-0">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="product" className="text-right">Product</Label>
            <Select 
              id="product" 
              value={selectedProductId} 
              onChange={e => setSelectedProductId(e.target.value)} 
              className="col-span-3" 
              disabled={products.length === 0}
            >
              {products.length > 0 ? (
                products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
              ) : (
                <option>No products available</option>
              )}
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="plan" className="text-right">Plan</Label>
            <Select 
              id="plan" 
              value={selectedPlanId} 
              onChange={e => setSelectedPlanId(e.target.value)} 
              className="col-span-3" 
              disabled={filteredPlans.length === 0}
            >
              {filteredPlans.length > 0 ? (
                filteredPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
              ) : (
                <option>No plans for this product</option>
              )}
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="count" className="text-right">Number of Keys</Label>
            <Input 
              id="count" 
              type="number" 
              min="1" 
              value={count} 
              onChange={e => setCount(Number(e.target.value))} 
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Generate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateLicenseModal;