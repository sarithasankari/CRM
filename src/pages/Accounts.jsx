import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Search, MapPin, 
  Filter, Loader2, MoreHorizontal, X
} from 'lucide-react';
import { contactsApi, dealsApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', industry: '', size: '' });
  const { addToast } = useToast();

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const [contactsRes, dealsRes] = await Promise.all([
        contactsApi.getAll(),
        dealsApi.getAll()
      ]);
      
      const fetchedContacts = contactsRes.results || contactsRes;
      const fetchedDeals = dealsRes.results || dealsRes;
      
      const accountMap = {};
      
      // Group contacts by company to form accounts
      fetchedContacts.forEach(contact => {
        if (contact.company) {
           const compName = contact.company.trim();
           if (!accountMap[compName]) {
              accountMap[compName] = {
                 id: compName,
                 name: compName,
                 industry: 'General',
                 size: 'N/A',
                 contacts: 1,
                 openDeals: 0,
                 value: 0,
                 location: 'Global'
              };
           } else {
              accountMap[compName].contacts += 1;
           }
        }
      });
      
      // Attach deals to accounts
      fetchedDeals.forEach(deal => {
         const contact = fetchedContacts.find(c => c.id === deal.contact);
         if (contact && contact.company) {
            const compName = contact.company.trim();
            if (accountMap[compName]) {
               accountMap[compName].openDeals += 1;
               accountMap[compName].value += parseFloat(deal.value || 0);
            }
         }
      });
      
      setAccounts(Object.values(accountMap));
    } catch (err) {
      addToast('Failed to fetch accounts', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      await contactsApi.create({
        name: 'Primary Contact',
        email: `contact@${formData.name.toLowerCase().replace(/\s+/g, '')}.com`,
        company: formData.name
      });
      addToast('Account created successfully');
      setIsModalOpen(false);
      setFormData({ name: '', industry: '', size: '' });
      fetchAccounts();
    } catch (err) {
      addToast('Failed to create account', 'error');
    }
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Accounts</h2>
          <div className="flex items-center mt-1 space-x-2">
            <span className="text-sm font-medium text-slate-500">Sales</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="text-sm font-bold text-blue-600">{filteredAccounts.length} Total Accounts</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none w-64 transition-all"
            />
          </div>
          
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-5 py-2.5 bg-[#1a56d9] text-white rounded-[4px] font-medium text-[13px] hover:bg-blue-700 transition-all"
          >
            <Plus className="mr-2 w-4 h-4" />
            Create Account
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[500px] relative">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20">
            <div className="w-8 h-8 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-[13px] font-medium text-gray-600">Account Name</th>
                  <th className="px-6 py-3 text-[13px] font-medium text-gray-600">Location</th>
                  <th className="px-6 py-3 text-[13px] font-medium text-gray-600">Industry</th>
                  <th className="px-6 py-3 text-[13px] font-medium text-gray-600">Contacts</th>
                  <th className="px-6 py-3 text-[13px] font-medium text-gray-600">Open Deals</th>
                  <th className="px-6 py-3 text-[13px] font-medium text-gray-600 text-right">Value</th>
                  <th className="px-6 py-3 text-[13px] font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAccounts.map((acc, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                        <div className="text-[13px] font-medium text-blue-600 hover:underline">{acc.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[13px] text-gray-800">{acc.location}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[13px] text-gray-800">{acc.industry}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] text-gray-800">{acc.contacts}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] text-gray-800">{acc.openDeals}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="text-[13px] text-gray-800">${acc.value.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="text-gray-400 hover:text-gray-600 p-1">
                          <MoreHorizontal className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredAccounts.length === 0 && (
               <div className="p-20 flex flex-col items-center justify-center text-center border-t border-gray-100">
                  <div className="text-[14px] text-gray-500">No matching accounts found.</div>
               </div>
            )}
          </div>
        )}
      </div>

      {/* Account Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-[16px] font-semibold text-gray-800">Create Account</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddAccount} className="p-6">
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="w-32 text-[13px] text-gray-600 text-right pr-4">Account Name *</div>
                  <div className="flex-1">
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-1.5 border border-gray-300 rounded-[4px] text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-32 text-[13px] text-gray-600 text-right pr-4">Industry</div>
                  <div className="flex-1">
                    <select value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} className="w-full px-3 py-1.5 border border-gray-300 rounded-[4px] text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                      <option value="">None</option>
                      <option>Technology</option>
                      <option>Manufacturing</option>
                      <option>Healthcare</option>
                      <option>Finance</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-1.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-[4px] text-[13px] hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-[#1a56d9] font-medium text-white rounded-[4px] text-[13px] hover:bg-blue-700 transition-colors flex items-center">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
