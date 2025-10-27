import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Loader2, CheckCircle, XCircle, Computer, Package, Building, QrCode, Banknote } from 'lucide-react';

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

const StandaloneProductLicense: React.FC = () => {
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Get device info from URL parameters
  const getDeviceInfoFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const deviceInfoParam = urlParams.get('deviceInfo');
    if (deviceInfoParam) {
      try {
        const deviceInfoObj: DeviceInfo = JSON.parse(deviceInfoParam);
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
    
    try {
      // Fetch the specific product data
      const productResponse = await fetch(`/api/products/${productId}`);
      
      if (!productResponse.ok) {
        throw new Error(`Failed to fetch product: ${productResponse.statusText}`);
      }
      
      const productData: Product = await productResponse.json();
      setProduct(productData);
      
      // Fetch plans for this product
      const plansResponse = await fetch(`/api/plans?productId=${productId}`);
      
      if (!plansResponse.ok) {
        throw new Error(`Failed to fetch plans: ${plansResponse.statusText}`);
      }
      
      const plansData: Plan[] = await plansResponse.json();
      
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
      
    } catch (err) {
      console.error('Error fetching product and plans:', err);
      setError('Gagal memuat data produk dan paket lisensi');
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
    // Check URL for productId parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlProductId = urlParams.get('productId');
    
    if (urlProductId) {
      setProductId(urlProductId);
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

  // Render invoice form when a plan is selected
  if (selectedPlan) {
    const { plan } = selectedPlan;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 pt-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Package className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900">Formulir Pembayaran</h1>
            </div>
            <p className="text-slate-600">Lengkapi informasi pembayaran untuk paket {plan.name}</p>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 p-6">
              <Package className="w-5 h-5" />
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
                      <p className="font-semibold">{formatCurrency(plan.price)}</p>
                    </div>
                  </div>
                </div>
                
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
                
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                >
                  Validasi Pelanggan
                </Button>
                
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
                        <Building className="w-4 h-4" />
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
                        <QrCode className="w-4 h-4" />
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
                    {banksLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
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
                
                <Button className="w-full mt-6">
                  Proses Pembayaran
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
      </div>
    );
  }

  // Otherwise, render the original product license selection
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Package className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Pembayaran Lisensi</h1>
          </div>
          <p className="text-slate-600">Pilih paket lisensi yang sesuai dengan kebutuhan Anda</p>
        </div>

        <div className="space-y-6">
          {product && (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-5 h-5" />
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
              <Package className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Pilihan Paket Lisensi</h2>
            </div>
            <div className="p-6 pt-0">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Memuat paket lisensi...</span>
                </div>
              ) : error ? (
                <div className="p-4 rounded-md border border-red-200 bg-red-50 text-red-800">
                  <XCircle className="h-4 w-4 inline mr-2" />
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
                <Computer className="w-5 h-5" />
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
              <XCircle className="h-4 w-4 inline mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="max-w-md mx-auto mt-4">
            <div className="p-4 rounded-md border border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4 inline mr-2" />
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
    </div>
  );
};

export default StandaloneProductLicense;