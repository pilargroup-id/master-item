import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, FileSpreadsheet, PackageSearch, Eye, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

function BundleDetailModal({ item, onClose }) {
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    document.body.classList.add('modal-open');
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  useEffect(() => {
    axios.get(`/api/bundles/${item.id}`)
      .then(res => { if (res.data.success) setDetails(res.data.data.details || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [item.id]);

  const D = ({ label, value, full }) => (
    <div className={`detail-item${full ? ' full-width' : ''}`}>
      <span className="detail-item-label">{label}</span>
      <span className="detail-item-value">{value !== null && value !== undefined && value !== '' ? value : '-'}</span>
    </div>
  );

  return createPortal(
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth:700 }}>
        <div className="modal-header">
          <div className="d-flex align-items-center gap-3">
            <div className="modal-header-icon" style={{ background:'var(--warning-light)', border:'1px solid var(--warning-border)' }}>
              <PackageSearch size={18} color="var(--warning)" />
            </div>
            <div>
              <div className="modal-header-title">{item.bundle_name}</div>
              <div className="modal-header-sub">
                <span className="badge badge-warning">{item.bundle_sku}</span>
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          <div className="detail-grid" style={{ marginBottom:'1.25rem' }}>
            <span className="modal-section-label">Informasi Bundle</span>
            <D label="Bundle SKU"  value={item.bundle_sku} />
            <D label="Bundle Name" value={item.bundle_name} />
            <D label="Dibuat Oleh" value={item.created_by_div === 'product' ? 'Product Division' : 'GoTo Division'} />
            <D label="Total Qty"   value={item.total_qty} />
            {item.notes && (
              <>
                <span className="modal-section-label">Catatan</span>
                <D label="Notes" value={item.notes} full />
              </>
            )}
            <span className="modal-section-label">Waktu</span>
            <D label="Dibuat"        value={new Date(item.created_at).toLocaleString('id-ID')} />
            <D label="Terakhir Edit" value={item.updated_at ? new Date(item.updated_at).toLocaleString('id-ID') : '-'} />
          </div>

          {/* Composition */}
          <div style={{ borderRadius:'var(--radius-lg)', border:'1.5px solid var(--border)', overflow:'hidden' }}>
            <div style={{ padding:'0.75rem 1rem', background:'var(--bg-surface-2)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <PackageSearch size={14} color="var(--warning)" />
              <span style={{ fontSize:'0.72rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--warning)' }}>
                Komposisi Bundle
              </span>
            </div>
            {loading ? (
              <div style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)', fontSize:'0.875rem' }}>
                <span className="spinner" /> Memuat...
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Variant SKU</th>
                    <th>Model / Type</th>
                    <th style={{ textAlign:'right' }}>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((d, i) => (
                    <tr key={i}>
                      <td><span className="badge badge-success" style={{ fontFamily:'monospace', fontSize:'0.78rem' }}>{d.variant_sku}</span></td>
                      <td style={{ fontSize:'0.875rem' }}>{d.model_type || '-'}</td>
                      <td style={{ textAlign:'right', fontWeight:700, fontSize:'0.875rem' }}>{d.qty}</td>
                    </tr>
                  ))}
                  {details.length === 0 && (
                    <tr><td colSpan="3" style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>Tidak ada variant</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function BundleList() {
  const [bundles, setBundles]           = useState([]);
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(50);
  const [totalPages, setTotalPages]     = useState(1);
  const [totalItems, setTotalItems]     = useState(0);
  const [loading, setLoading]           = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const { isProductDivision } = useAuth();

  const fetchBundles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/bundles?search=${search}&page=${page}&limit=${pageSize}`);
      if (res.data.success) {
        setBundles(res.data.data);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotalItems(res.data.pagination.total || 0);
        }
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { setPage(1); }, [search, pageSize]);
  useEffect(() => {
    const t = setTimeout(() => fetchBundles(), 300);
    return () => clearTimeout(t);
  }, [search, page, pageSize]);

  const handleDelete = async (id, sku) => {
    if (!window.confirm(`Hapus Bundle ${sku}?`)) return;
    try {
      const res = await axios.delete(`/api/bundles/${id}`);
      if (res.data.success) { alert('Berhasil dihapus'); fetchBundles(); }
    } catch (err) { alert(err.response?.data?.message || 'Gagal menghapus'); }
  };

  return (
    <div className="animate-fade-in">
      {selectedItem && <BundleDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}

      <div className="page-header">
        <div className="page-header-left">
          <h1>Bundling Items</h1>
          <p>Paket komersial yang mengelompokkan beberapa variant produk</p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={() => window.open(`/api/search/export?type=bundle&format=excel&search=${search}`, '_blank')} className="btn btn-success">
            <FileSpreadsheet size={16} /> Export Excel
          </button>
          <Link to="/bundles/new" className="btn btn-primary">
            <Plus size={16} /> Buat Bundle
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding:'1.25rem' }}>
        <div className="d-flex gap-3 align-items-center mb-3" style={{ flexWrap:'wrap' }}>
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari SKU atau nama bundle..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginLeft:'auto' }}>
            {!loading && `${totalItems.toLocaleString('id-ID')} data`}
          </span>
        </div>

        <div className="table-container">
          {loading ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
              <span className="spinner" /> Memuat data...
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Bundle SKU</th>
                  <th>Bundle Name</th>
                  <th>Komposisi</th>
                  <th>Dibuat Oleh</th>
                  <th>Tanggal Dibuat</th>
                  <th style={{ textAlign:'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {bundles.map(item => (
                  <tr key={item.id}>
                    <td>
                      <span className="badge badge-warning" style={{ fontFamily:'monospace', fontSize:'0.78rem' }}>
                        {item.bundle_sku}
                      </span>
                    </td>
                    <td style={{ fontWeight:600 }}>{item.bundle_name}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.375rem', marginBottom:'0.2rem' }}>
                        <PackageSearch size={14} style={{ color:'var(--text-muted)', flexShrink:0 }} />
                        <span style={{ fontSize:'0.875rem' }}>{item.total_variants} Variant</span>
                      </div>
                      <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Total Qty: {item.total_qty}</div>
                    </td>
                    <td>
                      <span className={`badge ${item.created_by_div === 'product' ? 'badge-primary' : 'badge-warning'}`}>
                        {item.created_by_div === 'product' ? 'Product' : 'GoTo'}
                      </span>
                    </td>
                    <td style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td>
                      <div className="d-flex gap-2" style={{ justifyContent:'center' }}>
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="btn-icon"
                          title="Lihat Detail"
                          style={{ color:'var(--accent)', background:'var(--accent-light)', border:'1.5px solid var(--accent-border)' }}
                        >
                          <Eye size={15} />
                        </button>
                        {isProductDivision() && (
                          <button
                            onClick={() => handleDelete(item.id, item.bundle_sku)}
                            className="btn-icon"
                            title="Hapus"
                            style={{ color:'var(--danger)', background:'var(--danger-light)', border:'1.5px solid var(--danger-border)' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {bundles.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <PackageSearch size={36} style={{ opacity:0.2 }} />
                        <p>Tidak ada data bundle ditemukan</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {!loading && totalItems > 0 && (
          <div className="pagination-bar">
            <div className="d-flex align-items-center gap-3">
              <span className="page-info">
                Menampilkan <span>{bundles.length}</span> dari <span>{totalItems.toLocaleString('id-ID')}</span> data
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
              <button className="btn-page" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className="page-num">Hal {page} / {totalPages}</span>
              <button className="btn-page" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
