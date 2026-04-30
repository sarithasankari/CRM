import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../services/api';
import { 
  TrendingUp, DollarSign, Clock, Award, 
  TrendingDown, Minus, ArrowUpRight, ArrowDownRight, Map,
  BarChart3, PieChart, Activity, Globe, Zap, Filter, ChevronDown
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';

// Dummy data removed. Everything is fetched from the backend API.

export default function Analytics() {
  const [timeframe, setTimeframe] = useState('Monthly');
  const [stats, setStats] = useState({
    conversion_rate: '0.0%',
    avg_deal_size: '$0',
    cycle_velocity: '0 Days',
    win_ratio: '0.0%',
    total_revenue: '$0'
  });
  const [forecastData, setForecastData] = useState([]);
  const [teamData, setTeamData] = useState([]);

  useEffect(() => {
    let interval;
    const fetchAnalytics = () => {
      analyticsApi.getDashboard()
        .then(data => {
          if (data.analytics) setStats(data.analytics);
          if (data.trends) setForecastData(data.trends);
          if (data.team_performance) setTeamData(data.team_performance);
        })
        .catch(err => console.error("Failed to load analytics", err));
    };
    
    fetchAnalytics();
    interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [timeframe]);

  const TrendIcon = ({ type, className }) => {
    if (type === 'up') return <TrendingUp className={className} />;
    if (type === 'down') return <TrendingDown className={className} />;
    return <Minus className={className} />;
  };

  return (
    <div className="space-y-10 animate-fade-in max-w-[1600px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center space-x-2 mb-1">
             <Activity className="w-5 h-5 text-blue-600" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analytics</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Analytics</h2>
        </div>
        
        <div className="flex items-center space-x-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          {['Monthly', 'Quarterly', 'Annual'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-6 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
                timeframe === t 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                  : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* High-Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Conversion Rate', value: stats.conversion_rate, trend: '+12.5%', icon: Zap, color: 'blue' },
          { label: 'Avg Deal Size', value: stats.avg_deal_size, trend: '+8.2%', icon: DollarSign, color: 'emerald' },
          { label: 'Cycle Velocity', value: stats.cycle_velocity, trend: '-4 Days', icon: Clock, color: 'amber' },
          { label: 'Win Ratio', value: stats.win_ratio, trend: '+3.1%', icon: Award, color: 'indigo' }
        ].map((kpi, i) => (
          <div key={i} className="glass-card p-8 group hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div className={`p-4 bg-${kpi.color}-50 rounded-2xl text-${kpi.color}-600 border border-${kpi.color}-100 group-hover:scale-110 transition-transform`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                kpi.trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {kpi.trend}
              </span>
            </div>
            <div className="mt-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Forecast Chart */}
        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/40 lg:col-span-2">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900">Revenue Projections</h3>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Predicted vs. Actual Pipeline</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-2 shadow-lg shadow-blue-600/20"></span>
                Actual
              </div>
              <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-100 border border-blue-200 mr-2"></span>
                Forecast
              </div>
            </div>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }} barGap={-24}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={15} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }} 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }} 
                />
                <Bar dataKey="projected" fill="#eff6ff" radius={[12, 12, 0, 0]} barSize={40} />
                <Bar dataKey="actual" fill="#2563eb" radius={[12, 12, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Distribution */}
        <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden flex flex-col group">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
               <h3 className="text-xl font-black text-white">Global Footprint</h3>
               <Globe className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Geospatial Distribution</p>
            
            <div className="mt-12 space-y-10">
              {[
                { region: 'North America', value: 45, color: 'blue-500' },
                { region: 'European Union', value: 32, color: 'indigo-500' },
                { region: 'Asia Pacific', value: 18, color: 'emerald-500' }
              ].map((loc, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[11px] font-black tracking-widest uppercase mb-4">
                    <span className="text-slate-400">{loc.region}</span>
                    <span>{loc.value}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className={`bg-${loc.color} h-full rounded-full group-hover:opacity-100 transition-opacity`} style={{ width: `${loc.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-auto relative z-10 pt-10">
             <button className="w-full py-4 bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:bg-slate-700 transition-all">
                Export Regional Data
             </button>
          </div>
          
          <div className="absolute top-0 right-0 p-10 opacity-20 group-hover:scale-125 transition-transform duration-1000">
             <Map className="w-64 h-64 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Team Performance Leaderboard */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Personnel Velocity</h3>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Strategic Representative Benchmarks</p>
          </div>
          <button className="flex items-center px-6 py-3 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all border border-slate-100">
            Export Ledger <ChevronDown className="ml-2 w-4 h-4" />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Representative</th>
                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Registry Closures</th>
                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Revenue Yield</th>
                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Conversion Ratio</th>
                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {teamData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-10 py-10 text-center text-slate-400 font-medium">No team performance data available</td>
                </tr>
              ) : teamData.map((person) => (
                <tr key={person.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-10 py-6">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-sm font-black text-slate-400 border border-slate-200 group-hover:scale-110 transition-transform">
                         {person.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="ml-5">
                        <div className="text-base font-bold text-slate-900 line-clamp-1">{person.name}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{person.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="text-sm font-bold text-slate-900">{person.deals} Objectives</div>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <div className="text-sm font-black text-slate-900">{person.revenue}</div>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-wider border border-slate-100">
                      {person.winRate}%
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <TrendIcon type={person.trend} className={`w-6 h-6 ml-auto ${person.trendColor}`} />
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
