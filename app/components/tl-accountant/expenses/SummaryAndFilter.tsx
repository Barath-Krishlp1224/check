import React from 'react';
import { Expense, DateFilter } from './interfaces';
import { downloadCSV } from './utils';

interface SummaryAndFilterProps {
  unpaidTotalsByShop: { shop: string; total: number }[];
  finalFilteredExpenses: Expense[];
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;
  shopFilter: string;
  setShopFilter: (shop: string) => void;
  fetchExpenses: () => Promise<void>;
  isFilterActive: boolean;
  getExpenseTotal: (e: Expense) => number;
}

const SummaryAndFilter: React.FC<SummaryAndFilterProps> = ({
  unpaidTotalsByShop, finalFilteredExpenses, dateFilter, setDateFilter,
  customStartDate, setCustomStartDate, customEndDate, setCustomEndDate,
  shopFilter, setShopFilter, fetchExpenses, isFilterActive, getExpenseTotal
}) => {
    
  const grandTotal = finalFilteredExpenses.reduce((s, e) => s + (e.paid && isFilterActive ? 0 : getExpenseTotal(e)), 0);

  return (
    <div className="xl:col-span-1 space-y-4">
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
          <button onClick={() => downloadCSV(finalFilteredExpenses, `expense_report_${dateFilter || 'all'}_${shopFilter || 'all'}.csv`)} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-200 transition-colors flex-1">Export</button>
          <button onClick={fetchExpenses} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-semibold hover:bg-indigo-200 transition-colors flex-1">Refresh</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-lg">
        <h4 className="font-bold mb-3 text-gray-900">Filters</h4>
        <select value={dateFilter} onChange={(e) => { setDateFilter(e.target.value as DateFilter); if (e.target.value !== 'custom') { setCustomStartDate(''); setCustomEndDate(''); } }} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 mb-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600">
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
    </div>
  );
};

export default SummaryAndFilter;