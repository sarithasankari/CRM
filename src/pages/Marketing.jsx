import React from 'react';
import Table from '../components/Table';
import { campaignsData } from '../data/dummy';
import { 
  Megaphone, Send, Target, BarChart3, 
  Users, MousePointer2, MailOpen, Filter,
  Plus, ChevronRight, Layout, Zap
} from 'lucide-react';

export default function Marketing() {
  const columns = [
    { 
      header: 'Campaign Specification', 
      accessor: 'name', 
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{row.name}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{row.type || 'Email Broadcast'}</span>
        </div>
      ) 
    },
    { 
      header: 'Segment', 
      accessor: 'targetAudience',
      render: (row) => (
        <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-wider border border-slate-100">
          {row.targetAudience}
        </span>
      )
    },
    { 
      header: 'Delivery Metric', 
      accessor: 'sent',
      render: (row) => (
        <div className="flex items-center text-slate-900 font-bold text-sm">
          <Send className="w-3 h-3 mr-2 text-slate-300" />
          {row.sent.toLocaleString()}
        </div>
      )
    },
    { 
      header: 'Open Velocity', 
      accessor: 'opened',
      render: (row) => (
        <div className="flex flex-col">
          <div className="flex items-center text-slate-900 font-bold text-sm">
            <MailOpen className="w-3 h-3 mr-2 text-slate-300" />
            {row.opened}%
          </div>
          <div className="w-20 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
             <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${row.opened}%` }} />
          </div>
        </div>
      )
    },
    { 
      header: 'Status Protocol', 
      accessor: 'status',
      render: (row) => (
        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
          row.status === 'Active' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
        }`}>
          {row.status}
        </span>
      )
    }
  ];

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
          <button className="inline-flex items-center px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all">
            <Plus className="mr-2 w-4 h-4" />
            New Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Quick Send Panel */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 p-8">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-slate-900">Rapid Broadcast</h3>
               <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Segment Filter</label>
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <select className="input-field pl-12 appearance-none bg-white">
                    <option>All Database Contacts</option>
                    <option>Hot Pipeline Leads</option>
                    <option>Qualified Enterprise</option>
                    <option>Retention Segment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Communication Template</label>
                <div className="relative">
                  <Layout className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <select className="input-field pl-12 appearance-none bg-white">
                    <option>Strategic Update Q4</option>
                    <option>Product Launch v3.0</option>
                    <option>Holiday Appreciation</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button className="w-full inline-flex justify-center items-center px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                  <Send className="mr-2 h-4 w-4" /> Execute Broadcast (1,245)
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-4 font-bold uppercase tracking-widest italic">Est. delivery time: 4m 20s</p>
              </div>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden group">
             <div className="relative z-10">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Month-over-Month</h4>
                <div className="text-3xl font-black mb-2">+24.8%</div>
                <p className="text-sm font-medium text-slate-400">Campaign engagement velocity is trending upwards across all segments.</p>
             </div>
             <Target className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 rotate-12 group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Campaign Table Container */}
        <div className="lg:col-span-8 bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[600px]">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
             <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest text-[11px]">Active Protocols</h3>
             <button className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline">View Analytics</button>
          </div>
          <Table columns={columns} data={campaignsData} />
        </div>
      </div>
    </div>
  );
}
