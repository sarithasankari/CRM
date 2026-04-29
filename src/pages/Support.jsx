import React from 'react';
import Table from '../components/Table';
import { ticketsData } from '../data/dummy';
import { LifeBuoy } from 'lucide-react';

export default function Support() {
  const columns = [
    { header: 'Ticket ID', accessor: 'ticketNumber', render: (row) => <span className="font-medium text-gray-900">{row.ticketNumber}</span> },
    { header: 'Subject', accessor: 'subject' },
    { header: 'Contact', accessor: 'contact' },
    { header: 'Assigned To', accessor: 'assignedTo' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => {
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${row.status === 'Open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {row.status}
          </span>
        );
      }
    },
    { 
      header: 'Actions', 
      accessor: 'actions',
      render: () => (
        <button className="text-primary-600 hover:text-primary-900 font-medium text-sm">
          View Notes
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
          <p className="mt-1 text-sm text-gray-500">Manage customer enquiries and issues.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors">
            <LifeBuoy className="-ml-1 mr-2 h-4 w-4" />
            New Ticket
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Table columns={columns} data={ticketsData} />
      </div>
    </div>
  );
}
