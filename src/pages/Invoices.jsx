import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Download, CreditCard, 
  Clock, AlertCircle, Loader2, Filter, ChevronRight,
  DollarSign, ArrowUpRight, ArrowDownRight, Printer
} from 'lucide-react';
import { invoicesApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import Table from '../components/Table';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await invoicesApi.getAll();
      setInvoices(data.results || []);
    } catch (err) {
      addToast('Fiscal sync failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(inv => 
    (inv.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { 
      header: 'Fiscal Registry', 
      accessor: 'invoice_number',
      render: (row) => (
        <div className="flex items-center">
          <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 mr-4 group-hover:scale-110 transition-transform">
             <FileText className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-blue-600">#{row.invoice_number}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Reference: Q-{row.quote || '742'}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Timeline Protocol', 
      accessor: 'created_at',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900">Issued: {new Date(row.created_at).toLocaleDateString()}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Due: {row.due_date || 'N/A'}</span>
        </div>
      )
    },
    { 
      header: 'Ledger Status', 
      accessor: 'status',
      render: (row) => {
        const status = row.status?.toLowerCase();
        let colors = 'bg-slate-50 text-slate-400 border-slate-100';
        let Icon = Clock;

        if (status === 'paid') {
           colors = 'bg-emerald-50 text-emerald-600 border-emerald-100';
           Icon = CreditCard;
        } else if (status === 'overdue') {
           colors = 'bg-rose-50 text-rose-600 border-rose-100';
           Icon = AlertCircle;
        } else if (status === 'sent' || status === 'unpaid') {
           colors = 'bg-blue-50 text-blue-600 border-blue-100';
           Icon = ArrowUpRight;
        }

        return (
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center w-fit ${colors}`}>
            <Icon className="w-3 h-3 mr-1.5" /> {row.status}
          </span>
        );
      }
    },
    { 
      header: 'Net Yield', 
      accessor: 'amount',
      render: (row) => (
        <div className="text-right">
          <div className="text-sm font-black text-slate-900">${Number(row.amount).toLocaleString()}</div>
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Tax Included</div>
        </div>
      )
    },
    {
      header: '',
      accessor: 'actions',
      render: () => (
        <div className="flex justify-end space-x-2">
          <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
            <Download className="w-4 h-4" />
          </button>
          <button className="p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
            <Printer className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-[1400px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center space-x-2 mb-1">
             <DollarSign className="w-5 h-5 text-blue-600" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Invoices</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search fiscal records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none w-64 transition-all shadow-sm"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter className="w-4 h-4" />
          </button>
          <button className="inline-flex items-center px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all">
            <Plus className="mr-2 w-4 h-4" />
            Generate Invoice
          </button>
        </div>
      </div>

      {/* Fiscal KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: 'Total Outstanding', value: '$84,200', trend: '+12%', color: 'blue' },
           { label: 'Fiscal Yield', value: '$242,000', trend: '+24%', color: 'emerald' },
           { label: 'Average Aging', value: '14 Days', trend: '-2 Days', color: 'amber' },
           { label: 'Overdue Protocol', value: '$12,400', trend: '+4%', color: 'rose' }
         ].map((kpi, i) => (
           <div key={i} className="glass-card p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              <div className="flex items-end justify-between mt-1">
                 <h4 className="text-2xl font-black text-slate-900">{kpi.value}</h4>
                 <span className={`text-[10px] font-black uppercase tracking-widest ${kpi.trend.includes('-') ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {kpi.trend}
                 </span>
              </div>
           </div>
         ))}
      </div>

      {/* Main Registry Container */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[500px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[500px]">
             <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
             <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Fiscal Records...</p>
          </div>
        ) : (
          <Table columns={columns} data={filteredInvoices} />
        )}
      </div>
    </div>
  );
}
