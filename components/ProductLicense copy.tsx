import React, { useState } from 'react';
import './ProductLicense.css';

const ProductLicense = () => {
  const [email, setEmail] = useState('');
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [isEmailValidated, setIsEmailValidated] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state for API calls
  const [toastMessage, setToastMessage] = useState<{text: string, type: 'success' | 'error' | 'info'} | null>(null);
  
  // Registration form state
  const [formData, setFormData] = useState({
    userName: '',
    companyName: '',
    address: '',
    phone: ''
  });

  const showToast = (text: string, type: 'success' | 'error' | 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000); // Auto-hide after 3 seconds
  };

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
    if (!formData.userName.trim() || !formData.companyName.trim() || 
        !formData.address.trim() || !formData.phone.trim()) {
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
          name: formData.companyName,
          address: formData.address,
          phone: formData.phone,
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
          name: formData.userName,
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="product-license-form">
      <h2>Formulir Pembayaran</h2>
      
      {/* Toast notification */}
      {toastMessage && (
        <div className={`toast toast-${toastMessage.type}`}>
          {toastMessage.text}
        </div>
      )}
      
      <div className="form-section">
        <div className="email-validation">
          <label htmlFor="email">Alamat Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isEmailValidated || isLoading}
            placeholder="Masukkan email Anda"
          />
          {!isEmailValidated && (
            <button onClick={validateCustomer} disabled={isLoading}>
              {isLoading ? 'Memvalidasi...' : 'Validasi Pelanggan'}
            </button>
          )}
          {isLoading && <div className="loading">Memproses...</div>}
        </div>
      </div>

      {isEmailValidated && customerInfo && (
        <div className="customer-info">
          <h3>Informasi Pelanggan</h3>
          <p><strong>Nama Pengguna:</strong> {customerInfo.name}</p>
          <p><strong>Email:</strong> {customerInfo.email}</p>
          <p><strong>Role:</strong> {customerInfo.role}</p>
          {customerInfo.company && (
            <>
              <p><strong>Nama Perusahaan:</strong> {customerInfo.company.name}</p>
              <p><strong>Alamat:</strong> {customerInfo.company.address}</p>
              <p><strong>No Telp:</strong> {customerInfo.company.phone}</p>
            </>
          )}
        </div>
      )}

      {showRegistrationForm && (
        <div className="registration-form">
          <h3>Registrasi Pelanggan Baru</h3>
          <div className="form-group">
            <label htmlFor="userName">Nama Pengguna:</label>
            <input
              type="text"
              id="userName"
              name="userName"
              value={formData.userName}
              onChange={handleInputChange}
              placeholder="Nama pengguna"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="companyName">Nama Perusahaan:</label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="Nama perusahaan"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="address">Alamat:</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Alamat"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">No Telp:</label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Nomor telepon"
            />
          </div>
          
          <button onClick={handleRegister} disabled={isLoading}>
            {isLoading ? 'Mendaftarkan...' : 'Daftar'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductLicense;