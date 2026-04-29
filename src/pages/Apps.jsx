import React, { useState } from 'react';
import { Puzzle, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';

const initialApps = [
  { id: 1, name: 'Slack', description: 'Send deal notifications to Slack channels.', category: 'Communication', enabled: true },
  { id: 2, name: 'Mailchimp', description: 'Sync marketing leads automatically.', category: 'Marketing', enabled: false },
  { id: 3, name: 'Google Calendar', description: 'Sync meetings and scheduled calls.', category: 'Productivity', enabled: true },
  { id: 4, name: 'QuickBooks', description: 'Export invoices directly to accounting.', category: 'Finance', enabled: false },
];

export default function Apps() {
  const [apps, setApps] = useState(initialApps);

  const toggleApp = (id) => {
    setApps(apps.map(app => app.id === id ? { ...app, enabled: !app.enabled } : app));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-10">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">App Integrations</h2>
          <p className="mt-1 text-sm text-gray-500">Connect your CRM with third-party tools.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map(app => (
          <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl mr-3">
                  <Puzzle className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{app.name}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{app.category}</span>
                </div>
              </div>
              <button onClick={() => toggleApp(app.id)} className="focus:outline-none">
                {app.enabled ? (
                  <ToggleRight className="w-8 h-8 text-green-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-gray-300 hover:text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-sm text-gray-600 flex-1">{app.description}</p>
            {app.enabled && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center">
                  Configure Settings <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
