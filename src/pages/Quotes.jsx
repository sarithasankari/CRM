import React, { useState, useEffect } from 'react';
import Table from '../components/Table';
import { quotesApi, dealsApi } from '../services/api';
import { 
  Plus, FileText, Download, Loader2, AlertCircle,
  ClipboardCheck, TrendingUp, DollarSign, Calendar,
  ChevronRight, Filter, Search, MoreHorizontal, Zap
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [deals, setDeals] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({ deal: '', amount: 0, status: 'draft', valid_until: '' });

  const fetchQuotes = async () => {
    try {
      setIsLoading(true);
      const data = await quotesApi.getAll();
      setQuotes(data.results || []);
    } catch (err) {
      setError('Failed to synchronize proposal registry');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeals = async () => {
    try {
      const data = await dealsApi.getAll();
      setDeals(data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQuotes();
    fetchDeals();
  }, []);

  const columns = [
    { 
      header: 'Proposal ID', 
      accessor: 'quote_number', 
      render: (row) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 mr-4 group-hover:scale-110 transition-transform">
             <ClipboardCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
             <span className="text-sm font-black text-blue-600">#{row.quote_number}</span>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Registry Entry</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Target Opportunity', 
      accessor: 'deal', 
      render: (row) => {
        const deal = deals.find(d => d.id === row.deal);
        return (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900">{deal?.title || `Deal #${row.deal}`}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Strategic Lead</span>
          </div>
        );
      }
    },
    { 
      header: 'Yield Projection', 
      accessor: 'amount', 
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-slate-900">${Number(row.amount).toLocaleString()}</span>
          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Projected Revenue</span>
        </div>
      )
    },
    { 
      header: 'Protocol State', 
      accessor: 'status',
      render: (row) => {
        const status = row.status?.toLowerCase();
        let colors = 'bg-slate-50 text-slate-400 border-slate-100';
        if (status === 'approved') colors = 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (status === 'sent') colors = 'bg-blue-50 text-blue-600 border-blue-100';

        return (
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center w-fit ${colors}`}>
            <Zap className={`w-3 h-3 mr-1.5 ${status === 'approved' ? 'fill-emerald-500' : ''}`} /> {row.status}
          </span>
        );
      }
    },
    {
      header: '',
      accessor: 'actions',
      render: () => (
        <div className="flex justify-end space-x-2">
          <button onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'}/quotes/${row.id}/pdf/`, '_blank')} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
            <Download className="w-4 h-4" />
          </button>
          <button className="p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const handleCreateQuote = async () => {
    try {
      await quotesApi.create({
        ...formData,
        quote_number: `QT-${Math.floor(Math.random() * 10000)}`
      });
      addToast('Proposal Integrated Successfully');
      setIsCreating(false);
      fetchQuotes();
    } catch (err) {
      addToast('Proposal Integration Failed', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-[1400px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center space-x-2 mb-1">
             <ClipboardCheck className="w-5 h-5 text-blue-600" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Quotes</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className={`inline-flex items-center px-6 py-2.5 rounded-2xl font-black text-sm shadow-xl transition-all ${
              isCreating 
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                : 'bg-slate-900 text-white shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            {isCreating ? 'Dismiss Builder' : <><Plus className="mr-2 w-4 h-4" /> Add Quote</>}
          </button>
        </div>
      </div>

      {isCreating ? (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 p-10 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-8">
             <div>
                <h3 className="text-2xl font-black text-slate-900">Proposal Builder</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Strategic Quotation Engine</p>
             </div>
             <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Zap className="w-6 h-6 fill-current" />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Opportunity</label>
              <select className="input-field appearance-none bg-white" value={formData.deal} onChange={e => setFormData({...formData, deal: e.target.value})}>
                <option value="">Select Protocol</option>
                {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Yield Specification ($)</label>
              <div className="relative">
                 <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input type="number" className="input-field pl-10" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-50 flex justify-end items-center space-x-4">
            <button onClick={() => setIsCreating(false)} className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Cancel</button>
            <button onClick={handleCreateQuote} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center">
               <FileText className="w-4 h-4 mr-2" /> Finalize Registry
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[500px]">
          <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Proposal Registry</h3>
             <div className="flex items-center space-x-3">
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                   <input type="text" placeholder="Filter registry..." className="pl-9 pr-4 py-1.5 bg-white border border-slate-100 rounded-xl text-xs outline-none focus:border-blue-500 transition-all" />
                </div>
                <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                   <Filter className="w-4 h-4" />
                </button>
             </div>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[500px]">
               <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
               <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Proposal Database...</p>
            </div>
          ) : (
            <Table columns={columns} data={quotes} />
          )}
        </div>
      )}
    </div>
  );
}
