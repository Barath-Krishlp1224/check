// components/expenses/ExpensesContent.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Employee,
  Expense,
  Role,
  Subtask,
} from "./types";
import {
  getWeekStart,
  isExpensePaid,
  INITIAL_AMOUNT_CONSTANT,
} from "./utils";
import ExpensesHeader from "./ExpensesHeader";
import ExpenseForm from "./ExpenseForm";
import ExpensesFilters from "./ExpensesFilters";
import ExpensesTable from "./ExpensesTable";
import ExpensesHistory from "./ExpensesHistory";

const ExpensesContent: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  const [initialAmount, setInitialAmount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const storedAmount = localStorage.getItem("initialWalletAmount");
      return storedAmount ? Number(storedAmount) : INITIAL_AMOUNT_CONSTANT;
    }
    return INITIAL_AMOUNT_CONSTANT;
  });
  const [isEditingInitialAmount, setIsEditingInitialAmount] = useState(false);
  const [initialAmountInput, setInitialAmountInput] = useState(
    initialAmount.toString()
  );

  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [role, setRole] = useState<Role>("founder");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Sub expense controls (for currently expanded row)
  const [subTitle, setSubTitle] = useState("");
  const [subAmount, setSubAmount] = useState("");
  const [subDate, setSubDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [subRole, setSubRole] = useState<Role>("founder");
  const [subEmployeeId, setSubEmployeeId] = useState("");

  const [filterRole, setFilterRole] = useState<"all" | Role>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">(
    "all"
  );
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const [showHistory, setShowHistory] = useState(false);
  const [historyEmployeeId, setHistoryEmployeeId] = useState<string>("");

  // Fetch expenses
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/expenses");
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to fetch");

        setExpenses(
          (json.data || []).map((e: any) => {
            const paid = typeof e.paid === "boolean" ? e.paid : false;
            const subtasks: Subtask[] = Array.isArray(e.subtasks)
              ? e.subtasks
              : [];
            return {
              ...e,
              paid,
              subtasks,
            } as Expense;
          })
        );
      } catch (err: any) {
        setError(err.message || "Failed to load expenses");
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setEmployeesLoading(true);
        const res = await fetch("/api/employees");
        const data = await res.json();
        const arr: Employee[] = Array.isArray(data)
          ? data
          : data.employees || [];
        setEmployees(arr);
      } catch {
      } finally {
        setEmployeesLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const handleUpdateInitialAmount = () => {
    const newAmount = Number(initialAmountInput);
    if (!Number.isNaN(newAmount) && newAmount >= 0) {
      setInitialAmount(newAmount);
      if (typeof window !== "undefined") {
        localStorage.setItem("initialWalletAmount", newAmount.toString());
      }
      setIsEditingInitialAmount(false);
    } else {
      alert("Please enter a valid amount.");
    }
  };

  const walletStats = useMemo(() => {
    let spent = 0;
    let pending = 0;

    expenses.forEach((e) => {
      const base = e.amount;
      const subsTotal = (e.subtasks || []).reduce(
        (sum, s) => sum + (s.amount || 0),
        0
      );
      const full = base + subsTotal;

      const paid = isExpensePaid(e);

      if (paid) {
        spent += full;
      } else {
        pending += full;
      }
    });

    const remaining = initialAmount - spent;
    return { spent, pending, remaining };
  }, [expenses, initialAmount]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const paid = isExpensePaid(e);

      if (filterRole !== "all" && e.role !== filterRole) return false;

      if (filterStatus === "paid" && !paid) return false;
      if (filterStatus === "unpaid" && paid) return false;

      if (
        filterEmployee !== "all" &&
        filterEmployee &&
        e.employeeId !== filterEmployee
      )
        return false;

      if (filterFrom && e.date < filterFrom) return false;
      if (filterTo && e.date > filterTo) return false;

      if (filterSearch) {
        const s = filterSearch.toLowerCase();
        if (
          !(
            e.description.toLowerCase().includes(s) ||
            (e.shop || "").toLowerCase().includes(s)
          )
        )
          return false;
      }

      return true;
    });
  }, [
    expenses,
    filterRole,
    filterStatus,
    filterEmployee,
    filterFrom,
    filterTo,
    filterSearch,
  ]);

  const filterEmployeeTotal = useMemo(() => {
    if (filterEmployee === "all" || !filterEmployee) return 0;

    return expenses.reduce((sum, e) => {
      if (e.employeeId !== filterEmployee || !isExpensePaid(e)) return sum;
      const base = e.amount;
      const subs = (e.subtasks || []).reduce(
        (s, sub) => s + (sub.amount || 0),
        0
      );
      return sum + base + subs;
    }, 0);
  }, [filterEmployee, expenses]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || !category.trim() || !date) {
      alert("Description, category, amount, date required");
      return;
    }

    if (role === "manager" && !selectedEmployeeId) {
      alert("Select employee for Manager role");
      return;
    }

    const payload = {
      description: description.trim(),
      amount: Number(amount),
      category: category.trim(),
      date,
      weekStart: getWeekStart(date),
      shop: shopName.trim(),
      role,
      employeeId: selectedEmployeeId || undefined,
      employeeName:
        selectedEmployeeId &&
        employees.find((e) => e._id === selectedEmployeeId)?.name,
      subtasks: [],
    };

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.error || "Failed to add expense");
        return;
      }

      const created: Expense = {
        ...json.data,
        paid: typeof json.data.paid === "boolean" ? json.data.paid : false,
        subtasks: Array.isArray(json.data.subtasks)
          ? json.data.subtasks
          : [],
      };

      setExpenses((prev) => [created, ...prev]);
      setShopName("");
      setDescription("");
      setCategory("General");
      setAmount("");
      setDate(new Date().toISOString().slice(0, 10));
      setRole("founder");
      setSelectedEmployeeId("");
    } catch (err: any) {
      alert(err.message || "Failed");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setSubTitle("");
    setSubAmount("");
    setSubDate(new Date().toISOString().slice(0, 10));
    setSubRole("founder");
    setSubEmployeeId("");
  };

  const handleAddSubtask = async (
    e: React.FormEvent,
    parent: Expense
  ) => {
    e.preventDefault();
    if (!expandedId) return;
    if (!subTitle.trim() || !subAmount) {
      alert("Sub description and amount required");
      return;
    }

    if (subRole === "manager" && !subEmployeeId) {
      alert("Select employee for Manager");
      return;
    }

    const newSub: Subtask = {
      id: Math.random().toString(36).slice(2, 9),
      title: subTitle.trim(),
      done: subRole === "founder" || isExpensePaid(parent),
      amount: Number(subAmount),
      date: subDate,
      role: subRole,
      employeeId: subEmployeeId || undefined,
      employeeName:
        subEmployeeId &&
        employees.find((e) => e._id === subEmployeeId)?.name,
    };

    const updatedSubtasks = [newSub, ...(parent.subtasks || [])];

    try {
      const res = await fetch("/api/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: parent._id,
          updates: {
            subtasks: updatedSubtasks,
            paid: false,
          },
        }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.error || "Failed to add sub expense");
        return;
      }

      setExpenses((prev) =>
        prev.map((exp) =>
          exp._id === parent._id
            ? {
                ...exp,
                subtasks: updatedSubtasks,
                paid: false,
              }
            : exp
        )
      );
      setSubTitle("");
      setSubAmount("");
      setSubDate(new Date().toISOString().slice(0, 10));
      setSubRole("founder");
      setSubEmployeeId("");
    } catch (err: any) {
      alert(err.message || "Failed");
    }
  };

  const handleUpdateSubtaskStatus = async (
    parentExp: Expense,
    subtaskId: string,
    isDone: boolean
  ) => {
    const updatedSubtasks = (parentExp.subtasks || []).map((sub) =>
      sub.id === subtaskId ? { ...sub, done: isDone } : sub
    );

    try {
      const res = await fetch("/api/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: parentExp._id,
          updates: {
            subtasks: updatedSubtasks,
          },
        }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.error || "Failed to update subtask status");
        return;
      }

      setExpenses((prev) =>
        prev.map((exp) =>
          exp._id === parentExp._id
            ? { ...exp, subtasks: updatedSubtasks }
            : exp
        )
      );
    } catch (err: any) {
      alert(err.message || "Failed");
    }
  };

  const handleUpdatePaidStatus = async (exp: Expense, isPaid: boolean) => {
    const updatedSubtasks = (exp.subtasks || []).map((sub) => ({
      ...sub,
      done: isPaid,
    }));

    const updates = {
      paid: isPaid,
      subtasks: updatedSubtasks,
    };

    try {
      const res = await fetch("/api/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: exp._id,
          updates,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.error || "Failed to update status");
        return;
      }

      const updatedExpense: Expense = {
        ...exp,
        paid: isPaid,
        subtasks: updatedSubtasks,
      };

      setExpenses((prev) =>
        prev.map((e) => (e._id === exp._id ? updatedExpense : e))
      );
    } catch (err: any) {
      alert(err.message || "Failed");
    }
  };

  const historyExpenses = useMemo(
    () =>
      expenses
        .filter((e) => isExpensePaid(e))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [expenses]
  );

  const employeeHistory = useMemo(() => {
    if (!historyEmployeeId) return [];
    return historyExpenses.filter((e) => e.employeeId === historyEmployeeId);
  }, [historyEmployeeId, historyExpenses]);

  const employeeHistoryTotal = useMemo(
    () =>
      employeeHistory.reduce((sum, e) => {
        const base = e.amount;
        const subs = (e.subtasks || []).reduce(
          (s, sub) => s + (sub.amount || 0),
          0
        );
        return sum + base + subs;
      }, 0),
    [employeeHistory]
  );

  return (
    <div className="space-y-6 p-4 text-black [&_*]:text-black">
      <ExpensesHeader
        initialAmount={initialAmount}
        isEditingInitialAmount={isEditingInitialAmount}
        initialAmountInput={initialAmountInput}
        onInitialAmountInputChange={setInitialAmountInput}
        onStartEditInitialAmount={() => {
          setIsEditingInitialAmount(true);
          setInitialAmountInput(initialAmount.toString());
        }}
        onCancelEditInitialAmount={() => {
          setIsEditingInitialAmount(false);
          setInitialAmountInput(initialAmount.toString());
        }}
        onSaveInitialAmount={handleUpdateInitialAmount}
        walletStats={walletStats}
      />

      <ExpenseForm
        shopName={shopName}
        setShopName={setShopName}
        category={category}
        setCategory={setCategory}
        date={date}
        setDate={setDate}
        description={description}
        setDescription={setDescription}
        amount={amount}
        setAmount={setAmount}
        role={role}
        setRole={setRole}
        selectedEmployeeId={selectedEmployeeId}
        setSelectedEmployeeId={setSelectedEmployeeId}
        employees={employees}
        onSubmit={handleAddExpense}
      />

      <ExpensesFilters
        filterRole={filterRole}
        setFilterRole={setFilterRole}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterEmployee={filterEmployee}
        setFilterEmployee={setFilterEmployee}
        filterFrom={filterFrom}
        setFilterFrom={setFilterFrom}
        filterTo={filterTo}
        setFilterTo={setFilterTo}
        filterSearch={filterSearch}
        setFilterSearch={setFilterSearch}
        filterEmployeeTotal={filterEmployeeTotal}
        employees={employees}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
      />

      <ExpensesTable
        loading={loading}
        error={error}
        filteredExpenses={filteredExpenses}
        expenses={expenses}
        expandedId={expandedId}
        onToggleExpand={toggleExpand}
        employees={employees}
        subTitle={subTitle}
        setSubTitle={setSubTitle}
        subAmount={subAmount}
        setSubAmount={setSubAmount}
        subDate={subDate}
        setSubDate={setSubDate}
        subRole={subRole}
        setSubRole={setSubRole}
        subEmployeeId={subEmployeeId}
        setSubEmployeeId={setSubEmployeeId}
        onAddSubtask={handleAddSubtask}
        onUpdateSubtaskStatus={handleUpdateSubtaskStatus}
        onUpdatePaidStatus={handleUpdatePaidStatus}
      />

      <ExpensesHistory
        showHistory={showHistory}
        employees={employees}
        historyEmployeeId={historyEmployeeId}
        setHistoryEmployeeId={setHistoryEmployeeId}
        historyExpenses={historyExpenses}
        employeeHistory={employeeHistory}
        employeeHistoryTotal={employeeHistoryTotal}
      />
    </div>
  );
};

export default ExpensesContent;
