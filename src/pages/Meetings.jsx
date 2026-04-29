import React, { useState } from 'react';
import { 
  Plus, Users, Calendar, Clock, Video, FileText, X, 
  MapPin, Phone, MoreHorizontal, Search, Filter, 
  ChevronRight, CalendarDays, ExternalLink
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const initialMeetings = [
  { id: 1, title: 'Product Demo: Enterprise Suite', date: 'Oct 25, 2023', time: '10:00 AM - 11:00 AM', participants: ['Sarah Miller', 'John Doe'], type: 'Video Call', notes: 'Initial walk-through of the v3 dashboard features.' },
  { id: 2, type: 'In Person', title: 'Q3 Strategy Sync', date: 'Oct 26, 2023', time: '2:00 PM - 3:30 PM', participants: ['Jane Smith', 'Exec Team'], notes: 'Quarterly review of sales pipeline velocity and churn rates.' },
];

export default function Meetings() {
  const [meetings, setMeetings] = useState(initialMeetings);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();
  const [formData, setFormData] = useState({ title: '', date: '', time: '', participants: '', type: 'Video Call', notes: '' });

  const handleAddMeeting = (e) => {
    e.preventDefault();
    const newMeeting = { 
      id: Date.now(), 
      ...formData,
      participants: formData.participants.split(',').map(p => p.trim())
    };
    setMeetings([newMeeting, ...meetings]);
    addToast("Meeting scheduled successfully");
    setIsModalOpen(false);
    setFormData({ title: '', date: '', time: '', participants: '', type: 'Video Call', notes: '' });
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-[1200px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center space-x-2 mb-1">
             <CalendarDays className="w-5 h-5 text-blue-600" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activities</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Meetings</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <Plus className="mr-2 w-4 h-4" />
            Add Meeting
          </button>
        </div>
      </div>

      {/* Main Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {meetings.map(meeting => (
          <div key={meeting.id} className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 p-8 hover:shadow-2xl hover:shadow-slate-200/60 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1 pr-10">
                 <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      meeting.type === 'Video Call' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-purple-50 text-purple-600 border border-purple-100'
                    }`}>
                      {meeting.type}
                    </span>
                 </div>
                 <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{meeting.title}</h3>
              </div>
              <div className={`p-4 rounded-2xl ${meeting.type === 'Video Call' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'} shadow-sm group-hover:scale-110 transition-transform`}>
                {meeting.type === 'Video Call' ? <Video className="w-6 h-6" /> : <Users className="w-6 h-6" />}
              </div>
            </div>
            
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-6 text-[12px] font-bold text-slate-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-slate-300" />
                  {meeting.date}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-slate-300" />
                  {meeting.time}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Protocol Participants</h4>
                <div className="flex -space-x-3">
                  {meeting.participants.map((p, i) => (
                    <div key={p} className="w-10 h-10 rounded-xl bg-slate-100 border-4 border-white flex items-center justify-center text-[10px] font-black text-slate-600 shadow-sm" title={p}>
                      {p.split(' ').map(n => n[0]).join('')}
                    </div>
                  ))}
                  <button className="w-10 h-10 rounded-xl bg-slate-50 border-4 border-white flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors">
                     <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {meeting.notes && (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative overflow-hidden">
                  <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    <FileText className="w-3.5 h-3.5 mr-2" /> Agenda Log
                  </div>
                  <p className="text-sm font-medium text-slate-600 line-clamp-2">{meeting.notes}</p>
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                     <ExternalLink className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
               <button className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center">
                  Full Details <ChevronRight className="w-4 h-4 ml-1" />
               </button>
               <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
               </button>
            </div>
            
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-50 rounded-full opacity-0 group-hover:opacity-40 transition-opacity blur-2xl" />
          </div>
        ))}

        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-50 border-4 border-dashed border-slate-200 rounded-[32px] p-8 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all min-h-[300px] group"
        >
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus className="w-8 h-8" />
          </div>
          <span className="text-sm font-black uppercase tracking-widest">Initialize Sync</span>
        </button>
      </div>

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Schedule Protocol</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Calendar Integration Sync</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddMeeting} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Protocol Title *</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input-field" placeholder="Strategic Objective Sync" />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sync Date</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Time Slot</label>
                  <input type="text" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="input-field" placeholder="e.g. 10:00 AM" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Protocol Channel</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="input-field appearance-none bg-white">
                  <option>Video Call</option><option>In Person</option><option>Phone</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Personnel Sync (comma separated)</label>
                <input type="text" value={formData.participants} onChange={e => setFormData({...formData, participants: e.target.value})} className="input-field" placeholder="Identity names..." />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Agenda Specification</label>
                <textarea rows="3" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="input-field py-4 resize-none" placeholder="Topics for analysis..."></textarea>
              </div>

              <div className="pt-8 mt-4 border-t border-slate-50 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Discard</button>
                <button type="submit" className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center">
                  Schedule Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
