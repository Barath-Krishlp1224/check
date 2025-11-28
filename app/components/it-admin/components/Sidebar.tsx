import React from 'react';

interface MenuItem {
    id: string;
    icon: string;
    label: string;
    path: string;
}

interface SidebarProps {
    menuItems: MenuItem[];
    activeTab: string;
    setActiveTab: (tabId: string) => void;
}

export default function Sidebar({ menuItems, activeTab, setActiveTab }: SidebarProps) {
  return (
    <div className="w-24 bg-white flex flex-col items-center justify-center py-8 shadow-lg border-r border-gray-200">
      
      {/* Menu Items - Centered */}
      <div className="flex flex-col items-center space-y-6">
        {menuItems.map((item) => (
          <div key={item.id} className="relative group">
            <button
              onClick={() => setActiveTab(item.id)}
              className={`relative w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 overflow-hidden ${
                activeTab === item.id
                  ? "bg-emerald-500 text-white shadow-xl shadow-emerald-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-emerald-500 hover:shadow-md"
              }`}
              title={item.label}
            >
              {/* Background wave effect for active */}
              {activeTab === item.id && (
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-teal-500 opacity-90"></div>
              )}
              
              <span className={`relative z-10 transition-transform duration-300 ${
                activeTab === item.id ? "scale-110" : "group-hover:scale-110"
              }`}>
                {item.icon}
              </span>

              {/* Active indicator dot */}
              {activeTab === item.id && (
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-emerald-500 rounded-l-full"></div>
              )}
            </button>

            {/* Tooltip */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 group-hover:ml-6 pointer-events-none transition-all duration-300 whitespace-nowrap shadow-xl">
              {item.label}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-gray-900"></div>
            </div>

            {/* Label below icon for active state */}
            {activeTab === item.id && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-emerald-500 whitespace-nowrap">
                {item.label.split(' ')[0]}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}