import React from "react";

interface MenuItem {
  id: string;
  icon: string; // emoji / string
  label: string;
  path: string;
}

interface SidebarProps {
  menuItems: MenuItem[];
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ menuItems, activeTab, setActiveTab }) => {
  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 bg-white shadow-lg rounded-full p-4 border z-50">
      <div className="flex flex-col items-center gap-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={item.label}
            className={`p-3 rounded-xl transition-all ${
              activeTab === item.id
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-gray-500 hover:bg-gray-100 hover:text-indigo-600"
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
