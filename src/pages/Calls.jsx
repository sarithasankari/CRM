import React, { useState } from 'react';
import { Plus, PhoneCall, PhoneForwarded, PhoneMissed, Clock, User, X } from 'lucide-react';

const initialCalls = [
  { id: 1, type: 'Outbound', contact: 'Sarah Miller', duration: '15 mins', outcome: 'Interested', date: 'Oct 23, 10:00 AM' },
  { id: 2, type: 'Inbound', contact: 'Jason Bourne', duration: '5 mins', outcome: 'Left Voicemail', date: 'Oct 23, 2:30 PM' },
  { id: 3, type: 'Scheduled', contact: 'Acme Corp', duration: '30 mins (Est)', outcome: 'Pending', date: 'Oct 25, 1:00 PM' },
];

export default function Calls() {
  const [calls, setCalls] = useState(initialCalls);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ type: 'Outbound', contact: '', duration: '', outcome: 'Connected', date: '' });

  const handleAddCall = (e) => {
    e.preventDefault();
    const newCall = { id: Date.now(), ...formData };
    setCalls([newCall, ...calls]);
    setIsModalOpen(false);
    setFormData({ type: 'Outbound', contact: '', duration: '', outcome: 'Connected', date: '' });
  };

  const getCallIcon = (type) => {
    switch(type) {
      case 'Outbound': return <PhoneForwarded className="w-5 h-5 text-blue-500" />;
      case 'Inbound': return <PhoneCall className="w-5 h-5 text-green-500" />;
      case 'Scheduled': return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <PhoneCall className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-10">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Calls</h2>
          <p className="mt-1 text-sm text-gray-500">Log calls and schedule future check-ins.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Log / Schedule Call
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {calls.map(call => (
            <li key={call.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center space-x-4">
              <div className="flex-shrink-0 p-2 bg-gray-100 rounded-full">
                {getCallIcon(call.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center">
                    <User className="w-4 h-4 mr-1 text-gray-400" />
                    {call.contact}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    call.outcome === 'Interested' ? 'bg-green-50 text-green-700 border-green-200' :
                    call.outcome === 'Left Voicemail' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-gray-50 text-gray-700 border-gray-200'
                  }`}>
                    {call.outcome}
                  </span>
                </div>
                <div className="mt-1 flex items-center text-xs text-gray-500 space-x-4">
                  <span><span className="font-medium text-gray-600">Type:</span> {call.type}</span>
                  <span><span className="font-medium text-gray-600">Duration:</span> {call.duration}</span>
                  <span><span className="font-medium text-gray-600">Date:</span> {call.date}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Log Call</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddCall} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Call Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option>Outbound</option><option>Inbound</option><option>Scheduled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact / Lead *</label>
                  <input required type="text" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input type="text" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 15 mins" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date/Time</label>
                  <input type="text" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Oct 25, 10:00 AM" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                <input type="text" value={formData.outcome} onChange={e => setFormData({...formData, outcome: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Interested, Left Voicemail..." />
              </div>

              <div className="pt-4 mt-6 border-t border-gray-100 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none shadow-sm">Save Call</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
