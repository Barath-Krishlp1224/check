'use client'
import React, { useEffect, useMemo, useState } from 'react';

interface Expense {
  _id?: string;
  id?: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  createdAt?: string;
}

type DateFilter = 'all' | 'yesterday' | 'last_month' | 'last_3_months' | 'last_6_months' | 'last_9_months' | 'last_year' | 'custom';

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

const ExpenseTrackerPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState(''); 
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [dateFilter, setDateFilter] = useState<DateFilter | ''>('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/expenses');
      const json = await res.json();
      if (json.success) {
        setExpenses(json.data);
      } else {
        console.error('Failed to fetch expenses', json);
      }
    } catch (err) {
      console.error('Fetch error', err);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount === '' || amount <= 0 || !category) { 
      alert('Please enter a valid description, amount, and select a category.');
      return;
    }
    const payload = { description: description.trim(), amount: Number(amount), category, date };
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setExpenses(prev => [json.data, ...prev]);
        setDescription('');
        setAmount('');
        setCategory(''); 
        setDate(new Date().toISOString().split('T')[0]);
      } else {
        alert(json.error || 'Failed to add expense');
      }
    } catch (err) {
      console.error('Add error', err);
      alert('Failed to add expense');
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setExpenses(prev => prev.filter(e => e._id !== id));
        setDeleteConfirm(null);
      } else {
        alert(json.error || 'Failed to delete');
      }
    } catch (err) {
      console.error('Delete error', err);
      alert('Failed to delete');
    }
  };

  const filteredExpenses = useMemo(() => {
    // If dateFilter is empty, return all expenses (before sorting)
    if (!dateFilter) {
      return expenses.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    let startDate: string | null = null;
    let endDate: string | null = null;

    if (dateFilter === 'custom') {
      startDate = customStartDate;
      endDate = customEndDate;
    } else if (dateFilter !== 'all') {
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

  const lastFive = useMemo(() => {
    return expenses.slice().sort((a,b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    }).slice(0,5);
  }, [expenses]);

  const handleDownloadReport = () => {
    if (!dateFilter || dateFilter === 'custom' && (!customStartDate || !customEndDate)) {
        alert('Please select or define a valid filter period before downloading.');
        return;
    }
    downloadCSV(filteredExpenses, `expense_report_${dateFilter}.csv`);
  };

  const categoryIcons: Record<string, string> = {
    Food: '🍔',
    Transport: '🚗',
    Utilities: '💡',
    Entertainment: '🎬',
    Other: '📦'
  };

  return (
    <div className='min-h-screen bg-gray-100 flex items-center justify-center p-6 py-12'>
      <div className='w-full mt-15 max-w-7xl'>
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4 shadow-lg'>
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
          </div>
          <h1 className='text-5xl font-bold text-gray-800 mb-2'>Expense Manager</h1>
          <p className='text-gray-600 text-lg'>Track your spending with ease</p>
        </div>

        <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
          <div className='xl:col-span-2 space-y-6'>
            <div className='bg-white rounded-3xl shadow-xl border border-gray-200 p-8'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                </div>
                <h2 className='text-2xl font-bold text-gray-800'>New Expense</h2>
              </div>
              
              <div className='space-y-5'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>Description</label>
                    <input type='text' value={description} onChange={(e)=>setDescription(e.target.value)}
                           className='w-full px-5 py-3.5 rounded-2xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition text-gray-800 bg-white shadow-sm'
                           placeholder='What did you buy?' />
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>Amount (₹)</label>
                    <input type='number' value={amount} onChange={(e)=>setAmount(parseFloat(e.target.value))}
                           className='w-full px-5 py-3.5 rounded-2xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition text-gray-800 bg-white shadow-sm'
                           placeholder='0.00' min='0.01' step='0.01' />
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>Category</label>
                    <select value={category} onChange={(e)=>setCategory(e.target.value)}
                            className='w-full px-5 py-3.5 rounded-2xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition text-gray-800 bg-white shadow-sm'
                            required>
                      <option value='' disabled>Choose Category</option>
                      <option>Food</option>
                      <option>Transport</option>
                      <option>Utilities</option>
                      <option>Entertainment</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>Date</label>
                    <input type='date' value={date} onChange={(e)=>setDate(e.target.value)}
                           className='w-full px-5 py-3.5 rounded-2xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition text-gray-800 bg-white shadow-sm' />
                  </div>
                </div>

                <button onClick={handleSubmit} className='w-full md:w-auto px-10 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 hover:shadow-xl transform hover:scale-105 transition duration-200'>
                  Add Expense
                </button>
              </div>
            </div>

            <div className='bg-white rounded-3xl shadow-xl border border-gray-200 p-8'>
              <div className='flex flex-col md:flex-row md:items-end gap-4 mb-6'>
                <div className='flex-1'>
                  <label className='block text-sm font-semibold text-gray-700 mb-2'>Filter Period</label>
                  <select value={dateFilter} onChange={(e) => handleFilterChange(e.target.value as DateFilter | '')}
                          className='w-full px-5 py-3.5 rounded-2xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition text-gray-800 bg-white shadow-sm'
                          required>
                    <option value='' disabled>Select Filter</option>
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
                        className='px-8 py-3.5 bg-green-600 text-white font-bold rounded-2xl shadow-lg hover:bg-green-700 hover:shadow-xl transform hover:scale-105 transition duration-200 flex items-center justify-center gap-2'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  Export ({filteredExpenses.length})
                </button>
              </div>

              {dateFilter === 'custom' && (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>From Date</label>
                    <input type='date' value={customStartDate} onChange={(e)=>setCustomStartDate(e.target.value)}
                           className='w-full px-5 py-3.5 rounded-2xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition text-gray-800 bg-white shadow-sm' />
                  </div>
                  <div>
                    <label className='block text-sm font-semibold text-gray-700 mb-2'>To Date</label>
                    <input type='date' value={customEndDate} onChange={(e)=>setCustomEndDate(e.target.value)}
                           className='w-full px-5 py-3.5 rounded-2xl border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition text-gray-800 bg-white shadow-sm' />
                  </div>
                </div>
              )}
            </div>

            <div className='bg-white rounded-3xl shadow-xl border border-gray-200 p-8'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-2xl font-bold text-gray-800'>All Transactions</h2>
                <span className='px-5 py-2 bg-blue-100 text-blue-700 font-bold rounded-full text-sm'>{filteredExpenses.length} items</span>
              </div>

              {loading ? (
                <div className='text-center py-20'>
                  <div className='inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600'></div>
                  <p className='mt-4 text-gray-600 font-medium'>Loading...</p>
                </div>
              ) : filteredExpenses.length === 0 ? (
                <div className='text-center py-20 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50'>
                  <div className='text-6xl mb-4'>📭</div>
                  <p className='text-xl font-semibold text-gray-700'>No expenses found</p>
                  <p className='text-gray-500 mt-2'>Add your first expense to get started</p>
                </div>
              ) : (
                <div className='space-y-4 max-h-[300px] overflow-y-auto pr-3'>
                  {filteredExpenses.map(expense => (
                    <div key={expense._id} className='group relative flex items-center justify-between p-5 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md'>
                      <div className='flex items-center gap-4 flex-1'>
                        <div className='text-4xl'>{categoryIcons[expense.category]}</div>
                        <div className='flex-1'>
                          <p className='font-bold text-gray-800 text-lg'>{expense.description}</p>
                          <div className='flex items-center gap-3 mt-1'>
                            <span className='text-sm text-gray-500'>{expense.date}</span>
                            <span className='px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs font-semibold text-gray-600'>{expense.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className='flex items-center gap-4'>
                        <span className='text-2xl font-bold text-red-600'>- ₹ {expense.amount.toFixed(2)}</span>
                        <button onClick={() => setDeleteConfirm(expense._id || null)} 
                                className='p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200' 
                                title='Delete'>
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className='xl:col-span-1 space-y-6'>
            <div className='bg-blue-600 rounded-3xl shadow-2xl p-8 text-white'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <h3 className='text-lg font-semibold opacity-90'>Total Spending</h3>
              </div>
              <p className='text-5xl font-black mb-2'>₹ {totalExpense.toFixed(2)}</p>
              <p className='text-white text-opacity-80 text-sm'>{filteredExpenses.length} transactions • {dateFilter === 'all' ? 'All time' : dateFilter === 'custom' ? 'Custom Range' : dateFilter.replace('_', ' ')}</p>
            </div>

            <div className='bg-white rounded-3xl shadow-xl border border-gray-200 p-6'>
              <h3 className='text-xl font-bold text-gray-800 mb-4 flex items-center gap-2'>
                <span className='text-2xl'>⏱️</span>
                Recent Activity
              </h3>
              {lastFive.length === 0 ? (
                <div className='text-center py-10 text-gray-500'>
                  <div className='text-4xl mb-2'>💤</div>
                  <p className='text-sm'>No activity yet</p>
                </div>
              ) : (
                <ul className='space-y-3'>
                  {lastFive.map(item => (
                    <li key={item._id} className='flex justify-between items-start p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:border-blue-200 transition-all duration-200'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          <span className='text-xl'>{categoryIcons[item.category]}</span>
                          <div className='text-sm font-bold text-gray-800'>{item.description}</div>
                        </div>
                        <div className='text-xs text-gray-500'>{item.date}</div>
                      </div>
                      <div className='text-sm font-bold text-red-600 ml-3'>₹ {item.amount.toFixed(2)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button onClick={() => fetchExpenses()} 
                    className='w-full px-6 py-4 bg-white border-2 border-gray-300 rounded-2xl text-gray-700 font-bold hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-3 shadow-sm hover:shadow-md'>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <div className='fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50' onClick={() => setDeleteConfirm(null)}>
          <div className='bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full transform scale-100' onClick={(e) => e.stopPropagation()}>
            <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            </div>
            <h3 className='text-2xl font-bold text-gray-800 text-center mb-2'>Delete Expense?</h3>
            <p className='text-gray-600 text-center mb-6'>Are you sure you want to delete this expense? This action cannot be undone.</p>
            <div className='flex gap-3'>
              <button onClick={() => setDeleteConfirm(null)} 
                      className='flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition duration-200'>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} 
                      className='flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition duration-200'>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseTrackerPage;