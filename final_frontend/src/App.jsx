// App.js
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { getInsights } from './utils';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function App() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('category');
  const [uploadedTransactions, setUploadedTransactions] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      let jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Check if required columns exist
      const hasRequiredColumns = jsonData.length > 0 &&
        ['type', 'amount', 'description'].every(col => Object.keys(jsonData[0]).map(k => k.toLowerCase()).includes(col));

      if (!hasRequiredColumns) {
        // --- Begin FULL transform.cjs logic in-browser ---
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const headerRowIndex = rawRows.findIndex(row =>
          row.includes('Description') && row.includes('Debit Amount') && row.includes('Credit Amount')
        );
        if (headerRowIndex === -1) {
          alert('❌ Could not find proper header row with "Description", "Debit Amount", etc. Please check your file.');
          setLoading(false);
          return;
        }
        const headers = rawRows[headerRowIndex];
        const transactionRows = rawRows.slice(headerRowIndex + 1);
        // Create structured objects
        const rows = transactionRows.map(row => {
          const obj = {};
          headers.forEach((key, i) => {
            obj[key] = row[i];
          });
          return obj;
        });
        // Helper: transaction ID
        const generateTransactionID = () =>
          Math.random().toString(36).substring(2, 10).toUpperCase();
        // Transform data as in transform.cjs
        jsonData = rows
          .filter(row => (row['Description'] || '').includes('/'))
          .map(row => {
            const description = String(row['Description'] || '');
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
              type = 'debit';
              amount = debitAmount;
              sender = 'DEEPAK';
              receiver = mid;
            } else if (creditAmount) {
              type = 'credit';
              amount = creditAmount;
              receiver = 'DEEPAK';
              sender = mid;
            } else {
              type = 'unknown';
            }
            return {
              date,
              transactionId: generateTransactionID(),
              sender,
              receiver,
              category,
              amount: Number(amount),
              type,
              balanceAfterTransaction: balance,
              description
            };
          });
        // --- End FULL transform.cjs logic ---
      }

      setUploadedTransactions(jsonData); // Store uploaded transactions
      setLoading(true);
      const insightResult = await getInsights(jsonData);
      setInsights(insightResult);
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // Chart Data
  const chartData = insights ? {
    labels: insights.chart_insights.map(item => item.label),
    datasets: [
      {
        label: 'Spending by Category',
        data: insights.chart_insights.map(item => item.amount),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ]
      }
    ]
  } : null;

  const lineData = insights ? {
    labels: insights.monthly_trends.map(item => item.month),
    datasets: [
      {
        label: 'Monthly Spending',
        data: insights.monthly_trends.map(item => item.amount),
        fill: false,
        borderColor: '#36A2EB',
        backgroundColor: '#36A2EB',
        tension: 0.2
      }
    ]
  } : null;

  const barData = insights ? {
    labels: insights.top_merchants.map(item => item.merchant),
    datasets: [
      {
        label: 'Top Merchants',
        data: insights.top_merchants.map(item => item.amount),
        backgroundColor: '#FFCE56'
      }
    ]
  } : null;

  // Summary Card
  const summary = insights?.summary || {};

  // Use uploaded transactions if available
  const transactions = uploadedTransactions || [];

  // Calculate total debited and credited amounts
  const totalDebited = transactions.filter(t => (t.type || t.Type)?.toLowerCase() === 'debit').reduce((sum, t) => sum + Number(t.amount || t.Amount || 0), 0);
  const totalCredited = transactions.filter(t => (t.type || t.Type)?.toLowerCase() === 'credit').reduce((sum, t) => sum + Number(t.amount || t.Amount || 0), 0);
  const debitTransactions = transactions.filter(t => (t.type || t.Type)?.toLowerCase() === 'debit');
  const avgSpent = debitTransactions.length > 0 ? (totalDebited / debitTransactions.length).toFixed(2) : 0;

  // Split into debit and credit
  const creditTransactions = transactions.filter(t => (t.type || t.Type) && (t.type || t.Type).toLowerCase() === 'credit');

  // Insights helper
  function getSegmentInsights(arr) {
    if (arr.length === 0) return { total: 0, average: 0, largest: 0 };
    const total = arr.reduce((sum, t) => sum + Number(t.amount || t.Amount || 0), 0);
    const average = (total / arr.length).toFixed(2);
    const largest = Math.max(...arr.map(t => Number(t.amount || t.Amount || 0)));
    return { total, average, largest };
  }
  const debitInsights = getSegmentInsights(debitTransactions);
  const creditInsights = getSegmentInsights(creditTransactions);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex flex-col">
      {/* Hero Section */}
      <header className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 py-10 shadow-lg mb-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow mb-2">Smart Transaction Insights</h1>
            <p className="text-lg md:text-xl text-white/90 font-medium">Visualize, analyze, and optimize your spending with AI-powered insights.</p>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="p-3 rounded-lg border-2 border-white bg-white/80 shadow focus:outline-none focus:ring-2 focus:ring-blue-400 transition w-64 cursor-pointer" />
            {loading && <span className="mt-2 text-white animate-pulse">🔄 Generating insights...</span>}
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-5xl mx-auto px-2 md:px-0">
        {insights && (
          <>
            {/* Summary Cards */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              <div className="bg-gradient-to-br from-blue-200 to-blue-50 rounded-2xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transition-transform">
                <span className="text-xs text-blue-700 font-semibold mb-1">Total Spent</span>
                <span className="text-2xl font-bold text-blue-900">₹{totalDebited.toFixed(2)}</span>
              </div>
              <div className="bg-gradient-to-br from-green-200 to-green-50 rounded-2xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transition-transform">
                <span className="text-xs text-green-700 font-semibold mb-1">Total Received</span>
                <span className="text-2xl font-bold text-green-900">₹{totalCredited.toFixed(2)}</span>
              </div>
              <div className="bg-gradient-to-br from-yellow-200 to-yellow-50 rounded-2xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transition-transform">
                <span className="text-xs text-yellow-700 font-semibold mb-1">Transactions</span>
                <span className="text-2xl font-bold text-yellow-900">{summary.num_transactions || 0}</span>
              </div>
              <div className="bg-gradient-to-br from-purple-200 to-purple-50 rounded-2xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transition-transform">
                <span className="text-xs text-purple-700 font-semibold mb-1">Top Category</span>
                <span className="text-2xl font-bold text-purple-900">{summary.highest_category || '-'}</span>
              </div>
            </section>
            {/* Tab Content */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              {/* Left: Chart or Table */}
              <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center min-h-[350px] transition-all">
                {activeTab === 'category' && (
                  <>
                    <div className="w-full flex flex-col items-center mb-6">
                      <h2 className="text-3xl font-extrabold text-blue-800 flex items-center gap-2 mb-2">
                        <span role="img" aria-label="insights">💡</span> Insights
                      </h2>
                      <div className="w-16 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full mb-2"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-blue-700 mb-4">Spending by Category</h3>
                    <Pie data={chartData} />
                  </>
                )}
                {activeTab === 'trend' && (
                  <>
                    <h2 className="text-xl font-bold text-green-700 mb-4">📅 Monthly Spending Trend</h2>
                    <Line data={lineData} />
                  </>
                )}
                {activeTab === 'merchant' && (
                  <>
                    <h2 className="text-xl font-bold text-yellow-700 mb-4">🏪 Top Merchants</h2>
                    <Bar data={barData} />
                  </>
                )}
                {activeTab === 'anomaly' && (
                  <>
                    <h2 className="text-xl font-bold text-red-700 mb-4">🚨 Anomalies & Unusual Transactions</h2>
                    <div className="overflow-x-auto w-full">
                      <table className="min-w-full text-sm text-left border rounded-xl overflow-hidden">
                        <thead className="bg-red-100">
                          <tr>
                            <th className="px-3 py-2">Date</th>
                            <th className="px-3 py-2">Description</th>
                            <th className="px-3 py-2">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {insights.anomalies.length === 0 && (
                            <tr><td colSpan={3} className="px-3 py-2 text-center text-gray-400">No anomalies detected.</td></tr>
                          )}
                          {insights.anomalies.map((a, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-red-50' : 'bg-white'}>
                              <td className="px-3 py-2">{a.date}</td>
                              <td className="px-3 py-2">{a.description}</td>
                              <td className="px-3 py-2">₹{a.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
              {/* Right: Reports & Suggestions */}
              <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between min-h-[350px] transition-all">
                <div>
                  <h2 className="text-lg font-bold text-gray-700 mb-2">📄 Reports</h2>
                  <ul className="list-disc pl-6 space-y-1">
                    <li className="text-gray-700 font-semibold">Average Spent: ₹{avgSpent}</li>
                    {insights.reports.map((report, idx) => <li key={idx} className="text-gray-700">{report}</li>)}
                  </ul>
                </div>
                <div className="mt-6">
                  <h2 className="text-lg font-bold text-gray-700 mb-2">💡 Suggestions</h2>
                  <ul className="list-disc pl-6 space-y-1">
                    {insights.suggestions.map((tip, idx) => <li key={idx} className="text-green-700">{tip}</li>)}
                  </ul>
                </div>
              </div>
            </section>
          </>
        )}
        {!insights && !loading && (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-500 animate-fade-in">
            <img src="/favicon.png" alt="Upload" className="w-32 h-32 mb-6 opacity-80" />
            <p className="text-xl font-semibold">Upload your transaction file to get started!</p>
          </div>
        )}
      </main>
      <footer className="w-full text-center py-6 text-gray-400 text-sm mt-10">
        &copy; {new Date().getFullYear()} Smart Transaction Insights. Powered by AI.
      </footer>
    </div>
  );
}

export default App;