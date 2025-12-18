import React from 'react';
import { 
  Users, 
  ClipboardList, 
  Calculator, 
  FolderOpen, 
  UserPlus, 
  CalendarOff,
  Banknote
} from 'lucide-react';

const HRPortal = () => {
  const navItems = [
    { label: 'Attendance', href: '/components/attendance/allday', icon: Users },
    { label: 'Task Management', href: '/components/hr/task-view', icon: ClipboardList },
    { label: 'Payroll Calculation', href: '/components/hr/Payroll-Calculation', icon: Calculator },
    { label: 'Employee Directory', href: '/components/founders/view-emp', icon: FolderOpen },
    { label: 'New Employee Onboard', href: '/components/hr/new-emp', icon: UserPlus },
    { label: 'Employee Leaves', href: '/components/hr/leaves', icon: CalendarOff },
    { label: 'Salary and Payslip', href: '/components/hr/salary-payslip', icon: Banknote },
  ];

  const sortedNavItems = [...navItems].sort((a, b) => 
    a.label.localeCompare(b.label)
  );

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-5xl">
        <div className="text-left mb-10 border-l-4 border-blue-600 pl-6">
          <h1 className="text-4xl font-black text-gray-900 mb-2 uppercase tracking-tight">
            HR Portal
          </h1>
          <p className="text-gray-500 font-medium">
            System management and workforce orchestration
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4">
          {sortedNavItems.map((item) => (
            <a 
              key={item.label} 
              href={item.href}
              className="group block w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.33%-1rem)]"
            >
              <div className="h-20 bg-white rounded-xl border border-gray-200 hover:border-blue-500 transition-all duration-300 hover:shadow-md cursor-pointer overflow-hidden px-5">
                <div className="h-full flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-gray-50 group-hover:bg-blue-50 transition-colors duration-300">
                    <item.icon className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-colors duration-300" strokeWidth={2.5} />
                  </div>
                  
                  <div className="text-left">
                    <h3 className="text-gray-800 group-hover:text-blue-600 font-bold text-sm transition-colors duration-300">
                      {item.label}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider group-hover:text-blue-400">
                      Management
                    </p>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HRPortal;