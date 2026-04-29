import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { dealsData } from '../data/dummy';
import { Plus } from 'lucide-react';

export default function Deals() {
  const [data, setData] = useState(dealsData);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const start = data.columns[source.droppableId];
    const finish = data.columns[destination.droppableId];

    if (start === finish) {
      const newDealIds = Array.from(start.dealIds);
      newDealIds.splice(source.index, 1);
      newDealIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...start,
        dealIds: newDealIds,
      };

      setData({
        ...data,
        columns: {
          ...data.columns,
          [newColumn.id]: newColumn,
        },
      });
      return;
    }

    // Moving from one list to another
    const startDealIds = Array.from(start.dealIds);
    startDealIds.splice(source.index, 1);
    const newStart = {
      ...start,
      dealIds: startDealIds,
    };

    const finishDealIds = Array.from(finish.dealIds);
    finishDealIds.splice(destination.index, 0, draggableId);
    const newFinish = {
      ...finish,
      dealIds: finishDealIds,
    };

    setData({
      ...data,
      columns: {
        ...data.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Deals Pipeline</h2>
          <p className="mt-1 text-sm text-gray-500">Track and manage your sales pipeline.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors">
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            New Deal
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex space-x-6 h-full items-start">
            {data.columnOrder.map((columnId) => {
              const column = data.columns[columnId];
              const deals = column.dealIds.map((dealId) => data.deals[dealId]);

              return (
                <div key={column.id} className="w-80 flex-shrink-0 bg-gray-100 rounded-lg flex flex-col max-h-full">
                  <div className="p-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 flex justify-between items-center">
                      {column.title}
                      <span className="bg-gray-200 text-gray-600 py-0.5 px-2.5 rounded-full text-xs font-medium">
                        {deals.length}
                      </span>
                    </h3>
                  </div>
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-3 flex-1 overflow-y-auto ${snapshot.isDraggingOver ? 'bg-blue-50' : ''} transition-colors min-h-[150px]`}
                      >
                        {deals.map((deal, index) => (
                          <Draggable key={deal.id} draggableId={deal.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white p-4 rounded-md shadow-sm mb-3 border ${snapshot.isDragging ? 'border-primary-500 shadow-md transform scale-105' : 'border-gray-200'} transition-all duration-200 cursor-grab active:cursor-grabbing`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="text-sm font-medium text-gray-900">{deal.name}</h4>
                                </div>
                                <p className="text-xs text-gray-500 mb-3">{deal.company}</p>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-semibold text-gray-700">${deal.amount.toLocaleString()}</span>
                                  <div className="flex items-center text-gray-500">
                                    <div className="h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-[10px] mr-1">
                                      {deal.owner.charAt(0)}
                                    </div>
                                  </div>
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
