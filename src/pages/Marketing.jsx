import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Send, Target, BarChart3, 
  MailOpen, Filter, Plus, Zap, Loader2, 
  X, AlertCircle, Trash2, TrendingUp
} from 'lucide-react';
import { campaignsApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const EMPTY_FORM = {
  name: '',
  type: 'email',
  target_audience: '',
  status: 'draft',
  start_date: '',
  end_date: '',
  sent: 0,
  opened: 0,
  clicked: 0,
};

export default function Marketing() {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const { addToast } = useToast();

  const fetchCampaigns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await campaignsApi.getAll();
      setCampaigns(data.results || data);
    } catch (err) {
      setError('Failed to load campaign registry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await campaignsApi.create(formData);
      addToast('Campaign initialized');
      setIsModalOpen(false);
      setFormData(EMPTY_FORM);
      fetchCampaigns();
    } catch {
      addToast('Failed to initialize campaign', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Archive this campaign?')) return;
    try {
      await campaignsApi.delete(id);
      addToast('Campaign archived');
      fetchCampaigns();
    } catch {
      addToast('Delete failed', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      active: 'bg-blue-50 text-blue-600 border border-blue-100',
      completed: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      draft: 'bg-slate-50 text-slate-500 border border-slate-100',
      paused: 'bg-amber-50 text-amber-600 border border-amber-100',
    };
    return map[status] || 'bg-slate-50 text-slate-400';
  };

  // Real aggregate stats
  const totalSent = campaigns.reduce((s, c) => s + (c.sent || 0), 0);
  const avgOpen = campaigns.length > 0 ? (campaigns.reduce((s, c) => s + (c.opened || 0), 0) / campaigns.length).toFixed(1) : 0;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-8 animate-fade-in max-w-[1400px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Megaphone className="w-5 h-5 text-blue-600" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marketing</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Marketing</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <BarChart3 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <Plus className="mr-2 w-4 h-4" />
            New Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Panel - Stats & Quick Action */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4">
            {[
              { label: 'Total Campaigns', value: campaigns.length, Icon: Target, color: 'text-blue-600 bg-blue-50' },
              { label: 'Active Now', value: activeCampaigns, Icon: Zap, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Total Sent', value: totalSent.toLocaleString(), Icon: Send, color: 'text-slate-900 bg-slate-50' },
              { label: 'Avg Open Rate', value: `${avgOpen}%`, Icon: MailOpen, color: 'text-purple-600 bg-purple-50' },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-5 flex items-center space-x-4">
                <div className={`p-3 rounded-2xl ${stat.color}`}>
                  <stat.Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <h4 className="text-xl font-black text-slate-900 mt-0.5">{stat.value}</h4>
                </div>
              </div>
            ))}
          </div>

          {/* Engagement Summary */}
          <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Engagement Velocity</h4>
              <div className="text-3xl font-black mb-2">{avgOpen}%</div>
              <p className="text-sm font-medium text-slate-400">Average open rate across all campaigns in the registry.</p>
            </div>
            <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 rotate-12 group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Campaign Table */}
        <div className="lg:col-span-8 bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[600px]">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Protocols</h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{campaigns.length} records</span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
              <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Campaigns...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-8">
              <AlertCircle className="w-10 h-10 text-rose-500 mb-4" />
              <p className="text-slate-500 font-medium">{error}</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-8">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Megaphone className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-black text-slate-900">No campaigns yet</h3>
              <p className="text-slate-400 text-sm mt-1">Initialize your first broadcast campaign.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Segment</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sent</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Open Rate</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-4 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {campaigns.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div>
                          <div className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{c.name}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{c.type_display || c.type}</div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-wider border border-slate-100">
                          {c.target_audience || 'All Contacts'}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex items-center text-slate-900 font-bold text-sm">
                          <Send className="w-3 h-3 mr-2 text-slate-300" />
                          {(c.sent || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex flex-col">
                          <div className="flex items-center text-slate-900 font-bold text-sm">
                            <MailOpen className="w-3 h-3 mr-2 text-slate-300" />
                            {c.opened}%
                          </div>
                          <div className="w-20 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${c.opened}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusBadge(c.status)}`}>
                          {c.status_display || c.status}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <button onClick={() => handleDelete(c.id)} className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">New Campaign</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Broadcast Initialization Protocol</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Campaign Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" placeholder="e.g. Q4 Product Launch" />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Channel Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="input-field appearance-none bg-white">
                    <option value="email">Email</option>
                    <option value="social">Social Media</option>
                    <option value="sms">SMS</option>
                    <option value="event">Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="input-field appearance-none bg-white">
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Audience</label>
                <input type="text" value={formData.target_audience} onChange={e => setFormData({...formData, target_audience: e.target.value})} className="input-field" placeholder="e.g. Enterprise Leads, Inactive Users" />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
                  <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">End Date</label>
                  <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="input-field" />
                </div>
              </div>

              <div className="pt-6 mt-2 border-t border-slate-50 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Discard</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  <Send className="w-4 h-4 mr-2" /> Launch Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
