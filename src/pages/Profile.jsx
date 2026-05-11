import React from 'react';
import { User, Mail, Shield, Key, Camera } from 'lucide-react';

export default function Profile() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Profile Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your personal information and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Avatar & Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-4xl font-black">
                  A
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                  <Camera className="w-4 h-4 text-slate-600" />
                </button>
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">Admin User</h2>
              <p className="text-sm text-slate-500">System Administrator</p>
              
              <div className="mt-6 w-full space-y-3">
                <div className="flex items-center text-sm text-slate-600">
                  <Mail className="w-4 h-4 mr-3 text-slate-400" />
                  admin@crm.com
                </div>
                <div className="flex items-center text-sm text-slate-600">
                  <Shield className="w-4 h-4 mr-3 text-slate-400" />
                  Admin Role
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">First Name</label>
                <input 
                  type="text" 
                  defaultValue="Admin"
                  className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:border-blue-500 focus:bg-white transition-all text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Last Name</label>
                <input 
                  type="text" 
                  defaultValue="User"
                  className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:border-blue-500 focus:bg-white transition-all text-sm outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Email Address</label>
                <input 
                  type="email" 
                  defaultValue="admin@crm.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:border-blue-500 focus:bg-white transition-all text-sm outline-none"
                />
              </div>
            </div>
            <div className="mt-6">
              <button className="px-6 py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                Save Changes
              </button>
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <Key className="w-5 h-5 text-slate-400 mr-2" />
              <h3 className="text-base font-bold text-slate-900">Security</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Current Password</label>
                <input 
                  type="password" 
                  className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:border-blue-500 focus:bg-white transition-all text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">New Password</label>
                <input 
                  type="password" 
                  className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:border-blue-500 focus:bg-white transition-all text-sm outline-none"
                />
              </div>
            </div>
            <div className="mt-6">
              <button className="px-6 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
                Update Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
