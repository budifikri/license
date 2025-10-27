import React, { useState, useEffect } from 'react';
import type { Bank } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/Dialog';
import Button from './ui/Button';
import Label from './ui/Label';
import Input from './ui/Input';

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bank: Omit<Bank, 'id'> | Bank) => void;
  bankToEdit: Bank | null;
}

const BankModal: React.FC<BankModalProps> = ({ isOpen, onClose, onSave, bankToEdit }) => {
  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');

  useEffect(() => {
    if (bankToEdit) {
      setName(bankToEdit.name);
      setAccountNumber(bankToEdit.accountNumber);
      setOwnerName(bankToEdit.ownerName);
    } else {
      setName('');
      setAccountNumber('');
      setOwnerName('');
    }
  }, [bankToEdit, isOpen]);

  const handleSubmit = () => {
    const bankData = { name, accountNumber, ownerName };
    if (bankToEdit) {
      onSave({ ...bankToEdit, ...bankData });
    } else {
      onSave(bankData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle>{bankToEdit ? 'Edit Bank' : 'Add New Bank'}</DialogTitle>
          <DialogDescription>
            {bankToEdit ? 'Update the details for this bank account.' : 'Enter the details for the new bank account.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 p-6 pt-0">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Bank Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" placeholder="e.g., Bank Central Asia (BCA)" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="accountNumber" className="text-right">Account Number</Label>
            <Input id="accountNumber" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="col-span-3" placeholder="e.g., 1234567890" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ownerName" className="text-right">Owner Name</Label>
            <Input id="ownerName" value={ownerName} onChange={e => setOwnerName(e.target.value)} className="col-span-3" placeholder="e.g., PT Inovasi Jaya" />
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

export default BankModal;