import React, { useState } from 'react';
import { Wrench, Plus, CheckCircle2, Clock } from 'lucide-react';

const initialServices = [
  { id: 1, name: 'Premium Onboarding', customer: 'Acme Corp', status: 'In Progress', assignedTo: 'Sarah M.', date: 'Oct 20' },
  { id: 2, name: 'Custom Data Migration', customer: 'Global Tech', status: 'Pending', assignedTo: 'Tech Team', date: 'Oct 28' },
  { id: 3, name: 'Quarterly Audit', customer: 'Security First', status: 'Completed', assignedTo: 'Jason B.', date: 'Oct 15' },
];

export default function Services() {
  const [services] = useState(initialServices);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Completed': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> {status}</span>;
      case 'In Progress': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" /> {status}</span>;
      default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-10">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Services</h2>
          <p className="mt-1 text-sm text-gray-500">Track custom business services assigned to customers.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Add Service
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Service Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned To</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Wrench className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-semibold text-gray-900">{service.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{service.customer}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{service.assignedTo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">{getStatusBadge(service.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
