import React, { useState, useEffect } from 'react';
import { 
  User, Lock, Building, Users, Shield, Bell, Settings as SettingsIcon,
  Save, Upload, Plus, Edit, Trash2, Check, X, Loader2
} from 'lucide-react';
import { authService, companyProfileApi, usersApi, rolesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { INPUT_STYLE } from '../utils/themeUtils';

export default function Settings() {
  const { setUser: setGlobalUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);

      if (userData.role === 'admin') {
        const [companyData, usersData, rolesData] = await Promise.all([
          companyProfileApi.get(),
          usersApi.getAll(),
          rolesApi.getAll()
        ]);
        setCompany(companyData);
        setUsers(usersData);
        setRoles(rolesData);
      } else {
        const companyData = await companyProfileApi.get();
        setCompany(companyData);
      }
    } catch (error) {
      console.error("Failed to fetch settings data", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile Settings', icon: User },
    { id: 'security', name: 'Security Settings', icon: Lock },
    { id: 'company', name: 'Company Settings', icon: Building },
    { id: 'users', name: 'User Management', icon: Users, adminOnly: true },
    { id: 'roles', name: 'Roles & Permissions', icon: Shield, adminOnly: true },
    { id: 'notifications', name: 'Notification Settings', icon: Bell },
    { id: 'preferences', name: 'System Preferences', icon: SettingsIcon },
  ];

  const visibleTabs = tabs.filter(tab => !tab.adminOnly || (user && user.role === 'admin'));

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">Loading Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-black mb-8 uppercase tracking-tighter">Settings</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-white/[0.03] backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-2 transition-colors duration-200">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                    activeTab === tab.id 
                      ? 'bg-[#F59E0B] text-white shadow-lg shadow-[#F59E0B]/20' 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-3" />
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Content Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-white/[0.03] backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl transition-colors duration-200">
              {activeTab === 'profile' && <ProfileSettings user={user} setUser={setUser} />}
              {activeTab === 'security' && <SecuritySettings />}
              {activeTab === 'company' && <CompanySettings company={company} setCompany={setCompany} />}
              {activeTab === 'users' && <UserManagement users={users} setUsers={setUsers} />}
              {activeTab === 'roles' && <RolesPermissions roles={roles} setRoles={setRoles} />}
              {activeTab === 'notifications' && <NotificationSettingsView user={user} setUser={setUser} />}
              {activeTab === 'preferences' && <SystemPreferencesView user={user} setUser={setUser} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components for Tabs

function ProfileSettings({ user, setUser }) {
  const { setUser: setGlobalUser } = useAuth();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const updatedUser = await authService.updateProfile(formData);
      setUser(updatedUser);
      setGlobalUser(updatedUser);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile.");
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const response = await authService.uploadAvatar(file);
      const updatedUser = response.data || response;
      setUser(updatedUser);
      setGlobalUser(updatedUser);
      alert("Avatar updated successfully!");
    } catch (error) {
      console.error("Failed to upload avatar", error);
      alert("Failed to upload avatar.");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-black mb-6 uppercase tracking-wider">Profile Settings</h2>
      <div className="space-y-6">
          <div className="relative w-24 h-24 group cursor-pointer" onClick={() => document.getElementById('avatarInput').click()}>
            <div className="w-full h-full bg-[#F59E0B] rounded-full flex items-center justify-center text-3xl font-black overflow-hidden text-white">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.username?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Upload className="w-6 h-6 text-white mb-1" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Update</span>
            </div>
          </div>
          <input 
            type="file" 
            id="avatarInput" 
            className="hidden" 
            accept="image/*"
            onChange={handleAvatarChange}
          />
          <button 
            onClick={() => document.getElementById('avatarInput').click()}
            className="px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            Change Avatar
          </button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">First Name</label>
            <input name="first_name" value={formData.first_name} onChange={handleChange} className={INPUT_STYLE} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Name</label>
            <input name="last_name" value={formData.last_name} onChange={handleChange} className={INPUT_STYLE} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
            <input name="email" value={formData.email} onChange={handleChange} className={INPUT_STYLE} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</label>
            <input name="phone" value={formData.phone} onChange={handleChange} className={INPUT_STYLE} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bio</label>
            <textarea name="bio" value={formData.bio} onChange={handleChange} className={INPUT_STYLE} rows="3" />
          </div>
        </div>

        <button onClick={handleSave} className="flex items-center px-6 py-3 bg-[#F59E0B] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#D97706] transition-colors shadow-lg shadow-[#F59E0B]/20">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </button>
      </div>
    </div>
  );
}

function SecuritySettings() {
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = async () => {
    if (passwords.new_password !== passwords.confirm_password) {
      alert("Passwords do not match!");
      return;
    }
    try {
      await authService.changePassword({
        current_password: passwords.current_password,
        new_password: passwords.new_password
      });
      alert("Password updated successfully!");
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      console.error("Failed to update password", error);
      alert("Failed to update password.");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-black mb-6 uppercase tracking-wider">Security Settings</h2>
      <div className="space-y-6">
        {/* Password Change */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Change Password</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="password" name="current_password" value={passwords.current_password} onChange={handleChange} placeholder="Current Password" className={INPUT_STYLE} />
            <input type="password" name="new_password" value={passwords.new_password} onChange={handleChange} placeholder="New Password" className={INPUT_STYLE} />
            <input type="password" name="confirm_password" value={passwords.confirm_password} onChange={handleChange} placeholder="Confirm New Password" className={INPUT_STYLE} />
          </div>
          <button onClick={handlePasswordChange} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
            Update Password
          </button>
        </div>

        <div className="border-t border-white/5 pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest">Two-Factor Authentication</h3>
              <p className="text-xs text-slate-500 mt-1">Add an extra layer of security to your account.</p>
            </div>
            <button className="px-4 py-2 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-colors">
              Enable 2FA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompanySettings({ company, setCompany }) {
  const [formData, setFormData] = useState({
    name: company?.name || '',
    website: company?.website || '',
    phone: company?.phone || '',
    street_address: company?.street_address || '',
    city: company?.city || '',
    country: company?.country || '',
    gst_number: company?.gst_number || '',
    timezone: company?.timezone || 'UTC',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const updatedCompany = await companyProfileApi.update(formData);
      setCompany(updatedCompany);
      alert("Company settings updated successfully!");
    } catch (error) {
      console.error("Failed to update company settings", error);
      alert("Failed to update company settings.");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-black mb-6 uppercase tracking-wider">Company Settings</h2>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Name</label>
            <input name="name" value={formData.name} onChange={handleChange} className={INPUT_STYLE} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST / Tax ID</label>
            <input name="gst_number" value={formData.gst_number} onChange={handleChange} className={INPUT_STYLE} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Website</label>
            <input name="website" value={formData.website} onChange={handleChange} className={INPUT_STYLE} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</label>
            <input name="phone" value={formData.phone} onChange={handleChange} className={INPUT_STYLE} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</label>
            <input name="street_address" value={formData.street_address} onChange={handleChange} className={INPUT_STYLE} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timezone</label>
            <select name="timezone" value={formData.timezone} onChange={handleChange} className={INPUT_STYLE}>
              <option value="UTC">UTC</option>
              <option value="EST">EST</option>
              <option value="PST">PST</option>
            </select>
          </div>
        </div>

        <button onClick={handleSave} className="flex items-center px-6 py-3 bg-[#F59E0B] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#D97706] transition-colors shadow-lg shadow-[#F59E0B]/20">
          <Save className="w-4 h-4 mr-2" />
          Save Company Info
        </button>
      </div>
    </div>
  );
}

function UserManagement({ users, setUsers }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black uppercase tracking-wider">User Management</h2>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </button>
      </div>
      
      <div className="bg-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400">User</th>
              <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400">Role</th>
              <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400">Status</th>
              <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-white/5">
                <td className="px-4 py-3 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-black">{u.username[0].toUpperCase()}</div>
                  <div>
                    <div className="font-bold">{u.first_name} {u.last_name}</div>
                    <div className="text-slate-500">{u.email}</div>
                  </div>
                </td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3"><span className="text-emerald-500 font-bold">Active</span></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                  <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white/5 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RolesPermissions({ roles, setRoles }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black uppercase tracking-wider">Roles & Permissions</h2>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </button>
      </div>

      <div className="space-y-6">
        {roles.map(role => (
          <div key={role.id} className="bg-white/5 rounded-xl p-6">
            <h3 className="text-sm font-black uppercase tracking-widest mb-4">{role.name} Permissions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {role.permissions_list.map(perm => (
                <div key={perm} className="flex items-center space-x-2 text-xs">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>{perm}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationSettingsView({ user, setUser }) {
  const [notifications, setNotifications] = useState(user?.notifications || {});

  const handleToggle = async (key) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    try {
      const updatedUser = await authService.updateProfile({ notifications: updated });
      setUser(updatedUser);
    } catch (error) {
      console.error("Failed to update notifications", error);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-black mb-6 uppercase tracking-wider">Notification Settings</h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center py-3 border-b border-white/5">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest">Email Notifications</h3>
            <p className="text-xs text-slate-500 mt-1">Receive updates via email.</p>
          </div>
          <input type="checkbox" checked={notifications.email || false} onChange={() => handleToggle('email')} className="rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500" />
        </div>
        <div className="flex justify-between items-center py-3 border-b border-white/5">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest">SMS Notifications</h3>
            <p className="text-xs text-slate-500 mt-1">Receive updates via SMS.</p>
          </div>
          <input type="checkbox" checked={notifications.sms || false} onChange={() => handleToggle('sms')} className="rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500" />
        </div>
        <div className="flex justify-between items-center py-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest">Call Alerts</h3>
            <p className="text-xs text-slate-500 mt-1">Receive alerts for incoming calls.</p>
          </div>
          <input type="checkbox" checked={notifications.calls || false} onChange={() => handleToggle('calls')} className="rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500" />
        </div>
      </div>
    </div>
  );
}

function SystemPreferencesView({ user, setUser }) {
  const { setTheme: setGlobalTheme } = useTheme();
  const [prefs, setPrefs] = useState({
    language: user?.language || 'English',
    timezone: user?.timezone || 'UTC-8',
    theme: user?.theme || 'light',
  });

  const handleChange = (e) => {
    setPrefs({ ...prefs, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const updatedUser = await authService.updateProfile(prefs);
      setUser(updatedUser);
      setGlobalTheme(prefs.theme); // Apply theme immediately
      alert("Preferences saved!");
    } catch (error) {
      console.error("Failed to save preferences", error);
      alert("Failed to save preferences.");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-black mb-6 uppercase tracking-wider">System Preferences</h2>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Language</label>
            <select name="language" value={prefs.language} onChange={handleChange} className={INPUT_STYLE}>
              <option value="English" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">English</option>
              <option value="Spanish" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Spanish</option>
              <option value="French" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">French</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Theme</label>
            <select name="theme" value={prefs.theme} onChange={handleChange} className={INPUT_STYLE}>
              <option value="dark" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Dark</option>
              <option value="light" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">Light</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timezone</label>
            <select name="timezone" value={prefs.timezone} onChange={handleChange} className={INPUT_STYLE}>
              <option value="UTC-8" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">UTC-8</option>
              <option value="UTC" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">UTC</option>
              <option value="GMT" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">GMT</option>
            </select>
          </div>
        </div>

        <button onClick={handleSave} className="flex items-center px-6 py-3 bg-[#F59E0B] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#D97706] transition-colors shadow-lg shadow-[#F59E0B]/20">
          <Save className="w-4 h-4 mr-2" />
          Save Preferences
        </button>
      </div>
    </div>
  );
}
