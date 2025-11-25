

'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { Expense, DateFilter } from './interfaces';
import { getWeekStartISO, getFilterDates, uid } from './utils';
import NewExpenseForm from './NewExpenseForm';
import ExpenseList from './ExpenseList';
import SummaryAndFilter from './SummaryAndFilter';

const categoryIcons: Record<string, string> = {
  Food: '🍔',
  Transport: '🚗',
  Utilities: '💡',
  Entertainment: '🎬',
  Other: '📦',
};

const ExpenseTrackerPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  // New Expense Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [shop, setShop] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter state
  const [dateFilter, setDateFilter] = useState<DateFilter>('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [shopFilter, setShopFilter] = useState(''); 

  // Modals/Edit state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [weekEditorOpen, setWeekEditorOpen] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [localExpCopy, setLocalExpCopy] = useState<Expense | null>(null);
  
  const [selectedExpensesToPay, setSelectedExpensesToPay] = useState<string[]>([]);
  const [showExpenseTotalId, setShowExpenseTotalId] = useState<string | null>(null);

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskAmount, setNewSubtaskAmount] = useState<number | ''>('');
  
  const currentWeekStart = getWeekStartISO(new Date());

  // --- API Functions ---
  
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

  // --- Helper/Logic Functions ---

  const getExpenseTotal = (e: Expense) => {
    const expenseAmount = typeof e.amount === 'number' && !Number.isNaN(e.amount) ? e.amount : Number(e.amount) || 0;
    const subtasksTotal = (e.subtasks || []).reduce((ss, st) => {
      const a = (st as any).amount;
      return ss + (typeof a === 'number' && !Number.isNaN(a) ? a : Number(a) || 0);
    }, 0);
    return expenseAmount + subtasksTotal;
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

  const openExpenseEditor = (exp: Expense) => {
    setEditingExpense(exp);
    const expCopy: Expense = JSON.parse(JSON.stringify(exp));
    expCopy.shop = expCopy.shop || '';
    expCopy.subtasks = expCopy.subtasks || [];
    setLocalExpCopy(expCopy);
  };
  
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
    const newSub = { id: uid(), title: desc, done: false, amount: amt, date: today };
    setLocalExpCopy({ ...localExpCopy, subtasks: [...(localExpCopy.subtasks || []), newSub] });

    setNewSubtaskTitle('');
    setNewSubtaskAmount('');
  };

  // --- Filtering Logic (useMemo) ---

  const dateFilteredExpenses = useMemo(() => {
    if (dateFilter === '' && shopFilter.trim() === '') {
      return expenses.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    
    let startDate: string | null = null;
    let endDate: string | null = null;

    if (dateFilter === 'custom') {
      startDate = customStartDate;
      endDate = customEndDate;
    } else if (dateFilter !== 'all' && dateFilter !== '') {
      const d = getFilterDates(dateFilter as DateFilter);
      startDate = d.startDate;
      endDate = d.endDate;
    } else if (dateFilter === 'all') {
      startDate = null;
      endDate = null;
    } else {
        startDate = null;
        endDate = null;
    }


    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    return expenses
      .filter(exp => {
        const expenseDate = new Date(exp.date);
        expenseDate.setHours(0, 0, 0, 0);
        
        const isAfterStart = !start || expenseDate >= start;
        const isBeforeEnd = !end || expenseDate <= end;
        
        return isAfterStart && isBeforeEnd;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, dateFilter, customStartDate, customEndDate, shopFilter]);

  const isFilterActive = useMemo(() => {
    const isDateFilterSet = dateFilter !== '';
    const isShopFilterSet = shopFilter.trim() !== '';
    
    return isDateFilterSet || isShopFilterSet;
    
  }, [dateFilter, shopFilter]);

  const finalFilteredExpenses = useMemo(() => {
    let filtered = dateFilteredExpenses;
    
    const lowerCaseShopFilter = shopFilter.toLowerCase().trim();
    if (lowerCaseShopFilter) {
        filtered = filtered.filter(exp => {
            const expShop = exp.shop ? exp.shop.toLowerCase() : '';
            return expShop.includes(lowerCaseShopFilter);
        });
    }

    if (!isFilterActive) {
        filtered = filtered.filter(exp => !exp.paid);
    }

    return filtered;
  }, [dateFilteredExpenses, shopFilter, isFilterActive]);
  
  const expensesByWeek = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of finalFilteredExpenses) {
        const wk = e.weekStart || getWeekStartISO(new Date(e.date));
        if (!map.has(wk)) map.set(wk, []);
        map.get(wk)!.push(e);
    }
    const sorted = Array.from(map.entries()).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
    return sorted;
  }, [finalFilteredExpenses]);

  const unpaidTotalsByShop = useMemo(() => {
    const totals = new Map<string, number>();

    finalFilteredExpenses.forEach(exp => {
      if (!exp.paid) {
        const shopName = exp.shop && exp.shop.trim() ? exp.shop.trim() : 'Unassigned Shop';
        const totalAmount = getExpenseTotal(exp);
        
        const currentTotal = totals.get(shopName) || 0;
        totals.set(shopName, currentTotal + totalAmount);
      }
    });

    return Array.from(totals.entries()).map(([shop, total]) => ({ shop, total }));
  }, [finalFilteredExpenses, getExpenseTotal]);

  // --- Render ---

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">Expense Manager</h1>
          <p className="text-gray-700">Track weekly expenses with subtasks and mark payments complete</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <NewExpenseForm
              shop={shop} setShop={setShop}
              description={description} setDescription={setDescription}
              amount={amount} setAmount={setAmount}
              category={category} setCategory={setCategory}
              date={date} setDate={setDate}
              handleSubmit={handleSubmit}
            />

            <ExpenseList
              expensesByWeek={expensesByWeek}
              currentWeekStart={currentWeekStart}
              isFilterActive={isFilterActive}
              categoryIcons={categoryIcons}
              getExpenseTotal={getExpenseTotal}
              openWeekEditor={openWeekEditor}
              setShowExpenseTotalId={setShowExpenseTotalId}
              openExpenseEditor={openExpenseEditor}
              setDeleteConfirm={setDeleteConfirm}
            />
          </div>

          <SummaryAndFilter
            unpaidTotalsByShop={unpaidTotalsByShop}
            finalFilteredExpenses={finalFilteredExpenses}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            customStartDate={customStartDate}
            setCustomStartDate={setCustomStartDate}
            customEndDate={customEndDate}
            setCustomEndDate={setCustomEndDate}
            shopFilter={shopFilter}
            setShopFilter={setShopFilter}
            fetchExpenses={fetchExpenses}
            isFilterActive={isFilterActive}
            getExpenseTotal={getExpenseTotal}
          />
        </div>
      </div>

      {/* --- Delete Confirmation Modal (page.tsx) --- */}
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

      {/* --- Week Editor Modal (page.tsx) --- */}
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

      {/* --- Expense Editor Modal (page.tsx) --- */}
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

      {/* --- Expense Details Modal (page.tsx) --- */}
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