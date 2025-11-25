// utils.ts

import { Expense, DateFilter } from './interfaces';

export const uid = () => Math.random().toString(36).slice(2, 9);

export const getWeekStartISO = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diffToMonday = ((day + 6) % 7);
  const monday = new Date(date);
  monday.setDate(date.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
};

export const getFilterDates = (filter: DateFilter): { startDate: string | null; endDate: string | null } => {
  const today = new Date();
  let startDate: Date | null = null;
  let endDate: Date = new Date();

  switch (filter) {
    case 'all':
      return { startDate: null, endDate: null };
    case 'yesterday':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 1);
      endDate = new Date(startDate);
      break;
    case 'last_month':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      break;
    case 'last_3_months':
      startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
      break;
    case 'last_6_months':
      startDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
      break;
    case 'last_9_months':
      startDate = new Date(today.getFullYear(), today.getMonth() - 9, today.getDate());
      break;
    case 'last_year':
      startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      break;
    case 'custom':
    default:
      return { startDate: null, endDate: null };
  }
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  return { startDate: startDate ? formatDate(startDate) : null, endDate: formatDate(endDate) };
};

export const downloadCSV = (data: Expense[], filename: string = 'expense_report.csv') => {
  if (data.length === 0) {
    alert('No data to download.');
    return;
  }
  const headers = ['ID', 'Date', 'Category', 'Shop', 'Description', 'Amount', 'Paid'];
  const csvRows = data.map((expense, idx) =>
    `${idx + 1},"${expense.date}","${expense.category}","${(expense.shop || '').replace(/"/g, '""')}","${(expense.description || '').replace(/"/g, '""')}",${expense.amount.toFixed(2)},${expense.paid ? 'YES' : 'NO'}`
  );
  const csvString = [headers.join(','), ...csvRows].join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    alert('Your browser does not support downloading files directly.');
  }
};