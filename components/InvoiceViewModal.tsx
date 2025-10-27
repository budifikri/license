import React, { useRef } from 'react';
import type { Invoice, Company, LicenseKey } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogClose } from './ui/Dialog';
import Button from './ui/Button';
import { formatDate } from '../utils/date';
import { KeyRound } from './icons';

interface InvoiceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: (Invoice & { companyName: string }) | null;
  company: Company | null;
  licenses: LicenseKey[];
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({ isOpen, onClose, invoice, company, licenses }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open('', '', 'height=800,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Print Invoice</title>');
        printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
        printWindow.document.write('</head><body class="p-8">');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
      }
    }
  };

  if (!isOpen || !invoice || !company) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogClose onClose={onClose} />
        <div ref={printRef} className="p-6 pt-0">
          <header className="mb-8 border-b pb-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center mb-4">
                  <KeyRound className="h-8 w-8 text-primary" />
                  <h1 className="ml-2 text-2xl font-bold">Licenser</h1>
                </div>
                <p className="text-sm text-gray-500">Innovate Corp</p>
                <p className="text-sm text-gray-500">Jl. Teknologi No. 1, Jakarta</p>
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-bold text-gray-800">INVOICE</h2>
                <p className="font-mono text-gray-500">{invoice.invoiceNumber}</p>
                 <div className="mt-2">
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                        {invoice.status.toUpperCase()}
                    </span>
                  </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <h4 className="font-semibold mb-1 text-gray-600">Billed To:</h4>
              <p className="font-bold text-lg">{company.name}</p>
            </div>
            <div className="text-right">
              <p><span className="font-semibold text-gray-600">Issue Date:</span> {formatDate(invoice.issueDate)}</p>
              <p><span className="font-semibold text-gray-600">Due Date:</span> {formatDate(invoice.dueDate)}</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left font-semibold text-gray-600">Description</th>
                  <th className="p-3 text-center font-semibold text-gray-600">Qty</th>
                  <th className="p-3 text-right font-semibold text-gray-600">Unit Price</th>
                  <th className="p-3 text-right font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3">{item.description}</td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="p-3 text-right font-medium">{formatCurrency(item.unitPrice * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-8">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Subtotal:</span>
                <span className="text-gray-800">{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t pt-3">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {licenses.length > 0 && (
             <div className="mt-10">
                <h4 className="font-semibold mb-2 text-gray-600">Generated License Keys:</h4>
                <div className="text-xs font-mono bg-gray-50 p-3 rounded-md space-y-1 max-h-24 overflow-y-auto">
                    {licenses.map(lic => (
                        <div key={lic.id} className="flex justify-between items-center">
                            <span>{lic.key}</span>
                             <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                lic.status === 'Active' ? 'bg-green-100 text-green-800' :
                                lic.status === 'Expired' ? 'bg-gray-200 text-gray-700' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                                {lic.status}
                            </span>
                        </div>
                    ))}
                </div>
             </div>
          )}

          <div className="mt-10 border-t pt-4 text-xs text-gray-500">
            <p><strong>Payment Details:</strong> Please transfer to the specified bank account. Thank you for your business!</p>
          </div>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handlePrint}>Print</Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceViewModal;