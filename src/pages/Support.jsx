import React, { useState, useEffect } from 'react';
import { 
  LifeBuoy, Plus, Search, Filter, 
  MoreHorizontal, MessageSquare, User, 
  Clock, CheckCircle2, AlertCircle, Zap,
  Loader2, X, ChevronDown
} from 'lucide-react';
import { casesApi, contactsApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const EMPTY_FORM = {
  subject: '',
  description: '',
  contact: '',
  status: 'new',
  priority: 'medium',
};

export default function Support() {
  const [cases, setCases] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const { addToast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [casesRes, contactsRes] = await Promise.all([
        casesApi.getAll(),
        contactsApi.getAll(),
      ]);
      setCases(casesRes.results || casesRes);
      setContacts(contactsRes.results || contactsRes);
    } catch (err) {
      setError('Failed to load support cases.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateCase = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await casesApi.create(formData);
      addToast('Support case created');
      setIsModalOpen(false);
      setFormData(EMPTY_FORM);
      fetchData();
    } catch (err) {
      addToast('Failed to create case', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await casesApi.patch(id, { status: newStatus });
      addToast('Case status updated');
      fetchData();
    } catch {
      addToast('Update failed', 'error');
    }
  };

  const getStatusConfig = (status) => {
    const map = {
      new: { colors: 'bg-rose-50 text-rose-600 border-rose-100', Icon: AlertCircle },
      in_progress: { colors: 'bg-amber-50 text-amber-600 border-amber-100', Icon: Clock },
      resolved: { colors: 'bg-emerald-50 text-emerald-600 border-emerald-100', Icon: CheckCircle2 },
      closed: { colors: 'bg-slate-50 text-slate-400 border-slate-100', Icon: CheckCircle2 },
    };
    return map[status] || { colors: 'bg-slate-50 text-slate-400 border-slate-100', Icon: Clock };
  };

  const getPriorityBadge = (priority) => {
    const map = {
      urgent: 'bg-rose-900 text-white',
      high: 'bg-rose-50 text-rose-600',
      medium: 'bg-amber-50 text-amber-600',
      low: 'bg-slate-50 text-slate-500',
    };
    return map[priority] || 'bg-slate-50 text-slate-400';
  };

  const filtered = cases.filter(c =>
    c.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // KPI calculations from real data
  const openCount = cases.filter(c => c.status === 'new' || c.status === 'in_progress').length;
  const resolvedCount = cases.filter(c => c.status === 'resolved' || c.status === 'closed').length;
  const urgentCount = cases.filter(c => c.priority === 'urgent').length;
  const resolutionRate = cases.length > 0 ? Math.round((resolvedCount / cases.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in max-w-[1400px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <LifeBuoy className="w-5 h-5 text-blue-600" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Support</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search cases..."
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
            New Case
          </button>
        </div>
      </div>

      {/* KPI Row (dynamic) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Open Cases', value: openCount, Icon: AlertCircle, color: 'text-rose-600 bg-rose-50' },
          { label: 'Resolution Rate', value: `${resolutionRate}%`, Icon: Zap, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Urgent', value: urgentCount, Icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Total Cases', value: cases.length, Icon: User, color: 'text-blue-600 bg-blue-50' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 flex flex-col items-start">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h4 className={`text-2xl font-black mt-1 px-3 py-0.5 rounded-xl ${stat.color}`}>{stat.value}</h4>
          </div>
        ))}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[300px]">
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Incident Logs</h3>
          </div>
          <div className="flex items-center space-x-4">
            {openCount > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{openCount} Open</span>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Cases...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-4" />
            <p className="text-slate-500 font-medium">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-black text-slate-900">No cases found</h3>
            <p className="text-slate-400 text-sm mt-1 font-medium">All clear — no support incidents in this registry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Incident</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Created</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((c) => {
                  const { colors, Icon } = getStatusConfig(c.status);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                            <LifeBuoy className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{c.subject}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 line-clamp-1 max-w-[240px]">{c.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                          <span className="text-sm font-bold text-slate-700">{c.contact_name || `Contact #${c.contact}`}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getPriorityBadge(c.priority)}`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center w-fit ${colors}`}>
                          <Icon className="w-3 h-3 mr-1.5" /> {c.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-[11px] font-bold text-slate-500">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {c.status !== 'resolved' && (
                            <button
                              onClick={() => handleStatusChange(c.id, 'resolved')}
                              className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors"
                            >
                              Resolve
                            </button>
                          )}
                          <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Case Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">New Support Case</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Incident Registry Protocol</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Incident Subject *</label>
                <input required type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="input-field" placeholder="e.g. Login issue in production" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field py-3 resize-none" placeholder="Detailed incident description..." />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contact *</label>
                <select required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="input-field appearance-none bg-white">
                  <option value="">Select Contact</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="input-field appearance-none bg-white">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="input-field appearance-none bg-white">
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 mt-2 border-t border-slate-50 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Discard</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
