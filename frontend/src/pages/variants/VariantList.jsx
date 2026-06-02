import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Edit, FileSpreadsheet, Eye, X, Box, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_COLORS = {
  'ACTIVE':           'badge-success',
  'NON ACTIVE':       'badge-danger',
  'DISCONTINUE':      'badge-danger',
  'HOLD DEVELOPMENT': 'badge-warning',
  'NEW DEVELOPMENT':  'badge-info',
  'FINANCE':          'badge-primary',
};

function VariantDetailModal({ item, onClose }) {
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
      <span className="detail-item-value">{value !== null && value !== undefined && value !== '' ? value : '-'}</span>
    </div>
  );

  return createPortal(
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box variant-detail-modal">
        <div className="modal-header">
          <div className="d-flex align-items-center gap-3">
            <div className="modal-header-icon" style={{ background: 'var(--success-light)', border: '1px solid var(--success-border)' }}>
              <Box size={18} color="var(--success)" />
            </div>
            <div>
              <div className="modal-header-title">{item.parent_name}</div>
              <div className="modal-header-sub">
                <span className="badge badge-success">{item.variant_sku}</span>
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          <div className="detail-grid">
            <span className="modal-section-label">Identitas</span>
            <D label="Variant SKU"  value={item.variant_sku} />
            <D label="Parent SKU"   value={item.parent_sku} />
            <D label="Parent Name"  value={item.parent_name} full />
            <D label="Model / Type" value={item.model_type} full />

            <span className="modal-section-label">Varian</span>
            <D label="Color / Size" value={item.color_size} />
            <D label="Size / Color" value={item.size_color} />

            <span className="modal-section-label">Logistik</span>
            <D label="Unit (UoM)"    value={item.unit} />
            <D label="Qty per Pack"  value={item.qty_pack} />
            <D label="Net Weight"    value={item.weight_gr ? `${item.weight_gr} g` : null} />
            <D label="Gross Weight"  value={item.gross_weight_gr ? `${item.gross_weight_gr} g` : null} />
            <D
              label="Dimensi (P×L×T cm)"
              value={item.dimension_l || item.dimension_w || item.dimension_h
                ? `${item.dimension_l || '?'} × ${item.dimension_w || '?'} × ${item.height_cm || '?'}`
                : null}
              full
            />

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
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function VariantList() {
  const [variants, setVariants]         = useState([]);
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(50);
  const [totalPages, setTotalPages]     = useState(1);
  const [totalItems, setTotalItems]     = useState(0);
  const [loading, setLoading]           = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  const [isSelecting, setIsSelecting]   = useState(false);
  const [selectedIds, setSelectedIds]   = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const statusOptions = ['ACTIVE', 'NON ACTIVE', 'DISCONTINUE', 'HOLD DEVELOPMENT', 'NEW DEVELOPMENT', 'FINANCE'];
  const [selectedChannel, setSelectedChannel] = useState('');
  const channelOptions = ['B2B', 'ECOM', 'FACTORY', 'GT', 'STORE'];

  const { isProductDivision } = useAuth();

  const fetchVariants = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/variants?search=${search}&page=${page}&limit=${pageSize}`);
      if (res.data.success) {
        setVariants(res.data.data);
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
    const t = setTimeout(() => fetchVariants(), 300);
    return () => clearTimeout(t);
  }, [search, page, pageSize]);

  const handleDelete = async (id, sku) => {
    if (!window.confirm(`Hapus Variant ${sku}?`)) return;
    try {
      const res = await axios.delete(`/api/variants/${id}`);
      if (res.data.success) { alert('Berhasil dihapus'); fetchVariants(); }
    } catch (err) { alert(err.response?.data?.message || 'Gagal menghapus'); }
  };

  const handleExport = () => {
    window.open(`/api/search/export?type=variant&format=excel&search=${search}`, '_blank');
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === variants.length) setSelectedIds([]);
    else setSelectedIds(variants.map(v => v.id));
  };
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleBulkUpdateStatus = async () => {
    if (!selectedIds.length) return alert('Pilih minimal 1 item.');
    if (!selectedStatus) return alert('Pilih status tujuan.');
    try {
      const res = await axios.put('/api/variants/bulk-status/update', { ids: selectedIds, status: selectedStatus });
      if (res.data.success) {
        alert(res.data.message);
        setIsSelecting(false); setSelectedIds([]); setSelectedStatus('');
        fetchVariants();
      }
    } catch (err) { alert(err.response?.data?.message || 'Gagal update status'); }
  };

  const handleBulkUpdateChannel = async () => {
    if (!selectedIds.length) return alert('Pilih minimal 1 item.');
    if (!selectedChannel) return alert('Pilih channel tujuan.');
    try {
      const channelValue = selectedChannel === 'KOSONG' ? '' : selectedChannel;
      const res = await axios.put('/api/variants/bulk-channel/update', { ids: selectedIds, channel: channelValue });
      if (res.data.success) {
        alert(res.data.message);
        setIsSelecting(false); setSelectedIds([]); setSelectedChannel('');
        fetchVariants();
      }
    } catch (err) { alert(err.response?.data?.message || 'Gagal update channel'); }
  };


  return (
    <div className="animate-fade-in">
      {selectedItem && <VariantDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Variant Items</h1>
          <p>Produk fisik dengan stok, dimensi, dan data logistik</p>
        </div>
        <div className="d-flex gap-2" style={{ flexWrap:'wrap' }}>
          {isProductDivision() && (
            <button
              onClick={() => { setIsSelecting(!isSelecting); setSelectedIds([]); setSelectedStatus(''); setSelectedChannel(''); }}
              className={`btn ${isSelecting ? 'btn-outline' : 'btn-warning'}`}
            >
              {isSelecting ? 'Batal Pilih' : 'Ubah Multi (Status/Channel)'}
            </button>
          )}
          <button onClick={handleExport} className="btn btn-success">
            <FileSpreadsheet size={16} /> Export Excel
          </button>
          {isProductDivision() && (
            <Link to="/variants/new" className="btn btn-primary">
              <Plus size={16} /> Tambah Variant
            </Link>
          )}
        </div>
      </div>

      <div className="card" style={{ padding:'1.25rem' }}>
        {/* Toolbar */}
        <div className="d-flex gap-3 align-items-center mb-3" style={{ flexWrap:'wrap' }}>
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari SKU, parent, model..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              disabled={isSelecting}
            />
          </div>

          {isSelecting && (
            <div className="d-flex gap-2 align-items-center" style={{
              marginLeft:'auto', padding:'0.5rem 1rem',
              background:'var(--accent-light)', border:'1.5px solid var(--accent-border)',
              borderRadius:'var(--radius-lg)', flexWrap:'wrap', gap:'0.625rem',
            }}>
              <span style={{ fontSize:'0.82rem', color:'var(--accent)', fontWeight:600 }}>
                {selectedIds.length} dipilih
              </span>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                style={{ padding:'0.38rem 0.75rem', fontSize:'0.82rem', borderRadius:'var(--radius-md)', border:'1.5px solid var(--border)', background:'var(--bg-surface)', color:'var(--text-primary)', fontFamily:'inherit' }}
              >
                <option value="">-- Pilih Status --</option>
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button
                className="btn btn-primary"
                style={{ padding:'0.38rem 1rem', fontSize:'0.82rem' }}
                onClick={handleBulkUpdateStatus}
                disabled={!selectedIds.length || !selectedStatus}
              >
                Set Status
              </button>

              <div style={{width: '1px', height: '24px', background: 'var(--accent-border)', margin: '0 0.5rem'}}></div>

              <select
                value={selectedChannel}
                onChange={e => setSelectedChannel(e.target.value)}
                style={{ padding:'0.38rem 0.75rem', fontSize:'0.82rem', borderRadius:'var(--radius-md)', border:'1.5px solid var(--border)', background:'var(--bg-surface)', color:'var(--text-primary)', fontFamily:'inherit' }}
              >
                <option value="">-- Pilih Channel --</option>
                <option value="KOSONG">Kosongkan Channel</option>
                {channelOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                className="btn btn-primary"
                style={{ padding:'0.38rem 1rem', fontSize:'0.82rem' }}
                onClick={handleBulkUpdateChannel}
                disabled={!selectedIds.length || !selectedChannel}
              >
                Set Channel
              </button>
            </div>
          )}

          {!isSelecting && (
            <span style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginLeft:'auto' }}>
              {!loading && `${totalItems.toLocaleString('id-ID')} data`}
            </span>
          )}
        </div>

        {/* Table */}
        <div className="table-container">
          {loading ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
              <span className="spinner" /> Memuat data...
            </div>
          ) : (
            <table style={{ minWidth:'1440px' }}>
              <thead>
                <tr>
                  {isSelecting && (
                    <th style={{ width:44, textAlign:'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.length === variants.length && variants.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                  )}
                  <th style={{ width:140 }}>Timestamp</th>
                  <th style={{ minWidth:120 }}>Item ID</th>
                  <th style={{ minWidth:250 }}>Item Name</th>
                  <th style={{ width:70, textAlign:'center' }}>UOM</th>
                  <th style={{ minWidth:140 }}>Parent Name</th>
                  <th style={{ minWidth:120 }}>Variant</th>
                  <th style={{ width:115, textAlign:'center' }}>Parent ID</th>
                  <th style={{ width:80, textAlign:'center' }}>Qty/Pack</th>
                  <th style={{ width:65, textAlign:'center' }}>H</th>
                  <th style={{ width:65, textAlign:'center' }}>W</th>
                  <th style={{ width:65, textAlign:'center' }}>D</th>
                  <th style={{ width:85, textAlign:'center' }}>GW Pack</th>
                  <th style={{ width:130, textAlign:'center' }}>Status</th>
                  <th style={{ width:110, textAlign:'center' }}>Bisnis Unit</th>
                  <th style={{ width:100, textAlign:'center' }}>Channel</th>
                  <th style={{ width:140, textAlign:'center' }}>Brand Category</th>
                  <th style={{ width:120, textAlign:'center' }}>PIC</th>
                  {!isSelecting && <th style={{ width:100, textAlign:'center' }}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {variants.map(item => (
                  <tr key={item.id} style={{ background: selectedIds.includes(item.id) ? 'var(--accent-light)' : undefined }}>
                    {isSelecting && (
                      <td style={{ textAlign:'center' }}>
                        <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                      </td>
                    )}
                    <td style={{ fontSize:'0.75rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                      {new Date(item.created_at).toLocaleString('id-ID', {
                        year:'numeric', month:'2-digit', day:'2-digit',
                        hour:'2-digit', minute:'2-digit',
                      })}
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontFamily:'monospace', fontSize:'0.75rem' }}>
                        {item.variant_sku}
                      </span>
                    </td>
                    <td style={{ fontWeight:500, whiteSpace:'nowrap' }}>
                      {[item.parent_name, item.model_type, item.color_size, item.size_color].filter(Boolean).join(' ') || '-'}
                    </td>
                    <td style={{ textAlign:'center', fontSize:'0.85rem' }}>{item.unit || '-'}</td>
                    <td style={{ whiteSpace:'nowrap' }}>{item.parent_name || '-'}</td>
                    <td>
                      {item.model_type || item.color_size || item.size_color ? (
                        <div style={{ fontSize:'0.82rem', lineHeight:1.5 }}>
                          {item.model_type && <div style={{ fontWeight:500 }}>{item.model_type}</div>}
                          {item.color_size && <div style={{ color:'var(--text-muted)' }}>{item.color_size}</div>}
                          {item.size_color && <div style={{ color:'var(--text-muted)' }}>{item.size_color}</div>}
                        </div>
                      ) : '-'}
                    </td>
                    <td style={{ textAlign:'center' }}>
                      <span className="badge badge-primary" style={{ fontFamily:'monospace', fontSize:'0.72rem' }}>
                        {item.parent_sku || '-'}
                      </span>
                    </td>
                    <td style={{ textAlign:'center', fontSize:'0.85rem' }}>{item.qty_pack ?? '-'}</td>
                    <td style={{ textAlign:'center', fontSize:'0.85rem' }}>{item.height_cm ?? '-'}</td>
                    <td style={{ textAlign:'center', fontSize:'0.85rem' }}>{item.dimension_w ?? '-'}</td>
                    <td style={{ textAlign:'center', fontSize:'0.85rem' }}>{item.dimension_l ?? '-'}</td>
                    <td style={{ textAlign:'center', fontSize:'0.85rem' }}>{item.gross_weight_gr ?? '-'}</td>
                    <td style={{ textAlign:'center' }}>
                      {item.status
                        ? <span className={`badge ${STATUS_COLORS[item.status] || 'badge-default'}`} style={{ fontSize:'0.72rem' }}>{item.status}</span>
                        : '-'}
                    </td>
                    <td style={{ textAlign:'center', fontSize:'0.82rem' }}>{item.business_unit || '-'}</td>
                    <td style={{ textAlign:'center', fontSize:'0.82rem' }}>{item.channel || '-'}</td>
                    <td style={{ textAlign:'center', fontSize:'0.82rem' }}>{item.brand_category || '-'}</td>
                    <td style={{ textAlign:'center', fontSize:'0.82rem', fontWeight:600 }}>{item.pic || '-'}</td>
                    {!isSelecting && (
                      <td>
                        <div className="d-flex gap-2" style={{ justifyContent:'center' }}>
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="btn-icon"
                            title="Lihat Detail"
                            style={{ color:'var(--accent)', background:'var(--accent-light)', border:'1.5px solid var(--accent-border)' }}
                          >
                            <Eye size={14} />
                          </button>
                          {isProductDivision() && (
                            <>
                              <Link
                                to={`/variants/edit/${item.id}`}
                                title="Edit"
                                style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:'var(--radius-md)', color:'var(--warning)', background:'var(--warning-light)', border:'1.5px solid var(--warning-border)', textDecoration:'none', flexShrink:0 }}
                              >
                                <Edit size={14} />
                              </Link>
                              <button
                                onClick={() => handleDelete(item.id, item.variant_sku)}
                                className="btn-icon"
                                title="Hapus"
                                style={{ color:'var(--danger)', background:'var(--danger-light)', border:'1.5px solid var(--danger-border)' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {variants.length === 0 && (
                  <tr>
                    <td colSpan={isSelecting ? 18 : 18}>
                      <div className="empty-state">
                        <Box size={36} style={{ opacity:0.2 }} />
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
                Menampilkan <span>{variants.length}</span> dari <span>{totalItems.toLocaleString('id-ID')}</span> data
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
