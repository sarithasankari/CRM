import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, Plus, CheckSquare, Clock, Users, Search, X, 
  Loader2, AlertCircle, Trash2, Calendar, Target,
  ChevronRight, BarChart3, Layers, Filter
} from 'lucide-react';
import { projectsApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({ name: '', description: '', status: 'Planning', start_date: '', end_date: '' });

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const data = await projectsApi.getAll();
      setProjects(data.results || data);
    } catch (err) {
      setError("Failed to sync project database");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAddProject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await projectsApi.create(formData);
      addToast("Project initialized");
      setIsModalOpen(false);
      setFormData({ name: '', description: '', status: 'Planning', start_date: '', end_date: '' });
      fetchProjects();
    } catch (err) {
      addToast("Initialization failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Archive and purge this project lifecycle?")) return;
    try {
      await projectsApi.delete(id);
      addToast("Lifecycle purged");
      fetchProjects();
    } catch (err) {
      addToast("Purge failed", "error");
    }
  };

  const filteredProjects = projects.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 animate-fade-in max-w-[1400px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center space-x-2 mb-1">
             <Layers className="w-5 h-5 text-blue-600" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enterprise Portfolio</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Projects</h2>
        </div>
        
        <div className="flex items-center space-x-3">
           <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search project scope..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none w-64 transition-all shadow-sm"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <Plus className="mr-2 w-4 h-4" />
            Add Project
          </button>
        </div>
      </div>

      {/* Main Grid Container */}
      <div className="relative min-h-[400px]">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20 backdrop-blur-[1px]">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="mt-4 text-xs font-black text-slate-400 uppercase tracking-widest">Loading Projects...</p>
          </div>
        ) : error ? (
           <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white z-20">
             <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-rose-500" />
             </div>
             <h3 className="text-xl font-black text-slate-900">Database Error</h3>
             <p className="text-slate-500 mt-2 font-medium">{error}</p>
          </div>
        ) : null}

        {projects.length === 0 && !isLoading && !error ? (
           <div className="p-20 flex flex-col items-center justify-center text-center bg-white rounded-[32px] border border-slate-200">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                 <Target className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-900">No Active Objectives</h3>
              <p className="text-slate-500 mt-2 font-medium">Initialize your first project to begin tracking milestones.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 p-8 hover:shadow-2xl hover:shadow-slate-200/60 transition-all group relative overflow-hidden flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center">
                    <div className={`p-4 rounded-2xl mr-4 group-hover:scale-110 transition-transform ${
                      project.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      <FolderKanban className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{project.name}</h3>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 block">{project.status} Phase</span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(project.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="text-sm font-medium text-slate-500 mb-8 line-clamp-3 leading-relaxed flex-grow">
                  {project.description || "No project specification provided. Milestone tracking active for general objective alignment."}
                </p>

                <div className="mt-auto space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                       {[1,2,3].map(i => (
                         <div key={i} className="w-8 h-8 rounded-lg bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm">
                            SD
                         </div>
                       ))}
                       <div className="w-8 h-8 rounded-lg bg-slate-50 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-400">
                          +2
                       </div>
                    </div>
                    <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <Clock className="w-3.5 h-3.5 mr-1.5 opacity-50" />
                       {project.start_date || 'Ongoing'}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                    <button className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center">
                       Launch Project Space <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                    <BarChart3 className="w-5 h-5 text-slate-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Establishment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">New Project Registry</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Lifecycle Strategy Initialization</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddProject} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Project Designation *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" placeholder="e.g. Q4 Growth Initiative" />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Strategic Scope</label>
                <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field py-4 resize-none" placeholder="Comprehensive project description..." />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lifecycle Phase</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="input-field appearance-none bg-white">
                    <option>Planning</option>
                    <option>Active</option>
                    <option>Completed</option>
                    <option>On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sync Date</label>
                  <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="input-field" />
                </div>
              </div>

              <div className="pt-8 mt-4 border-t border-slate-50 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Discard</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-3"/>}
                  Confirm & Initialize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
