// ./components/TaskBoardView.tsx
import React, { useMemo } from 'react';
import { Task } from './types'; 
// Import only the icons needed for the summary table
import { TrendingUp, User, AlertCircle, Clock, CheckCircle2, Pause, Zap } from 'lucide-react';

// The props are simplified as DND logic is removed, but kept to match the TasksPage.tsx caller signature.
interface TaskBoardViewProps {
    tasks: Task[];
    openTaskModal: (task: Task) => void;
    onTaskStatusChange: (taskId: string, newStatus: string) => void;
}

interface EmployeeSummary {
  name: string;
  backlog: number;
  inProgress: number;
  completed: number;
  paused: number;
  totalTasks: number;
  avgTaskCompletion: number;
  punctualityScore: number; 
  finalHikePercentage: string;
}

/**
 * Mocks punctuality/attendance data (50% of the Hike calculation).
 * @param employeeName The name of the employee.
 * @returns A mock attendance score (85% to 100%)
 */
const getMockPunctuality = (employeeName: string): number => {
    // Simple mock: give 'Unassigned' 0, others random 85-100
    if (employeeName === 'Unassigned') return 0;
    // Use employee name length and character code for a deterministic but variable mock score
    const seed = employeeName.length % 10;
    return Math.min(85 + (seed * 1.5) + (employeeName.charCodeAt(0) % 5), 100);
};

/**
 * Calculates the final hike percentage based on task completion and punctuality.
 * Weighting: 50% Task Completion, 50% Punctuality.
 */
const calculateFinalHike = (avgTaskCompletion: number, punctualityScore: number): number => {
    const taskWeight = 0.5;
    const punctualityWeight = 0.5;
    
    // Formula: (Task Score * 0.5) + (Punctuality Score * 0.5)
    return (avgTaskCompletion * taskWeight) + (punctualityScore * punctualityWeight);
};


// The main component is now a static summary table.
const TaskBoardView: React.FC<TaskBoardViewProps> = ({ tasks }) => {

    const employeeSummaries: EmployeeSummary[] = useMemo(() => {
        
        // 1. Collect all unique assignees and initialize map
        const uniqueAssignees = new Set<string>();
        tasks.forEach(task => {
            task.assigneeNames?.forEach(name => uniqueAssignees.add(name.trim()));
            if (!task.assigneeNames || task.assigneeNames.length === 0) {
                uniqueAssignees.add('Unassigned');
            }
        });

        const employeeMap = new Map<string, EmployeeSummary>();
        uniqueAssignees.forEach(name => {
            const punctuality = getMockPunctuality(name);
            employeeMap.set(name, {
                name: name,
                backlog: 0,
                inProgress: 0,
                completed: 0,
                paused: 0,
                totalTasks: 0,
                avgTaskCompletion: 0,
                punctualityScore: punctuality,
                finalHikePercentage: "0.00%",
            });
        });


        // 2. Process tasks and aggregate counts/completion sums
        const employeeTaskCompletionSums = new Map<string, { sum: number, count: number }>();

        tasks.forEach(task => {
            const assignees = task.assigneeNames && task.assigneeNames.length > 0 ? task.assigneeNames : ['Unassigned'];

            assignees.forEach(assigneeName => {
                const name = assigneeName.trim() || 'Unassigned';
                if (!employeeMap.has(name)) return;
                
                const summary = employeeMap.get(name)!;

                // Update task status counts
                summary.totalTasks++;
                switch (task.status) {
                    case 'Backlog': summary.backlog++; break;
                    case 'In Progress': summary.inProgress++; break;
                    case 'Completed': summary.completed++; break;
                    case 'Paused':
                    case 'On Hold': summary.paused++; break;
                    default: summary.inProgress++; break;
                }
                
                // Track completion sum for average calculation
                const current = employeeTaskCompletionSums.get(name) || { sum: 0, count: 0 };
                current.sum += task.completion || 0;
                current.count++;
                employeeTaskCompletionSums.set(name, current);
            });
        });

        // 3. Calculate Final Averages and Hike Percentage
        const summariesArray = Array.from(employeeMap.values()).map(summary => {
            const completionData = employeeTaskCompletionSums.get(summary.name);
            
            const avgCompletion = completionData && completionData.count > 0 
                ? completionData.sum / completionData.count 
                : 0;
            
            // Calculate the Final Hike Score
            const hikeScore = calculateFinalHike(avgCompletion, summary.punctualityScore);

            return {
                ...summary,
                avgTaskCompletion: avgCompletion,
                finalHikePercentage: `${hikeScore.toFixed(2)}%`,
            };
        }).filter(s => s.totalTasks > 0 || s.name === 'Unassigned'); // Only display employees with tasks

        // Sort by Final Hike Percentage (descending)
        return summariesArray.sort((a, b) => parseFloat(b.finalHikePercentage) - parseFloat(a.finalHikePercentage));

    }, [tasks]);

    if (employeeSummaries.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-slate-700">No Task Assignments Found</h3>
                <p className="text-slate-500">No tasks are currently assigned to track performance.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-indigo-700 to-indigo-600 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <User className="w-6 h-6 text-white" />
                    <h2 className="text-xl font-bold text-white">Employee Performance & Hike Projection</h2>
                </div>
                <div className="text-sm font-medium text-indigo-100">
                    * Final Hike calculated as: (50% Avg Task Completion) + (50% Punctuality Mock Score)
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead>
                        <tr className="bg-slate-50">
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-[15%]">Employee</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-[10%]">
                                <AlertCircle className="w-4 h-4 inline-block mr-1 text-red-500" />
                                Backlog
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-[10%]">
                                <Clock className="w-4 h-4 inline-block mr-1 text-blue-500" />
                                In Progress
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-[10%]">
                                <CheckCircle2 className="w-4 h-4 inline-block mr-1 text-emerald-500" />
                                Completed
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-[10%]">
                                <Pause className="w-4 h-4 inline-block mr-1 text-amber-500" />
                                Paused
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-[15%]">
                                Avg Task %
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider w-[15%]">
                                <Zap className="w-4 h-4 inline-block mr-1 text-purple-500" />
                                Punctuality %
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-white bg-green-600 uppercase tracking-wider w-[15%]">
                                <TrendingUp className="w-4 h-4 inline-block mr-1" />
                                Final Hike %
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {employeeSummaries.map((summary) => (
                            <tr key={summary.name} className="hover:bg-indigo-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    <span className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-slate-500" />
                                        {summary.name}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-red-700">{summary.backlog}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-blue-700">{summary.inProgress}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-emerald-700">{summary.completed}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-amber-700">{summary.paused}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-semibold text-indigo-600">
                                    {summary.avgTaskCompletion.toFixed(1)}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-semibold text-purple-600">
                                    {summary.punctualityScore.toFixed(1)}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-lg font-extrabold text-green-700 bg-green-50">
                                    {summary.finalHikePercentage}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TaskBoardView;