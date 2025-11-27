import React from 'react';

interface NewExpenseFormProps {
  shop: string;
  setShop: (shop: string) => void;
  description: string;
  setDescription: (description: string) => void;
  amount: number | '';
  setAmount: (amount: number | '') => void;
  category: string;
  setCategory: (category: string) => void;
  date: string;
  setDate: (date: string) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
}

const NewExpenseForm: React.FC<NewExpenseFormProps> = ({
  shop, setShop, description, setDescription, amount, setAmount,
  category, setCategory, date, setDate, handleSubmit
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">New Expense</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={shop} onChange={(e) => setShop(e.target.value)} placeholder="Shop" className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
          <input type="number" value={amount as any} onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="Amount" className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600" min="0.01" step="0.01" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600">
            <option value="">Choose Category</option>
            <option>Food</option>
            <option>Transport</option>
            <option>Utilities</option>
            <option>Entertainment</option>
            <option>Other</option>
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
          <button type="submit" className="px-6 py-2.5 bg-indigo-700 text-white rounded-lg font-semibold hover:bg-indigo-600 transition-colors">Add Expense</button>
        </div>
      </form>
    </div>
  );
};

export default NewExpenseForm;