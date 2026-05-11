import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { Loader2 } from 'lucide-react';

// Lazy load all pages for better performance and smaller chunks
const Dashboard      = lazy(() => import('./pages/Dashboard'));
const Leads          = lazy(() => import('./pages/Leads'));
const Contacts       = lazy(() => import('./pages/Contacts'));
const Deals          = lazy(() => import('./pages/Deals'));
const Emails         = lazy(() => import('./pages/Emails'));
const Quotes         = lazy(() => import('./pages/Quotes'));
const Support        = lazy(() => import('./pages/Support'));
const Marketing      = lazy(() => import('./pages/Marketing'));
const Analytics      = lazy(() => import('./pages/Analytics'));
const Workqueue      = lazy(() => import('./pages/Workqueue'));
const Accounts       = lazy(() => import('./pages/Accounts'));
const Tasks          = lazy(() => import('./pages/Tasks'));
const Calls          = lazy(() => import('./pages/Calls'));
const Meetings       = lazy(() => import('./pages/Meetings'));
const Workflows      = lazy(() => import('./pages/Workflows'));
const Products       = lazy(() => import('./pages/Products'));
const Profile        = lazy(() => import('./pages/Profile'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const Users          = lazy(() => import('./pages/Users'));
const Invoices       = lazy(() => import('./pages/Invoices'));
const Cases          = lazy(() => import('./pages/Cases'));
const Solutions      = lazy(() => import('./pages/Solutions'));
const Apps           = lazy(() => import('./pages/Apps'));
const ApiConsole     = lazy(() => import('./pages/ApiConsole'));
const Services       = lazy(() => import('./pages/Services'));
const Projects       = lazy(() => import('./pages/Projects'));
const ProjectDetail  = lazy(() => import('./pages/ProjectDetail'));
const Feedback       = lazy(() => import('./pages/Feedback'));
const Login          = lazy(() => import('./pages/Login'));

const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-slate-50/50">
    <div className="flex flex-col items-center">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">Initializing Module...</p>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="deals" element={<Deals />} />
            <Route path="emails" element={<Emails />} />
            <Route path="quotes" element={<Quotes />} />
            <Route path="support" element={<Support />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="workqueue" element={<Workqueue />} />
            
            {/* Phase 1 Modules */}
            <Route path="accounts" element={<Accounts />} />
            <Route path="profile" element={<Profile />} />
            <Route path="account" element={<AccountSettings />} />
            <Route path="users" element={<Users />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="calls" element={<Calls />} />
            <Route path="meetings" element={<Meetings />} />
            <Route path="workflows" element={<Workflows />} />

            {/* Phase 2 Modules */}
            <Route path="products" element={<Products />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="cases" element={<Cases />} />

            {/* Phase 3 Modules */}
            <Route path="solutions" element={<Solutions />} />
            <Route path="apps" element={<Apps />} />
            <Route path="api-console" element={<ApiConsole />} />
            <Route path="services" element={<Services />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="feedback" element={<Feedback />} />
          </Route>
          <Route path="/login" element={<Login />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
