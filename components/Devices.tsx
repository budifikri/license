import React, { useState, useMemo } from 'react';
import { useDevices, useLicenses, useUsers, useCompanies, useActivityLogs } from '../hooks/useApiData';
import { useSortableData } from '../hooks/useSortableData';
import { usePagination } from '../hooks/usePagination';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from './ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import { Loader2, ChevronsUpDown, ArrowUp, ArrowDown } from './icons';
import DeviceModal from './DeviceModal';
import ConfirmationDialog from './ConfirmationDialog';
import Pagination from './Pagination';
import type { Device } from '../types';
import { formatDateTime } from '../utils/date';
import AddDeviceModal from './AddDeviceModal';

type AugmentedDevice = Device & { licenseKey: string; companyName: string; };

const Devices: React.FC = () => {
  const { data: devices, isLoading: devicesLoading, addItem, updateItem, deleteItem } = useDevices();
  const { data: licensesData, isLoading: licensesLoading } = useLicenses();
  const { data: usersData, isLoading: usersLoading } = useUsers();
  const { data: companiesData, isLoading: companiesLoading } = useCompanies();
  const { addItem: addActivityLog } = useActivityLogs();
  const { user } = useAuth();
  const isManagerOrAdmin = user?.role === 'Admin' || user?.role === 'Manager';

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState<AugmentedDevice | null>(null);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');

  const licenseMap = useMemo(() => new Map(licensesData?.map(l => [l.id, l])), [licensesData]);
  const userMap = useMemo(() => new Map(usersData?.map(u => [u.id, u])), [usersData]);
  const companyMap = useMemo(() => new Map(companiesData?.map(c => [c.id, c.name])), [companiesData]);

  const augmentedDevices = useMemo(() => {
    if (!devices) return [];
    
    // Filter devices for regular users to only show devices from their own licenses
    let userDevices = devices;
    if (user?.role === 'User') {
      const userLicenseIds = new Set(licensesData?.filter(l => l.userId === user.id).map(l => l.id) || []);
      userDevices = devices.filter(device => userLicenseIds.has(device.licenseId));
    }
    
    return userDevices.map(device => {
      const license = licenseMap.get(device.licenseId);
      const user = license?.userId ? userMap.get(license.userId) : null;
      const companyName = user?.companyId ? companyMap.get(user.companyId) ?? 'Unknown' : 'Unassigned';
      return {
        ...device,
        licenseKey: license?.key ?? 'Unknown',
        companyName: companyName,
      };
    });
  }, [devices, licenseMap, userMap, companyMap, user, licensesData]);

  const filteredDevices = useMemo(() => {
    if (!augmentedDevices) return [];
    return augmentedDevices.filter(device => {
      const searchCorpus = `${device.name} ${device.computerId} ${device.licenseKey} ${device.os || ''} ${device.processor || ''}`.toLowerCase();
      const matchesSearch = searchCorpus.includes(searchTerm.toLowerCase());
      
      const companyForDevice = device.companyName || 'Unassigned';
      const matchesCompany = !companyFilter || companyForDevice === companyFilter;
      
      // For regular users, only show active devices
      const matchesActiveStatus = user?.role === 'User' ? device.isActive : true;
      
      return matchesSearch && matchesCompany && matchesActiveStatus;
    });
  }, [augmentedDevices, searchTerm, companyFilter, user]);

  const { items: sortedDevices, requestSort, sortConfig } = useSortableData<AugmentedDevice>(filteredDevices);
  const { paginatedData: paginatedDevices, ...paginationProps } = usePagination({ data: sortedDevices, itemsPerPage: 10 });

  const getSortIcon = (key: keyof AugmentedDevice) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronsUpDown className="h-4 w-4 ml-2 opacity-40" />;
    if (sortConfig.direction === 'ascending') return <ArrowUp className="h-4 w-4 ml-2" />;
    return <ArrowDown className="h-4 w-4 ml-2" />;
  };

  const handleOpenEditModal = (device: AugmentedDevice) => {
    setDeviceToEdit(device);
    setEditModalOpen(true);
  };

  const handleSave = (deviceData: Device | Omit<Device, 'id'>) => {
    if ('id' in deviceData) {
      updateItem(deviceData);
      if(user) {
        addActivityLog({
          userId: user.id,
          action: 'update',
          entityType: 'Device',
          entityName: deviceData.name,
          createdAt: new Date().toISOString(),
          details: null
        });
      }
      setEditModalOpen(false);
      setDeviceToEdit(null);
    } else {
      addItem(deviceData);
      if(user) {
        addActivityLog({
          userId: user.id,
          action: 'create',
          entityType: 'Device',
          entityName: deviceData.name,
          createdAt: new Date().toISOString(),
          details: null
        });
      }
      setAddModalOpen(false);
    }
  };

  const handleDelete = (id: string) => {
    const deviceToDelete = devices?.find(d => d.id === id);
    deleteItem(id);
    if(deviceToDelete && user) {
        addActivityLog({
          userId: user.id,
          action: 'delete',
          entityType: 'Device',
          entityName: deviceToDelete.name,
          createdAt: new Date().toISOString(),
          details: null
        });
    }
    setItemToDeleteId(null);
  };
  
  const allCompanies = useMemo(() => [...new Set(augmentedDevices.map(d => d.companyName).filter(Boolean))], [augmentedDevices]);

  const isLoading = devicesLoading || licensesLoading || usersLoading || companiesLoading;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Devices</h1>
        {isManagerOrAdmin && <Button onClick={() => setAddModalOpen(true)}>Add Device Manually</Button>}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Activated Devices</CardTitle>
          <CardDescription>View, edit, and deactivate devices linked to licenses.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
            <Input
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-sm"
            />
            <Select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="w-full sm:w-auto">
              <option value="">All Companies</option>
              {allCompanies.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><Button variant="ghost" onClick={() => requestSort('name')}>Device Name {getSortIcon('name')}</Button></TableHead>
                  <TableHead><Button variant="ghost" onClick={() => requestSort('licenseKey')}>License Key {getSortIcon('licenseKey')}</Button></TableHead>
                  <TableHead><Button variant="ghost" onClick={() => requestSort('companyName')}>Company {getSortIcon('companyName')}</Button></TableHead>
                  <TableHead><Button variant="ghost" onClick={() => requestSort('os')}>OS {getSortIcon('os')}</Button></TableHead>
                  <TableHead><Button variant="ghost" onClick={() => requestSort('lastSeenAt')}>Last Seen {getSortIcon('lastSeenAt')}</Button></TableHead>
                  {isManagerOrAdmin && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDevices.length > 0 ? paginatedDevices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell className="font-mono text-xs break-all">{device.licenseKey}</TableCell>
                    <TableCell>{device.companyName}</TableCell>
                    <TableCell>{device.os || 'N/A'}</TableCell>
                    <TableCell>{formatDateTime(device.lastSeenAt)}</TableCell>
                    {isManagerOrAdmin && (
                      <TableCell>
                        <Button variant="ghost" size="sm" className="mr-2" onClick={() => handleOpenEditModal(device)}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => setItemToDeleteId(device.id)}>Deactivate</Button>
                      </TableCell>
                    )}
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={isManagerOrAdmin ? 6 : 5} className="text-center">No devices found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter>
            <Pagination {...paginationProps} />
        </CardFooter>
      </Card>

      <AddDeviceModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={handleSave}
        licenses={licensesData || []}
      />
      
      <DeviceModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSave}
        deviceToEdit={deviceToEdit}
      />

      <ConfirmationDialog
        isOpen={!!itemToDeleteId}
        onClose={() => setItemToDeleteId(null)}
        onConfirm={() => itemToDeleteId && handleDelete(itemToDeleteId)}
        title="Deactivate Device"
        description="Are you sure you want to deactivate this device? This will free up a slot on the license."
      />
    </>
  );
};

export default Devices;