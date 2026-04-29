import React, { useState, useEffect } from 'react';
import { 
  Plus, CheckSquare, Clock, Calendar, AlertCircle, X, 
  Bell, Loader2, Trash2, CheckCircle2, ListTodo, 
  Search, Filter, MoreHorizontal, User, Tag
} from 'lucide-react';
import { tasksApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({ 
    title: '', 
    status: 'Pending', 
    due_date: '',
    priority: 'Medium',
    assignee: ''
  });

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const data = await tasksApi.getAll();
      setTasks(data.results || data);
    } catch (err) {
      setError("Failed to sync task objectives");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await tasksApi.create({
        title: formData.title,
        status: formData.status,
        due_date: formData.due_date || null
      });
      addToast("Objective established");
      setIsModalOpen(false);
      setFormData({ title: '', status: 'Pending', due_date: '', priority: 'Medium', assignee: '' });
      fetchTasks();
    } catch (err) {
      addToast("Failed to establish objective", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (task) => {
    const newStatus = task.status === 'Pending' ? 'Completed' : 'Pending';
    try {
      await tasksApi.update(task.id, { ...task, status: newStatus });
      addToast(newStatus === 'Completed' ? "Task archived as complete" : "Task restored to active");
      fetchTasks();
    } catch (err) {
      addToast("Failed to update status", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Purge this objective from the system?")) return;
    try {
      await tasksApi.delete(id);
      addToast("Objective purged");
      fetchTasks();
    } catch (err) {
      addToast("Failed to purge objective", "error");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-[1000px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center space-x-2 mb-1">
             <ListTodo className="w-5 h-5 text-blue-600" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activities</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tasks</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <Plus className="mr-2 w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Main List Container */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[400px] relative">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20 backdrop-blur-[1px]">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="mt-4 text-xs font-black text-slate-400 uppercase tracking-widest">Syncing Pipeline Objectives...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white z-20">
             <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-rose-500" />
             </div>
             <h3 className="text-xl font-black text-slate-900">Sync Failure</h3>
             <p className="text-slate-500 mt-2 font-medium">{error}</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                 <CheckCircle2 className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Zero Pending Items</h3>
              <p className="text-slate-500 mt-2 font-medium">You've cleared all current pipeline objectives.</p>
           </div>
        ) : null}

        <ul className="divide-y divide-slate-50">
          {tasks.map(task => (
            <li key={task.id} className={`group p-6 hover:bg-slate-50/50 transition-all flex items-start space-x-5 ${task.status === 'Completed' ? 'bg-slate-50/30' : ''}`}>
              <button 
                onClick={() => toggleStatus(task)}
                className={`mt-1 flex-shrink-0 transition-all hover:scale-110 ${task.status === 'Completed' ? 'text-emerald-500' : 'text-slate-200 hover:text-blue-500'}`}
              >
                <CheckCircle2 className={`w-7 h-7 ${task.status === 'Completed' ? 'fill-emerald-50' : ''}`} />
              </button>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-base font-bold transition-all ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {task.title}
                    </h3>
                    <div className="mt-2 flex items-center space-x-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      {task.due_date && (
                         <span className={`flex items-center ${new Date(task.due_date) < new Date() && task.status !== 'Completed' ? 'text-rose-500' : ''}`}>
                           <Calendar className="w-3.5 h-3.5 mr-1.5 opacity-50" /> 
                           Due {task.due_date}
                         </span>
                      )}
                      <span className="flex items-center">
                         <Tag className="w-3.5 h-3.5 mr-1.5 opacity-50" /> 
                         {task.priority || 'Medium'} Priority
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="More Options">
                       <MoreHorizontal className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(task.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Delete Task">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Establishment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">New Objective</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Workflow Pipeline Entry</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddTask} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Objective Description *</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input-field" placeholder="e.g. Schedule strategic review" />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Deadline</label>
                  <input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Priority Scale</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="input-field appearance-none bg-white">
                    <option>High</option><option>Medium</option><option>Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assignee Identity</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input type="text" value={formData.assignee} onChange={e => setFormData({...formData, assignee: e.target.value})} className="input-field pl-12" placeholder="Search team members..." />
                </div>
              </div>

              <div className="pt-8 mt-4 border-t border-slate-50 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Discard</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center">
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirm & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
