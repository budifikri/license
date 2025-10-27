import React from 'react';
import type { Company, LicenseKey } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/Dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import Button from './ui/Button';
import { formatDate } from '../utils/date';

type AugmentedLicense = LicenseKey & { productName: string; planName: string; };

interface CompanyLicenseListModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  licenses: AugmentedLicense[];
}

const CompanyLicenseListModal: React.FC<CompanyLicenseListModalProps> = ({ isOpen, onClose, company, licenses }) => {
  if (!company) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle>Licenses for {company.name}</DialogTitle>
          <DialogDescription>
            Showing all licenses associated with users from this company.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-0 max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Key</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.length > 0 ? licenses.map((license) => (
                <TableRow key={license.id}>
                  <TableCell className="font-mono text-xs">{license.key}</TableCell>
                  <TableCell>{license.productName}</TableCell>
                  <TableCell>{license.planName}</TableCell>
                  <TableCell>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        license.status === 'Active' ? 'bg-green-100 text-green-800' :
                        license.status === 'Expired' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {license.status}
                      </span>
                  </TableCell>
                  <TableCell>{license.expiresAt ? formatDate(license.expiresAt) : 'Never'}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No licenses found for this company.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyLicenseListModal;