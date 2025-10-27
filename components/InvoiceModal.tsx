import React, { useState, useEffect, useMemo } from 'react';
import type { Invoice, InvoiceLineItem, Company, Plan, Product, Bank } from '../types';
import { useBanks } from '../hooks/useApiData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/Dialog';
import Button from './ui/Button';
import Label from './ui/Label';
import Input from './ui/Input';
import Select from './ui/Select';
import { Trash2 } from './icons';
import { v4 as uuidv4 } from 'uuid';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Omit<Invoice, 'id'> | Invoice) => void;
  invoiceToEdit: Invoice | null;
  companies: Company[];
  plans: Plan[];
  products: Product[];
}

const toInputDate = (date: Date) => date.toISOString().split('T')[0];

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, onSave, invoiceToEdit, companies, plans, products }) => {
  const { data: banks } = useBanks();
  const [companyId, setCompanyId] = useState('');
  const [issueDate, setIssueDate] = useState(toInputDate(new Date()));
  const [dueDate, setDueDate] = useState(toInputDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [status, setStatus] = useState<Invoice['status']>('Unpaid');
  const [paymentMethod, setPaymentMethod] = useState<Invoice['paymentMethod']>('Bank');
  const [bankId, setBankId] = useState<string | undefined | null>('');

  const productMap = useMemo(() => new Map(products.map(p => [p.id, p.name])), [products]);

  useEffect(() => {
    if (isOpen) {
      if (invoiceToEdit) {
        setCompanyId(invoiceToEdit.companyId);
        setIssueDate(toInputDate(new Date(invoiceToEdit.issueDate)));
        setDueDate(toInputDate(new Date(invoiceToEdit.dueDate)));
        setLineItems(invoiceToEdit.lineItems.map(item => ({ ...item, id: uuidv4() }))); // Ensure frontend has unique keys
        setStatus(invoiceToEdit.status);
        setPaymentMethod(invoiceToEdit.paymentMethod);
        setBankId(invoiceToEdit.bankId);
      } else {
        setCompanyId(companies[0]?.id || '');
        setIssueDate(toInputDate(new Date()));
        setDueDate(toInputDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));
        setLineItems([{ id: uuidv4(), planId: plans[0]?.id || '', description: '', quantity: 1, unitPrice: 0 }]);
        setStatus('Unpaid');
        setPaymentMethod('Bank');
        setBankId(banks?.[0]?.id || '');
      }
    }
  }, [invoiceToEdit, isOpen, companies, plans, banks]);

  const handleAddItem = () => {
    setLineItems([...lineItems, { id: uuidv4(), planId: plans[0]?.id || '', description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'planId') {
          const selectedPlan = plans.find(p => p.id === value);
          if (selectedPlan) {
            updatedItem.unitPrice = selectedPlan.price;
            const productName = productMap.get(selectedPlan.productId) || 'Unknown Product';
            updatedItem.description = `${productName} - ${selectedPlan.name}`;
          }
        }
        return updatedItem;
      }
      return item;
    }));
  };
  
  const total = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }, [lineItems]);
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

  const handleSubmit = () => {
    const invoiceData = {
      companyId,
      issueDate: new Date(issueDate).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      status,
      paymentMethod,
      bankId: paymentMethod === 'Bank' ? bankId : null,
      lineItems,
      total,
      invoiceNumber: invoiceToEdit?.invoiceNumber || `INV-${Date.now()}`
    };
    const { invoiceNumber, ...invoiceDataWithoutNumber } = invoiceData;
    onSave(invoiceToEdit ? { ...invoiceToEdit, ...invoiceDataWithoutNumber } : invoiceDataWithoutNumber);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogClose onClose={onClose} />
        <DialogHeader>
          <DialogTitle>{invoiceToEdit ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
          <DialogDescription>Fill in the details below to generate an invoice.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 p-6 pt-0 max-h-[60vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <div>
                <Label htmlFor="company">Company</Label>
                <Select id="company" value={companyId} onChange={e => setCompanyId(e.target.value)} disabled={companies.length === 0}>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
             </div>
              <div>
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input id="issueDate" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
               <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select id="paymentMethod" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as Invoice['paymentMethod'])}>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Qris">Qris</option>
                </Select>
              </div>
          </div>
          
          {paymentMethod === 'Bank' && (
            <div>
              <Label htmlFor="bank">Bank Account</Label>
              <Select id="bank" value={bankId || ''} onChange={e => setBankId(e.target.value)}>
                <option value="">Select a bank</option>
                {banks?.map(b => <option key={b.id} value={b.id}>{b.name} - {b.accountNumber}</option>)}
              </Select>
            </div>
          )}

          <div>
            <Label>Line Items</Label>
            <div className="space-y-2 mt-2">
              {lineItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-[1fr,100px,150px,150px,auto] gap-2 items-center p-2 border rounded-md">
                  <Select value={item.planId} onChange={e => handleItemChange(item.id, 'planId', e.target.value)}>
                    <option value="">Select a plan</option>
                    {plans?.map(p => <option key={p.id} value={p.id}>{productMap.get(p.productId)} - {p.name}</option>)}
                  </Select>
                  <Input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))}/>
                  <Input type="number" placeholder="Unit Price" value={item.unitPrice} onChange={e => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}/>
                  <div className="text-right pr-2">{formatCurrency(item.quantity * item.unitPrice)}</div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={handleAddItem} className="mt-2">Add Item</Button>
          </div>
          
          <div className="flex justify-end items-center space-x-4">
             <Label htmlFor="status">Status</Label>
             <Select id="status" value={status} onChange={e => setStatus(e.target.value as Invoice['status'])} className="w-32">
                 <option value="Unpaid">Unpaid</option>
                 <option value="Paid">Paid</option>
                 <option value="Overdue">Overdue</option>
             </Select>
             <div className="text-right">
                <p className="text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{formatCurrency(total)}</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Invoice</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceModal;