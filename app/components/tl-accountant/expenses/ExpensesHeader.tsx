// components/expenses/ExpensesHeader.tsx

import React from "react";

interface WalletStats {
  spent: number;
  pending: number;
  remaining: number;
}

interface ExpensesHeaderProps {
  initialAmount: number;
  isEditingInitialAmount: boolean;
  initialAmountInput: string;
  onInitialAmountInputChange: (value: string) => void;
  onStartEditInitialAmount: () => void;
  onCancelEditInitialAmount: () => void;
  onSaveInitialAmount: () => void;
  walletStats: WalletStats;
}

const ExpensesHeader: React.FC<ExpensesHeaderProps> = ({
  initialAmount,
  isEditingInitialAmount,
  initialAmountInput,
  onInitialAmountInputChange,
  onStartEditInitialAmount,
  onCancelEditInitialAmount,
  onSaveInitialAmount,
  walletStats,
}) => {
  return (
    <div className="grid gap-4 mt-10 md:grid-cols-4">
      <div className="border rounded-lg p-3 text-sm">
        <div className="font-semibold mb-1 flex justify-between items-center">
          Initial Amount
          {!isEditingInitialAmount && (
            <button
              onClick={onStartEditInitialAmount}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
          )}
        </div>
        {isEditingInitialAmount ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={initialAmountInput}
              onChange={(e) => onInitialAmountInputChange(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm outline-none w-2/3"
              placeholder="New Amount"
            />
            <button
              onClick={onSaveInitialAmount}
              className="bg-green-500 text-white px-2 py-1 rounded-md text-xs"
            >
              Save
            </button>
            <button
              onClick={onCancelEditInitialAmount}
              className="border px-2 py-1 rounded-md text-xs"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="text-lg font-bold">
            ₹{initialAmount.toLocaleString()}
          </div>
        )}
      </div>
      <div className="border rounded-lg p-3 text-sm">
        <div className="font-semibold mb-1">Total Spent</div>
        <div className="text-lg font-bold">
          ₹{walletStats.spent.toLocaleString()}
        </div>
      </div>
      <div className="border rounded-lg p-3 text-sm">
        <div className="font-semibold mb-1">Pending (Others)</div>
        <div className="text-lg font-bold">
          ₹{walletStats.pending.toLocaleString()}
        </div>
      </div>
      <div className="border rounded-lg p-3 text-sm">
        <div className="font-semibold mb-1">Remaining Balance</div>
        <div className="text-lg font-bold">
          ₹{walletStats.remaining.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default ExpensesHeader;
