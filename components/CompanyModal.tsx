import React, { useState, useEffect } from 'react';
import type { Company } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/Dialog';
import Button from './ui/Button';
import Label from './ui/Label';
import Input from './ui/Input';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (company: Omit<Company, 'id'> | Company) => void;
  companyToEdit: Company | null;
}

const CompanyModal: React.FC<CompanyModalProps> = ({ isOpen, onClose, onSave, companyToEdit }) => {
  const [name, setName] = useState('');
  const [createdAt, setCreatedAt] = useState('');

  useEffect(() => {
    if (companyToEdit) {
      setName(companyToEdit.name);
      setCreatedAt(new Date(companyToEdit.createdAt).toISOString().slice(0, 16)); // Format for datetime-local
    } else {
      setName('');
      setCreatedAt(new Date().toISOString().slice(0, 16));
    }
  }, [companyToEdit, isOpen]);

  const handleSubmit = () => {
    const companyData = {
      name,
      createdAt: new Date(createdAt).toISOString(),
    };

    if (companyToEdit) {
      onSave({ ...companyToEdit, ...companyData });
    } else {
      onSave(companyData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle>{companyToEdit ? 'Edit Company' : 'Add New Company'}</DialogTitle>
          <DialogDescription>
            {companyToEdit ? 'Update the details for this company.' : 'Enter the details for the new company.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 p-6 pt-0">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="createdAt" className="text-right">Created At</Label>
            <Input id="createdAt" type="datetime-local" value={createdAt} onChange={e => setCreatedAt(e.target.value)} className="col-span-3" />
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

export default CompanyModal;