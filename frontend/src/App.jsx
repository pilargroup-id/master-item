import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

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

import TemplateSidebar from './components/template/Sidebar.jsx';
import TemplateHeader from './components/template/Header.jsx';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard', '/parents': 'Parent Items', '/variants': 'Variant Items',
  '/bundles': 'Bundling Items', '/master/pic-categories': 'Category PIC',
  '/master/item-types': 'Item Types', '/master/ports': 'Ports',
  '/master/uoms': 'UOMs', '/master/brands': 'Brands', '/master/pics': 'List PIC',
};
function getPageTitle(path) {
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];
  if (path.startsWith('/parents/')) return path.includes('/new') ? 'Tambah Parent' : 'Edit Parent';
  if (path.startsWith('/variants/')) return path.includes('/new') ? 'Tambah Variant' : 'Edit Variant';
  if (path.startsWith('/bundles/')) return path.includes('/new') ? 'Buat Bundle' : 'Edit Bundle';
  return 'SKU Generator';
}

const ProtectedRoute = ({ children, requireProductRole = false }) => {
  const { user, loading, isProductDivision, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#152848', flexDirection:'column', gap:'1rem', color:'rgba(255,255,255,0.5)', fontFamily:'Inter, sans-serif' }}>
      <span style={{ display:'inline-block', width:32, height:32, border:'3px solid rgba(255,255,255,0.1)', borderTopColor:'#22c55e', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize:'0.875rem' }}>Memuat...</span>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (requireProductRole && !isProductDivision()) return <Navigate to="/dashboard" />;

  const pageTitle = getPageTitle(location.pathname);
  const divisionLabel =
    user?.division === 'product'        ? 'Divisi Product'  :
    user?.division === 'goto_ecommerce' ? 'GoTo Ecommerce'  : 'Administrator';

  const handleAction = (action) => {
    if (action === 'logout') { logout(); navigate('/login'); }
  };

  return (
    <div className={`dashboard-shell${collapsed ? ' dashboard-shell--sidebar-collapsed' : ''}`}>
      <TemplateSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        activePath={location.pathname}
        userName={user?.name ?? ''}
        userRole={divisionLabel}
        onAction={handleAction}
        onToggleCollapse={() => setCollapsed(c => !c)}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="dashboard-stage">
        <TemplateHeader
          title="Master Item 22"
          breadcrumb={[
            { label: 'SKU Generator', href: '/dashboard' },
            { label: pageTitle, active: true },
          ]}
          showMenuButton={true}
          onMenuToggle={() => setMobileOpen(o => !o)}
        />
        <main className="dashboard-main">
          {children}
        </main>
      </div>
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
