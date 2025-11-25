// ./components/EmployeeTaskSummaryTable.tsx
import React, { useMemo } from "react";
import { Task, Employee } from "./types";
import { Users, AlertCircle, Clock, CheckCircle2, Pause } from "lucide-react";

interface EmployeeTaskSummaryTableProps {
  tasks: Task[];
  employees: Employee[];
}

interface EmployeeSummary {
  name: string;
  backlog: number;
  inProgress: number;
  completed: number;
  paused: number;
  totalTasks: number;
  completionPercentage: string;
}

const EmployeeTaskSummaryTable: React.FC<EmployeeTaskSummaryTableProps> = ({ tasks, employees }) => {
  
  // Custom Hook/Memo for data aggregation
  const employeeSummaries: EmployeeSummary[] = useMemo(() => {
    
    // Initialize map for all known employees
    const employeeMap = new Map<string, EmployeeSummary>();
    employees.forEach(emp => {
        employeeMap.set(emp.name, {
            name: emp.name,
            backlog: 0,
            inProgress: 0,
            completed: 0,
            paused: 0,
            totalTasks: 0,
            completionPercentage: "0.00%",
        });
    });

    // Process tasks and aggregate counts
    tasks.forEach(task => {
        const completion = task.completion || 0;
        
        // Handle tasks assigned to multiple people or unassigned
        const assignees = task.assigneeNames && task.assigneeNames.length > 0 ? task.assigneeNames : ['Unassigned'];

        assignees.forEach(assigneeName => {
            // Find or create summary for assignee (if not a known employee, use 'Unassigned')
            const name = employeeMap.has(assigneeName) ? assigneeName : 'Unassigned';
            
            if (name === 'Unassigned' && !employeeMap.has('Unassigned')) {
                employeeMap.set('Unassigned', {
                    name: 'Unassigned', backlog: 0, inProgress: 0, completed: 0, paused: 0, totalTasks: 0, completionPercentage: "0.00%",
                });
            }
            
            const summary = employeeMap.get(name)!;

            // Increment task counts
            summary.totalTasks++;
            
            switch (task.status) {
                case 'Backlog':
                    summary.backlog++;
                    break;
                case 'In Progress':
                    summary.inProgress++;
                    break;
                case 'Completed':
                    summary.completed++;
                    break;
                case 'Paused':
                case 'On Hold':
                    summary.paused++;
                    break;
                // Treat other statuses (Dev Review, QA Sign Off, etc.) as 'In Progress' for overall calculation
                default:
                    summary.inProgress++;
                    break;
            }
        });
    });

    // Final Calculation of completion percentage
    const summariesArray = Array.from(employeeMap.values()).map(summary => {
        let totalCompleted = 0;
        let totalTasksForCalc = 0;

        // Recalculate based on current assigned tasks to get a weighted average completion
        tasks.forEach(task => {
            if (task.assigneeNames && task.assigneeNames.includes(summary.name)) {
                 // Use simple completion average for demonstration, 
                 // or use (task.completion / 100) as the weight * 100
                 totalCompleted += task.completion || 0;
                 totalTasksForCalc++;
            }
        });

        // Use the average completion percentage across all assigned tasks
        const avgCompletion = totalTasksForCalc > 0 ? totalCompleted / totalTasksForCalc : 0;
        
        return {
            ...summary,
            completionPercentage: `${avgCompletion.toFixed(2)}%`,
        };
    }).filter(s => s.totalTasks > 0); // Only display employees who are assigned tasks

    // Sort: Completed > In Progress > Backlog
    return summariesArray.sort((a, b) => b.completed - a.completed || b.inProgress - a.inProgress || b.backlog - a.backlog);

  }, [tasks, employees]);

  if (employeeSummaries.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h3 className="text-xl font-semibold text-slate-700">No Task Assignments Found</h3>
        <p className="text-slate-500">No tasks are currently assigned to active employees.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="p-5 bg-gradient-to-r from-indigo-700 to-indigo-600 flex items-center gap-3">
        <Users className="w-6 h-6 text-white" />
        <h2 className="text-xl font-bold text-white">Employee Task Summary by Status</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-[20%]">Employee</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-[15%]">
                <AlertCircle className="w-4 h-4 inline-block mr-1 text-red-500" />
                Backlog
              </th>
              <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-[15%]">
                <Clock className="w-4 h-4 inline-block mr-1 text-blue-500" />
                In Progress
              </th>
              <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-[15%]">
                <CheckCircle2 className="w-4 h-4 inline-block mr-1 text-emerald-500" />
                Completed
              </th>
              <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-[15%]">
                <Pause className="w-4 h-4 inline-block mr-1 text-amber-500" />
                Paused
              </th>
              <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-[20%]">Overall %</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {employeeSummaries.map((summary) => (
              <tr key={summary.name} className="hover:bg-indigo-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    {summary.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-red-700">{summary.backlog}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-blue-700">{summary.inProgress}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-emerald-700">{summary.completed}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-amber-700">{summary.paused}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-extrabold text-indigo-600">
                  {summary.completionPercentage}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeTaskSummaryTable;