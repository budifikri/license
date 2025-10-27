// Simple test to verify the invoice deletion fix
// This connects directly to the database to test the delete operation

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function testInvoiceDeletion() {
  try {
    console.log("Testing invoice deletion...");
    
    // Find an existing invoice to test with
    const invoices = await db.invoice.findMany({
      include: {
        lineItems: true,
        licenses: true
      },
      take: 1
    });
    
    if (invoices.length === 0) {
      console.log("No invoices found to test with");
      return;
    }
    
    const testInvoice = invoices[0];
    console.log(`Found invoice to test: ${testInvoice.id}`);
    console.log(`Invoice has ${testInvoice.lineItems.length} line items and ${testInvoice.licenses.length} licenses`);
    
    // Before deletion, let's make sure we know what we're working with
    if (testInvoice.licenses.length > 0) {
      console.log("License statuses before deletion:", testInvoice.licenses.map(l => l.status));
    }
    
    // Now let's try to replicate the logic from our fixed service
    // 1. Update licenses associated with this invoice
    if (testInvoice.licenses && testInvoice.licenses.length > 0) {
      console.log("Updating license statuses...");
      const licenseUpdates = testInvoice.licenses.map(license => {
        if (license.status !== 'Expired') {
          console.log(`Updating license ${license.id} from ${license.status} to Inactive`);
          return db.licenseKey.update({
            where: { id: license.id },
            data: { status: 'Inactive' }
          });
        }
        return Promise.resolve(license);
      });
      await Promise.all(licenseUpdates);
    }
    
    // 2. Delete all related line items
    console.log("Deleting invoice line items...");
    await db.invoiceLineItem.deleteMany({
      where: { invoiceId: testInvoice.id }
    });
    
    // 3. Delete the main invoice
    console.log("Deleting the invoice itself...");
    const deletedInvoice = await db.invoice.delete({
      where: { id: testInvoice.id }
    });
    
    console.log("Invoice deletion successful!");
    console.log("Deleted invoice:", deletedInvoice);
  } catch (error) {
    console.error("Error during test:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await db.$disconnect();
  }
}

testInvoiceDeletion();