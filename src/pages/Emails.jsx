import React, { useState, useEffect } from 'react';
import { 
  Mail, Edit3, Send, Search, 
  Inbox, Loader2,
  Trash2, X, Zap, AlertCircle, CheckCircle, WifiOff
} from 'lucide-react';
import { emailsApi, contactsApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const EMPTY_FORM = { 
  to_email: '', 
  subject: '', 
  body: '',
  contact_id: '',
};

export default function Emails() {
  const [emails, setEmails] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const { addToast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [emailsRes, contactsRes] = await Promise.all([
        emailsApi.getAll(),
        contactsApi.getAll(),
      ]);
      setEmails(emailsRes.results || emailsRes);
      setContacts(contactsRes.results || contactsRes);
    } catch (err) {
      setError('Failed to load email registry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!formData.to_email) {
      addToast('Please enter a recipient email address', 'error');
      return;
    }
    if (!formData.subject) {
      addToast('Please enter a subject', 'error');
      return;
    }
    if (!formData.body) {
      addToast('Please enter a message body', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        to_email: formData.to_email,
        subject: formData.subject,
        body: formData.body,
      };
      if (formData.contact_id) {
        payload.contact_id = parseInt(formData.contact_id);
      }

      await emailsApi.send(payload);
      addToast('✓ Email sent & logged successfully!', 'success');
      setIsComposing(false);
      setFormData(EMPTY_FORM);
      fetchData();
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to send email.';
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this email log?')) return;
    try {
      await emailsApi.delete(id);
      addToast('Email log removed');
      fetchData();
    } catch {
      addToast('Delete failed', 'error');
    }
  };

  const parseEmailNotes = (notes) => {
    if (!notes) return { to: '—', subject: '—', body: '' };
    const lines = notes.split('\n');
    const to = lines[0]?.replace('TO: ', '') || '—';
    const subject = lines[1]?.replace('SUBJECT: ', '') || '—';
    const body = lines.slice(3).join('\n');
    return { to, subject, body };
  };

  const filtered = emails.filter(e => {
    const parsed = parseEmailNotes(e.notes);
    return parsed.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
           parsed.subject.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-[1400px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Inbox className="w-5 h-5 text-blue-600" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Communication</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Emails</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none w-64 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsComposing(true)}
            className="inline-flex items-center px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <Edit3 className="mr-2 w-4 h-4" />
            Compose Email
          </button>
        </div>
      </div>

      {/* SMTP notice banner */}
      <div className="flex items-start gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm">
        <WifiOff className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
        <div>
          <span className="font-bold">SMTP not configured?</span> Emails are printed to the Django terminal in development mode.
          Set <code className="bg-amber-100 px-1 rounded text-xs">USE_SMTP=true</code>, <code className="bg-amber-100 px-1 rounded text-xs">EMAIL_HOST_USER</code>, and <code className="bg-amber-100 px-1 rounded text-xs">EMAIL_HOST_PASSWORD</code> in your <code className="bg-amber-100 px-1 rounded text-xs">.env</code> file to enable real delivery.
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[500px]">
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sent Email Registry</h3>
          <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>Total:</span>
            <span className="text-blue-600">{filtered.length}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Email Registry...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-4" />
            <p className="text-slate-500 font-medium">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-black text-slate-900">No emails sent yet</h3>
            <p className="text-slate-400 text-sm mt-1 font-medium">Compose your first email to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((email) => {
              const { to, subject, body } = parseEmailNotes(email.notes);
              return (
                <div key={email.id} className="px-8 py-6 hover:bg-slate-50/50 transition-all group flex items-center">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 mr-6 group-hover:scale-110 transition-transform flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center min-w-0">
                    <div className="min-w-0">
                      <span className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors block truncate">{to}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 block">Recipient</span>
                    </div>
                    
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-slate-900 block truncate">{subject}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 block">Subject</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {email.created_at ? new Date(email.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1.5" /> Sent
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDelete(email.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compose Email Modal */}
      {isComposing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsComposing(false)} />
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Compose Email</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Send & log via SMTP</p>
              </div>
              <button onClick={() => setIsComposing(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all border border-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSend} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Linked Contact</label>
                  <select 
                    value={formData.contact_id} 
                    onChange={e => {
                      const contact = contacts.find(c => c.id === parseInt(e.target.value));
                      setFormData({...formData, contact_id: e.target.value, to_email: contact?.email || formData.to_email});
                    }} 
                    className="input-field appearance-none bg-white"
                  >
                    <option value="">Select Contact (optional)</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.email ? `<${c.email}>` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recipient Email *</label>
                  <input 
                    required
                    type="email"
                    value={formData.to_email} 
                    onChange={e => setFormData({...formData, to_email: e.target.value})} 
                    className="input-field" 
                    placeholder="recipient@example.com" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject *</label>
                <input required type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="input-field" placeholder="e.g. Partnership Proposal" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Message *</label>
                <textarea required rows="6" value={formData.body} onChange={e => setFormData({...formData, body: e.target.value})} className="input-field resize-none py-4" placeholder="Write your message here..." />
              </div>

              <div className="pt-4 mt-2 border-t border-slate-50 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsComposing(false)} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Discard</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center disabled:opacity-60 disabled:cursor-not-allowed">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  {isSubmitting ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
