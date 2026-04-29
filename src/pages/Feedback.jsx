import React, { useState } from 'react';
import { MessageSquare, Star, Filter, BarChart2 } from 'lucide-react';

const initialFeedback = [
  { id: 1, customer: 'Acme Corp', rating: 5, comment: 'Excellent onboarding experience!', date: 'Oct 25, 2023' },
  { id: 2, customer: 'Global Tech Inc.', rating: 3, comment: 'Good platform, but missing some API docs.', date: 'Oct 20, 2023' },
  { id: 3, customer: 'TechNova', rating: 4, comment: 'Very responsive support team.', date: 'Oct 15, 2023' },
];

export default function Feedback() {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [filterRating, setFilterRating] = useState(0);

  const filteredFeedback = filterRating === 0 ? feedback : feedback.filter(f => f.rating === filterRating);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-10">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Voice of Customer</h2>
          <p className="mt-1 text-sm text-gray-500">Track and analyze customer feedback and ratings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Summary */}
        <div className="col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center text-center">
          <BarChart2 className="w-8 h-8 text-blue-500 mb-2" />
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Average Rating</h3>
          <div className="text-5xl font-bold text-gray-900 my-2">4.0</div>
          <div className="flex text-yellow-400">
            <Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500 mt-2">Based on {feedback.length} reviews</p>
        </div>

        {/* Feedback List */}
        <div className="col-span-1 lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center"><MessageSquare className="w-4 h-4 mr-2 text-gray-400" /> Recent Feedback</h3>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select 
                className="text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 py-1 pl-2 pr-8"
                value={filterRating}
                onChange={(e) => setFilterRating(Number(e.target.value))}
              >
                <option value={0}>All Ratings</option>
                <option value={5}>5 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={2}>2 Stars</option>
                <option value={1}>1 Star</option>
              </select>
            </div>
          </div>
          
          <ul className="divide-y divide-gray-100">
            {filteredFeedback.map((f) => (
              <li key={f.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900">{f.customer}</h4>
                    <div className="flex text-yellow-400 mt-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < f.rating ? 'fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <p className="text-sm text-gray-700">"{f.comment}"</p>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{f.date}</span>
                </div>
              </li>
            ))}
            {filteredFeedback.length === 0 && (
              <li className="p-8 text-center text-gray-500">No feedback found for this rating.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
