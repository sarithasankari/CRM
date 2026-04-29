import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Contacts from './pages/Contacts';
import Deals from './pages/Deals';
import Emails from './pages/Emails';
import Quotes from './pages/Quotes';
import Support from './pages/Support';
import Marketing from './pages/Marketing';
import Analytics from './pages/Analytics';
import Workqueue from './pages/Workqueue';
import Accounts from './pages/Accounts';
import Tasks from './pages/Tasks';
import Calls from './pages/Calls';
import Meetings from './pages/Meetings';
import Products from './pages/Products';
import Invoices from './pages/Invoices';
import Cases from './pages/Cases';
import Solutions from './pages/Solutions';
import Apps from './pages/Apps';
import ApiConsole from './pages/ApiConsole';
import Services from './pages/Services';
import Projects from './pages/Projects';
import Feedback from './pages/Feedback';

function App() {
  return (
    <BrowserRouter>
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
          <Route path="tasks" element={<Tasks />} />
          <Route path="calls" element={<Calls />} />
          <Route path="meetings" element={<Meetings />} />

          {/* Phase 2 Modules */}
          <Route path="products" element={<Products />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="cases" element={<Cases />} />

          {/* Phase 3 Modules */}
          <Route path="solutions" element={<Solutions />} />
          <Route path="apps" element={<Apps />} />
          <Route path="api" element={<ApiConsole />} />
          <Route path="services" element={<Services />} />
          <Route path="projects" element={<Projects />} />
          <Route path="feedback" element={<Feedback />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
