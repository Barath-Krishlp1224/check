'use client';

import React, { useEffect, useMemo, useState } from 'react';

// --- Interfaces (kept consistent) ---
interface Expense {
  _id?: string;
  id?: number;
  description: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  createdAt?: string;
}

type ApiResponse = {
  success: boolean;
  data?: Expense[];
  error?: string;
};

type DateFilter = 'all' | 'yesterday' | 'last_month' | 'last_3_months' | 'last_6_months' | 'last_9_months' | 'last_year' | 'custom' | '';

// --- Utility Functions (kept consistent) ---
const getFilterDates = (filter: DateFilter): { startDate: string | null; endDate: string | null } => {
  const today = new Date();
  let startDate: Date | null = null;
  let endDate: Date = new Date();

  switch (filter) {
    case 'all': return { startDate: null, endDate: null };
    case 'yesterday':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 1);
      endDate = new Date(startDate);
      break;
    case 'last_month':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      break;
    case 'last_3_months':
      startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
      break;
    case 'last_6_months':
      startDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
      break;
    case 'last_9_months':
      startDate = new Date(today.getFullYear(), today.getMonth() - 9, today.getDate());
      break;
    case 'last_year':
      startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      break;
    case 'custom':
    default:
      return { startDate: null, endDate: null };
  }
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  return { startDate: startDate ? formatDate(startDate) : null, endDate: formatDate(endDate) };
};

const downloadCSV = (data: Expense[], filename: string = 'expense_report.csv') => {
  if (data.length === 0) {
    alert('No data to download.');
    return;
  }
  const headers = ['ID', 'Date', 'Category', 'Description', 'Amount'];
  // Added an ID column for better identification in the report
  const csvRows = data.map((expense, idx) =>
    `${idx + 1},"${expense.date}","${expense.category}","${(expense.description || '').replace(/"/g, '""')}",${expense.amount.toFixed(2)}`
  );
  const csvString = [headers.join(','), ...csvRows].join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    alert('Your browser does not support downloading files directly.');
  }
};

// --- Main Component ---
const ExpenseTrackerPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [dateFilter, setDateFilter] = useState<DateFilter | ''>('last_month'); // Default to last month
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/expenses');
      const json = (await res.json()) as ApiResponse;

      if (!res.ok || !json.success) {
        const errMsg = json?.error ?? `Failed to fetch (status ${res.status})`;
        setError(errMsg);
        setExpenses([]);
      } else {
        setExpenses(Array.isArray(json.data) ? json.data : []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Network error while loading expenses. Please check your connection.');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleFilterChange = (newFilter: DateFilter | '') => {
    setDateFilter(newFilter);
    // Reset custom date values whenever a non-custom filter is selected.
    if (newFilter !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  };

  const filteredExpenses = useMemo(() => {
    // Return all expenses if no filter is selected (though dateFilter defaults to 'last_month')
    if (!dateFilter || dateFilter === 'all') {
      return expenses.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    let startDate: string | null = null;
    let endDate: string | null = null;

    if (dateFilter === 'custom') {
      startDate = customStartDate;
      endDate = customEndDate;
    } else {
      const d = getFilterDates(dateFilter as DateFilter);
      startDate = d.startDate;
      endDate = d.endDate;
    }

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23,59,59,999);

    return expenses
      .filter(exp => {
        const expenseDate = new Date(exp.date);
        expenseDate.setHours(0,0,0,0);
        if (!start && !end) return true;
        const isAfterStart = !start || expenseDate >= start;
        const isBeforeEnd = !end || expenseDate <= end;
        return isAfterStart && isBeforeEnd;
      })
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, dateFilter, customStartDate, customEndDate]);

  const totalExpense = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  // Filter and sort for the "Recent Activity" sidebar panel
  const lastFive = useMemo(() => {
    return expenses.slice().sort((a,b) => {
      // Prioritize sorting by createdAt (when the expense was recorded), falling back to date if createdAt is missing
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date).getTime();
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date).getTime();
      return tb - ta;
    }).slice(0,5);
  }, [expenses]);

  const handleDownloadReport = () => {
    if (filteredExpenses.length === 0) {
        alert('No data to download for the current filter period.');
        return;
    }
    // Simple filter name for the filename
    const filenameFilter = dateFilter === 'custom' ? `custom_${customStartDate}_to_${customEndDate}` : dateFilter;
    downloadCSV(filteredExpenses, `expense_report_${filenameFilter}.csv`);
  };

  // Icons for better visual appeal
  const categoryIcons: Record<string, string> = {
    Food: '🍔',
    Transport: '🚗',
    Utilities: '💡',
    Entertainment: '🎬',
    Other: '📦'
  };

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8'>
      <div className='w-full max-w-7xl'>
        <div className='text-center mt-10 mb-10'>
         
          <p className='text-xs sm:text-6xl font-black text-gray-900 mb-3 tracking-tight'>Expense Dashboard</p>
          
        </div>

        {error && !loading && (
          <div className="p-5 mb-6 bg-red-50 text-red-800 rounded-2xl border-2 border-red-200 flex items-center justify-between shadow-lg">
            <div className='flex items-center gap-3'>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              <div>
                <span className='font-bold block'>Error Loading Data</span>
                <span className='text-sm text-red-700'>{error}</span>
              </div>
            </div>
            <button
              onClick={fetchExpenses}
              className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition duration-200 shadow-lg"
            >
              Retry
            </button>
          </div>
        )}

        <div className='grid grid-cols-1 xl:grid-cols-4 gap-6'>
          <div className='xl:col-span-3 space-y-6'>
            <div className='bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6 sm:p-8'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                </div>
                <h2 className='text-2xl font-bold text-gray-900'>Filter & Export</h2>
              </div>
              <div className='flex flex-col lg:flex-row lg:items-end gap-4'>
                <div className='flex-1'>
                  <label className='block text-sm font-bold text-gray-700 mb-2.5'>Time Period</label>
                  <select value={dateFilter} onChange={(e) => handleFilterChange(e.target.value as DateFilter | '')}
                          className='w-full px-5 py-3.5 rounded-xl border-2 border-gray-300 bg-white text-gray-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition shadow-sm font-medium'
                          required>
                    <option value=''>Select Filter</option>
                    <option value='all'>All Time</option>
                    <option value='yesterday'>Yesterday</option>
                    <option value='last_month'>Last Month</option>
                    <option value='last_3_months'>Last 3 Months</option>
                    <option value='last_6_months'>Last 6 Months</option>
                    <option value='last_9_months'>Last 9 Months</option>
                    <option value='last_year'>Last 1 Year</option>
                    <option value='custom'>Custom Range</option>
                  </select>
                </div>

                <button onClick={handleDownloadReport}
                        className='px-8 py-3.5 bg-green-600 text-white font-black rounded-xl shadow-lg hover:bg-green-700 hover:shadow-xl transform hover:scale-105 transition duration-200 flex items-center justify-center gap-2.5 whitespace-nowrap'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  Export ({filteredExpenses.length})
                </button>
              </div>

              {dateFilter === 'custom' && (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'>
                  <div>
                    <label className='block text-sm font-bold text-gray-700 mb-2.5'>From Date</label>
                    <input type='date' value={customStartDate} onChange={(e)=>setCustomStartDate(e.target.value)}
                           className='w-full px-5 py-3.5 rounded-xl border-2 border-gray-300 bg-white text-gray-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition shadow-sm' />
                  </div>
                  <div>
                    <label className='block text-sm font-bold text-gray-700 mb-2.5'>To Date</label>
                    <input type='date' value={customEndDate} onChange={(e)=>setCustomEndDate(e.target.value)}
                           className='w-full px-5 py-3.5 rounded-xl border-2 border-gray-300 bg-white text-gray-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition shadow-sm' />
                  </div>
                </div>
              )}
            </div>

            <div className='bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6 sm:p-8'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
                <h2 className='text-2xl font-bold text-gray-900 flex items-center gap-3'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
                  Transactions
                </h2>
                <span className='px-5 py-2.5 bg-indigo-600 text-white font-black rounded-full text-sm shadow-lg'>{filteredExpenses.length} records</span>
              </div>

              {loading && !error ? (
                <div className='text-center py-24'>
                  <div className='inline-block animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-indigo-600'></div>
                  <p className='mt-6 text-gray-600 font-semibold text-lg'>Loading expenses...</p>
                </div>
              ) : 
              !error && filteredExpenses.length === 0 ? (
                <div className='text-center py-24 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50'>
                  <div className='text-7xl mb-5'>📊</div>
                  <p className='text-2xl font-bold text-gray-800'>No Data Found</p>
                  <p className='text-gray-500 mt-2 text-lg'>Adjust your filters to view expenses</p>
                </div>
              ) : (
                <div className='space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar'>
                  {filteredExpenses.map(expense => (
                    <div key={expense._id} className='group flex items-center justify-between p-5 bg-gray-50 hover:bg-indigo-50 border-2 border-gray-200 hover:border-indigo-400 rounded-xl transition-all duration-200 shadow-md hover:shadow-xl'>
                      <div className='flex items-center gap-4 flex-1'>
                        <div className='w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl border-2 border-gray-200 group-hover:border-indigo-400 transition-colors shadow-md'>
                          {categoryIcons[expense.category]}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='font-bold text-gray-900 text-lg truncate'>{expense.description}</p>
                          <div className='flex items-center gap-3 mt-1.5 flex-wrap'>
                            <span className='text-sm text-gray-600 font-medium'>{expense.date}</span>
                            <span className='px-3 py-1 bg-white border-2 border-gray-200 rounded-lg text-xs font-bold text-indigo-600'>{expense.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className='flex items-center ml-4'>
                        <span className='text-2xl font-black text-red-600'>- ₹ {expense.amount.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className='xl:col-span-1 space-y-6'>
            <div className='bg-indigo-600 rounded-2xl shadow-2xl p-6 sm:p-8 text-white sticky top-6'>
              <div className='flex items-center gap-3 mb-5'>
                <div className='w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center shadow-lg'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <h3 className='text-lg font-black'>Total Spending</h3>
              </div>
              <p className='text-5xl font-black mb-3'>₹ {totalExpense.toFixed(2)}</p>
              <p className='text-white font-bold text-sm'>{filteredExpenses.length} transactions</p>
              <p className='text-white text-opacity-80 text-xs mt-1'>{dateFilter === 'all' ? 'All time' : dateFilter === 'custom' ? 'Custom Range' : (dateFilter || '').replace('_', ' ')}</p>
            </div>

            <div className='bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-6'>
              <h3 className='text-xl font-bold text-gray-900 mb-5 flex items-center gap-2.5'>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Recent Activity
              </h3>
              {lastFive.length === 0 ? (
                <div className='text-center py-12 text-gray-500'>
                  <div className='text-5xl mb-3'>💤</div>
                  <p className='text-sm font-semibold'>No recent activity</p>
                </div>
              ) : (
                <ul className='space-y-3'>
                  {lastFive.map(item => (
                    <li key={item._id} className='flex justify-between items-start p-4 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-indigo-300 transition-all duration-200 shadow-sm'>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1.5'>
                          <span className='text-xl'>{categoryIcons[item.category]}</span>
                          <div className='text-sm font-bold text-gray-900 truncate'>{item.description}</div>
                        </div>
                        <div className='text-xs text-gray-600 font-medium'>{item.date}</div>
                      </div>
                      <div className='text-sm font-bold text-red-600 ml-3 whitespace-nowrap'>- ₹ {item.amount.toFixed(2)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button onClick={() => fetchExpenses()} 
                    className='w-full px-6 py-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 font-bold hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-xl'>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4f46e5;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4338ca;
        }
      `}</style>
    </div>
  );
};

export default ExpenseTrackerPage;