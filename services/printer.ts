import * as Print from 'expo-print';
import { BillItem } from '../types';

export const printReceipt = async (bikeNumber: string, items: BillItem[], total: number) => {
  const date = new Date().toLocaleString();
  
  let itemsHtml = '';
  items.forEach(item => {
    itemsHtml += `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price}</td>
      </tr>
    `;
  });

  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: monospace; padding: 20px; color: #000; }
          h1 { text-align: center; }
          .header { text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { text-align: left; padding: 8px; border-bottom: 2px solid #000; }
          .total { font-weight: bold; font-size: 1.2em; text-align: right; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>AUTO LEDGER</h1>
        <div class="header">
          <p>Date: ${date}</p>
          <p>Bike Number: <strong>${bikeNumber}</strong></p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="total">
          TOTAL: $${total.toFixed(2)}
        </div>
      </body>
    </html>
  `;

  await Print.printAsync({ html });
};
