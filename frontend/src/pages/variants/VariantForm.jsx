import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';

export default function VariantForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const defaultVariant = {
    model_type: '', color_size: '', size_color: '',
    unit: 'PCS', qty_pack: 1,
    height_cm: '', weight_gr: '',
    dimension_l: '', dimension_w: '', dimension_h: '',
    gross_weight_gr: '', notes: '',
  };

  const [parentId, setParentId] = useState('');
  const [variants, setVariants] = useState([{ ...defaultVariant }]);
  const [parents, setParents] = useState([]);
  const [previewSKU, setPreviewSKU] = useState('68YY--------');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios.get('/api/parents?limit=500').then(res => {
      if (res.data.success) setParents(res.data.data);
    });
    if (isEdit) {
      axios.get(`/api/variants/${id}`).then(res => {
        if (res.data.success) {
          const v = res.data.data;
          setParentId(v.parent_id);
          setVariants([{
            model_type: v.model_type || '', color_size: v.color_size || '',
            size_color: v.size_color || '', unit: v.unit || 'PCS',
            qty_pack: v.qty_pack || 1, height_cm: v.height_cm || '',
            weight_gr: v.weight_gr || '', dimension_l: v.dimension_l || '',
            dimension_w: v.dimension_w || '', dimension_h: v.dimension_h || '',
            gross_weight_gr: v.gross_weight_gr || '', notes: v.notes || '',
          }]);
          setPreviewSKU(v.variant_sku);
        }
      });
    } else {
      axios.get('/api/variants/preview-sku').then(res => {
        if (res.data.success) setPreviewSKU(res.data.data.sku);
      });
    }
  }, [id, isEdit]);

  const updateVariant = (index, field, value) => {
    const nv = [...variants];
    nv[index][field] = value;
    setVariants(nv);
  };

  const addVariant   = () => setVariants([...variants, { ...defaultVariant }]);
  const removeVariant = (i) => { if (variants.length > 1) setVariants(variants.filter((_, idx) => idx !== i)); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit) {
        await axios.put(`/api/variants/${id}`, variants[0]);
        alert('Variant Item berhasil diperbarui!');
      } else {
        await axios.post('/api/variants', { parent_id: parentId, variants });
        alert(`${variants.length} Variant berhasil dibuat!`);
      }
      navigate('/variants');
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan pada server');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedParent = parents.find(p => String(p.id) === String(parentId));
  const parentName = selectedParent?.base_name ?? '';

  const generateName = (v) => {
    if (!parentName) return <span style={{ color:'var(--text-muted)', fontStyle:'italic' }}>Pilih Parent dahulu...</span>;
    return [parentName, v.model_type, v.color_size, v.size_color].filter(Boolean).join(' ');
  };

  const generatePreview = (baseSKU, index) => {
    if (!baseSKU || baseSKU.includes('-')) return '...';
    if (index === 0) return baseSKU;
    const prefix = baseSKU.slice(0, 4);
    const seqStr = baseSKU.slice(4);
    const seq = parseInt(seqStr, 10);
    if (isNaN(seq)) return baseSKU;
    return prefix + String(seq + index).padStart(seqStr.length, '0');
  };

  /* compact input style for table cells */
  const iStyle = {
    padding: '0.4rem 0.5rem',
    fontSize: '0.82rem',
    borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--border)',
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    width: '100%',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom:'2rem' }}>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button onClick={() => navigate('/variants')} className="btn-icon" style={{ width:38, height:38 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ marginBottom:0 }}>{isEdit ? 'Edit Variant Item' : 'Tambah Variant Item'}</h1>
          <p style={{ margin:0, fontSize:'0.875rem', color:'var(--text-muted)' }}>
            Isi karakteristik logistik untuk generate SKU seri 68
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Parent selector + SKU preview */}
        <div className="card d-flex align-items-center gap-4 mb-4" style={{ flexWrap:'wrap', padding:'1.25rem 1.375rem' }}>
          <div className="form-group" style={{ flex:1, minWidth:260, margin:0 }}>
            <label>Parent Item <span style={{ color:'var(--danger)' }}>*</span></label>
            <select
              required
              disabled={isEdit}
              value={parentId}
              onChange={e => setParentId(e.target.value)}
            >
              <option value="">-- Pilih Parent Item --</option>
              {parents.map(p => (
                <option key={p.id} value={p.id}>{p.parent_sku} — {p.base_name}</option>
              ))}
            </select>
          </div>

          <div style={{
            display:'flex', flexDirection:'column', alignItems:'flex-end',
            padding:'0.875rem 1.25rem', background:'var(--success-light)',
            border:'1.5px solid var(--success-border)', borderRadius:'var(--radius-lg)',
            flexShrink:0,
          }}>
            <div style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:'0.2rem' }}>
              {isEdit ? 'Variant SKU' : 'Starting SKU Preview'}
            </div>
            <div style={{ fontFamily:'monospace', fontWeight:800, fontSize:'1.375rem', color:'var(--success)', letterSpacing:2 }}>
              {previewSKU}
            </div>
          </div>
        </div>

        {/* Variant rows table */}
        <div className="card" style={{ padding:0, overflowX:'auto', marginBottom:'1.25rem' }}>
          <table style={{ width:'100%', minWidth:'1300px', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--bg-surface-2)', borderBottom:'1.5px solid var(--border)' }}>
                <th style={{ padding:'0.7rem 1rem', width:130 }}>Item ID (SKU)</th>
                <th style={{ padding:'0.7rem 0.75rem', minWidth:200 }}>Generated Name</th>
                <th style={{ padding:'0.7rem 0.75rem', width:130 }}>Model / Type</th>
                <th style={{ padding:'0.7rem 0.75rem', width:120 }}>Color / Size</th>
                <th style={{ padding:'0.7rem 0.75rem', width:120 }}>Size / Color</th>
                <th style={{ padding:'0.7rem 0.75rem', width:80 }}>Unit *</th>
                <th style={{ padding:'0.7rem 0.75rem', width:70 }}>Qty *</th>
                <th style={{ padding:'0.7rem 0.75rem', width:90 }}>N.Wt(g)</th>
                <th style={{ padding:'0.7rem 0.75rem', width:90 }}>G.Wt(g)</th>
                <th style={{ padding:'0.7rem 0.75rem', width:160 }}>L × W × H (cm)</th>
                <th style={{ padding:'0.7rem 0.5rem', width:44 }}></th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, idx) => (
                <tr key={idx} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'0.625rem 1rem' }}>
                    <span className="badge badge-success" style={{ fontFamily:'monospace', fontSize:'0.78rem' }}>
                      {isEdit ? (v.variant_sku || previewSKU) : generatePreview(previewSKU, idx)}
                    </span>
                  </td>
                  <td style={{ padding:'0.625rem 0.5rem', fontSize:'0.85rem', fontWeight:500, maxWidth:200, wordBreak:'break-word' }}>
                    {generateName(v)}
                  </td>
                  <td style={{ padding:'0.5rem 0.375rem' }}>
                    <input style={iStyle} type="text" placeholder="Model" value={v.model_type} onChange={e => updateVariant(idx, 'model_type', e.target.value)} />
                  </td>
                  <td style={{ padding:'0.5rem 0.375rem' }}>
                    <input style={iStyle} type="text" placeholder="Col/Sz" value={v.color_size} onChange={e => updateVariant(idx, 'color_size', e.target.value)} />
                  </td>
                  <td style={{ padding:'0.5rem 0.375rem' }}>
                    <input style={iStyle} type="text" placeholder="Sz/Col" value={v.size_color} onChange={e => updateVariant(idx, 'size_color', e.target.value)} />
                  </td>
                  <td style={{ padding:'0.5rem 0.375rem' }}>
                    <select required style={iStyle} value={v.unit} onChange={e => updateVariant(idx, 'unit', e.target.value)}>
                      {['PCS','BOX','PACK','PAIR','SET'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </td>
                  <td style={{ padding:'0.5rem 0.375rem' }}>
                    <input style={{...iStyle, textAlign:'center'}} type="number" min="1" required value={v.qty_pack} onChange={e => updateVariant(idx, 'qty_pack', e.target.value)} />
                  </td>
                  <td style={{ padding:'0.5rem 0.375rem' }}>
                    <input style={{...iStyle, textAlign:'right'}} type="number" step="0.01" placeholder="0" value={v.weight_gr} onChange={e => updateVariant(idx, 'weight_gr', e.target.value)} />
                  </td>
                  <td style={{ padding:'0.5rem 0.375rem' }}>
                    <input style={{...iStyle, textAlign:'right'}} type="number" step="0.01" placeholder="0" value={v.gross_weight_gr} onChange={e => updateVariant(idx, 'gross_weight_gr', e.target.value)} />
                  </td>
                  <td style={{ padding:'0.5rem 0.375rem' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:3 }}>
                      {[['dimension_l','L'],['dimension_w','W'],['height_cm','H']].map(([f, ph]) => (
                        <input key={f} style={{...iStyle, textAlign:'center', padding:'0.4rem 0.25rem'}} type="number" step="0.01" placeholder={ph} value={v[f]} onChange={e => updateVariant(idx, f, e.target.value)} />
                      ))}
                    </div>
                  </td>
                  <td style={{ padding:'0.5rem 0.375rem', textAlign:'center' }}>
                    {!isEdit && variants.length > 1 && (
                      <button type="button" onClick={() => removeVariant(idx)} className="btn-icon"
                        style={{ width:28, height:28, color:'var(--danger)', background:'var(--danger-light)', border:'1px solid var(--danger-border)' }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="d-flex justify-content-between align-items-center" style={{ flexWrap:'wrap', gap:'0.75rem' }}>
          <div className="d-flex gap-3">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/variants')}>
              Batal
            </button>
            {!isEdit && (
              <button type="button" className="btn btn-outline" onClick={addVariant} style={{ borderStyle:'dashed' }}>
                <Plus size={16} /> Tambah Baris
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting
              ? <><span className="spinner" style={{ borderTopColor:'#fff', width:14, height:14 }} /> Menyimpan...</>
              : <><Save size={16} /> Simpan {variants.length > 1 ? `${variants.length} Variant` : 'Variant'}</>
            }
          </button>
        </div>
      </form>
    </div>
  );
}
