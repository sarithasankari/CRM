import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Key, Camera, Loader2, Globe, Bell, Smartphone, Lock, Eye, CreditCard, LogOut, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    username: '',
    bio: ''
  });
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [preferences, setPreferences] = useState({
    language: 'English',
    timezone: 'UTC-8',
    theme: 'light',
    notifications: {
      email: true,
      sms: false,
      push: true
    }
  });
  const [activeTab, setActiveTab] = useState('personal');
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    if (user) {
      setProfile({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        username: user.username || '',
        bio: user.bio || ''
      });
      setPreferences({
        language: user.language || 'English',
        timezone: user.timezone || 'UTC-8',
        theme: user.theme || 'light',
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      });
      setIsLoading(false);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handlePreferenceChange = async (name, value) => {
    setPreferences(prev => ({ ...prev, [name]: value }));
    try {
      await authService.updateProfile({ [name]: value });
      addToast('Preference updated!', 'success');
    } catch (error) {
      console.error("Failed to update preference", error);
      addToast('Failed to update preference', 'error');
    }
  };

  const handleNotificationToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handleSaveProfile = async () => {
    try {
      await authService.updateProfile(profile);
      addToast('Profile updated successfully!', 'success');
    } catch (error) {
      console.error("Failed to update profile", error);
      addToast('Failed to update profile', 'error');
    }
  };

  const handleUpdatePassword = async () => {
    if (passwords.new_password !== passwords.confirm_password) {
      addToast('New passwords do not match!', 'error');
      return;
    }
    try {
      await authService.changePassword({
        current_password: passwords.current_password,
        new_password: passwords.new_password
      });
      addToast('Password updated successfully!', 'success');
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      console.error("Failed to update password", error);
      addToast(error.response?.data?.error || 'Failed to update password', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const menuItems = [
    { id: 'personal', icon: User, label: 'Personal Information' },
    { id: 'security', icon: Key, label: 'Security Settings' },
    { id: 'preferences', icon: Globe, label: 'Account Preferences' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'privacy', icon: Lock, label: 'Privacy Settings' },
    { id: 'devices', icon: Smartphone, label: 'Connected Devices' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your personal information, security, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-2xl transition-all ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`w-4 h-4 mr-3 ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            ))}
            <div className="pt-4 mt-4 border-t border-slate-100">
              <button className="w-full flex items-center px-4 py-3 text-sm font-bold rounded-2xl text-red-600 hover:bg-red-50 transition-all">
                <LogOut className="w-4 h-4 mr-3 text-red-500" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Right Main Content Panel */}
        <div className="lg:col-span-3">
          {/* Personal Information Section */}
          {activeTab === 'personal' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black">
                    {profile.first_name?.[0] || 'U'}
                  </div>
                  <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                    <Camera className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Profile Picture</h3>
                  <p className="text-xs text-slate-500 mt-0.5">PNG, JPG or GIF. Max 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">First Name</label>
                  <input 
                    type="text" 
                    name="first_name"
                    value={profile.first_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:border-blue-500 focus:bg-white transition-all text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Last Name</label>
                  <input 
                    type="text" 
                    name="last_name"
                    value={profile.last_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:border-blue-500 focus:bg-white transition-all text-sm outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Email Address</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      name="email"
                      value={profile.email}
                      readOnly
                      className="w-full px-4 py-3 bg-slate-100 border border-transparent rounded-xl text-sm outline-none text-slate-600 cursor-not-allowed"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-xs font-bold text-green-600">
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Verified
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Phone Number</label>
                  <input 
                    type="text" 
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:border-blue-500 focus:bg-white transition-all text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Username</label>
                  <input 
                    type="text" 
                    name="username"
                    value={profile.username}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:border-blue-500 focus:bg-white transition-all text-sm outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Bio</label>
                  <textarea 
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:border-blue-500 focus:bg-white transition-all text-sm outline-none resize-none"
                    placeholder="Tell us a little about yourself..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button className="px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProfile}
                  className="px-5 py-2.5 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Security Settings Section */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Password Card */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 mb-2">Change Password</h3>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Current Password</label>
                  <input 
                    type="password" 
                    name="current_password"
                    value={passwords.current_password}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:border-blue-500 focus:bg-white transition-all text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">New Password</label>
                  <input 
                    type="password" 
                    name="new_password"
                    value={passwords.new_password}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:border-blue-500 focus:bg-white transition-all text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Confirm New Password</label>
                  <input 
                    type="password" 
                    name="confirm_password"
                    value={passwords.confirm_password}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:border-blue-500 focus:bg-white transition-all text-sm outline-none"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <button 
                    onClick={handleUpdatePassword}
                    className="px-5 py-2.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                  >
                    Update Password
                  </button>
                </div>
              </div>

              {/* 2FA Card */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Two-Factor Authentication</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Add an extra layer of security to your account.</p>
                </div>
                <button className="w-12 h-6 bg-slate-200 rounded-full relative p-0.5 transition-colors focus:outline-none">
                  <div className="w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform" />
                </button>
              </div>

              {/* Recent Activity Card */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 mb-2">Recent Login Activity</h3>
                <div className="space-y-3">
                  {[
                    { device: 'MacBook Pro', location: 'San Francisco, USA', time: 'Active now', icon: Smartphone },
                    { device: 'iPhone 13', location: 'London, UK', time: '2 hours ago', icon: Smartphone },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div className="flex items-center">
                        <activity.icon className="w-5 h-5 text-slate-400 mr-3" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{activity.device}</p>
                          <p className="text-xs text-slate-500">{activity.location}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <button className="text-xs font-black uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors">
                    Logout from all devices
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Account Preferences Section */}
          {activeTab === 'preferences' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-slate-900 mb-2">Account Preferences</h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Language</label>
                  <select 
                    value={preferences.language}
                    onChange={(e) => handlePreferenceChange('language', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:border-blue-500 focus:bg-white transition-all text-sm outline-none font-bold text-slate-700"
                  >
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Timezone</label>
                  <select 
                    value={preferences.timezone}
                    onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl focus:border-blue-500 focus:bg-white transition-all text-sm outline-none font-bold text-slate-700"
                  >
                    <option>UTC-8 (Pacific Time)</option>
                    <option>UTC-5 (Eastern Time)</option>
                    <option>UTC+0 (London)</option>
                    <option>UTC+1 (Paris)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Theme Mode</h4>
                  <p className="text-xs text-slate-500">Switch between light and dark themes.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => handlePreferenceChange('theme', 'light')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${preferences.theme === 'light' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                  >
                    Light
                  </button>
                  <button 
                    onClick={() => handlePreferenceChange('theme', 'dark')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${preferences.theme === 'dark' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                  >
                    Dark
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 mb-4">Notification Preferences</h4>
                <div className="space-y-3">
                  {Object.entries(preferences.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700 uppercase tracking-wide text-xs">{key} Notifications</span>
                      <button 
                        onClick={() => handleNotificationToggle(key)}
                        className={`w-12 h-6 rounded-full relative p-0.5 transition-colors focus:outline-none ${value ? 'bg-blue-600' : 'bg-slate-200'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Placeholder for other tabs */}
          {(activeTab === 'notifications' || activeTab === 'privacy' || activeTab === 'devices') && (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col items-center justify-center h-64 text-slate-500">
              <Shield className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest text-xs">Section Under Construction</p>
              <p className="text-xs mt-1">This section will be available in a future update.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
