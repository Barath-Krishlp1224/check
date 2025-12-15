'use client'

import React, { useEffect, useMemo, useState } from 'react';
import {TrendingDown, Calendar, Filter, RefreshCw, X, Store, AlertCircle, Menu, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';

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

// Define the type for the Initial Amount History entry (matching your Mongoose model)
interface InitialAmountHistoryEntry {
    _id: string;
    amount: number;
    date: string;
    createdAt: string;
}

type DateFilter =
  | 'all'
  | 'this_week'
  | 'yesterday'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'last_9_months'
  | 'last_year'
  | 'custom'
  | '';

// Removed BUDGET_STORAGE_KEY and DEFAULT_BUDGET constants as the source of truth is now the API/DB.

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
  endDate.setHours(23, 59, 59, 999); 

  switch (filter) {
    case 'all':
      return { startDate: null, endDate: null };
    case 'this_week':
      startDate = new Date(getWeekStartISO(today));
      break;
    case 'yesterday':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 1);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'last_month':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'last_3_months':
      startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'last_6_months':
      startDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'last_9_months':
      startDate = new Date(today.getFullYear(), today.getMonth() - 9, today.getDate());
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'last_year':
      startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'custom':
    case '':
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

const ExpenseDashboard: React.FC = () => {
  // Initialize mainBudget to 0, it will be updated from the API
  const [mainBudget, setMainBudget] = useState<number>(0); 
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [budgetLoading, setBudgetLoading] = useState(false); // New state for budget loading

  const [dateFilter, setDateFilter] = useState<DateFilter>('this_week'); 
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [shopFilter, setShopFilter] = useState('');
  const [showExpenseTotalId, setShowExpenseTotalId] = useState<string | null>(null);

  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  // Initialize newBudgetValue with 0 or a placeholder, it will be updated when the budget loads
  const [newBudgetValue, setNewBudgetValue] = useState('0.00'); 

  const toggleWeekExpanded = (week: string) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(week)) {
        newSet.delete(week);
      } else {
        newSet.add(week);
      }
      return newSet;
    });
  };

  const currentWeekStart = getWeekStartISO(new Date());

  // NEW FUNCTION: Fetch the latest budget amount from the API
  const fetchInitialBudget = async () => {
    setBudgetLoading(true);
    try {
        // ASSUMPTION: Your InitialAmount API is at /api/initial-amount
        const res = await fetch('/api/initial-amount'); 
        const json = await res.json();
        
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            // Your GET API sorts by createdAt descending, so the first element is the latest.
            const latestBudget: InitialAmountHistoryEntry = json.data[0];
            const amount = latestBudget.amount;
            setMainBudget(amount);
            setNewBudgetValue(amount.toFixed(2));
            toast.success(`Budget loaded from database: ₹${amount.toLocaleString('en-IN')}.`);
        } else {
            // Handle case where no budget is found in the DB (you might set a default here or keep it at 0)
            setMainBudget(0);
            setNewBudgetValue('0.00');
            toast.warn('No initial budget found in database. Set a new one.');
        }
    } catch (err) {
        console.error('Failed to fetch initial budget', err);
        setMainBudget(0);
        setNewBudgetValue('0.00');
        toast.error('Network error while fetching initial budget.');
    } finally {
        setBudgetLoading(false);
    }
  }

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/expenses');
      const json = await res.json();
      if (json.success) {
        setExpenses(json.data);
        toast.success(`Expenses refreshed successfully! (${json.data.length} items found)`);
      } else {
        console.error('Failed to fetch expenses', json);
        toast.error('Failed to fetch expenses: API error.');
      }
    } catch (err) {
      console.error('Fetch error', err);
      toast.error('Network error while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  // MODIFIED FUNCTION: Send budget update to the API
  const handleUpdateBudget = async () => {
    const value = parseFloat(newBudgetValue);
    if (isNaN(value) || value <= 0) {
        toast.error('Please enter a valid budget amount.');
        return;
    }
    
    if (value === mainBudget) {
        toast.info('Budget remains unchanged.');
        setIsEditingBudget(false);
        return;
    }

    setBudgetLoading(true);

    try {
        // Send POST request to your API
        const res = await fetch('/api/initial-amount', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                amount: value, 
                // Use today's date for the new budget entry
                date: new Date().toISOString().split('T')[0] 
            }),
        });

        const json = await res.json();

        if (json.success) {
            setMainBudget(value);
            setNewBudgetValue(value.toFixed(2));
            toast.success(`Main budget successfully updated to ₹${value.toLocaleString('en-IN')}.`);
        } else {
            toast.error(`Failed to save budget: ${json.error || 'API error'}`);
        }
    } catch (error) {
        console.error('Budget update error:', error);
        toast.error('Network error while saving budget.');
    } finally {
        setIsEditingBudget(false);
        setBudgetLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchInitialBudget(); // Fetch the initial budget on mount
  }, []);

  // ... (rest of the component logic remains the same, only renderSidebar and renderBudgetEditModal updated to show loading)

  const getExpenseTotal = (e: Expense): number => {
    const expenseAmount = typeof e.amount === 'number' && !Number.isNaN(e.amount) ? e.amount : Number(e.amount) || 0;
    const subtasksTotal = (e.subtasks || []).reduce((ss, st) => {
      const a = (st as any).amount;
      return ss + (typeof a === 'number' && !Number.isNaN(a) ? a : Number(a) || 0);
    }, 0);
    return expenseAmount + subtasksTotal;
  };

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
    const isDateFilterSet = dateFilter !== 'this_week' && dateFilter !== '';
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

    return filtered;
  }, [dateFilteredExpenses, shopFilter]);

  const unpaidExpensesInView = useMemo(() => finalFilteredExpenses.filter(e => !e.paid), [finalFilteredExpenses]);
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

    unpaidExpensesInView.forEach(exp => {
      const shopName = exp.shop && exp.shop.trim() ? exp.shop.trim() : 'Unassigned Shop';
      const totalAmount = getExpenseTotal(exp);
      const currentTotal = totals.get(shopName) || 0;
      totals.set(shopName, currentTotal + totalAmount);
    });

    return Array.from(totals.entries()).map(([shop, total]) => ({ shop, total }));
  }, [unpaidExpensesInView]);

  const grandTotal = finalFilteredExpenses.reduce((s, e) => s + getExpenseTotal(e), 0);

  const renderBudgetEditModal = () => {
    if (!isEditingBudget) return null;

    return (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setIsEditingBudget(false)}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Update Main Budget</h3>
                  <button
                    onClick={() => setIsEditingBudget(false)}
                    className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Budget Amount (₹)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={newBudgetValue}
                        onChange={(e) => setNewBudgetValue(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 text-gray-900 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 60000.00"
                        disabled={budgetLoading}
                    />
                    <p className="text-xs text-gray-500 mt-2">Current Budget: ₹{mainBudget.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-red-500 mt-1">
                        **IMPORTANT:** This will create a **new** budget entry in the database.
                    </p>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    onClick={() => setIsEditingBudget(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-medium transition-colors"
                    disabled={budgetLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateBudget}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors flex items-center gap-2"
                    disabled={parseFloat(newBudgetValue) === mainBudget || budgetLoading}
                  >
                    {budgetLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
            </div>
        </div>
    );
  };


  const renderSidebar = () => {
    const totalPaid = paidExpenses.reduce((sum, e) => sum + getExpenseTotal(e), 0);
    const remainingBalance = mainBudget - totalPaid;
    const isOverBudget = remainingBalance < 0;
    // Handle division by zero if mainBudget is 0
    const percentageUsed = mainBudget > 0 ? (totalPaid / mainBudget) * 100 : 0;
    
    const budgetDisplay = (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-white">
            <h3 className="text-lg font-semibold">Budget Overview</h3>
          </div>
          <button 
            onClick={() => {
                setNewBudgetValue(mainBudget.toFixed(2));
                setIsEditingBudget(true);
            }} 
            className="text-white text-sm font-medium opacity-80 hover:opacity-100 transition-opacity p-1 rounded flex items-center gap-1"
            disabled={budgetLoading}
          >
            <DollarSign className='w-4 h-4' /> Edit
          </button>
        </div>

        <div className="p-6 space-y-4">
          {budgetLoading ? (
            <div className="flex items-center justify-center py-6">
                <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                <span className="ml-3 text-gray-600">Loading Budget...</span>
            </div>
          ) : (
            <>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Initial Budget</span>
                    <span className="text-lg font-bold text-gray-900">₹{mainBudget.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Total Paid</span>
                    <span className="text-lg font-bold text-blue-600">₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div
                        className={`h-2.5 rounded-full transition-all ${isOverBudget ? 'bg-red-600' : 'bg-blue-600'}`}
                        style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                    ></div>
                    </div>
                    <p className="text-xs text-gray-500 text-right">{percentageUsed.toFixed(1)}% utilized</p>
                </div>

                <div className={`p-4 rounded-lg ${isOverBudget ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                    <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Remaining Balance</p>
                        <p className={`text-2xl font-bold mt-1 ${isOverBudget ? 'text-red-700' : 'text-green-700'}`}>
                        ₹{remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    {isOverBudget && <AlertCircle className="w-8 h-8 text-red-600" />}
                    </div>
                </div>
            </>
          )}
        </div>
      </div>
    );
    
    const summaryAndFilter = (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
              <div className="flex items-center gap-2 text-white">
                <Menu className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Summary & Filters</h3>
              </div>
            </div>

            <div className="p-6">
                <div className="mb-6 pb-4 border-b border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-1">
                        <TrendingDown className="w-4 h-4" /> Unpaid Breakdown
                    </h4>
                    <div className="space-y-2">
                        {unpaidTotalsByShop.length > 0 ? unpaidTotalsByShop.map(({ shop, total }) => (
                            <div key={shop} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                                <div className="flex items-center gap-2">
                                    <Store className="w-4 h-4 text-slate-600" />
                                    <span className="text-sm font-medium text-gray-800">{shop}</span>
                                </div>
                                <span className="text-base font-bold text-slate-700">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        )) : (
                            <div className="text-center py-2 text-gray-500 text-sm">No unpaid expenses in view</div>
                        )}
                    </div>
                </div>

                <div className="border-b border-gray-200 pb-4 mb-6">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Grand Total (In View)</span>
                        <span className="text-2xl font-bold text-slate-900">
                            ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500">
                        {finalFilteredExpenses.length} items in view
                        {isFilterActive ? ' • Filtered results' : ` • Showing ${dateFilter.replace('_', ' ')}`}
                    </p>
                </div>

                <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1">
                        <Filter className="w-4 h-4" /> Expense Filters
                    </h4>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">Date Range</label>
                        <select
                            value={dateFilter}
                            onChange={(e) => {
                                setDateFilter(e.target.value as DateFilter);
                                if (e.target.value !== 'custom') {
                                    setCustomStartDate('');
                                    setCustomEndDate('');
                                }
                            }}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                            <option value="this_week">Current Week (Default)</option>
                            <option value="all">All Time</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="last_month">Last Month</option>
                            <option value="last_3_months">Last 3 Months</option>
                            <option value="last_6_months">Last 6 Months</option>
                            <option value="last_9_months">Last 9 Months</option>
                            <option value="last_year">Last Year</option>
                            <option value="custom">Custom Range</option>
                            <option value="">Show Only Unpaid (All Time)</option>
                        </select>
                    </div>

                    {dateFilter === 'custom' && (
                        <div className="space-y-2 pl-2 border-l-2 border-blue-500">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">Shop Name</label>
                        <input
                            value={shopFilter}
                            onChange={(e) => setShopFilter(e.target.value)}
                            placeholder="Filter by shop..."
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <button
                    onClick={() => {
                        fetchExpenses();
                        fetchInitialBudget(); // Refresh budget data as well
                    }}
                    disabled={loading || budgetLoading}
                    className="w-full mt-6 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${(loading || budgetLoading) ? 'animate-spin' : ''}`} />
                    {loading || budgetLoading ? 'Refreshing...' : 'Refresh All Data'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {budgetDisplay}
            {summaryAndFilter}
        </div>
    );
  };

  const renderExpenseList = () => (
    <div className="space-y-5">
      {expensesByWeek.map(([wk, wkExpenses]) => {
        const weekTotal = wkExpenses.reduce((sum, e) => {
          return sum + getExpenseTotal(e);
        }, 0);
        const unpaidCount = wkExpenses.filter(e => !e.paid).length;
        const isCurrentWeek = wk === currentWeekStart;
        
        const isExpanded = expandedWeeks.has(wk);
        const displayExpenses = isExpanded ? wkExpenses : wkExpenses.slice(0, 5);
        const hasMore = wkExpenses.length > 5;

        return (
          <div key={wk} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${isCurrentWeek ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
            <div className={`px-6 py-4 ${isCurrentWeek ? 'bg-gradient-to-r from-blue-50 to-blue-100' : 'bg-gray-50'} border-b border-gray-200`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className={`w-5 h-5 ${isCurrentWeek ? 'text-blue-600' : 'text-gray-600'}`} />
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      Week of {wk}
                      {isCurrentWeek && <span className="ml-2 text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Current</span>}
                    </h3>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {wkExpenses.length} items • ₹{weekTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {unpaidCount > 0 && ` • ${unpaidCount} unpaid`}
                      {unpaidCount === 0 && wkExpenses.length > 0 && ` • All Paid`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => toggleWeekExpanded(wk)} className="p-2 rounded-full hover:bg-gray-200">
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-2">
              {displayExpenses.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
                <div key={exp._id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-white">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="text-3xl flex-shrink-0">{categoryIcons[exp.category]}</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900 text-base flex items-center gap-2 flex-wrap">
                        <span className="truncate">{exp.description}</span>
                        {exp.shop && (
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md font-normal whitespace-nowrap">
                                @{exp.shop}
                            </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span>{exp.date}</span>
                        <span className="text-gray-400">•</span>
                        <span>{exp.category}</span>
                        {exp.subtasks && exp.subtasks.length > 0 && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span>{exp.subtasks.filter(s => s.done).length}/{exp.subtasks.length} sub expenses</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <div className="text-right">
                      <div className={`font-bold text-lg ${exp.paid ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{getExpenseTotal(exp).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className={`text-[10px] font-semibold uppercase tracking-wide ${exp.paid ? 'text-green-600' : 'text-red-600'}`}>
                          {exp.paid ? 'Paid' : 'Unpaid'}
                      </div>
                    </div>

                    <button
                      onClick={() => setShowExpenseTotalId(exp._id || null)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-sm font-medium transition-colors flex items-center gap-1"
                    >
                      <span className="hidden sm:inline">Details</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => toggleWeekExpanded(wk)}
                  className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {isExpanded ? `Show Less (${wkExpenses.length} items)` : `Show More (${wkExpenses.length - 5} hidden items)`}
                </button>
              </div>
            )}

          </div>
        );
      })}

      {expensesByWeek.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-400 mb-3">
                <TrendingDown className="w-8 h-8 mx-auto" />
              </div>
              <p className="text-gray-600 font-medium">No expenses found</p>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
          </div>
      )}
    </div>
  );

  const renderExpenseDetailsModal = () => {
    const exp = expenses.find(x => x._id === showExpenseTotalId);
    if (!exp) return null;
    const total = getExpenseTotal(exp);

    return (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setShowExpenseTotalId(null)}>
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white">Expense Details</h3>
                  </div>
                  <button
                    onClick={() => setShowExpenseTotalId(null)}
                    className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">{exp.description}</h4>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {exp.date}
                      </span>
                      {exp.shop && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="flex items-center gap-1">
                            <Store className="w-4 h-4" />
                            {exp.shop}
                          </span>
                        </>
                      )}
                      <span className="text-gray-400">•</span>
                      <span>{exp.category}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Base Amount</span>
                        <span className="text-xl font-bold text-gray-900">
                          ₹{(typeof exp.amount === 'number' ? exp.amount : Number(exp.amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {(exp.subtasks || []).length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Sub Expenses</h5>
                        <div className="space-y-2 max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-3 border border-gray-200">
                          {(exp.subtasks || []).slice().sort((a, b) => new Date(b.date || '1970-01-01').getTime() - new Date(a.date || '1970-01-01').getTime()).map((st: any) => {
                            const a = (typeof st.amount === 'number' && !Number.isNaN(st.amount)) ? st.amount : Number(st.amount) || 0;
                            return (
                              <div key={st.id} className="flex justify-between items-start p-3 bg-white rounded-lg border border-gray-200">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 text-sm">{st.title}</div>
                                  {st.date && <div className="text-xs text-gray-500 mt-0.5">{st.date}</div>}
                                </div>
                                <div className="font-bold text-gray-900 ml-3">
                                  ₹{a.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-5 text-white">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs font-medium opacity-90 uppercase tracking-wide">Total Amount</p>
                          <p className="text-xs opacity-75 mt-0.5">Base + Sub Expenses</p>
                        </div>
                        <div className="text-4xl font-bold">
                          ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg text-center font-semibold ${exp.paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {exp.paid ? 'This expense has been paid' : 'This expense is unpaid'}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={() => setShowExpenseTotalId(null)}
                    className="px-6 py-2.5 bg-slate-700 hover:bg-slate-800 rounded-lg text-white font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      <div className="max-w-[1600px]  mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 mt-[10%]">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Expense Dashboard</h1>
          <p className="text-gray-600">Track and manage your expenses efficiently</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            {renderExpenseList()}
          </div>

          <div className="xl:col-span-1 space-y-6">
            {renderSidebar()}
          </div>
          
        </div>
      </div>

      {showExpenseTotalId && renderExpenseDetailsModal()}
      {renderBudgetEditModal()}
    </div>
  );
};

export default ExpenseDashboard;