import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Search, Plus, Trash2, Package, PackageSearch } from 'lucide-react';

export default function BundleComposer() {
  const navigate = useNavigate();
  const [formData, setFormData]             = useState({ bundle_name: '', description: '' });
  const [searchVariant, setSearchVariant]   = useState('');
  const [variantResults, setVariantResults] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [previewSKU, setPreviewSKU]         = useState('68YY--------');
  const [submitting, setSubmitting]         = useState(false);

  useEffect(() => {
    axios.get('/api/variants/preview-sku').then(res => {
      if (res.data.success) setPreviewSKU(res.data.data.sku);
    });
  }, []);

  useEffect(() => {
    if (searchVariant.length > 1) {
      const t = setTimeout(() => {
        axios.get(`/api/variants?search=${searchVariant}&limit=5`).then(res => {
          if (res.data.success) setVariantResults(res.data.data);
        });
      }, 300);
      return () => clearTimeout(t);
    } else {
      setVariantResults([]);
    }
  }, [searchVariant]);

  const handleAddVariant = (variant) => {
    if (selectedVariants.find(v => v.variant.id === variant.id)) return;
    setSelectedVariants([...selectedVariants, { variant, qty: 1 }]);
    setSearchVariant('');
    setVariantResults([]);
  };

  const handleRemoveVariant = (id) =>
    setSelectedVariants(selectedVariants.filter(v => v.variant.id !== id));

  const handleQtyChange = (id, newQty) => {
    if (newQty < 1) return;
    setSelectedVariants(selectedVariants.map(v =>
      v.variant.id === id ? { ...v, qty: parseInt(newQty) } : v
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVariants.length) return alert('Pilih minimal 1 Variant Item untuk bundle ini.');
    setSubmitting(true);
    try {
      const payload = {
        bundle_name: formData.bundle_name,
        description: formData.description,
        variants: selectedVariants.map(v => ({ variant_id: v.variant.id, quantity: v.qty })),
      };
      await axios.post('/api/bundles', payload);
      alert('Bundle Item berhasil dibuat!');
      navigate('/bundles');
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan pada server');
    } finally {
      setSubmitting(false);
    }
  };

  const totalQty = selectedVariants.reduce((sum, v) => sum + v.qty, 0);

  return (
    <div className="animate-fade-in" style={{ paddingBottom:'2rem' }}>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button onClick={() => navigate('/bundles')} className="btn-icon" style={{ width:38, height:38 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ marginBottom:0 }}>Bundle Composer</h1>
          <p style={{ margin:0, fontSize:'0.875rem', color:'var(--text-muted)' }}>
            Buat paket komersial dengan menggabungkan Variant Item
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', alignItems:'flex-start' }}>

          {/* LEFT: Info + Search */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

            {/* SKU Preview + Form */}
            <div className="card" style={{ padding:'1.375rem' }}>
              {/* Bundle SKU Preview */}
              <div style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'0.875rem 1.125rem',
                background:'var(--warning-light)', border:'1.5px dashed var(--warning-border)',
                borderRadius:'var(--radius-lg)', marginBottom:'1.25rem',
              }}>
                <div>
                  <div style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:'0.2rem' }}>
                    Bundle SKU Preview
                  </div>
                  <div style={{ fontFamily:'monospace', fontWeight:800, fontSize:'1.375rem', color:'var(--warning)', letterSpacing:2 }}>
                    {previewSKU}
                  </div>
                </div>
                <PackageSearch size={28} color="var(--warning)" style={{ opacity:0.4 }} />
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div className="form-group">
                  <label>Bundle Name <span style={{ color:'var(--danger)' }}>*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="cth: Paket Lebaran Keluarga"
                    value={formData.bundle_name}
                    onChange={e => setFormData({ ...formData, bundle_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Deskripsi Promosi <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:400, textTransform:'none', letterSpacing:0 }}>(opsional)</span></label>
                  <textarea
                    rows={3}
                    placeholder="Catatan bundle..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    style={{ resize:'vertical' }}
                  />
                </div>
              </div>
            </div>

            {/* Variant Search */}
            <div className="card" style={{ padding:'1.375rem' }}>
              <h3 style={{ fontSize:'0.9rem', marginBottom:'0.875rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <Search size={16} /> Cari & Tambah Variant
              </h3>
              <div style={{ position:'relative' }}>
                <Search size={15} style={{ position:'absolute', left:'0.75rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }} />
                <input
                  type="text"
                  placeholder="Ketik SKU atau nama variant..."
                  value={searchVariant}
                  onChange={e => setSearchVariant(e.target.value)}
                  style={{ paddingLeft:'2.25rem' }}
                />
                {variantResults.length > 0 && (
                  <div style={{
                    position:'absolute', top:'calc(100% + 4px)', left:0, right:0,
                    background:'var(--bg-surface)', border:'1.5px solid var(--border)',
                    borderRadius:'var(--radius-lg)', zIndex:10,
                    boxShadow:'var(--shadow-lg)', overflow:'hidden',
                  }}>
                    {variantResults.map(v => (
                      <div
                        key={v.id}
                        className="d-flex justify-content-between align-items-center"
                        style={{
                          padding:'0.75rem 1rem', borderBottom:'1px solid var(--border)',
                          cursor:'pointer', transition:'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div>
                          <span className="badge badge-success" style={{ fontFamily:'monospace', fontSize:'0.75rem', marginRight:'0.5rem' }}>{v.variant_sku}</span>
                          <span style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>{v.parent_name} {v.model_type ? `— ${v.model_type}` : ''}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddVariant(v)}
                          className="btn btn-primary"
                          style={{ padding:'0.3rem 0.75rem', fontSize:'0.78rem', flexShrink:0 }}
                        >
                          <Plus size={13} /> Tambah
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Composition */}
          <div className="card" style={{ padding:'1.375rem' }}>
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h3 style={{ fontSize:'0.9rem', margin:0, display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <Package size={16} color="var(--warning)" /> Komposisi Bundle
              </h3>
              {selectedVariants.length > 0 && (
                <span className="badge badge-warning">{selectedVariants.length} variant · {totalQty} qty</span>
              )}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem', minHeight:200, marginBottom:'1.25rem' }}>
              {selectedVariants.map(item => (
                <div key={item.variant.id} style={{
                  display:'flex', alignItems:'center', gap:'1rem',
                  padding:'0.875rem 1rem',
                  background:'var(--bg-surface-2)',
                  border:'1.5px solid var(--border)',
                  borderRadius:'var(--radius-lg)',
                  transition:'border-color 0.15s',
                }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.2rem' }}>
                      <span className="badge badge-success" style={{ fontFamily:'monospace', fontSize:'0.75rem' }}>
                        {item.variant.variant_sku}
                      </span>
                    </div>
                    <div style={{ fontSize:'0.85rem', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {item.variant.parent_name} {item.variant.color_size ? `(${item.variant.color_size})` : ''}
                    </div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>
                      Unit: {item.variant.unit} | Qty/Pack: {item.variant.qty_pack}
                    </div>
                  </div>

                  <div style={{ flexShrink:0 }}>
                    <div style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-muted)', marginBottom:'0.25rem' }}>Qty</div>
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={e => handleQtyChange(item.variant.id, e.target.value)}
                      style={{ width:64, padding:'0.35rem 0.5rem', textAlign:'center', fontSize:'0.9rem', fontWeight:700 }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(item.variant.id)}
                    className="btn-icon"
                    title="Hapus"
                    style={{ color:'var(--danger)', background:'var(--danger-light)', border:'1.5px solid var(--danger-border)', flexShrink:0 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {selectedVariants.length === 0 && (
                <div style={{
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  flex:1, minHeight:160, border:'1.5px dashed var(--border)',
                  borderRadius:'var(--radius-lg)', color:'var(--text-muted)', textAlign:'center',
                  padding:'2rem', gap:'0.5rem',
                }}>
                  <Package size={28} style={{ opacity:0.25 }} />
                  <p style={{ margin:0, fontSize:'0.82rem' }}>Belum ada variant ditambahkan.<br/>Cari dan tambahkan variant di panel kiri.</p>
                </div>
              )}
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'1rem', borderTop:'1.5px solid var(--border)', flexWrap:'wrap', gap:'0.75rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => navigate('/bundles')}>
                Batal
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !selectedVariants.length}
              >
                {submitting
                  ? <><span className="spinner" style={{ borderTopColor:'#fff', width:14, height:14 }} /> Menyimpan...</>
                  : <><Save size={16} /> Simpan Bundle</>
                }
              </button>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
