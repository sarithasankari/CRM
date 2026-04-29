import React, { useState } from 'react';
import { 
  CheckCircle2, Clock, CalendarDays, AlertCircle, 
  PhoneCall, Mail, CheckSquare, ArrowDown, ArrowUp, Minus
} from 'lucide-react';

const initialWorkqueue = [
  { id: 1, type: 'Lead', title: 'Follow up call with Sarah Miller', relatedTo: 'Global Tech Inc.', priority: 'High', dueDate: 'Today', status: 'Today' },
  { id: 2, type: 'Task', title: 'Send contract draft', relatedTo: 'Acme Corp', priority: 'High', dueDate: 'Oct 24', status: 'Overdue' },
  { id: 3, type: 'Deal', title: 'Review proposal for Cloud Migration', relatedTo: 'TechNova', priority: 'Medium', dueDate: 'Today', status: 'Today' },
  { id: 4, type: 'Task', title: 'Prepare presentation', relatedTo: 'Globex', priority: 'Low', dueDate: 'Oct 28', status: 'Upcoming' },
  { id: 5, type: 'Lead', title: 'Initial contact with Jason Bourne', relatedTo: 'Security First Co.', priority: 'Medium', dueDate: 'Tomorrow', status: 'Upcoming' },
];

export default function Workqueue() {
  const [filter, setFilter] = useState('All');
  const [tasks, setTasks] = useState(initialWorkqueue);

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'High': return <ArrowUp className="w-4 h-4 text-red-500" />;
      case 'Medium': return <Minus className="w-4 h-4 text-yellow-500" />;
      case 'Low': return <ArrowDown className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Overdue': return 'bg-red-100 text-red-700 border-red-200';
      case 'Today': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Upcoming': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeBadge = (type) => {
    switch(type) {
      case 'Lead': return 'bg-purple-100 text-purple-700';
      case 'Deal': return 'bg-green-100 text-green-700';
      case 'Task': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredTasks = tasks.filter(task => filter === 'All' || task.status === filter);

  const markComplete = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-10">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">My Workqueue</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your assigned leads, tasks, and deals.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 pb-px">
        {['All', 'Overdue', 'Today', 'Upcoming'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              filter === f 
                ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600 shadow-[0_-2px_0_0_#2563eb]' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-t border-l border-r border-transparent'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 opacity-50 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">You're all caught up!</h3>
            <p className="text-gray-500">No items match this filter.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredTasks.map((task) => (
              <li key={task.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center space-x-4">
                  {/* Checkbox to mark complete */}
                  <button 
                    onClick={() => markComplete(task.id)}
                    className="flex-shrink-0 text-gray-300 hover:text-green-500 transition-colors focus:outline-none"
                    title="Mark Complete"
                  >
                    <CheckSquare className="w-6 h-6" />
                  </button>

                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getTypeBadge(task.type)}`}>
                        {task.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(task.status)}`}>
                        {task.status}
                      </span>
                      <div className="flex items-center text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">
                        {getPriorityIcon(task.priority)}
                        <span className="ml-1">{task.priority}</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{task.title}</span>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center space-x-3">
                      <span>Related to: <span className="font-semibold text-gray-700">{task.relatedTo}</span></span>
                      <span className="flex items-center text-gray-400">
                        <CalendarDays className="w-3 h-3 mr-1" />
                        {task.dueDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions (Appear on hover) */}
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Call">
                    <PhoneCall className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Email">
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
