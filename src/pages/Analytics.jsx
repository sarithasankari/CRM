import React, { useState } from 'react';
import { 
  TrendingUp, DollarSign, Clock, Award, 
  TrendingDown, Minus, ArrowUpRight, ArrowDownRight, Map
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const forecastData = [
  { name: 'JAN', actual: 4200, forecast: 5000 },
  { name: 'FEB', actual: 4800, forecast: 5500 },
  { name: 'MAR', actual: 4500, forecast: 4800 },
  { name: 'APR', actual: 6800, forecast: 7500 },
  { name: 'MAY', actual: 8500, forecast: 9000 },
  { name: 'JUN', actual: 9200, forecast: 8500 },
];

const teamData = [
  { 
    id: 1, name: 'Marcus Thorne', role: 'Enterprise Account Manager', 
    deals: 24, revenue: '$342,000', winRate: 78, winRateColor: 'bg-green-50 text-green-700', 
    trend: 'up', trendColor: 'text-green-500' 
  },
  { 
    id: 2, name: 'Sarah Jenkins', role: 'Senior Sales Associate', 
    deals: 19, revenue: '$285,500', winRate: 64, winRateColor: 'bg-green-50 text-green-700', 
    trend: 'up', trendColor: 'text-green-500' 
  },
  { 
    id: 3, name: 'David Chen', role: 'Mid-Market Specialist', 
    deals: 15, revenue: '$198,200', winRate: 52, winRateColor: 'bg-orange-50 text-orange-700', 
    trend: 'flat', trendColor: 'text-gray-400' 
  },
  { 
    id: 4, name: 'Elena Rodriguez', role: 'Sales Development Rep', 
    deals: 12, revenue: '$145,000', winRate: 41, winRateColor: 'bg-red-50 text-red-700', 
    trend: 'down', trendColor: 'text-red-500' 
  },
];

export default function Analytics() {
  const [timeframe, setTimeframe] = useState('Monthly');

  const TrendIcon = ({ type, className }) => {
    if (type === 'up') return <TrendingUp className={className} />;
    if (type === 'down') return <TrendingDown className={className} />;
    return <Minus className={className} />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Analytics Performance</h2>
          <p className="mt-1 text-sm text-gray-500">Real-time sales intelligence and revenue forecasting.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
          {['Monthly', 'Quarterly', 'Annual'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                timeframe === t 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700">
              +12.5%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">24.8%</h3>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700">
              +8.2%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Average Deal Size</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">$14,200</h3>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-600">
              -4 days
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Sales Cycle Length</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">18 Days</h3>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
              <Award className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700">
              +3.1%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Win Rate</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">62.4%</h3>
          </div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Forecast Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Revenue Forecast</h3>
              <p className="text-sm text-gray-500">Predicted vs. Actual revenue for Q3 2024</p>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                <span className="text-gray-600">Actual</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200 mr-2"></span>
                <span className="text-gray-600">Forecast</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }} barGap={-28}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} dy={10} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Bar dataKey="forecast" fill="#dbeafe" radius={[4, 4, 0, 0]} barSize={44} />
                <Bar dataKey="actual" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Region */}
        <div className="bg-[#111827] p-8 rounded-xl shadow-sm text-white relative overflow-hidden">
          {/* Subtle world map background effect */}
          <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
             <Map className="w-64 h-64 text-blue-300" />
          </div>

          <div className="relative z-10">
            <h3 className="text-xl font-bold tracking-tight">Sales by Region</h3>
            <p className="text-sm text-gray-400 mt-1">Global market distribution</p>
            
            <div className="mt-12 space-y-8">
              <div>
                <div className="flex justify-between text-xs font-bold tracking-wider uppercase mb-3">
                  <span className="text-gray-300">North America</span>
                  <span>45%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs font-bold tracking-wider uppercase mb-3">
                  <span className="text-gray-300">Europe</span>
                  <span>32%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div className="bg-blue-400 h-1.5 rounded-full opacity-80" style={{ width: '32%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs font-bold tracking-wider uppercase mb-3">
                  <span className="text-gray-300">Asia Pacific</span>
                  <span>18%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div className="bg-blue-300 h-1.5 rounded-full opacity-60" style={{ width: '18%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Team Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Team Performance</h3>
            <p className="text-sm text-gray-500 mt-1">Top performing sales representatives this month</p>
          </div>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View All Team</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Representative</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Deals Closed</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Revenue Generated</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Win Rate</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {teamData.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img 
                        className="h-10 w-10 rounded-full border border-gray-200" 
                        src={`https://ui-avatars.com/api/?name=${person.name}&background=random&size=40&rounded=true`} 
                        alt={person.name} 
                      />
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900">{person.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{person.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{person.deals}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{person.revenue}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-md ${person.winRateColor}`}>
                      {person.winRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <TrendIcon type={person.trend} className={`w-5 h-5 ${person.trendColor}`} />
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
