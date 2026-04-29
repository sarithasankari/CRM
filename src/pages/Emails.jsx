import React, { useState } from 'react';
import Table from '../components/Table';
import { emailsData } from '../data/dummy';
import { Mail, Edit3 } from 'lucide-react';

export default function Emails() {
  const [isComposing, setIsComposing] = useState(false);

  const columns = [
    { header: 'To', accessor: 'to' },
    { 
      header: 'Subject', 
      accessor: 'subject',
      render: (row) => <span className="font-medium text-gray-900">{row.subject}</span>
    },
    { header: 'Date', accessor: 'date' },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => {
        const getStatusStyle = (status) => {
          switch(status) {
            case 'Sent': return 'text-gray-600 bg-gray-100';
            case 'Opened': return 'text-blue-600 bg-blue-100';
            case 'Clicked': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
          }
        };
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(row.status)}`}>
            {row.status}
          </span>
        );
      }
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email History</h2>
          <p className="mt-1 text-sm text-gray-500">Track and manage your sent emails and templates.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={() => setIsComposing(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            <Edit3 className="-ml-1 mr-2 h-4 w-4" />
            Compose
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Table columns={columns} data={emailsData} />
      </div>

      {isComposing && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsComposing(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Mail className="h-6 w-6 text-primary-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Compose Email
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="to" className="block text-sm font-medium text-gray-700">To</label>
                        <input type="text" name="to" id="to" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="contact@example.com" />
                      </div>
                      <div>
                        <label htmlFor="template" className="block text-sm font-medium text-gray-700">Template</label>
                        <select id="template" name="template" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                          <option>None</option>
                          <option>Introductory Offer</option>
                          <option>Follow Up</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                        <input type="text" name="subject" id="subject" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="body" className="block text-sm font-medium text-gray-700">Message</label>
                        <textarea id="body" name="body" rows="6" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" onClick={() => setIsComposing(false)} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm">
                  Send
                </button>
                <button type="button" onClick={() => setIsComposing(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
