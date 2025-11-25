'use client'

import React, { useEffect, useMemo, useState, useCallback } from 'react';

interface Subtask {
  id: string;
  title: string;
  done: boolean;
  amount?: number;
  date?: string;
}

interface Expense {
  _id?: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  createdAt?: string;
  shop?: string;
  paid?: boolean;
  weekStart?: string;
  subtasks?: Subtask[];
}

type DateFilter =
  | 'all'
  | 'yesterday'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'last_9_months'
  | 'last_year'
  | 'custom'
  | '';

const uid = () => Math.random().toString(36).slice(2, 9);

const getWeekStartISO = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diffToMonday = ((day + 6) % 7);
  const monday = new Date(date);
  monday.setDate(date.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
};

const getFilterDates = (filter: DateFilter): { startDate: string | null; endDate: string | null } => {
  const today = new Date();
  let startDate: Date | null = null;
  let endDate: Date = new Date();

  switch (filter) {
    case 'all':
      return { startDate: null, endDate: null };
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
  const headers = ['ID', 'Date', 'Category', 'Shop', 'Description', 'Amount', 'Paid'];
  const csvRows = data.map((expense, idx) =>
    `${idx + 1},"${expense.date}","${expense.category}","${(expense.shop || '').replace(/"/g, '""')}","${(expense.description || '').replace(/"/g, '""')}",${expense.amount.toFixed(2)},${expense.paid ? 'YES' : 'NO'}`
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
  const [shop, setShop] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [dateFilter, setDateFilter] = useState<DateFilter>('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [weekEditorOpen, setWeekEditorOpen] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [localExpCopy, setLocalExpCopy] = useState<Expense | null>(null);
  
  const [selectedExpensesToPay, setSelectedExpensesToPay] = useState<string[]>([]);

  const [showWeekTotalFor, setShowWeekTotalFor] = useState<string | null>(null);
  const [showExpenseTotalId, setShowExpenseTotalId] = useState<string | null>(null);

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskAmount, setNewSubtaskAmount] = useState<number | ''>('');

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!description.trim() || amount === '' || Number(amount) <= 0 || !category) {
      alert('Please enter a valid description, amount, and select a category.');
      return;
    }
    const expenseDate = date || new Date().toISOString().split('T')[0];
    const weekStart = getWeekStartISO(new Date(expenseDate));
    const payload = {
      description: description.trim(),
      amount: Number(amount),
      category,
      date: expenseDate,
      shop,
      weekStart,
    };
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
        setShop('');
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

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      setExpenses(prev => prev.map(p => (p._id === id ? { ...p, ...updates } : p)));
      const res = await fetch('/api/expenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates }),
      });
      const json = await res.json();
      if (!json.success) {
        console.error('Patch failed', json);
        await fetchExpenses();
      } else {
        setExpenses(prev => prev.map(p => (p._id === id ? json.data : p)));
      }
    } catch (err) {
      console.error('Update error', err);
      await fetchExpenses();
    }
  };

  const markSelectedPaid = async () => {
    const ids = selectedExpensesToPay.filter(id => id);
    if (ids.length === 0) {
      alert('Please select at least one expense to mark as paid.');
      return;
    }
    if (!confirm(`Mark ${ids.length} selected expenses as PAID?`)) return;
    
    try {
      const res = await fetch('/api/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedExpensesToPay([]);
        setWeekEditorOpen(null);
        await fetchExpenses();
      } else {
        alert(json.error || 'Failed to mark paid');
      }
    } catch (err) {
      console.error('Mark paid error', err);
      alert('Failed to mark paid');
    }
  };

  const toggleSelectExpense = (id: string) => {
    setSelectedExpensesToPay(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const openWeekEditor = (wk: string) => {
    const wkExpenses = expensesByWeek.find(([weekStart]) => weekStart === wk)?.[1] || [];
    const unpaidIds = wkExpenses.filter(e => !e.paid && e._id).map(e => e._id!);
    setSelectedExpensesToPay(unpaidIds);
    setWeekEditorOpen(wk);
  };

  const getExpenseTotal = (e: Expense) => {
    const expenseAmount = typeof e.amount === 'number' && !Number.isNaN(e.amount) ? e.amount : Number(e.amount) || 0;
    const subtasksTotal = (e.subtasks || []).reduce((ss, st) => {
      const a = (st as any).amount;
      return ss + (typeof a === 'number' && !Number.isNaN(a) ? a : Number(a) || 0);
    }, 0);
    return expenseAmount + subtasksTotal;
  };

  const expensesByWeek = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of expenses) {
      const wk = e.weekStart || getWeekStartISO(new Date(e.date));
      if (!map.has(wk)) map.set(wk, []);
      map.get(wk)!.push(e);
    }
    const sorted = Array.from(map.entries()).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
    return sorted;
  }, [expenses]);

  const currentWeekStart = getWeekStartISO(new Date());

  const filteredExpenses = useMemo(() => {
    if (!dateFilter) {
      return expenses.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
    if (end) end.setHours(23, 59, 59, 999);

    return expenses
      .filter(exp => {
        const expenseDate = new Date(exp.date);
        expenseDate.setHours(0, 0, 0, 0);
        if (!start && !end) return true;
        const isAfterStart = !start || expenseDate >= start;
        const isBeforeEnd = !end || expenseDate <= end;
        return isAfterStart && isBeforeEnd;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, dateFilter, customStartDate, customEndDate]);

  const addSubtaskToLocal = () => {
    if (!localExpCopy) return;
    const desc = newSubtaskTitle.trim();
    if (!desc) {
      alert('Subtask description is required.');
      return;
    }
    
    let amt: number | undefined = undefined;
    if (newSubtaskAmount !== '') {
      const parsed = Number(newSubtaskAmount);
      if (!Number.isNaN(parsed)) amt = parsed;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const newSub: Subtask = { id: uid(), title: desc, done: false, amount: amt, date: today };
    setLocalExpCopy({ ...localExpCopy, subtasks: [...(localExpCopy.subtasks || []), newSub] });

    setNewSubtaskTitle('');
    setNewSubtaskAmount('');
  };

  const categoryIcons: Record<string, string> = {
    Food: '🍔',
    Transport: '🚗',
    Utilities: '💡',
    Entertainment: '🎬',
    Other: '📦',
  };

  const openExpenseEditor = (exp: Expense) => {
    setEditingExpense(exp);
    const expCopy: Expense = JSON.parse(JSON.stringify(exp));
    expCopy.shop = expCopy.shop || '';
    expCopy.subtasks = expCopy.subtasks || [];
    setLocalExpCopy(expCopy);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">Expense Manager</h1>
          <p className="text-gray-700">Track weekly expenses with subtasks and mark payments complete</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">New Expense</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input value={shop} onChange={(e) => setShop(e.target.value)} placeholder="Shop" className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600" />
                  <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600" />
                  <input type="number" value={amount as any} onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="Amount" className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600" min="0.01" step="0.01" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600">
                    <option value="">Choose Category</option>
                    <option>Food</option>
                    <option>Transport</option>
                    <option>Utilities</option>
                    <option>Entertainment</option>
                    <option>Other</option>
                  </select>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600" />
                  <button type="submit" className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors">Add Expense</button>
                </div>
              </form>
            </div>

            <div className="space-y-4">
              {expensesByWeek.map(([wk, wkExpenses]) => {
                const weekTotal = wkExpenses.reduce((sum, e) => {
                  return sum + getExpenseTotal(e);
                }, 0);
                const unpaidCount = wkExpenses.filter(e => !e.paid).length;
                const isCurrentWeek = wk === currentWeekStart;
                const weekLabel = `${wk}${isCurrentWeek ? ' • This week' : ''}`;
                return (
                  <div key={wk} className={`bg-white rounded-2xl shadow-lg border p-5 ${isCurrentWeek ? 'border-gray-500 ring-2 ring-gray-300' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{weekLabel}</h3>
                        <div className="text-sm text-gray-700">{wkExpenses.length} items • ₹ {weekTotal.toFixed(2)} • {unpaidCount} unpaid</div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isCurrentWeek && unpaidCount > 0 && <div className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">Pending</div>}
                        {unpaidCount === 0 && <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">Paid</div>}
                        <button 
                            onClick={() => openWeekEditor(wk)} 
                            className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-900 text-sm font-medium transition-colors"
                        >
                            {isCurrentWeek ? 'Edit Week' : 'View/Edit'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {wkExpenses.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
                        <div key={exp._id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{categoryIcons[exp.category]}</div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {exp.description} 
                                {exp.shop ? (
                                    <span className="text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded ml-2">
                                        @{exp.shop}
                                    </span>
                                ) : null}
                              </div>
                              <div className="text-xs text-gray-600">{exp.date} • {exp.category} {exp.subtasks && exp.subtasks.length > 0 ? `• ${exp.subtasks.filter(s => s.done).length}/${exp.subtasks.length} subtasks` : ''}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className={`font-bold ${exp.paid ? 'text-emerald-600' : 'text-rose-600'}`}>
                              ₹ {getExpenseTotal(exp).toFixed(2)}
                            </div>

                            <button
                              onClick={() => setShowExpenseTotalId(exp._id || null)}
                              className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm font-medium transition-colors"
                            >
                              Details
                            </button>

                            {!exp.paid && isCurrentWeek && (
                              <button onClick={() => openExpenseEditor(exp)} className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm font-medium transition-colors">Edit</button>
                            )}
                            <button onClick={() => setDeleteConfirm(exp._id || null)} className="text-gray-600 hover:text-rose-600 font-medium transition-colors">Del</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="xl:col-span-1 space-y-4">
            <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-xl">
              <h3 className="text-lg font-semibold mb-1">Total Unpaid</h3>
              <p className="text-4xl font-bold mb-1">
                ₹ {filteredExpenses.reduce((s, e) => s + (e.paid ? 0 : getExpenseTotal(e)), 0).toFixed(2)}
              </p>
              <p className="text-sm opacity-90 mb-4">{filteredExpenses.length} items</p>
              <div className="flex gap-2">
                <button onClick={() => downloadCSV(filteredExpenses, `expense_report_${dateFilter || 'all'}.csv`)} className="px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex-1">Export</button>
                <button onClick={fetchExpenses} className="px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex-1">Refresh</button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-lg">
              <h4 className="font-bold mb-3 text-gray-900">Filters</h4>
              <select value={dateFilter} onChange={(e) => { setDateFilter(e.target.value as DateFilter); if (e.target.value !== 'custom') { setCustomStartDate(''); setCustomEndDate(''); } }} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 mb-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600">
                <option value="">No Filter</option>
                <option value="all">All Time</option>
                <option value="yesterday">Yesterday</option>
                <option value="last_month">Last Month</option>
                <option value="last_3_months">Last 3 Months</option>
                <option value="last_6_months">Last 6 Months</option>
                <option value="last_9_months">Last 9 Months</option>
                <option value="last_year">Last 1 Year</option>
                <option value="custom">Custom Range</option>
              </select>

              {dateFilter === 'custom' && (
                <div className="grid grid-cols-1 gap-2">
                  <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600" />
                  <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Delete expense?</h3>
            <p className="text-sm text-gray-700 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 font-semibold hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm!)} className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {weekEditorOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setWeekEditorOpen(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Edit Week — {weekEditorOpen} {weekEditorOpen === currentWeekStart ? '(This week)' : ''}</h3>
              <button onClick={() => setWeekEditorOpen(null)} className="text-gray-600 hover:text-gray-800 font-semibold">Close</button>
            </div>
            
            <p className="text-sm text-gray-700 mb-4">Select expenses below to mark as paid, or edit details directly.</p>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {(expensesByWeek.find(([wk]) => wk === weekEditorOpen)?.[1] || []).map(exp => {
                const isSelected = selectedExpensesToPay.includes(exp._id!);
                return (
                  <div key={exp._id} className="flex items-center justify-between p-4 rounded-lg border border-gray-300 bg-gray-50">
                    <div className="flex-1">
                      <input value={exp.description} onChange={(e) => updateExpense(exp._id!, { description: e.target.value })} className="w-full mb-2 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600" />
                      <div className="flex gap-2">
                        <input type="date" value={exp.date} onChange={(e) => updateExpense(exp._id!, { date: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600" />
                        <input value={exp.shop || ''} onChange={(e) => updateExpense(exp._id!, { shop: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600" placeholder="Shop" />
                        <input type="number" value={String(exp.amount)} onChange={(e) => updateExpense(exp._id!, { amount: Number(e.target.value) })} className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600" />
                      </div>

                      {exp.subtasks && exp.subtasks.length > 0 && (
                        <div className="mt-2 text-xs text-gray-700">
                          Subtasks: {exp.subtasks.length} — {exp.subtasks.filter(s => s.done).length} done
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-4">
                      <div className={`text-sm font-semibold ${exp.paid ? 'text-emerald-600' : 'text-rose-600'}`}>{exp.paid ? 'Paid' : 'Unpaid'}</div>
                      
                      {!exp.paid && exp._id && (
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleSelectExpense(exp._id!)}
                            className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-600"
                          />
                          <label className="text-sm text-gray-900">Mark Paid</label>
                        </div>
                      )}
                      
                      {!exp.paid && weekEditorOpen === currentWeekStart && (
                        <button onClick={() => setDeleteConfirm(exp._id || null)} className="text-sm text-rose-600 hover:text-rose-800 font-medium">Delete</button>
                      )}
                      <button onClick={() => openExpenseEditor(exp)} className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-100 transition-colors">Open task</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-between gap-3 items-center pt-4 border-t border-gray-300">
              <div className="font-semibold text-gray-900">
                Selected to Pay: {selectedExpensesToPay.length}
              </div>
              <div className="flex gap-2">
                <button 
                    onClick={markSelectedPaid} 
                    disabled={selectedExpensesToPay.length === 0}
                    className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${selectedExpensesToPay.length > 0 ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                    Done Payment
                </button>
                <button onClick={() => setWeekEditorOpen(null)} className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-900 font-semibold transition-colors">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {localExpCopy && editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => { setEditingExpense(null); setLocalExpCopy(null); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Edit Expense</h3>
              <button onClick={() => { setEditingExpense(null); setLocalExpCopy(null); }} className="text-gray-600 hover:text-gray-800 font-semibold">Close</button>
            </div>

            <div className="space-y-3">
              <input value={localExpCopy.description} onChange={(e) => setLocalExpCopy({ ...localExpCopy, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600" />
              <div className="flex gap-2">
                <input type="date" value={localExpCopy.date} onChange={(e) => setLocalExpCopy({ ...localExpCopy, date: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600" />
                <input value={localExpCopy.shop || ''} onChange={(e) => setLocalExpCopy({ ...localExpCopy, shop: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600" placeholder="Shop" />
                <input type="number" value={String(localExpCopy.amount)} onChange={(e) => setLocalExpCopy({ ...localExpCopy, amount: Number(e.target.value) })} className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600" />
              </div>

              <div className="pt-4 border-t border-gray-300">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Subtasks</h4>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                  {(localExpCopy.subtasks || []).map((st) => (
                    <div key={st.id} className="flex items-center gap-2 border border-gray-300 rounded-lg p-3 bg-gray-50">
                      <input type="checkbox" checked={st.done} onChange={(e) => {
                        setLocalExpCopy(prev => {
                          if (!prev) return prev;
                          return { ...prev, subtasks: prev.subtasks!.map(s => s.id === st.id ? { ...s, done: e.target.checked } : s) };
                        });
                      }} className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-600" />
                      <input value={st.title} onChange={(e) => {
                        setLocalExpCopy(prev => {
                          if (!prev) return prev;
                          return { ...prev, subtasks: prev.subtasks!.map(s => s.id === st.id ? { ...s, title: e.target.value } : s) };
                        });
                      }} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600" />
                      <input type="number" value={st.amount ?? ''} onChange={(e) => {
                        const v = e.target.value === '' ? undefined : Number(e.target.value);
                        setLocalExpCopy(prev => {
                          if (!prev) return prev;
                          return { ...prev, subtasks: prev.subtasks!.map(s => s.id === st.id ? { ...s, amount: v } : s) };
                        });
                      }} placeholder="amt" className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-600" />
                      <div className="text-xs text-gray-600 mr-2">
                        <span className="text-[10px]">{st.date || ''}</span>
                      </div>
                      <button onClick={() => {
                        setLocalExpCopy(prev => prev ? { ...prev, subtasks: prev.subtasks!.filter(s => s.id !== st.id) } : prev);
                      }} className="text-rose-600 hover:text-rose-800 px-2 font-medium">Del</button>
                    </div>
                  ))}
                  {(!localExpCopy.subtasks || localExpCopy.subtasks.length === 0) && <div className="text-sm text-gray-700 text-center py-4">No subtasks</div>}
                </div>
                
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-100 space-y-2">
                  <h5 className="font-semibold text-sm text-gray-900">Add New Subtask</h5>
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Subtask description (required)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-600"
                  />
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={newSubtaskAmount as any}
                      onChange={(e) => setNewSubtaskAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="Amount (optional)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-600"
                    />
                    <button onClick={addSubtaskToLocal} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors">Add</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-300">
              <button onClick={() => { setEditingExpense(null); setLocalExpCopy(null); }} className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-900 font-semibold transition-colors">Cancel</button>
              <button onClick={async () => {
                if (!localExpCopy || !editingExpense) return;
                const newWeekStart = getWeekStartISO(new Date(localExpCopy.date)); 
                const updates: Partial<Expense> = {
                  description: localExpCopy.description,
                  date: localExpCopy.date,
                  shop: localExpCopy.shop || '',
                  amount: localExpCopy.amount,
                  subtasks: localExpCopy.subtasks || [],
                  weekStart: newWeekStart,
                };
                await updateExpense(editingExpense._id!, updates);
                setEditingExpense(null);
                setLocalExpCopy(null);
              }} className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

      {showWeekTotalFor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowWeekTotalFor(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-3 text-gray-900">Week total — {showWeekTotalFor}</h3>
            <p className="text-4xl font-bold text-gray-900">
              {(() => {
                const wkArr = expensesByWeek.find(([wk]) => wk === showWeekTotalFor)?.[1] || [];
                const total = wkArr.reduce((sum, e) => {
                  return sum + getExpenseTotal(e);
                }, 0);
                return `₹ ${total.toFixed(2)}`;
              })()}
            </p>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowWeekTotalFor(null)} className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-900 font-semibold transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {showExpenseTotalId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowExpenseTotalId(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const exp = expenses.find(x => x._id === showExpenseTotalId);
              if (!exp) return <div className="text-gray-900">Expense not found</div>;
              const total = getExpenseTotal(exp);
              return (
                <>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{exp.description}</h3>
                  <div className="text-sm text-gray-700 mb-4">{exp.date} • {exp.shop ? `@${exp.shop}` : exp.category}</div>

                  <div className="mb-4">
                    <div className="flex justify-between text-gray-900 py-2">
                      <div>Expense base amount</div>
                      <div className="font-semibold">₹ { (typeof exp.amount === 'number' ? exp.amount : Number(exp.amount) || 0).toFixed(2) }</div>
                    </div>

                    {(exp.subtasks || []).length > 0 && (
                      <div className="mt-3 border-t border-gray-300 pt-3">
                        <div className="text-sm font-semibold text-gray-900 mb-2">Subtasks</div>
                        <ul className="space-y-2 max-h-40 overflow-y-auto">
                          {(exp.subtasks || []).map((st: any) => {
                            const a = (typeof st.amount === 'number' && !Number.isNaN(st.amount)) ? st.amount : Number(st.amount) || 0;
                            return (
                              <li key={st.id} className="flex justify-between text-sm text-gray-800 p-2 bg-gray-100 rounded-lg">
                                <div>
                                  <div className="font-medium">{st.title}</div>
                                  <div className="text-[11px] text-gray-600">{st.date || ''}</div>
                                </div>
                                <div className="font-semibold">₹ {a.toFixed(2)}</div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="text-right border-t border-gray-300 pt-4">
                    <div className="text-sm text-gray-700">Total (Base + Subtasks)</div>
                    <div className="text-3xl font-bold text-gray-900">₹ {total.toFixed(2)}</div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button onClick={() => setShowExpenseTotalId(null)} className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-900 font-semibold transition-colors">Close</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseTrackerPage;