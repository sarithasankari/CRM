import React, { useState } from 'react';
import { Plus, Users, Calendar, Clock, Video, FileText, X } from 'lucide-react';

const initialMeetings = [
  { id: 1, title: 'Product Demo', date: '2023-10-25', time: '10:00 AM - 11:00 AM', participants: ['Sarah Miller', 'John Doe'], type: 'Video Call', notes: 'Walk through new features.' },
  { id: 2, type: 'In Person', title: 'Q3 Strategy Sync', date: '2023-10-26', time: '2:00 PM - 3:30 PM', participants: ['Jane Smith', 'Exec Team'], notes: 'Review quarterly goals.' },
];

export default function Meetings() {
  const [meetings, setMeetings] = useState(initialMeetings);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', date: '', time: '', participants: '', type: 'Video Call', notes: '' });

  const handleAddMeeting = (e) => {
    e.preventDefault();
    const newMeeting = { 
      id: Date.now(), 
      ...formData,
      participants: formData.participants.split(',').map(p => p.trim())
    };
    setMeetings([newMeeting, ...meetings]);
    setIsModalOpen(false);
    setFormData({ title: '', date: '', time: '', participants: '', type: 'Video Call', notes: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-10">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Meetings</h2>
          <p className="mt-1 text-sm text-gray-500">Schedule appointments and track notes.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Schedule Meeting
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {meetings.map(meeting => (
          <div key={meeting.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{meeting.title}</h3>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Calendar className="w-4 h-4 mr-1.5" /> {meeting.date}
                  <span className="mx-2">•</span>
                  <Clock className="w-4 h-4 mr-1.5" /> {meeting.time}
                </div>
              </div>
              <div className={`p-2 rounded-lg ${meeting.type === 'Video Call' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                {meeting.type === 'Video Call' ? <Video className="w-5 h-5" /> : <Users className="w-5 h-5" />}
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Participants</h4>
                <div className="flex flex-wrap gap-2">
                  {meeting.participants.map(p => (
                    <span key={p} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              
              {meeting.notes && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-400 flex items-center mb-1">
                    <FileText className="w-3 h-3 mr-1" /> Notes
                  </h4>
                  <p className="text-sm text-gray-700">{meeting.notes}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Schedule Meeting</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddMeeting} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title *</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Product Demo" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input type="text" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="10:00 AM" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option>Video Call</option><option>In Person</option><option>Phone</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Participants (comma separated)</label>
                <input type="text" value={formData.participants} onChange={e => setFormData({...formData, participants: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Sarah, John" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agenda / Notes</label>
                <textarea rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Topics to discuss..."></textarea>
              </div>

              <div className="pt-4 mt-6 border-t border-gray-100 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none shadow-sm">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
