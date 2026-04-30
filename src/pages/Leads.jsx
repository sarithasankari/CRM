import React, { useState, useEffect } from 'react';
import Table from '../components/Table';
import { leadsApi, contactsApi, dealsApi } from '../services/api';
import { 
  Plus, Download, ChevronDown, Calendar, ArrowDown, X, 
  Loader2, AlertCircle, Trash2, Edit2, Filter, Search,
  MoreHorizontal, Mail, Phone, Building2, UserPlus, ChevronRight,
  Megaphone, Info
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [viewingLead, setViewingLead] = useState(null);
  const [convertingLead, setConvertingLead] = useState(false);
  const [conversionSuccess, setConversionSuccess] = useState(null);
  const [convertData, setConvertData] = useState({ createDeal: false, dealName: '', amount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '', email: '', company: '', phone: '', source: 'website', status: 'new'
  });

  // ─── Data Fetching ───────────────────────────────────────────────────────────

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const data = await leadsApi.getAll();
      setLeads(data.results || []);
      setError(null);
    } catch (err) {
      setError('Failed to load leads. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // ─── CRUD Handlers ───────────────────────────────────────────────────────────

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      await leadsApi.delete(id);
      addToast('Lead deleted successfully');
      fetchLeads();
    } catch (err) {
      addToast('Failed to delete lead', 'error');
    }
  };

  const handleAddOrEditLead = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedLead) {
        await leadsApi.update(selectedLead.id, formData);
        addToast('Lead updated successfully');
      } else {
        await leadsApi.create(formData);
        addToast('Lead created successfully');
      }
      setIsModalOpen(false);
      fetchLeads();
    } catch (err) {
      console.error('Failed to save lead', err);
      addToast('Error saving lead. Please check your inputs.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertLead = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        createDeal: convertData.createDeal,
        dealName: convertData.dealName,
        amount: convertData.amount,
        stage: convertData.stage
      };

      if (convertData.closingDate) {
        if (convertData.closingDate.includes('-')) {
          payload.closingDate = convertData.closingDate;
        } else {
          const parts = convertData.closingDate.split('/');
          if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            payload.closingDate = `${parts[2]}-${month}-${day}`;
          }
        }
      }

      const response = await leadsApi.convert(viewingLead.id, payload);
      
      setConversionSuccess({
        account: response.contact.company || response.contact.name,
        contact: response.contact.name,
        deal: response.deal ? response.deal.title : null
      });
      setConvertingLead(false);
      fetchLeads();
    } catch (err) {
      console.error('Conversion Error Details:', err.response?.data || err);
      let errorMsg = 'Failed to convert lead';
      if (err.response?.data) {
        if (typeof err.response.data === 'object' && err.response.data.detail) {
          errorMsg = err.response.data.detail;
        } else if (typeof err.response.data === 'object') {
          const firstKey = Object.keys(err.response.data)[0];
          if (firstKey) {
            errorMsg = `${firstKey}: ${err.response.data[firstKey]}`;
          }
        } else if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        }
      }
      addToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Modal Helpers ───────────────────────────────────────────────────────────

  const openAddModal = () => {
    setSelectedLead(null);
    setFormData({ name: '', email: '', company: '', phone: '', source: 'website', status: 'new' });
    setIsModalOpen(true);
  };

  const openEditModal = (lead) => {
    setSelectedLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email,
      company: lead.company || '',
      phone: lead.phone || '',
      source: lead.source || 'website',
      status: lead.status || 'new',
    });
    setIsModalOpen(true);
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case 'new':       return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'contacted': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'qualified': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'lost':      return 'bg-rose-50 text-rose-600 border-rose-100';
      default:          return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const filteredLeads = leads.filter(l => {
    const matchesStatus = statusFilter === 'All' || l.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch = l.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         l.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         l.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // ─── Table Columns ───────────────────────────────────────────────────────────

  const columns = [
    {
      header: (
        <div className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-500">
          Name <ArrowDown className="ml-1 h-3 w-3" />
        </div>
      ),
      accessor: 'name',
      render: (row) => {
        const initials = row.name.split(' ').map(n => n[0]).join('');
        const bgColors = ['bg-blue-50', 'bg-indigo-50', 'bg-violet-50', 'bg-cyan-50'];
        const textColors = ['text-blue-600', 'text-indigo-600', 'text-violet-600', 'text-cyan-600'];
        const idx = row.name.length % bgColors.length;
        return (
          <div className="flex items-center group">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold mr-3 shadow-sm border border-white transition-transform group-hover:scale-110 ${bgColors[idx]} ${textColors[idx]}`}>
              {initials.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{row.name}</div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5 flex items-center">
                <Phone className="w-3 h-3 mr-1 opacity-50" /> {row.phone || 'N/A'}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Company',
      accessor: 'company',
      render: (row) => (
        <div className="flex items-center text-slate-600 font-medium">
          <Building2 className="w-3.5 h-3.5 mr-2 opacity-50" />
          {row.company || '-'}
        </div>
      )
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (row) => (
        <div className="flex items-center text-slate-500 text-sm">
          <Mail className="w-3.5 h-3.5 mr-2 opacity-50" />
          {row.email}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-2.5 py-1 inline-flex text-[10px] font-bold rounded-lg capitalize border shadow-sm ${getStatusStyles(row.status)}`}>
          {row.status || 'New'}
        </span>
      )
    },
    {
      header: 'Created',
      accessor: 'created_at',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-slate-600 text-xs font-semibold">{new Date(row.created_at).toLocaleDateString()}</span>
          <span className="text-[10px] text-slate-400 font-medium">{new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )
    },
    {
      header: '',
      accessor: 'actions',
      render: (row) => (
        <div className="flex justify-end space-x-1">
          <button
            onClick={() => setViewingLead(row)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            title="View Lead"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openEditModal(row); }}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            title="Edit Lead"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            title="Delete Lead"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // ─── Render Views ────────────────────────────────────────────────────────────

  if (conversionSuccess) {
    return (
      <div className="bg-white min-h-screen">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-[18px] font-semibold text-gray-800">Convert Lead ({viewingLead?.name}{viewingLead?.company ? ` - ${viewingLead?.company}` : ''})</h2>
        </div>
        
        <div className="p-8 max-w-4xl">
          <p className="text-[15px] text-gray-700 mb-6">
            The Lead "{viewingLead?.name}" has been successfully converted.
          </p>
          
          <h3 className="text-[15px] text-gray-800 mb-4">Conversion Details</h3>
          
          <div className="w-full border-t border-b border-gray-200">
            <div className="flex py-3 border-b border-gray-100">
              <div className="w-48 text-[14px] text-gray-700">Account</div>
              <div className="text-[14px] text-blue-600 hover:underline cursor-pointer">{conversionSuccess.account}</div>
            </div>
            <div className="flex py-3 border-b border-gray-100">
              <div className="w-48 text-[14px] text-gray-700">Contact</div>
              <div className="text-[14px] text-blue-600 hover:underline cursor-pointer">{conversionSuccess.contact}</div>
            </div>
            {conversionSuccess.deal && (
              <div className="flex py-3">
                <div className="w-48 text-[14px] text-gray-700">Deal</div>
                <div className="text-[14px] text-blue-600 hover:underline cursor-pointer">{conversionSuccess.deal}</div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => { setConversionSuccess(null); setViewingLead(null); }}
            className="mt-6 px-4 py-1.5 bg-white border border-blue-600 text-blue-600 rounded text-[14px] hover:bg-blue-50 transition-colors"
          >
            Go to Leads
          </button>
        </div>
      </div>
    );
  }

  if (convertingLead) {
    return (
      <div className="bg-white min-h-screen flex">
        <div className="flex-1">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-[18px] font-semibold text-gray-800">Convert Lead ({viewingLead?.name}{viewingLead?.company ? ` - ${viewingLead?.company}` : ''})</h2>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleConvertLead} className="space-y-6 max-w-2xl">
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="w-48 text-[14px] text-gray-800">Create New Account</span>
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-800 text-[13px] rounded">{viewingLead?.company || viewingLead?.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-48 text-[14px] text-gray-800">Create New Contact</span>
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-800 text-[13px] rounded">{viewingLead?.name}</span>
                </div>
              </div>

              <div className="pt-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={convertData.createDeal}
                    onChange={(e) => setConvertData({ ...convertData, createDeal: e.target.checked })}
                    className="w-4 h-4 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-[14px] text-gray-800">Create a new Deal for this Account.</span>
                </label>
                
                {convertData.createDeal && (
                  <div className="mt-6 ml-6 space-y-4 max-w-lg">
                    <div className="flex items-center">
                      <div className="w-32 text-[13px] text-gray-600 text-right pr-4">Amount</div>
                      <div className="flex-1 relative flex items-center border border-gray-300 rounded overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                        <span className="px-3 py-1.5 bg-gray-50 border-r border-gray-300 text-[13px] text-gray-600">Rs.</span>
                        <input type="number" className="w-full px-3 py-1.5 text-[13px] outline-none" value={convertData.amount || ''} onChange={e => setConvertData({...convertData, amount: e.target.value})} />
                        <Info className="w-4 h-4 text-gray-400 absolute right-2" />
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-32 text-[13px] text-gray-600 text-right pr-4">Deal Name</div>
                      <div className="flex-1">
                        <input type="text" className="w-full px-3 py-1.5 border border-gray-300 rounded text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={convertData.dealName || viewingLead?.company || viewingLead?.name || ''} onChange={e => setConvertData({...convertData, dealName: e.target.value})} />
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-32 text-[13px] text-gray-600 text-right pr-4">Closing Date</div>
                      <div className="flex-1">
                        <input type="date" className="w-full px-3 py-1.5 border border-gray-300 rounded text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" value={convertData.closingDate || ''} onChange={e => setConvertData({...convertData, closingDate: e.target.value})} />
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-32 text-[13px] text-gray-600 text-right pr-4">Stage</div>
                      <div className="flex-1">
                        <select className="w-full px-3 py-1.5 border border-gray-300 rounded text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none bg-no-repeat bg-[right_0.5rem_center]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1em'}} value={convertData.stage || 'Qualification'} onChange={e => setConvertData({...convertData, stage: e.target.value})}>
                          <option value="Qualification">Qualification</option>
                          <option value="Needs Analysis">Needs Analysis</option>
                          <option value="Value Proposition">Value Proposition</option>
                          <option value="Identify Decision Makers">Identify Decision Makers</option>
                          <option value="Proposal/Price Quote">Proposal/Price Quote</option>
                          <option value="Negotiation/Review">Negotiation/Review</option>
                          <option value="Closed Won">Closed Won</option>
                          <option value="Closed Lost">Closed Lost</option>
                          <option value="Closed Lost to Competition">Closed Lost to Competition</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-32 text-[13px] text-gray-600 text-right pr-4">Campaign Source</div>
                      <div className="flex-1 relative flex items-center border border-gray-300 rounded overflow-hidden focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                        <input type="text" className="w-full px-3 py-1.5 text-[13px] outline-none" />
                        <div className="px-2 py-1.5 bg-gray-50 border-l border-gray-300 flex items-center justify-center">
                           <Megaphone className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-32 text-[13px] text-gray-600 text-right pr-4">Contact Role</div>
                      <div className="flex-1">
                        <select className="w-full px-3 py-1.5 border border-gray-300 rounded text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none bg-no-repeat bg-[right_0.5rem_center]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1em'}}>
                          <option>None</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <p className="text-[14px] text-gray-800 mb-2">Owner of the New Records</p>
                <div className="text-[14px] text-gray-800">Saritha N</div>
              </div>

              <div className="pt-6 flex space-x-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-1.5 bg-[#1a56d9] font-medium text-white rounded text-[14px] hover:bg-blue-700 transition-all flex items-center"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Convert
                </button>
                <button
                  type="button"
                  onClick={() => setConvertingLead(false)}
                  className="px-5 py-1.5 bg-gray-100 border border-gray-200 text-gray-700 rounded text-[14px] hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Right Sidebar Quick Links */}
        <div className="w-64 border-l border-gray-200 bg-[#F9FAFB] p-6 h-[calc(100vh-60px)]">
          <h3 className="text-[14px] font-semibold text-gray-800 mb-4">Quick Links</h3>
          <ul className="space-y-3 text-[13px] text-gray-600">
            <li><button className="hover:text-blue-600 hover:underline">Lead Conversion Mapping</button></li>
            <li><button className="flex items-center hover:text-blue-600 hover:underline"><AlertCircle className="w-4 h-4 mr-1"/> Help</button></li>
          </ul>
        </div>
      </div>
    );
  }

  if (viewingLead) {
    return (
      <div className="bg-white min-h-screen">
        {/* Top Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => setViewingLead(null)} className="text-gray-500 hover:text-gray-800">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded flex items-center justify-center text-lg font-medium">
              {viewingLead.name.substring(0, 1).toUpperCase()}
            </div>
            <div>
              <h2 className="text-[18px] font-medium text-gray-800">{viewingLead.name}{viewingLead.company ? ` - ${viewingLead.company}` : ''}</h2>
              <button className="flex items-center text-[12px] text-blue-600 hover:underline mt-0.5">
                <Plus className="w-3 h-3 mr-1" /> Add Tags
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="px-4 py-1.5 bg-[#1a56d9] text-white rounded-[4px] font-medium text-[13px] hover:bg-blue-700 transition-colors">
              Send Email
            </button>
            <button 
              onClick={() => setConvertingLead(true)}
              className="px-4 py-1.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-[4px] text-[13px] hover:bg-gray-50 transition-colors"
            >
              Convert
            </button>
            <button 
              onClick={() => openEditModal(viewingLead)}
              className="px-4 py-1.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-[4px] text-[13px] hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
            <button className="px-2 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-[4px] hover:bg-gray-50 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex">
          {/* Left Sidebar (Related List) */}
          <div className="w-56 border-r border-gray-200 bg-white h-[calc(100vh-140px)] overflow-y-auto py-4">
            <h3 className="text-[14px] font-semibold text-gray-800 px-5 mb-2">Related List</h3>
            <ul className="text-[13px] text-gray-700">
              {['Notes', 'Emails', 'Activities', 'Deals', 'Attachments'].map(item => (
                <li key={item}>
                  <button className="w-full text-left px-5 py-2.5 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
            <div className="px-5 mt-4">
              <button className="text-[13px] text-blue-600 hover:underline">Add Related List</button>
            </div>
            <div className="px-5 mt-6">
              <h3 className="text-[14px] font-semibold text-gray-800 mb-2">Links</h3>
              <button className="text-[13px] text-blue-600 hover:underline">Add Link</button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-[#F5F6F8] p-6 h-[calc(100vh-140px)] overflow-y-auto">
            {/* Overview / Timeline Tabs */}
            <div className="flex space-x-3 mb-4">
              <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 shadow-sm">
                <span className="text-[12px]">10</span>
              </div>
              <div className="flex bg-white rounded-full border border-gray-200 overflow-hidden shadow-sm">
                <button className="px-6 py-1.5 text-[13px] font-medium bg-[#EBF0FA] text-[#1a56d9]">Overview</button>
                <button className="px-6 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50">Timeline</button>
              </div>
            </div>
            
            {/* First Card - Key Info */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-4">
              <div className="grid grid-cols-2 gap-y-6">
                <div className="flex">
                  <div className="w-32 text-[13px] text-gray-500 text-right pr-6">Lead Owner</div>
                  <div className="text-[13px] text-gray-800">Saritha N</div>
                </div>
                <div className="flex">
                  <div className="w-32 text-[13px] text-gray-500 text-right pr-6">Email</div>
                  <div className="text-[13px] text-blue-600">{viewingLead.email || '-'}</div>
                </div>
                <div className="flex">
                  <div className="w-32 text-[13px] text-gray-500 text-right pr-6">Phone</div>
                  <div className="flex items-center text-[13px] text-gray-800">
                    {viewingLead.phone || '-'}
                    {viewingLead.phone && <div className="ml-2 w-5 h-5 bg-[#D4E8D4] rounded flex items-center justify-center"><Phone className="w-3 h-3 text-[#1B5E20]" /></div>}
                  </div>
                </div>
                <div className="flex">
                  <div className="w-32 text-[13px] text-gray-500 text-right pr-6">Mobile</div>
                  <div className="text-[13px] text-gray-800">-</div>
                </div>
                <div className="flex">
                  <div className="w-32 text-[13px] text-gray-500 text-right pr-6">Lead Status</div>
                  <div className="text-[13px] text-gray-800">
                    <select
                      value={viewingLead.status || 'new'}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        setViewingLead({ ...viewingLead, status: newStatus });
                        try {
                          await leadsApi.update(viewingLead.id, { ...viewingLead, status: newStatus });
                          fetchLeads();
                          addToast('Lead status updated successfully');
                        } catch (err) {
                          addToast('Failed to update status', 'error');
                        }
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider outline-none cursor-pointer ${getStatusStyles(viewingLead.status)}`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Second Card - Full Info */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="border-b border-gray-100 px-6 py-3">
                <button className="text-[14px] font-semibold text-gray-800 hover:text-blue-600">Hide Details</button>
              </div>
              <div className="px-6 py-4">
                <h3 className="text-[14px] font-semibold text-gray-800 mb-6">Lead Information</h3>
                <div className="grid grid-cols-2 gap-y-6">
                  <div className="flex">
                    <div className="w-32 text-[13px] text-gray-500 text-right pr-6">Lead Owner</div>
                    <div className="text-[13px] text-gray-800">Saritha N</div>
                  </div>
                  <div className="flex">
                    <div className="w-32 text-[13px] text-gray-500 text-right pr-6">Company</div>
                    <div className="text-[13px] text-gray-800">{viewingLead.company || '-'}</div>
                  </div>
                  <div className="flex">
                    <div className="w-32 text-[13px] text-gray-500 text-right pr-6">Title</div>
                    <div className="text-[13px] text-gray-800">{viewingLead.source || '-'}</div>
                  </div>
                  <div className="flex">
                    <div className="w-32 text-[13px] text-gray-500 text-right pr-6">Lead Name</div>
                    <div className="text-[13px] text-gray-800">{viewingLead.name}</div>
                  </div>
                  <div className="flex">
                    <div className="w-32 text-[13px] text-gray-500 text-right pr-6">Phone</div>
                    <div className="flex items-center text-[13px] text-gray-800">
                      {viewingLead.phone || '-'}
                      {viewingLead.phone && <div className="ml-2 w-5 h-5 bg-[#D4E8D4] rounded flex items-center justify-center"><Phone className="w-3 h-3 text-[#1B5E20]" /></div>}
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-32 text-[13px] text-gray-500 text-right pr-6">Email</div>
                    <div className="text-[13px] text-blue-600">{viewingLead.email || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Leads</h2>
          <div className="flex items-center mt-1 space-x-2">
            <span className="text-sm font-medium text-slate-500">Sales Hub</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="text-sm font-bold text-blue-600">{filteredLeads.length} Total Prospects</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Quick find..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none w-64 transition-all"
            />
          </div>
          
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={openAddModal}
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <Plus className="mr-2 w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Filters & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-1 overflow-x-auto">
          <div className="flex items-center px-4 border-r border-slate-100 mr-2">
            <Filter className="w-4 h-4 text-slate-400 mr-2" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</span>
          </div>
          {['All', 'New', 'Contacted', 'Qualified', 'Lost'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-between overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest">Conversion Rate</p>
            <p className="text-2xl font-black text-white mt-1">24.5%</p>
          </div>
          <div className="relative z-10 h-10 w-24">
             {/* Mock mini chart can go here */}
             <div className="flex items-end space-x-1 h-full">
                {[40, 70, 45, 90, 65, 80].map((h, i) => (
                  <div key={i} className="flex-1 bg-white/30 rounded-full" style={{ height: `${h}%` }} />
                ))}
             </div>
          </div>
          <UserPlus className="absolute -right-2 -bottom-2 w-20 h-20 text-white/10" />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[500px] relative">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
              </div>
            </div>
            <p className="mt-4 text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">Gathering Intel...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white z-20">
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-4">
              <AlertCircle className="w-10 h-10 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Synchronization Failed</h3>
            <p className="text-slate-500 mt-2 max-w-xs">{error}</p>
            <button 
              onClick={fetchLeads} 
              className="mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 transition-all"
            >
              Reconnect
            </button>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white z-20">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
               <Search className="w-10 h-10 text-slate-300" />
             </div>
             <h3 className="text-xl font-bold text-slate-900">No matching prospects</h3>
             <p className="text-slate-500 mt-2 max-w-xs">We couldn't find any leads matching your current criteria.</p>
             <button 
              onClick={() => {setSearchQuery(''); setStatusFilter('All');}} 
              className="mt-6 text-blue-600 font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <Table columns={columns} data={filteredLeads} />
        </div>

        {/* Custom Pagination */}
        <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="flex items-center space-x-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Displaying <span className="text-slate-900">{filteredLeads.length}</span> of <span className="text-slate-900">{leads.length}</span> results
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button className="w-10 h-10 flex items-center justify-center border border-slate-200 rounded-xl bg-white text-slate-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-50 transition-all shadow-sm" disabled>
              <ArrowDown className="w-4 h-4 rotate-90" />
            </button>
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button className="px-4 py-1.5 rounded-lg text-xs font-black bg-blue-600 text-white shadow-md shadow-blue-600/20">1</button>
              <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all">2</button>
            </div>
            <button className="w-10 h-10 flex items-center justify-center border border-slate-200 rounded-xl bg-white text-slate-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-50 transition-all shadow-sm" disabled>
              <ArrowDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>
        </div>
      </div>

      {/* Premium Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">{selectedLead ? 'Edit Prospect' : 'Add New Lead'}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Lead Management</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddOrEditLead} className="p-8">
               <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Full Name *</label>
                      <div className="relative">
                        <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-field pl-12" placeholder="e.g. John Doe" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Address *</label>
                      <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="input-field" placeholder="john@example.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                      <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="input-field" placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Company</label>
                      <input type="text" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} className="input-field" placeholder="Acme Inc." />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Lead Source</label>
                      <select value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} className="input-field appearance-none bg-no-repeat bg-[right_1rem_center]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1em'}}>
                        <option value="website">Website</option>
                        <option value="referral">Referral</option>
                        <option value="cold_call">Cold Call</option>
                        <option value="social_media">Social Media</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>


               </div>

              <div className="pt-8 mt-8 border-t border-slate-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {selectedLead ? 'Update Prospect' : 'Confirm & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
