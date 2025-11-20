import React, { useMemo } from "react";
import { Download } from "lucide-react";
import { Employee } from "../page"; // Assuming this is needed for interface definitions

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
  // Enforce 'duration' as the default/only functional filter type
  React.useEffect(() => {
    if (downloadFilterType !== 'duration') {
      setDownloadFilterType('duration');
      // Intentionally don't reset downloadFilterValue here to allow initial data load if 'all' was set
    }
  }, [downloadFilterType, setDownloadFilterType]);
  
  // Disable logic uses the current value, which is fine, assuming 'duration' filters are set
  const isDownloadDisabled = !xlsxLoaded || (!downloadFilterValue.includes("|") && downloadFilterValue !== "all");

  const [filterFromDate, setFilterFromDate] = React.useState<string>("");
  const [filterToDate, setFilterToDate] = React.useState<string>("");

  const combineFilterValue = (primaryValue: string, fromDate: string, toDate: string): string => {
    const baseValue = primaryValue.trim() || 'duration'; // Hardcode base value to 'duration'
    return `${baseValue}|${fromDate.trim()}|${toDate.trim()}`;
  };

  const handleDateRangeChange = (field: "from" | "to", dateValue: string) => {
    let newFromDate = filterFromDate;
    let newToDate = filterToDate;
    if (field === "from") {
      setFilterFromDate(dateValue);
      newFromDate = dateValue;
    } else {
      setFilterToDate(dateValue);
      newToDate = dateValue;
    }

    const primaryValue = 'duration'; 
    const newDownloadValue = combineFilterValue(primaryValue, newFromDate, newToDate);
    setDownloadFilterValue(newDownloadValue);
  };

  const formatDate = (date: Date): string => date.toISOString().split("T")[0];

  const handleDurationSelect = (type: "1W" | "2W" | "3W" | "1M" | "3M" | "6M" | "9M" | "1Y" | "Custom") => {
    const to = new Date();
    let from = new Date();
    
    to.setHours(0, 0, 0, 0);
    const todayFormatted = formatDate(to);

    if (type === "Custom") {
        setFilterFromDate("");
        setFilterToDate("");
        const newDownloadValue = combineFilterValue('duration', "", "");
        setDownloadFilterValue(newDownloadValue);
        return;
    }

    switch (type) {
      case "1W":
        from.setDate(to.getDate() - 7);
        break;
      case "2W":
        from.setDate(to.getDate() - 14);
        break;
      case "3W":
        from.setDate(to.getDate() - 21);
        break;
      case "1M":
        from.setMonth(to.getMonth() - 1);
        break;
      case "3M":
        from.setMonth(to.getMonth() - 3);
        break;
      case "6M":
        from.setMonth(to.getMonth() - 6);
        break;
      case "9M":
        from.setMonth(to.getMonth() - 9);
        break;
      case "1Y":
        from.setFullYear(to.getFullYear() - 1);
        break;
      default:
        from.setMonth(to.getMonth() - 1);
    }
    from.setHours(0, 0, 0, 0);

    const newFromDate = formatDate(from);
    
    setFilterFromDate(newFromDate);
    setFilterToDate(todayFormatted);

    const primaryValue = 'duration'; 
    const newDownloadValue = combineFilterValue(primaryValue, newFromDate, todayFormatted);
    setDownloadFilterValue(newDownloadValue);
  };

  React.useEffect(() => {
    // This useEffect synchronizes local date states with the combined downloadFilterValue
    if (downloadFilterValue.includes("|")) {
      const parts = downloadFilterValue.split("|");
      const from = parts[1] || "";
      const to = parts[2] || "";
      
      setFilterFromDate(from);
      setFilterToDate(to);
    } else {
      setFilterFromDate("");
      setFilterToDate("");
    }
  }, [downloadFilterValue]); 

  const durationButtons = [
    { label: "Last Week", value: "1W" },
    { label: "Last 2 Weeks", value: "2W" },
    { label: "Last 3 Weeks", value: "3W" },
    { label: "Last Month", value: "1M" },
    { label: "Last 3 Months", value: "3M" },
    { label: "Last 6 Months", value: "6M" },
    { label: "Last 9 Months", value: "9M" },
    { label: "Last Year", value: "1Y" },
  ];

  const currentDurationPreset = useMemo(() => {
    const valueParts = downloadFilterValue.split('|');
    const from = valueParts[1];
    const to = valueParts[2];

    if (!from || !to) return "Custom";

    const preset = durationButtons.find(b => {
        const toCheck = new Date();
        const fromCheck = new Date();
        toCheck.setHours(0, 0, 0, 0);
        
        switch (b.value) {
            case "1W":
                fromCheck.setDate(toCheck.getDate() - 7);
                break;
            case "2W":
                fromCheck.setDate(toCheck.getDate() - 14);
                break;
            case "3W":
                fromCheck.setDate(toCheck.getDate() - 21);
                break;
            case "1M":
                fromCheck.setMonth(toCheck.getMonth() - 1);
                break;
            case "3M":
                fromCheck.setMonth(toCheck.getMonth() - 3);
                break;
            case "6M":
                fromCheck.setMonth(toCheck.getMonth() - 6);
                break;
            case "9M":
                fromCheck.setMonth(toCheck.getMonth() - 9);
                break;
            case "1Y":
                fromCheck.setFullYear(toCheck.getFullYear() - 1);
                break;
            default:
                return false;
        }
        fromCheck.setHours(0, 0, 0, 0);
        
        return formatDate(fromCheck) === from && formatDate(toCheck) === to;
    });

    return preset ? preset.value : "Custom";

  }, [downloadFilterValue, durationButtons]);

  return (
    <div className="mt-30 mb-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Employee Task Summary</h1>
          
        </div>

        <div className="flex items-center gap-3 bg-white rounded-xl shadow-lg border border-slate-200 p-4">
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700">Filter: Date Range</label>

            <div className="flex items-center gap-2 flex-wrap">
                {durationButtons.map((b) => (
                    <button
                        key={b.value}
                        onClick={() => handleDurationSelect(b.value as any)}
                        className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                            currentDurationPreset === b.value 
                                ? "bg-indigo-600 text-white shadow-md" 
                                : "bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-700"
                        }`}
                    >
                        {b.label}
                    </button>
                ))}
                <button
                    onClick={() => handleDurationSelect("Custom")}
                    className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                        currentDurationPreset === "Custom" && (filterFromDate || filterToDate)
                            ? "bg-red-600 text-white shadow-md" 
                            : "bg-slate-100 text-slate-700 hover:bg-red-100 hover:text-red-700"
                    }`}
                >
                    Custom Range
                </button>
            </div>
          
            <div className="flex items-center gap-2 mt-2 border-t pt-2 border-slate-100">
              <label className="text-sm font-medium text-slate-700">From:</label>
              <input
                type="date"
                value={filterFromDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDateRangeChange("from", e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-gray-900"
              />
              <label className="text-sm font-medium text-slate-700">To:</label>
              <input
                type="date"
                value={filterToDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDateRangeChange("to", e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-gray-900"
              />
            </div>
          </div>

          <button
            onClick={handleExcelDownload}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg ${
              isDownloadDisabled ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
            disabled={isDownloadDisabled}
            title={isDownloadDisabled ? "Load data or set a date range to enable" : "Export to Excel"}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskTableHeader;