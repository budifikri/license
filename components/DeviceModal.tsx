import React, { useState, useEffect } from 'react';
import type { Device } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/Dialog';
import Button from './ui/Button';
import Label from './ui/Label';
import Input from './ui/Input';

type AugmentedDevice = Device & { licenseKey: string; companyName: string; };

interface DeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (device: Device) => void;
  deviceToEdit: AugmentedDevice | null;
}

const DeviceModal: React.FC<DeviceModalProps> = ({ isOpen, onClose, onSave, deviceToEdit }) => {
  const [os, setOs] = useState('');
  const [processor, setProcessor] = useState('');
  const [ram, setRam] = useState('');

  useEffect(() => {
    if (deviceToEdit) {
      setOs(deviceToEdit.os || '');
      setProcessor(deviceToEdit.processor || '');
      setRam(deviceToEdit.ram || '');
    }
  }, [deviceToEdit, isOpen]);

  const handleSubmit = () => {
    if (!deviceToEdit) return;

    // Destructure to remove augmented properties before saving
    const { licenseKey, companyName, ...originalDevice } = deviceToEdit;
    
    const updatedDevice: Device = {
      ...originalDevice,
      os,
      processor,
      ram,
    };
    onSave(updatedDevice);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle>Edit Device Details</DialogTitle>
          <DialogDescription>Update the hardware information for this device.</DialogDescription>
        </DialogHeader>
        {deviceToEdit && (
            <div className="grid gap-4 p-6 pt-0">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Device Name</Label>
                    <p className="col-span-3 font-medium">{deviceToEdit.name}</p>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Computer ID</Label>
                    <p className="col-span-3 font-mono text-xs break-all">{deviceToEdit.computerId}</p>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="os" className="text-right">Operating System</Label>
                    <Input
                        id="os"
                        value={os}
                        onChange={e => setOs(e.target.value)}
                        className="col-span-3"
                        placeholder="e.g., Windows 11 Pro"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="processor" className="text-right">Processor</Label>
                    <Input
                        id="processor"
                        value={processor}
                        onChange={e => setProcessor(e.target.value)}
                        className="col-span-3"
                         placeholder="e.g., Intel Core i7-12700K"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="ram" className="text-right">RAM</Label>
                    <Input
                        id="ram"
                        value={ram}
                        onChange={e => setRam(e.target.value)}
                        className="col-span-3"
                        placeholder="e.g., 16GB"
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

export default DeviceModal;