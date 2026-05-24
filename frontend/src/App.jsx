import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PredictionForm from './components/PredictionForm';
import BatchUpload from './components/BatchUpload';
import ModelComparison from './components/ModelComparison';
import FeatureImportance from './components/FeatureImportance';

export default function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        <Sidebar />
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
