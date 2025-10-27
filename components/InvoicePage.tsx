import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Label from './ui/Label';
import Select from './ui/Select';
import { Loader2, CheckCircle, XCircle, CreditCard, Building, QrCode, Banknote } from 'lucide-react';

interface DeviceInfo {
  computerId: string;
  name: string;
  os: string;
  processor: string;
  ram: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price?: number;
  duration?: string;
  features?: string[];
}

interface PlanWithProduct {
  id: string;
  productId: string;
  name: string;
  price: number;
  deviceLimit: number;
  durationDays: number;
  description?: string;
  product: Product;
}

interface Invoice {
  id: string;
  plan: PlanWithProduct;
  deviceInfo: DeviceInfo;
  total: number;
  paymentMethod: 'bank' | 'qris' | 'cash';
  userName?: string;
  userEmail?: string;
  companyName?: string;
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

const bankAccounts = [
  { bankName: 'BCA', accountNumber: '1234567890', accountName: 'PT. Nexus Technology' },
  { bankName: 'Mandiri', accountNumber: '9876543210', accountName: 'PT. Nexus Technology' },
  { bankName: 'BNI', accountNumber: '5555666677', accountName: 'PT. Nexus Technology' }
];

const InvoicePage: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<PlanWithProduct | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceCreated, setInvoiceCreated] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'qris' | 'cash'>('bank');
  const [selectedBank, setSelectedBank] = useState(bankAccounts[0]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Generate computer ID
  const generateComputerId = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return btoa(timestamp + random).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
  };

  // Get device info
  const getDeviceInfo = (): DeviceInfo => {
    const userAgent = navigator.userAgent;
    let os = 'Unknown';
    
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    const ramOptions = ['8GB', '16GB', '32GB', '64GB'];
    const processorOptions = ['Intel Core i5', 'Intel Core i7', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Apple M1', 'Apple M2'];
    
    return {
      computerId: generateComputerId(),
      name: 'My-PC',
      os: os,
      processor: processorOptions[Math.floor(Math.random() * processorOptions.length)],
      ram: ramOptions[Math.floor(Math.random() * ramOptions.length)]
    };
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  // Extract plan from URL params
  useEffect(() => {
    const hash = window.location.hash;
    const searchPart = hash.split('?')[1];
    if (searchPart) {
      const urlParams = new URLSearchParams(searchPart);
      const planParam = urlParams.get('plan');
      
      if (planParam) {
        try {
          const plan = JSON.parse(decodeURIComponent(planParam));
          setSelectedPlan(plan);
          
          // Initialize device info
          const newDeviceInfo = getDeviceInfo();
          setDeviceInfo(newDeviceInfo);
          
          // Initialize invoice
          setInvoice({
            id: `INV-${Date.now()}`,
            plan: plan,
            deviceInfo: newDeviceInfo,
            total: plan.price,
            paymentMethod: 'bank',
            userName: name || '',
            userEmail: email || '',
            companyName: companyName || ''
          });
        } catch (e) {
          console.error('Error parsing plan from URL:', e);
          setError('Gagal memuat data paket. Silakan kembali dan pilih paket lagi.');
        }
      } else {
        // If no plan in URL, redirect to products
        window.location.hash = '#/products';
      }
    } else {
      // If no query parameters, redirect to products
      window.location.hash = '#/products';
    }
  }, []);

  // Handle checkout - create invoice via API
  const handleCheckout = async () => {
    if (!invoice || !selectedPlan) return;
    
    // Validate customer information
    if (!name.trim()) {
      setError('Nama pengguna harus diisi');
      return;
    }
    
    if (!email.trim()) {
      setError('Alamat email harus diisi');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Format email tidak valid');
      return;
    }
    
    if (!companyName.trim()) {
      setError('Nama perusahaan harus diisi');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Create invoice via API
      const invoiceData = {
        invoiceNumber: `INV-${Date.now()}`,
        companyId: 'company-123', // This would come from user/company data in a full implementation
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        total: invoice.total,
        paymentMethod,
        bankId: paymentMethod === 'bank' ? selectedBank.bankName : null,
        customerName: name,
        customerEmail: email,
        companyName: companyName,
        lineItems: [
          {
            planId: selectedPlan.id,
            description: `${selectedPlan.product.name} - ${selectedPlan.name}`,
            quantity: 1,
            unitPrice: selectedPlan.price,
            total: selectedPlan.price
          }
        ]
      };

      // Make API call to create invoice
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Invoice creation failed:', errorText);
        throw new Error(`Failed to create invoice: ${response.status} - ${errorText}`);
      }

      const createdInvoice = await response.json();
      
      // Update the invoice with the new ID from the API
      setInvoice({
        ...invoice,
        id: createdInvoice.invoiceNumber || invoiceData.invoiceNumber
      });
      
      setInvoiceCreated(true);
      setSuccess('Invoice berhasil dibuat. Silakan lanjutkan ke pembayaran.');
    } catch (error) {
      console.error('Error creating invoice:', error);
      setError('Gagal membuat invoice. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle cancel checkout - reset the invoice creation state
  const handleCancelCheckout = () => {
    setInvoiceCreated(false);
    setSuccess('');
  };

  // Generate license key
  const generateLicenseKey = () => {
    // Generate a random license key (in a real system, this would come from the server)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
      if ((i + 1) % 4 === 0 && i < 15) result += '-';
    }
    return result;
  };

  // Handle payment confirmation
  const handlePaymentConfirmation = async () => {
    if (!invoice || !selectedPlan) return;
    
    setLoading(true);
    setError('');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate license key
      const licenseKey = generateLicenseKey();
      
      // Try to activate the license via API
      const activationData = {
        licenseKey,
        productName: selectedPlan.product.name,
        device: {
          computerId: invoice.deviceInfo.computerId,
          name: invoice.deviceInfo.name,
          os: invoice.deviceInfo.os,
          processor: invoice.deviceInfo.processor,
          ram: invoice.deviceInfo.ram
        }
      };

      const activationResponse = await fetch('/api/licenses/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activationData)
      });

      if (!activationResponse.ok) {
        const errorData = await activationResponse.text();
        throw new Error(`Failed to activate license: ${activationResponse.status} - ${errorData}`);
      }

      const activationResult = await activationResponse.json();
      
      // Store license in localStorage and redirect to success page
      const newLicense = {
        ...activationResult.license,
        key: licenseKey,
        status: 'active',
        lastSeen: new Date().toISOString(),
        device: invoice.deviceInfo,
        plan: selectedPlan,
        product: selectedPlan.product
      };

      localStorage.setItem('license', JSON.stringify(newLicense));
      
      // Show success and redirect
      setSuccess('Pembayaran berhasil! Lisensi telah aktif.');
      setTimeout(() => {
        window.location.hash = '#/products';
      }, 2000);
    } catch (err) {
      console.error('Error confirming payment:', err);
      setError('Konfirmasi pembayaran gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (!invoice || !selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Memuat data invoice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Invoice Pembayaran</h1>
          </div>
          <p className="text-slate-600">Lengkapi informasi untuk membuat invoice</p>
        </div>

        <Card className="w-full mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Invoice Pembayaran
            </CardTitle>
            <CardDescription>
              Invoice #{invoice.id}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-2">
              <h3 className="font-semibold">Informasi Pelanggan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="namaPengguna">Nama Pengguna</Label>
                  <Input
                    id="namaPengguna"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama Pengguna"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Alamat Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Alamat Email"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="namaPerusahaan">Nama Perusahaan</Label>
                  <Input
                    id="namaPerusahaan"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nama Perusahaan"
                  />
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-2">
              <h3 className="font-semibold">Detail Paket Lisensi</h3>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-medium">{invoice.plan.name}</p>
                    <p className="text-sm text-slate-600">{invoice.plan.description || `Paket lisensi untuk ${invoice.plan.product.name}`}</p>
                    <p className="text-xs text-slate-500 mt-1">Produk: {invoice.plan.product.name}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(invoice.plan.price)}</p>
                </div>
                <div className="text-xs text-slate-500 space-y-1 mt-2">
                  <p>• Maksimal {invoice.plan.deviceLimit} perangkat</p>
                  <p>• Masa aktif: {invoice.plan.durationDays === 0 ? 'Perpetual (Lifetime)' : 
                      invoice.plan.durationDays === 365 ? '1 Tahun' :
                      invoice.plan.durationDays > 30 ? `${Math.floor(invoice.plan.durationDays / 30)} Bulan` :
                      `${invoice.plan.durationDays} Hari`}</p>
                  <p>• Akses penuh ke fitur {invoice.plan.product.name}</p>
                </div>
              </div>
            </div>

            {/* Device Info */}
            <div className="space-y-2">
              <h3 className="font-semibold">Informasi Perangkat</h3>
              <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                <p><span className="font-medium">Computer ID:</span> {invoice.deviceInfo.computerId}</p>
                <p><span className="font-medium">OS:</span> {invoice.deviceInfo.os}</p>
                <p><span className="font-medium">Processor:</span> {invoice.deviceInfo.processor}</p>
                <p><span className="font-medium">RAM:</span> {invoice.deviceInfo.ram}</p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <h3 className="font-semibold">Metode Pembayaran</h3>
              <div className="space-y-2">
                <div 
                  className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer ${paymentMethod === 'bank' ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => setPaymentMethod('bank')}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'bank' ? 'border-blue-500' : 'border-gray-300'}`}>
                    {paymentMethod === 'bank' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                  </div>
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Building className="w-4 h-4" />
                    Transfer Bank
                  </Label>
                </div>
                <div 
                  className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer ${paymentMethod === 'qris' ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => setPaymentMethod('qris')}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'qris' ? 'border-blue-500' : 'border-gray-300'}`}>
                    {paymentMethod === 'qris' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                  </div>
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <QrCode className="w-4 h-4" />
                    QRIS
                  </Label>
                </div>
                <div 
                  className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer ${paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'cash' ? 'border-blue-500' : 'border-gray-300'}`}>
                    {paymentMethod === 'cash' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                  </div>
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <Banknote className="w-4 h-4" />
                    Tunai
                  </Label>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            {paymentMethod === 'bank' && (
              <div className="space-y-2">
                <h3 className="font-semibold">Pilih Bank</h3>
                <Select 
                  value={selectedBank.bankName} 
                  onChange={(e) => {
                    const bank = bankAccounts.find(b => b.bankName === e.target.value);
                    if (bank) setSelectedBank(bank);
                  }}
                >
                  {bankAccounts.map((bank) => (
                    <option key={bank.bankName} value={bank.bankName}>
                      {bank.bankName}
                    </option>
                  ))}
                </Select>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Informasi Rekening Pembayaran</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Nama Bank:</span> {selectedBank.bankName}</p>
                    <p><span className="font-medium">No. Rekening:</span> {selectedBank.accountNumber}</p>
                    <p><span className="font-medium">Atas Nama:</span> {selectedBank.accountName}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Total Pembayaran:</span>
                <span className="font-bold text-xl text-blue-600">{formatCurrency(invoice.total)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => window.location.hash = `#/product_license?productId=${selectedPlan.productId}`}
              >
                Kembali
              </Button>
              
              {!invoiceCreated ? (
                <Button 
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Membuat Invoice...
                    </>
                  ) : (
                    'Checkout Pembayaran'
                  )}
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline"
                    onClick={handleCancelCheckout}
                    className="flex-1"
                  >
                    Cancel Pembayaran
                  </Button>
                  <Button 
                    onClick={handlePaymentConfirmation}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      'Konfirmasi Pembayaran'
                    )}
                  </Button>
                </>
              )}
            </div>

            {error && (
              <div className="p-4 rounded-md border border-red-200 bg-red-50 text-red-800">
                <div className="flex items-center">
                  <XCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-md border border-green-200 bg-green-50 text-green-800">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {success}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Button 
            variant="outline" 
            onClick={() => window.location.hash = '#/products'}
          >
            Kembali ke Produk
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;