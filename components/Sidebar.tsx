import React from 'react';
import { LayoutDashboard, KeyRound, Box, FileText, Building, Users, History, LogOut, Receipt, Settings, Monitor, HelpCircle, Landmark, ShieldCheck } from './icons';
import { useAuth } from '../contexts/AuthContext';
import Button from './ui/Button';
import { useUserRights } from '../hooks/useUserRights';

type Page = 'dashboard' | 'licenses' | 'devices' | 'products' | 'plans' | 'companies' | 'users' | 'activity' | 'invoices' | 'settings' | 'banks' | 'help' | 'roles';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const NavLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <a
    href="#"
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </a>
);

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const { user, logout } = useAuth();
  const { userRights, isLoading } = useUserRights(user?.id || null);
  
  const handleNavClick = (page: Page) => {
    setActivePage(page);
  };

  // Define all possible navigation items with their paths
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, path: '/dashboard' },
    { id: 'licenses', label: 'Licenses', icon: <KeyRound className="h-5 w-5" />, path: '/licenses' },
    { id: 'devices', label: 'Devices', icon: <Monitor className="h-5 w-5" />, path: '/devices' },
    { id: 'products', label: 'Products', icon: <Box className="h-5 w-5" />, path: '/products' },
    { id: 'plans', label: 'Plans', icon: <FileText className="h-5 w-5" />, path: '/plans' },
    { id: 'invoices', label: 'Invoices', icon: <Receipt className="h-5 w-5" />, path: '/invoices' },
    { id: 'companies', label: 'Companies', icon: <Building className="h-5 w-5" />, path: '/companies' },
    { id: 'users', label: 'Users', icon: <Users className="h-5 w-5" />, path: '/users' },
    { id: 'roles', label: 'Role Management', icon: <ShieldCheck className="h-5 w-5" />, path: '/roles' },
    { id: 'banks', label: 'Banks', icon: <Landmark className="h-5 w-5" />, path: '/banks' },
    { id: 'activity', label: 'Activity', icon: <History className="h-5 w-5" />, path: '/activity' },
    { id: 'help', label: 'Help', icon: <HelpCircle className="h-5 w-5" />, path: '/help' },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/settings' },
  ];

  // Filter navigation items based on user permissions
  const availableNavItems = React.useMemo(() => {
    if (isLoading || !userRights) {
      // While loading, show a minimal set of items
      return allNavItems.filter(item => 
        ['dashboard', 'licenses', 'devices', 'help', 'settings'].includes(item.id)
      );
    }

    // If user has no role (backward compatibility), use hardcoded roles
    if (!userRights.user.role) {
      const roleBasedItems: Record<string, string[]> = {
        'Admin': ['dashboard', 'licenses', 'devices', 'products', 'plans', 'invoices', 'companies', 'users', 'roles', 'banks', 'activity', 'help', 'settings'],
        'Manager': ['dashboard', 'licenses', 'devices', 'products', 'plans', 'invoices', 'users', 'help', 'settings'],
        'User': ['dashboard', 'licenses', 'devices', 'products', 'plans', 'help', 'settings']
      };
      
      const userRole = user?.role || 'User';
      return allNavItems.filter(item => 
        roleBasedItems[userRole]?.includes(item.id)
      );
    }

    // Filter items based on user's role permissions (canView)
    return allNavItems.filter(item => {
      // Find the permission for this menu item by matching the path
      // Convert item.id to path format (e.g., 'dashboard' -> '/dashboard')
      const itemPath = `/${item.id}`;
      const permission = userRights.permissions.find(p => p.menu.path === itemPath);
      
      // If no permission is found, hide the item by default
      if (!permission) return false;
      
      // Show the item if the user has view permission
      return permission.canView;
    });
  }, [allNavItems, userRights, isLoading, user]);

  return (
    <aside
      className={`hidden md:flex flex-col h-full w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r dark:border-gray-700 p-4`}
    >
      <div className="flex items-center mb-8">
        <KeyRound className="h-8 w-8 text-primary" />
        <h1 className="ml-2 text-xl font-bold">Licenser</h1>
      </div>
      <nav className="flex-grow space-y-2">
        {availableNavItems.map((item) => (
            <NavLink
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activePage === item.id}
              onClick={() => handleNavClick(item.id as Page)}
            />
          )
        )}
      </nav>

      {user && (
         <div className="mt-auto border-t pt-4 dark:border-gray-700">
            <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground">
                    {user.name.charAt(0)}
                </div>
                <div className="ml-3">
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
            </div>
            <Button variant="ghost" className="w-full justify-start" onClick={logout}>
                <LogOut className="h-5 w-5 mr-3" />
                <span>Logout</span>
            </Button>
        </div>
      )}

    </aside>
  );
};

export default Sidebar;