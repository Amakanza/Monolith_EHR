
import { getInvoiceById } from '@/lib/services/billingService';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { invoice, items } = await getInvoiceById(id);
    
    // Minimal HTML template for print
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .meta { text-align: right; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          .table th, .table td { border-bottom: 1px solid #ddd; padding: 10px; text-align: left; }
          .totals { width: 300px; margin-left: auto; }
          .row { display: flex; justify-content: space-between; padding: 5px 0; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>INVOICE</h1>
            <p><strong>Bill To:</strong><br/>${invoice.patientName}</p>
          </div>
          <div class="meta">
            <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Date:</strong> ${new Date(invoice.issuedDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align:right">Qty</th>
              <th style="text-align:right">Price</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td style="text-align:right">${item.quantity}</td>
                <td style="text-align:right">${(item.unitPriceCents/100).toFixed(2)}</td>
                <td style="text-align:right">${(item.lineSubtotalCents/100).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="row"><span>Subtotal:</span> <span>${(invoice.subtotalCents/100).toFixed(2)}</span></div>
          <div class="row"><span>Tax (${invoice.taxRate}%):</span> <span>${(invoice.taxCents/100).toFixed(2)}</span></div>
          <div class="row bold"><span>Total:</span> <span>${invoice.currency} ${(invoice.totalCents/100).toFixed(2)}</span></div>
          <div class="row"><span>Paid:</span> <span>${(invoice.amountPaidCents/100).toFixed(2)}</span></div>
          <div class="row bold"><span>Balance Due:</span> <span>${(invoice.balanceDueCents/100).toFixed(2)}</span></div>
        </div>
        
        <script>window.print();</script>
      </body>
      </html>
    `;

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}
