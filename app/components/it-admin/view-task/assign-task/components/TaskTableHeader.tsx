import React from "react";
import { Download, AlertCircle } from "lucide-react";
import { Employee } from "./types"; 

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

const TaskTableHeader: React.FC<TaskTableHeaderProps> = () => {
  return (
    <div className="mb-25">
      <div className="flex items-end mt-6 justify-between">
        <div>
          <h1 className="text-4xl font-bold text-black mb-2">Project Tasks</h1> 
        </div>
        <div className="flex items-center gap-4 bg-white rounded-xl">
        </div>
      </div>
    </div>
  );
};

export default TaskTableHeader;