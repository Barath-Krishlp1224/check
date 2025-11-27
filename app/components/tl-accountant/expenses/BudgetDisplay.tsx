import React from 'react';
import { Expense } from './interfaces';

interface BudgetDisplayProps {
  mainBudget: number;
  openBudgetEditor: () => void;
  paidExpenses: Expense[];
  getExpenseTotal: (e: Expense) => number;
}

const BudgetDisplay: React.FC<BudgetDisplayProps> = ({
  mainBudget, openBudgetEditor, paidExpenses, getExpenseTotal
}) => {

  const totalPaid = paidExpenses.reduce((sum, e) => sum + getExpenseTotal(e), 0);
  const remainingBalance = mainBudget - totalPaid;
  const isOverBudget = remainingBalance < 0;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-900">Overall Budget Status</h3>
        <button
          onClick={openBudgetEditor}
          className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-200 transition-colors"
        >
          Edit Budget
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 rounded-lg border border-gray-200 bg-gray-50">
          <div className="font-medium text-lg text-gray-700">Initial Budget</div>
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

export default BudgetDisplay;