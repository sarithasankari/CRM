import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Download, CreditCard, 
  Clock, AlertCircle, Loader2, Filter, ChevronRight,
  DollarSign, ArrowUpRight, ArrowDownRight, Printer,
  User, Briefcase, Trash2, Eye, XCircle
} from 'lucide-react';
import { invoicesApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import Table from '../components/Table';
import dayjs from 'dayjs';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { addToast } = useToast();

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await invoicesApi.getAll();
      setInvoices(data.results || data);
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
    (inv.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.deal_title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Dynamic KPI Calculations
  const totalOutstanding = invoices
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

  const fiscalYield = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

  const overdueProtocol = invoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

  const unpaidInvoices = invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue');
  const averageAging = unpaidInvoices.length > 0 
    ? Math.round(unpaidInvoices.reduce((sum, inv) => sum + dayjs().diff(dayjs(inv.created_at), 'day'), 0) / unpaidInvoices.length)
    : 0;

  const getLedgerStatus = (status) => {
    const s = status?.toLowerCase();
    if (s === 'draft') return 'Draft';
    if (s === 'sent') return 'Posted';
    if (s === 'paid') return 'Completed';
    if (s === 'overdue') return 'Posted';
    if (s === 'cancelled') return 'Cancelled';
    return 'Pending';
  };

  const getPaymentStatus = (status) => {
    const s = status?.toLowerCase();
    if (s === 'draft' || s === 'sent') return 'Unpaid';
    if (s === 'paid') return 'Paid';
    if (s === 'overdue') return 'Overdue';
    if (s === 'cancelled') return 'N/A';
    return 'Unpaid';
  };

  const getStatusColors = (status) => {
    const s = status?.toLowerCase();
    if (s === 'paid' || s === 'completed') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (s === 'overdue' || s === 'cancelled') return 'bg-rose-50 text-rose-600 border-rose-100';
    if (s === 'sent' || s === 'posted') return 'bg-blue-50 text-blue-600 border-blue-100';
    if (s === 'draft') return 'bg-slate-50 text-slate-400 border-slate-100';
    return 'bg-amber-50 text-amber-600 border-amber-100';
  };

  const columns = [
    { 
      header: 'Fiscal Registry', 
      accessor: 'invoice_number',
      render: (row) => (
        <div className="flex items-center">
          <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 mr-3">
             <FileText className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-blue-600">#{row.invoice_number}</span>
        </div>
      )
    },
    { 
      header: 'Customer', 
      accessor: 'customer_name',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm font-semibold text-slate-900">{row.customer_name || 'N/A'}</span>
        </div>
      )
    },
    { 
      header: 'Deal Reference', 
      accessor: 'deal_title',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
          <div className="flex flex-col">
            <span className="text-sm text-slate-600">{row.deal_title || 'N/A'}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Quote: {row.quote_number || 'N/A'}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Timeline Protocol', 
      accessor: 'created_at',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm text-slate-600">Issued: {dayjs(row.created_at).format('MMM D, YYYY')}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Updated: {dayjs(row.updated_at).format('MMM D, YYYY')}</span>
        </div>
      )
    },
    { 
      header: 'Ledger Status', 
      accessor: 'status',
      render: (row) => {
        const ledgerStatus = getLedgerStatus(row.status);
        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColors(ledgerStatus)}`}>
            {ledgerStatus}
          </span>
        );
      }
    },
    { 
      header: 'Net Yield', 
      accessor: 'amount',
      render: (row) => (
        <div className="text-right">
          <div className="text-sm font-bold text-slate-900">${parseFloat(row.amount).toLocaleString()}</div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Live Sync</div>
        </div>
      )
    },
    { 
      header: 'Payment Status', 
      accessor: 'status',
      render: (row) => {
        const paymentStatus = getPaymentStatus(row.status);
        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColors(paymentStatus)}`}>
            {paymentStatus}
          </span>
        );
      }
    },
    { 
      header: 'Due Date', 
      accessor: 'due_date',
      render: (row) => (
        <span className="text-sm text-slate-500">{row.due_date ? dayjs(row.due_date).format('MMM D, YYYY') : 'N/A'}</span>
      )
    },
    {
      header: '',
      accessor: 'actions',
      render: (row) => (
        <div className="flex justify-end space-x-1">
          <button 
            onClick={() => { setSelectedInvoice(row); setIsDetailsOpen(true); }}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Download PDF">
            <Download className="w-4 h-4" />
          </button>

        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center space-x-2 mb-1">
             <DollarSign className="w-5 h-5 text-blue-600" />
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inventory</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Invoices</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search fiscal records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 w-64 transition-all shadow-sm"
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter className="w-4 h-4" />
          </button>
          <button className="inline-flex items-center px-5 py-2 bg-slate-900 text-white rounded-lg font-semibold text-sm hover:bg-slate-800 transition-all">
            <Plus className="mr-2 w-4 h-4" />
            Generate Invoice
          </button>
        </div>
      </div>

      {/* Fiscal KPI Row (Dynamic) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: 'Total Outstanding', value: `$${totalOutstanding.toLocaleString()}`, trend: 'Live', color: 'blue' },
           { label: 'Fiscal Yield', value: `$${fiscalYield.toLocaleString()}`, trend: 'Live', color: 'emerald' },
           { label: 'Average Aging', value: `${averageAging} Days`, trend: 'Live', color: 'emerald' },
           { label: 'Overdue Protocol', value: `$${overdueProtocol.toLocaleString()}`, trend: 'Live', color: 'rose' }
         ].map((kpi, i) => (
           <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              <div className="flex items-end justify-between mt-1">
                 <h4 className="text-2xl font-bold text-slate-900">{kpi.value}</h4>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {kpi.trend}
                 </span>
              </div>
           </div>
         ))}
      </div>

      {/* Main Registry Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fiscal Records</h3>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[400px]">
             <div className="w-8 h-8 border-2 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
             <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Compiling Fiscal Records...</p>
          </div>
        ) : (
          <Table columns={columns} data={filteredInvoices} />
        )}
      </div>

      {/* Details Drawer */}
      {isDetailsOpen && selectedInvoice && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDetailsOpen(false)} />
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl relative z-10 overflow-y-auto animate-fade-in">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-20">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold text-slate-900">Invoice #{selectedInvoice.invoice_number}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColors(getLedgerStatus(selectedInvoice.status))}`}>
                    {getLedgerStatus(selectedInvoice.status)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Issued on {dayjs(selectedInvoice.created_at).format('MMM D, YYYY')}</p>
              </div>
              <button onClick={() => setIsDetailsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer & Deal Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Customer Info</h4>
                  <p className="text-sm font-semibold text-slate-900">{selectedInvoice.customer_name || 'N/A'}</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center">
                    <Briefcase className="w-3 h-3 mr-1" /> Deal: {selectedInvoice.deal_title || 'N/A'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Quote Ref: {selectedInvoice.quote_number || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Financials</h4>
                  <p className="text-xl font-bold text-slate-900">${parseFloat(selectedInvoice.amount).toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> Due Date: {selectedInvoice.due_date ? dayjs(selectedInvoice.due_date).format('MMM D, YYYY') : 'N/A'}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getStatusColors(getPaymentStatus(selectedInvoice.status))}`}>
                      {getPaymentStatus(selectedInvoice.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Line Items Table (Live Synced from Quote) */}
              <div className="border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Invoice Items</h4>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Live Synced from Quote</span>
                </div>
                <div className="overflow-hidden border border-slate-200 rounded-lg">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Item</th>
                        <th className="px-4 py-2 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Price</th>
                        <th className="px-4 py-2 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedInvoice.line_items?.length > 0 ? (
                        selectedInvoice.line_items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-sm text-slate-900">{item.product_name || `Item #${item.product}`}</td>
                            <td className="px-4 py-2 text-sm text-slate-600 text-right">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-slate-600 text-right">${parseFloat(item.unit_price).toLocaleString()}</td>
                            <td className="px-4 py-2 text-sm text-slate-900 text-right font-semibold">${parseFloat(item.line_total).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-4 py-2 text-sm text-slate-900">Custom Project Service</td>
                          <td className="px-4 py-2 text-sm text-slate-600 text-right">1</td>
                          <td className="px-4 py-2 text-sm text-slate-600 text-right">${parseFloat(selectedInvoice.amount).toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-slate-900 text-right font-semibold">${parseFloat(selectedInvoice.amount).toLocaleString()}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="border-t border-slate-100 pt-5 flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="font-semibold text-slate-900">${parseFloat(selectedInvoice.amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Tax (GST 18%):</span>
                    <span className="font-semibold text-slate-900">${(parseFloat(selectedInvoice.amount) * 0.18).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
                    <span className="text-slate-900">Grand Total:</span>
                    <span className="text-blue-600">${(parseFloat(selectedInvoice.amount) * 1.18).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-slate-100 pt-5 flex justify-end space-x-3">
                <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center">
                  <Download className="w-4 h-4 mr-2" /> Download PDF
                </button>
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" /> Record Payment
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
