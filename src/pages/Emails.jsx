import React, { useState } from 'react';
import Table from '../components/Table';
import { emailsData } from '../data/dummy';
import { 
  Mail, Edit3, Send, ChevronRight, Search, 
  Filter, MoreHorizontal, Inbox, ExternalLink, 
  Trash2, X, Zap, ArrowUpRight
} from 'lucide-react';

export default function Emails() {
  const [isComposing, setIsComposing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const columns = [
    { 
      header: 'Recipient Registry', 
      accessor: 'to',
      render: (row) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 mr-4 group-hover:scale-110 transition-transform">
             <Mail className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
             <span className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{row.to}</span>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Primary Contact</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Communication Subject', 
      accessor: 'subject',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 line-clamp-1">{row.subject}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Template: Follow-Up Protocol</span>
        </div>
      )
    },
    { 
      header: 'Registry Timestamp', 
      accessor: 'date',
      render: (row) => (
        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{row.date}</span>
      )
    },
    { 
      header: 'Velocity State', 
      accessor: 'status',
      render: (row) => {
        const status = row.status?.toLowerCase();
        let colors = 'bg-slate-50 text-slate-400 border-slate-100';
        if (status === 'opened') colors = 'bg-blue-50 text-blue-600 border-blue-100';
        if (status === 'clicked') colors = 'bg-emerald-50 text-emerald-600 border-emerald-100';

        return (
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center w-fit ${colors}`}>
            <Zap className={`w-3 h-3 mr-1.5 ${status === 'clicked' ? 'fill-emerald-500' : ''}`} /> {row.status}
          </span>
        );
      }
    },
    {
      header: '',
      accessor: 'actions',
      render: () => (
        <div className="flex justify-end space-x-2">
          <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
            <ExternalLink className="w-4 h-4" />
          </button>
          <button className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-[1400px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center space-x-2 mb-1">
             <Inbox className="w-5 h-5 text-blue-600" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Communication</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Emails</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none w-64 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsComposing(true)}
            className="inline-flex items-center px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <Edit3 className="mr-2 w-4 h-4" />
            Compose Email
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[500px]">
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Transmission Registry</h3>
           <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>Delivery Success:</span>
              <span className="text-emerald-500">99.9% Optimal</span>
           </div>
        </div>
        <Table columns={columns} data={emailsData} />
      </div>

      {/* Broadcast Composer Modal */}
      {isComposing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsComposing(false)} />
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Broadcast Protocol</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">High-Velocity Communication Engine</p>
              </div>
              <button onClick={() => setIsComposing(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all border border-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Registry Entry</label>
                  <input type="text" className="input-field" placeholder="contact@enterprise.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Transmission Template</label>
                  <select className="input-field appearance-none bg-white">
                    <option>Strategic Introduction</option>
                    <option>Follow-up Protocol</option>
                    <option>Yield Report Submission</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Transmission Subject</label>
                <input type="text" className="input-field" placeholder="Strategic Partnership Proposal" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Transmission Payload</label>
                <textarea rows="6" className="input-field resize-none py-4" placeholder="Initialize communication protocol..."></textarea>
              </div>

              <div className="pt-8 mt-4 border-t border-slate-50 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsComposing(false)} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Discard Draft</button>
                <button type="button" onClick={() => setIsComposing(false)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center">
                   <Send className="w-4 h-4 mr-2" /> Initialize Broadcast
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
