import React, { useState, useEffect } from 'react';
import Table from '../components/Table';
import { contactsApi } from '../services/api';
import { 
  Plus, Filter, X, Zap, Loader2, AlertCircle, Trash2, Edit2,
  Search, Mail, Phone, Building2, UserCircle, MoreVertical,
  Download, Globe, MessageSquare
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', company: ''
  });

  const fetchContacts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await contactsApi.getAll();
      setContacts(data.results || data);
    } catch (err) {
      setError("Synchronization failed. Please check your network.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Archiving this contact will remove it from active pipelines. Proceed?")) return;
    try {
      await contactsApi.delete(id);
      addToast("Contact successfully archived");
      fetchContacts();
    } catch (err) {
      addToast("Failed to archive contact", "error");
    }
  };

  const columns = [
    { 
      header: (
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Identity</div>
      ),
      accessor: 'name',
      render: (row) => {
        const initials = row.name.split(' ').map(n => n[0]).join('');
        return (
          <div className="flex items-center group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-black mr-4 shadow-sm border border-white group-hover:scale-110 transition-transform">
              {initials.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">{row.name}</span>
              <div className="flex items-center text-[11px] text-slate-500 font-medium mt-0.5">
                <Mail className="w-3 h-3 mr-1.5 opacity-40" /> {row.email}
              </div>
            </div>
          </div>
        );
      }
    },
    { 
      header: 'Organisation', 
      accessor: 'company', 
      render: (row) => (
        <div className="flex items-center text-slate-600 font-bold text-sm">
          <Building2 className="w-3.5 h-3.5 mr-2 opacity-30" />
          {row.company || 'Private Entity'}
        </div>
      )
    },
    { 
      header: 'Direct Line', 
      accessor: 'phone', 
      render: (row) => (
        <div className="flex items-center text-slate-500 font-medium text-sm">
          <Phone className="w-3.5 h-3.5 mr-2 opacity-30" />
          {row.phone || 'Not Registered'}
        </div>
      )
    },
    { 
      header: '', 
      accessor: 'actions',
      render: (row) => (
        <div className="flex justify-end space-x-1">
          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Message">
            <MessageSquare className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(row.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const filteredData = contacts.filter(contact => 
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddContact = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await contactsApi.create(formData);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', company: '' });
      addToast("Identity record established");
      fetchContacts();
    } catch (err) {
      addToast("Failed to create record", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-[1400px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center space-x-2 mb-1">
             <UserCircle className="w-5 h-5 text-blue-600" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacts</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Contacts</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Find a contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none w-72 transition-all shadow-sm"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <Plus className="mr-2 w-4 h-4" />
            Register Record
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[500px] relative">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20 backdrop-blur-[1px]">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="mt-4 text-xs font-black text-slate-400 uppercase tracking-widest">Syncing Identity Data...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white z-20">
             <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-rose-500" />
             </div>
             <h3 className="text-xl font-black text-slate-900">Database Connection Error</h3>
             <p className="text-slate-500 mt-2 max-w-xs font-medium">{error}</p>
             <button onClick={fetchContacts} className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 transition-all">
                Attempt Reconnect
             </button>
          </div>
        ) : null}

        <Table columns={columns} data={filteredData} />
        
        {filteredData.length === 0 && !isLoading && (
           <div className="p-20 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                 <Globe className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-black text-slate-900">No Records Found</h3>
              <p className="text-slate-500 mt-2 font-medium">Your search criteria didn't return any active contacts.</p>
           </div>
        )}
      </div>

      {/* Register Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Register Record</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Contact Establishment</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddContact} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Legal Identity Name *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" placeholder="Full legal name" />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Electronic Mail Point *</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input-field" placeholder="identity@domain.com" />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contact Protocol</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-field" placeholder="+0 000-0000" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Corporate Entity</label>
                    <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="input-field" placeholder="Organisation name" />
                  </div>
                </div>
              </div>

              <div className="pt-8 mt-4 border-t border-slate-50 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Discard</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center">
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Register Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
