import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Info, CheckCircle } from 'lucide-react';

export default function ParentForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [ports, setPorts] = useState([]);

  const [formData, setFormData] = useState({
    brand_id: '',
    sub_brand: '',
    item_name: '',
    detail_category_id: '',
    item_type_id: '',
    port_id: '',
    description: ''
  });

  const [previewSKU, setPreviewSKU] = useState('P------');
  const [submitting, setSubmitting] = useState(false);
  const [similarSubBrands, setSimilarSubBrands] = useState([]);

  // Fetch similar sub brands
  useEffect(() => {
    if (!formData.sub_brand || formData.sub_brand.length < 2) {
      setSimilarSubBrands([]);
      return;
    }
    const t = setTimeout(() => {
      axios.get(`/api/parents/similar-sub-brands?q=${encodeURIComponent(formData.sub_brand)}`)
        .then(res => { if (res.data.success) setSimilarSubBrands(res.data.data); })
        .catch(console.error);
    }, 500);
    return () => clearTimeout(t);
  }, [formData.sub_brand]);

  // Fetch dropdown options
  useEffect(() => {
    const fetch = async () => {
      try {
        const [bR, cR, tR, pR] = await Promise.all([
          axios.get('/api/options/brands'),
          axios.get('/api/options/categories'),
          axios.get('/api/options/item-types'),
          axios.get('/api/options/ports'),
        ]);
        if (bR.data.success) setBrands(bR.data.data);
        if (cR.data.success) setCategories(cR.data.data);
        if (tR.data.success) setItemTypes(tR.data.data);
        if (pR.data.success) setPorts(pR.data.data);
      } catch (err) { console.error('Failed to load options', err); }
    };
    fetch();
  }, []);

  // Fetch existing data for Edit
  useEffect(() => {
    if (isEdit) {
      axios.get(`/api/parents/${id}`).then(res => {
        if (res.data.success) {
          const d = res.data.data;
          setFormData({
            brand_id: d.brand_id || '',
            sub_brand: d.sub_brand || '',
            item_name: d.item_name || '',
            detail_category_id: d.detail_category_id || '',
            item_type_id: d.item_type_id || '',
            port_id: d.port_id || '',
            description: d.description || '',
          });
          setPreviewSKU(d.parent_sku);
        }
      });
    } else {
      axios.get('/api/parents/preview-sku').then(res => {
        if (res.data.success) setPreviewSKU(res.data.data.sku);
      });
    }
  }, [id, isEdit]);

  const selectedBrandObj = useMemo(
    () => brands.find(b => b.id.toString() === formData.brand_id.toString()),
    [brands, formData.brand_id]
  );

  const businessUnit = selectedBrandObj?.business_unit ?? '';
  const brandName    = selectedBrandObj?.brand_name ?? '';

  const parentName = useMemo(() => {
    return [brandName, formData.sub_brand, formData.item_name]
      .map(s => s.trim()).filter(Boolean).join(' ');
  }, [brandName, formData.sub_brand, formData.item_name]);

  const handleChange = (field) => (e) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!parentName) {
      alert('Parent Name masih kosong! Isi Brand dan Item Name terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...formData, base_name: parentName, business_unit: businessUnit };
      if (isEdit) {
        await axios.put(`/api/parents/${id}`, payload);
        alert('Parent Item berhasil diperbarui!');
      } else {
        await axios.post('/api/parents', payload);
        alert('Parent Item berhasil dibuat!');
      }
      navigate('/parents');
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan pada server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4" style={{ flexWrap:'wrap' }}>
        <button
          onClick={() => navigate('/parents')}
          className="btn-icon"
          title="Kembali"
          style={{ width:38, height:38 }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ marginBottom:0 }}>{isEdit ? 'Edit Parent Item' : 'Tambah Parent Item'}</h1>
          <p style={{ margin:0, fontSize:'0.875rem', color:'var(--text-muted)' }}>
            Isi form di bawah untuk membuat SKU seri P
          </p>
        </div>
      </div>

      <div className="d-flex gap-4" style={{ flexWrap:'wrap', alignItems:'flex-start' }}>

        {/* ─── Form (Left) ─── */}
        <div className="card" style={{ flex:'1 1 0', minWidth:'380px' }}>

          {/* SKU Preview Banner */}
          <div className="sku-preview-banner">
            <div>
              <div style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:'0.25rem' }}>
                Auto-Generated Parent Name
              </div>
              <div style={{ fontSize:'1.05rem', fontWeight:600, color:'var(--text-primary)' }}>
                {parentName || <span style={{ color:'var(--text-muted)', fontStyle:'italic', fontWeight:400 }}>Akan diisi otomatis...</span>}
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:'0.25rem' }}>
                SKU Preview
              </div>
              <div className="sku-code">{previewSKU}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.125rem' }}>
            <div className="form-grid">

              <div className="form-group">
                <label>Brand <span style={{ color:'var(--danger)' }}>*</span></label>
                <select required value={formData.brand_id} onChange={handleChange('brand_id')}>
                  <option value="">-- Pilih Brand --</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.brand_name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Sub Brand</label>
                <input
                  type="text"
                  placeholder="cth: Pro, Eco, Lite"
                  value={formData.sub_brand}
                  onChange={handleChange('sub_brand')}
                />
              </div>

              <div className="form-group">
                <label>Item Name <span style={{ color:'var(--danger)' }}>*</span></label>
                <input
                  type="text"
                  required
                  placeholder="cth: Kemeja Flanel"
                  value={formData.item_name}
                  onChange={handleChange('item_name')}
                />
              </div>

              <div className="form-group">
                <label>Detail Category</label>
                <select value={formData.detail_category_id} onChange={handleChange('detail_category_id')}>
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.detail_category}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Item Type</label>
                <select value={formData.item_type_id} onChange={handleChange('item_type_id')}>
                  <option value="">-- Pilih Tipe --</option>
                  {itemTypes.map(t => <option key={t.id} value={t.id}>{t.type_name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Port</label>
                <select value={formData.port_id} onChange={handleChange('port_id')}>
                  <option value="">-- Pilih Port --</option>
                  {ports.map(p => <option key={p.id} value={p.id}>{p.port_name}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn:'span 2' }}>
                <label>Business Unit <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:400, textTransform:'none', letterSpacing:0 }}>(otomatis dari Brand)</span></label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={businessUnit}
                  placeholder="Pilih Brand terlebih dahulu..."
                />
              </div>

            </div>

            <div className="form-group">
              <label>Deskripsi <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:400, textTransform:'none', letterSpacing:0 }}>(opsional)</span></label>
              <textarea
                rows={3}
                placeholder="Detail produk..."
                value={formData.description}
                onChange={handleChange('description')}
                style={{ resize:'vertical' }}
              />
            </div>

            <div className="d-flex justify-content-between gap-3" style={{ marginTop:'0.25rem', flexWrap:'wrap' }}>
              <button type="button" className="btn btn-outline" onClick={() => navigate('/parents')}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting
                  ? <><span className="spinner" style={{ borderTopColor:'#fff', width:14, height:14 }} /> Menyimpan...</>
                  : <><Save size={16} /> {isEdit ? 'Perbarui' : 'Simpan Parent Item'}</>
                }
              </button>
            </div>
          </form>
        </div>

        {/* ─── Similar Sub Brands (Right) ─── */}
        <div style={{ flex:'1 1 0', minWidth:'300px', maxWidth:'420px' }}>
          {similarSubBrands.length > 0 ? (
            <div className="card" style={{
              borderColor:'var(--warning-border)',
              background:'var(--warning-light)',
              padding:'1.25rem',
            }}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <div style={{ width:32, height:32, borderRadius:'var(--radius-md)', background:'var(--warning-light)', border:'1.5px solid var(--warning-border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Info size={16} color="var(--warning)" />
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--warning)' }}>Sub Brand Serupa Ditemukan</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>
                    Nama mirip dengan "<strong>{formData.sub_brand}</strong>"
                  </div>
                </div>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr style={{ background:'rgba(217,119,6,0.06)' }}>
                      <th style={{ color:'var(--warning)' }}>Sub Brand</th>
                      <th style={{ color:'var(--warning)' }}>Parent Name</th>
                      <th style={{ color:'var(--warning)', textAlign:'center' }}>Match</th>
                    </tr>
                  </thead>
                  <tbody>
                    {similarSubBrands.map((s, idx) => (
                      <tr key={idx} style={{ background:'transparent' }}>
                        <td style={{ fontWeight:600 }}>{s.sub_brand}</td>
                        <td style={{ fontSize:'0.82rem' }}>{s.parent_name}</td>
                        <td style={{ textAlign:'center' }}>
                          <span className="badge badge-warning">{s.score}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card" style={{
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              minHeight:200, borderStyle:'dashed',
              background:'var(--bg-surface-2)',
              color:'var(--text-muted)', textAlign:'center',
              padding:'2rem 1.5rem',
              gap:'0.75rem',
            }}>
              <CheckCircle size={32} style={{ opacity:0.25 }} />
              <div>
                <div style={{ fontWeight:600, marginBottom:'0.25rem', fontSize:'0.875rem' }}>Cek Duplikasi Sub Brand</div>
                <p style={{ margin:0, fontSize:'0.8rem' }}>
                  Ketik <strong>Sub Brand</strong> di form sebelah kiri untuk melihat rekomendasi nama yang mirip.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
