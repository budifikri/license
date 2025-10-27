import React, { useState, useEffect } from 'react';
import type { Plan, Product } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/Dialog';
import Button from './ui/Button';
import Label from './ui/Label';
import Input from './ui/Input';
import Select from './ui/Select';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: Omit<Plan, 'id'> | Plan) => void;
  planToEdit: Plan | null;
  products: Product[];
  defaultProductId?: string | null;
}

const PlanModal: React.FC<PlanModalProps> = ({ isOpen, onClose, onSave, planToEdit, products, defaultProductId = null }) => {
  const [name, setName] = useState('');
  const [productId, setProductId] = useState('');
  const [price, setPrice] = useState(0);
  const [deviceLimit, setDeviceLimit] = useState(1);
  const [durationDays, setDurationDays] = useState(0);

  useEffect(() => {
    if (isOpen) {
        if (planToEdit) {
            setName(planToEdit.name);
            setProductId(planToEdit.productId);
            setPrice(planToEdit.price);
            setDeviceLimit(planToEdit.deviceLimit);
            setDurationDays(planToEdit.durationDays);
        } else {
            setName('');
            setProductId(defaultProductId || products[0]?.id || '');
            setPrice(0);
            setDeviceLimit(1);
            setDurationDays(0);
        }
    }
  }, [planToEdit, isOpen, products, defaultProductId]);

  const handleSubmit = () => {
    const planData = { name, productId, price: Number(price), deviceLimit: Number(deviceLimit), durationDays: Number(durationDays) };
    
    if (planToEdit) {
      onSave({ ...planToEdit, ...planData });
    } else {
      onSave(planData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle>{planToEdit ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
          <DialogDescription>
            {planToEdit ? 'Update the details for this plan.' : 'Enter the details for the new plan.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 p-6 pt-0">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="product" className="text-right">Product</Label>
            <Select id="product" value={productId} onChange={e => setProductId(e.target.value)} className="col-span-3" disabled={products.length === 0 || !!defaultProductId}>
                {products.length > 0 ? (
                    products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                ) : (
                    <option>No products available</option>
                )}
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">Price (IDR)</Label>
            <Input id="price" type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="deviceLimit" className="text-right">Device Limit</Label>
            <Input id="deviceLimit" type="number" min="0" value={deviceLimit} onChange={e => setDeviceLimit(Number(e.target.value))} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="duration" className="text-right">Duration (days)</Label>
            <Input id="duration" type="number" min="0" value={durationDays} onChange={e => setDurationDays(Number(e.target.value))} className="col-span-3" placeholder="0 for permanent"/>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlanModal;