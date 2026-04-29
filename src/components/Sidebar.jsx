import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Search, ChevronDown, ChevronRight, Inbox, Briefcase, 
  CalendarDays, Package, LifeBuoy, Puzzle, Wrench, 
  FolderKanban, MessageSquare, Menu, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

const navigationConfig = [
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
      { name: 'Cases', href: '/cases' },
      { name: 'Solutions', href: '/solutions' },
    ]
  },
  {
    name: 'Integrations', icon: Puzzle,
    children: [
      { name: 'Apps', href: '/apps' },
      { name: 'API', href: '/api' },
    ]
  },
  { name: 'Services', icon: Wrench, href: '/services' },
  { name: 'Projects', icon: FolderKanban, href: '/projects' },
  { name: 'Voice of the Customer', icon: MessageSquare, href: '/feedback' },
];

const MenuItem = ({ item, isCollapsed, setCollapsed }) => {
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;
  
  // Check if any child is active
  const isChildActive = hasChildren && item.children.some(child => location.pathname.startsWith(child.href));
  
  // Manage expanded state. Default to open if a child is active.
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

  // Base classes for the item container
  const baseClasses = `group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer mb-1 ${
    item.highlighted 
      ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' 
      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
  }`;

  // If item doesn't have children, it's a NavLink
  if (!hasChildren) {
    return (
      <NavLink
        to={item.href}
        className={({ isActive }) => 
          `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors mb-1 ${
            item.highlighted 
              ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' 
              : isActive || (item.name === 'Projects' && location.pathname === '/') // static active example
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`
        }
        title={isCollapsed ? item.name : undefined}
      >
        <item.icon className={`flex-shrink-0 ${isCollapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5 mr-3'}`} />
        {!isCollapsed && <span>{item.name}</span>}
      </NavLink>
    );
  }

  // If item has children, it's an expandable button
  return (
    <div className="flex flex-col">
      <button 
        onClick={toggleExpand}
        className={baseClasses}
        title={isCollapsed ? item.name : undefined}
      >
        <div className="flex items-center">
          <item.icon className={`flex-shrink-0 ${isCollapsed ? 'w-6 h-6 mx-auto' : 'w-5 h-5 mr-3'}`} />
          {!isCollapsed && <span>{item.name}</span>}
        </div>
        {!isCollapsed && (
          <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
        )}
      </button>

      {/* Expandable Children */}
      {!isCollapsed && (
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-64 opacity-100 mb-2 mt-1' : 'max-h-0 opacity-0'}`}
        >
          <div className="pl-10 pr-2 space-y-1 border-l-2 border-slate-700 ml-5">
            {item.children.map((child) => (
              <NavLink
                key={child.name}
                to={child.href}
                className={({ isActive }) => 
                  `block px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive 
                      ? 'text-white bg-slate-800 font-semibold' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
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
    <div 
      className={`flex flex-col bg-[#0f172a] border-r border-slate-800 h-screen transition-all duration-300 z-20 shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header Section */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center w-full justify-between cursor-pointer hover:bg-slate-800 p-2 rounded-lg transition-colors -ml-2">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold mr-3 shadow-sm">
                C
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm leading-tight">CRM Teamspace</span>
                <span className="text-slate-400 text-xs">Enterprise CRM</span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              C
            </div>
          </div>
        )}
      </div>

      {/* Search Field */}
      {!isCollapsed && (
        <div className="px-4 py-4 shrink-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-9 pr-3 py-1.5 border border-slate-700 rounded-md leading-5 bg-slate-800 text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
              placeholder="Search..."
            />
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide py-2 px-3">
        <nav className="space-y-0.5">
          {navigationConfig.map((item) => (
            <MenuItem 
              key={item.name} 
              item={item} 
              isCollapsed={isCollapsed} 
              setCollapsed={setIsCollapsed} 
            />
          ))}
        </nav>
      </div>

      {/* Bottom Toggle Button */}
      <div className="p-4 border-t border-slate-800 shrink-0 flex justify-center">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-center w-full py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
