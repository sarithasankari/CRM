import React, { useState } from 'react';
import Table from '../components/Table';
import { contactsData } from '../data/dummy';
import { Plus, Filter, X, Zap } from 'lucide-react';

export default function Contacts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contacts, setContacts] = useState(contactsData);
  
  // New Contact Form State
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', company: ''
  });

  // Sort contacts by score descending
  const sortedContacts = [...contacts].sort((a, b) => (b.score || 0) - (a.score || 0));

  const columns = [
    { 
      header: 'Name', 
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mr-3 shadow-sm border border-indigo-200">
            {row.name.charAt(0)}
          </div>
          <div>
            <span className="font-semibold text-gray-900 block">{row.name}</span>
            <span className="text-xs text-gray-500">{row.email}</span>
          </div>
        </div>
      )
    },
    { header: 'Company', accessor: 'company', render: (row) => <span className="text-gray-700">{row.company}</span> },
    { header: 'Phone', accessor: 'phone', render: (row) => <span className="text-gray-600">{row.phone}</span> },
    { 
      header: 'Lead Score', 
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
      header: 'Tags', 
      accessor: 'tags',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          {row.tags?.map(tag => (
            <span key={tag} className="px-2 py-0.5 inline-flex text-xs font-medium bg-purple-50 border border-purple-100 text-purple-700 rounded-md">
              {tag}
            </span>
          ))}
        </div>
      )
    },
    { 
      header: 'Last Contacted', 
      accessor: 'lastContacted',
      render: (row) => {
        if (!row.lastContacted) return <span className="text-gray-400">Never</span>;
        const daysAgo = Math.floor((new Date() - new Date(row.lastContacted)) / (1000 * 60 * 60 * 24));
        const isAlert = daysAgo > 7;
        
        return (
          <div className="flex items-center">
            <span className={`text-sm ${isAlert ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
              {row.lastContacted}
            </span>
            {isAlert && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200 shadow-[0_0_5px_rgba(239,68,68,0.3)] animate-pulse">
                Follow-up Needed
              </span>
            )}
          </div>
        )
      }
    },
  ];

  const filteredData = sortedContacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    contact.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddContact = (e) => {
    e.preventDefault();
    const newContact = {
      id: Date.now(),
      ...formData,
      tags: ['New Contact'],
      lastContacted: new Date().toISOString().split('T')[0],
      score: 10 // Module 2 rules: New contact = 10 points
    };
    setContacts([newContact, ...contacts]);
    setIsModalOpen(false);
    setFormData({ name: '', email: '', phone: '', company: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-10">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Contacts</h2>
          <p className="mt-1 text-sm text-gray-500">Manage network, apply tags, and track engagement scores.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button className="inline-flex items-center px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors">
            <Filter className="-ml-1 mr-2 h-4 w-4 text-gray-500" />
            Filter
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Add Contact
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center">
          <input
            type="text"
            placeholder="Search contacts by name or company..."
            className="block w-full max-w-md pl-3 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Table columns={columns} data={filteredData} />
      </div>

      {/* Add Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Add New Contact</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddContact} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jane Doe"
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
                  placeholder="jane@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="555-0199"
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
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none shadow-sm"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
