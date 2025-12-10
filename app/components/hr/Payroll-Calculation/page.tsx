"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Calendar,
  Loader2,
  XCircle,
  Filter,
  Download,
  RefreshCw,
  DollarSign,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  MessageSquare,
  Award,
} from "lucide-react";

type AttendanceMode =
  | "IN_OFFICE"
  | "WORK_FROM_HOME"
  | "ON_DUTY"
  | "REGULARIZATION";

interface AttendanceRecord {
  _id: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  punchInTime?: string | null;
  punchOutTime?: string | null;
  mode?: AttendanceMode;
}

interface Employee {
  employeeId: string;
  employeeName?: string;
  department?: string | null;
  role?: string | null;
  team?: string | null;
  category?: string | null;
  baseSalary?: number;
  performanceScore?: number;
  certifications?: number;
  behaviorRating?: number;
}

interface HikeCalculatorProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  fromDate: string;
  toDate: string;
}

// Define the type for date presets
type DatePreset = "CUSTOM" | "1W" | "1M" | "3M" | "6M" | "9M" | "1Y";

const getTodayDateString = () => new Date().toISOString().slice(0, 10);
const getDateKey = (value?: string) => (value ? value.slice(0, 10) : "");

const MAX_STRICT_POINTS = 50;
const MAX_GENERAL_POINTS = 20;
const MAX_BEHAVIOR_POINTS = 15;
const MAX_GROWTH_POINTS = 15;
const LATE_THRESHOLD_MINUTES = 5;
const TARDINESS_POINT_LOSS_PER_MINUTE = 0.5;
const ABSENCE_POINT_LOSS = 10;
const BASE_HIKE_PERCENT = 0.00;

const getStatusLabel = (record: AttendanceRecord): { isLate: boolean; isAbsent: boolean; lateMinutes: number } => {
  const { punchInTime, punchOutTime, date } = record;
  const recordDateKey = getDateKey(date);
  
  if (!punchInTime || !punchOutTime) return { isLate: false, isAbsent: true, lateMinutes: 0 };
  
  try {
    const refDate = new Date(`${recordDateKey}T00:00:00`);
    const punchIn = new Date(punchInTime);
    
    const officialStartTime = new Date(refDate);
    officialStartTime.setHours(9, 0, 0, 0);

    let isLate = false;
    let lateMinutes = 0;

    if (punchIn.getTime() > officialStartTime.getTime()) {
      const diffMs = punchIn.getTime() - officialStartTime.getTime();
      const diffMinutes = Math.round(diffMs / 60000);

      if (diffMinutes > LATE_THRESHOLD_MINUTES) {
        isLate = true;
        lateMinutes = diffMinutes - LATE_THRESHOLD_MINUTES;
      }
    }
    
    return { isLate, isAbsent: false, lateMinutes };
  } catch {
    return { isLate: false, isAbsent: false, lateMinutes: 0 };
  }
};

const isFounder = (emp: Employee): boolean => {
  const combined = `${emp.role ?? ""} ${emp.category ?? ""} ${
    emp.team ?? ""
  }`.toLowerCase();
  return combined.includes("founder");
};

const getHikePercentage = (finalScore: number): number => {
    if (finalScore >= 95) return 0.18;
    if (finalScore >= 90) return 0.15;
    if (finalScore >= 80) return 0.10;
    if (finalScore >= 70) return 0.06;
    if (finalScore >= 60) return 0.03;
    if (finalScore >= 50) return 0.01;
    return 0.00;
};

const HikeCalculator: React.FC<HikeCalculatorProps> = ({
  employees,
  attendanceRecords,
  fromDate,
  toDate,
}) => {
  const hikeData = useMemo(() => {
    const nonFounderEmployees = employees.filter((emp) => !isFounder(emp) && emp.baseSalary);
    const metricsMap = new Map<string, { totalLateMinutes: number; totalAbsentDays: number; totalWorkingDays: number }>();
    
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const dateRange = new Map<string, boolean>();
    let current = new Date(start);

    while (current <= end) {
        dateRange.set(current.toISOString().slice(0, 10), true);
        current.setDate(current.getDate() + 1);
    }
    const totalExpectedDays = dateRange.size;

    attendanceRecords.forEach((record) => {
      const status = getStatusLabel(record);
      const recordDateKey = getDateKey(record.date);

      if (!metricsMap.has(record.employeeId)) {
        metricsMap.set(record.employeeId, { totalLateMinutes: 0, totalAbsentDays: 0, totalWorkingDays: 0 });
      }
      const metrics = metricsMap.get(record.employeeId)!;
      
      if(dateRange.has(recordDateKey)) {
          metrics.totalWorkingDays += 1;
      }
      
      if (!status.isAbsent) {
        metrics.totalLateMinutes += status.lateMinutes;
      }
    });

    const results = nonFounderEmployees.map((emp) => {
      const currentSalary = emp.baseSalary!;
      const behaviorRating = emp.behaviorRating || 3; 
      const certifications = emp.certifications || 0;
      const metrics = metricsMap.get(emp.employeeId) || { totalLateMinutes: 0, totalAbsentDays: 0, totalWorkingDays: 0 };
      
      const actualWorkingDays = metrics.totalWorkingDays;
      const totalAbsences = totalExpectedDays - actualWorkingDays;
      
      let strictPoints = MAX_STRICT_POINTS;
      strictPoints -= totalAbsences * ABSENCE_POINT_LOSS;
      strictPoints -= metrics.totalLateMinutes * TARDINESS_POINT_LOSS_PER_MINUTE;
      strictPoints = Math.max(0, strictPoints);
      
      const attendancePenaltyFactor = (strictPoints / MAX_STRICT_POINTS);
      let generalPoints = MAX_GENERAL_POINTS * attendancePenaltyFactor;
      generalPoints = Math.max(0, generalPoints);

      const normalizedBehaviorScore = (behaviorRating / 5) * MAX_BEHAVIOR_POINTS;
      
      const growthPoints = Math.min(certifications * 5, MAX_GROWTH_POINTS);

      const finalScore = strictPoints + generalPoints + normalizedBehaviorScore + growthPoints;
      
      const finalHikeRate = getHikePercentage(finalScore);
      const finalHikeAmount = currentSalary * finalHikeRate;
      const newSalary = currentSalary + finalHikeAmount;

      return {
        employeeId: emp.employeeId,
        employeeName: emp.employeeName || emp.employeeId,
        currentSalary: Number(currentSalary.toFixed(0)),
        finalScore: Number(finalScore.toFixed(0)),
        strictPoints: Number(strictPoints.toFixed(0)),
        generalPoints: Number(generalPoints.toFixed(0)),
        behaviorPoints: Number(normalizedBehaviorScore.toFixed(0)),
        growthPoints: Number(growthPoints.toFixed(0)),
        totalAbsences,
        totalLateMinutes: metrics.totalLateMinutes,
        finalHikeRate: Number((finalHikeRate * 100).toFixed(2)),
        finalHikeAmount: Number(finalHikeAmount.toFixed(0)),
        newSalary: Number(newSalary.toFixed(0)),
      };
    }).sort((a, b) => b.finalScore - a.finalScore);

    const totalCurrentSalary = results.reduce((acc, r) => acc + r.currentSalary, 0);
    const totalNewSalary = results.reduce((acc, r) => acc + r.newSalary, 0);
    const totalHikeBudget = results.reduce((acc, r) => acc + r.finalHikeAmount, 0);
    const averageHikeRate = totalCurrentSalary > 0 ? (totalHikeBudget / totalCurrentSalary) * 100 : 0;

    return {
      results,
      summary: {
        totalEmployees: results.length,
        totalCurrentSalary: Number(totalCurrentSalary.toFixed(0)),
        totalHikeBudget: Number(totalHikeBudget.toFixed(0)),
        averageHikeRate: Number(averageHikeRate.toFixed(2)),
        totalNewSalary: Number(totalNewSalary.toFixed(0)),
      },
    };
  }, [employees, attendanceRecords, fromDate, toDate]);

  if (hikeData.results.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm p-8 text-center">
        <TrendingUp className="w-10 h-10 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-700 font-semibold">
          No employee data with salary information found for hike calculation.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5 border-b-2 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Appraisal & Hike Projection (Score: 100)</h2>
          <span className="px-3 py-1.5 bg-white text-pink-700 text-sm font-bold rounded-full ml-auto">
            {hikeData.summary.totalEmployees} Employees Analyzed
          </span>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-pink-50 rounded-xl p-4 border border-pink-200">
            
            <p className="text-xs font-medium text-gray-600 mb-1">Total Hike Budget</p>
            <p className="text-xl font-bold text-pink-800">
              ₹{hikeData.summary.totalHikeBudget.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            
            <p className="text-xs font-medium text-gray-600 mb-1">Average Hike Rate</p>
            <p className="text-xl font-bold text-blue-800">
              {hikeData.summary.averageHikeRate}%
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            
            <p className="text-xs font-medium text-gray-600 mb-1">Total Current Salary</p>
            <p className="text-xl font-bold text-gray-800">
              ₹{hikeData.summary.totalCurrentSalary.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            
            <p className="text-xs font-medium text-gray-600 mb-1">Total New Salary</p>
            <p className="text-xl font-bold text-purple-800">
              ₹{hikeData.summary.totalNewSalary.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Detailed Appraisal Scorecard Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-red-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-red-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-red-800">A1: Attendance Strict (50)</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-yellow-800">A2: Attendance General (20)</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-blue-800">B: Behavior/Attitude (15)</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
                <Award className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-emerald-800">C: Growth/Certificates (15)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HikeTable: React.FC<HikeCalculatorProps> = ({ employees, attendanceRecords, fromDate, toDate }) => {
    const hikeData = useMemo(() => {
      const nonFounderEmployees = employees.filter((emp) => !isFounder(emp) && emp.baseSalary);
      const metricsMap = new Map<string, { totalLateMinutes: number; totalAbsentDays: number; totalWorkingDays: number }>();
      
      const start = new Date(fromDate);
      const end = new Date(toDate);
      const dateRange = new Map<string, boolean>();
      let current = new Date(start);
  
      while (current <= end) {
          dateRange.set(current.toISOString().slice(0, 10), true);
          current.setDate(current.getDate() + 1);
      }
      const totalExpectedDays = dateRange.size;
  
      attendanceRecords.forEach((record) => {
        const status = getStatusLabel(record);
        const recordDateKey = getDateKey(record.date);
  
        if (!metricsMap.has(record.employeeId)) {
          metricsMap.set(record.employeeId, { totalLateMinutes: 0, totalAbsentDays: 0, totalWorkingDays: 0 });
        }
        const metrics = metricsMap.get(record.employeeId)!;
        
        if(dateRange.has(recordDateKey)) {
            metrics.totalWorkingDays += 1;
        }
        
        if (!status.isAbsent) {
          metrics.totalLateMinutes += status.lateMinutes;
        }
      });
  
      const results = nonFounderEmployees.map((emp) => {
        const currentSalary = emp.baseSalary!;
        const behaviorRating = emp.behaviorRating || 3; 
        const certifications = emp.certifications || 0;
        const metrics = metricsMap.get(emp.employeeId) || { totalLateMinutes: 0, totalAbsentDays: 0, totalWorkingDays: 0 };
        
        const actualWorkingDays = metrics.totalWorkingDays;
        const totalAbsences = totalExpectedDays - actualWorkingDays;
        
        let strictPoints = MAX_STRICT_POINTS;
        strictPoints -= totalAbsences * ABSENCE_POINT_LOSS;
        strictPoints -= metrics.totalLateMinutes * TARDINESS_POINT_LOSS_PER_MINUTE;
        strictPoints = Math.max(0, strictPoints);
        
        const attendancePenaltyFactor = (strictPoints / MAX_STRICT_POINTS);
        let generalPoints = MAX_GENERAL_POINTS * attendancePenaltyFactor;
        generalPoints = Math.max(0, generalPoints);
  
        const normalizedBehaviorScore = (behaviorRating / 5) * MAX_BEHAVIOR_POINTS;
        
        const growthPoints = Math.min(certifications * 5, MAX_GROWTH_POINTS);
  
        const finalScore = strictPoints + generalPoints + normalizedBehaviorScore + growthPoints;
        
        const finalHikeRate = getHikePercentage(finalScore);
        const finalHikeAmount = currentSalary * finalHikeRate;
        const newSalary = currentSalary + finalHikeAmount;
  
        return {
          employeeId: emp.employeeId,
          employeeName: emp.employeeName || emp.employeeId,
          currentSalary: Number(currentSalary.toFixed(0)),
          finalScore: Number(finalScore.toFixed(0)),
          strictPoints: Number(strictPoints.toFixed(0)),
          generalPoints: Number(generalPoints.toFixed(0)),
          behaviorPoints: Number(normalizedBehaviorScore.toFixed(0)),
          growthPoints: Number(growthPoints.toFixed(0)),
          totalAbsences,
          totalLateMinutes: metrics.totalLateMinutes,
          finalHikeRate: Number((finalHikeRate * 100).toFixed(2)),
          finalHikeAmount: Number(finalHikeAmount.toFixed(0)),
          newSalary: Number(newSalary.toFixed(0)),
        };
      }).sort((a, b) => b.finalScore - a.finalScore);
  
      return results;
    }, [employees, attendanceRecords, fromDate, toDate]);

    if (hikeData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border-2 border-slate-100 shadow-sm">
                <BarChart3 className="w-8 h-8 text-gray-400 mb-4" />
                <p className="text-gray-600">No employee data to display.</p>
            </div>
        );
    }
  
    return (
        <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b-2 border-slate-200">
                <h3 className="text-xl font-bold text-gray-900">
                    Detailed Appraisal & Payouts
                </h3>
                <p className="text-sm text-gray-500 mt-1">Sorted by Final Score (100 Points)</p>
            </div>
            <div className="overflow-x-auto rounded-xl">
                <div className="h-[40rem] overflow-y-scroll">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Employee
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Final Score (100)
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    A1 (50)
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    A2 (20)
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    B (15)
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    C (15)
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Hike %
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    New Salary
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {hikeData.map((m) => (
                                <tr
                                    key={m.employeeId}
                                    className="hover:bg-purple-50/50 transition-colors"
                                >
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                        {m.employeeName}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-base font-extrabold text-purple-700">
                                        {m.finalScore}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-red-600">
                                        {m.strictPoints}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-yellow-600">
                                        {m.generalPoints}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-blue-600">
                                        {m.behaviorPoints}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-emerald-600">
                                        {m.growthPoints}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-pink-600">
                                        {m.finalHikeRate}%
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-green-700">
                                        ₹{m.newSalary.toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const calculateDateRange = (preset: DatePreset) => {
  const today = new Date();
  const endDate = getTodayDateString();
  let startDate = endDate;
  
  const start = new Date();

  switch (preset) {
    case "1W":
      start.setDate(today.getDate() - 7);
      break;
    case "1M":
      start.setMonth(today.getMonth() - 1);
      break;
    case "3M":
      start.setMonth(today.getMonth() - 3);
      break;
    case "6M":
      start.setMonth(today.getMonth() - 6);
      break;
    case "9M":
      start.setMonth(today.getMonth() - 9);
      break;
    case "1Y":
      start.setFullYear(today.getFullYear() - 1);
      break;
    case "CUSTOM":
    default:
      // For CUSTOM, we rely on the state set by the input fields
      return { from: startDate, to: endDate };
  }

  startDate = start.toISOString().slice(0, 10);
  return { from: startDate, to: endDate };
};

const App: React.FC = () => {
  const todayDateString = getTodayDateString();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("ALL");
  const [selectedMode, setSelectedMode] = useState<AttendanceMode | "ALL">(
    "ALL"
  );
  
  // New state for the date range preset
  const [selectedDatePreset, setSelectedDatePreset] = useState<DatePreset>("CUSTOM");
  
  // Custom date states, initialized to today's date
  const [customFromDate, setCustomFromDate] = useState<string>(todayDateString);
  const [customToDate, setCustomToDate] = useState<string>(todayDateString);

  // Memoized actual fromDate and toDate based on preset
  const { fromDate, toDate } = useMemo(() => {
    if (selectedDatePreset === "CUSTOM") {
        return { fromDate: customFromDate, toDate: customToDate };
    }
    const { from, to } = calculateDateRange(selectedDatePreset);
    return { fromDate: from, toDate: to };
  }, [selectedDatePreset, customFromDate, customToDate]);


  const loadAttendance = useCallback(async () => {
    try {
      setLoadingAttendance(true);
      const res = await fetch("/api/attendance/all", {
        method: "GET",
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.records) {
        throw new Error(json.error || "Failed to load attendance records.");
      }
      const records: AttendanceRecord[] = json.records as AttendanceRecord[];
      setAttendance(records);
      setAttendanceError(null);
    } catch (error) {
      setAttendanceError("Failed to load attendance records.");
      setAttendance([]); 
    } finally {
      setLoadingAttendance(false);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees", {
        method: "GET",
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to load employees");
      }
      
      const employeeList: any[] = json.employees || [];

      const list: Employee[] = employeeList
        .map((emp: any, index: number) => ({
          employeeId: emp.empId,
          employeeName: emp.name,
          department: emp.department ?? emp.departmentName ?? null,
          role: emp.role ?? null,
          team: emp.team ?? null,
          category: emp.category ?? null,
          baseSalary: 50000 + Math.floor(Math.random() * 100000), 
          certifications: Math.floor(Math.random() * 4), 
          behaviorRating: Number((2.0 + Math.random() * 3.0).toFixed(1)),
        }))
        .filter((emp: Employee) => emp.employeeId);

      setEmployees(list);
    } catch (error) {
      setEmployees([]);
    }
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const uniqueEmployees = useMemo(() => {
    if (employees.length > 0) {
      return [...employees]
        .map((emp) => ({
          employeeId: emp.employeeId,
          employeeName: emp.employeeName || emp.employeeId,
        }))
        .sort((a, b) =>
          (a.employeeName || "").localeCompare(b.employeeName || "")
        );
    }

    const map = new Map<string, { employeeId: string; employeeName: string }>();
    attendance.forEach((r) => {
      if (!map.has(r.employeeId)) {
        map.set(r.employeeId, {
          employeeId: r.employeeId,
          employeeName: r.employeeName || r.employeeId,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      (a.employeeName || "").localeCompare(b.employeeName || "")
    );
  }, [employees, attendance]);

  const filteredAttendance = useMemo(() => {
    return attendance.filter((r) => {
      if (selectedEmployeeId !== "ALL" && r.employeeId !== selectedEmployeeId) {
        return false;
      }

      if (selectedMode !== "ALL") {
        const normalized = r.mode || "IN_OFFICE";
        if (normalized !== selectedMode) return false;
      }

      const recordDateStr = getDateKey(r.date);

      if (fromDate && recordDateStr < fromDate) return false;
      if (toDate && recordDateStr > toDate) return false;

      return true;
    });
  }, [attendance, selectedEmployeeId, selectedMode, fromDate, toDate]);

  const handleClearFilters = () => {
    setSelectedEmployeeId("ALL");
    setSelectedMode("ALL");
    setSelectedDatePreset("CUSTOM"); 
    setCustomFromDate(todayDateString); 
    setCustomToDate(todayDateString);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mt-[5%] mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Salary Hike & Performance Analytics
          </h1>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
            Projected annual salary adjustments based on performance scores and attendance records.
          </p>
          <div className="mt-6">
            <button
              onClick={loadAttendance}
              disabled={loadingAttendance}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-5 h-5 ${
                  loadingAttendance ? "animate-spin" : ""
                } text-blue-600`}
              />
              <span className="font-semibold text-sm text-gray-700">
                Refresh Data
              </span>
            </button>
            {attendanceError && (
              <p className="text-sm text-red-500 mt-2">{attendanceError}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 space-y-8">
            <HikeCalculator
              attendanceRecords={filteredAttendance}
              employees={employees}
              fromDate={fromDate}
              toDate={toDate}
            />

            <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Filter className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Filter Records</h2>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2.5">
                      Employee
                    </label>
                    <select
                      className="border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 font-medium transition-all"
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    >
                      <option value="ALL">All Employees</option>
                      {uniqueEmployees.map((emp) => (
                        <option key={emp.employeeId} value={emp.employeeId}>
                          {emp.employeeName} ({emp.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2.5">
                      Work Mode
                    </label>
                    <select
                      className="border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 font-medium transition-all"
                      value={selectedMode}
                      onChange={(e) =>
                        setSelectedMode(
                          e.target.value === "ALL"
                            ? "ALL"
                            : (e.target.value as AttendanceMode)
                        )
                      }
                    >
                      <option value="ALL">All Modes</option>
                      <option value="IN_OFFICE">In Office</option>
                      <option value="WORK_FROM_HOME">Work From Home</option>
                      <option value="ON_DUTY">On Duty</option>
                      <option value="REGULARIZATION">Regularization</option>
                    </select>
                  </div>
                  
                  {/* New Date Range Preset Dropdown */}
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2.5">
                      Date Range Preset
                    </label>
                    <select
                      className="border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 font-medium transition-all"
                      value={selectedDatePreset}
                      onChange={(e) => setSelectedDatePreset(e.target.value as DatePreset)}
                    >
                      <option value="CUSTOM">Custom Range</option>
                      <option value="1W">Last 1 Week</option>
                      <option value="1M">Last 1 Month</option>
                      <option value="3M">Last 3 Months</option>
                      <option value="6M">Last 6 Months</option>
                      <option value="9M">Last 9 Months</option>
                      <option value="1Y">Last 1 Year</option>
                    </select>
                  </div>


                  {/* Custom Date Inputs (Conditionally rendered) */}
                  {selectedDatePreset === "CUSTOM" && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-700 mb-2.5">
                            From Date
                            </label>
                            <input
                            type="date"
                            className="border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 font-medium transition-all"
                            value={customFromDate}
                            onChange={(e) => setCustomFromDate(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-semibold text-gray-700 mb-2.5">
                            To Date
                            </label>
                            <input
                            type="date"
                            className="border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 font-medium transition-all"
                            value={customToDate}
                            onChange={(e) => setCustomToDate(e.target.value)}
                            />
                        </div>
                    </div>
                  )}

                  {/* Displaying Current Applied Range */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p className="text-xs font-semibold text-gray-700 mb-1">
                        Applied Date Range
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                        {fromDate} to {toDate}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-4">
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-3 rounded-xl border-2 border-slate-200 text-gray-700 text-sm font-semibold hover:bg-slate-50 transition-all"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => alert("Attendance Export is disabled in this view.")}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-300 text-white text-sm font-semibold cursor-not-allowed opacity-70"
                    disabled
                  >
                    <Download className="w-5 h-5" />
                    Export (Disabled)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <HikeTable
              attendanceRecords={filteredAttendance}
              employees={employees}
              fromDate={fromDate}
              toDate={toDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App; 