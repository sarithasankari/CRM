import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Search, ChevronDown, ChevronRight, Inbox, Briefcase, 
  CalendarDays, Package, LifeBuoy, Puzzle, Wrench, 
  FolderKanban, MessageSquare, Menu, PanelLeftClose, PanelLeftOpen,
  PieChart, Users, Building2, BarChart3, Settings, Zap,
  LayoutGrid, Activity, ShieldCheck, Database
} from 'lucide-react';

const navigationConfig = [
  { name: 'Dashboard', icon: PieChart, href: '/' },
  { name: 'Workqueue', icon: Inbox, highlighted: true, href: '/workqueue' },
  { 
    name: 'Sales', icon: Briefcase,
    children: [
      { name: 'Leads', href: '/leads' },
      { name: 'Contacts', href: '/contacts' },
      { name: 'Accounts', href: '/accounts' },
      { name: 'Deals', href: '/deals' },
    ]
  },
  {
    name: 'Activities', icon: CalendarDays,
    children: [
      { name: 'Tasks', href: '/tasks' },
      { name: 'Calls', href: '/calls' },
      { name: 'Emails', href: '/emails' },
      { name: 'Meetings', href: '/meetings' },
    ]
  },
  {
    name: 'Inventory', icon: Package,
    children: [
      { name: 'Products', href: '/products' },
      { name: 'Quotes', href: '/quotes' },
      { name: 'Invoices', href: '/invoices' },
    ]
  },
  {
    name: 'Support', icon: LifeBuoy,
    children: [
      { name: 'Support Dashboard', href: '/support' },
      { name: 'Cases', href: '/cases' },
      { name: 'Solutions', href: '/solutions' },
      { name: 'Services', href: '/services' },
      { name: 'Feedback', href: '/feedback' },
    ]
  },
  { name: 'Marketing', icon: Zap, href: '/marketing' },
  { name: 'Projects', icon: FolderKanban, href: '/projects' },
  { name: 'Analytics', icon: BarChart3, href: '/analytics' },
  {
    name: 'Settings', icon: Wrench,
    children: [
      { name: 'Profile', href: '/profile' },
      { name: 'Account', href: '/account' },
      { name: 'Users', href: '/users' },
    ]
  },
];

const MenuItem = ({ item, isCollapsed, setCollapsed }) => {
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;
  const isChildActive = hasChildren && item.children.some(child => location.pathname === child.href);
  const [isExpanded, setIsExpanded] = useState(isChildActive);

  const toggleExpand = (e) => {
    e.preventDefault();
    if (isCollapsed) {
      setCollapsed(false);
      setIsExpanded(true);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  if (!hasChildren) {
    return (
      <NavLink
        to={item.href}
        className={({ isActive }) => 
          `group flex items-center px-4 py-3 text-[11px] font-black uppercase tracking-[0.1em] rounded-2xl transition-all mb-1 ${
            item.highlighted 
              ? 'bg-blue-600/10 text-blue-400 hover:bg-blue-600/20' 
              : isActive 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-[1.02]' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`
        }
        title={isCollapsed ? item.name : undefined}
      >
        <item.icon className={`flex-shrink-0 ${isCollapsed ? 'w-5 h-5 mx-auto' : 'w-4 h-4 mr-4'}`} />
        {!isCollapsed && <span>{item.name}</span>}
      </NavLink>
    );
  }

  return (
    <div className="flex flex-col">
      <button 
        onClick={toggleExpand}
        className={`group flex items-center justify-between px-4 py-3 text-[11px] font-black uppercase tracking-[0.1em] rounded-2xl transition-all mb-1 ${
          isChildActive ? 'text-white bg-white/5' : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }`}
        title={isCollapsed ? item.name : undefined}
      >
        <div className="flex items-center">
          <item.icon className={`flex-shrink-0 ${isCollapsed ? 'w-5 h-5 mx-auto' : 'w-4 h-4 mr-4'}`} />
          {!isCollapsed && <span>{item.name}</span>}
        </div>
        {!isCollapsed && (
          <ChevronRight className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
        )}
      </button>

      {!isCollapsed && (
        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100 mb-2' : 'max-h-0 opacity-0'}`}>
          <div className="pl-12 pr-2 space-y-1 mt-1">
            {item.children.map((child) => (
              <NavLink
                key={child.name}
                to={child.href}
                className={({ isActive }) => 
                  `block px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
                    isActive 
                      ? 'text-blue-400 bg-blue-400/5' 
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`
                }
              >
                {child.name}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`flex flex-col bg-slate-950 h-screen transition-all duration-500 z-20 shrink-0 border-r border-white/5 relative ${isCollapsed ? 'w-24' : 'w-72'}`}>
      
      {/* Brand Section */}
      <div className="flex items-center h-24 px-8 shrink-0 relative">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-[14px] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20 group cursor-pointer hover:rotate-12 transition-transform">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-white font-black text-lg tracking-tighter leading-none">CRM</span>
              <span className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mt-1.5">Unified Suite</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto py-2 px-6 custom-scrollbar scrollbar-hide">
        <nav className="space-y-1">
          {navigationConfig.map((item) => (
            <MenuItem key={item.name} item={item} isCollapsed={isCollapsed} setCollapsed={setIsCollapsed} />
          ))}
        </nav>
      </div>

      {/* Footer Info / Toggle */}
      <div className="p-6 border-t border-white/5 bg-slate-950/50 backdrop-blur-md">
        {!isCollapsed && (
          <div className="mb-6 px-2">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Logic Health</span>
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Optimal</span>
             </div>
             <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-[85%] bg-blue-600 rounded-full" />
             </div>
          </div>
        )}
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-center w-full py-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5"
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
