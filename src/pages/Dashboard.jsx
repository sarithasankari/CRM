import React, { useState, useEffect } from 'react';
import { 
  Users, DollarSign, Target, TrendingUp, Calendar, Download, 
  Handshake, ClipboardList, Mail, MoreHorizontal, Loader2, AlertCircle,
  ArrowUpRight, ArrowDownRight, Activity, Zap, CheckCircle2, Clock, Megaphone,
  ShieldCheck
} from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { leadsApi, dealsApi, tasksApi, analyticsApi } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ leads: 0, deals: 0, revenue: 0, tasks: 0, marketing_roi: '0%' });
  const [interval, setInterval] = useState('monthly'); // 'monthly', 'quarterly', 'annual'
  const [dealClosures, setDealClosures] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!stats.leads) setIsLoading(true);
      try {
        const [dashboardRes, dealsRes] = await Promise.all([
          analyticsApi.getDashboardStats({ range: interval }),
          dealsApi.getAll()
        ]);
        
        setStats(dashboardRes.stats);
        setChartData(dashboardRes.chartData);
        setActivities(dashboardRes.activities);
        setLeadSources(dashboardRes.leadSources || []);

        const deals = dealsRes.results || dealsRes;
        setDealClosures(deals.slice(0, 5).map(deal => ({
          id: deal.id,
          company: deal.title,
          contact: deal.contact ? 'Assigned' : 'Unassigned',
          value: `$${parseFloat(deal.value || 0).toLocaleString()}`,
          probability: deal.stage === 'Closed Won' ? 100 : deal.stage === 'Closed Lost' ? 0 : deal.stage === 'Proposal/Price Quote' ? 75 : 50,
          status: deal.stage,
          statusColor: deal.stage === 'Closed Won' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600',
        })));
      } catch (err) {
        setError("Failed to sync dashboard metrics");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [lastMessage, interval]);

  return (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Executive Intelligence</h2>
          <p className="mt-1 text-slate-500 font-medium">Real-time performance metrics across all operational nodes.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              const nextInterval = interval === 'monthly' ? 'quarterly' : interval === 'quarterly' ? 'annual' : 'monthly';
              setInterval(nextInterval);
            }}
            className="inline-flex items-center px-4 py-2 bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-white transition-all shadow-sm"
          >
            <Calendar className="mr-2 h-4 w-4 text-slate-400" />
            Interval: {interval === 'monthly' ? '30D' : interval === 'quarterly' ? '90D' : '1Y'}
          </button>
          <button 
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8,leads,deals,revenue\n" + stats.leads + "," + stats.deals + "," + stats.revenue;
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "dashboard_snapshot.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="inline-flex items-center px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 transition-all"
          >
            <Download className="mr-2 h-4 w-4" />
            Full Snapshot
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
           {[1,2,3,4,5].map(i => (
             <div key={i} className="h-32 bg-white rounded-[32px] border border-slate-100 skeleton" />
           ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-[32px] flex items-center text-rose-600 font-bold">
          <AlertCircle className="w-6 h-6 mr-4" /> {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
          <StatCard 
            title="Total Prospects" 
            value={stats.leads} 
            trend="+12.5%" 
            trendUp={true} 
            icon={<Users className="w-5 h-5" />} 
            color="text-blue-600" 
            bg="bg-blue-50" 
          />
          <StatCard 
            title="Active Deals" 
            value={stats.deals} 
            trend="+4.2%" 
            trendUp={true} 
            icon={<Handshake className="w-5 h-5" />} 
            color="text-emerald-600" 
            bg="bg-emerald-50" 
          />
          <StatCard 
            title="Pipeline Value" 
            value={`$${stats.revenue.toLocaleString()}`} 
            trend="-2.1%" 
            trendUp={false} 
            icon={<DollarSign className="w-5 h-5" />} 
            color="text-amber-600" 
            bg="bg-amber-50" 
          />
          <StatCard 
            title="Marketing ROI" 
            value={stats.marketing_roi} 
            trend="+17.4%" 
            trendUp={true} 
            icon={<Megaphone className="w-5 h-5" />} 
            color="text-indigo-600" 
            bg="bg-indigo-50" 
          />
          <StatCard 
            title="Protocol Ops" 
            value={stats.tasks} 
            trend="+8" 
            trendUp={true} 
            icon={<ClipboardList className="w-5 h-5" />} 
            color="text-rose-600" 
            bg="bg-rose-50" 
          />
        </div>
      )}

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md p-8 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/20 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Revenue Projection</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Monthly sales performance vs forecast matrix</p>
            </div>
            <div className="flex items-center p-1 bg-slate-100/50 rounded-xl">
               <button className="px-4 py-1.5 bg-white shadow-sm rounded-lg text-xs font-bold text-slate-900">Current</button>
               <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">Historical</button>
            </div>
          </div>
          
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.9)'
                  }} 
                />
                <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorActual)" animationDuration={2000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <Activity className="absolute -right-6 -bottom-6 w-48 h-48 text-blue-600 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000" />
        </div>

        <div className="bg-slate-900 p-8 rounded-[32px] shadow-2xl shadow-slate-900/40 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
             <Target className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-black text-white tracking-tight">Source Distribution</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Lead Attribution Matrix</p>
          </div>

          <div className="mt-10 space-y-5 flex-1 relative z-10">
            {leadSources.slice(0, 5).map((source) => (
              <div key={source.name} className="space-y-2">
                <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-slate-400">
                  <span>{source.name}</span>
                  <span className="text-white">{source.value}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${source.value}%`, backgroundColor: source.color }} 
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 relative z-10">
             <div className="p-5 bg-white/5 rounded-[24px] flex items-center justify-between group-hover:bg-white/10 transition-colors">
                <div>
                   <p className="text-white text-[10px] font-black uppercase tracking-widest opacity-40">Intelligence Health</p>
                   <p className="text-white text-2xl font-black mt-1 tracking-tighter">Optimal</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                   <ShieldCheck className="w-6 h-6" />
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Deal Pipeline Row */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Deal Velocity</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Top performing deals in current cycle</p>
          </div>
          <button className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-all">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Company</th>
                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Pipeline Value</th>
                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Probability</th>
                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Phase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {dealClosures.map((deal) => (
                <tr key={deal.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{deal.company}</p>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">Assigned to Major Accounts</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-black text-slate-900">{deal.value}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col items-center max-w-[120px] mx-auto">
                       <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${deal.probability}%` }} />
                       </div>
                       <span className="text-[10px] font-black text-slate-500 mt-1.5">{deal.probability}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${deal.statusColor}`}>
                      {deal.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, trendUp, icon, color, bg }) {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 ${bg} ${color} rounded-2xl group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-black ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          <span>{trend}</span>
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 mt-1">{value}</h3>
      </div>
      <div className={`absolute -right-2 -bottom-2 w-16 h-16 ${bg} opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-transform`} />
    </div>
  );
}
