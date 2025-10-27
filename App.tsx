import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Licenses from "./components/Licenses";
import Products from "./components/Products";
import Plans from "./components/Plans";
import Companies from "./components/Companies";
import Users from "./components/Users";
import Activity from "./components/Activity";
import Invoices from "./components/Invoices";
import Settings from "./components/Settings";
import Devices from "./components/Devices";
import Banks from "./components/Banks";
import RBACMain from "./components/RBACMain";
import ProductLicense from "./components/ProductLicense";
import InvoicePage from "./components/InvoicePage";
import { KeyRound, Loader2 } from "./components/icons";
import BottomNav from "./components/BottomNav";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./components/LoginPage";
import { ThemeProvider } from "./contexts/ThemeContext";
import FabMenu from "./components/FabMenu";
import Help from "./components/Help";
import { useUserRights } from "./hooks/useUserRights";

type Page =
  | "dashboard"
  | "licenses"
  | "devices"
  | "products"
  | "plans"
  | "companies"
  | "users"
  | "activity"
  | "invoices"
  | "settings"
  | "banks"
  | "help"
  | "roles"
  | "product-license"
  | "invoice";

const AuthenticatedApp: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [productLicenseProductId, setProductLicenseProductId] = useState<string | null>(null);
  const { user } = useAuth();
  const { userRights, isLoading: userRightsLoading } = useUserRights(user?.id || null);

  // Handle URL parameters and custom events for navigation
  useEffect(() => {
    // Function to check URL parameters and navigate accordingly
    const checkUrlParams = () => {
      // Parse the hash portion of the URL
      const hash = window.location.hash;
      if (hash.startsWith('#/')) {
        const path = hash.substring(2); // Remove '#/'
        
        if (path.startsWith('product_license')) {
          // Extract productId from query parameters in the hash
          const searchPart = hash.split('?')[1];
          const urlParams = new URLSearchParams(searchPart || '');
          const productId = urlParams.get('productId');
          
          if (productId) {
            setProductLicenseProductId(productId);
            setActivePage('product-license');
            return;
          }
        }
        
        if (path.startsWith('invoice')) {
          setActivePage('invoice');
          return;
        }
      }
    };

    // Check on initial load
    checkUrlParams();

    // Listen for custom event from child components
    const handleNavigateToProductLicense = (event: CustomEvent) => {
      const { productId } = event.detail;
      setProductLicenseProductId(productId);
      setActivePage('product-license');
      
      // Update URL to reflect the navigation
      window.location.hash = `#/product_license?productId=${productId}`;
    };

    window.addEventListener('navigateToProductLicense', handleNavigateToProductLicense as EventListener);

    // Listen for browser back/forward button clicks
    const handlePopState = () => {
      checkUrlParams();
    };
    
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('navigateToProductLicense', handleNavigateToProductLicense as EventListener);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Helper function to transform permissions into accessible pages
  const getAccessiblePages = () => {
    if (!userRights) return [];
    return userRights.permissions
      .filter(permission => permission.canView)
      .map(permission => permission.menu.path)
      .map(path => path.replace('/', '') as Page);
  };

  useEffect(() => {
    // Check user rights for the current page using RBAC system
    // Only run this check when userRights have finished loading
    if (user && !userRightsLoading) {
      // Exception: product-license page should be accessible to all users
      if (activePage === "product-license") {
        return; // Allow access to product-license page
      }
      
      // If userRights are null or empty permissions, redirect to dashboard
      if (userRights === null || (userRights && getAccessiblePages().length === 0)) {
        setActivePage("dashboard");
      } else {
        const accessiblePages = getAccessiblePages();
        if (!accessiblePages.includes(activePage)) {
          // Default to dashboard if user doesn't have access to current page
          setActivePage("dashboard");
        }
      }
    }
  }, [user, userRights, userRightsLoading, activePage]);

  const renderContent = () => {
    // If user exists but userRights are still loading, show loading state
    if (user && userRightsLoading) {
      return <div>Loading...</div>;
    }
    
    // If user exists but userRights are null or user has no permissions
    // Don't allow access to any specific page
    // Exception: product-license page should be accessible to all users
    if (user && userRights === null && activePage !== "product-license") {
      // If we don't have user rights data, user should not be able to access protected pages
      return <Dashboard />;
    }
    
    // Check if user has rights to access the current page
    // Exception: product-license page should be accessible to all users
    if (user && userRights && activePage !== "product-license") {
      const accessiblePages = getAccessiblePages();

      // If user has no accessible pages (empty permissions) or doesn't have access to current page
      if (accessiblePages.length === 0 || !accessiblePages.includes(activePage)) {
        return <Dashboard />;
      }
    }
    
    // Special handling for product-license and invoice pages - render them standalone
    if (activePage === "product-license") {
      return productLicenseProductId ? <ProductLicense /> : <div>Product ID not specified</div>;
    }
    
    if (activePage === "invoice") {
      return <InvoicePage />;
    }

    switch (activePage) {
      case "dashboard":
        return <Dashboard />;
      case "licenses":
        return <Licenses />;
      case "devices":
        return <Devices />;
      case "products":
        return <Products />;
      case "plans":
        return <Plans />;
      case "companies":
        return <Companies />;
      case "users":
        return <Users />;
      case "roles":
        return <RBACMain />;
      case "activity":
        return <Activity />;
      case "invoices":
        return <Invoices />;
      case "settings":
        return <Settings />;
      case "banks":
        return <Banks />;
      case "help":
        return <Help />;
      default:
        return <div>Select a page</div>;
    }
  };

  // Special handling for product-license and invoice pages - render them standalone without layout
  if (activePage === "product-license" || activePage === "invoice") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex flex-col flex-1 w-full">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-10 flex items-center justify-center h-16 px-4 border-b bg-white dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center">
            <KeyRound className="h-7 w-7 text-primary" />
            <h1 className="ml-2 text-lg font-bold">Licenser</h1>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-20 md:pb-8">
          {renderContent()}
        </main>
      </div>
      <BottomNav activePage={activePage} setActivePage={setActivePage} />
      <FabMenu setActivePage={setActivePage} />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  
  // Check URL for product license page access
  const checkProductLicenseAccess = () => {
    const hash = window.location.hash;
    const searchPart = hash.split('?')[1];
    const urlParams = new URLSearchParams(searchPart || '');
    const productId = urlParams.get('productId');
    return hash.includes('product_license') && productId;
  };

  // Check for product license page first (no authentication required)
  if (checkProductLicenseAccess()) {
    const searchPart = window.location.hash.split('?')[1];
    const urlParams = new URLSearchParams(searchPart || '');
    const productId = urlParams.get('productId');
    
    if (productId) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <ProductLicense />
        </div>
      );
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return user ? <AuthenticatedApp /> : <LoginPage />;
};

function App() {
  // Check if the URL is for the product license page or invoice page
  const isSpecialPage = () => {
    const hash = window.location.hash;
    const searchPart = hash.split('?')[1];
    const urlParams = new URLSearchParams(searchPart || '');
    const productId = urlParams.get('productId');
    
    return (hash.includes('product_license') && productId) || hash.includes('invoice');
  };

  // If it's a special page (product_license or invoice), render without authentication
  if (isSpecialPage()) {
    // Determine which component to render based on the URL
    const hash = window.location.hash;
    if (hash.includes('product_license')) {
      const searchPart = hash.split('?')[1];
      const urlParams = new URLSearchParams(searchPart || '');
      const productId = urlParams.get('productId');
      
      if (productId) {
        return (
          <ThemeProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
              <ProductLicense />
            </div>
          </ThemeProvider>
        );
      }
    } else if (hash.includes('invoice')) {
      return (
        <ThemeProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <InvoicePage />
          </div>
        </ThemeProvider>
      );
    }
  }

  // For all other pages, use the authenticated flow
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;