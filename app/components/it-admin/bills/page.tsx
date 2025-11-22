"use client";

import React, { useEffect, useState } from "react";

interface Bill {
  _id?: string;
  name: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  dateAdded: string;
  paidDate?: string | null;
}

type BillFormState = {
  name: string;
  amount: string;
  dueDate: string;
  paidDate: string;
};

const apiBase = "/api/bills";

const daysDiff = (date1: string, date2: string) => {
  const d1 = new Date(date1 + "T00:00:00");
  const d2 = new Date(date2 + "T00:00:00");
  const diffMs = d2.getTime() - d1.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const tens = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

const convertToWords = (num: number, currency: string): string => {
  if (num === 0) return "Zero " + currency;
  
  const numStr = Math.floor(num).toString().padStart(11, '0');
  let result = "";

  const n = parseInt(numStr.substring(0, 2), 10);
  if (n > 0) {
    if (n < 20) {
      result += ones[n] + " Crore ";
    } else {
      result += tens[Math.floor(n / 10)] + " " + ones[n % 10] + " Crore ";
    }
  }

  const l = parseInt(numStr.substring(2, 4), 10);
  if (l > 0) {
    if (l < 20) {
      result += ones[l] + " Lakh ";
    } else {
      result += tens[Math.floor(l / 10)] + " " + ones[l % 10] + " Lakh ";
    }
  }

  const th = parseInt(numStr.substring(4, 6), 10);
  if (th > 0) {
    if (th < 20) {
      result += ones[th] + " Thousand ";
    } else {
      result += tens[Math.floor(th / 10)] + " " + ones[th % 10] + " Thousand ";
    }
  }

  const h = parseInt(numStr.substring(6, 7), 10);
  if (h > 0) {
    result += ones[h] + " Hundred ";
  }

  const t = parseInt(numStr.substring(7, 9), 10);
  if (t > 0) {
    if (t < 20) {
      result += ones[t] + " ";
    } else {
      result += tens[Math.floor(t / 10)] + " " + ones[t % 10] + " ";
    }
  }

  result = result.trim();
  result += " " + currency;

  const fraction = Math.round((num - Math.floor(num)) * 100);
  if (fraction > 0) {
    let paisaWords = "";
    if (fraction < 20) {
      paisaWords = ones[fraction];
    } else {
      paisaWords = tens[Math.floor(fraction / 10)] + " " + ones[fraction % 10];
    }
    result += " and " + paisaWords.trim() + " Paisa";
  }

  return result.trim() + " Only";
};

const BillsTracker: React.FC = () => {
  const [bill, setBill] = useState<BillFormState>({
    name: "",
    amount: "",
    dueDate: "",
    paidDate: "",
  });

  const [billsList, setBillsList] = useState<Bill[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showOverview, setShowOverview] = useState<boolean>(false);

  // NEW: id of the bill currently being edited (null = creating new)
  const [editingId, setEditingId] = useState<string | null>(null);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getUpcomingBills = (): Bill[] => {
    const today = new Date().toISOString().split("T")[0];
    return billsList
      .filter((b) => !b.paid && b.dueDate >= today)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  };

  const totalPaid = billsList
    .filter((b) => b.paid)
    .reduce((sum, b) => sum + b.amount, 0);

  const totalPending = billsList
    .filter((b) => !b.paid)
    .reduce((sum, b) => sum + b.amount, 0);

  const upcomingBills = getUpcomingBills();

  const allowanceForYear = (() => {
    const year = new Date().getFullYear();
    return billsList
      .filter((b) => {
        const dt = new Date(b.dueDate + "T00:00:00");
        return dt.getFullYear() === year;
      })
      .reduce((sum, b) => sum + b.amount, 0);
  })();

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(apiBase, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data?.error || "Failed to fetch bills");
      }

      const normalized: Bill[] = (data.data as Bill[]).map((b) => ({
        ...b,
        // normalize empty string to null so UI can treat both the same
        paidDate: (b as any).paidDate === "" ? null : (b as any).paidDate ?? null,
      }));

      setBillsList(
        normalized.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      );
    } catch (err: any) {
      console.error("Failed to fetch bills", err);
      setError(err.message || "Failed to fetch bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const createBill = async () => {
    const amountNum = parseFloat(bill.amount);
    if (!bill.name.trim() || !bill.dueDate || isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid name, amount, and due date.");
      return;
    }

    // Determine paid status based on whether paidDate is provided
    const isPaid = !!bill.paidDate;

    const payload = {
      name: bill.name.trim(),
      amount: amountNum,
      dueDate: bill.dueDate,
      paid: isPaid,
      dateAdded: new Date().toLocaleDateString(),
      paidDate: bill.paidDate || null,
    };

    try {
      setSubmitting(true);
      setError(null);

      // If editingId is set, update instead of create
      if (editingId) {
        const res = await fetch(apiBase, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data?.error || "Failed to update bill");
        }
      } else {
        const res = await fetch(apiBase, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data?.error || "Failed to save bill");
        }
      }

      await fetchBills();
      // Reset form + editing state
      setBill({ name: "", amount: "", dueDate: "", paidDate: "" });
      setEditingId(null);
      setShowForm(false);
    } catch (err: any) {
      console.error("Failed to create/update bill", err);
      setError(err.message || "Failed to save bill");
      alert("Failed to save bill. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const togglePaid = async (id?: string) => {
    if (!id) return;
    try {
      const target = billsList.find((b) => b._id === id);
      if (!target) return;

      setError(null);
      const newPaidState = !target.paid;
      const payload: any = { id, paid: newPaidState };

      if (newPaidState) {
        payload.paidDate = target.paidDate || new Date().toISOString().split("T")[0];
      } else {
        payload.paidDate = null;
      }

      const res = await fetch(apiBase, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data?.error || "Failed to update bill");
      }

      await fetchBills();
    } catch (err: any) {
      console.error("Failed to toggle paid", err);
      setError(err.message || "Failed to update bill");
      alert("Failed to update bill. Please try again.");
    }
  };

  const deleteBill = async (id?: string) => {
    if (!id) return;
    const confirmDelete = confirm("Are you sure you want to delete this bill?");
    if (!confirmDelete) return;

    try {
      setError(null);
      const res = await fetch(`${apiBase}?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data?.error || "Failed to delete bill");
      }

      await fetchBills();
      if (selectedBill?._id === id) {
        setSelectedBill(null);
        setShowModal(false);
      }

      // If we deleted the bill we're editing, clear edit state
      if (editingId === id) {
        setEditingId(null);
        setBill({ name: "", amount: "", dueDate: "", paidDate: "" });
        setShowForm(false);
      }
    } catch (err: any) {
      console.error("Failed to delete bill", err);
      setError(err.message || "Failed to delete bill");
      alert("Failed to delete bill. Please try again.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBill((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createBill();
  };

  const openModal = (b: Bill) => {
    setSelectedBill(b);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedBill(null);
    setShowModal(false);
  };

  const modalDetails = (b: Bill | null) => {
    if (!b) return null;
    const today = new Date().toISOString().split("T")[0];
    const due = b.dueDate;
    const paidDate = b.paidDate ?? null;

    const daysUntilDue = daysDiff(today, due);
    const daysToDueFromToday = daysUntilDue;

    let daysOverdue = 0;
    if (!b.paid) {
      if (daysToDueFromToday < 0) {
        daysOverdue = Math.abs(daysToDueFromToday);
      } else {
        daysOverdue = 0;
      }
    } else {
      if (paidDate) {
        const diff = daysDiff(due, paidDate);
        daysOverdue = diff;
      } else {
        daysOverdue = 0;
      }
    }

    return {
      today,
      due,
      paidDate,
      daysToDueFromToday,
      daysOverdue,
    };
  };

  const details = modalDetails(selectedBill);

  // NEW: start editing a bill (prefill form)
  const startEditing = (b: Bill) => {
    setEditingId(b._id ?? null);
    setBill({
      name: b.name,
      amount: b.amount.toString(),
      dueDate: b.dueDate,
      paidDate: b.paidDate ?? "",
    });
    setShowForm(true);
    // close modal if open
    setShowModal(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setBill({ name: "", amount: "", dueDate: "", paidDate: "" });
    setShowForm(false);
  };

  return (
    // MAIN: white background for entire page per request
    <div className="min-h-screen bg-white p-6 flex items-center justify-center">
      <div className="max-w-7xl mx-auto w-full">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Bill Tracker</h1>
            <p className="text-gray-600">Manage and track your bills effortlessly</p>
          </div>
          <button
            onClick={() => setShowOverview((s) => !s)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg"
            type="button"
          >
            {showOverview ? "Hide Overview" : "Show Overview"}
          </button>
        </div>

        {loading && <p className="mb-4 text-sm text-gray-600">Loading bills...</p>}
        {error && <p className="mb-4 text-sm text-red-600">⚠️ {error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📅</span> Upcoming Bills
            </h2>
            {upcomingBills.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-auto pr-2">
                {upcomingBills.map((b) => (
                  <div key={b._id} className="p-4 bg-white rounded-lg border border-blue-100">
                    <p className="font-semibold text-gray-900">{b.name}</p>
                    <p className="text-sm text-gray-700 mt-1">{formatCurrency(b.amount)}</p>
                    <p className="text-xs text-gray-600 mt-1">Due: {b.dueDate}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No upcoming bills found.</p>
            )}
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 bg-white border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">All Bills ({billsList.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Bill Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Due Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billsList.map((b) => (
                    <tr
                      key={b._id}
                      className={`${b.paid ? "bg-green-50" : "hover:bg-gray-50"} cursor-pointer transition`}
                      onClick={() => openModal(b)}
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{b.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatCurrency(b.amount)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{b.dueDate}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${b.paid ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                          {b.paid ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => togglePaid(b._id)}
                          className={`py-2 px-4 rounded-lg text-xs font-bold text-white transition ${b.paid ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"}`}
                          type="button"
                        >
                          {b.paid ? "Pending" : "Paid"}
                        </button>

                        {/* EDIT button */}
                        <button
                          onClick={() => startEditing(b)}
                          className="py-2 px-4 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition"
                          type="button"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteBill(b._id)}
                          className="py-2 px-4 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition"
                          type="button"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {billsList.length === 0 && !loading && (
                <p className="text-center py-8 text-gray-500">No bills added yet.</p>
              )}
            </div>
          </div>
        </div>

        {showOverview && (
          <div className="mb-8 p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Financial Overview - Current Year</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-xl border border-gray-100">
                <p className="text-sm text-blue-700 font-medium mb-2">Total Allowance This Year</p>
                <p className="text-3xl font-bold text-blue-900">{formatCurrency(allowanceForYear)}</p>
                <p className="text-xs text-blue-600 mt-1">{convertToWords(allowanceForYear, "Rupees")}</p>
              </div>

              <div className="p-6 bg-white rounded-xl border border-gray-100">
                <p className="text-sm text-green-700 font-medium mb-2">Total Amount Paid</p>
                <p className="text-3xl font-bold text-green-900">{formatCurrency(totalPaid)}</p>
                <p className="text-xs text-green-600 mt-1">{convertToWords(totalPaid, "Rupees")}</p>
              </div>

              <div className="p-6 bg-white rounded-xl border border-gray-100">
                <p className="text-sm text-orange-700 font-medium mb-2">Total Amount Pending</p>
                <p className="text-3xl font-bold text-orange-900">{formatCurrency(totalPending)}</p>
                <p className="text-xs text-orange-600 mt-1">{convertToWords(totalPending, "Rupees")}</p>
              </div>
            </div>
          </div>
        )}

        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={() => {
              // If currently editing, open the form (it already is). If not editing, clear form for new create.
              if (!showForm) {
                setBill({ name: "", amount: "", dueDate: "", paidDate: "" });
                setEditingId(null);
              }
              setShowForm((prev) => !prev);
            }}
            className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl text-3xl font-bold flex items-center justify-center hover:from-blue-700 hover:to-indigo-700 transition transform hover:scale-110"
            type="button"
          >
            {showForm ? "−" : "+"}
          </button>
        </div>

        {showForm && (
          <div className="mt-8 p-8 bg-white rounded-2xl shadow-lg border-2 border-dashed border-indigo-300">
            <h3 className="text-2xl font-bold mb-6 text-indigo-900">{editingId ? "Edit Bill" : "Add New Bill"}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Bill Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={bill.name}
                  onChange={handleChange}
                  placeholder="e.g., Rent, Electricity, Credit Card"
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={bill.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    min="0.01"
                    step="0.01"
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={bill.dueDate}
                    onChange={handleChange}
                    required
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>
                <div>
                  <label htmlFor="paidDate" className="block text-sm font-semibold text-gray-700 mb-2">Paid On Date (Optional)</label>
                  <input
                    type="date"
                    id="paidDate"
                    name="paidDate"
                    value={bill.paidDate}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">If set, bill is marked as Paid.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-6 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Saving..." : editingId ? "Save Changes" : "Save Bill"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="py-3 px-6 rounded-lg border-2 border-gray-300 font-bold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      {showModal && selectedBill && (
        // overlay uses a light white translucent backdrop (requested white bg for popup area)
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-white bg-opacity-80 p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 relative">
            <button
              onClick={closeModal}
              className="absolute right-6 top-6 text-gray-400 hover:text-gray-700 text-2xl"
              aria-label="Close"
            >
              ✕
            </button>

            <h3 className="text-3xl font-bold mb-4 text-gray-900">{selectedBill.name}</h3>
            <p className="text-lg text-gray-700 mb-6">Amount: <span className="font-bold text-indigo-600">{formatCurrency(selectedBill.amount)}</span></p>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">Due Date</p>
                <p className="font-semibold text-gray-900">{selectedBill.dueDate}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <p className="font-semibold text-gray-900">{selectedBill.paid ? "Paid" : "Pending"}</p>
              </div>

              <div className="p-4 bg-white rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">Paid Date</p>
                {/* FIX: show a proper fallback when paidDate is null/empty */}
                <p className="font-semibold text-gray-900">{selectedBill.paidDate && selectedBill.paidDate !== "" ? selectedBill.paidDate : "—"}</p>
              </div>

              <div className="p-4 bg-white rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">Date Added</p>
                <p className="font-semibold text-gray-900">{selectedBill.dateAdded}</p>
              </div>
            </div>

            {details && (
              <div className="mb-6 p-4 bg-white rounded-lg border">
                {!selectedBill.paid ? (
                  <>
                    {details.daysToDueFromToday > 0 && (
                      <p className="text-gray-700"><span className="font-bold text-blue-700">{details.daysToDueFromToday}</span> day(s) left until due.</p>
                    )}
                    {details.daysToDueFromToday === 0 && <p className="font-bold text-orange-700">Due today.</p>}
                    {details.daysToDueFromToday < 0 && (
                      <p className="text-red-700"><span className="font-bold">{Math.abs(details.daysToDueFromToday)}</span> day(s) overdue.</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-gray-700 mb-2">
                      {selectedBill.paidDate
                        ? `Paid on ${selectedBill.paidDate}.`
                        : "Payment recorded (paid) — date not available (Paid Date was null in DB)."}
                    </p>

                    {typeof details.daysOverdue === "number" && selectedBill.paidDate && (
                      <p className="text-gray-700">
                        {details.daysOverdue > 0 && <span className="text-red-700 font-bold">{details.daysOverdue}</span>}
                        {details.daysOverdue === 0 && <span className="font-bold text-green-700">Paid on due date.</span>}
                        {details.daysOverdue < 0 && <span className="text-green-700 font-bold">{Math.abs(details.daysOverdue)}</span>}
                        {details.daysOverdue > 0 && " day(s) late."}
                        {details.daysOverdue < 0 && " day(s) early."}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => {
                  togglePaid(selectedBill._id);
                  closeModal();
                }}
                className={`flex-1 py-3 rounded-lg text-white font-bold transition ${selectedBill.paid ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"}`}
                type="button"
              >
                {selectedBill.paid ? "Mark Pending" : "Mark Paid"}
              </button>

              <button
                onClick={() => {
                  // Start editing this bill directly from modal
                  startEditing(selectedBill);
                }}
                className="flex-1 py-3 rounded-lg text-white font-bold bg-indigo-600 hover:bg-indigo-700 transition"
                type="button"
              >
                Edit
              </button>

              <button
                onClick={() => {
                  deleteBill(selectedBill._id);
                }}
                className="flex-1 py-3 rounded-lg text-white font-bold bg-red-600 hover:bg-red-700 transition"
                type="button"
              >
                Delete
              </button>

              <button
                onClick={closeModal}
                className="px-6 py-3 rounded-lg border-2 border-gray-300 font-bold hover:bg-gray-50 transition"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Page: React.FC = () => {
  return (
    <div className="bg-white">
      <BillsTracker />
    </div>
  );
};

export default Page;
