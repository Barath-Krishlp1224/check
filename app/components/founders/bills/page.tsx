"use client";

import React, { useEffect, useState } from "react";
import { Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface Bill {
  _id?: string;
  name: string;
  amount: number;
  dueDate: string;
  paid?: boolean;
  dateAdded?: string;
  paidDate?: string | null;
}

const apiBase = "/api/bills";

const Bills: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>("all");

  useEffect(() => {
    let mounted = true;
    const fetchBills = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(apiBase, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data?.error || "Failed to fetch bills");
        }
        const normalized: Bill[] = (data.data || []).map((b: any) => ({
          ...b,
          paidDate: b.paidDate === "" ? null : b.paidDate ?? null,
        }));
        if (mounted) setBills(normalized);
      } catch (err: any) {
        if (mounted) setError(err?.message ?? "Failed to load bills");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchBills();
    return () => {
      mounted = false;
    };
  }, []);

  const formatCurrency = (amount: number | undefined) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount ?? 0).replace("₹", "₹");

  const formatDate = (d: string | null | undefined) => {
    if (!d) return "—";
    if (/^\d{4}-\d{2}-\d{2}₹/.test(d)) return d;
    const parsed = Date.parse(d);
    if (isNaN(parsed)) return d;
    return new Date(parsed).toISOString().split("T")[0];
  };

  const isOverdue = (dueDate: string, paid?: boolean) => {
    if (paid) return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  const filterBillsByDate = (billsList: Bill[]) => {
    if (dateFilter === "all") return billsList;
    
    const today = new Date();
    const cutoffDate = new Date();
    
    switch (dateFilter) {
      case "3months":
        cutoffDate.setMonth(today.getMonth() - 3);
        break;
      case "6months":
        cutoffDate.setMonth(today.getMonth() - 6);
        break;
      case "1year":
        cutoffDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        return billsList;
    }
    
    return billsList.filter(bill => {
      const billDate = new Date(bill.dueDate);
      return billDate >= cutoffDate && billDate <= today;
    });
  };

  const filteredBills = filterBillsByDate(bills);
  const totalAmount = filteredBills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
  const paidAmount = filteredBills.filter(b => b.paid).reduce((sum, bill) => sum + (bill.amount || 0), 0);
  const unpaidAmount = totalAmount - paidAmount;
  const overdueBills = filteredBills.filter(b => isOverdue(b.dueDate, b.paid));

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-7xl w-full">
        <div className="mb-8">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Bills Manager</h1>
                <p className="text-gray-600">Track and manage all your bills in one place</p>
              </div>
              
              <div className="flex items-center gap-3">
                <label htmlFor="dateFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Filter by:
                </label>
                <select
                  id="dateFilter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium shadow-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer min-w-[180px]"
                >
                  <option value="all">All Time</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="1year">Last Year</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shaow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bills</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{filteredBills.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(paidAmount)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">{formatCurrency(unpaidAmount)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {overdueBills.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Overdue Bills</h3>
              <p className="text-sm text-red-700 mt-1">
                You have {overdueBills.length} overdue {overdueBills.length === 1 ? 'bill' : 'bills'} that need attention.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading bills...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Bills</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && filteredBills.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bills Found</h3>
            <p className="text-gray-600">
              {dateFilter === "all" 
                ? "You don't have any bills yet. Add your first bill to get started."
                : "No bills found for the selected time period. Try a different filter."}
            </p>
          </div>
        )}

        {!loading && !error && filteredBills.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Bill Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Paid Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBills.map((b) => {
                    const overdue = isOverdue(b.dueDate, b.paid);
                    return (
                      <tr 
                        key={b._id ?? Math.random()} 
                        className={`hover:bg-gray-50 transition-colors ${overdue ? 'bg-red-50' : ''}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {b.paid ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Paid
                            </span>
                          ) : overdue ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Overdue
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <XCircle className="w-3.5 h-3.5" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{b.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">{formatCurrency(b.amount)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{formatDate(b.dueDate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {b.paidDate ? formatDate(b.paidDate) : <span className="text-gray-400">—</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bills;