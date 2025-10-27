import React from 'react';
import { LayoutDashboard, KeyRound, Box, Settings, Monitor } from './icons';
import { useAuth } from '../contexts/AuthContext';

// FIX: Add 'help' to the Page type to match the definition in other components and prevent type errors when passing props from App.tsx.
type Page = 'dashboard' | 'licenses' | 'devices' | 'products' | 'plans' | 'companies' | 'users' | 'activity' | 'invoices' | 'settings' | 'banks' | 'help';

interface BottomNavProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
            isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-primary'
        }`}
        aria-current={isActive ? 'page' : undefined}
    >
        {icon}
        <span className="text-xs mt-1">{label}</span>
    </button>
);


const BottomNav: React.FC<BottomNavProps> = ({ activePage, setActivePage }) => {
    const { user } = useAuth();
    
    const mobileNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, roles: ['Admin', 'Manager', 'User'] },
        { id: 'licenses', label: 'Licenses', icon: <KeyRound className="h-5 w-5" />, roles: ['Admin', 'Manager', 'User'] },
        { id: 'devices', label: 'Devices', icon: <Monitor className="h-5 w-5" />, roles: ['Admin', 'Manager'] },
        { id: 'products', label: 'Products', icon: <Box className="h-5 w-5" />, roles: ['Admin', 'Manager', 'User'] },
        { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, roles: ['Admin', 'Manager', 'User'] },
    ];

    const availableNavItems = mobileNavItems.filter(item => user && item.roles.includes(user.role));

    if (availableNavItems.length === 0) {
        return null;
    }

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-t dark:border-gray-700 z-20">
            <div className="grid h-full" style={{gridTemplateColumns: `repeat(${availableNavItems.length}, 1fr)`}}>
                {availableNavItems.map((item) => (
                    <NavItem
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        isActive={activePage === item.id}
                        onClick={() => setActivePage(item.id as Page)}
                    />
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;