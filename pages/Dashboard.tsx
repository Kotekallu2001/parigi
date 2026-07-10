import React, { useState } from 'react';
import { useAuth } from '../App';
import { Role } from '../types';
import AdminDashboard from './AdminDashboard';
import StaffDashboard from './StaffDashboard';
import CropsDashboard from './CropsDashboard';
import { 
  BarChart2, 
  Sprout, 
  Users, 
  Menu, 
  X,
  PlusSquare,
  Activity,
  FileSpreadsheet
} from 'lucide-react';

enum DashboardTab {
  CROPS = 'crops',
  STAFF_LOGS = 'staff_logs'
}

const Dashboard: React.FC = () => {
  const { auth } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.CROPS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isAdmin = auth.user?.role.toLowerCase() === Role.ADMIN.toLowerCase();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const menuItems = [
    {
      id: DashboardTab.CROPS,
      label: 'Crops & Farmers',
      icon: Sprout,
      description: 'Crops cultivation & acres metrics'
    },
    {
      id: DashboardTab.STAFF_LOGS,
      label: isAdmin ? 'Staff Operations' : 'My Work Logs',
      icon: Activity,
      description: 'Field logs & analytics breakdown'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col md:flex-row">
      
      {/* Mobile Header for Sidebar Toggle */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between shadow-md border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg">
            W
          </div>
          <span className="font-bold text-sm tracking-tight">Dashboard Hub</span>
        </div>
        <button 
          onClick={toggleSidebar}
          className="p-1 rounded-lg text-slate-300 hover:text-white"
        >
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar - Desktop (permanent) & Mobile (draws on top) */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          fixed md:relative inset-y-0 left-0 z-40 bg-slate-900 text-white border-r border-slate-800 transform 
          md:transform-none transition-all duration-300 ease-in-out flex flex-col justify-between shrink-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isHovered ? 'md:w-64' : 'md:w-20'}
        `} 
        style={{ minHeight: 'calc(100vh - 64px)' }}
      >
        
        <div className="p-5 flex-grow space-y-6 overflow-hidden">
          <div className="hidden md:block pb-4 border-b border-slate-800/80 min-h-[50px] overflow-hidden">
            <div className={`transition-all duration-300 origin-left ${isHovered ? 'opacity-100 scale-100 h-auto' : 'opacity-0 scale-95 h-0 overflow-hidden'}`}>
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest">Dashboard Panel</h3>
              <p className="text-[10px] text-slate-500 mt-1">Select focus workspace</p>
            </div>
            {!isHovered && (
              <div className="flex justify-center text-slate-500 text-xs font-black animate-pulse">
                D
              </div>
            )}
          </div>

          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center p-3 rounded-xl transition-all text-left outline-none text-xs font-bold ${
                    isHovered ? 'md:justify-start gap-3' : 'md:justify-center gap-0'
                  } ${
                    isSelected 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                  title={!isHovered ? item.label : undefined}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  <div className={`transition-all duration-300 origin-left overflow-hidden ${
                    isHovered ? 'opacity-100 scale-100 w-auto ml-1' : 'opacity-0 scale-95 w-0 h-0'
                  }`}>
                    <div className="whitespace-nowrap">{item.label}</div>
                    <div className={`text-[9px] font-normal mt-0.5 whitespace-nowrap ${isSelected ? 'text-white/70' : 'text-slate-500'}`}>
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer with current user context */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-850 overflow-hidden">
          <div className={`flex items-center ${isHovered ? 'space-x-3 justify-start' : 'justify-center space-x-0'}`}>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400 shrink-0">
              {auth.user?.username.charAt(0).toUpperCase()}
            </div>
            <div className={`transition-all duration-300 origin-left overflow-hidden leading-tight ${
              isHovered ? 'opacity-100 scale-100 w-auto ml-1' : 'opacity-0 scale-95 w-0 h-0'
            }`}>
              <div className="text-xs font-bold text-slate-200 truncate max-w-[150px]">{auth.user?.username}</div>
              <div className="text-[9px] text-slate-500 uppercase font-extrabold truncate max-w-[150px]">{auth.user?.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
        <div className="max-w-7xl mx-auto">
          {activeTab === DashboardTab.CROPS ? (
            <CropsDashboard />
          ) : (
            isAdmin ? <AdminDashboard /> : <StaffDashboard />
          )}
        </div>
      </main>

    </div>
  );
};

export default Dashboard;
