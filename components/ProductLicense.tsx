import React, { useState, useEffect } from 'react';
import './ProductLicense.css';

interface DeviceInfo {
  computerId: string;
  hostname: string;
  os: string;
  manufacturer: string;
  model: string;
  biosVersion: string;
  processor: string;
  cpuCores: number;
  ramTotal: string;
  ramFree: string;
  storageTotal: string;
  storageFree: string;
  disks: Array<{
    index: number;
    name: string;
    type: string;
    size: string;
  }>;
}

interface Plan {
  id: string;
  productId: string;
  name: string;
  price: number;
  deviceLimit: number;
  durationDays: number;
  description?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
}

interface PlanWithProduct extends Plan {
  product: Product;
}

interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  ownerName: string;
}

interface SelectedPlan {
  plan: PlanWithProduct;
}

// Simple UI Components since we can't import from ui/
const Button: React.FC<{
  children: React.ReactNode;
  variant?: 'outline' | 'default';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}> = ({ children, variant = 'default', className = '', onClick, disabled = false, type = 'button' }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const variantClasses = variant === 'outline' 
    ? 'border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground' 
    : 'bg-primary text-primary-foreground shadow hover:bg-primary/90';
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const Input: React.FC<{
  id?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}> = ({ id, type = 'text', value, onChange, placeholder, className = '' }) => {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );
};

const Label: React.FC<{
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}> = ({ children, htmlFor, className = '' }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    >
      {children}
    </label>
  );
};

const ProductLicense: React.FC = () => {
  const [plans, setPlans] = useState<PlanWithProduct[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [productId, setProductId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('bank');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);
  const [banksLoading, setBanksLoading] = useState(false);
  const [isEmailValidated, setIsEmailValidated] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [toastMessage, setToastMessage] = useState<{text: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Customer info state
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const showToast = (text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000); // Auto-hide after 3 seconds
  };

  // Get device info from URL fragment parameters
  const getDeviceInfoFromUrl = () => {
    const hash = window.location.hash;
    let queryString = '';
    if (hash.includes('?')) {
      queryString = hash.split('?')[1];
    }
    
    const urlParams = new URLSearchParams(queryString);
    const deviceInfoParam = urlParams.get('deviceInfo');
    console.log('Device info param from URL:', deviceInfoParam);
    
    if (deviceInfoParam) {
      try {
        const deviceInfoObj: DeviceInfo = JSON.parse(decodeURIComponent(deviceInfoParam));
        console.log('Parsed device info:', deviceInfoObj);
        setDeviceInfo(deviceInfoObj);
      } catch (error) {
        console.error('Error parsing device info from URL:', error);
        setError('Gagal memuat informasi perangkat dari URL');
      }
    }
  };

  // Fetch product and its plans from API
  const fetchProductAndPlans = async () => {
    if (!productId) {
      setError('Product ID not specified');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    console.log('Fetching product and plans for productId:', productId);
    
    try {
      // Fetch the specific product data
      console.log('Fetching product:', `/api/products/${productId}`);
      const productResponse = await fetch(`/api/products/${productId}`);
      
      if (!productResponse.ok) {
        console.error('Product response not OK:', productResponse.status, productResponse.statusText);
        throw new Error(`Failed to fetch product: ${productResponse.status} ${productResponse.statusText}`);
      }
      
      const productData: Product = await productResponse.json();
      console.log('Product data received:', productData);
      setProduct(productData);
      
      // Fetch plans for this product
      console.log('Fetching plans:', `/api/plans?productId=${productId}`);
      const plansResponse = await fetch(`/api/plans?productId=${productId}`);
      
      if (!plansResponse.ok) {
        console.error('Plans response not OK:', plansResponse.status, plansResponse.statusText);
        throw new Error(`Failed to fetch plans: ${plansResponse.status} ${plansResponse.statusText}`);
      }
      
      const plansData: Plan[] = await plansResponse.json();
      console.log('Plans data received:', plansData);
      
      // Combine product and plan data
      const plansWithProduct: PlanWithProduct[] = plansData.map(plan => ({
        ...plan,
        product: productData
      }));
      
      setPlans(plansWithProduct);
      
      if (plansWithProduct.length > 0) {
        setSuccess(`Ditemukan ${plansWithProduct.length} paket lisensi untuk ${productData.name}`);
      } else {
        setError(`Tidak ada paket lisensi tersedia untuk ${productData.name}`);
      }
      
    } catch (err: any) {
      console.error('Error fetching product and plans:', err);
      setError(`Gagal memuat data produk dan paket lisensi: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle plan selection - show invoice form in this component
  const handlePlanSelect = (plan: PlanWithProduct) => {
    setSelectedPlan({ plan });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  // Format duration
  const formatDuration = (days: number) => {
    if (days === 0) return 'Perpetual (Lifetime)';
    if (days === 365) return '1 Tahun';
    if (days > 30) return `${Math.floor(days / 30)} Bulan`;
    return `${days} Hari`;
  };

  // Initialize and handle URL or state changes
  useEffect(() => {
    // Check URL for productId parameter (in fragment after #)
    const hash = window.location.hash;
    console.log('Hash part of URL:', hash);
    
    // Extract query string from hash part (after #/)
    let queryString = '';
    if (hash.includes('?')) {
      queryString = hash.split('?')[1];
      console.log('Query string from hash:', queryString);
    }
    
    const urlParams = new URLSearchParams(queryString);
    const urlProductId = urlParams.get('productId');
    console.log('Parsed productId:', urlProductId);
    
    if (urlProductId) {
      setProductId(urlProductId);
    } else {
      console.error('No productId found in URL fragment parameters');
      setError('Product ID tidak ditemukan dalam URL');
    }
  }, []);

  // Fetch bank accounts
  const fetchBankAccounts = async () => {
    setBanksLoading(true);
    try {
      const response = await fetch('/api/banks');
      if (!response.ok) {
        throw new Error(`Failed to fetch banks: ${response.statusText}`);
      }
      const banks = await response.json();
      setBankAccounts(banks);
      
      // Set default selected bank if available
      if (banks.length > 0 && !selectedBank) {
        setSelectedBank(banks[0]);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      setError('Gagal memuat daftar bank');
    } finally {
      setBanksLoading(false);
    }
  };

  // When productId changes, fetch the data
  useEffect(() => {
    if (productId) {
      // Get device info from URL parameters
      getDeviceInfoFromUrl();
      
      // Fetch product and plans data
      fetchProductAndPlans();
    }
  }, [productId]);

  // Fetch bank accounts when component mounts
  useEffect(() => {
    if (selectedPlan) {
      fetchBankAccounts();
    }
  }, [selectedPlan]);

  // Customer validation functions
  const validateCustomer = async () => {
    // Basic email validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      showToast("Silakan masukkan email yang valid", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/by-email/${encodeURIComponent(email)}`);
      const data = await response.json();

      if (response.ok) {
        // Email exists - show customer info
        // If the user has a companyId, fetch company details
        let enhancedData = {...data};
        if (data.companyId) {
          try {
            const companyResponse = await fetch(`/api/companies/${data.companyId}`);
            if (companyResponse.ok) {
              const companyData = await companyResponse.json();
              enhancedData.company = companyData;
            }
          } catch (companyError) {
            console.error('Error fetching company info:', companyError);
            // Continue without company info
          }
        }
        
        setCustomerInfo(enhancedData);
        setIsEmailValidated(true);
        setShowRegistrationForm(false);
        showToast("Email Telah terdaftar", "success");
      } else if (response.status === 404) {
        // Email doesn't exist - show registration form
        setCustomerInfo(null);
        setIsEmailValidated(true);
        setShowRegistrationForm(true);
        showToast("Email belum terdaftar", "info");
      } else {
        throw new Error(data.message || 'Error validating email');
      }
    } catch (error) {
      console.error('Validation error:', error);
      showToast("Error validasi email", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    // Validate form fields
    if (!name.trim() || !companyName.trim() || 
        !address.trim() || !phone.trim()) {
      showToast("Silakan lengkapi semua field", "error");
      return;
    }

    setIsLoading(true);
    try {
      // First, create the company
      const companyResponse = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: companyName,
          address: address,
          phone: phone,
          email: email,
          website: "-"
        })
      });

      if (!companyResponse.ok) {
        const errorData = await companyResponse.json();
        throw new Error(errorData.message || 'Failed to create company');
      }

      const companyData = await companyResponse.json();
      
      // Then, create the user with the company ID
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          email: email,
          role: "User",
          companyId: companyData.id
        })
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      const userData = await userResponse.json();
      
      showToast("Berhasil didaftarkan", "success");
      
      // Reset form and show success state
      setCustomerInfo(userData); // Set user info as customer
      setShowRegistrationForm(false);
      setIsEmailValidated(true);
    } catch (error: any) {
      console.error('Registration error:', error);
      showToast(error.message || "Pendaftaran Gagal", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedPlan || !customerInfo) {
      showToast("Data pelanggan atau paket tidak lengkap", "error");
      return;
    }

    setIsLoading(true);
    try {
      // If customer is not validated yet, validate first
      if (!isEmailValidated) {
        await validateCustomer();
        if (!isEmailValidated) {
          showToast("Silakan validasi pelanggan terlebih dahulu", "error");
          setIsLoading(false);
          return;
        }
      }

      // Create the invoice
      const invoiceData = {
        invoiceNumber: `INV-${Date.now()}`, // Generate a unique invoice number
        companyId: customerInfo.companyId || customerInfo.company?.id,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        total: selectedPlan.plan.price,
        paymentMethod: paymentMethod,
        bankId: selectedBank?.id || null,
        lineItems: [
          {
            planId: selectedPlan.plan.id,
            description: `${selectedPlan.plan.product.name} - ${selectedPlan.plan.name}`,
            quantity: 1,
            unitPrice: selectedPlan.plan.price,
            total: selectedPlan.plan.price
          }
        ]
      };

      console.log("Creating invoice with data:", invoiceData);

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create invoice');
      }

      const invoiceResult = await response.json();
      console.log("Invoice created:", invoiceResult);
      
      // Create a license for the selected plan
      const licenseResponse = await fetch('/api/licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: `LIC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, // Generate unique license key
          productId: selectedPlan.plan.productId,
          planId: selectedPlan.plan.id,
          userId: customerInfo.id, // Use the validated customer user id
          invoiceId: invoiceResult.id, // Link to the created invoice
          expiresAt: selectedPlan.plan.durationDays > 0 ? 
            new Date(Date.now() + selectedPlan.plan.durationDays * 24 * 60 * 60 * 1000).toISOString() : 
            null // Calculate expiry based on plan duration or null for perpetual
        })
      });

      if (!licenseResponse.ok) {
        const licenseError = await licenseResponse.json();
        throw new Error(licenseError.error || 'Failed to create license');
      }

      const licenseResult = await licenseResponse.json();
      console.log("License created:", licenseResult);
      showToast("Pembayaran dan lisensi berhasil diproses", "success");
      
      // Optionally redirect or show invoice details
      // For debugging, we'll show the results in the console
      console.log("Invoice and license created successfully:", { invoice: invoiceResult, license: licenseResult });
      
    } catch (error: any) {
      console.error('Payment processing error:', error);
      showToast(error.message || "Proses pembayaran gagal", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Render invoice form when a plan is selected
  if (selectedPlan) {
    const { plan } = selectedPlan;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 pt-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-8 text-blue-600">📦</div>
              <h1 className="text-2xl font-bold text-slate-900">Formulir Pembayaran</h1>
            </div>
            <p className="text-slate-600">Lengkapi informasi pembayaran untuk paket {plan.name}</p>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 p-6">
              <div className="w-5 h-5">📦</div>
              <h2 className="text-xl font-semibold">Detail Paket: {plan.name}</h2>
            </div>
            <div className="p-6 pt-0">
              <div className="space-y-4">
                {/* Product Details */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Detail Produk</h3>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="font-medium">{plan.product.name}</p>
                        <p className="text-sm text-slate-600">{plan.description || plan.product.description || 'Lisensi perangkat lunak'}</p>
                        <p className="text-xs text-slate-500 mt-1">Durasi: {formatDuration(plan.durationDays)}</p>
                      </div>
                      <p className="text-xl font-bold text-blue-600">{formatCurrency(plan.price)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Customer Information */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Informasi Pelanggan</h3>
                  
                  {!isEmailValidated ? (
                    <div className="email-validation">
                      <Label htmlFor="email">Alamat Email:</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Masukkan email Anda"
                      />
                      <Button 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={validateCustomer}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Memvalidasi...' : 'Validasi Pelanggan'}
                      </Button>
                    </div>
                  ) : customerInfo ? (
                    <div className="customer-info">
                      <p><strong>Nama Pengguna:</strong> {name || customerInfo.name}</p>
                      <p><strong>Email:</strong> {email || customerInfo.email}</p>
                      <p><strong>Nama Perusahaan:</strong> {companyName || customerInfo.company?.name || customerInfo.companyId}</p>
                      <p><strong>Alamat:</strong> {address || customerInfo.company?.address}</p>
                      <p><strong>No Telp:</strong> {phone || customerInfo.company?.phone}</p>
                    </div>
                  ) : null}
                  
                  {showRegistrationForm && (
                    <div className="registration-form">
                      <div className="form-group">
                        <Label htmlFor="namaPengguna">Nama Pengguna</Label>
                        <Input
                          id="namaPengguna"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Nama Pengguna"
                        />
                      </div>
                      
                      <div className="form-group">
                        <Label htmlFor="namaPerusahaan">Nama Perusahaan</Label>
                        <Input
                          id="namaPerusahaan"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Nama Perusahaan"
                        />
                      </div>
                      
                      <div className="form-group">
                        <Label htmlFor="alamat">Alamat</Label>
                        <Input
                          id="alamat"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Alamat"
                        />
                      </div>
                      
                      <div className="form-group">
                        <Label htmlFor="phone">No Telp</Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Nomor telepon"
                        />
                      </div>
                      
                      <Button 
                        className="w-full mt-2"
                        onClick={handleRegister}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Mendaftarkan...' : 'Daftar'}
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Payment Method */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Metode Pembayaran</h3>
                  <div className="flex flex-col space-y-2">
                    <div 
                      className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer ${paymentMethod === 'bank' ? 'border-blue-500 bg-blue-50' : ''}`}
                      onClick={() => setPaymentMethod('bank')}
                    >
                      <input 
                        type="radio" 
                        id="bank" 
                        name="paymentMethod" 
                        checked={paymentMethod === 'bank'}
                        onChange={() => setPaymentMethod('bank')}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="bank" className="flex items-center gap-2 flex-grow">
                        <div className="w-4 h-4">🏦</div>
                        Transfer Bank
                      </Label>
                    </div>
                    <div 
                      className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer ${paymentMethod === 'qris' ? 'border-blue-500 bg-blue-50' : ''}`}
                      onClick={() => setPaymentMethod('qris')}
                    >
                      <input 
                        type="radio" 
                        id="qris" 
                        name="paymentMethod" 
                        checked={paymentMethod === 'qris'}
                        onChange={() => setPaymentMethod('qris')}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="qris" className="flex items-center gap-2 flex-grow">
                        <div className="w-4 h-4">📱</div>
                        QRIS
                      </Label>
                    </div>
                    <div 
                      className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer ${paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50' : ''}`}
                      onClick={() => setPaymentMethod('cash')}
                    >
                      <input 
                        type="radio" 
                        id="cash" 
                        name="paymentMethod" 
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="cash" className="flex items-center gap-2 flex-grow">
                        <div className="w-4 h-4">💵</div>
                        Tunai
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                {paymentMethod === 'bank' && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Pilih Bank</h3>
                    {banksLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="w-4 h-4 animate-spin mr-2">🔄</div>
                        <span>Memuat daftar bank...</span>
                      </div>
                    ) : (
                      <select
                        value={selectedBank ? selectedBank.name : ''}
                        onChange={(e) => {
                          const bank = bankAccounts.find(b => b.name === e.target.value);
                          if (bank) setSelectedBank(bank);
                        }}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="">Pilih bank</option>
                        {bankAccounts.map((bank) => (
                          <option key={bank.id} value={bank.name}>
                            {bank.name}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {selectedBank && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Informasi Rekening Pembayaran</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">Nama Bank:</span> {selectedBank.name}</p>
                          <p><span className="font-medium">No. Rekening:</span> {selectedBank.accountNumber}</p>
                          <p><span className="font-medium">Atas Nama:</span> {selectedBank.ownerName}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <Button 
                  className="w-full mt-6"
                  onClick={handleProcessPayment}
                  disabled={isLoading}
                >
                  {isLoading ? 'Memproses...' : 'Proses Pembayaran'}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => setSelectedPlan(null)}
                >
                  Kembali ke Daftar Paket
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Toast notification */}
        {toastMessage && (
          <div className={`toast toast-${toastMessage.type} fixed top-4 right-4 p-4 rounded-md shadow-lg z-50`}>
            {toastMessage.text}
          </div>
        )}
      </div>
    );
  }

  // Otherwise, render the original product license selection
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 text-blue-600">📦</div>
            <h1 className="text-2xl font-bold text-slate-900">Pembayaran Lisensi</h1>
          </div>
          <p className="text-slate-600">Pilih paket lisensi yang sesuai dengan kebutuhan Anda</p>
        </div>

        <div className="space-y-6">
          {product && (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5">🏢</div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  Produk: {product.name}
                </h2>
              </div>
              <p className="text-sm text-slate-600">
                {product.description}
              </p>
            </div>
          )}

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 p-6">
              <div className="w-5 h-5">📦</div>
              <h2 className="text-xl font-semibold">Pilihan Paket Lisensi</h2>
            </div>
            <div className="p-6 pt-0">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="w-6 h-6 animate-spin mr-2">🔄</div>
                  <span>Memuat paket lisensi...</span>
                </div>
              ) : error ? (
                <div className="p-4 rounded-md border border-red-200 bg-red-50 text-red-800">
                  <div className="w-4 h-4 inline mr-2">❌</div>
                  <span>{error}</span>
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600">Tidak ada paket lisensi tersedia saat ini.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {plans.map((plan) => (
                    <div key={plan.id} className="rounded-lg border p-4 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{plan.name}</h3>
                          <p className="text-sm text-slate-600 mb-2">{plan.description || `Paket lisensi untuk ${plan.product.name}`}</p>
                          <div className="text-xs text-slate-500 space-y-1">
                            <p>• Maksimal {plan.deviceLimit} perangkat</p>
                            <p>• Masa aktif: {formatDuration(plan.durationDays)}</p>
                            <p>• Akses penuh ke fitur {plan.product.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-blue-600">{formatCurrency(plan.price)}</p>
                          <p className="text-xs text-slate-500">{formatDuration(plan.durationDays)}</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handlePlanSelect(plan)}
                        className="w-full mt-3"
                      >
                        Pilih Paket Ini
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {deviceInfo && (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="flex items-center gap-2 p-6">
                <div className="w-5 h-5">💻</div>
                <h2 className="text-xl font-semibold">Informasi Perangkat</h2>
              </div>
              <div className="p-6 pt-0">
                <div className="text-sm text-slate-600 space-y-1">
                  <p><span className="font-medium">Computer ID:</span> {deviceInfo.computerId}</p>
                  <p><span className="font-medium">Hostname:</span> {deviceInfo.hostname}</p>
                  <p><span className="font-medium">OS:</span> {deviceInfo.os}</p>
                  <p><span className="font-medium">Manufacturer:</span> {deviceInfo.manufacturer}</p>
                  <p><span className="font-medium">Model:</span> {deviceInfo.model}</p>
                  <p><span className="font-medium">BIOS Version:</span> {deviceInfo.biosVersion}</p>
                  <p><span className="font-medium">Processor:</span> {deviceInfo.processor}</p>
                  <p><span className="font-medium">CPU Cores:</span> {deviceInfo.cpuCores}</p>
                  <p><span className="font-medium">RAM Total:</span> {deviceInfo.ramTotal}</p>
                  <p><span className="font-medium">RAM Free:</span> {deviceInfo.ramFree}</p>
                  <p><span className="font-medium">Storage Total:</span> {deviceInfo.storageTotal}</p>
                  <p><span className="font-medium">Storage Free:</span> {deviceInfo.storageFree}</p>
                  {deviceInfo.disks && deviceInfo.disks.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Disk(s):</p>
                      {deviceInfo.disks.map((disk) => (
                        <p key={disk.index} className="ml-4 text-xs">
                          - {disk.name} ({disk.type}): {disk.size}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="max-w-md mx-auto mt-4">
            <div className="p-4 rounded-md border border-red-200 bg-red-50 text-red-800">
              <div className="w-4 h-4 inline mr-2">❌</div>
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="max-w-md mx-auto mt-4">
            <div className="p-4 rounded-md border border-green-200 bg-green-50 text-green-800">
              <div className="w-4 h-4 inline mr-2">✅</div>
              <span>{success}</span>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <a href="/#/products">
            <Button variant="outline">
              Kembali ke Produk
            </Button>
          </a>
        </div>
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <div className={`toast toast-${toastMessage.type} fixed top-4 right-4 p-4 rounded-md shadow-lg z-50`}>
          {toastMessage.text}
        </div>
      )}
    </div>
  );
};

export default ProductLicense;