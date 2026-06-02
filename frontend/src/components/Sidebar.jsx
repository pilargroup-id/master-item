import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  FolderTree, 
  Box, 
  PackageSearch,
  LogOut,
  Boxes,
  Users,
  ChevronRight,
  Tag,
  Anchor,
  Scale,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout, isProductDivision } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `sidebar-link ${isActive ? 'active' : ''}`;

  const divisionLabel =
    user?.division === 'product'       ? 'Divisi Product' :
    user?.division === 'goto_ecommerce'? 'GoTo Ecommerce' :
                                         'Administrator';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Boxes size={20} color="#fff" />
        </div>
        <div>
          <div className="sidebar-brand-name">SKU Generator</div>
          <div className="sidebar-brand-tagline">Pilar Group</div>
        </div>
      </div>

      {/* User info */}
      <div className="sidebar-user">
        <div className="sidebar-user-label">Logged in as</div>
        <div className="sidebar-user-name">{user?.name}</div>
        <div style={{ marginTop: '0.4rem' }}>
          <span className={`badge ${isProductDivision() ? 'badge-primary' : 'badge-warning'}`}>
            {divisionLabel}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={navLinkClass}>
          <LayoutDashboard size={17} className="sidebar-link-icon" />
          Dashboard
        </NavLink>

        <div className="sidebar-section-label">Item Management</div>

        <NavLink to="/parents" className={navLinkClass}>
          <FolderTree size={17} className="sidebar-link-icon" />
          Parent Items
        </NavLink>

        <NavLink to="/variants" className={navLinkClass}>
          <Box size={17} className="sidebar-link-icon" />
          Variant Items
        </NavLink>

        <NavLink to="/bundles" className={navLinkClass}>
          <PackageSearch size={17} className="sidebar-link-icon" />
          Bundling Items
        </NavLink>

        <div className="sidebar-section-label">Master Data</div>

        <NavLink to="/master/pic-categories" className={navLinkClass}>
          <Users size={17} className="sidebar-link-icon" />
          Category PIC
        </NavLink>
        <NavLink to="/master/item-types" className={navLinkClass}>
          <Tag size={17} className="sidebar-link-icon" />
          Item Types
        </NavLink>
        <NavLink to="/master/ports" className={navLinkClass}>
          <Anchor size={17} className="sidebar-link-icon" />
          Ports
        </NavLink>
        <NavLink to="/master/uoms" className={navLinkClass}>
          <Scale size={17} className="sidebar-link-icon" />
          UOMs
        </NavLink>
        <NavLink to="/master/brands" className={navLinkClass}>
          <ShieldCheck size={17} className="sidebar-link-icon" />
          Brands
        </NavLink>
        <NavLink to="/master/pics" className={navLinkClass}>
          <UserCheck size={17} className="sidebar-link-icon" />
          List PIC
        </NavLink>
      </nav>

      {/* Footer / Logout */}
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-logout">
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </aside>
  );
}
