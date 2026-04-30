import React, { useState } from 'react';
import { 
  MessageSquare, Star, Filter, BarChart2, 
  ChevronRight, Smile, TrendingUp, Quote, 
  Users, Calendar, Search, MoreHorizontal, Zap
} from 'lucide-react';

const initialFeedback = [
  { id: 1, customer: 'Acme Corp', rating: 5, comment: 'Excellent onboarding experience!', date: 'Oct 25, 2023', sentiment: 'Positive' },
  { id: 2, customer: 'Global Tech Inc.', rating: 3, comment: 'Good platform, but missing some API docs.', date: 'Oct 20, 2023', sentiment: 'Neutral' },
  { id: 3, customer: 'TechNova', rating: 4, comment: 'Very responsive support team.', date: 'Oct 15, 2023', sentiment: 'Positive' },
];

export default function Feedback() {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [filterRating, setFilterRating] = useState(0);

  const filteredFeedback = filterRating === 0 ? feedback : feedback.filter(f => f.rating === filterRating);

  return (
    <div className="space-y-8 animate-fade-in max-w-[1400px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center space-x-2 mb-1">
             <Smile className="w-5 h-5 text-blue-600" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Feedback Gravity System</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Feedback Gravity Field</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Filter gravity data..."
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none w-64 transition-all shadow-sm"
            />
          </div>
          <button className="inline-flex items-center px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all">
            <Zap className="mr-2 w-4 h-4 fill-current" />
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* KPI Sidebar */}
        <div className="lg:col-span-1 space-y-6">
           <div className="glass-card p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-[24px] flex items-center justify-center text-blue-600 mb-4 shadow-inner">
                 <Star className="w-8 h-8 fill-current" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Gravity Score</p>
              <h3 className="text-5xl font-black text-slate-900 my-2 tracking-tighter">4.8</h3>
              <div className="flex text-amber-400 space-x-0.5 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Based on 742 Reviews</p>
           </div>

           <div className="glass-card p-6 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Gravity Distribution</p>
              {[
                { label: 'Positive', value: 84, color: 'bg-emerald-500' },
                { label: 'Neutral', value: 12, color: 'bg-slate-300' },
                { label: 'Critical', value: 4, color: 'bg-rose-500' }
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="text-slate-900">{item.value}%</span>
                   </div>
                   <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }} />
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Feedback Registry */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                 <MessageSquare className="w-4 h-4 text-blue-600" />
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gravity Interaction Log</h3>
              </div>
              <div className="flex items-center space-x-3">
                <Filter className="w-4 h-4 text-slate-400" />
                <select 
                  className="text-[10px] font-black uppercase tracking-widest bg-white border border-slate-100 rounded-xl px-4 py-2 outline-none focus:border-blue-500 transition-all cursor-pointer"
                  value={filterRating}
                  onChange={(e) => setFilterRating(Number(e.target.value))}
                >
                  <option value={0}>All Feedback</option>
                  <option value={5}>5 Star Rating</option>
                  <option value={4}>4 Star Rating</option>
                  <option value={3}>3 Star Rating</option>
                </select>
              </div>
            </div>
            
            <div className="divide-y divide-slate-50">
              {filteredFeedback.map((f) => (
                <div key={f.id} className="p-8 hover:bg-slate-50/50 transition-all group cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div className="flex space-x-6">
                       <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                          <Users className="w-6 h-6" />
                       </div>
                       <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-lg font-black text-slate-900">{f.customer}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                              f.sentiment === 'Positive' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                               {f.sentiment}
                            </span>
                          </div>
                          <div className="flex text-amber-400 space-x-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < f.rating ? 'fill-current' : 'text-slate-200'}`} />
                            ))}
                          </div>
                          <p className="text-sm text-slate-600 italic leading-relaxed max-w-2xl">
                             <Quote className="w-4 h-4 text-slate-200 inline-block mr-2 -mt-1" />
                             {f.comment}
                          </p>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-end">
                          <Calendar className="w-3 h-3 mr-1.5" />
                          {f.date}
                       </div>
                       <button className="mt-4 p-2 text-slate-300 hover:text-slate-900 transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredFeedback.length === 0 && (
                <div className="p-20 text-center">
                   <BarChart2 className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching gravity anomalies detected.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Action Bar */}
          <div className="glass-card p-6 flex items-center justify-between border-blue-100 bg-blue-50/10">
             <div className="flex items-center space-x-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">High Gravity Action Required for "Acme Corp" Feedback</p>
             </div>
             <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center">
                Analyze Strategy <ChevronRight className="w-3 h-3 ml-1" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
