'use client'

import React, { useEffect, useMemo, useState } from 'react';

// --- Consolidated Interfaces (From interfaces.ts) ---
interface SubExpense {
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
  subtasks?: SubExpense[];
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

// --- Consolidated Utils (From utils.ts) ---
const BUDGET_STORAGE_KEY = 'expense_tracker_budget';
const DEFAULT_BUDGET = 50000.00;

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

const categoryIcons: Record<string, string> = {
  Food: '🍔',
  Transport: '🚗',
  Utilities: '💡',
  Entertainment: '🎬',
  Other: '📦',
};

// --- START COMPONENT ---
const ExpenseDashboard: React.FC = () => {
  // Load budget from localStorage on initial load
  const [mainBudget, setMainBudget] = useState<number>(() => {
    if (typeof window !== 'undefined') {
        const savedBudget = localStorage.getItem(BUDGET_STORAGE_KEY);
        // NOTE: Budget is now fixed and only editable by changing this code or localStorage directly
        return savedBudget ? parseFloat(savedBudget) : DEFAULT_BUDGET;
    }
    return DEFAULT_BUDGET;
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filter state (set to 'all' to show all expenses by default)
  const [dateFilter, setDateFilter] = useState<DateFilter>('all'); 
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [shopFilter, setShopFilter] = useState('');
  const [showExpenseTotalId, setShowExpenseTotalId] = useState<string | null>(null);

  const currentWeekStart = getWeekStartISO(new Date());
  
  // Removed: isBudgetVisible state, budgetEditorOpen state, tempBudget state
  // Removed: Persistence effect for budget (already in useState initializer)

  // --- Data Fetching (Retained for Initial Load/Refresh) ---
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      // NOTE: Actual API endpoint is '/api/expenses' (assuming Next.js setup)
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


  // --- Core Calculation Logic ---
  const getExpenseTotal = (e: Expense): number => {
    const expenseAmount = typeof e.amount === 'number' && !Number.isNaN(e.amount) ? e.amount : Number(e.amount) || 0;
    const subtasksTotal = (e.subtasks || []).reduce((ss, st) => {
      const a = (st as any).amount;
      return ss + (typeof a === 'number' && !Number.isNaN(a) ? a : Number(a) || 0);
    }, 0);
    return expenseAmount + subtasksTotal;
  };

  // --- Filtering Logic ---
  const dateFilteredExpenses = useMemo(() => {
    let startDate: string | null = null;
    let endDate: string | null = null;

    if (dateFilter === 'custom') {
      startDate = customStartDate;
      endDate = customEndDate;
    } else if (dateFilter !== '' && dateFilter !== 'all') {
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
        
        const isAfterStart = !start || expenseDate >= start;
        const isBeforeEnd = !end || expenseDate <= end;
        
        return isAfterStart && isBeforeEnd;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, dateFilter, customStartDate, customEndDate]);

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

    if (dateFilter === '') {
        filtered = filtered.filter(exp => !exp.paid);
    }

    return filtered;
  }, [dateFilteredExpenses, shopFilter, dateFilter]);
  
  const paidExpenses = useMemo(() => expenses.filter(e => e.paid), [expenses]);

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
  }, [finalFilteredExpenses]);

  const grandTotal = finalFilteredExpenses.reduce((s, e) => s + (e.paid && dateFilter === '' ? 0 : getExpenseTotal(e)), 0);

  // --- Render Functions (Simplified UI) ---

  const renderBudgetDisplay = () => {
    const totalPaid = paidExpenses.reduce((sum, e) => sum + getExpenseTotal(e), 0);
    const remainingBalance = mainBudget - totalPaid;
    const isOverBudget = remainingBalance < 0;

    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900">Overall Budget Status</h3>
          {/* Removed Edit Budget Button */}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 rounded-lg border border-gray-200 bg-gray-50">
            <div className="font-medium text-lg text-gray-700">Initial Budget</div>
            {/* Budget always visible */}
            <div className="text-2xl font-bold text-indigo-700">₹ {mainBudget.toFixed(2)}</div>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg border border-gray-200 bg-gray-50">
            <div className="font-medium text-lg text-gray-700">Total Paid Expenses</div>
            <div className="text-2xl font-bold text-indigo-700">₹ {totalPaid.toFixed(2)}</div>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-gray-300">
            <div className="font-bold text-2xl text-gray-900">Remaining Balance</div>
            <div className={`text-4xl font-extrabold ${isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
              ₹ {remainingBalance.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const renderSummaryAndFilter = () => (
    <>
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl">
            <h3 className="text-xl font-bold mb-1 text-gray-900">Total Unpaid Breakdown</h3>
            
            <div className="space-y-2 mt-4">
                {unpaidTotalsByShop.map(({ shop, total }) => (
                    <div key={shop} className="flex justify-between items-center bg-gray-100 p-3 rounded-lg border border-gray-200">
                        <div className="text-sm font-medium text-gray-800">{shop}</div>
                        <div className="text-xl font-bold text-indigo-700">₹ {total.toFixed(2)}</div>
                    </div>
                ))}
            </div>

            <hr className="border-gray-300 my-4" />

            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Grand Total (Unpaid in View)</h3>
                <p className="text-4xl font-bold text-indigo-700">
                    ₹ {grandTotal.toFixed(2)}
                </p>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {finalFilteredExpenses.length} total items in view.
              {isFilterActive ? ' Showing filtered items.' : ' Showing only unpaid items.'}
            </p>

            <div className="flex gap-2 mt-4">
              <button onClick={fetchExpenses} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-200 transition-colors flex-1">Refresh</button>
            </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-lg">
            <h4 className="font-bold mb-3 text-gray-900">Filters</h4>
            <select 
                value={dateFilter} 
                onChange={(e) => { 
                    setDateFilter(e.target.value as DateFilter); 
                    if (e.target.value !== 'custom') { 
                        setCustomStartDate(''); 
                        setCustomEndDate(''); 
                    } 
                }} 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 mb-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="">Show Only Unpaid</option>
              <option value="all">All Time (Show Paid & Unpaid)</option>
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
                <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
              </div>
            )}
            
            <input
                value={shopFilter}
                onChange={(e) => setShopFilter(e.target.value)}
                placeholder="Filter by Shop name"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 mt-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
        </div>
    </>
  );

  const renderExpenseList = () => (
    <div className="space-y-4">
      {expensesByWeek.map(([wk, wkExpenses]) => {
        const weekTotal = wkExpenses.reduce((sum, e) => {
          return sum + getExpenseTotal(e);
        }, 0);
        const unpaidCount = wkExpenses.filter(e => !e.paid).length;
        const isCurrentWeek = wk === currentWeekStart;
        const weekLabel = `${wk}${isCurrentWeek ? ' • This week' : ''}`;
        
        return (
          <div key={wk} className={`bg-white rounded-2xl shadow-lg border p-5 ${isCurrentWeek ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{weekLabel}</h3>
                <div className="text-sm text-gray-700">
                  {wkExpenses.length} items • **₹ {weekTotal.toFixed(2)}**
                  {isFilterActive ? ` • ${wkExpenses.filter(e => e.paid).length} paid` : ''}
                  {!isFilterActive && unpaidCount > 0 ? ` • ${unpaidCount} unpaid` : ''}
                  {!isFilterActive && unpaidCount === 0 && wkExpenses.length > 0 && ` • All paid`}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isFilterActive && unpaidCount > 0 && <div className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">Pending</div>}
                {!isFilterActive && unpaidCount === 0 && wkExpenses.length > 0 && <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">Paid</div>}
              </div>
            </div>

            <div className="space-y-2">
              {wkExpenses.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
                <div key={exp._id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{categoryIcons[exp.category]}</div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        **{exp.description}**
                        {exp.shop ? (
                            <span className="text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded ml-2">
                                @{exp.shop}
                            </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-gray-600">**{exp.date}** • {exp.category} {exp.subtasks && exp.subtasks.length > 0 ? `• ${exp.subtasks.filter(s => s.done).length}/${exp.subtasks.length} sub expenses` : ''}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`font-bold ${exp.paid ? 'text-emerald-600' : 'text-rose-600'}`}>
                      **₹ {getExpenseTotal(exp).toFixed(2)}**
                    </div>
                    {/* Show Paid/Unpaid Status */}
                    <div className={`text-xs px-2 py-1 rounded ${exp.paid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {exp.paid ? 'PAID' : 'UNPAID'}
                    </div>

                    <button
                      onClick={() => setShowExpenseTotalId(exp._id || null)}
                      className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm font-medium transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      
      {expensesByWeek.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center text-gray-600">
              No expenses found matching the current filters.
          </div>
      )}
    </div>
  );

  const renderExpenseDetailsModal = () => {
    const exp = expenses.find(x => x._id === showExpenseTotalId);
    if (!exp) return null;
    const total = getExpenseTotal(exp);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowExpenseTotalId(null)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-2 text-gray-900">{exp.description}</h3>
                <div className="text-sm text-gray-700 mb-4">**{exp.date}** • {exp.shop ? `@${exp.shop}` : exp.category}</div>

                <div className="mb-4">
                  <div className="flex justify-between text-gray-900 py-2">
                    <div>Expense base amount</div>
                    <div className="font-semibold">₹ { (typeof exp.amount === 'number' ? exp.amount : Number(exp.amount) || 0).toFixed(2) }</div>
                  </div>

                  {(exp.subtasks || []).length > 0 && (
                    <div className="mt-3 border-t border-gray-300 pt-3">
                      <div className="text-sm font-semibold text-gray-900 mb-2">Sub Expenses</div>
                      <ul className="space-y-2 max-h-40 overflow-y-auto">
                        {(exp.subtasks || []).slice().sort((a, b) => new Date(b.date || '1970-01-01').getTime() - new Date(a.date || '1970-01-01').getTime()).map((st: any) => {
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
                  <div className="text-sm text-gray-700">Total (Base + Sub Expenses)</div>
                  <div className="text-3xl font-bold text-gray-900">₹ {total.toFixed(2)}</div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button onClick={() => setShowExpenseTotalId(null)} className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-900 font-semibold transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">Expense Dashboard</h1>
          <p className="text-gray-700">View expenses, track budget, and apply filters (Read-Only Mode)</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Expense List</h2>
            {renderExpenseList()}
          </div>

          <div className="xl:col-span-1 space-y-6">
            {renderBudgetDisplay()}
            {renderSummaryAndFilter()}
          </div>
        </div>
      </div>

      {/* --- Modals --- */}
      {showExpenseTotalId && renderExpenseDetailsModal()}
      {/* Removed Budget Editor Modal */}
    </div>
  );
};

export default ExpenseDashboard;