

import React, { useState, useEffect } from 'react';
import type { LicenseKey } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/Dialog';
import Button from './ui/Button';
import Label from './ui/Label';
import Input from './ui/Input';
import Select from './ui/Select';
import { formatDate } from '../utils/date';

type AugmentedLicense = LicenseKey & { productName: string; planName: string; };

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (license: LicenseKey) => void;
  licenseToEdit: AugmentedLicense | null;
}

const LicenseModal: React.FC<LicenseModalProps> = ({ isOpen, onClose, onSave, licenseToEdit }) => {
  const [status, setStatus] = useState<LicenseKey['status']>('Inactive');
  const [expiresAt, setExpiresAt] = useState<string>('');

  useEffect(() => {
    if (licenseToEdit) {
      setStatus(licenseToEdit.status);
      if (licenseToEdit.expiresAt) {
          // The input type 'date' expects YYYY-MM-DD
          setExpiresAt(new Date(licenseToEdit.expiresAt).toISOString().split('T')[0]);
      } else {
          setExpiresAt('');
      }
    }
  }, [licenseToEdit, isOpen]);

  const handleSubmit = () => {
    if (!licenseToEdit) return;
    
    const { productName, planName, ...originalLicense } = licenseToEdit;

    const updatedLicense: LicenseKey = {
      ...originalLicense,
      status: status,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    };
    onSave(updatedLicense);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle>Edit License</DialogTitle>
          <DialogDescription>Update the status and expiration for this license key.</DialogDescription>
        </DialogHeader>
        {licenseToEdit && (
            <div className="grid gap-4 p-6 pt-0">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">License Key</Label>
                    <p className="col-span-3 font-mono text-xs break-all">{licenseToEdit.key}</p>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Product</Label>
                    <p className="col-span-3">{licenseToEdit.productName}</p>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Plan</Label>
                    <p className="col-span-3">{licenseToEdit.planName}</p>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Created At</Label>
                    <p className="col-span-3">{formatDate(licenseToEdit.createdAt)}</p>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">Status</Label>
                    <Select
                        id="status"
                        value={status}
                        onChange={e => setStatus(e.target.value as LicenseKey['status'])}
                        className="col-span-3"
                        disabled={licenseToEdit.status === 'Expired'}
                    >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        {licenseToEdit.status === 'Expired' && <option value="Expired">Expired</option>}
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expiresAt" className="text-right">Expires At</Label>
                    <Input
                        id="expiresAt"
                        type="date"
                        value={expiresAt}
                        onChange={e => setExpiresAt(e.target.value)}
                        className="col-span-3"
                    />
                </div>
            </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LicenseModal;