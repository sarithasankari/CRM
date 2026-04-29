import React, { useState } from 'react';
import { 
  Plus, PhoneCall, PhoneForwarded, PhoneMissed, Clock, 
  User, X, ChevronRight, Activity, Zap, Filter, Search,
  PhoneOutgoing, PhoneIncoming, MoreHorizontal
} from 'lucide-react';

const initialCalls = [
  { id: 1, type: 'Outbound', contact: 'Sarah Miller', duration: '15:20', outcome: 'Interested', date: 'Oct 23, 10:00 AM', company: 'Miller Systems' },
  { id: 2, type: 'Inbound', contact: 'Jason Bourne', duration: '05:45', outcome: 'Follow-up Req', date: 'Oct 23, 2:30 PM', company: 'Treadstone Inc.' },
  { id: 3, type: 'Scheduled', contact: 'Acme Corp', duration: 'Est. 30:00', outcome: 'Pending', date: 'Oct 25, 1:00 PM', company: 'Acme Global' },
];

export default function Calls() {
  const [calls, setCalls] = useState(initialCalls);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ type: 'Outbound', contact: '', duration: '', outcome: 'Connected', date: '' });

  const handleAddCall = (e) => {
    e.preventDefault();
    const newCall = { id: Date.now(), ...formData, company: 'New Prospect' };
    setCalls([newCall, ...calls]);
    setIsModalOpen(false);
    setFormData({ type: 'Outbound', contact: '', duration: '', outcome: 'Connected', date: '' });
  };

  const getCallIcon = (type) => {
    switch(type) {
      case 'Outbound': return <PhoneOutgoing className="w-5 h-5 text-blue-600" />;
      case 'Inbound': return <PhoneIncoming className="w-5 h-5 text-emerald-600" />;
      case 'Scheduled': return <Clock className="w-5 h-5 text-amber-500" />;
      default: return <PhoneCall className="w-5 h-5 text-slate-400" />;
    }
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
          <button className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <Plus className="mr-2 w-4 h-4" />
            Add Call
          </button>
        </div>
      </div>

      {/* Main Registry List */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Call Registry</h3>
           <div className="flex items-center space-x-2">
              <div className="flex -space-x-1">
                 {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white" />
                 ))}
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Activity</span>
           </div>
        </div>
        
        <ul className="divide-y divide-slate-50">
          {calls.map(call => (
            <li key={call.id} className="px-8 py-6 hover:bg-slate-50/50 transition-all group flex items-center">
              <div className={`flex-shrink-0 p-4 rounded-2xl group-hover:scale-110 transition-transform ${
                 call.type === 'Inbound' ? 'bg-emerald-50' : 
                 call.type === 'Outbound' ? 'bg-blue-50' : 'bg-amber-50'
              }`}>
                {getCallIcon(call.type)}
              </div>
              
              <div className="ml-6 flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="col-span-1">
                   <h4 className="text-sm font-black text-slate-900">{call.contact}</h4>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{call.company}</p>
                </div>
                
                <div className="col-span-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                   <div className="flex items-center text-sm font-bold text-slate-700">
                      <Clock className="w-3.5 h-3.5 mr-2 text-slate-300" />
                      {call.duration}
                   </div>
                </div>

                <div className="col-span-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Timestamp</p>
                   <div className="text-sm font-bold text-slate-700">{call.date}</div>
                </div>

                <div className="col-span-1 flex items-center justify-between">
                   <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                     call.outcome === 'Interested' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                     call.outcome === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                     'bg-blue-50 text-blue-600 border border-blue-100'
                   }`}>
                     {call.outcome}
                   </span>
                   <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                   </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Log Modal */}
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
                    <option>Outbound</option>
                    <option>Inbound</option>
                    <option>Scheduled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Subject *</label>
                  <input required type="text" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="input-field" placeholder="Full Name" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Registry Duration</label>
                  <input type="text" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="input-field" placeholder="e.g. 15:00" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sync Timestamp</label>
                  <input type="text" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="input-field" placeholder="e.g. Oct 25, 10:00 AM" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Interaction Outcome</label>
                <input type="text" value={formData.outcome} onChange={e => setFormData({...formData, outcome: e.target.value})} className="input-field" placeholder="e.g. Connected / Voicemail" />
              </div>

              <div className="pt-8 mt-4 border-t border-slate-50 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Discard</button>
                <button type="submit" className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center">
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
