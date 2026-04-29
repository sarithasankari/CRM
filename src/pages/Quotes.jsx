import React, { useState } from 'react';
import Table from '../components/Table';
import { quotesData } from '../data/dummy';
import { Plus, FileText, Download } from 'lucide-react';

export default function Quotes() {
  const [isCreating, setIsCreating] = useState(false);
  const [items, setItems] = useState([{ name: '', qty: 1, price: 0 }]);

  const columns = [
    { header: 'Quote #', accessor: 'quoteNumber', render: (row) => <span className="font-medium text-primary-600">{row.quoteNumber}</span> },
    { header: 'Client', accessor: 'client' },
    { header: 'Date', accessor: 'date' },
    { header: 'Total', accessor: 'total', render: (row) => <span className="font-semibold text-gray-900">${row.total.toLocaleString()}</span> },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => {
        const getStatusColor = (status) => {
          return status === 'Sent' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
        };
        return (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(row.status)}`}>
            {row.status}
          </span>
        );
      }
    },
    { 
      header: 'Action', 
      accessor: 'action',
      render: () => (
        <button className="text-primary-600 hover:text-primary-900 flex items-center text-sm">
          <Download className="w-4 h-4 mr-1" /> PDF
        </button>
      )
    }
  ];

  const handleAddItem = () => setItems([...items, { name: '', qty: 1, price: 0 }]);
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };
  
  const totalAmount = items.reduce((acc, curr) => acc + (curr.qty * curr.price), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quotes</h2>
          <p className="mt-1 text-sm text-gray-500">Generate and manage quotes for your clients.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
          >
            {isCreating ? 'Cancel' : <><Plus className="-ml-1 mr-2 h-4 w-4" /> Create Quote</>}
          </button>
        </div>
      </div>

      {isCreating ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center"><FileText className="w-5 h-5 mr-2 text-primary-500" /> New Quote Builder</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Client Name</label>
                <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" placeholder="Enter client name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Items</h4>
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-4 mb-2">
                  <input type="text" placeholder="Description" className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm" value={item.name} onChange={e => handleItemChange(idx, 'name', e.target.value)} />
                  <input type="number" min="1" placeholder="Qty" className="w-24 border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm" value={item.qty} onChange={e => handleItemChange(idx, 'qty', Number(e.target.value))} />
                  <input type="number" min="0" placeholder="Price" className="w-32 border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm" value={item.price} onChange={e => handleItemChange(idx, 'price', Number(e.target.value))} />
                  <span className="w-24 text-right text-gray-700 font-medium">${(item.qty * item.price).toLocaleString()}</span>
                </div>
              ))}
              <button onClick={handleAddItem} className="mt-2 text-sm text-primary-600 hover:text-primary-800">+ Add Item</button>
            </div>

            <div className="border-t border-gray-200 mt-6 pt-4 flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">Total: <span className="font-bold text-2xl text-primary-600">${totalAmount.toLocaleString()}</span></span>
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors">
                <FileText className="-ml-1 mr-2 h-4 w-4" /> Generate PDF
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <Table columns={columns} data={quotesData} />
        </div>
      )}
    </div>
  );
}
