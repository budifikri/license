import React, { useState, useEffect } from 'react';
import type { Device, LicenseKey } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/Dialog';
import Button from './ui/Button';
import Label from './ui/Label';
import Input from './ui/Input';
import Select from './ui/Select';
import { v4 as uuidv4 } from 'uuid';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (device: Omit<Device, 'id'>) => void;
  licenses: LicenseKey[];
}

const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ isOpen, onClose, onSave, licenses }) => {
  const [licenseId, setLicenseId] = useState('');
  const [name, setName] = useState('');
  const [computerId, setComputerId] = useState('');
  const [os, setOs] = useState('');
  const [processor, setProcessor] = useState('');
  const [ram, setRam] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset form on open
      setLicenseId(licenses.length > 0 ? licenses[0].id : '');
      setName('');
      setComputerId(uuidv4()); // Generate a new unique ID for the device
      setOs('');
      setProcessor('');
      setRam('');
    }
  }, [isOpen, licenses]);
  
  const handleSubmit = () => {
    if (!licenseId || !name) {
        alert("Please select a license and provide a device name.");
        return;
    }

    const newDevice: Omit<Device, 'id'> = {
      licenseId,
      computerId,
      name,
      os: os || undefined,
      processor: processor || undefined,
      ram: ram || undefined,
      isActive: true,
      activatedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    };
    
    onSave(newDevice);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle>Add Device Manually</DialogTitle>
          <DialogDescription>
            Manually activate a device for an existing license key. This is for administrative purposes.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 p-6 pt-0">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="license" className="text-right">License Key</Label>
            <Select
              id="license"
              value={licenseId}
              onChange={e => setLicenseId(e.target.value)}
              className="col-span-3"
              disabled={licenses.length === 0}
            >
              <option value="">Select a license...</option>
              {licenses.map(lic => (
                <option key={lic.id} value={lic.id}>{lic.key}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Device Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" placeholder="e.g., John's Laptop" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="computerId" className="text-right">Computer ID</Label>
            <div className="col-span-3 flex items-center space-x-2">
                 <Input id="computerId" value={computerId} disabled className="font-mono text-xs"/>
                 <Button variant="outline" size="sm" onClick={() => setComputerId(uuidv4())}>Generate</Button>
            </div>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="os" className="text-right">Operating System</Label>
            <Input id="os" value={os} onChange={e => setOs(e.target.value)} className="col-span-3" placeholder="e.g., macOS Sonoma" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="processor" className="text-right">Processor</Label>
            <Input id="processor" value={processor} onChange={e => setProcessor(e.target.value)} className="col-span-3" placeholder="e.g., Apple M2" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ram" className="text-right">RAM</Label>
            <Input id="ram" value={ram} onChange={e => setRam(e.target.value)} className="col-span-3" placeholder="e.g., 16GB" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Add Device</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddDeviceModal;
