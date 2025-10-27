import React, { useState, useEffect } from 'react';
import RoleManagement from './RoleManagement';
import RolePermissionPage from './RolePermissionPage';
import MenuRolePermissionsList from './MenuRolePermissionsList';
import MenuItemRolePermissionsTable from './MenuItemRolePermissionsTable';

const RBACMain: React.FC = () => {
  const [currentView, setCurrentView] = useState<'roles' | 'role-permissions' | 'menu-permissions' | 'menu-item-permissions'>('roles');
  const [roleId, setRoleId] = useState<string>('');

  // Extract the route from URL hash (for client-side routing)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1); // Remove '#'
      if (hash.startsWith('role-permissions/')) {
        const id = hash.split('/')[1];
        setRoleId(id);
        setCurrentView('role-permissions');
      } else if (hash === 'menu-permissions') {
        setCurrentView('menu-permissions');
      } else if (hash === 'menu-item-permissions') {
        setCurrentView('menu-item-permissions');
      } else {
        setCurrentView('roles');
      }
    };

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Initial check
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <div>
      {currentView === 'roles' && <RoleManagement />}
      {currentView === 'role-permissions' && roleId && <RolePermissionPage roleId={roleId} />}
      {currentView === 'menu-permissions' && <MenuRolePermissionsList />}
      {currentView === 'menu-item-permissions' && <MenuItemRolePermissionsTable />}
    </div>
  );
};

export default RBACMain;