import React, { useState, useEffect } from 'react';
import { 
  Users, DollarSign, Target, TrendingUp, Calendar, Download, 
  Handshake, ClipboardList, Mail, MoreHorizontal, Loader2, AlertCircle,
  ArrowUpRight, ArrowDownRight, Activity, Zap, CheckCircle2, Clock, Megaphone
} from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { leadsApi, dealsApi, tasksApi, analyticsApi } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ leads: 0, deals: 0, revenue: 0, tasks: 0, marketing_roi: '0%' });
  const [dealClosures, setDealClosures] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Don't set isLoading if it's just a background refresh
      if (!stats.leads) setIsLoading(true);
      try {
        const [dashboardRes, dealsRes] = await Promise.all([
          analyticsApi.getDashboardStats(),
          dealsApi.getAll()
        ]);
        
        setStats(dashboardRes.stats);
        setChartData(dashboardRes.chartData);
        setActivities(dashboardRes.activities);

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
  }, [lastMessage]);

  return (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Enterprise Overview</h2>
          <p className="mt-1 text-slate-500 font-medium">Real-time performance metrics for your sales pipeline.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            <Calendar className="mr-2 h-4 w-4 text-slate-400" />
            Last 30 Days
          </button>
          <button className="inline-flex items-center px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 transition-all">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {[1,2,3,4].map(i => (
             <div key={i} className="h-32 bg-white rounded-3xl border border-slate-200 skeleton" />
           ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center text-rose-600 font-bold">
          <AlertCircle className="w-5 h-5 mr-3" /> {error}
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
            trend="+8%" 
            trendUp={true} 
            icon={<Megaphone className="w-5 h-5" />} 
            color="text-indigo-600" 
            bg="bg-indigo-50" 
          />
          <StatCard 
            title="Open Tasks" 
            value={stats.tasks} 
            trend="+8" 
            trendUp={true} 
            icon={<ClipboardList className="w-5 h-5" />} 
            color="text-purple-600" 
            bg="bg-purple-50" 
          />
        </div>
      )}

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Revenue Projection</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Monthly sales performance vs forecast</p>
            </div>
            <div className="flex items-center p-1 bg-slate-50 rounded-xl">
               <button className="px-4 py-1.5 bg-white shadow-sm rounded-lg text-xs font-bold text-slate-900">Weekly</button>
               <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">Monthly</button>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} dy={10} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    padding: '12px'
                  }} 
                />
                <Area type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorActual)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <Activity className="absolute -right-6 -bottom-6 w-32 h-32 text-slate-50 opacity-10" />
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Live Pulse</h3>
            <button className="text-xs font-bold text-blue-600 hover:underline">View History</button>
          </div>
          <div className="space-y-6 flex-1">
            {activities.map((item) => (
              <div key={item.id} className="flex items-start space-x-4 group cursor-pointer">
                <div className={`p-3 ${item.iconColor} rounded-2xl shadow-sm group-hover:scale-110 transition-transform`}>
                  {item.type === 'deal' && <Zap className="w-4 h-4" />}
                  {item.type === 'lead' && <Target className="w-4 h-4" />}
                  {item.type === 'task' && <Clock className="w-4 h-4" />}
                  {item.type === 'meeting' && <Calendar className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-400 mt-1">{item.meta}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-slate-50">
             <div className="p-4 bg-slate-900 rounded-2xl flex items-center justify-between">
                <div>
                   <p className="text-white text-xs font-bold uppercase tracking-widest opacity-60">Success Rate</p>
                   <p className="text-white text-xl font-black mt-1">92.4%</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
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
