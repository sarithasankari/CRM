import React, { useState } from 'react';
import { Plus, CheckSquare, Clock, Calendar, AlertCircle, X, Bell } from 'lucide-react';

const initialTasks = [
  { id: 1, title: 'Send contract draft', assignee: 'John Doe', dueDate: '2023-10-24', priority: 'High', status: 'Pending', reminder: true },
  { id: 2, title: 'Prepare presentation', assignee: 'Jane Smith', dueDate: '2023-10-28', priority: 'Low', status: 'Pending', reminder: false },
  { id: 3, title: 'Follow up with Acme Corp', assignee: 'John Doe', dueDate: '2023-10-26', priority: 'Medium', status: 'Completed', reminder: false },
];

export default function Tasks() {
  const [tasks, setTasks] = useState(initialTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', assignee: '', dueDate: '', priority: 'Medium', reminder: false });

  const handleAddTask = (e) => {
    e.preventDefault();
    const newTask = {
      id: Date.now(),
      ...formData,
      status: 'Pending'
    };
    setTasks([newTask, ...tasks]);
    setIsModalOpen(false);
    setFormData({ title: '', assignee: '', dueDate: '', priority: 'Medium', reminder: false });
  };

  const toggleStatus = (id) => {
    setTasks(tasks.map(t => 
      t.id === id ? { ...t, status: t.status === 'Pending' ? 'Completed' : 'Pending' } : t
    ));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-10">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Tasks</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your daily to-dos and assignments.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Add Task
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {tasks.map(task => (
            <li key={task.id} className={`p-4 hover:bg-gray-50 transition-colors flex items-start space-x-4 ${task.status === 'Completed' ? 'opacity-60' : ''}`}>
              <button 
                onClick={() => toggleStatus(task.id)}
                className={`mt-1 flex-shrink-0 focus:outline-none ${task.status === 'Completed' ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}`}
              >
                <CheckSquare className="w-6 h-6" />
              </button>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold ${task.status === 'Completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {task.title}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {task.reminder && <Bell className="w-4 h-4 text-yellow-500" title="Reminder Set" />}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      task.priority === 'High' ? 'bg-red-100 text-red-700' : 
                      task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                <div className="mt-1 flex items-center text-xs text-gray-500 space-x-4">
                  <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> {task.dueDate}</span>
                  <span>Assigned to: <span className="font-medium text-gray-700">{task.assignee}</span></span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Create Task</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="E.g., Call CEO" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option>High</option><option>Medium</option><option>Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                <input type="text" value={formData.assignee} onChange={e => setFormData({...formData, assignee: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Name" />
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="reminder" checked={formData.reminder} onChange={e => setFormData({...formData, reminder: e.target.checked})} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor="reminder" className="ml-2 block text-sm text-gray-900">Set Reminder (UI alert)</label>
              </div>

              <div className="pt-4 mt-6 border-t border-gray-100 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none shadow-sm">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
