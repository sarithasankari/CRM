import React, { useState } from 'react';
import { Search, Bell, Settings, HelpCircle, Plus, User, CheckSquare } from 'lucide-react';

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-10 sticky top-0">
      <div className="flex-1 flex">
        <div className="relative w-full max-w-md group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all shadow-sm"
            placeholder="Global Search (Leads, Contacts, Deals)..."
            type="search"
          />
          {/* Mock Dropdown for Global Search */}
          <div className="absolute hidden group-focus-within:block w-full mt-1 bg-white border border-gray-100 shadow-xl rounded-lg py-2 z-50">
            <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Quick Actions</div>
            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"><Search className="w-4 h-4 mr-2 text-gray-400" /> Search across Leads</button>
            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"><Search className="w-4 h-4 mr-2 text-gray-400" /> Search across Deals</button>
          </div>
        </div>
      </div>
      
      <div className="ml-4 flex items-center md:ml-6 space-x-4">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors relative"
          >
            <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
            <Bell className="h-5 w-5" />
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 shadow-xl rounded-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <span className="font-bold text-gray-900 text-sm">Notifications</span>
                <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">Mark all read</span>
              </div>
              <ul className="max-h-96 overflow-y-auto">
                <li className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer flex items-start">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg mr-3">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">New Lead Captured</p>
                    <p className="text-xs text-gray-600 mt-0.5">Jason Bourne from Security First.</p>
                    <p className="text-xs text-gray-400 mt-1">2 mins ago</p>
                  </div>
                </li>
                <li className="p-4 hover:bg-gray-50 cursor-pointer flex items-start">
                  <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg mr-3">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Task Reminder</p>
                    <p className="text-xs text-gray-600 mt-0.5">Send contract draft to Acme Corp.</p>
                    <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>

        <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors">
          <HelpCircle className="h-5 w-5" />
        </button>
        <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors">
          <Settings className="h-5 w-5" />
        </button>
        
        <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>

        <button className="hidden sm:inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors">
          <Plus className="-ml-1 mr-2 h-4 w-4" />
          New Deal
        </button>
      </div>
    </header>
  );
}
