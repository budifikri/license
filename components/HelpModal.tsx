import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/Dialog';
import Button from './ui/Button';
import { Clipboard } from './icons';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    const [copyButtonText, setCopyButtonText] = useState('Copy Code');

    const handleCopy = () => {
        navigator.clipboard.writeText(codeSnippet.trim());
        setCopyButtonText('Copied!');
        setTimeout(() => setCopyButtonText('Copy Code'), 2000);
    };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle>Bantuan & Petunjuk Penggunaan</DialogTitle>
          <DialogDescription>
            Panduan untuk mengintegrasikan sistem lisensi dengan aplikasi klien Anda.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-0 space-y-6 max-h-[70vh] overflow-y-auto">
            <div>
                <h3 className="font-semibold mb-2">Petunjuk Pemakaian</h3>
                <p className="text-sm text-muted-foreground">
                    Untuk mengaktivasi lisensi dari aplikasi Anda (misalnya aplikasi desktop), aplikasi klien perlu mengirimkan permintaan ke server lisensi. Permintaan ini harus berisi kunci lisensi dan informasi unik tentang perangkat tempat aplikasi diinstal.
                </p>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 mt-2">
                    <li>Kumpulkan informasi perangkat (ID unik, nama, OS, dll.).</li>
                    <li>Jika produk berbayar, pastikan proses pembayaran selesai.</li>
                    <li>Kirim permintaan POST ke endpoint API aktivasi dengan kunci lisensi dan detail perangkat.</li>
                    <li>Tangani respons dari server untuk mengonfirmasi apakah aktivasi berhasil atau gagal.</li>
                </ol>
            </div>
             <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Contoh Kode Klien (JavaScript)</h3>
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                        <Clipboard className="h-4 w-4 mr-2" />
                        {copyButtonText}
                    </Button>
                </div>
                 <pre className="bg-secondary p-4 rounded-md text-xs overflow-x-auto">
                    <code>
                        {codeSnippet.trim()}
                    </code>
                </pre>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HelpModal;