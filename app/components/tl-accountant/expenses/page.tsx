// page.tsx (or ExpensesContent.tsx)
"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  type Role,
  type Employee,
  type Subtask,
  type Expense,
  type InitialAmountHistoryEntry,
  INITIAL_AMOUNT_CONSTANT,
  getWeekStart,
  isExpensePaid,
  formatDate,
} from "./components/types";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ExpenseForm from "./components/ExpenseForm";
import SubExpensesSection from "./components/SubExpensesSection";
import EditExpenseModal from "./components/EditExpenseModal";
import EditSubtaskModal from "./components/EditSubtaskModal";

const ROWS_PER_PAGE = 10;
const INITIAL_ROWS = 5;

const convertToCSV = (data: Expense[], employees: Employee[]) => {
  const employeeMap = employees.reduce((map, emp) => {
    map.set(emp._id, emp.name);
    return map;
  }, new Map<string, string>());

  const headers = [
    "Date",
    "Shop/Vendor",
    "Description",
    "Role",
    "Employee",
    "Amount (Base)",
    "Sub Expenses Total",
    "Total Expense",
    "Status",
  ];

  let grandTotalAmountBase = 0;
  let grandTotalSubExpenses = 0;
  let grandTotalExpense = 0;

  const detailRows = data.map((exp) => {
    const subsTotal = (exp.subtasks || []).reduce(
      (s, sub) => s + (sub.amount || 0),
      0
    );
    const total = exp.amount + subsTotal;
    const paid = isExpensePaid(exp) ? "Done" : "Pending";
    const employeeName = exp.employeeId
      ? employeeMap.get(exp.employeeId) || exp.employeeName || "-"
      : "-";

    grandTotalAmountBase += exp.amount;
    grandTotalSubExpenses += subsTotal;
    grandTotalExpense += total;

    const mainRow = [
      formatDate(exp.date),
      (exp.shop || "-").replace(/,/g, ""),
      exp.description.replace(/,/g, ""),
      exp.role,
      employeeName.replace(/,/g, ""),
      exp.amount.toFixed(2),
      subsTotal.toFixed(2),
      total.toFixed(2),
      paid,
    ];

    const subRows = (exp.subtasks || []).map((sub) => {
      const subEmployeeName = sub.employeeId
        ? employeeMap.get(sub.employeeId) || sub.employeeName || "-"
        : "-";

      const subAmountValue = sub.amount ?? 0;

      return [
        formatDate(sub.date),
        "",
        `  -> ${sub.title}`.replace(/,/g, ""),
        exp.role,
        subEmployeeName.replace(/,/g, ""),
        "0.00",
        subAmountValue.toFixed(2),
        subAmountValue.toFixed(2),
        sub.done ? "Done (Sub)" : "Pending (Sub)",
      ];
    });

    return [mainRow, ...subRows];
  }).flat();

  const totalRow = [
    "",
    "",
    "GRAND TOTAL",
    "",
    "",
    grandTotalAmountBase.toFixed(2),
    grandTotalSubExpenses.toFixed(2),
    grandTotalExpense.toFixed(2),
    "",
  ];

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [
      headers.join(","),
      ...detailRows.map((e) => e.join(",")),
      totalRow.join(","),
    ].join("\n");

  return encodeURI(csvContent);
};

const ExpensesContent: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [, setEmployeesLoading] = useState(false);

  const [initialAmountHistory, setInitialAmountHistory] = useState<
    InitialAmountHistoryEntry[]
  >([]);

  const initialAmount =
    initialAmountHistory[0]?.amount || INITIAL_AMOUNT_CONSTANT;

  const [isEditingInitialAmount, setIsEditingInitialAmount] = useState(false);
  const [initialAmountInput, setInitialAmountInput] = useState(
    initialAmount.toString()
  );

  // Form State for Adding Expense
  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [role, setRole] = useState<Role>("founder");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form State for Adding Subtask
  const [subTitle, setSubTitle] = useState("");
  const [subAmount, setSubAmount] = useState("");
  const [subDate, setSubDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [subEmployeeId, setSubEmployeeId] = useState("");

  // Filter States
  const [filterRole, setFilterRole] = useState<"all" | Role>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "unpaid">(
    "all"
  );
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filterShop, setFilterShop] = useState<string>("all");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  // History/Pagination States
  const [showHistory, setShowHistory] = useState(false);
  const [historyEmployeeId, setHistoryEmployeeId] = useState<string>("");
  const [visibleRowCount, setVisibleRowCount] = useState(INITIAL_ROWS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit Expense Modal State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editExpenseFields, setEditExpenseFields] = useState({
    shop: "",
    description: "",
    amount: "",
    date: "",
    role: "founder" as Role,
    employeeId: "",
  });

  // Edit Subtask Modal State
  const [editingSubtask, setEditingSubtask] = useState<{
    parentId: string;
    subId: string;
    title: string;
    amount: string;
    date: string;
    employeeId?: string;
  } | null>(null);

  // --- Data Fetching Effects ---

  useEffect(() => {
    const fetchInitialAmount = async () => {
      try {
        const res = await fetch("/api/initial-amount");
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setInitialAmountHistory(json.data);
        } else {
          setInitialAmountHistory([
            {
              amount: INITIAL_AMOUNT_CONSTANT,
              date: new Date().toISOString(),
            },
          ]);
        }
      } catch (err: any) {
        toast.error("Failed to load initial budget from server.");
        setInitialAmountHistory([
          {
            amount: INITIAL_AMOUNT_CONSTANT,
            date: new Date().toISOString(),
          },
        ]);
      }
    };

    fetchInitialAmount();
  }, []);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/expenses");
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to fetch");

        const fetchedExpenses: Expense[] = (json.data || []).map((e: any) => {
          const paid = typeof e.paid === "boolean" ? e.paid : false;
          const subtasks: Subtask[] = Array.isArray(e.subtasks)
            ? e.subtasks
            : [];
          return {
            ...e,
            paid,
            subtasks,
          } as Expense;
        });

        const sortedExpenses = fetchedExpenses.sort((a, b) => {
          if (a.date > b.date) return 1;
          if (a.date < b.date) return -1;
          return 0;
        });

        setExpenses(sortedExpenses);
      } catch (err: any) {
        setError(err.message || "Failed to load expenses");
        toast.error(err.message || "Failed to load expenses");
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

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
      } catch {} finally {
        setEmployeesLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // --- Memoized Values ---

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

  const shopSuggestions = useMemo(() => {
    const arr = expenses
      .map((e) => (e.shop || "").trim())
      .filter((s) => s.length > 0);
    return Array.from(new Set(arr));
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    const filtered = expenses.filter((e) => {
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
      if (filterShop !== "all" && filterShop && e.shop !== filterShop)
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

    return filtered.sort((a, b) => {
      if (a.date > b.date) return 1;
      if (a.date < b.date) return -1;
      return 0;
    });
  }, [
    expenses,
    filterRole,
    filterStatus,
    filterEmployee,
    filterShop,
    filterFrom,
    filterTo,
    filterSearch,
  ]);

  const visibleExpenses = useMemo(() => {
    return filteredExpenses.slice(0, visibleRowCount);
  }, [filteredExpenses, visibleRowCount]);

  const hasMoreExpenses = visibleRowCount < filteredExpenses.length;

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

  // --- Handlers & Helpers ---

  const handleUpdateInitialAmount = async () => {
    const newAmount = Number(initialAmountInput);
    if (!Number.isNaN(newAmount) && newAmount >= 0) {
      const newEntry: InitialAmountHistoryEntry = {
        amount: newAmount,
        date: new Date().toISOString(),
      };

      if (newAmount !== initialAmountHistory[0]?.amount) {
        try {
          const res = await fetch("/api/initial-amount", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newEntry),
          });
          const json = await res.json();
          if (!json.success) {
            toast.error(
              json.error || "Failed to save initial amount to database."
            );
            return;
          }

          const newHistory = [newEntry, ...initialAmountHistory];
          setInitialAmountHistory(newHistory);
          toast.success("Initial amount updated successfully!");
        } catch (err: any) {
          toast.error(err.message || "Failed to update initial amount.");
        }
      }
      setIsEditingInitialAmount(false);
    } else {
      toast.error("Please enter a valid amount.");
    }
  };

  const loadMoreRows = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleRowCount((prevCount) =>
        Math.min(prevCount + ROWS_PER_PAGE, filteredExpenses.length)
      );
      setIsLoadingMore(false);
    }, 300);
  };

  useEffect(() => {
    setVisibleRowCount(INITIAL_ROWS);
  }, [
    filterRole,
    filterStatus,
    filterEmployee,
    filterShop,
    filterFrom,
    filterTo,
    filterSearch,
  ]);

  useEffect(() => {
    const handleScroll = () => {
      if (tableRef.current) {
        const { scrollTop, clientHeight, scrollHeight } = tableRef.current;

        if (
          scrollHeight - (scrollTop + clientHeight) < 200 &&
          !isLoadingMore &&
          visibleRowCount < filteredExpenses.length
        ) {
          loadMoreRows();
        }
      }
    };

    if (tableRef.current) {
      tableRef.current.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (tableRef.current) {
        tableRef.current.removeEventListener("scroll", handleScroll);
      }
    };
  }, [visibleRowCount, filteredExpenses.length, isLoadingMore]);

  const handleUpdatePaidStatus = async (
    exp: Expense,
    isPaid: boolean,
    updateSubtasks = true
  ) => {
    const action = isPaid ? "Done" : "Pending";
    const confirmMessage = `Are you sure you want to mark the expense "${exp.description}" as ${action}?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    let updatedSubtasks = exp.subtasks || [];

    if (updateSubtasks) {
      updatedSubtasks = (exp.subtasks || []).map((sub) => ({
        ...sub,
        done: isPaid ? true : sub.done,
      }));
    }

    const updates = { paid: isPaid, subtasks: updatedSubtasks };

    try {
      const res = await fetch("/api/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: exp._id, updates }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed to update status.");
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
      toast.success(`Expense marked as ${isPaid ? "Done" : "Pending"}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status.");
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || !date) {
      toast.warn("Description, amount, date are required.");
      return;
    }

    if (role === "manager" && !selectedEmployeeId) {
      toast.warn("Select employee for Manager role.");
      return;
    }

    const payload = {
      description: description.trim(),
      amount: Number(amount),
      date,
      weekStart: getWeekStart(date),
      shop: shopName.trim(),
      role,
      employeeId: selectedEmployeeId || null,
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
        toast.error(json.error || "Failed to add expense.");
        return;
      }

      const created: Expense = {
        ...json.data,
        paid: typeof json.data.paid === "boolean" ? json.data.paid : false,
        subtasks: Array.isArray(json.data.subtasks) ? json.data.subtasks : [],
      };

      setExpenses((prev) => {
        const newExpenses = [...prev, created];
        return newExpenses.sort((a, b) => {
          if (a.date > b.date) return 1;
          if (a.date < b.date) return -1;
          return 0;
        });
      });

      setShopName("");
      setDescription("");
      setAmount("");
      setDate(new Date().toISOString().slice(0, 10));
      setRole("founder");
      setSelectedEmployeeId("");
      setShowAddForm(false);
      toast.success("Expense added successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to add expense.");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setSubTitle("");
    setSubAmount("");
    setSubDate(new Date().toISOString().slice(0, 10));
    setSubEmployeeId("");
  };

  const handleAddSubtask = async (e: React.FormEvent, parent: Expense) => {
    e.preventDefault();
    if (!expandedId) return;
    if (!subTitle.trim() || !subAmount) {
      toast.warn("Sub description and amount required.");
      return;
    }

    const newSub: Subtask = {
      id: Math.random().toString(36).slice(2, 9),
      title: subTitle.trim(),
      done: isExpensePaid(parent),
      amount: Number(subAmount),
      date: subDate,
      employeeId: subEmployeeId || undefined,
      employeeName:
        subEmployeeId &&
        employees.find((e) => e._id === subEmployeeId)?.name,
    };

    const updatedSubtasks = [newSub, ...(parent.subtasks || [])];

    const updates = { subtasks: updatedSubtasks, paid: false };

    try {
      const res = await fetch("/api/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: parent._id, updates }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed to add sub expense.");
        return;
      }

      setExpenses((prev) =>
        prev.map((exp) =>
          exp._id === parent._id
            ? { ...exp, subtasks: updatedSubtasks, paid: false }
            : exp
        )
      );
      setSubTitle("");
      setSubAmount("");
      setSubDate(new Date().toISOString().slice(0, 10));
      setSubEmployeeId("");
      toast.success("Sub expense added successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to add sub expense.");
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
          updates: { subtasks: updatedSubtasks },
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed to update subtask status.");
        return;
      }

      const allSubtasksDone = updatedSubtasks.every((sub) => sub.done);
      let newPaidStatus = parentExp.paid;

      if (!parentExp.paid && allSubtasksDone) {
        newPaidStatus = true;
      }

      setExpenses((prev) =>
        prev.map((exp) =>
          exp._id === parentExp._id
            ? { ...exp, subtasks: updatedSubtasks, paid: newPaidStatus }
            : exp
        )
      );

      if (newPaidStatus !== parentExp.paid) {
        await handleUpdatePaidStatus(
          { ...parentExp, subtasks: updatedSubtasks },
          newPaidStatus,
          false
        );
      }
      toast.success("Sub expense status updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update subtask status.");
    }
  };

  const handleDeleteSubtask = async (parentExp: Expense, subtaskId: string) => {
    const confirmMessage = `Are you sure you want to delete this sub expense from "${parentExp.description}"? This cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    const updatedSubtasks = (parentExp.subtasks || []).filter(
      (sub) => sub.id !== subtaskId
    );

    try {
      const res = await fetch("/api/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: parentExp._id,
          updates: { subtasks: updatedSubtasks },
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed to delete sub expense.");
        return;
      }

      setExpenses((prev) =>
        prev.map((exp) =>
          exp._id === parentExp._id ? { ...exp, subtasks: updatedSubtasks } : exp
        )
      );
      toast.success("Sub expense deleted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete sub expense.");
    }
  };

  const handleDeleteExpense = async (exp: Expense) => {
    const confirmMessage = `Are you sure you want to delete the expense "${exp.description}"? This cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const res = await fetch("/api/expenses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: exp._id }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed to delete expense.");
        return;
      }

      setExpenses((prev) => prev.filter((e) => e._id !== exp._id));
      toast.success("Expense deleted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete expense.");
    }
  };

  const onStartEditExpense = (exp: Expense) => {
    setEditingExpense(exp);
    setEditExpenseFields({
      shop: exp.shop || "",
      description: exp.description || "",
      amount: String(exp.amount || 0),
      date: exp.date || new Date().toISOString().slice(0, 10),
      role: exp.role || "founder",
      employeeId: exp.employeeId || "", // employeeId from expense or ""
    });
  };

  const handleSaveEditExpense = async () => {
    if (!editingExpense) return;
    
    // CRITICAL CHANGE: Determine employeeId for the payload
    const finalEmployeeId = editExpenseFields.employeeId === "" 
      ? null 
      : editExpenseFields.employeeId;

    const updates: any = {
      shop: editExpenseFields.shop,
      description: editExpenseFields.description,
      amount: Number(editExpenseFields.amount),
      date: editExpenseFields.date,
      role: editExpenseFields.role,
      employeeId: finalEmployeeId,
      employeeName:
        finalEmployeeId &&
        employees.find((e) => e._id === finalEmployeeId)?.name,
    };

    try {
      // NOTE: Ensure your backend uses the ID from the body (or URL) to find the expense.
      // If the backend is using the ID from the request body AND expects an ObjectId, 
      // the issue might be here if the ID is malformed or case-sensitive mismatch on Vercel.
      const res = await fetch("/api/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingExpense._id, updates }),
      });
      const json = await res.json();
      if (!json.success) {
        // This is the error path where "expense not found" is likely coming from.
        // It means the backend failed to find `editingExpense._id`.
        toast.error(json.error || "Failed to update expense. Expense not found?");
        return;
      }

      const updated = json.data;
      setExpenses((prev) =>
        prev.map((e) => (e._id === updated._id ? { ...e, ...updated } : e))
      );
      setEditingExpense(null);
      toast.success("Expense updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update expense.");
    }
  };

  const onStartEditSubtask = (parent: Expense, sub: Subtask) => {
    setEditingSubtask({
      parentId: parent._id,
      subId: sub.id,
      title: sub.title,
      amount: String(sub.amount ?? ""),
      date: sub.date ?? new Date().toISOString().slice(0, 10),
      employeeId: sub.employeeId ?? "",
    });
  };

  const handleSaveEditSubtask = async () => {
    if (!editingSubtask) return;
    const parent = expenses.find((e) => e._id === editingSubtask.parentId);
    if (!parent) {
      toast.error("Parent expense not found");
      return;
    }

    const finalSubEmployeeId = editingSubtask.employeeId === "" 
      ? undefined 
      : editingSubtask.employeeId;

    const updatedSubtasks = (parent.subtasks || []).map((s) =>
      s.id === editingSubtask.subId
        ? {
            ...s,
            title: editingSubtask.title,
            amount: Number(editingSubtask.amount),
            date: editingSubtask.date,
            employeeId: finalSubEmployeeId,
            employeeName:
              finalSubEmployeeId &&
              employees.find((e) => e._id === finalSubEmployeeId)?.name,
          }
        : s
    );

    try {
      const res = await fetch("/api/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: parent._id,
          updates: { subtasks: updatedSubtasks },
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Failed to update sub expense.");
        return;
      }

      setExpenses((prev) =>
        prev.map((e) =>
          e._id === parent._id ? { ...e, subtasks: updatedSubtasks } : e
        )
      );
      setEditingSubtask(null);
      toast.success("Sub expense updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update sub expense.");
    }
  };

  const cancelEditExpense = () => setEditingExpense(null);
  const cancelEditSubtask = () => setEditingSubtask(null);
  const cancelAddForm = () => setShowAddForm(false);

  const handleDownloadCSV = () => {
    if (filteredExpenses.length === 0) {
      toast.warn("No expenses match the current filters to download.");
      return;
    }

    const csvUri = convertToCSV(filteredExpenses, employees);
    const link = document.createElement("a");
    link.setAttribute("href", csvUri);
    link.setAttribute(
      "download",
      `expenses_report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filteredExpenses.length} expenses downloaded!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 p-8">
      <ToastContainer position="bottom-right" autoClose={3000} />

      <div className="max-w-[1600px] mx-auto space-y-8">
        <div className="text-center mb-12 mt-16">
          <h1 className="text-5xl font-black text-gray-900 mb-3 tracking-tight">
            Expense Tracker
          </h1>
          <p className="text-lg text-gray-600">
            Manage your business finances with ease
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-gray-100 hover:shadow-2xl transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Initial Budget
                </div>
                {!isEditingInitialAmount && (
                  <div className="text-3xl font-black text-gray-900">
                    ₹{initialAmount.toLocaleString()}
                  </div>
                )}
              </div>
              {!isEditingInitialAmount && (
                <button
                  onClick={() => {
                    setIsEditingInitialAmount(true);
                    setInitialAmountInput(initialAmount.toString());
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-bold text-blue-600 bg-blue-100 hover:bg-blue-200 transition-all"
                >
                  Edit
                </button>
              )}
            </div>
            {isEditingInitialAmount && (
              <div className="space-y-3">
                <input
                  type="number"
                  value={initialAmountInput}
                  onChange={(e) => setInitialAmountInput(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-2 text-gray-900 outline-none focus:border-blue-500"
                  placeholder="Enter new amount"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateInitialAmount}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition-all"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingInitialAmount(false);
                      setInitialAmountInput(initialAmount.toString());
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg text-sm font-bold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-white to-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
              Total Spent
            </div>
            <div className="text-3xl font-black text-black">
              ₹{walletStats.spent.toLocaleString()}
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
              Pending
            </div>
            <div className="text-3xl font-black text-black">
              ₹{walletStats.pending.toLocaleString()}
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
              Remaining
            </div>
            <div className="text-3xl font-black text-black">
              ₹{walletStats.remaining.toLocaleString()}
            </div>
          </div>
        </div>

        {showAddForm && (
          <ExpenseForm
            shopName={shopName}
            setShopName={setShopName}
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
            shops={shopSuggestions}
            onCancel={cancelAddForm}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-gray-100 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-gray-900">Filters</h3>
                <button
                  type="button"
                  onClick={() => setShowHistory((s) => !s)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-teal-700 bg-teal-100 hover:bg-teal-200 transition-all"
                >
                  {showHistory ? "Hide" : "History"}
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Search
                  </label>
                  <input
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 transition-all"
                    placeholder="Search..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Shop
                  </label>
                  <select
                    value={filterShop}
                    onChange={(e) => setFilterShop(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="all">All Shops</option>
                    {shopSuggestions.map((shop) => (
                      <option key={shop} value={shop}>
                        {shop}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Role
                  </label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value as any)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="all">All Roles</option>
                    <option value="founder">Founder</option>
                    <option value="manager">Manager</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="paid">Done/Paid</option>
                    <option value="unpaid">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Employee
                  </label>
                  <select
                    value={filterEmployee}
                    onChange={(e) => setFilterEmployee(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="all">All Employees</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filterFrom}
                    onChange={(e) => setFilterFrom(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 transition-all bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filterTo}
                    onChange={(e) => setFilterTo(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 transition-all bg-white"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleDownloadCSV}
                    className="w-full px-6 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg transition-all flex items-center justify-center text-sm"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      ></path>
                    </svg>
                    Download Filtered ({filteredExpenses.length})
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl border-2 border-gray-100">
              {loading ? (
                <div className="p-16 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                  <p className="mt-4 text-gray-600 font-medium">
                    Loading expenses...
                  </p>
                </div>
              ) : error ? (
                <div className="p-16 text-center">
                  <div className="inline-block w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <span className="text-3xl text-red-600">!</span>
                  </div>
                  <p className="text-red-600 font-bold">{error}</p>
                </div>
              ) : (
                <div
                  ref={tableRef}
                  className="overflow-x-auto"
                  style={{ maxHeight: "70vh" }}
                >
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-gray-900 to-gray-800 sticky top-0">
                      <tr>
                        <th className="p-4 text-left font-black text-white uppercase tracking-wide text-xs">
                          #
                        </th>
                        <th className="p-4 text-left font-black text-white uppercase tracking-wide text-xs">
                          Shop
                        </th>
                        <th className="p-4 text-left font-black text-white uppercase tracking-wide text-xs">
                          Description
                        </th>
                        <th className="p-4 text-right font-black text-white uppercase tracking-wide text-xs">
                          Amount
                        </th>
                        <th className="p-4 text-right font-black text-white uppercase tracking-wide text-xs">
                          Total
                        </th>
                        <th className="p-4 text-left font-black text-white uppercase tracking-wide text-xs">
                          Date
                        </th>
                        <th className="p-4 text-left font-black text-white uppercase tracking-wide text-xs">
                          Role
                        </th>
                        <th className="p-4 text-left font-black text-white uppercase tracking-wide text-xs">
                          Employee
                        </th>
                        <th className="p-4 text-left font-black text-white uppercase tracking-wide text-xs">
                          Status
                        </th>
                        <th className="p-4 text-left font-black text-white uppercase tracking-wide text-xs">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-gray-100">
                      {visibleExpenses.length === 0 &&
                      filteredExpenses.length === 0 ? (
                        <tr>
                          <td
                            className="p-16 text-center text-gray-500"
                            colSpan={10}
                          >
                            <div className="text-6xl mb-4">📊</div>
                            <p className="font-bold text-lg">
                              No expenses found
                            </p>
                            <p className="text-sm">Try adjusting your filters</p>
                          </td>
                        </tr>
                      ) : (
                        visibleExpenses.map((exp, idx) => {
                          const subsTotal = (exp.subtasks || []).reduce(
                            (s, sub) => s + (sub.amount || 0),
                            0
                          );
                          const total = exp.amount + subsTotal;
                          const paid = isExpensePaid(exp);

                          return (
                            <React.Fragment key={exp._id}>
                              <tr className="hover:bg-blue-50 transition-colors">
                                <td className="p-4 text-gray-600 font-bold">
                                  {idx + 1}
                                </td>
                                <td className="p-4 text-gray-900 font-bold">
                                  {exp.shop || "-"}
                                </td>
                                <td className="p-4 text-gray-900">
                                  {exp.description}
                                </td>
                                <td className="p-4 text-right font-bold text-gray-900">
                                  ₹{exp.amount.toLocaleString()}
                                </td>
                                <td className="p-4 text-right font-black text-gray-900 text-lg">
                                  ₹{total.toLocaleString()}
                                </td>
                                <td className="p-4 text-gray-600 text-sm">
                                  {formatDate(exp.date)}
                                </td>
                                <td className="p-4 text-gray-600 capitalize text-sm">
                                  {exp.role || "other"}
                                </td>
                                <td className="p-4 text-gray-600 text-sm">
                                  {exp.employeeName || "-"}
                                </td>
                                <td className="p-4">
                                  <select
                                    value={paid ? "paid" : "unpaid"}
                                    onChange={(e) => {
                                      const newStatus =
                                        e.target.value === "paid";
                                      handleUpdatePaidStatus(exp, newStatus);
                                    }}
                                    className={`border-2 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer ${
                                      paid
                                        ? "border-green-300 bg-green-50 text-green-700"
                                        : "border-orange-300 bg-orange-50 text-orange-700"
                                    }`}
                                  >
                                    <option value="unpaid">Pending</option>
                                    <option value="paid">Done</option>
                                  </select>
                                </td>
                                <td className="p-4">
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      className="px-4 py-2 rounded-lg text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
                                      onClick={() => toggleExpand(exp._id)}
                                    >
                                      {expandedId === exp._id ? "Hide" : "View"}
                                    </button>
                                    <button
                                      type="button"
                                      className="px-4 py-2 rounded-lg text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 transition-all"
                                      onClick={() => onStartEditExpense(exp)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      className="px-4 py-2 rounded-lg text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 transition-all"
                                      onClick={() => handleDeleteExpense(exp)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {expandedId === exp._id && (
                                <SubExpensesSection
                                  parent={exp}
                                  employees={employees}
                                  subTitle={subTitle}
                                  setSubTitle={setSubTitle}
                                  subAmount={subAmount}
                                  setSubAmount={setSubAmount}
                                  subDate={subDate}
                                  setSubDate={setSubDate}
                                  subEmployeeId={subEmployeeId}
                                  setSubEmployeeId={setSubEmployeeId}
                                  onAddSubtask={handleAddSubtask}
                                  onUpdateSubtaskStatus={
                                    handleUpdateSubtaskStatus
                                  }
                                  onDeleteSubtask={handleDeleteSubtask}
                                  onStartEditSubtask={onStartEditSubtask}
                                />
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  <div className="text-center py-6 text-sm font-bold text-gray-600 bg-gray-50">
                    {isLoadingMore && <p>Loading more expenses...</p>}
                    {!hasMoreExpenses && filteredExpenses.length > 0 && (
                      <p>All expenses loaded</p>
                    )}
                    {hasMoreExpenses && !isLoadingMore && (
                      <button
                        onClick={loadMoreRows}
                        className="text-blue-600 hover:text-blue-800 font-bold"
                      >
                        Load More ({filteredExpenses.length - visibleRowCount}{" "}
                        remaining)
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {showHistory && (
          <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-100">
            <h2 className="text-2xl font-black text-gray-900 mb-6">
              Payment History
            </h2>
            <div className="grid gap-6 md:grid-cols-2 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Filter by Employee
                </label>
                <select
                  value={historyEmployeeId}
                  onChange={(e) => setHistoryEmployeeId(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-blue-500 transition-all bg-white"
                >
                  <option value="">All Paid Expenses</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {historyEmployeeId
                    ? "Selected Employee Total"
                    : "All Time Total"}
                </label>
                <div
                  className={`border-2 rounded-xl px-6 py-4 text-2xl font-black ${
                    historyEmployeeId
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-green-300 bg-green-50 text-green-700"
                  }`}
                >
                  ₹
                  {(historyEmployeeId
                    ? employeeHistoryTotal
                    : historyExpenses.reduce(
                        (sum, e) =>
                          sum +
                          e.amount +
                          (e.subtasks || []).reduce(
                            (s, sub) => s + (sub.amount || 0),
                            0
                          ),
                        0
                      )
                  ).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border-2 border-gray-200">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-900 to-gray-800">
                  <tr>
                    <th className="p-4 text-left font-black text-white uppercase tracking-wide text-xs">
                      Date
                    </th>
                    <th className="p-4 text-left font-black text-white uppercase tracking-wide text-xs">
                      Description
                    </th>
                    <th className="p-4 text-left font-black text-white uppercase tracking-wide text-xs">
                      Shop
                    </th>
                    <th className="p-4 text-right font-black text-white uppercase tracking-wide text-xs">
                      Amount
                    </th>
                    <th className="p-4 text-right font-black text-white uppercase tracking-wide text-xs">
                      Total
                    </th>
                    <th className="p-4 text-left font-black text-white uppercase tracking-wide text-xs">
                      Employee
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-100">
                  {(historyEmployeeId ? employeeHistory : historyExpenses)
                    .length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-16 text-center text-gray-500"
                      >
                        <div className="text-6xl mb-4">📜</div>
                        <p className="font-bold text-lg">No payment history</p>
                      </td>
                    </tr>
                  ) : (
                    (historyEmployeeId ? employeeHistory : historyExpenses).map(
                      (exp) => {
                        const subsTotal = (exp.subtasks || []).reduce(
                          (s, sub) => s + (sub.amount || 0),
                          0
                        );
                        const total = exp.amount + subsTotal;
                        return (
                          <tr
                            key={exp._id}
                            className="hover:bg-blue-50 transition-colors"
                          >
                            <td className="p-4 text-gray-600 text-sm">
                              {formatDate(exp.date)}
                            </td>
                            <td className="p-4 text-gray-900 font-bold">
                              {exp.description}
                            </td>
                            <td className="p-4 text-gray-900">
                              {exp.shop || "-"}
                            </td>
                            <td className="p-4 text-right text-gray-600 font-bold">
                              ₹{exp.amount.toLocaleString()}
                            </td>
                            <td className="p-4 text-right font-black text-gray-900 text-lg">
                              ₹{total.toLocaleString()}
                            </td>
                            <td className="p-4 text-gray-600">
                              {exp.employeeName || "-"}
                            </td>
                          </tr>
                        );
                      }
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white w-16 h-16 rounded-full flex items-center justify-center text-4xl font-light shadow-2xl transition-all duration-300 transform hover:scale-110 z-50"
          aria-label="Add New Expense"
        >
          +
        </button>
      )}

      {editingExpense && (
        <EditExpenseModal
          editingExpense={editingExpense}
          editExpenseFields={editExpenseFields}
          setEditExpenseFields={setEditExpenseFields}
          employees={employees}
          onSave={handleSaveEditExpense}
          onCancel={cancelEditExpense}
        />
      )}

      {editingSubtask && (
        <EditSubtaskModal
          editingSubtask={editingSubtask}
          setEditingSubtask={setEditingSubtask}
          employees={employees}
          onSave={handleSaveEditSubtask}
          onCancel={cancelEditSubtask}
        />
      )}
    </div>
  );
};

export default ExpensesContent;