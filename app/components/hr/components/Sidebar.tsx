import React from "react";
import { LayoutGrid, CalendarCheck, BarChart2, User } from "lucide-react";

// Allowed sidebar navigation keys
export type ActiveView = "DASHBOARD" | "ATTENDANCE" | "CHART" | "PROFILE";

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}

// Sidebar navigation items
const sidebarItems = [
  { id: "DASHBOARD", icon: LayoutGrid, label: "Dashboard" },
  { id: "ATTENDANCE", icon: CalendarCheck, label: "Attendance" },
  { id: "CHART", icon: BarChart2, label: "HR Chart" },
  { id: "PROFILE", icon: User, label: "Profile" },
] as const;

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-4 border z-50">
      <div className="flex flex-col items-center gap-4">
        {sidebarItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveView(id)}
            title={label}
            className={`p-3 rounded-xl transition-all ${
              activeView === id
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-gray-500 hover:bg-gray-100 hover:text-indigo-600"
            }`}
          >
            <Icon className="w-6 h-6" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
