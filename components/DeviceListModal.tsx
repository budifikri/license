import React from 'react';
import type { LicenseKey, Device } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/Dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import Button from './ui/Button';
import { formatDateTime } from '../utils/date';

type AugmentedLicense = LicenseKey & { productName: string; planName: string; };

interface DeviceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: AugmentedLicense | null;
}

const DeviceListModal: React.FC<DeviceListModalProps> = ({ isOpen, onClose, license }) => {
  if (!license) return null;

  const devices = license.devices || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle>Activated Devices</DialogTitle>
          <DialogDescription>
            Showing all devices activated with license key: <span className="font-mono text-xs">{license.key}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-0 max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device Name</TableHead>
                <TableHead>OS</TableHead>
                <TableHead>Processor</TableHead>
                <TableHead>RAM</TableHead>
                <TableHead>Last Seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.length > 0 ? devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium">{device.name}</TableCell>
                  <TableCell>{device.os || 'N/A'}</TableCell>
                  <TableCell>{device.processor || 'N/A'}</TableCell>
                  <TableCell>{device.ram || 'N/A'}</TableCell>
                  <TableCell>{formatDateTime(device.lastSeenAt)}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No devices have been activated with this license.</TableCell>
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

export default DeviceListModal;