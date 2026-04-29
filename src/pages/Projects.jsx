import React, { useState } from 'react';
import { FolderKanban, Plus, CheckSquare, Clock, Users, Search, X } from 'lucide-react';

const initialProjects = [
  { id: 1, name: 'Website Redesign', client: 'Acme Corp', status: 'Ongoing', progress: 65, team: ['Sarah', 'John'], tasks: 12, completed: 8 },
  { id: 2, name: 'Cloud Migration', client: 'TechNova', status: 'Ongoing', progress: 30, team: ['Jason', 'Emma'], tasks: 20, completed: 6 },
  { id: 3, name: 'Security Audit', client: 'Global Tech Inc.', status: 'Completed', progress: 100, team: ['Sarah'], tasks: 5, completed: 5 },
];

export default function Projects() {
  const [projects, setProjects] = useState(initialProjects);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', client: '', team: '' });

  const handleAddProject = (e) => {
    e.preventDefault();
    const newProject = { 
      id: Date.now(), 
      ...formData,
      status: 'Ongoing',
      progress: 0,
      team: formData.team.split(',').map(p => p.trim()),
      tasks: 0,
      completed: 0
    };
    setProjects([newProject, ...projects]);
    setIsModalOpen(false);
    setFormData({ name: '', client: '', team: '' });
  };

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-10">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Projects</h2>
          <p className="mt-1 text-sm text-gray-500">Track internal and client project lifecycles.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            New Project
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
        <div className="mb-6 relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search projects..."
            className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm bg-gray-50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${project.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{project.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{project.client}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-gray-500">Progress</span>
                  <span className={project.progress === 100 ? 'text-green-600' : 'text-blue-600'}>{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${project.progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${project.progress}%` }}></div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center text-xs text-gray-500 font-medium">
                  <CheckSquare className="w-4 h-4 mr-1 text-gray-400" />
                  {project.completed}/{project.tasks} Tasks
                </div>
                <div className="flex -space-x-2">
                  {project.team.map((member, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-blue-100 border border-white flex items-center justify-center text-[10px] font-bold text-blue-700 uppercase" title={member}>
                      {member.charAt(0)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Create Project</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddProject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="E.g., App Development" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client / Account</label>
                <input type="text" value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Internal or Client Name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Members (comma separated)</label>
                <input type="text" value={formData.team} onChange={e => setFormData({...formData, team: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="John, Jane" />
              </div>

              <div className="pt-4 mt-6 border-t border-gray-100 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none shadow-sm">Save Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
