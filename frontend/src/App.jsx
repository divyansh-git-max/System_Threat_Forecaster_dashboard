import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PredictionForm from './components/PredictionForm';
import BatchUpload from './components/BatchUpload';
import ModelComparison from './components/ModelComparison';
import FeatureImportance from './components/FeatureImportance';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className={`layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <button
          type="button"
          className="mobile-menu-button"
          aria-label="Open navigation"
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={20} />
        </button>
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
        <Sidebar onNavigate={() => setSidebarOpen(false)} onClose={() => setSidebarOpen(false)} />
        <Routes>
          <Route path="/"         element={<Dashboard />} />
          <Route path="/predict"  element={<PredictionForm />} />
          <Route path="/batch"    element={<BatchUpload />} />
          <Route path="/models"   element={<ModelComparison />} />
          <Route path="/features" element={<FeatureImportance />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
