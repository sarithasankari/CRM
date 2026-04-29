import React, { useState } from 'react';
import Table from '../components/Table';
import { leadsData } from '../data/dummy';
import { Plus, Download, ChevronDown, Calendar, ArrowDown, X, Zap } from 'lucide-react';

export default function Leads() {
  const [leads, setLeads] = useState(leadsData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Lead Form State
  const [formData, setFormData] = useState({
    name: '', jobTitle: '', email: '', company: ''
  });

  // Sort leads by score descending
  const sortedLeads = [...leads].sort((a, b) => (b.score || 0) - (a.score || 0));

  const columns = [
    { 
      header: (
        <div className="flex items-center">
          NAME <ArrowDown className="ml-1 h-3 w-3" />
        </div>
      ), 
      accessor: 'name',
      render: (row) => {
        const initials = row.name.split(' ').map(n => n[0]).join('');
        const bgColors = ['bg-blue-100', 'bg-orange-100', 'bg-purple-100', 'bg-gray-100'];
        const textColors = ['text-blue-700', 'text-orange-700', 'text-purple-700', 'text-gray-700'];
        const colorIndex = row.name.length % bgColors.length;
        
        return (
          <div className="flex items-center">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold mr-4 shadow-sm border border-white ${bgColors[colorIndex]} ${textColors[colorIndex]}`}>
              {initials}
            </div>
            <div>
              <div className="font-semibold text-gray-900">{row.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{row.jobTitle}</div>
            </div>
          </div>
        );
      }
    },
    { 
      header: 'COMPANY', 
      accessor: 'company',
      render: (row) => <span className="text-gray-700">{row.company}</span>
    },
    { 
      header: 'EMAIL', 
      accessor: 'email',
      render: (row) => <span className="text-gray-600">{row.email}</span>
    },
    { 
      header: 'SCORE', 
      accessor: 'score',
      render: (row) => {
        const score = row.score || 0;
        let colorClass = 'bg-gray-100 text-gray-700';
        if (score >= 80) colorClass = 'bg-green-100 text-green-700 border border-green-200 shadow-[0_0_8px_rgba(34,197,94,0.4)]';
        else if (score >= 40) colorClass = 'bg-yellow-100 text-yellow-700 border border-yellow-200';
        else colorClass = 'bg-gray-100 text-gray-600 border border-gray-200';

        return (
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 inline-flex items-center text-xs font-bold rounded-full ${colorClass}`}>
              {score >= 80 && <Zap className="w-3 h-3 mr-1 fill-current" />}
              {score}
            </span>
          </div>
        );
      }
    },
    { 
      header: 'LEAD STATUS', 
      accessor: 'status',
      render: (row) => {
        const getStatusStyles = (status) => {
          switch(status) {
            case 'New': return 'bg-green-100 text-green-700';
            case 'Contacted': return 'bg-yellow-100 text-yellow-700';
            case 'Qualified': return 'bg-blue-100 text-blue-700';
            case 'Lost': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
          }
        };
        return (
          <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-md ${getStatusStyles(row.status)}`}>
            {row.status}
          </span>
        );
      }
    },
    { 
      header: 'OWNER', 
      accessor: 'rep',
      render: (row) => (
        <div className="flex items-center">
          <img 
            src={`https://ui-avatars.com/api/?name=${row.rep}&background=random&size=32&rounded=true`} 
            alt={row.rep} 
            className="h-6 w-6 rounded-full mr-2"
          />
          <span className="text-sm text-gray-700">{row.rep}</span>
        </div>
      )
    },
    { 
      header: 'CREATED', 
      accessor: 'created',
      render: (row) => <span className="text-gray-600 text-sm">{row.created}</span>
    },
  ];

  const handleAddLead = (e) => {
    e.preventDefault();
    const newLead = {
      id: Date.now(),
      ...formData,
      status: 'New',
      rep: 'Unassigned',
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      score: 10 // Module 2 rules: New contact = 10 points
    };
    setLeads([newLead, ...leads]);
    setIsModalOpen(false);
    setFormData({ name: '', jobTitle: '', email: '', company: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-10">
      {/* Header Section */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Leads</h2>
          <p className="mt-1 text-sm text-gray-500">Manage and track your sales pipeline prospects</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors">
            <Download className="-ml-1 mr-2 h-4 w-4" />
            Export CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#0f3460] hover:bg-[#1a4a82] focus:outline-none transition-colors"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 sm:pb-0">
          <button className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-full text-sm text-gray-700 bg-white hover:bg-gray-50 whitespace-nowrap">
            Status: All
            <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-full text-sm text-gray-700 bg-white hover:bg-gray-50 whitespace-nowrap">
            Owner: Everyone
            <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
          </button>
          
          <div className="h-6 w-px bg-gray-300 mx-2 hidden sm:block"></div>
          
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 rounded-full text-sm bg-blue-100 text-blue-700 font-medium whitespace-nowrap">
              New
            </button>
            <button className="px-4 py-2 rounded-full text-sm text-gray-600 hover:bg-gray-100 whitespace-nowrap">
              Contacted
            </button>
            <button className="px-4 py-2 rounded-full text-sm text-gray-600 hover:bg-gray-100 whitespace-nowrap">
              Qualified
            </button>
          </div>
        </div>
        
        <button className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 whitespace-nowrap">
          <Calendar className="mr-2 h-4 w-4 text-gray-500" />
          Date Range: Last 30 Days
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden">
        <Table columns={columns} data={sortedLeads} />
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-900">1</span> to <span className="font-medium text-gray-900">{sortedLeads.length}</span> of <span className="font-medium text-gray-900">156</span> leads
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50">
              Previous
            </button>
            <div className="flex items-center space-x-1">
              <button className="px-3 py-1 rounded-md text-sm font-medium bg-[#0f3460] text-white">1</button>
              <button className="px-3 py-1 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100">2</button>
              <span className="px-2 text-gray-400">...</span>
              <button className="px-3 py-1 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100">16</button>
            </div>
            <button className="px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 bg-white hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Add New Lead</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddLead} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Smith"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input 
                  required
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input 
                    type="text" 
                    value={formData.jobTitle}
                    onChange={e => setFormData({...formData, jobTitle: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="CEO"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input 
                    type="text" 
                    value={formData.company}
                    onChange={e => setFormData({...formData, company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-gray-100 flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#0f3460] border border-transparent rounded-lg hover:bg-[#1a4a82] focus:outline-none shadow-sm"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
