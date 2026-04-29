import React, { useState } from 'react';
import { Terminal, Key, Copy, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ApiConsole() {
  const [apiKey, setApiKey] = useState('crm_live_8f92a3b1c4d5e6f7g8h9i0j');
  const [copied, setCopied] = useState(false);

  const generateNewKey = () => {
    const newKey = 'crm_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApiKey(newKey);
    setCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1000px] mx-auto pb-10">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">API Console</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your API keys and developer access.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center space-x-2 text-red-600 mb-4 bg-red-50 p-3 rounded-lg border border-red-100">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">Keep your API key secret. Do not expose it in public repositories or client-side code.</p>
          </div>

          <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center">
            <Key className="w-4 h-4 mr-2 text-gray-400" /> Active API Key
          </label>
          <div className="flex items-center space-x-3">
            <div className="relative flex-1 max-w-lg">
              <input 
                type="text" 
                readOnly 
                value={apiKey} 
                className="w-full pl-3 pr-10 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-800 font-mono text-sm focus:outline-none"
              />
              <button 
                onClick={copyToClipboard}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <button 
              onClick={generateNewKey}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              Roll Key
            </button>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Terminal className="w-5 h-5 mr-2 text-gray-400" /> Documentation Preview
          </h3>
          <div className="prose prose-sm max-w-none text-gray-600">
            <p>To authenticate API requests, provide your API key in the <code>Authorization</code> header using the Bearer scheme.</p>
            <div className="bg-gray-900 rounded-lg p-4 mt-3 overflow-x-auto">
              <pre className="text-green-400 font-mono text-xs m-0">
{`curl -X GET https://api.crmteamspace.com/v1/leads \\
  -H "Authorization: Bearer ${apiKey}"`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
