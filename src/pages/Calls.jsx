import React, { useState, useEffect } from 'react';
import { 
  Plus, PhoneCall, Clock, X, Zap, Filter, Search,
  PhoneOutgoing, PhoneIncoming, MoreHorizontal, AlertCircle, Loader2
} from 'lucide-react';
import { callsApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const EMPTY_FORM = { 
  type: 'outbound', 
  contact_name: '', 
  company: '', 
  duration: '', 
  outcome: 'connected', 
  call_date: new Date().toISOString().slice(0, 16),
  notes: '' 
};

export default function Calls() {
  const [calls, setCalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const { addToast } = useToast();

  const fetchCalls = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await callsApi.getAll();
      setCalls(data.results || data);
    } catch (err) {
      setError('Failed to sync call registry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCalls(); }, []);

  const handleAddCall = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await callsApi.create(formData);
      addToast('Call logged successfully');
      setIsModalOpen(false);
      setFormData(EMPTY_FORM);
      fetchCalls();
    } catch (err) {
      addToast('Failed to log call', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this call log?')) return;
    try {
      await callsApi.delete(id);
      addToast('Call log removed');
      fetchCalls();
    } catch {
      addToast('Delete failed', 'error');
    }
  };

  const getCallIcon = (type) => {
    switch (type) {
      case 'outbound': return <PhoneOutgoing className="w-5 h-5 text-blue-600" />;
      case 'inbound': return <PhoneIncoming className="w-5 h-5 text-emerald-600" />;
      case 'scheduled': return <Clock className="w-5 h-5 text-amber-500" />;
      default: return <PhoneCall className="w-5 h-5 text-slate-400" />;
    }
  };

  const getCallBg = (type) => {
    switch (type) {
      case 'outbound': return 'bg-blue-50';
      case 'inbound': return 'bg-emerald-50';
      case 'scheduled': return 'bg-amber-50';
      default: return 'bg-slate-50';
    }
  };

  const getOutcomeBadge = (outcome) => {
    const map = {
      interested: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      pending: 'bg-amber-50 text-amber-600 border-amber-100',
      connected: 'bg-blue-50 text-blue-600 border-blue-100',
      follow_up: 'bg-purple-50 text-purple-600 border-purple-100',
      voicemail: 'bg-slate-50 text-slate-500 border-slate-100',
      not_interested: 'bg-rose-50 text-rose-600 border-rose-100',
    };
    return map[outcome] || 'bg-slate-50 text-slate-400 border-slate-100';
  };

  const filtered = calls.filter(c =>
    c.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-[1400px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <PhoneCall className="w-5 h-5 text-blue-600" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activities</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Calls</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text"
              placeholder="Search calls..."
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
            Log Call
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Logged', value: calls.length, color: 'text-blue-600 bg-blue-50' },
          { label: 'Outbound', value: calls.filter(c => c.type === 'outbound').length, color: 'text-slate-900 bg-slate-50' },
          { label: 'Interested', value: calls.filter(c => c.outcome === 'interested').length, color: 'text-emerald-600 bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h4 className={`text-3xl font-black mt-1 px-3 py-1 rounded-xl w-fit ${stat.color}`}>{stat.value}</h4>
          </div>
        ))}
      </div>

      {/* Call Registry */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[300px]">
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Call Registry</h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filtered.length} records</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Call Registry...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-4" />
            <p className="text-slate-500 font-medium">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <PhoneCall className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-black text-slate-900">No calls logged</h3>
            <p className="text-slate-400 text-sm mt-1">Log your first call interaction to populate this registry.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {filtered.map(call => (
              <li key={call.id} className="px-8 py-6 hover:bg-slate-50/50 transition-all group flex items-center">
                <div className={`flex-shrink-0 p-4 rounded-2xl group-hover:scale-110 transition-transform ${getCallBg(call.type)}`}>
                  {getCallIcon(call.type)}
                </div>
                
                <div className="ml-6 flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{call.contact_name}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{call.company || '—'}</p>
                  </div>
                  
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                    <div className="flex items-center text-sm font-bold text-slate-700">
                      <Clock className="w-3.5 h-3.5 mr-2 text-slate-300" />
                      {call.duration || '—'}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Timestamp</p>
                    <div className="text-sm font-bold text-slate-700">{formatDate(call.call_date)}</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getOutcomeBadge(call.outcome)}`}>
                      {call.outcome_display || call.outcome}
                    </span>
                    <button onClick={() => handleDelete(call.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Log Call Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Log Interaction</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Registry Synchronization Protocol</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddCall} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Protocol Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="input-field appearance-none bg-white">
                    <option value="outbound">Outbound</option>
                    <option value="inbound">Inbound</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Interaction Outcome</label>
                  <select value={formData.outcome} onChange={e => setFormData({...formData, outcome: e.target.value})} className="input-field appearance-none bg-white">
                    <option value="connected">Connected</option>
                    <option value="voicemail">Voicemail</option>
                    <option value="interested">Interested</option>
                    <option value="not_interested">Not Interested</option>
                    <option value="follow_up">Follow-up Required</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Subject *</label>
                  <input required type="text" value={formData.contact_name} onChange={e => setFormData({...formData, contact_name: e.target.value})} className="input-field" placeholder="Full Name" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Company</label>
                  <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="input-field" placeholder="Acme Corp" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Duration</label>
                  <input type="text" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="input-field" placeholder="e.g. 15:00" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Timestamp *</label>
                  <input required type="datetime-local" value={formData.call_date} onChange={e => setFormData({...formData, call_date: e.target.value})} className="input-field" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notes</label>
                <textarea rows="2" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="input-field py-3 resize-none" placeholder="Optional interaction notes..." />
              </div>

              <div className="pt-4 mt-2 border-t border-slate-50 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Discard</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-3" />}
                  <Zap className="w-4 h-4 mr-2 fill-current" /> Save Interaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
