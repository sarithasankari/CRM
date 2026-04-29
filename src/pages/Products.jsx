import React, { useState } from 'react';
import { 
  Package, Plus, Search, Filter, Tag, Hash, 
  FileBox, ChevronRight, Activity, DollarSign, 
  Archive, MoreHorizontal, Zap, X
} from 'lucide-react';
import Table from '../components/Table';

const initialProducts = [
  { id: 1, sku: 'PRD-1001', name: 'Cloud Migration Service Base', price: 5000, category: 'Services', stock: 'Unlimited', health: 'Optimal' },
  { id: 2, sku: 'PRD-1002', name: 'Security Audit (Enterprise)', price: 8000, category: 'Services', stock: 'Unlimited', health: 'Optimal' },
  { id: 3, sku: 'LIC-2001', name: 'CRM User License (Annual)', price: 120, category: 'Software', stock: 999, health: 'Steady' },
];

export default function Products() {
  const [products, setProducts] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ sku: '', name: '', price: '', category: 'Software', stock: '' });

  const handleAddProduct = (e) => {
    e.preventDefault();
    const newProduct = { 
      id: Date.now(), 
      sku: formData.sku, 
      name: formData.name, 
      price: Number(formData.price), 
      category: formData.category,
      stock: formData.stock || 'Unlimited',
      health: 'New'
    };
    setProducts([newProduct, ...products]);
    setIsModalOpen(false);
    setFormData({ sku: '', name: '', price: '', category: 'Software', stock: '' });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { 
      header: 'Inventory Specification', 
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center">
          <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 mr-4 group-hover:scale-110 transition-transform">
             <Package className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-900">{row.name}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">SKU: {row.sku}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Vertical Protocol', 
      accessor: 'category',
      render: (row) => (
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-600 border border-slate-100">
           {row.category}
        </span>
      )
    },
    { 
      header: 'Unit Yield', 
      accessor: 'price',
      render: (row) => (
        <div className="text-sm font-black text-slate-900">${row.price.toLocaleString()}</div>
      )
    },
    { 
      header: 'Registry Stock', 
      accessor: 'stock',
      render: (row) => (
        <div className="flex items-center space-x-2">
           <div className={`w-1.5 h-1.5 rounded-full ${row.stock === 'Unlimited' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
           <span className="text-sm font-bold text-slate-700">{row.stock}</span>
        </div>
      )
    },
    {
      header: '',
      accessor: 'actions',
      render: () => (
        <div className="flex justify-end">
          <button className="p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
            <MoreHorizontal className="w-4 h-4" />
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
             <Archive className="w-5 h-5 text-blue-600" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Products</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none w-64 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <Plus className="mr-2 w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Registry Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'Active Catalog', value: '42 Units', icon: Package, color: 'blue' },
           { label: 'Inventory Yield', value: '$842,000', icon: DollarSign, color: 'emerald' },
           { label: 'Supply Velocity', value: 'Optimal', icon: Activity, color: 'indigo' }
         ].map((stat, i) => (
           <div key={i} className="glass-card p-6 flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                 <h4 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h4>
              </div>
              <stat.icon className={`w-8 h-8 text-${stat.color}-500 opacity-20`} />
           </div>
         ))}
      </div>

      {/* Main Registry Table */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden min-h-[500px]">
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategic Asset Registry</h3>
           <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>Catalog Integrity:</span>
              <span className="text-emerald-500">99.8% Synchronized</span>
           </div>
        </div>
        <Table columns={columns} data={filteredProducts} />
      </div>

      {/* Integration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Product Integration</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Registry Synchronization Protocol</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Inventory Title *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" placeholder="e.g. Enterprise CRM License" />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Registry SKU *</label>
                  <input required type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="input-field" placeholder="LIC-742" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unit Price ($) *</label>
                  <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="input-field" placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Classification</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="input-field appearance-none bg-white">
                    <option>Software</option>
                    <option>Hardware</option>
                    <option>Services</option>
                    <option>Subscription</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Stock Protocol</label>
                  <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="input-field" placeholder="Unlimited" />
                </div>
              </div>

              <div className="pt-8 mt-4 border-t border-slate-50 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">Discard</button>
                <button type="submit" className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center">
                   <Zap className="w-4 h-4 mr-2 fill-current" /> Finalize Integration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
