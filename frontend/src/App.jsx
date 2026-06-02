import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Pages (will be created soon)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ParentList from './pages/parents/ParentList';
import ParentForm from './pages/parents/ParentForm';
import VariantList from './pages/variants/VariantList';
import VariantForm from './pages/variants/VariantForm';
import BundleList from './pages/bundles/BundleList';
import BundleComposer from './pages/bundles/BundleComposer';
import PicCategories from './pages/master/PicCategories';
import ItemTypes from './pages/master/ItemTypes';
import Ports from './pages/master/Ports';
import Uoms from './pages/master/Uoms';
import Brands from './pages/master/Brands';
import Pics from './pages/master/Pics';

// Components
import Sidebar from './components/Sidebar';

const ProtectedRoute = ({ children, requireProductRole = false }) => {
  const { user, loading, isProductDivision } = useAuth();
  
  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'var(--bg-body)', flexDirection:'column', gap:'1rem', color:'var(--text-muted)', fontFamily:'Inter, sans-serif' }}>
      <span style={{ display:'inline-block', width:32, height:32, border:'3px solid #E2E8F0', borderTopColor:'#6366F1', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize:'0.875rem' }}>Memuat...</span>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (requireProductRole && !isProductDivision()) return <Navigate to="/dashboard" />;
  
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        
        {/* Parents */}
        <Route path="/parents" element={<ProtectedRoute><ParentList /></ProtectedRoute>} />
        <Route path="/parents/new" element={<ProtectedRoute requireProductRole><ParentForm /></ProtectedRoute>} />
        <Route path="/parents/edit/:id" element={<ProtectedRoute requireProductRole><ParentForm /></ProtectedRoute>} />
        
        {/* Variants */}
        <Route path="/variants" element={<ProtectedRoute><VariantList /></ProtectedRoute>} />
        <Route path="/variants/new" element={<ProtectedRoute requireProductRole><VariantForm /></ProtectedRoute>} />
        <Route path="/variants/edit/:id" element={<ProtectedRoute requireProductRole><VariantForm /></ProtectedRoute>} />
        
        {/* Bundles */}
        <Route path="/bundles" element={<ProtectedRoute><BundleList /></ProtectedRoute>} />
        <Route path="/bundles/new" element={<ProtectedRoute><BundleComposer /></ProtectedRoute>} />
        <Route path="/bundles/edit/:id" element={<ProtectedRoute requireProductRole={true}><BundleComposer /></ProtectedRoute>} />

        {/* Master Data */}
        <Route path="/master/pic-categories" element={<ProtectedRoute><PicCategories /></ProtectedRoute>} />
        <Route path="/master/item-types" element={<ProtectedRoute><ItemTypes /></ProtectedRoute>} />
        <Route path="/master/ports" element={<ProtectedRoute><Ports /></ProtectedRoute>} />
        <Route path="/master/uoms" element={<ProtectedRoute><Uoms /></ProtectedRoute>} />
        <Route path="/master/brands" element={<ProtectedRoute><Brands /></ProtectedRoute>} />
        <Route path="/master/pics" element={<ProtectedRoute><Pics /></ProtectedRoute>} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
