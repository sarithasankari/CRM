import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { dealsApi } from '../services/api';
import { 
  Plus, Loader2, AlertCircle, TrendingUp, MoreHorizontal, 
  Calendar, Filter, Search, ChevronDown, CheckCircle2,
  DollarSign, Briefcase, User, Info
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const STAGES = [
  { id: 'Qualification', title: 'Qualification', color: 'bg-blue-500' },
  { id: 'Needs Analysis', title: 'Needs Analysis', color: 'bg-cyan-500' },
  { id: 'Value Proposition', title: 'Value Proposition', color: 'bg-indigo-500' },
  { id: 'Identify Decision Makers', title: 'Identify Decision Makers', color: 'bg-violet-500' },
  { id: 'Proposal/Price Quote', title: 'Proposal/Price Quote', color: 'bg-purple-500' },
  { id: 'Negotiation/Review', title: 'Negotiation/Review', color: 'bg-amber-500' },
  { id: 'Closed Won', title: 'Closed Won', color: 'bg-emerald-500' },
  { id: 'Closed Lost', title: 'Closed Lost', color: 'bg-rose-500' },
  { id: 'Closed Lost to Competition', title: 'Closed Lost to Competition', color: 'bg-red-600' }
];

export default function Deals() {
  const [data, setData] = useState({ columns: {}, columnOrder: [], deals: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  const fetchDeals = async () => {
    setIsLoading(true);
    try {
      const response = await dealsApi.getAll();
      const fetchedDeals = response.results || response;

      const newColumns = {};
      STAGES.forEach(stage => {
        newColumns[stage.id] = { id: stage.id, title: stage.title, dealIds: [] };
      });

      const dealsMap = {};
      fetchedDeals.forEach(deal => {
        const id = deal.id.toString();
        dealsMap[id] = {
          id,
          name: deal.title,
          amount: parseFloat(deal.value || 0),
          company: deal.company_name || 'Individual Prospect',
          owner: deal.owner_name || 'U',
          stage: deal.stage,
          expectedClose: deal.expected_close_date || 'TBD',
          priority: deal.priority || 'medium'
        };
        const stage = deal.stage || 'Qualification';
        if (newColumns[stage]) {
          newColumns[stage].dealIds.push(id);
        } else {
          newColumns['Qualification'].dealIds.push(id);
        }
      });

      setData({
        columns: newColumns,
        columnOrder: STAGES.map(s => s.id),
        deals: dealsMap
      });
    } catch (err) {
      setError("Failed to synchronize pipeline data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const start = data.columns[source.droppableId];
    const finish = data.columns[destination.droppableId];

    const newStart = { ...start, dealIds: Array.from(start.dealIds) };
    const newFinish = start === finish ? newStart : { ...finish, dealIds: Array.from(finish.dealIds) };

    newStart.dealIds.splice(source.index, 1);
    newFinish.dealIds.splice(destination.index, 0, draggableId);

    setData(prev => ({
      ...prev,
      columns: {
        ...prev.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      },
    }));

    if (start !== finish) {
      try {
        await dealsApi.patch(draggableId, { stage: destination.droppableId });
        addToast("Pipeline stage updated");
      } catch (err) {
        addToast("Sync failed - reverting changes", "error");
        fetchDeals();
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in h-full flex flex-col max-w-[1800px] mx-auto pb-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Deals</h2>
          <div className="flex items-center mt-1 space-x-2">
            <span className="text-sm font-medium text-slate-500">Sales Pipeline</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="text-sm font-bold text-blue-600">{Object.keys(data.deals).length} Total Deals</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search deals..."
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none w-64 transition-all"
            />
          </div>
          
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter className="w-4 h-4" />
          </button>
          
          <button className="inline-flex items-center px-5 py-2.5 bg-[#1a56d9] text-white rounded-[4px] font-medium text-[13px] hover:bg-blue-700 transition-all">
            <Plus className="mr-2 w-4 h-4" />
            New Deal
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto pb-4 relative custom-scrollbar">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/50 z-20 backdrop-blur-[2px]">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Syncing Pipeline...</p>
          </div>
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex space-x-6 h-full items-start min-w-max p-1">
            {data.columnOrder.map((columnId) => {
              const column = data.columns[columnId];
              const deals = column.dealIds.map((dealId) => data.deals[dealId]);
              const stageInfo = STAGES.find(s => s.id === columnId);
              const columnValue = deals.reduce((sum, d) => sum + (d?.amount || 0), 0);

              return (
                <div key={column.id} className="w-[320px] flex-shrink-0 flex flex-col max-h-full">
                  <div className="mb-4 flex items-center justify-between px-2">
                    <div className="flex items-center space-x-2">
                       <div className={`w-2 h-2 rounded-full ${stageInfo.color}`} />
                       <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{column.title}</h3>
                       <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{deals.length}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">${columnValue.toLocaleString()}</span>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto custom-scrollbar rounded-[24px] p-2 space-y-3 transition-colors min-h-[200px] ${snapshot.isDraggingOver ? 'bg-blue-50/50' : 'bg-slate-50/50 border border-slate-100'}`}
                      >
                        {deals.map((deal, index) => (
                          <Draggable key={deal.id} draggableId={deal.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white p-5 rounded-2xl border transition-all duration-200 group ${
                                  snapshot.isDragging 
                                    ? 'shadow-2xl border-blue-500 scale-105 rotate-2' 
                                    : 'border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-3">
                                   <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">{deal.name}</h4>
                                   <button className="p-1 text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all">
                                      <MoreHorizontal className="w-4 h-4" />
                                   </button>
                                </div>
                                
                                <div className="flex items-center text-[11px] font-medium text-slate-500 mb-4">
                                   <Briefcase className="w-3 h-3 mr-1.5 opacity-50" />
                                   {deal.company}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Value</span>
                                      <span className="text-sm font-black text-slate-900">${deal.amount.toLocaleString()}</span>
                                   </div>
                                   <div className="flex -space-x-2">
                                      <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-500">
                                         {deal.owner[0]}
                                      </div>
                                   </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                   <div className="flex items-center space-x-3">
                                      <div className="flex items-center text-[10px] font-bold text-slate-400">
                                         <Calendar className="w-3 h-3 mr-1 opacity-50" />
                                         {deal.expectedClose}
                                      </div>
                                   </div>
                                   <div className={`w-2 h-2 rounded-full ${deal.priority === 'high' ? 'bg-rose-500 animate-pulse' : 'bg-slate-200'}`} />
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
    </div>
  );
}
