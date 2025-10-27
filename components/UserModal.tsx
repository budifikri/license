import React, { useState, useEffect } from 'react';
import type { User, Company } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/Dialog';
import Button from './ui/Button';
import Label from './ui/Label';
import Input from './ui/Input';
import Select from './ui/Select';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Omit<User, 'id' | 'createdAt'> | User) => void;
  userToEdit: User | null;
  companies: Company[];
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, userToEdit, companies }) => {
  const { user: currentUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Admin' | 'Manager' | 'User'>('User');
  const [companyId, setCompanyId] = useState<string>('');

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setEmail(userToEdit.email);
      setRole(userToEdit.role || 'User');
      setCompanyId(userToEdit.companyId);
    } else {
      setName('');
      setEmail('');
      setRole('User');
      setCompanyId(companies[0]?.id || '');
    }
  }, [userToEdit, isOpen, companies]);

  const handleSubmit = () => {
    const userData = {
      name,
      email,
      role,
      companyId,
    };

    if (userToEdit) {
      // For update, pass the user ID along with the updated data
      const updatedUser = {
        id: userToEdit.id,  // Ensure ID is explicitly included 
        ...userData,
        createdAt: userToEdit.createdAt,  // Preserve original creation date
      };
      onSave(updatedUser);
    } else {
      onSave(userData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle>{userToEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {userToEdit ? 'Update the details for this user.' : 'Enter the details for the new user.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 p-6 pt-0">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">Role</Label>
            <Select id="role" value={role} onChange={e => setRole(e.target.value as 'Admin' | 'Manager' | 'User')} className="col-span-3">
                <option value="User">User</option>
                {currentUser?.role === 'Admin' && <option value="Manager">Manager</option>}
                {currentUser?.role === 'Admin' && <option value="Admin">Admin</option>}
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right">Company</Label>
            <Select id="company" value={companyId} onChange={e => setCompanyId(e.target.value)} className="col-span-3" disabled={companies.length === 0}>
                {companies.length > 0 ? (
                  companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                ) : (
                  <option>No companies available</option>
                )}
            </Select>
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

export default UserModal;