const XLSX = require('xlsx');
const path = require('path');

// File paths
const inputFile = 'C:\\Users\\abish\\Downloads\\target.xlsx';
const outputFile = 'C:\\Users\\abish\\Downloads\\final_output.xlsx';

// Load workbook and sheet
const workbook = XLSX.readFile(inputFile);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // raw rows as array of arrays

// Find header row: look for row that contains 'Description'
const headerRowIndex = data.findIndex(row =>
  row.includes('Description') && row.includes('Debit Amount') && row.includes('Credit Amount')
);

if (headerRowIndex === -1) {
  console.error('❌ Could not find proper header row with "Description", "Debit Amount", etc.');
  process.exit(1);
}

// Extract header & data
const headers = data[headerRowIndex];
const transactionRows = data.slice(headerRowIndex + 1);

// Create structured objects
const rows = transactionRows.map(row => {
  const obj = {};
  headers.forEach((key, i) => {
    obj[key] = row[i];
  });
  return obj;
});

// Define output headers
const outputHeaders = [
  'Date',
  'Transaction ID',
  'Sender',
  'Receiver',
  'Category',
  'Amount',
  'Type',
  'Balance After Transaction',
  'Description'
];

// Helper: transaction ID
const generateTransactionID = () =>
  Math.random().toString(36).substring(2, 10).toUpperCase();

// Transform data
const processed = rows
  .filter(row => (row['Description'] || '').includes('/'))
  .map(row => {
    const description = String(row['Description']);
    const parts = description.split('/');
    const mid = parts.length > 1 ? parts[1].trim() : '';
    const category = parts.length > 2 ? parts[parts.length - 1].trim() : '';

    const debitAmount = row['Debit Amount'];
    const creditAmount = row['Credit Amount'];
    const balance = row['Balance'] || '';
    const date = row['Txn Date'] || '';

    let amount = '';
    let type = '';
    let sender = '';
    let receiver = '';

    if (debitAmount) {
      type = 'Debit';
      amount = debitAmount;
      sender = 'DEEPAK';
      receiver = mid;
    } else if (creditAmount) {
      type = 'Credit';
      amount = creditAmount;
      receiver = 'DEEPAK';
      sender = mid;
    } else {
      type = 'Unknown';
    }

    return [
      date,
      generateTransactionID(),
      sender,
      receiver,
      category,
      amount,
      type,
      balance,
      description
    ];
  });

// Write output
const finalSheet = [outputHeaders, ...processed];
const newWb = XLSX.utils.book_new();
const newWs = XLSX.utils.aoa_to_sheet(finalSheet);
XLSX.utils.book_append_sheet(newWb, newWs, 'Formatted');
XLSX.writeFile(newWb, outputFile);

console.log('✅ Final output written to:', outputFile);
