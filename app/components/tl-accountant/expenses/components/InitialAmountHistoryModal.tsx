// ./components/InitialAmountHistoryModal.tsx

import React from "react";
import { InitialAmountHistoryEntry, formatDate } from "./types"; // Assuming formatDate and InitialAmountHistoryEntry are exported from types

interface InitialAmountHistoryModalProps {
  history: InitialAmountHistoryEntry[];
  onClose: () => void;
}

const InitialAmountHistoryModal: React.FC<InitialAmountHistoryModalProps> = ({
  history,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h3 className="text-2xl font-black text-gray-900">
            Initial Budget History
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          This log shows all changes made to the initial budget amount.
        </p>
        <div className="space-y-3">
          {history.length === 0 ? (
            <p className="text-center text-gray-500 pt-4">No history found.</p>
          ) : (
            history.map((entry, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-4 rounded-xl ${
                  index === 0
                    ? "bg-blue-50 border-2 border-blue-300 shadow-md"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <div>
                  <div
                    className={`font-bold ${
                      index === 0 ? "text-blue-700 text-lg" : "text-gray-900"
                    }`}
                  >
                    ₹{entry.amount.toLocaleString()}
                    {index === 0 && (
                      <span className="ml-2 text-xs font-normal text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 font-medium">
                    {formatDate(entry.date)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(entry.date).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default InitialAmountHistoryModal;