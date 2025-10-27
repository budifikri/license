import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/Dialog';
import Button from './ui/Button';

interface ApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// FIX: Updated CodeBlock to accept a 'data' prop of type object, as objects cannot be passed as React children.
// This allows the component to correctly stringify and display the JSON object.
const CodeBlock: React.FC<{ data: object }> = ({ data }) => (
  <pre className="bg-secondary p-4 rounded-md text-xs overflow-x-auto">
    <code>{JSON.stringify(data, null, 2)}</code>
  </pre>
);

const ApiDocsModal: React.FC<ApiDocsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle>Dokumentasi API</DialogTitle>
          <DialogDescription>
            Panduan untuk mengintegrasikan layanan lisensi melalui API.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-0 space-y-6 max-h-[70vh] overflow-y-auto">
          
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
            <h4 className="font-semibold mb-2">Request Body</h4>
            {/* FIX: Changed component usage to pass object via 'data' prop. */}
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
            <h4 className="font-semibold mb-2">Success Response (200 OK)</h4>
            {/* FIX: Changed component usage to pass object via 'data' prop. */}
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
            <h4 className="font-semibold mb-2">Error Responses</h4>
            <p className="text-sm text-muted-foreground mb-2">Contoh respons kesalahan umum.</p>
            
            <p className="text-xs font-semibold mt-4 mb-1">400 Bad Request (cth: Kunci tidak valid)</p>
            {/* FIX: Changed component usage to pass object via 'data' prop. */}
            <CodeBlock data={{
                "success": false,
                "error": "INVALID_LICENSE_KEY",
                "message": "The provided license key is not valid or does not exist."
              }}
            />

            <p className="text-xs font-semibold mt-4 mb-1">400 Bad Request (cth: Batas perangkat tercapai)</p>
            {/* FIX: Changed component usage to pass object via 'data' prop. */}
            <CodeBlock data={{
                "success": false,
                "error": "DEVICE_LIMIT_REACHED",
                "message": "The maximum number of devices for this license has been reached."
              }}
            />

             <p className="text-xs font-semibold mt-4 mb-1">401 Unauthorized</p>
            {/* FIX: Changed component usage to pass object via 'data' prop. */}
            <CodeBlock data={{
                "success": false,
                "error": "UNAUTHORIZED",
                "message": "API key is missing or invalid."
              }}
            />
          </section>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiDocsModal;