'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { TrendingDown, Calendar, Filter, RefreshCw, X, Store, AlertCircle, Menu, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
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

interface InitialAmountHistoryEntry {
    _id: string;
    amount: number;
    date: string;
    createdAt: string;
}

type DateFilter = 'all' | 'this_week' | 'yesterday' | 'last_month' | 'last_3_months' | 'last_6_months' | 'last_9_months' | 'last_year' | 'custom' | '';

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
        case 'all': return { startDate: null, endDate: null };
        case 'this_week': startDate = new Date(getWeekStartISO(today)); break;
        case 'yesterday':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 1);
            endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'last_month': startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()); break;
        case 'last_3_months': startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()); break;
        case 'last_year': startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()); break;
        default: return { startDate: null, endDate: null };
    }
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    return { startDate: startDate ? formatDate(startDate) : null, endDate: formatDate(endDate) };
};

const categoryIcons: Record<string, string> = {
    Food: '🍔', Transport: '🚗', Utilities: '💡', Entertainment: '🎬', Other: '📦',
};

const ExpenseDashboard: React.FC = () => {
    const [mainBudget, setMainBudget] = useState<number>(0);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(false);
    const [budgetLoading, setBudgetLoading] = useState(false);
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [shopFilter, setShopFilter] = useState('');
    const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [newBudgetValue, setNewBudgetValue] = useState('0.00');

    const toggleWeekExpanded = (week: string) => {
        setExpandedWeeks(prev => {
            const newSet = new Set(prev);
            newSet.has(week) ? newSet.delete(week) : newSet.add(week);
            return newSet;
        });
    };

    const currentWeekStart = getWeekStartISO(new Date());

    const fetchInitialBudget = async () => {
        setBudgetLoading(true);
        try {
            const res = await fetch('/api/initial-amount');
            const json = await res.json();
            if (json.success && json.data?.length > 0) {
                const amount = json.data[0].amount;
                setMainBudget(amount);
                setNewBudgetValue(amount.toFixed(2));
            }
        } catch (err) { toast.error('Error fetching budget'); } finally { setBudgetLoading(false); }
    };

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/expenses');
            const json = await res.json();
            if (json.success) setExpenses(json.data);
        } catch (err) { toast.error('Error fetching expenses'); } finally { setLoading(false); }
    };

    const handleUpdateBudget = async () => {
        const value = parseFloat(newBudgetValue);
        if (isNaN(value) || value <= 0) { toast.error('Enter valid amount.'); return; }
        setBudgetLoading(true);
        try {
            const res = await fetch('/api/initial-amount', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: value, date: new Date().toISOString().split('T')[0] }),
            });
            if ((await res.json()).success) {
                setMainBudget(value);
                toast.success('Budget Updated');
            }
        } catch (error) { toast.error('Error saving'); } finally { setIsEditingBudget(false); setBudgetLoading(false); }
    };

    useEffect(() => { fetchExpenses(); fetchInitialBudget(); }, []);

    const getExpenseTotal = (e: Expense): number => {
        const base = Number(e.amount) || 0;
        const sub = (e.subtasks || []).reduce((acc, st) => acc + (Number(st.amount) || 0), 0);
        return base + sub;
    };

    const finalFilteredExpenses = useMemo(() => {
        let { startDate, endDate } = dateFilter === 'custom' ? { startDate: customStartDate, endDate: customEndDate } : getFilterDates(dateFilter);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        return expenses.filter(exp => {
            const expDate = new Date(exp.date);
            const dateMatch = (!start || expDate >= start) && (!end || expDate <= end);
            const shopMatch = !shopFilter || (exp.shop || '').toLowerCase().includes(shopFilter.toLowerCase());
            return dateMatch && shopMatch;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, dateFilter, customStartDate, customEndDate, shopFilter]);

    const expensesByWeek = useMemo(() => {
        const map = new Map<string, Expense[]>();
        finalFilteredExpenses.forEach(e => {
            const wk = e.weekStart || getWeekStartISO(new Date(e.date));
            if (!map.has(wk)) map.set(wk, []);
            map.get(wk)!.push(e);
        });
        return Array.from(map.entries()).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
    }, [finalFilteredExpenses]);

    const unpaidTotalsByShop = useMemo(() => {
        const totals = new Map<string, number>();
        finalFilteredExpenses.filter(e => !e.paid).forEach(exp => {
            const shop = exp.shop?.trim() || 'Unassigned';
            totals.set(shop, (totals.get(shop) || 0) + getExpenseTotal(exp));
        });
        return Array.from(totals.entries());
    }, [finalFilteredExpenses]);

    const renderBudgetEditModal = () => {
        if (!isEditingBudget) return null;
        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setIsEditingBudget(false)}>
                <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white">Update Main Budget</h3>
                        <button onClick={() => setIsEditingBudget(false)} className="text-white hover:bg-white/20 rounded-lg p-1"><X /></button>
                    </div>
                    <div className="p-6">
                        <label className="block text-sm font-bold text-black mb-2 uppercase tracking-wide">New Budget Amount (₹)</label>
                        <input type="number" step="0.01" value={newBudgetValue} onChange={(e) => setNewBudgetValue(e.target.value)} className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 text-2xl text-black font-bold focus:border-gray-600 outline-none" autoFocus />
                    </div>
                    <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                        <button onClick={() => setIsEditingBudget(false)} className="px-4 py-2 text-gray-700 font-semibold hover:bg-gray-200 rounded-lg">Cancel</button>
                        <button onClick={handleUpdateBudget} className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700">Save Changes</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-black">
            <ToastContainer position="top-right" theme="colored" />
            <div className="max-w-[1600px] mx-auto px-4 py-8">
                <div className="mb-8 mt-[5%] pt-6">
                    <h1 className="text-4xl font-extrabold text-black">Expense Dashboard</h1>
                    <p className="text-gray-600 font-medium mt-1">Monitoring all historical spending</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Main List */}
                    <div className="xl:col-span-2 space-y-6">
                        {expensesByWeek.map(([wk, wkExpenses]) => {
                            const isCurrent = wk === currentWeekStart;
                            const isExpanded = expandedWeeks.has(wk);
                            const total = wkExpenses.reduce((s, e) => s + getExpenseTotal(e), 0);
                            return (
                                <div key={wk} className={`bg-white rounded-xl shadow-lg border-2 ${isCurrent ? 'border-gray-100 shadow-gray-100' : 'border-gray-200'} overflow-hidden`}>
                                    <div className={`px-6 py-4 flex justify-between items-center ${isCurrent ? 'bg-gradient-to-r from-gray-50 to-purple-50' : 'bg-gray-50'} border-b-2 ${isCurrent ? 'border-gray-200' : 'border-gray-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <Calendar className={`w-5 h-5 ${isCurrent ? 'text-gray-600' : 'text-gray-600'}`} />
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900">Week of {wk}</h3>
                                                <p className={`text-sm font-bold ${isCurrent ? 'text-gray-600' : 'text-gray-600'}`}>₹{total.toLocaleString('en-IN')} total</p>
                                            </div>
                                        </div>
                                        <button onClick={() => toggleWeekExpanded(wk)} className={`p-2 rounded-lg border-2 ${isCurrent ? 'border-gray-300 hover:bg-gray-100' : 'border-gray-300 hover:bg-gray-100'} transition-colors`}>
                                            {isExpanded ? <ChevronUp className={isCurrent ? 'text-gray-600' : 'text-gray-600'} /> : <ChevronDown className={isCurrent ? 'text-indigo-600' : 'text-gray-600'} />}
                                        </button>
                                    </div>
                                    {isExpanded && (
                                        <div className="p-4 space-y-3">
                                            {wkExpenses.map(exp => (
                                                <div key={exp._id} className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50/30 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-3xl">{categoryIcons[exp.category] || '📦'}</span>
                                                        <div>
                                                            <div className="font-bold text-gray-900 text-lg">{exp.description}</div>
                                                            <div className="text-sm font-semibold text-gray-500 uppercase">{exp.shop} • {exp.date}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <div className="text-xl font-black text-gray-900">₹{getExpenseTotal(exp).toLocaleString('en-IN')}</div>
                                                            <span className={`text-[11px] font-black px-2 py-0.5 rounded-full border-2 uppercase ${exp.paid ? 'bg-emerald-50 text-emerald-700 border-emerald-500' : 'bg-rose-50 text-rose-700 border-rose-500'}`}>
                                                                {exp.paid ? 'Paid' : 'Unpaid'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Sidebar */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white">BUDGET STATUS</h3>
                                <button onClick={() => setIsEditingBudget(true)} className="text-sm font-bold bg-white text-indigo-600 px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors">EDIT</button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex justify-between items-end border-b-2 border-gray-100 pb-4">
                                    <span className="font-bold text-gray-600">Initial Budget</span>
                                    <span className="text-2xl font-black text-gray-900">₹{mainBudget.toLocaleString('en-IN')}</span>
                                </div>
                                <div className={`p-4 rounded-xl border-2 ${mainBudget - (expenses.filter(e => e.paid).reduce((s, e) => s + getExpenseTotal(e), 0)) < 0 ? 'bg-rose-50 border-rose-400' : 'bg-emerald-50 border-emerald-400'}`}>
                                    <p className="text-xs font-black text-gray-600 uppercase">Current Balance</p>
                                    <p className={`text-3xl font-black ${mainBudget - (expenses.filter(e => e.paid).reduce((s, e) => s + getExpenseTotal(e), 0)) < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                        ₹{(mainBudget - (expenses.filter(e => e.paid).reduce((s, e) => s + getExpenseTotal(e), 0))).toLocaleString('en-IN')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
                            <h4 className="font-black text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-tight text-sm"><Filter className="w-4 h-4 text-indigo-600" /> Filters & Controls</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-black text-gray-700 mb-2 block uppercase tracking-wide">SELECT PERIOD</label>
                                    <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)} className="w-full p-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-900 bg-white focus:border-gray-500 outline-none">
                                        <option value="all">Display All Weeks</option>
                                        <option value="this_week">Current Week</option>
                                        <option value="last_month">Last Month</option>
                                        <option value="last_3_months">Last 3 Months</option>
                                        <option value="last_6_months">Last 6 Months</option>
                                        <option value="last_year">Last Year</option>
                                        <option value="custom">Custom Range</option>
                                    </select>
                                </div>
                                
                                {dateFilter === 'custom' && (
                                    <div className="space-y-3 p-4 bg-indigo-50 rounded-lg border-2 border-gray-200">
                                        <div>
                                            <label className="text-xs font-black text-gray-700 mb-1 block uppercase">From Date</label>
                                            <input 
                                                type="date" 
                                                value={customStartDate} 
                                                onChange={(e) => setCustomStartDate(e.target.value)} 
                                                className="w-full p-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-900 focus:border-gray-500 outline-none" 
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-black text-gray-700 mb-1 block uppercase">To Date</label>
                                            <input 
                                                type="date" 
                                                value={customEndDate} 
                                                onChange={(e) => setCustomEndDate(e.target.value)} 
                                                className="w-full p-2.5 border-2 border-gray-300 rounded-lg font-semibold text-gray-900 focus:border-gray-500 outline-none" 
                                            />
                                        </div>
                                    </div>
                                )}
                                
                                <div>
                                    <label className="text-xs font-black text-gray-700 mb-2 block uppercase tracking-wide">SEARCH SHOP</label>
                                    <input value={shopFilter} onChange={(e) => setShopFilter(e.target.value)} placeholder="Enter shop name..." className="w-full p-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-900 focus:border-gray-500 outline-none" />
                                </div>
                                <button onClick={() => { fetchExpenses(); fetchInitialBudget(); }} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md">
                                    <RefreshCw className="w-4 h-4" /> REFRESH DATA
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {renderBudgetEditModal()}
        </div>
    );
};

export default ExpenseDashboard;