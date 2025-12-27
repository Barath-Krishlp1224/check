// components/ExpensesContent.tsx
import React from "react";

const ExpensesContent: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[80vh] bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      {/* We use calc(100vh - 160px) to account for padding/margins 
          so the scrollbar belongs to the iframe, not the whole page.
      */}
      <iframe
        src="https://lp-expenses.vercel.app/"
        title="Expenses Management"
        className="w-full h-[calc(100vh-120px)] border-none"
        allow="clipboard-write; geolocation"
      />
    </div>
  );
};

export default ExpensesContent;