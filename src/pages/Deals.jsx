import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { dealsApi, contactsApi } from '../services/api';
import {
  Plus, Loader2, AlertCircle, MoreHorizontal,
  Calendar, Filter, Search, X, DollarSign,
  Briefcase, User, ChevronDown,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

// ─── Pipeline stages (mirrors backend STAGE_PROBABILITY_MAP) ─────────────────
const STAGES = [
  { id: 'Qualification',            title: 'Qualification',            color: 'bg-blue-500' },
  { id: 'Needs Analysis',           title: 'Needs Analysis',           color: 'bg-cyan-500' },
  { id: 'Value Proposition',        title: 'Value Proposition',        color: 'bg-indigo-500' },
  { id: 'Identify Decision Makers', title: 'Identify Decision Makers', color: 'bg-violet-500' },
  { id: 'Proposal/Price Quote',     title: 'Proposal/Price Quote',     color: 'bg-purple-500' },
  { id: 'Negotiation/Review',       title: 'Negotiation/Review',       color: 'bg-amber-500' },
  { id: 'Closed Won',               title: 'Closed Won',               color: 'bg-emerald-500' },
  { id: 'Closed Lost',              title: 'Closed Lost',              color: 'bg-rose-500' },
  { id: 'Closed Lost to Competition', title: 'Closed Lost to Competition', color: 'bg-red-600' },
];

const EMPTY_FORM = {
  title: '',
  contact: '',
  value: '',
  stage: 'Qualification',
  expected_close_date: '',
};

// ─── Helper: build Kanban data structure from flat API response ───────────────
function buildKanban(fetchedDeals) {
  const columns = {};
  STAGES.forEach(s => {
    columns[s.id] = { id: s.id, title: s.title, dealIds: [] };
  });

  const dealsMap = {};
  fetchedDeals.forEach(deal => {
    const id = deal.id.toString();
    dealsMap[id] = {
      id,
      name: deal.title,
      amount: parseFloat(deal.value || 0),
      company: deal.company_name || deal.contact_name || '—',
      owner: deal.owner_full_name || deal.owner_username || '?',
      ownerInitial: (deal.owner_full_name || deal.owner_username || '?')[0].toUpperCase(),
      stage: deal.stage,
      probability: deal.probability ?? 0,
      expectedClose: deal.expected_close_date || 'TBD',
    };

    const col = columns[deal.stage] ?? columns['Qualification'];
    col.dealIds.push(id);
  });

  return {
    columns,
    columnOrder: STAGES.map(s => s.id),
    deals: dealsMap,
  };
}

export default function Deals() {
  const [data, setData]           = useState({ columns: {}, columnOrder: [], deals: {} });
  const [contacts, setContacts]   = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimer, setSearchTimer] = useState(null);

  // ── New Deal modal state ────────────────────────────────────────────────────
  const [showModal, setShowModal]     = useState(false);
  const [formData, setFormData]       = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addToast } = useToast();

  // ─── Fetch deals ─────────────────────────────────────────────────────────────
  const fetchDeals = useCallback(async (query = '') => {
    setIsLoading(true);
    try {
      const response = query
        ? await dealsApi.search(query)
        : await dealsApi.getAll();
      const fetched = response.results ?? response;
      setData(buildKanban(fetched));
      setError(null);
    } catch {
      setError('Failed to synchronize pipeline data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Fetch contacts for the "contact" dropdown in New Deal modal ──────────
  const fetchContacts = useCallback(async () => {
    try {
      const res = await contactsApi.getAll();
      setContacts(res.results ?? res);
    } catch {
      // non-critical; handled gracefully below
    }
  }, []);

  useEffect(() => {
    fetchDeals();
    fetchContacts();
  }, [fetchDeals, fetchContacts]);

  // ─── Debounced search ─────────────────────────────────────────────────────
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (searchTimer) clearTimeout(searchTimer);
    setSearchTimer(setTimeout(() => fetchDeals(q), 400));
  };

  // ─── Drag & drop ──────────────────────────────────────────────────────────
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const start  = data.columns[source.droppableId];
    const finish = data.columns[destination.droppableId];
    const newStart  = { ...start,  dealIds: Array.from(start.dealIds) };
    const newFinish = start === finish ? newStart : { ...finish, dealIds: Array.from(finish.dealIds) };

    newStart.dealIds.splice(source.index, 1);
    newFinish.dealIds.splice(destination.index, 0, draggableId);

    setData(prev => ({
      ...prev,
      columns: { ...prev.columns, [newStart.id]: newStart, [newFinish.id]: newFinish },
    }));

    if (start !== finish) {
      try {
        await dealsApi.patch(draggableId, { stage: destination.droppableId });
        addToast('Pipeline stage updated');
      } catch {
        addToast('Sync failed — reverting', 'error');
        fetchDeals(searchQuery);
      }
    }
  };

  // ─── New Deal submit ──────────────────────────────────────────────────────
  const handleCreateDeal = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addToast('Deal title is required', 'error');
      return;
    }
    if (!formData.contact) {
      addToast('Please select a contact', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await dealsApi.create({
        title:               formData.title.trim(),
        contact:             formData.contact,
        value:               parseFloat(formData.value) || 0,
        stage:               formData.stage,
        expected_close_date: formData.expected_close_date || null,
      });
      addToast('Deal created successfully');
      setShowModal(false);
      setFormData(EMPTY_FORM);
      fetchDeals(searchQuery);
    } catch (err) {
      const detail = err.response?.data?.detail
        || Object.values(err.response?.data || {})[0]
        || 'Failed to create deal';
      addToast(typeof detail === 'string' ? detail : JSON.stringify(detail), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalValue = Object.values(data.deals).reduce((s, d) => s + (d.amount || 0), 0);
  const totalDeals = Object.keys(data.deals).length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-fade-in h-full flex flex-col max-w-[1800px] mx-auto pb-6">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Deals</h2>
          <div className="flex items-center mt-1 space-x-2">
            <span className="text-sm font-medium text-slate-500">Sales Pipeline</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-sm font-bold text-blue-600">{totalDeals} Deals</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-sm font-bold text-emerald-600">${totalValue.toLocaleString()} Total</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Live search */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              placeholder="Search deals..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none w-64 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); fetchDeals(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter className="w-4 h-4" />
          </button>

          <button
            onClick={() => { setFormData(EMPTY_FORM); setShowModal(true); }}
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <Plus className="mr-2 w-4 h-4" />
            New Deal
          </button>
        </div>
      </div>

      {/* ── Kanban Board ── */}
      <div className="flex-1 overflow-x-auto pb-4 relative custom-scrollbar">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50 z-20 backdrop-blur-[2px]">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Syncing Pipeline...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <p className="text-slate-600 font-medium">{error}</p>
            <button
              onClick={() => fetchDeals()}
              className="mt-4 px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-all"
            >
              Retry
            </button>
          </div>
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex space-x-5 h-full items-start min-w-max p-1">
            {data.columnOrder.map(columnId => {
              const column     = data.columns[columnId];
              const deals      = (column?.dealIds ?? []).map(id => data.deals[id]).filter(Boolean);
              const stageInfo  = STAGES.find(s => s.id === columnId);
              const colValue   = deals.reduce((s, d) => s + (d?.amount || 0), 0);

              return (
                <div key={columnId} className="w-[300px] flex-shrink-0 flex flex-col max-h-full">
                  {/* Column header */}
                  <div className="mb-4 flex items-center justify-between px-1">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${stageInfo?.color}`} />
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">{column?.title}</h3>
                      <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{deals.length}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">${colValue.toLocaleString()}</span>
                  </div>

                  <Droppable droppableId={columnId}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto custom-scrollbar rounded-[20px] p-2 space-y-3 transition-colors min-h-[200px] ${
                          snapshot.isDraggingOver ? 'bg-blue-50/60 border border-blue-200' : 'bg-slate-50/60 border border-slate-100'
                        }`}
                      >
                        {deals.map((deal, index) => (
                          <Draggable key={deal.id} draggableId={deal.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white p-4 rounded-2xl border transition-all duration-200 group ${
                                  snapshot.isDragging
                                    ? 'shadow-2xl border-blue-400 scale-[1.03] rotate-1'
                                    : 'border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md'
                                }`}
                              >
                                {/* Deal name */}
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                                    {deal.name}
                                  </h4>
                                  <button className="p-1 text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 ml-1">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Company */}
                                <div className="flex items-center text-[11px] font-medium text-slate-500 mb-3">
                                  <Briefcase className="w-3 h-3 mr-1.5 opacity-50" />
                                  {deal.company}
                                </div>

                                {/* Probability bar */}
                                <div className="mb-3">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Win probability</span>
                                    <span className="text-[9px] font-black text-slate-600">{deal.probability}%</span>
                                  </div>
                                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        deal.probability === 100 ? 'bg-emerald-500' :
                                        deal.probability === 0   ? 'bg-rose-400' :
                                        deal.probability >= 70   ? 'bg-amber-500' :
                                        'bg-blue-500'
                                      }`}
                                      style={{ width: `${deal.probability}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Value + Owner */}
                                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                  <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Value</span>
                                    <span className="text-sm font-black text-slate-900">${deal.amount.toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center space-x-1.5">
                                    <div className="w-7 h-7 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center text-[10px] font-black text-blue-600 shadow-sm" title={deal.owner}>
                                      {deal.ownerInitial}
                                    </div>
                                  </div>
                                </div>

                                {/* Close date */}
                                <div className="mt-2 flex items-center text-[10px] font-bold text-slate-400">
                                  <Calendar className="w-3 h-3 mr-1 opacity-50" />
                                  {deal.expectedClose !== 'TBD'
                                    ? new Date(deal.expectedClose).toLocaleDateString()
                                    : 'No close date'}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* ── New Deal Modal ─────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !isSubmitting && setShowModal(false)}
          />
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">

            {/* Modal header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">New Deal</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sales Pipeline</p>
              </div>
              <button
                onClick={() => !isSubmitting && setShowModal(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleCreateDeal} className="p-8 space-y-5">

              {/* Deal title */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Deal Title *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Acme Corp - Enterprise Plan"
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              {/* Contact */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Contact *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <select
                    required
                    value={formData.contact}
                    onChange={e => setFormData(p => ({ ...p, contact: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none bg-white"
                  >
                    <option value="">— Select a contact —</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.company ? ` (${c.company})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                </div>
                {contacts.length === 0 && (
                  <p className="text-[11px] text-amber-500 mt-1 font-medium">
                    No contacts available. Convert a lead first or create a contact.
                  </p>
                )}
              </div>

              {/* Value + Stage row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Deal Value
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.value}
                      onChange={e => setFormData(p => ({ ...p, value: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Stage
                  </label>
                  <select
                    value={formData.stage}
                    onChange={e => setFormData(p => ({ ...p, stage: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none bg-white"
                  >
                    {STAGES.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Close date */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Expected Close Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type="date"
                    value={formData.expected_close_date}
                    onChange={e => setFormData(p => ({ ...p, expected_close_date: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isSubmitting ? 'Creating…' : 'Create Deal'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
