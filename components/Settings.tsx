import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiClient } from '@/lib/api/client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Label from './ui/Label';
import Select from './ui/Select';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  // State for profile form
  const [name, setName] = useState(user?.name || '');

  // State for password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would call an API to update the user
    console.log('Updating profile with name:', name);
    alert('Profile updated successfully! (Simulation)');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords don't match!");
      return;
    }
    if (!newPassword || !currentPassword) {
      alert("Please fill in all password fields.");
      return;
    }
    
    try {
      const response = await apiClient.post<{message: string}>('auth/change-password', {
        currentPassword,
        newPassword
      });
      
      if (response.error) {
        alert(`Error: ${response.error}`);
      } else {
        alert('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Error: Failed to change password');
    }
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="grid gap-8">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <Button type="submit">Save Changes</Button>
            </form>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look and feel of the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-md">
                <Label htmlFor="theme">Theme</Label>
                <Select id="theme" value={theme} onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                </Select>
                <p className="text-sm text-muted-foreground">
                    Select the theme for the dashboard.
                </p>
            </div>
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your password for security.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              <Button type="submit">Change Password</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Settings;
