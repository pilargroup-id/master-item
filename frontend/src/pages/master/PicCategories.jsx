import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Plus, Search, Edit, Trash2, Database, X, Save, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';


function PicModal({ item, onClose, onSave }) {
  const [formData, setFormData] = useState({
    detail_category:  '',
    sub_category:     '',
    main_category:    '',
    brand_category:   '',
    pic_name:         '',
    pic_change_name:  '',
  });
  const [saving, setSaving] = useState(false);
  const [picsList, setPicsList] = useState([]);
  const isEdit = !!item;

  useEffect(() => {
    // Load daftar PIC dari master
    axios.get('/api/master/pics').then(r => {
      if (r.data.success) setPicsList(r.data.data);
    }).catch(() => {});

    if (item) {
      setFormData({
        detail_category:  item.detail_category  || '',
        sub_category:     item.sub_category     || '',
        main_category:    item.main_category    || '',
        brand_category:   item.brand_category   || '',
        pic_name:         item.pic_name         || '',
        pic_change_name:  item.pic_change_name  || '',
      });
    } else {
      setFormData({ detail_category:'', sub_category:'', main_category:'', brand_category:'', pic_name:'', pic_change_name:'' });
    }
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    document.body.classList.add('modal-open');
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.classList.remove('modal-open');
    };
  }, [item, onClose]);

  const set = (field) => (e) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await axios.put(`/api/master/pic-categories/${item.id}`, formData);
      } else {
        await axios.post('/api/master/pic-categories', formData);
      }
      onSave();
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  const selectStyle = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--border)',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    appearance: 'auto',
  };

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box" style={{ width: '100%', maxWidth: '600px' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="d-flex align-items-center gap-3">
            <div className="modal-header-icon" style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-border)' }}>
              <Database size={18} color="var(--accent)" />
            </div>
            <div>
              <div className="modal-header-title">
                {isEdit ? 'Edit Category PIC' : 'Tambah Category PIC'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                {isEdit ? `Mengedit: ${item.detail_category}` : 'Tambah mapping kategori baru'}
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Body — scrollable */}
        <form
          onSubmit={handleSubmit}
          className="modal-body"
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {/* Detail Category */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Detail Category <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="text" required
              value={formData.detail_category}
              onChange={set('detail_category')}
              placeholder="Contoh: KITCHEN APPLIANCE & ACCESSORIES"
            />
          </div>

          {/* Sub & Main Category */}
          <div className="form-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Sub Category</label>
              <input type="text" value={formData.sub_category} onChange={set('sub_category')} placeholder="Contoh: ELECTRONIC" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Main Category</label>
              <input type="text" value={formData.main_category} onChange={set('main_category')} placeholder="Contoh: HOME LIVING" />
            </div>
          </div>

          {/* Brand Category */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Brand Category</label>
            <input type="text" value={formData.brand_category} onChange={set('brand_category')} placeholder="Contoh: PRIVATE BRAND" />
          </div>

          {/* PIC — dropdown dari List PIC */}
          <div style={{
            background: 'var(--bg-surface-2)',
            border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.125rem',
          }}>
            <div className="d-flex align-items-center gap-2" style={{ marginBottom: '0.75rem' }}>
              <User size={13} color="var(--accent)" />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Person In Charge
              </span>
            </div>
            <div className="form-grid">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>PIC</label>
                <select
                  value={formData.pic_name}
                  onChange={set('pic_name')}
                  style={selectStyle}
                >
                  <option value="">— Pilih PIC —</option>
                  {picsList.map(p => (
                    <option key={p.id} value={p.pic_name}>{p.pic_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>PIC Change</label>
                <select
                  value={formData.pic_change_name}
                  onChange={set('pic_change_name')}
                  style={selectStyle}
                >
                  <option value="">— Pilih PIC Change —</option>
                  {picsList.map(p => (
                    <option key={p.id} value={p.pic_name}>{p.pic_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div
            className="d-flex justify-content-end gap-3"
            style={{ paddingTop: '0.75rem', borderTop: '1.5px solid var(--border)', marginTop: 'auto' }}
          >
            <button type="button" className="btn btn-outline" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? <><span className="spinner" style={{ borderTopColor: '#fff', width: 14, height: 14 }} /> Menyimpan...</>
                : <><Save size={16} /> {isEdit ? 'Perbarui' : 'Simpan Data'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default function PicCategories() {
  const [data, setData]                 = useState([]);
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(50);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const { isProductDivision } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/master/pic-categories');
      if (res.data.success) setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus kategori "${name}"?`)) return;
    try {
      const res = await axios.delete(`/api/master/pic-categories/${id}`);
      if (res.data.success) { alert('Berhasil dihapus'); fetchData(); }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus');
    }
  };

  const openAdd    = () => { setSelectedItem(null); setShowModal(true); };
  const openEdit   = (item) => { setSelectedItem(item); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setSelectedItem(null); };
  const afterSave  = () => { closeModal(); fetchData(); };

  const filtered = data.filter(d =>
    (d.detail_category  || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.sub_category     || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.pic_name         || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.pic_change_name  || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="animate-fade-in">
      {showModal && (
        <PicModal item={selectedItem} onClose={closeModal} onSave={afterSave} />
      )}

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Register Category PIC</h1>
          <p>Master data pemetaan Kategori ke Person In Charge</p>
        </div>
        {isProductDivision() && (
          <button onClick={openAdd} className="btn btn-primary">
            <Plus size={16} /> Tambah Kategori
          </button>
        )}
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        {/* Toolbar */}
        <div className="d-flex gap-3 align-items-center mb-3" style={{ flexWrap: 'wrap' }}>
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari kategori, PIC..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {!loading && `${filtered.length} data`}
          </span>
        </div>

        {/* Table */}
        <div className="table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <span className="spinner" /> Memuat data...
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>#</th>
                  <th style={{ minWidth: 220 }}>Detail Category</th>
                  <th>Sub Category</th>
                  <th>Main Category</th>
                  <th>Brand Category</th>
                  <th style={{ minWidth: 130 }}>PIC</th>
                  <th style={{ minWidth: 130 }}>PIC Change</th>
                  {isProductDivision() && <th style={{ width: 100, textAlign: 'center' }}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {paginated.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.detail_category}</td>
                    <td style={{ fontSize: '0.85rem' }}>{item.sub_category   || '-'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{item.main_category  || '-'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{item.brand_category || '-'}</td>
                    <td>
                      {item.pic_name
                        ? <span className="badge badge-primary" style={{ fontSize: '0.78rem' }}>{item.pic_name}</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>-</span>}
                    </td>
                    <td>
                      {item.pic_change_name
                        ? <span className="badge badge-warning" style={{ fontSize: '0.78rem' }}>{item.pic_change_name}</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>-</span>}
                    </td>
                    {isProductDivision() && (
                      <td>
                        <div className="d-flex gap-2" style={{ justifyContent: 'center' }}>
                          <button
                            onClick={() => openEdit(item)}
                            className="btn-icon"
                            title="Edit"
                            style={{ color: 'var(--warning)', background: 'var(--warning-light)', border: '1.5px solid var(--warning-border)' }}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.detail_category)}
                            className="btn-icon"
                            title="Hapus"
                            style={{ color: 'var(--danger)', background: 'var(--danger-light)', border: '1.5px solid var(--danger-border)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={isProductDivision() ? 8 : 7}>
                      <div className="empty-state">
                        <Database size={36} style={{ opacity: 0.2 }} />
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
        {!loading && filtered.length > 0 && (
          <div className="pagination-bar">
            <div className="d-flex align-items-center gap-3">
              <span className="page-info">
                Menampilkan <span>{Math.min((page - 1) * pageSize + 1, filtered.length)}</span>–<span>{Math.min(page * pageSize, filtered.length)}</span> dari <span>{filtered.length}</span> data
              </span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
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
