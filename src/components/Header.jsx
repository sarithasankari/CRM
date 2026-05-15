import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Bell, Settings, HelpCircle, Plus, 
  User, CheckSquare, LogOut, ChevronDown, 
  Zap, Command, ShieldCheck, Globe, Activity, Cloud,
  X, LayoutDashboard, Users, Briefcase, FileText, BarChart2,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile]             = useState(false);
  const [showQuickActions, setShowQuickActions]   = useState(false);
  const [searchQuery, setSearchQuery]             = useState('');
  const searchRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Cmd+K / Ctrl+K → focus search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (e.key === 'Escape') {
        searchRef.current?.blur();
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Global search: navigate to most relevant page based on query
  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (q.includes('lead'))    navigate('/leads');
      else if (q.includes('deal'))  navigate('/deals');
      else if (q.includes('contact')) navigate('/contacts');
      else if (q.includes('workflow')) navigate('/workflows');
      else if (q.includes('report'))  navigate('/analytics');
      else navigate('/leads');  // default
      setSearchQuery('');
    }
  };

  const QUICK_ACTIONS = [
    { label: 'New Lead',    icon: <User className="w-4 h-4" />,     path: '/leads' },
    { label: 'New Deal',    icon: <Briefcase className="w-4 h-4" />, path: '/deals' },
    { label: 'New Contact', icon: <Users className="w-4 h-4" />,    path: '/contacts' },
    { label: 'Reports',     icon: <BarChart2 className="w-4 h-4" />, path: '/analytics' },
    { label: 'Dashboard',   icon: <LayoutDashboard className="w-4 h-4" />, path: '/' },
  ];

  return (
    <header className="bg-[#F8FAFC]/80 backdrop-blur-md border-b border-[#0F172A]/10 h-20 flex items-center justify-between px-8 z-30 sticky top-0 shadow-sm">
      


      {/* Universal Search Command */}
      <div className="flex-1 flex">
        <div className="relative w-full max-w-xl group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-[#0F172A]/50 group-focus-within:text-[#0F172A] transition-colors" />
          </div>
          <input
            ref={searchRef}
            className="block w-full pl-12 pr-14 py-3 border border-[#0F172A]/10 rounded-2xl leading-5 bg-[#0F172A]/5 placeholder:text-[#0F172A]/50 focus:outline-none focus:bg-[#F8FAFC] focus:border-[#0F172A] focus:ring-4 focus:ring-[#0F172A]/5 sm:text-sm transition-all"
            placeholder="Search leads, deals, contacts… (Ctrl+K)"
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
             <div className="flex items-center space-x-1 px-2 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-[#0F172A]/50 border border-slate-200 uppercase tracking-widest">
                <Command className="w-3 h-3" />
                <span>K</span>
             </div>
          </div>
        </div>
      </div>
      
      {/* Operational Tools */}
      <div className="ml-8 flex items-center space-x-3">
        <div className="flex items-center space-x-1 px-2 py-1 bg-[#0F172A]/5 border border-[#0F172A]/10 rounded-2xl mr-4">
           {/* Globe → Leads (global record search) */}
           <button
             onClick={() => navigate('/leads')}
             title="Go to Leads"
             className="p-2.5 rounded-xl text-[#0F172A]/50 hover:text-[#0F172A] hover:bg-[#F8FAFC] hover:shadow-sm transition-all"
           >
            <Globe className="h-4 w-4" />
          </button>
           {/* Zap → Quick Actions panel */}
           <div className="relative">
            <button
              onClick={() => setShowQuickActions(v => !v)}
              title="Quick Actions"
              className="p-2.5 rounded-xl text-[#0F172A]/50 hover:text-[#0F172A] hover:bg-[#F8FAFC] hover:shadow-sm transition-all"
            >
              <Zap className="h-4 w-4" />
            </button>
            {showQuickActions && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowQuickActions(false)} />
                <div className="absolute left-0 mt-3 w-52 bg-[#F8FAFC] border border-[#0F172A]/10 shadow-xl rounded-2xl z-50 overflow-hidden py-2">
                  <p className="text-[9px] font-black text-[#0F172A]/50 uppercase tracking-widest px-4 pb-2">Quick Actions</p>
                  {QUICK_ACTIONS.map(a => (
                    <button
                      key={a.label}
                      onClick={() => { navigate(a.path); setShowQuickActions(false); }}
                      className="w-full text-left px-4 py-2.5 text-[12px] font-semibold text-slate-700 hover:bg-[#0F172A]/5 flex items-center gap-2 transition-colors"
                    >
                      <span className="text-blue-500">{a.icon}</span> {a.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* Settings → navigate to settings */}
          <button
            onClick={() => navigate('/settings')}
            title="Settings"
            className="p-2.5 rounded-xl text-[#0F172A]/50 hover:text-[#0F172A] hover:bg-[#F8FAFC] hover:shadow-sm transition-all"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Intelligence Alert System */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all relative ${
              showNotifications ? 'bg-[#0F172A]/10 text-[#0F172A] border border-[#0F172A]/20 shadow-inner' : 'bg-[#F8FAFC] border border-[#0F172A]/10 text-slate-500 hover:text-[#0F172A] hover:border-[#0F172A]/20 shadow-sm'
            }`}
          >
            <span className="absolute top-2.5 right-2.5 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            <Bell className="h-5 w-5" />
          </button>
          
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 mt-4 w-[360px] bg-[#F8FAFC] border border-[#0F172A]/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[32px] z-50 overflow-hidden animate-fade-in p-2">
                <div className="px-6 py-4 border-b border-slate-50 bg-[#0F172A]/5/30 flex justify-between items-center rounded-t-[28px]">
                  <h3 className="text-[10px] font-black text-[#0F172A]/50 uppercase tracking-widest">Protocol Alerts</h3>
                  <button className="text-[9px] font-black text-[#0F172A] uppercase tracking-widest hover:underline">Flush All</button>
                </div>
                <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-50">
                  <NotificationItem 
                    icon={<UserPlus className="w-4 h-4" />} 
                    iconBg="bg-indigo-50 text-indigo-600"
                    title="Intelligence Engine: New Lead" 
                    desc="'Alpha Global' just matched your conversion profile via Google Ads." 
                    time="2m ago" 
                    urgent={true}
                  />
                  <NotificationItem 
                    icon={<Activity className="w-4 h-4" />} 
                    iconBg="bg-[#0F172A]/10 text-[#0F172A]"
                    title="Revenue Threshold Alert" 
                    desc="Monthly target reached 92% velocity. Accelerate closures." 
                    time="1h ago" 
                  />
                  <NotificationItem 
                    icon={<ShieldCheck className="w-4 h-4" />} 
                    iconBg="bg-emerald-50 text-emerald-600"
                    title="Security Protocol: Login" 
                    desc="New session verified from Mumbai, India (IP: 103.22.XX)." 
                    time="3h ago" 
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-10 w-px bg-slate-100 mx-2"></div>

        {/* Operator Profile Nexus */}
        <div className="relative">
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center space-x-4 pl-3 pr-2 py-2 bg-[#0F172A]/5 hover:bg-slate-100 rounded-2xl transition-all border border-transparent hover:border-slate-200"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-blue-600/20 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.first_name ? user.first_name[0].toUpperCase() : (user?.username ? user.username[0].toUpperCase() : 'U')
              )}
            </div>
            <div className="hidden lg:flex flex-col items-start pr-2">
              <span className="text-xs font-black text-slate-900 leading-none">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user?.username || 'Operator')}
              </span>
              <span className="text-[9px] text-[#0F172A]/50 font-black uppercase tracking-widest mt-1.5 flex items-center">
                 <ShieldCheck className="w-3 h-3 mr-1 text-emerald-500" />
                 Verified
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-[#0F172A]/50 transition-transform duration-300 ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          {showProfile && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
              <div className="absolute right-0 mt-4 w-64 bg-[#F8FAFC] border border-[#0F172A]/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[32px] z-50 overflow-hidden animate-fade-in p-2">
                <div className="px-5 py-4 border-b border-slate-50 mb-1">
                  <p className="text-[9px] font-black text-[#0F172A]/50 uppercase tracking-widest">Operator Context</p>
                </div>
                <div className="space-y-1">
                  <button 
                    onClick={() => { navigate('/profile'); setShowProfile(false); }}
                    className="w-full text-left px-4 py-3 text-[11px] font-black text-slate-600 uppercase tracking-widest hover:bg-[#0F172A]/5 rounded-2xl flex items-center transition-all group"
                  >
                    <User className="w-4 h-4 mr-3 text-[#0F172A]/50 group-hover:text-[#0F172A]" /> Identity Matrix
                  </button>
                  <button 
                    onClick={() => { navigate('/settings'); setShowProfile(false); }}
                    className="w-full text-left px-4 py-3 text-[11px] font-black text-slate-600 uppercase tracking-widest hover:bg-[#0F172A]/5 rounded-2xl flex items-center transition-all group"
                  >
                    <Settings className="w-4 h-4 mr-3 text-[#0F172A]/50 group-hover:text-[#0F172A]" /> Logic Control
                  </button>
                </div>
                <div className="h-px bg-[#0F172A]/5 my-2 mx-4" />
                <button 
                  onClick={logout}
                  className="w-full text-left px-4 py-3 text-[11px] font-black text-rose-600 uppercase tracking-widest hover:bg-rose-50 rounded-2xl flex items-center transition-all group"
                >
                  <LogOut className="w-4 h-4 mr-3 text-rose-400" /> Flush Session
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NotificationItem({ icon, iconBg, title, desc, time, urgent }) {
  return (
    <div className="p-6 hover:bg-[#0F172A]/5 cursor-pointer flex items-start transition-all group relative">
      {urgent && (
        <div className="absolute top-6 right-6 flex items-center space-x-1">
          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
          <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Urgent</span>
        </div>
      )}
      <div className={`p-3 ${iconBg} rounded-2xl mr-4 shadow-inner group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-start">
           <h4 className={`text-[11px] font-black uppercase tracking-widest ${urgent ? 'text-slate-900' : 'text-slate-700'}`}>{title}</h4>
           {!urgent && <span className="text-[9px] font-bold text-[#0F172A]/50 uppercase tracking-widest">{time}</span>}
        </div>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[220px]">{desc}</p>
      </div>
    </div>
  );
}
