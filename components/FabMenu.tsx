import React, { useState } from 'react';
import { Menu, X, Receipt, FileText, Building, Users, History, Landmark, HelpCircle, LogOut } from './icons';
import { useAuth } from '../contexts/AuthContext';

type Page = 'dashboard' | 'licenses' | 'devices' | 'products' | 'plans' | 'companies' | 'users' | 'activity' | 'invoices' | 'settings' | 'banks' | 'help';

interface FabMenuProps {
  setActivePage: (page: Page) => void;
}

const FabMenu: React.FC<FabMenuProps> = ({ setActivePage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const fabItems = [
    { id: 'invoices', label: 'Invoices', icon: <Receipt className="h-5 w-5" />, roles: ['Admin', 'Manager'] },
    { id: 'plans', label: 'Plans', icon: <FileText className="h-5 w-5" />, roles: ['Admin', 'Manager', 'User'] },
    { id: 'companies', label: 'Companies', icon: <Building className="h-5 w-5" />, roles: ['Admin'] },
    { id: 'users', label: 'Users', icon: <Users className="h-5 w-5" />, roles: ['Admin', 'Manager'] },
    { id: 'banks', label: 'Banks', icon: <Landmark className="h-5 w-5" />, roles: ['Admin'] },
    { id: 'activity', label: 'Activity', icon: <History className="h-5 w-5" />, roles: ['Admin'] },
    { id: 'help', label: 'Help', icon: <HelpCircle className="h-5 w-5" />, roles: ['Admin', 'Manager', 'User'] },
    { id: 'logout', label: 'Logout', icon: <LogOut className="h-5 w-5" />, roles: ['Admin', 'Manager', 'User'] },
  ];

  const availableFabItems = fabItems.filter(item => user && item.roles.includes(user.role));

  if (availableFabItems.length === 0) {
    return null;
  }

  const handleItemClick = (pageOrAction: string) => {
    if (pageOrAction === 'logout') {
      logout();
    } else {
      setActivePage(pageOrAction as Page);
    }
    setIsOpen(false);
  };

  return (
    <div className="md:hidden fixed bottom-20 right-4 z-30 flex flex-col items-end">
      {/* Menu Items */}
      <div 
        className={`flex flex-col items-end space-y-3 mb-3 transition-all duration-300 ease-in-out ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {availableFabItems.map((item) => (
          <div key={item.id} className="flex flex-row-reverse items-center group">
             <button
                onClick={() => handleItemClick(item.id)}
                className="bg-white dark:bg-gray-700 text-primary dark:text-white rounded-full p-3 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-transform transform hover:scale-110"
                aria-label={item.label}
              >
                {item.icon}
              </button>
            <div className="bg-gray-900 text-white text-xs font-semibold px-3 py-1 rounded-md mr-3 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-primary text-primary-foreground rounded-full p-4 shadow-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-transform duration-300 ease-in-out ${
          isOpen ? 'rotate-90' : 'rotate-0'
        }`}
        aria-expanded={isOpen}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
    </div>
  );
};

export default FabMenu;