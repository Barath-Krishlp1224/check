"use client";

import React, { useMemo } from "react";
import { AlertCircle, User, Download } from "lucide-react";

export interface Subtask {
  id?: string;
  title: string;
  assigneeName?: string;
  status: string;
  completion: number;
  remarks?: string;
}

export interface Task {
  _id: string;
  projectId: string;
  project: string;
  assigneeName: string;
  startDate: string;
  endDate?: string;
  dueDate: string;
  completion: number;
  status: "Backlog" | "In Progress" | "Dev Review" | "Deployed in QA" | "Test In Progress" | "QA Sign Off" | "Deployment Stage" | "Pilot Test" | "Completed" | "Paused" | string;
  remarks?: string;
  subtasks?: Subtask[];
}

export interface EmployeeSummary {
  employeeName: string;
  totalTasks: number;
  completed: number;
  inProgress: number;
  paused: number;
  completionRate: number;
  dueDateAdherenceScore: number;
  subtaskCompletionRate: number;
}

export interface OverallPerformanceScore {
  employeeName: string;
  overallScore: number;
  completionRate: number;
  inProgressLoad: number;
  attendance: number;
  adherence: number;
  subtasks: number;
  incentiveHike: number;
}

interface ViewProps {
  employeeSummaries: EmployeeSummary[];
  onDownloadEmployeeReport: (employeeName: string) => void; 
}

const calculateIncentivePercentage = (overallScore: number): number => {
  if (overallScore >= 95) return 20;
  if (overallScore >= 80) return 15;
  if (overallScore >= 75) return 10;
  if (overallScore >= 70) return 8;
  if (overallScore >= 60) return 5;
  if (overallScore >= 50) return 3;
  return 0;
};

const TaskOverallView: React.FC<ViewProps> = ({ employeeSummaries, onDownloadEmployeeReport }) => {
  const overallScores: OverallPerformanceScore[] = useMemo(() => {
    const attendanceData = new Map<string, number>([
      ["john doe", 98],
      ["jane smith", 95],
      ["unassigned", 100],
    ]);
    const WEIGHTS = {
      taskCompletion: 0.50,
      inProgressLoad: 0.10,
      attendance: 0.10,
      dueDateAdherence: 0.20,
      subtaskCompletion: 0.10,
    };

    return employeeSummaries.map(summary => {
      const lowerName = summary.employeeName.toLowerCase();
      const attendance = attendanceData.get(lowerName) || 85;
        
      const completion = summary.completionRate; 

      const inProgressLoadScore = Math.max(0, 100 - (summary.inProgress * 5)); 

      const attendanceScore = attendance;

      const adherence = summary.dueDateAdherenceScore;

      const subtasks = summary.subtaskCompletionRate;

      const overallScore = Math.round(
        (completion * WEIGHTS.taskCompletion) +
        (inProgressLoadScore * WEIGHTS.inProgressLoad) +
        (attendanceScore * WEIGHTS.attendance) +
        (adherence * WEIGHTS.dueDateAdherence) +
        (subtasks * WEIGHTS.subtaskCompletion)
      );

      const incentiveHike = calculateIncentivePercentage(overallScore);

      return {
        employeeName: summary.employeeName,
        overallScore,
        completionRate: completion,
        inProgressLoad: inProgressLoadScore,
        attendance: attendanceScore,
        adherence: adherence,
        subtasks: subtasks,
        incentiveHike,
      };
    }).sort((a, b) => b.overallScore - a.overallScore);
  }, [employeeSummaries]);


  if (overallScores.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mt-6">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No data to calculate Overall Score</h3>
          <p className="text-slate-500">Ensure tasks are assigned and filters are set correctly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Overall Performance View 🏆</h2>
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-indigo-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider sticky top-0 bg-indigo-50 z-10">Employee Name</th>
              <th className="px-3 py-3 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider sticky top-0 bg-indigo-50 z-10">Completion Rate (50%)</th>
              <th className="px-3 py-3 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider sticky top-0 bg-indigo-50 z-10">In-Progress Load (10%)</th>
              <th className="px-3 py-3 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider sticky top-0 bg-indigo-50 z-10">Attendance (10%)</th>
              <th className="px-3 py-3 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider sticky top-0 bg-indigo-50 z-10">Due Date Adherence (20%)</th>
              <th className="px-3 py-3 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider sticky top-0 bg-indigo-50 z-10">Subtask Completion (10%)</th>
              <th className="px-6 py-3 text-center text-sm font-extrabold text-indigo-800 uppercase tracking-wider sticky top-0 bg-indigo-50 z-10">Overall Score</th>
              <th className="px-6 py-3 text-center text-sm font-extrabold text-indigo-800 uppercase tracking-wider sticky top-0 bg-indigo-50 z-10">Incentive Hike (%)</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider sticky top-0 bg-indigo-50 z-10">Report</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {overallScores.map((scoreSummary) => (
              <tr 
                key={scoreSummary.employeeName} 
                className="hover:bg-indigo-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-indigo-600" />
                    {scoreSummary.employeeName}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">{scoreSummary.completionRate}%</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">{scoreSummary.inProgressLoad}%</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">{scoreSummary.attendance}%</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">{scoreSummary.adherence}%</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">{scoreSummary.subtasks}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-lg text-center font-extrabold text-white">
                  <span 
                    className={`px-3 py-1 rounded-full ${
                      scoreSummary.overallScore >= 90 ? 'bg-emerald-600' :
                      scoreSummary.overallScore >= 70 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                  >
                    {scoreSummary.overallScore}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-lg text-center font-extrabold">
                  <span 
                    className={`px-3 py-1 rounded-full text-white ${
                      scoreSummary.incentiveHike >= 15 ? 'bg-indigo-600' :
                      scoreSummary.incentiveHike >= 8 ? 'bg-teal-500' :
                      scoreSummary.incentiveHike > 0 ? 'bg-orange-500' :
                      'bg-slate-400'
                    }`}
                  >
                    {scoreSummary.incentiveHike}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <button
                        onClick={() => onDownloadEmployeeReport(scoreSummary.employeeName)}
                        className="p-2 rounded-full text-indigo-600 hover:bg-indigo-100 transition-colors"
                        title={`Download detailed report for ${scoreSummary.employeeName}`}
                    >
                        <Download className="w-5 h-5" />
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TaskTableView: React.FC<ViewProps> = ({ employeeSummaries, onDownloadEmployeeReport }) => {
  if (employeeSummaries.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mt-6">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No employee data found</h3>
          <p className="text-slate-500">Adjust the current filter or ensure tasks are assigned to employees.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mt-6">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider sticky top-0 bg-slate-50 z-10">Employee Name</th>
            <th className="px-3 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider sticky top-0 bg-slate-50 z-10">Total Tasks</th>
            <th className="px-3 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider sticky top-0 bg-slate-50 z-10">Completed</th>
            <th className="px-3 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider sticky top-0 bg-slate-50 z-10">In Progress</th>
            <th className="px-3 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider sticky top-0 bg-slate-50 z-10">On Hold/Paused</th>
            <th className="px-3 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider sticky top-0 bg-slate-50 z-10">Completion %</th>
            <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider sticky top-0 bg-slate-50 z-10">Report</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {employeeSummaries.map((summary) => (
            <tr 
              key={summary.employeeName} 
              className="hover:bg-indigo-50 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-indigo-600" />
                  {summary.employeeName}
                </div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-900">
                {summary.totalTasks}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-semibold">
                {summary.completed}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-semibold">
                {summary.inProgress}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-semibold">
                {summary.paused}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                <div className="flex items-center justify-center">
                  <div className="w-20 bg-slate-200 rounded-full h-2 mr-2">
                    <div 
                      className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${summary.completionRate}%` }}
                    />
                  </div>
                  <span className="font-semibold text-gray-900">{summary.completionRate}%</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <button
                        onClick={() => onDownloadEmployeeReport(summary.employeeName)}
                        className="p-2 rounded-full text-indigo-600 hover:bg-indigo-100 transition-colors"
                        title={`Download detailed report for ${summary.employeeName}`}
                    >
                        <Download className="w-5 h-5" />
                    </button>
                </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskOverallView;
export { TaskTableView };