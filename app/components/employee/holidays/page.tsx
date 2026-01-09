"use client";

import React, { useState, useMemo } from "react";
import { Calendar, ChevronLeft, Clock, CheckCircle2, CalendarDays, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export interface Holiday {
  date: string;
  name: string;
  description: string;
  actualDate: Date;
}

export const staticHolidays: Holiday[] = [
  { date: "January 1", name: "New Year's Day", description: "A national holiday to mark the beginning of the new year.", actualDate: new Date(2026, 0, 1) },
  { date: "January 15", name: "Pongal", description: "Harvest festival holidays.", actualDate: new Date(2026, 0, 15) },
  { date: "January 26", name: "Republic Day", description: "Commemorating the adoption of the Constitution.", actualDate: new Date(2026, 0, 26) },
  { date: "February 15", name: "Shivaratri", description: "Lord Shiva's birthday celebration.", actualDate: new Date(2026, 1, 15) },
  { date: "March 19", name: "Ugadi", description: "Telugu New Year.", actualDate: new Date(2026, 2, 19) },
  { date: "April 3", name: "Good Friday", description: "Observed during the Holy Week.", actualDate: new Date(2026, 3, 3) },
  { date: "May 1", name: "Labor's Day", description: "Celebrating workers and laborers.", actualDate: new Date(2026, 4, 1) },
  { date: "August 15", name: "Independence Day", description: "Marking India's independence.", actualDate: new Date(2026, 7, 15) },
  { date: "October 2", name: "Gandhi Jayanti", description: "Birth anniversary of Mahatma Gandhi.", actualDate: new Date(2026, 9, 2) },
  { date: "November 8", name: "Diwali", description: "The festival of lights.", actualDate: new Date(2026, 10, 8) },
  { date: "December 25", name: "Christmas", description: "The birth of Jesus Christ.", actualDate: new Date(2026, 11, 25) },
];

const HolidaysPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upcoming" | "recent" | "finished">("upcoming");
  
  const today = new Date(2026, 0, 9); // Jan 09, 2026

  const categorizedHolidays = useMemo(() => {
    const finished = staticHolidays.filter(h => h.actualDate < today);
    const upcoming = staticHolidays.filter(h => h.actualDate >= today);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const recent = finished.filter(h => h.actualDate >= thirtyDaysAgo);

    return { finished, upcoming, recent };
  }, [today]);

  const tabs = [
    { id: "upcoming", label: "Upcoming", icon: CalendarDays, count: categorizedHolidays.upcoming.length, color: "text-blue-600", bg: "bg-blue-100" },
    { id: "recent", label: "Recent", icon: Clock, count: categorizedHolidays.recent.length, color: "text-amber-600", bg: "bg-amber-100" },
    { id: "finished", label: "Finished", icon: CheckCircle2, count: categorizedHolidays.finished.length, color: "text-emerald-600", bg: "bg-emerald-100" },
  ];

  const currentDisplayList = activeTab === "upcoming" 
    ? categorizedHolidays.upcoming 
    : activeTab === "recent" 
    ? categorizedHolidays.recent 
    : categorizedHolidays.finished;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="max-w-4xl w-full">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">2026 Holidays</h1>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 font-bold text-blue-600 text-sm">
            Jan 09
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap transition-all duration-300 border ${
                  isActive 
                  ? "bg-white border-blue-200 shadow-md scale-105 z-10" 
                  : "bg-gray-100 border-transparent text-gray-500 opacity-70"
                }`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? tab.color : ""}`} />
                <span className={`text-sm font-bold ${isActive ? "text-gray-900" : ""}`}>{tab.label}</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${tab.bg} ${tab.color}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Container - Height set to show roughly 5 items */}
        <div className="relative bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-4">
          <div className="overflow-y-auto max-h-[520px] pr-2 custom-scrollbar">
            <div className="space-y-3">
              {currentDisplayList.length > 0 ? (
                currentDisplayList.map((holiday, index) => (
                  <div 
                    key={index} 
                    className="group bg-gray-50/50 p-5 rounded-3xl border border-transparent hover:border-blue-100 hover:bg-white hover:shadow-lg transition-all duration-300 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex flex-col items-center justify-center border border-gray-100">
                        <span className="text-[10px] font-black text-blue-500 uppercase">{holiday.date.split(' ')[0].substring(0,3)}</span>
                        <span className="text-lg font-black text-gray-800 leading-none">{holiday.date.split(' ')[1]}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{holiday.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{holiday.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Calendar className="w-12 h-12 mb-2 opacity-20" />
                  <p className="font-medium text-sm">No holidays to show here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default HolidaysPage;