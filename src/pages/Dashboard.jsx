import React from 'react';
import { 
  Users, DollarSign, Target, TrendingUp, Calendar, Download, 
  Handshake, ClipboardList, Mail, MoreHorizontal 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const chartData = [
  { name: 'Jan', actual: 4000, projected: 1000 },
  { name: 'Feb', actual: 6000, projected: 1500 },
  { name: 'Mar', actual: 4500, projected: 3000 },
  { name: 'Apr', actual: 8000, projected: 2000 },
  { name: 'May', actual: 9500, projected: 2500 },
  { name: 'Jun', actual: 8500, projected: 3500 },
];

const activities = [
  { 
    id: 1, 
    type: 'deal', 
    title: 'Deal Closed: TechFlow Inc.', 
    meta: 'by Sarah Jenkins • 2 mins ago', 
    badge: '$45,000',
    badgeColor: 'bg-green-100 text-green-700',
    iconColor: 'bg-blue-50 text-blue-500',
    icon: <Handshake className="w-4 h-4" />
  },
  { 
    id: 2, 
    type: 'lead', 
    title: 'New Lead: Global Logistics', 
    meta: 'by Automated Pipeline • 1 hour ago', 
    badge: 'QUALIFYING',
    badgeColor: 'bg-blue-100 text-blue-700',
    iconColor: 'bg-purple-50 text-purple-500',
    icon: <Users className="w-4 h-4" />
  },
  { 
    id: 3, 
    type: 'task', 
    title: 'Task Overdue: Contract Review', 
    meta: 'assigned to David Wu • 3 hours ago', 
    badge: 'HIGH PRIORITY',
    badgeColor: 'bg-red-50 text-red-600',
    iconColor: 'bg-orange-50 text-orange-500',
    icon: <ClipboardList className="w-4 h-4" />
  },
  { 
    id: 4, 
    type: 'email', 
    title: 'Email Received: Feedback', 
    meta: 'from Robert Moore • 5 hours ago', 
    content: '"Looking forward to the proposal..."',
    iconColor: 'bg-gray-100 text-gray-500',
    icon: <Mail className="w-4 h-4" />
  },
];

const dealClosures = [
  { company: 'Horizon Softwares', contact: 'Alex Thompson', value: '$84,000', probability: 85, status: 'Negotiation', statusColor: 'bg-green-100 text-green-700', barColor: 'bg-green-500' },
  { company: 'Peak Logistics', contact: 'Maria Garcia', value: '$125,000', probability: 60, status: 'Proposal', statusColor: 'bg-blue-100 text-blue-700', barColor: 'bg-yellow-500' },
  { company: 'Stellar Media', contact: 'Chris Evans', value: '$12,400', probability: 30, status: 'Discovery', statusColor: 'bg-orange-100 text-orange-700', barColor: 'bg-red-500' },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Executive Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">Welcome back, Marcus. Here's what's happening today.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="inline-flex items-center px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors">
            <Calendar className="-ml-1 mr-2 h-4 w-4 text-gray-500" />
            Last 30 Days
          </button>
          <button className="inline-flex items-center px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors">
            <Download className="-ml-1 mr-2 h-4 w-4 text-gray-500" />
            Export Report
          </button>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700">
              +12.5%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Total Leads</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">2,543</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-orange-50 rounded-lg text-orange-500">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700">
              +5.2%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Active Deals</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">184</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-green-50 rounded-lg text-green-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700">
              +18.1%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">$1.24M</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-purple-50 rounded-lg text-purple-600">
              <Target className="w-5 h-5" />
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-600">
              24 Overdue
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Pending Tasks</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">42</h3>
          </div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Sales Revenue</h3>
              <p className="text-sm text-gray-500">Consolidated monthly revenue performance</p>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                <span className="text-gray-600">Actual</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-slate-100 mr-2"></span>
                <span className="text-gray-600">Projected</span>
              </div>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Bar dataKey="actual" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={40} />
                <Bar dataKey="projected" stackId="a" fill="#f1f5f9" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</button>
          </div>
          <div className="flex-1">
            <div className="relative border-l border-gray-100 ml-3 space-y-6">
              {activities.map((item, idx) => (
                <div key={item.id} className="relative pl-6">
                  <div className={`absolute -left-4 top-1 w-8 h-8 rounded-full flex items-center justify-center ${item.iconColor} border-4 border-white`}>
                    {item.icon}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">{item.title}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.meta}</p>
                    {item.badge && (
                      <div className="mt-2">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>
                    )}
                    {item.content && (
                      <p className="mt-2 text-sm italic text-gray-600">{item.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Source */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Lead Source Distribution</h3>
          <div className="space-y-6 flex-1">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Organic Search</span>
                <span className="font-bold text-gray-900">42%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">LinkedIn Ads</span>
                <span className="font-bold text-gray-900">28%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-blue-400 h-2 rounded-full" style={{ width: '28%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Referrals</span>
                <span className="font-bold text-gray-900">18%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-indigo-400 h-2 rounded-full" style={{ width: '18%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Direct Mail</span>
                <span className="font-bold text-gray-900">12%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-gray-400 h-2 rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">1,240</p>
              <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase mt-1">NEW LEADS</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">24.5%</p>
              <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase mt-1">CONV. RATE</p>
            </div>
          </div>
        </div>

        {/* Upcoming Deals */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Upcoming Deal Closures</h3>
            <button className="inline-flex items-center px-3 py-1.5 border border-gray-200 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              Filter Table
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr>
                  <th className="px-0 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Probability</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dealClosures.map((deal, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-0 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-900 text-sm">{deal.company}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{deal.contact}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">{deal.value}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5">
                          <div className={`${deal.barColor} h-1.5 rounded-full`} style={{ width: `${deal.probability}%` }}></div>
                        </div>
                        <span className="text-sm text-gray-600">{deal.probability}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-md ${deal.statusColor}`}>
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
    </div>
  );
}
