import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import Button from './ui/Button';
import { Clipboard } from './icons';

const codeSnippet = `
// --- Contoh Kode Aktivasi Lisensi Klien ---

/**
 * Fungsi ini mengumpulkan detail perangkat, memproses pembayaran (konseptual),
 * dan mengirim permintaan aktivasi ke server lisensi.
 * @param {string} licenseKey - Kunci lisensi yang dimasukkan oleh pengguna.
 * @param {string} productName - Nama produk yang akan diaktivasi, cth: 'NexusDB'.
 */
async function activateLicense(licenseKey, productName) {
  console.log('Memulai proses aktivasi...');

  // 1. Kumpulkan Informasi Perangkat (Isi Devices)
  // Di aplikasi nyata (Electron, Node.js), Anda akan menggunakan library seperti 'os' atau 'systeminformation'.
  const deviceInfo = {
    computerId: 'UNIQUE_MACHINE_ID_GENERATED_BY_YOUR_APP', // Harus unik & persisten
    name: 'NAMA_KOMPUTER_PENGGUNA', // cth: os.hostname()
    os: 'SISTEM_OPERASI', // cth: os.platform() + ' ' + os.release()
    processor: 'INFO_PROSESOR', // cth: os.cpus()[0].model
    ram: 'TOTAL_RAM', // cth: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + 'GB'
  };
  console.log('Info Perangkat:', deviceInfo);

  // 2. Proses Pembayaran (Jika Diperlukan)
  // Untuk produk berbayar, integrasikan proses pembayaran Anda di sini.
  // Aktivasi hanya boleh dilanjutkan setelah pembayaran berhasil.
  console.log('Langkah konseptual: Memproses pembayaran untuk produk', productName);
  const paymentSuccessful = true; // Placeholder
  if (!paymentSuccessful) {
    console.error('Pembayaran gagal. Aktivasi dibatalkan.');
    alert('Aktivasi gagal karena pembayaran tidak berhasil.');
    return;
  }
  console.log('Pembayaran berhasil.');

  // 3. Kirim Permintaan Aktivasi ke Server
  try {
    console.log('Mengirim permintaan ke server lisensi...');
    const response = await fetch('/api/licenses/activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        licenseKey: licenseKey,
        productName: productName,
        device: deviceInfo,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('Aktivasi Berhasil!', result);
      // Simpan status aktivasi secara lokal di aplikasi Anda
      alert('Produk berhasil diaktivasi!');
    } else {
      console.error('Aktivasi Gagal:', result.message);
      alert('Aktivasi gagal: ' + result.message);
    }
  } catch (error) {
    console.error('Terjadi kesalahan jaringan:', error);
    alert('Tidak dapat terhubung ke server aktivasi. Periksa koneksi internet Anda.');
  }
}

// Cara memanggil fungsi:
// activateLicense('XXXX-XXXX-XXXX-XXXX', 'NexusDB');
`;

const CodeBlock: React.FC<{ data: object }> = ({ data }) => (
  <pre className="bg-secondary p-4 rounded-md text-xs overflow-x-auto">
    <code>{JSON.stringify(data, null, 2)}</code>
  </pre>
);

const Help: React.FC = () => {
    const [copyButtonText, setCopyButtonText] = useState('Copy Code');

    const handleCopy = () => {
        navigator.clipboard.writeText(codeSnippet.trim());
        setCopyButtonText('Copied!');
        setTimeout(() => setCopyButtonText('Copy Code'), 2000);
    };

    return (
        <>
            <h1 className="text-3xl font-bold mb-6">Bantuan & Dokumentasi</h1>
            <div className="grid gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Petunjuk Pemakaian</CardTitle>
                        <CardDescription>
                            Panduan untuk mengintegrasikan sistem lisensi dengan aplikasi klien Anda.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <p className="text-sm text-muted-foreground">
                            Untuk mengaktivasi lisensi dari aplikasi Anda (misalnya aplikasi desktop), aplikasi klien perlu mengirimkan permintaan ke server lisensi. Permintaan ini harus berisi kunci lisensi dan informasi unik tentang perangkat tempat aplikasi diinstal.
                        </p>
                        <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 mt-2">
                            <li>Kumpulkan informasi perangkat (ID unik, nama, OS, dll.).</li>
                            <li>Jika produk berbayar, pastikan proses pembayaran selesai.</li>
                            <li>Kirim permintaan POST ke endpoint API aktivasi dengan kunci lisensi dan detail perangkat.</li>
                            <li>Tangani respons dari server untuk mengonfirmasi apakah aktivasi berhasil atau gagal.</li>
                        </ol>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Contoh Kode Klien (JavaScript)</CardTitle>
                                <CardDescription>Gunakan cuplikan ini sebagai titik awal untuk integrasi Anda.</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleCopy}>
                                <Clipboard className="h-4 w-4 mr-2" />
                                {copyButtonText}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <pre className="bg-secondary p-4 rounded-md text-xs overflow-x-auto">
                            <code>
                                {codeSnippet.trim()}
                            </code>
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                     <CardHeader>
                        <CardTitle>Dokumentasi API</CardTitle>
                        <CardDescription>
                            Panduan untuk mengintegrasikan layanan lisensi melalui API.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <section>
                            <h3 className="font-semibold mb-2 text-lg">Otentikasi</h3>
                            <p className="text-sm text-muted-foreground">
                            Semua permintaan API harus menyertakan header <code className="bg-secondary px-1 rounded">Authorization</code> dengan kunci API Anda. Gunakan skema <code className="bg-secondary px-1 rounded">Bearer</code>.
                            </p>
                            <pre className="bg-secondary p-2 mt-2 rounded-md text-xs">
                            Authorization: Bearer &lt;YOUR_API_KEY&gt;
                            </pre>
                        </section>

                        <section>
                            <h3 className="font-semibold mb-2 text-lg">Endpoint Registrasi Pengguna</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              Endpoint ini digunakan untuk membuat akun pengguna baru. Pengguna baru akan secara otomatis diberi peran 'Pengguna' dan ditugaskan ke perusahaan default.
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-sm bg-green-100 text-green-800 px-2 py-1 rounded-md">POST</span>
                              <span className="font-mono text-sm text-gray-700 dark:text-gray-300">/api/users/register</span>
                            </div>
                        </section>

                        <section>
                            <h3 className="font-semibold mb-2 text-lg">Endpoint Aktivasi Lisensi</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                            Endpoint ini digunakan untuk mengaktivasi kunci lisensi untuk produk tertentu pada perangkat baru.
                            </p>
                            <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-md">POST</span>
                            <span className="font-mono text-sm text-gray-700 dark:text-gray-300">/api/licenses/activate</span>
                            </div>
                        </section>
                        
                        <section>
                            <h3 className="font-semibold mb-2 text-lg">Endpoint Update Last Seen (Heartbeat)</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              Endpoint ini harus dipanggil secara berkala oleh aplikasi klien (misalnya, setiap jam atau saat aplikasi dimulai) untuk memberi tahu server bahwa perangkat tersebut masih aktif. Ini juga berfungsi sebagai cara untuk memeriksa status lisensi saat ini.
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-md">POST</span>
                              <span className="font-mono text-sm text-gray-700 dark:text-gray-300">/api/devices/heartbeat</span>
                            </div>
                        </section>

                        <section>
                            <h4 className="font-semibold mb-2">Request Body (Registrasi Pengguna)</h4>
                            <CodeBlock data={{
                                "name": "John Doe",
                                "email": "john.doe@example.com",
                                "password": "a_strong_password_123"
                            }}
                            />
                        </section>
                        
                        <section>
                            <h4 className="font-semibold mb-2">Request Body (Aktivasi)</h4>
                            <CodeBlock data={{
                                "licenseKey": "XXXX-XXXX-XXXX-XXXX",
                                "productName": "NexusDB",
                                "device": {
                                "computerId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
                                "name": "DEV-MACHINE-01",
                                "os": "Windows 11 Pro",
                                "processor": "Intel Core i9-13900K",
                                "ram": "32GB"
                                }
                            }}
                            />
                        </section>
                        
                        <section>
                            <h4 className="font-semibold mb-2">Request Body (Heartbeat)</h4>
                            <CodeBlock data={{
                                "licenseKey": "XXXX-XXXX-XXXX-XXXX",
                                "computerId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
                            }}
                            />
                        </section>

                        <section>
                             <h4 className="font-semibold mb-2">Success Response (Registrasi Pengguna - 201 Created)</h4>
                            <CodeBlock data={{
                                "success": true,
                                "message": "User registered successfully.",
                                "user": {
                                  "id": "usr_12345",
                                  "name": "John Doe",
                                  "email": "john.doe@example.com",
                                  "role": "User",
                                  "companyId": "comp_default_123"
                                }
                            }}
                            />
                        </section>

                        <section>
                            <h4 className="font-semibold mb-2">Success Response (Aktivasi - 200 OK)</h4>
                            <CodeBlock data={{
                                "success": true,
                                "message": "License activated successfully.",
                                "license": {
                                "key": "XXXX-XXXX-XXXX-XXXX",
                                "isActive": true,
                                "expiresAt": "2025-07-25T10:00:00.000Z"
                                },
                                "device": {
                                "id": "dev_12345",
                                "name": "DEV-MACHINE-01",
                                "activatedAt": "2024-07-25T10:00:00.000Z",
                                "lastSeenAt": "2024-07-25T10:00:00.000Z"
                                }
                            }}
                            />
                        </section>
                        
                        <section>
                            <h4 className="font-semibold mb-2">Success Response (Heartbeat - 200 OK)</h4>
                            <p className="text-sm text-muted-foreground mb-2">Aplikasi klien harus memeriksa `licenseStatus`. Jika tidak 'active', aplikasi harus menonaktifkan fitur premium atau keluar.</p>
                            <CodeBlock data={{
                                "success": true,
                                "licenseStatus": "active", // Bisa 'active', 'inactive', 'expired'
                                "message": "Heartbeat received. License is active."
                            }}
                            />
                        </section>

                        <section>
                            <h4 className="font-semibold mb-2">Error Responses</h4>
                            <p className="text-sm text-muted-foreground mb-2">Contoh respons kesalahan umum.</p>
                            
                            <p className="text-xs font-semibold mt-4 mb-1">409 Conflict (cth: Email sudah ada)</p>
                            <CodeBlock data={{
                                "success": false,
                                "error": "EMAIL_ALREADY_EXISTS",
                                "message": "An account with this email address already exists."
                            }}
                            />

                            <p className="text-xs font-semibold mt-4 mb-1">400 Bad Request (cth: Kunci tidak valid)</p>
                            <CodeBlock data={{
                                "success": false,
                                "error": "INVALID_LICENSE_KEY",
                                "message": "The provided license key is not valid or does not exist."
                            }}
                            />

                            <p className="text-xs font-semibold mt-4 mb-1">400 Bad Request (cth: Batas perangkat tercapai)</p>
                            <CodeBlock data={{
                                "success": false,
                                "error": "DEVICE_LIMIT_REACHED",
                                "message": "The maximum number of devices for this license has been reached."
                            }}
                            />
                            
                            <p className="text-xs font-semibold mt-4 mb-1">404 Not Found (cth: Perangkat tidak ditemukan untuk heartbeat)</p>
                            <CodeBlock data={{
                                "success": false,
                                "error": "DEVICE_NOT_FOUND",
                                "message": "No active device with the specified computerId was found for this license."
                            }}
                            />

                             <p className="text-xs font-semibold mt-4 mb-1">401 Unauthorized</p>
                            <CodeBlock data={{
                                "success": false,
                                "error": "UNAUTHORIZED",
                                "message": "API key is missing or invalid."
                            }}
                            />
                        </section>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default Help;
