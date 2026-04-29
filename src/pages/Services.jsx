import React, { useState } from 'react';
import { 
  Wrench, Plus, CheckCircle2, Clock, 
  Search, Filter, ChevronRight, User, 
  Calendar, MoreHorizontal, Settings, Activity,
  Zap
} from 'lucide-react';
import Table from '../components/Table';

const initialServices = [
  { id: 1, name: 'Premium Onboarding', customer: 'Acme Corp', status: 'In Progress', assignedTo: 'Sarah M.', date: 'Oct 20', priority: 'High' },
  { id: 2, name: 'Custom Data Migration', customer: 'Global Tech', status: 'Pending', assignedTo: 'Tech Team', date: 'Oct 28', priority: 'Critical' },
  { id: 3, name: 'Quarterly Audit', customer: 'Security First', status: 'Completed', assignedTo: 'Jason B.', date: 'Oct 15', priority: 'Standard' },
];

export default function Services() {
  const [services] = useState(initialServices);

  const columns = [
    { 
      header: 'Service Protocol', 
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center">
          <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 mr-4 group-hover:scale-110 transition-transform">
             <Wrench className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-900">{row.name}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Deployment Registry</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Client Nexus', 
      accessor: 'customer',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900">{row.customer}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Verified Account</span>
        </div>
      )
    },
    { 
      header: 'Assigned Operator', 
      accessor: 'assignedTo',
      render: (row) => (
        <div className="flex items-center space-x-2">
           <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
              <User className="w-3.5 h-3.5" />
           </div>
           <span className="text-sm font-bold text-slate-700">{row.assignedTo}</span>
        </div>
      )
    },
    { 
      header: 'Deployment Status', 
      accessor: 'status',
      render: (row) => {
        const status = row.status?.toLowerCase();
        let colors = 'bg-slate-50 text-slate-400 border-slate-100';
        let Icon = Clock;

        if (status === 'completed') {
           colors = 'bg-emerald-50 text-emerald-600 border-emerald-100';
           Icon = CheckCircle2;
        } else if (status === 'in progress') {
           colors = 'bg-blue-50 text-blue-600 border-blue-100';
           Icon = Activity;
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
        <div className="flex justify-end">
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
             <Settings className="w-5 h-5 text-blue-600" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Services</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search services..."
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none w-64 transition-all shadow-sm"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter className="w-4 h-4" />
          </button>
          <button className="inline-flex items-center px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all">
            <Plus className="mr-2 w-4 h-4" />
            Add Service
          </button>
        </div>
      </div>

      {/* Registry Table */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[500px]">
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Operations Ledger</h3>
           <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">3 Systems Operational</span>
              </div>
              <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
                 <div className="w-2 h-2 bg-blue-500 rounded-full" />
                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">1 Protocol Active</span>
              </div>
           </div>
        </div>
        <Table columns={columns} data={services} />
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="glass-card p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
               <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                  <CheckCircle2 className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Success Rate</p>
                  <h4 className="text-xl font-black text-slate-900">98.4% Efficiency</h4>
               </div>
            </div>
            <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">View Analytics</button>
         </div>

         <div className="glass-card p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
               <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                  <Zap className="w-6 h-6 fill-current" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Response Velocity</p>
                  <h4 className="text-xl font-black text-slate-900">2.4 Hour Average</h4>
               </div>
            </div>
            <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">SLA Compliance</button>
         </div>
      </div>
    </div>
  );
}
