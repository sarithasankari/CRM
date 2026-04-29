import React, { useState } from 'react';
import { BookOpen, Search, Folder, ChevronRight } from 'lucide-react';

const categories = [
  { id: 1, name: 'Getting Started', articles: 12 },
  { id: 2, name: 'Billing & Subscriptions', articles: 5 },
  { id: 3, name: 'API Integration', articles: 8 },
  { id: 4, name: 'Troubleshooting', articles: 15 },
];

const articles = [
  { id: 1, title: 'How to reset your password', category: 'Troubleshooting', views: 1205 },
  { id: 2, title: 'Setting up your first project', category: 'Getting Started', views: 850 },
  { id: 3, title: 'Understanding your invoice', category: 'Billing & Subscriptions', views: 640 },
  { id: 4, title: 'Authenticating with the API', category: 'API Integration', views: 2300 },
];

export default function Solutions() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredArticles = articles.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-10">
      <div className="text-center py-10 bg-blue-600 rounded-2xl text-white shadow-sm mb-8">
        <h2 className="text-3xl font-bold mb-4">How can we help you?</h2>
        <div className="max-w-2xl mx-auto relative px-4">
          <Search className="absolute left-7 top-3.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search the knowledge base..."
            className="w-full pl-12 pr-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Categories */}
        <div className="md:col-span-1 space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center mb-4">
            <Folder className="w-5 h-5 mr-2 text-blue-500" /> Categories
          </h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {categories.map(cat => (
                <li key={cat.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center group">
                  <span className="font-medium text-gray-700 group-hover:text-blue-600">{cat.name}</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{cat.articles}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Articles */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center mb-4">
            <BookOpen className="w-5 h-5 mr-2 text-blue-500" /> Popular Articles
          </h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {filteredArticles.map(article => (
                <li key={article.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-lg">{article.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">in {article.category} • {article.views} views</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
