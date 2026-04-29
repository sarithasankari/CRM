import React from 'react';
import Table from '../components/Table';
import { ticketsData } from '../data/dummy';
import { 
  LifeBuoy, Plus, Search, Filter, 
  MoreHorizontal, MessageSquare, User, 
  Clock, CheckCircle2, AlertCircle, Zap,
  ExternalLink, ChevronRight
} from 'lucide-react';

export default function Support() {
  const columns = [
    { 
      header: 'Registry ID', 
      accessor: 'ticketNumber', 
      render: (row) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 mr-4 group-hover:scale-110 transition-transform">
             <LifeBuoy className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
             <span className="text-sm font-black text-blue-600">#{row.ticketNumber}</span>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Critical Case</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Incident Subject', 
      accessor: 'subject',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{row.subject}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Reported via API Channel</span>
        </div>
      )
    },
    { 
      header: 'Requester Nexus', 
      accessor: 'contact',
      render: (row) => (
        <div className="flex items-center space-x-2">
           <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
              <User className="w-3.5 h-3.5" />
           </div>
           <span className="text-sm font-bold text-slate-700">{row.contact}</span>
        </div>
      )
    },
    { 
      header: 'Status Protocol', 
      accessor: 'status',
      render: (row) => {
        const status = row.status?.toLowerCase();
        let colors = 'bg-slate-50 text-slate-400 border-slate-100';
        let Icon = Clock;

        if (status === 'open') {
           colors = 'bg-rose-50 text-rose-600 border-rose-100';
           Icon = AlertCircle;
        } else if (status === 'resolved' || status === 'closed') {
           colors = 'bg-emerald-50 text-emerald-600 border-emerald-100';
           Icon = CheckCircle2;
        }

        return (
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center w-fit ${colors}`}>
            <Icon className="w-3 h-3 mr-1.5" /> {row.status}
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
          <button className="p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
            <MoreHorizontal className="w-4 h-4" />
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
              placeholder="Search support..."
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none w-64 transition-all shadow-sm"
            />
          </div>
          <button className="inline-flex items-center px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all">
            <Plus className="mr-2 w-4 h-4" />
            Add Ticket
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: 'Pending Resolution', value: '14 Tickets', icon: AlertCircle, color: 'rose' },
           { label: 'Avg Resolution Time', value: '4.2 Hours', icon: Clock, color: 'blue' },
           { label: 'Success Velocity', value: '94.2%', icon: Zap, color: 'emerald' },
           { label: 'Operator Capacity', value: '82%', icon: User, color: 'indigo' }
         ].map((stat, i) => (
           <div key={i} className="glass-card p-6 flex flex-col items-start">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h4 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h4>
           </div>
         ))}
      </div>

      {/* Main Registry Table */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[500px]">
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
           <div className="flex items-center space-x-3">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Incident Logs</h3>
           </div>
           <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 bg-rose-500 rounded-full" />
                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Critical Alert Active</span>
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                 <Filter className="w-4 h-4" />
              </button>
           </div>
        </div>
        <Table columns={columns} data={ticketsData} />
      </div>
    </div>
  );
}
