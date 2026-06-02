import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Edit, Eye, X, FolderTree } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function ParentDetailModal({ item, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    document.body.classList.add('modal-open');
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  const D = ({ label, value, full }) => (
    <div className={`detail-item${full ? ' full-width' : ''}`}>
      <span className="detail-item-label">{label}</span>
      <span className="detail-item-value">{value ?? '-'}</span>
    </div>
  );

  return createPortal(
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="d-flex align-items-center gap-3">
            <div className="modal-header-icon" style={{ background: 'var(--accent-light)', border:'1px solid var(--accent-border)' }}>
              <FolderTree size={18} color="var(--accent)" />
            </div>
            <div>
              <div className="modal-header-title">{item.base_name}</div>
              <div className="modal-header-sub">
                <span className="badge badge-primary">{item.parent_sku}</span>
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          <div className="detail-grid">
            <span className="modal-section-label">Identitas</span>
            <D label="Parent SKU" value={item.parent_sku} />
            <D label="Base Name"  value={item.base_name} full />

            <span className="modal-section-label">Brand & Produk</span>
            <D label="Brand"         value={item.linked_brand_name || item.brand_name} />
            <D label="Sub Brand"     value={item.sub_brand} />
            <D label="Item Name"     value={item.item_name} />
            <D label="Business Unit" value={item.business_unit} />

            <span className="modal-section-label">Klasifikasi</span>
            <D label="Detail Category" value={item.linked_category || item.category_name} />
            <D label="Item Type"       value={item.linked_item_type} />
            <D label="Port"            value={item.linked_port} />
            <D label="Total Variants"  value={item.variant_count} />

            {item.description && (
              <>
                <span className="modal-section-label">Keterangan</span>
                <D label="Deskripsi" value={item.description} full />
              </>
            )}

            <span className="modal-section-label">Waktu</span>
            <D label="Dibuat"        value={new Date(item.created_at).toLocaleString('id-ID')} />
            <D label="Terakhir Edit" value={item.updated_at ? new Date(item.updated_at).toLocaleString('id-ID') : '-'} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ParentList() {
  const [parents, setParents] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const { isProductDivision } = useAuth();

  const fetchParents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/parents?search=${search}&page=${page}&limit=${pageSize}`);
      if (res.data.success) {
        setParents(res.data.data);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalItems(res.data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [search, pageSize]);
  useEffect(() => {
    const timer = setTimeout(() => fetchParents(), 300);
    return () => clearTimeout(timer);
  }, [search, page, pageSize]);

  const handleDelete = async (id, sku) => {
    if (!window.confirm(`Hapus Parent Item ${sku}?`)) return;
    try {
      const res = await axios.delete(`/api/parents/${id}`);
      if (res.data.success) { alert('Berhasil dihapus'); fetchParents(); }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus item');
    }
  };

  return (
    <div className="animate-fade-in">
      {selectedItem && <ParentDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Parent Items</h1>
          <p>Database master item konseptual produk</p>
        </div>
        {isProductDivision() && (
          <Link to="/parents/new" className="btn btn-primary">
            <Plus size={16} /> Tambah Parent
          </Link>
        )}
      </div>

      {/* Card */}
      <div className="card" style={{ padding:'1.25rem' }}>
        {/* Search */}
        <div className="d-flex gap-3 align-items-center mb-3" style={{ flexWrap:'wrap' }}>
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari SKU, nama, brand..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginLeft:'auto' }}>
            {!loading && `${totalItems.toLocaleString('id-ID')} data`}
          </span>
        </div>

        {/* Table */}
        <div className="table-container">
          {loading ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
              <span className="spinner" /> Memuat data...
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Parent ID</th>
                  <th>Brand</th>
                  <th>Sub Brand</th>
                  <th>Item Name</th>
                  <th>Detail Category</th>
                  <th>PIC</th>
                  <th>Item Type</th>
                  <th>Port</th>
                  <th>Parent Name</th>
                  <th>Business Unit</th>
                  <th style={{ textAlign:'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {parents.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontSize:'0.78rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                      {new Date(item.created_at).toLocaleString('id-ID', {
                        year:'numeric', month:'2-digit', day:'2-digit',
                        hour:'2-digit', minute:'2-digit'
                      })}
                    </td>
                    <td>
                      <span className="badge badge-primary" style={{ fontSize:'0.78rem', fontFamily:'monospace' }}>
                        {item.parent_sku}
                      </span>
                    </td>
                    <td style={{ fontWeight:500 }}>{item.linked_brand_name || item.brand_name || '-'}</td>
                    <td>{item.sub_brand || '-'}</td>
                    <td>{item.item_name || '-'}</td>
                    <td>{item.linked_category || item.category_name || '-'}</td>
                    <td style={{ fontWeight:600, color:'var(--warning)' }}>{item.pic || '-'}</td>
                    <td>{item.linked_item_type || '-'}</td>
                    <td>{item.linked_port || '-'}</td>
                    <td style={{ fontWeight:600, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {item.base_name || '-'}
                    </td>
                    <td>
                      {item.business_unit
                        ? <span className="badge badge-default">{item.business_unit}</span>
                        : '-'}
                    </td>
                    <td>
                      <div className="d-flex gap-2" style={{ justifyContent:'center' }}>
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="btn-icon btn-info"
                          title="Lihat Detail"
                          style={{ border:'1.5px solid var(--accent-border)', color:'var(--accent)', background:'var(--accent-light)' }}
                        >
                          <Eye size={15} />
                        </button>
                        {isProductDivision() && (
                          <>
                            <Link
                              to={`/parents/edit/${item.id}`}
                              className="btn-icon"
                              title="Edit"
                              style={{ color:'var(--warning)', background:'var(--warning-light)', border:'1.5px solid var(--warning-border)', display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:'var(--radius-md)', textDecoration:'none' }}
                            >
                              <Edit size={15} />
                            </Link>
                            <button
                              onClick={() => handleDelete(item.id, item.parent_sku)}
                              className="btn-icon"
                              title="Hapus"
                              style={{ color:'var(--danger)', background:'var(--danger-light)', border:'1.5px solid var(--danger-border)' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {parents.length === 0 && (
                  <tr>
                    <td colSpan={12}>
                      <div className="empty-state">
                        <FolderTree size={36} style={{ opacity:0.25 }} />
                        <p>Tidak ada data ditemukan</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalItems > 0 && (
          <div className="pagination-bar">
            <div className="d-flex align-items-center gap-3">
              <span className="page-info">
                Menampilkan <span>{parents.length}</span> dari <span>{totalItems.toLocaleString('id-ID')}</span> data
              </span>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.8rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                <option value={10}>10 Baris</option>
                <option value={25}>25 Baris</option>
                <option value={50}>50 Baris</option>
                <option value={100}>100 Baris</option>
              </select>
            </div>
            <div className="page-controls">
              <button
                className="btn-page"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >← Prev</button>
              <span className="page-num">Hal {page} / {totalPages}</span>
              <button
                className="btn-page"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
