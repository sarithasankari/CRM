import React from 'react';
import Table from '../components/Table';
import { campaignsData } from '../data/dummy';
import { Megaphone, Send } from 'lucide-react';

export default function Marketing() {
  const columns = [
    { header: 'Campaign Name', accessor: 'name', render: (row) => <span className="font-medium text-gray-900">{row.name}</span> },
    { header: 'Target Audience', accessor: 'targetAudience' },
    { header: 'Sent', accessor: 'sent' },
    { header: 'Opened', accessor: 'opened' },
    { header: 'Clicked', accessor: 'clicked' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.status === 'Active' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Marketing Campaigns</h2>
          <p className="mt-1 text-sm text-gray-500">Reach your audience with bulk email campaigns.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors">
            <Megaphone className="-ml-1 mr-2 h-4 w-4" />
            New Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Send (Bulk)</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Filter Contacts by Tag</label>
              <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                <option>All Contacts</option>
                <option>Hot Lead</option>
                <option>Interested</option>
                <option>Enterprise</option>
                <option>Partner</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Template</label>
              <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                <option>Winter Promo</option>
                <option>Newsletter Q3</option>
                <option>Follow Up</option>
              </select>
            </div>
            <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors">
              <Send className="-ml-1 mr-2 h-4 w-4" /> Send to 1,245 Contacts
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <Table columns={columns} data={campaignsData} />
        </div>
      </div>
    </div>
  );
}
