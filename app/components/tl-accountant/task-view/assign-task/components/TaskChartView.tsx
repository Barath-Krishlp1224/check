import React, { useMemo } from "react";
import { AlertCircle, TrendingUp, Clock, Users, CheckCircle2, Play, Inbox } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

// Types
interface Subtask {
  assigneeName?: string;
  timeSpent?: string;
  subtasks?: Subtask[];
}

interface Task {
  status?: string;
  completion?: number;
  assigneeNames?: string[];
  subtasks?: Subtask[];
  taskTimeSpent?: string;
  projectId?: string;
  project?: string;
}

interface TaskChartViewProps {
  tasks: Task[];
}

// ---------- UTIL: FLATTEN SUBTASKS (handles nested subtasks) ----------
const flattenSubtasks = (subs: Subtask[] = []): Subtask[] => {
  const result: Subtask[] = [];
  const stack = [...subs];

  while (stack.length > 0) {
    const current = stack.pop()!;
    result.push(current);
    if (current.subtasks && current.subtasks.length > 0) {
      stack.push(...current.subtasks);
    }
  }

  return result;
};

// ---------- UTIL: PARSE "timeSpent" STRINGS INTO HOURS ----------
const parseTimeToHours = (raw?: string | null): number => {
  if (!raw) return 0;

  const value = raw.trim().toLowerCase();
  if (!value) return 0;

  // "2:30" -> 2.5h
  if (value.includes(":")) {
    const [hStr, mStr] = value.split(":");
    const h = Number(hStr) || 0;
    const m = Number(mStr) || 0;
    return h + m / 60;
  }

  // "2h 30m", "1.5h", "45m", "2 h", etc.
  const hourMatch = value.match(/(\d+(\.\d+)?)\s*h/);
  const minuteMatch = value.match(/(\d+(\.\d+)?)\s*m/);

  let hours = 0;

  if (hourMatch) {
    hours += parseFloat(hourMatch[1]);
  }
  if (minuteMatch) {
    hours += parseFloat(minuteMatch[1]) / 60;
  }

  // if no "h" or "m" found but it's a number, treat as hours
  if (!hourMatch && !minuteMatch) {
    const asNumber = Number(value);
    if (!Number.isNaN(asNumber)) {
      hours += asNumber;
    }
  }

  return hours;
};

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  cyan: '#06b6d4',
  pink: '#ec4899',
};

const STATUS_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

const TaskChartView: React.FC<TaskChartViewProps> = ({ tasks }) => {
  // ---------- BASIC METRICS ----------
  const totalTasks = tasks.length;

  const completedCount = useMemo(
    () => tasks.filter((t) => t.status === "Completed").length,
    [tasks]
  );

  const inProgressCount = useMemo(
    () => tasks.filter((t) => t.status === "In Progress").length,
    [tasks]
  );

  const backlogCount = useMemo(
    () => tasks.filter((t) => t.status === "Backlog").length,
    [tasks]
  );

  const avgCompletion = useMemo(() => {
    if (tasks.length === 0) return 0;
    const sum = tasks.reduce((acc, t) => acc + (t.completion || 0), 0);
    return Math.round(sum / tasks.length);
  }, [tasks]);

  // ---------- FLATTENED SUBTASKS ----------
  const allSubtasks = useMemo(
    () => tasks.flatMap((t) => flattenSubtasks(t.subtasks || [])),
    [tasks]
  );

  // ---------- TOTAL HOURS (tasks + subtasks) ----------
  const totalHours = useMemo(() => {
    const perTaskHours = tasks.map((task) => {
      const explicit = parseTimeToHours(task.taskTimeSpent);
      if (explicit > 0) return explicit;

      const subs = flattenSubtasks(task.subtasks || []);
      const subHours = subs.reduce(
        (acc, s) => acc + parseTimeToHours(s.timeSpent),
        0
      );
      return subHours;
    });

    const total = perTaskHours.reduce((acc, h) => acc + h, 0);
    return Number(total.toFixed(2));
  }, [tasks]);

  // ---------- STATUS DATA ----------
  const statusData = useMemo(() => {
    const map = new Map<
      string,
      { status: string; count: number; totalCompletion: number }
    >();

    tasks.forEach((task) => {
      const key = task.status || "Unknown";
      if (!map.has(key)) {
        map.set(key, { status: key, count: 0, totalCompletion: 0 });
      }
      const entry = map.get(key)!;
      entry.count += 1;
      entry.totalCompletion += task.completion || 0;
    });

    return Array.from(map.values()).map((entry) => ({
      status: entry.status,
      count: entry.count,
      avgCompletion: entry.count
        ? Math.round(entry.totalCompletion / entry.count)
        : 0,
    }));
  }, [tasks]);

  // ---------- ASSIGNEE DATA (TASK COUNT) ----------
  const assigneeData = useMemo(() => {
    const map = new Map<
      string,
      { assignee: string; count: number; totalCompletion: number }
    >();

    tasks.forEach((task) => {
      const assignees =
        task.assigneeNames && task.assigneeNames.length > 0
          ? task.assigneeNames
          : ["Unassigned"];

      assignees.forEach((name) => {
        if (!map.has(name)) {
          map.set(name, { assignee: name, count: 0, totalCompletion: 0 });
        }
        const entry = map.get(name)!;
        entry.count += 1;
        entry.totalCompletion += task.completion || 0;
      });
    });

    return Array.from(map.values()).map((entry) => ({
      assignee: entry.assignee,
      count: entry.count,
      avgCompletion: entry.count
        ? Math.round(entry.totalCompletion / entry.count)
        : 0,
    }));
  }, [tasks]);

  // ---------- HOURS BY ASSIGNEE (FROM SUBTASKS) ----------
  const hoursByAssigneeData = useMemo(() => {
    const map = new Map<string, number>();

    allSubtasks.forEach((sub) => {
      const name = sub.assigneeName || "Unassigned";
      const hours = parseTimeToHours(sub.timeSpent);
      if (!hours) return;
      map.set(name, (map.get(name) || 0) + hours);
    });

    return Array.from(map.entries()).map(([assignee, hours]) => ({
      assignee,
      hours: Number(hours.toFixed(2)),
    }));
  }, [allSubtasks]);

  // ---------- HOURS BY TASK ----------
  const hoursByTaskData = useMemo(() => {
    const result = tasks.map((task) => {
      const explicit = parseTimeToHours(task.taskTimeSpent);

      const subs = flattenSubtasks(task.subtasks || []);
      const subHours = subs.reduce(
        (acc, s) => acc + parseTimeToHours(s.timeSpent),
        0
      );

      const hours = explicit > 0 ? explicit : subHours;
      return {
        task: task.projectId || task.project || "Untitled Task",
        hours: Number(hours.toFixed(2)),
      };
    });

    return result.filter((d) => d.hours > 0);
  }, [tasks]);

  // ---------- EMPTY STATE ----------
  if (tasks.length === 0) {
    return (
      <div className="min-h-96 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-inner border border-slate-200 p-12 mt-6">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-6">
            <AlertCircle className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-3">
            No Data Available
          </h3>
          <p className="text-slate-600 leading-relaxed">
            The current filter returned zero tasks. Adjust the filters in the
            header to see comprehensive analytics and insights.
          </p>
        </div>
      </div>
    );
  }

  const hasAnyHours =
    totalHours > 0 ||
    hoursByAssigneeData.length > 0 ||
    hoursByTaskData.length > 0;

  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="mt-6 space-y-6">
      {/* ---------- HERO METRICS CARDS ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tasks */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform transition-all hover:scale-105 hover:shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold mb-1">{totalTasks}</p>
              <p className="text-blue-100 text-sm font-medium">Total Tasks</p>
            </div>
          </div>
          <div className="pt-3 border-t border-white/20">
            <p className="text-xs text-blue-100">Filtered view</p>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white transform transition-all hover:scale-105 hover:shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold mb-1">{completedCount}</p>
              <p className="text-emerald-100 text-sm font-medium">Completed</p>
            </div>
          </div>
          <div className="pt-3 border-t border-white/20">
            <p className="text-xs text-emerald-100">{completionRate}% completion rate</p>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg p-6 text-white transform transition-all hover:scale-105 hover:shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Play className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold mb-1">{inProgressCount}</p>
              <p className="text-amber-100 text-sm font-medium">In Progress</p>
            </div>
          </div>
          <div className="pt-3 border-t border-white/20">
            <p className="text-xs text-amber-100">Active tasks</p>
          </div>
        </div>

        {/* Hours & Backlog */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white transform transition-all hover:scale-105 hover:shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Clock className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold mb-1">
                {hasAnyHours ? totalHours.toFixed(1) : "0"}
              </p>
              <p className="text-purple-100 text-sm font-medium">Hours Logged</p>
            </div>
          </div>
          <div className="pt-3 border-t border-white/20">
            <p className="text-xs text-purple-100">
              {backlogCount} in backlog • {avgCompletion}% avg
            </p>
          </div>
        </div>
      </div>

      {/* ---------- STATUS & ASSIGNEE OVERVIEW ---------- */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-5 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Task Distribution by Status
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Overview of task counts and completion rates
            </p>
          </div>
          <div className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 50 }}
                >
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="status"
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    height={60}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="count" name="Task Count" fill="url(#colorCount)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="avgCompletion" name="Avg Completion (%)" fill="url(#colorCompletion)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Assignee Distribution */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-5 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              Task Allocation by Assignee
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Team workload and completion metrics
            </p>
          </div>
          <div className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={assigneeData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 70 }}
                >
                  <defs>
                    <linearGradient id="colorAssignee" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="colorAssigneeComp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="assignee"
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    height={70}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="count" name="Task Count" fill="url(#colorAssignee)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="avgCompletion" name="Avg Completion (%)" fill="url(#colorAssigneeComp)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- WORKING HOURS ANALYTICS ---------- */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Working Hours Analytics
              </h3>
              <p className="text-sm text-slate-600">
                Time tracking and effort distribution
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {!hasAnyHours ? (
            <div className="text-center py-12 px-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-2xl mb-4">
                <Clock className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 max-w-lg mx-auto">
                No <span className="font-mono text-sm bg-slate-100 px-2 py-0.5 rounded">timeSpent</span> or{' '}
                <span className="font-mono text-sm bg-slate-100 px-2 py-0.5 rounded">taskTimeSpent</span> data
                available yet. Start logging hours on tasks and subtasks to see detailed analytics here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Hours by Assignee */}
              <div>
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-slate-800 mb-1">
                    Hours by Team Member
                  </h4>
                  <p className="text-xs text-slate-500">
                    Aggregated from subtask time entries
                  </p>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={hoursByAssigneeData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 70 }}
                    >
                      <defs>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="assignee"
                        angle={-25}
                        textAnchor="end"
                        interval={0}
                        height={70}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="hours" name="Hours Logged" fill="url(#colorHours)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Hours by Task */}
              <div>
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-slate-800 mb-1">
                    Hours by Task
                  </h4>
                  <p className="text-xs text-slate-500">
                    Priority to <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px]">taskTimeSpent</span>, fallback to subtask sum
                  </p>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={hoursByTaskData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 70 }}
                    >
                      <defs>
                        <linearGradient id="colorTaskHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="task"
                        angle={-25}
                        textAnchor="end"
                        interval={0}
                        height={70}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="hours" name="Hours Logged" fill="url(#colorTaskHours)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default TaskChartView;