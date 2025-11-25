// ExpenseList.tsx

import React from 'react';
import { Expense } from './interfaces';
import { getWeekStartISO } from './utils';

interface ExpenseListProps {
  expensesByWeek: [string, Expense[]][];
  currentWeekStart: string;
  isFilterActive: boolean;
  categoryIcons: Record<string, string>;
  getExpenseTotal: (e: Expense) => number;
  openWeekEditor: (wk: string) => void;
  setShowExpenseTotalId: (id: string | null) => void;
  openExpenseEditor: (exp: Expense) => void;
  setDeleteConfirm: (id: string | null) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({
  expensesByWeek, currentWeekStart, isFilterActive, categoryIcons,
  getExpenseTotal, openWeekEditor, setShowExpenseTotalId,
  openExpenseEditor, setDeleteConfirm
}) => {

  return (
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
                <div className="text-sm text-gray-700">
                  {wkExpenses.length} items • ₹ {weekTotal.toFixed(2)} 
                  {isFilterActive ? ` • ${wkExpenses.filter(e => e.paid).length} paid` : ''}
                  {!isFilterActive && unpaidCount > 0 ? ` • ${unpaidCount} unpaid` : ''}
                  {!isFilterActive && unpaidCount === 0 && wkExpenses.length > 0 && ` • All paid`}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isFilterActive && unpaidCount > 0 && <div className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">Pending</div>}
                {!isFilterActive && unpaidCount === 0 && wkExpenses.length > 0 && <div className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">Paid</div>}
                
                {isCurrentWeek && (
                  <button 
                      onClick={() => openWeekEditor(wk)} 
                      className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-900 text-sm font-medium transition-colors"
                  >
                      {isCurrentWeek ? 'Edit Week' : 'View/Edit'}
                  </button>
                )}
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
                    <div className={`font-bold ${exp.paid && isFilterActive ? 'text-emerald-600' : (!exp.paid ? 'text-rose-600' : 'text-gray-900')}`}>
                      ₹ {getExpenseTotal(exp).toFixed(2)}
                      {isFilterActive && <span className="text-xs ml-1">({exp.paid ? 'Paid' : 'Unpaid'})</span>}
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
      
      {expensesByWeek.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center text-gray-600">
              No expenses found matching the current filters.
          </div>
      )}
    </div>
  );
};

export default ExpenseList;