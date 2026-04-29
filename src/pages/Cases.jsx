import React, { useState, useEffect } from 'react';
import { 
  LifeBuoy, Plus, Search, User, Clock, CheckCircle2, 
  AlertCircle, X, Loader2, Filter, MoreHorizontal,
  Calendar, ShieldAlert, MessageSquare, History
} from 'lucide-react';
import { casesApi, contactsApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  const [formData, setFormData] = useState({ subject: '', contact: '', assigned_to: '', priority: 'medium', description: '' });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [casesRes, contactsRes] = await Promise.all([
        casesApi.getAll(),
        contactsApi.getAll() 
      ]);
      setCases(casesRes.results || []);
      setContacts(contactsRes.results || []);
    } catch (err) {
      addToast('Synchronization failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCase = async (e) => {
    e.preventDefault();
    try {
      await casesApi.create({
        ...formData,
        status: 'new'
      });
      addToast('Support ticket established');
      setIsModalOpen(false);
      setFormData({ subject: '', contact: '', assigned_to: '', priority: 'medium', description: '' });
      fetchData();
    } catch (err) {
      addToast('Establishment failed', 'error');
    }
  };

  const filteredCases = cases.filter(c => 
    (c.subject || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch(status?.toLowerCase()) {
      case 'new': return <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100">Pending Arrival</span>;
      case 'in_progress': return <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100">Under Analysis</span>;
      case 'resolved':
      case 'closed': return <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">Resolved</span>;
      default: return <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-100">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Cases</h2>
          <div className="flex items-center mt-1 space-x-2">
            <span className="text-sm font-medium text-slate-500">Support Hub</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="text-sm font-bold text-blue-600">{filteredCases.length} Total Cases</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none w-64 transition-all"
            />
          </div>
          
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-5 py-2.5 bg-[#1a56d9] text-white rounded-[4px] font-medium text-[13px] hover:bg-blue-700 transition-all"
          >
            <Plus className="mr-2 w-4 h-4" />
            Add Case
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[500px] relative">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20">
            <div className="w-8 h-8 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-[13px] font-medium text-gray-600">Case Subject</th>
                  <th className="px-6 py-3 text-[13px] font-medium text-gray-600">Contact Name</th>
                  <th className="px-6 py-3 text-[13px] font-medium text-gray-600">Status</th>
                  <th className="px-6 py-3 text-[13px] font-medium text-gray-600">Priority</th>
                  <th className="px-6 py-3 text-[13px] font-medium text-gray-600">Created Time</th>
                  <th className="px-6 py-3 text-[13px] font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="text-[13px] font-medium text-blue-600 hover:underline">{c.subject}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[13px] text-gray-800">{contacts.find(con => con.id === c.contact)?.name || `-`}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] text-gray-800 capitalize">{c.status || 'New'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] text-gray-800 capitalize">{c.priority || 'Medium'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] text-gray-800">{new Date(c.created_at).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="text-gray-400 hover:text-gray-600 p-1">
                          <MoreHorizontal className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredCases.length === 0 && (
               <div className="p-20 flex flex-col items-center justify-center text-center border-t border-gray-100">
                  <div className="text-[14px] text-gray-500">No matching cases found.</div>
               </div>
            )}
          </div>
        )}
      </div>

      {/* Establishment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-[16px] font-semibold text-gray-800">Create Case</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddCase} className="p-6">
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="w-32 text-[13px] text-gray-600 text-right pr-4">Case Subject *</div>
                  <div className="flex-1">
                    <input required type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full px-3 py-1.5 border border-gray-300 rounded-[4px] text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-32 text-[13px] text-gray-600 text-right pr-4">Contact Name *</div>
                  <div className="flex-1">
                    <select required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full px-3 py-1.5 border border-gray-300 rounded-[4px] text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                      <option value="">None</option>
                      {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-32 text-[13px] text-gray-600 text-right pr-4">Priority</div>
                  <div className="flex-1">
                    <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full px-3 py-1.5 border border-gray-300 rounded-[4px] text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                      <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option><option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-32 text-[13px] text-gray-600 text-right pr-4 pt-2">Description</div>
                  <div className="flex-1">
                    <textarea rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-[4px] text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"></textarea>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-1.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-[4px] text-[13px] hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#1a56d9] font-medium text-white rounded-[4px] text-[13px] hover:bg-blue-700 transition-colors flex items-center">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
