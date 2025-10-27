import React, { useState, useEffect } from 'react';
import type { Product } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/Dialog';
import Button from './ui/Button';
import Label from './ui/Label';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import { Sparkles, Loader2 } from './icons';
import { generateDescription } from '../services/geminiService';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'> | Product) => void;
  productToEdit: Product | null;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, productToEdit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setDescription(productToEdit.description);
    } else {
      setName('');
      setDescription('');
    }
  }, [productToEdit, isOpen]);

  const handleGenerateDescription = async () => {
    if (!name) {
      alert("Please enter a product name first to generate a description.");
      return;
    }
    setIsGenerating(true);
    try {
      const generatedDesc = await generateDescription(name);
      setDescription(generatedDesc);
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = () => {
    if (!name) {
      alert("Product name is required.");
      return;
    }
    const productData = { name, description };
    if (productToEdit) {
      onSave({ ...productToEdit, ...productData });
    } else {
      onSave(productData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle>{productToEdit ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {productToEdit ? 'Update the details for this product.' : 'Enter the details for the new product.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 p-6 pt-0">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">Description</Label>
            <div className="col-span-3">
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} />
              <Button onClick={handleGenerateDescription} disabled={isGenerating || !name} size="sm" variant="outline" className="mt-2">
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate with AI
              </Button>
            </div>
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

export default ProductModal;