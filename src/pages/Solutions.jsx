import React, { useState } from 'react';
import { 
  BookOpen, Search, Folder, ChevronRight, 
  HelpCircle, Zap, Star, TrendingUp, 
  ArrowRight, Sparkles, MessageCircle, FileText
} from 'lucide-react';

const categories = [
  { id: 1, name: 'Getting Started', articles: 12, icon: Sparkles, color: 'blue' },
  { id: 2, name: 'Billing & Subscriptions', articles: 5, icon: FileText, color: 'emerald' },
  { id: 3, name: 'API Integration', articles: 8, icon: Zap, color: 'amber' },
  { id: 4, name: 'Troubleshooting', articles: 15, icon: HelpCircle, color: 'rose' },
];

const articles = [
  { id: 1, title: 'How to reset your password', category: 'Troubleshooting', views: 1205, trend: '+12%' },
  { id: 2, title: 'Setting up your first project', category: 'Getting Started', views: 850, trend: '+5%' },
  { id: 3, title: 'Understanding your invoice', category: 'Billing & Subscriptions', views: 640, trend: '-2%' },
  { id: 4, title: 'Authenticating with the API', category: 'API Integration', views: 2300, trend: '+24%' },
];

export default function Solutions() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredArticles = articles.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-12 animate-fade-in max-w-[1400px] mx-auto pb-10">
      
      {/* Hero Search Section */}
      <div className="relative overflow-hidden rounded-[40px] bg-slate-900 px-8 py-20 text-center shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
        
        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
           <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Support</span>
           </div>
           <h2 className="text-5xl font-black text-white tracking-tight leading-[1.1]">Solutions</h2>
           <p className="text-slate-400 text-lg font-medium">Access our documentation and troubleshooting guides.</p>
           
           <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search for answers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-8 py-5 bg-white rounded-[24px] text-slate-900 text-lg font-bold shadow-2xl focus:ring-4 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Categories Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div>
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center">
                <Folder className="w-4 h-4 mr-2" /> Categories
             </h3>
             <div className="grid grid-cols-1 gap-4">
                {categories.map(cat => (
                  <div key={cat.id} className="glass-card group p-6 hover:bg-slate-900 hover:border-slate-900 transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 bg-${cat.color}-50 rounded-2xl flex items-center justify-center text-${cat.color}-600 group-hover:bg-blue-600 group-hover:text-white transition-all`}>
                             <cat.icon className="w-6 h-6" />
                          </div>
                          <div>
                             <h4 className="text-sm font-black text-slate-900 group-hover:text-white transition-colors">{cat.name}</h4>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{cat.articles} Articles</p>
                          </div>
                       </div>
                       <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-white transition-all" />
                    </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-blue-600 rounded-[32px] p-8 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden group cursor-pointer">
             <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
             <MessageCircle className="w-10 h-10 mb-4" />
             <h4 className="text-xl font-black mb-2">Need Help?</h4>
             <p className="text-blue-100 text-sm font-medium mb-6 leading-relaxed">Our support team is available to assist you.</p>
             <button className="w-full py-3 bg-white text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-50 transition-colors">Contact Support</button>
          </div>
        </div>

        {/* Knowledge Registry */}
        <div className="lg:col-span-8 space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                 <BookOpen className="w-4 h-4 mr-2" /> Articles
              </h3>
              <div className="flex items-center space-x-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                 <TrendingUp className="w-3 h-3" />
                 <span>Popular Topics</span>
              </div>
           </div>

           <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden divide-y divide-slate-50">
              {filteredArticles.map(article => (
                <div key={article.id} className="p-8 hover:bg-slate-50/50 transition-all group cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-6 items-center">
                       <div className="w-14 h-14 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                          <FileText className="w-6 h-6" />
                       </div>
                       <div className="space-y-1">
                          <div className="flex items-center space-x-3">
                             <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{article.title}</h4>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full">Registry ID: {article.id}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                             <span className="flex items-center"><Folder className="w-3 h-3 mr-1.5" /> {article.category}</span>
                             <span className="flex items-center"><TrendingUp className="w-3 h-3 mr-1.5 text-emerald-500" /> {article.views} Engagements</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center space-x-4">
                       <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{article.trend}</span>
                       <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                          <ChevronRight className="w-5 h-5" />
                       </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredArticles.length === 0 && (
                <div className="p-20 text-center">
                   <HelpCircle className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                   <h4 className="text-xl font-black text-slate-900 mb-2">Zero Registry Matches</h4>
                   <p className="text-sm text-slate-500">The requested logic does not exist in our wisdom database.</p>
                </div>
              )}
           </div>

           {/* Wisdom Quick Link */}
           <div className="grid grid-cols-2 gap-6">
              <div className="glass-card p-6 flex items-center space-x-4 border-slate-100 bg-slate-50/20">
                 <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600">
                    <Star className="w-5 h-5" />
                 </div>
                 <div>
                    <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Protocol Best Practices</h5>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Updated 4h ago</p>
                 </div>
              </div>
              <div className="glass-card p-6 flex items-center space-x-4 border-slate-100 bg-slate-50/20">
                 <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600">
                    <Zap className="w-5 h-5" />
                 </div>
                 <div>
                    <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">API Webhook Logic</h5>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">High Demand Unit</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
