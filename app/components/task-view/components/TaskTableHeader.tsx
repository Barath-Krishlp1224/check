// components/TaskTableHeader.tsx
import React, { useMemo } from "react";
import { Download, AlertCircle } from "lucide-react";
import { Employee } from "../page"; 

interface TaskTableHeaderProps {
  uniqueProjects: string[];
  employees: Employee[];
  downloadFilterType: string;
  setDownloadFilterType: (type: string) => void;
  downloadFilterValue: string;
  setDownloadFilterValue: (value: string) => void;
  xlsxLoaded: boolean;
  handleExcelDownload: () => void;
}

const TaskTableHeader: React.FC<TaskTableHeaderProps> = ({
  uniqueProjects,
  employees,
  downloadFilterType,
  setDownloadFilterType,
  downloadFilterValue,
  setDownloadFilterValue,
  xlsxLoaded,
  handleExcelDownload,
}) => {
  const isDownloadDisabled = !xlsxLoaded || (downloadFilterType !== "all" && !downloadFilterValue);
  
  const [selectedAssignee, setSelectedAssignee] = React.useState<string>("");
  const [filterFromDate, setFilterFromDate] = React.useState<string>("");
  const [filterToDate, setFilterToDate] = React.useState<string>("");

  const combineFilterValue = (primaryValue: string, fromDate: string, toDate: string): string => {
    if (!primaryValue) return "";
    
    const baseValue = primaryValue.trim() || downloadFilterType;

    if (fromDate || toDate || downloadFilterType === "assignee") {
        return `${baseValue}|${fromDate.trim()}|${toDate.trim()}`;
    }
    return baseValue;
  };

  const handlePrimaryFilterChange = (value: string) => {
    let primaryValue = value.toLowerCase();
    
    if (downloadFilterType === "assignee") {
        setSelectedAssignee(primaryValue);
    }
    
    const newDownloadValue = combineFilterValue(primaryValue, filterFromDate, filterToDate);
    setDownloadFilterValue(newDownloadValue);
  };
  
  const handleDateRangeChange = (field: 'from' | 'to', dateValue: string) => {
    let newFromDate = filterFromDate;
    let newToDate = filterToDate;

    if (field === 'from') {
        setFilterFromDate(dateValue);
        newFromDate = dateValue;
    } else {
        setFilterToDate(dateValue);
        newToDate = dateValue;
    }
    
    const primaryValue = downloadFilterType === 'assignee' ? selectedAssignee : downloadFilterValue.split('|')[0] || downloadFilterType;
    const newDownloadValue = combineFilterValue(primaryValue, newFromDate, newToDate);
    setDownloadFilterValue(newDownloadValue);
  };
  
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handleDurationSelect = (months: number) => {
    const today = new Date();
    const futureDate = new Date(today);
    
    const newToDate = formatDate(today);
    setFilterToDate(newToDate);
    
    futureDate.setMonth(today.getMonth() - months);
    const newFromDate = formatDate(futureDate);
    setFilterFromDate(newFromDate);
    
    const primaryValue = downloadFilterType === 'assignee' ? selectedAssignee : downloadFilterValue.split('|')[0] || downloadFilterType;
    const newDownloadValue = combineFilterValue(primaryValue, newFromDate, newToDate);
    setDownloadFilterValue(newDownloadValue);
  };

  React.useEffect(() => {
    if (downloadFilterValue.includes("|")) {
      const parts = downloadFilterValue.split('|');
      const primaryValue = parts[0];
      const fromDate = parts[1] || "";
      const toDate = parts[2] || "";

      if (downloadFilterType === 'assignee') {
        setSelectedAssignee(primaryValue);
      }
      setFilterFromDate(fromDate);
      setFilterToDate(toDate);
    } else {
      if (downloadFilterType === 'assignee') {
        setSelectedAssignee(downloadFilterValue);
      }
      setFilterFromDate("");
      setFilterToDate("");
    }
  }, [downloadFilterType, downloadFilterValue]);


  const showOptionalDateFilters = useMemo(() => {
    const hiddenFilters = ["date", "month"];
    return !hiddenFilters.includes(downloadFilterType);
  }, [downloadFilterType]);

  const durationButtons = [
    { label: '1M', months: 1 },
    { label: '3M', months: 3 },
    { label: '6M', months: 6 },
    { label: '9M', months: 9 },
    { label: '1Y', months: 12 },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Project Tasks</h1> 
          <div className="w-24 h-1 bg-blue-600 rounded-full"></div>
        </div>
        <div className="flex items-center gap-4 bg-white rounded-xl shadow-lg border border-slate-200 p-4">
          
          <label className="text-sm font-medium text-slate-700">Filter By:</label>
          <select
            value={downloadFilterType}
            onChange={(e) => {
              setDownloadFilterType(e.target.value);
              setDownloadFilterValue(e.target.value === "all" ? "all" : "");
              setSelectedAssignee("");
              setFilterFromDate("");
              setFilterToDate("");
            }}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-700 font-medium bg-slate-50"
          >
            <option value="all">All Tasks</option>
            <option value="status">Status</option>
            <option value="project">Project Name</option>
            <option value="assignee">Assignee</option>
            <option value="date">Single Date</option>
            <option value="month">Month (YYYY-MM)</option>
          </select>

          {downloadFilterType === "status" && (
            <select
              value={downloadFilterValue.split('|')[0] || ""}
              onChange={(e) => handlePrimaryFilterChange(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-900"
            >
              <option value="">Select Status</option>
              <option value="Backlog">Backlog</option>
              <option value="In Progress">In Progress</option>
              <option value="Dev Review">Dev Review</option>
              <option value="Deployed in QA">Deployed in QA</option>
              <option value="Test In Progress">Test In Progress</option>
              <option value="QA Sign Off">QA Sign Off</option>
              <option value="Deployment Stage">Deployment Stage</option>
              <option value="Pilot Test">Pilot Test</option>
              <option value="Completed">Completed</option>
              <option value="Paused">Paused</option>
            </select>
          )}

          {downloadFilterType === "project" && (
            <select
              value={downloadFilterValue.split('|')[0] || ""}
              onChange={(e) => handlePrimaryFilterChange(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-900"
            >
              <option value="">Select Project</option>
              {uniqueProjects.sort().map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
          )}
          {downloadFilterType === "date" && (
            <input
              type="date"
              value={downloadFilterValue}
              onChange={(e) => setDownloadFilterValue(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-900"
            />
          )}
          {downloadFilterType === "month" && (
            <input
              type="month"
              value={downloadFilterValue}
              onChange={(e) => setDownloadFilterValue(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-900"
            />
          )}
          
          {downloadFilterType === "assignee" && (
            <select
                value={selectedAssignee || ""}
                onChange={(e) => handlePrimaryFilterChange(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-900"
            >
                <option value="">Select Employee</option>
                <option value="all">All Employees</option>
                {employees.map(employee => (
                <option key={employee._id} value={employee.name.toLowerCase()}>{employee.name}</option>
                ))}
            </select>
          )}

          {showOptionalDateFilters && (downloadFilterType !== "assignee" || (selectedAssignee && selectedAssignee !== "all")) && (
             <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-700">From:</label>
                <input
                    type="date"
                    value={filterFromDate}
                    onChange={(e) => handleDateRangeChange('from', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-900"
                    title="Filter From Date"
                    placeholder="From Date"
                />
                <label className="text-sm font-medium text-slate-700">To:</label>
                <input
                    type="date"
                    value={filterToDate}
                    onChange={(e) => handleDateRangeChange('to', e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm text-gray-900"
                    title="Filter To Date"
                    placeholder="To Date"
                />
                
                <div className="flex space-x-1">
                    {durationButtons.map((button) => (
                        <button
                            key={button.label}
                            onClick={() => handleDurationSelect(button.months)}
                            className="px-2 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                            title={`Filter tasks from the last ${button.months} month(s)`}
                        >
                            {button.label}
                        </button>
                    ))}
                </div>
            </div>
          )}

          <button
            onClick={handleExcelDownload}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all shadow-md ${
                isDownloadDisabled
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
            disabled={isDownloadDisabled}
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskTableHeader;