import React, { useMemo } from 'react';
import { Task } from '../page';
import { BarChart2, Users, ListTodo, CheckCircle } from 'lucide-react';

interface TaskChartViewProps {
    tasks: Task[];
}

const useChartData = (tasks: Task[]) => {
    return useMemo(() => {
        const tasksByStatus = tasks.reduce((acc, task) => {
            const status = task.status || 'Backlog';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        const tasksByAssignee = tasks.reduce((acc, task) => {
            const assignee = task.assigneeName || 'Unassigned';
            acc[assignee] = (acc[assignee] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        const tasksByCompletion = tasks.reduce((acc, task) => {
            if (task.completion === 100) {
                acc.completed = (acc.completed || 0) + 1;
            } else if (task.completion > 0) {
                acc.inProgress = (acc.inProgress || 0) + 1;
            } else {
                acc.notStarted = (acc.notStarted || 0) + 1;
            }
            return acc;
        }, {} as { completed?: number, inProgress?: number, notStarted?: number });


        const totalTasks = tasks.length;

        return {
            tasksByStatus,
            tasksByAssignee,
            tasksByCompletion,
            totalTasks,
        };
    }, [tasks]);
};

const getStatusColor = (status: string): string => {
    switch (status) {
        case 'Completed': return 'bg-emerald-500';
        case 'In Progress': return 'bg-blue-500';
        case 'Backlog': return 'bg-gray-500';
        case 'Dev Review': return 'bg-purple-500';
        case 'Paused': return 'bg-amber-500';
        default: return 'bg-slate-400';
    }
};

const getCompletionColor = (key: 'completed' | 'inProgress' | 'notStarted'): string => {
    switch (key) {
        case 'completed': return 'bg-emerald-600';
        case 'inProgress': return 'bg-blue-600';
        case 'notStarted': return 'bg-red-600';
        default: return 'bg-slate-400';
    }
}

const DonutChartPlaceholder: React.FC<{ data: { [key: string]: number }, total: number }> = ({ data, total }) => {
    const segments: { key: string, count: number, percentage: number, color: string }[] = useMemo(() => {
        const sortedKeys = ['completed', 'inProgress', 'notStarted'] as const;
        return sortedKeys.map(key => {
            const count = data[key] || 0;
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            return {
                key,
                count,
                percentage,
                color: getCompletionColor(key),
            };
        });
    }, [data, total]);

    let cumulativePercent = 0;
    const conics = segments.map(({ percentage, color }) => {
        const start = cumulativePercent;
        cumulativePercent += percentage;
        const end = cumulativePercent;

        return `${color} ${start}% ${end}%`;
    }).join(', ');
    
    if (total === 0) return <div className="text-center text-slate-500 py-10">No completion data.</div>;

    return (
        <div className="flex items-center justify-center p-4">
            <div 
                className="w-48 h-48 rounded-full relative shadow-inner flex items-center justify-center" 
                style={{
                    background: `conic-gradient(${conics})`,
                }}
            >
                <div className="absolute w-32 h-32 bg-white rounded-full flex items-center justify-center border-4 border-slate-100">
                    <span className="text-3xl font-extrabold text-indigo-600">{total}</span>
                </div>
            </div>
        </div>
    );
};


const TaskChartView: React.FC<TaskChartViewProps> = ({ tasks }) => {
    const { tasksByStatus, tasksByAssignee, tasksByCompletion, totalTasks } = useChartData(tasks);

    if (totalTasks === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
                <BarChart2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-slate-700">No Data to Display</h3>
                <p className="text-slate-500">Adjust the filters to view task analytics.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 rounded-full">
                        <BarChart2 className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Task Analytics Overview</h2>
                </div>
                <div className="text-right">
                    <p className="text-4xl font-extrabold text-indigo-600">{totalTasks}</p>
                    <p className="text-sm font-medium text-slate-500">Total Filtered Tasks</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 lg:col-span-1">
                    <div className="flex items-center gap-3 mb-6">
                        <CheckCircle className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-xl font-semibold text-gray-900">Completion Status</h3>
                    </div>
                    
                    <DonutChartPlaceholder data={tasksByCompletion} total={totalTasks} />
                    
                    <div className="mt-6 space-y-2">
                        {Object.entries(tasksByCompletion).map(([key, count]) => (
                            <div key={key} className="flex justify-between items-center text-sm font-medium text-slate-700">
                                <span className="flex items-center gap-2">
                                    <span className={`w-3 h-3 rounded-full ${getCompletionColor(key as 'completed' | 'inProgress' | 'notStarted')}`}></span>
                                    {key === 'completed' ? 'Completed (100%)' : key === 'inProgress' ? 'In Progress (1-99%)' : 'Not Started (0%)'}
                                </span>
                                <span className="font-bold">{count} tasks ({totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0}%)</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <ListTodo className="w-5 h-5 text-blue-600" />
                        <h3 className="text-xl font-semibold text-gray-900">Tasks By Status</h3>
                    </div>
                    
                    <div className="space-y-4 pt-2">
                        {Object.entries(tasksByStatus).sort(([, a], [, b]) => b - a).map(([status, count]) => (
                            <div key={status} className="flex items-center">
                                <span className="text-sm font-medium text-slate-700 w-32">{status}</span>
                                <div className="flex-1 ml-4 bg-slate-200 rounded-full h-8 overflow-hidden relative">
                                    <div 
                                        className={`${getStatusColor(status)} h-full transition-all duration-500`}
                                        style={{ width: `${(count / totalTasks) * 100}%` }}
                                    ></div>
                                    <span className="absolute inset-0 flex items-center justify-end pr-3 text-sm font-bold text-white shadow-text">
                                        {count} ({Math.round((count / totalTasks) * 100)}%)
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

             <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Users className="w-5 h-5 text-green-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Tasks By Assignee</h3>
                </div>

                <div className="space-y-4 pt-2">
                    {Object.entries(tasksByAssignee).sort(([, a], [, b]) => b - a).map(([assignee, count]) => (
                        <div key={assignee} className="flex items-center">
                            <span className="text-sm font-medium text-slate-700 w-32">{assignee}</span>
                            <div className="flex-1 ml-4 bg-slate-200 rounded-full h-8 overflow-hidden relative">
                                <div 
                                    className={`bg-green-500 h-full transition-all duration-500`}
                                    style={{ width: `${(count / totalTasks) * 100}%` }}
                                ></div>
                                <span className="absolute inset-0 flex items-center justify-end pr-3 text-sm font-bold text-white shadow-text">
                                    {count} ({Math.round((count / totalTasks) * 100)}%)
                                
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TaskChartView;