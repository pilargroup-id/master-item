import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import variantsService from '../../services/variantsService';
import parentsService from '../../services/parentsService';
import AlertModal from '../../components/AlertModal';

// ── Constants ─────────────────────────────────────────────────────────────────
const UNIT_OPTIONS = ['PCS', 'BOX', 'PACK', 'PAIR', 'SET'];

const DEFAULT_VARIANT = {
  model_type: '', color_size: '', size_color: '',
  unit: 'PCS', qty_pack: 1,
  height_cm: '', weight_gr: '',
  dimension_l: '', dimension_w: '', dimension_h: '',
  gross_weight_gr: '', notes: '',
};

const INPUT_STYLE = {
  padding: '0.4rem 0.5rem', fontSize: '0.82rem',
  borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)',
  background: 'var(--bg-surface)', color: 'var(--text-primary)',
  width: '100%', fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Estimasi SKU untuk baris ke-N berdasarkan preview SKU pertama */
function estimateSku(baseSku, index) {
  if (!baseSku || baseSku.includes('-')) return '...';
  if (index === 0) return baseSku;
  const prefix = baseSku.slice(0, 4);
  const seqStr = baseSku.slice(4);
  const seq    = parseInt(seqStr, 10);
  return isNaN(seq) ? baseSku : prefix + String(seq + index).padStart(seqStr.length, '0');
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function VariantForm() {
  const { id }   = useParams();
  const isEdit   = !!id;
  const navigate = useNavigate();

  const [parentId,    setParentId]    = useState('');
  const [parents,     setParents]     = useState([]);
  const [variants,    setVariants]    = useState([{ ...DEFAULT_VARIANT }]);
  const [previewSku,  setPreviewSku]  = useState('68YY--------');
  const [submitting,  setSubmitting]  = useState(false);
  const [alert,       setAlert]       = useState(null);

  const showAlert = (severity, message) => setAlert({ severity, message });

  // ── Load data awal ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Dropdown parent (ambil banyak agar semua tersedia)
    parentsService.list({ limit: 500 })
      .then(res => { if (res.data.success) setParents(res.data.data); })
      .catch(console.error);

    if (isEdit) {
      variantsService.getById(id)
        .then(res => {
          if (!res.data.success) return;
          const v = res.data.data;
          setParentId(v.parent_id);
          setPreviewSku(v.variant_sku);
          setVariants([{
            model_type:     v.model_type      || '',
            color_size:     v.color_size      || '',
            size_color:     v.size_color      || '',
            unit:           v.unit            || 'PCS',
            qty_pack:       v.qty_pack        || 1,
            height_cm:      v.height_cm       || '',
            weight_gr:      v.weight_gr       || '',
            dimension_l:    v.dimension_l     || '',
            dimension_w:    v.dimension_w     || '',
            dimension_h:    v.dimension_h     || '',
            gross_weight_gr:v.gross_weight_gr || '',
            notes:          v.notes           || '',
          }]);
        })
        .catch(() => showAlert('error', 'Gagal memuat data variant.'));
    } else {
      variantsService.previewSku()
        .then(res => { if (res.data.success) setPreviewSku(res.data.data.sku); })
        .catch(console.error);
    }
  }, [id, isEdit]);

  // ── Variant row helpers ─────────────────────────────────────────────────────
  const updateField = (index, field, value) =>
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));

  const addRow    = () => setVariants((prev) => [...prev, { ...DEFAULT_VARIANT }]);
  const removeRow = (i) => setVariants((prev) => prev.filter((_, idx) => idx !== i));

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit) {
        await variantsService.update(id, variants[0]);
        showAlert('success', 'Variant Item berhasil diperbarui!');
      } else {
        await variantsService.create({ parent_id: parentId, variants });
        showAlert('success', `${variants.length} Variant berhasil dibuat!`);
      }
      setTimeout(() => navigate('/variants'), 1200);
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Terjadi kesalahan pada server.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const selectedParent = parents.find((p) => String(p.id) === String(parentId));
  const parentName     = selectedParent?.base_name ?? '';

  const generateName = (v) => {
    if (!parentName) return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Pilih Parent dahulu...</span>;
    return [parentName, v.model_type, v.color_size, v.size_color].filter(Boolean).join(' ');
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>

      <AlertModal
        open={!!alert}
        severity={alert?.severity}
        message={alert?.message}
        onClose={() => setAlert(null)}
      />

      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <button onClick={() => navigate('/variants')} className="btn-icon" style={{ width: 38, height: 38 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ marginBottom: 0 }}>{isEdit ? 'Edit Variant Item' : 'Tambah Variant Item'}</h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Isi karakteristik logistik untuk generate SKU seri 68
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Parent selector + SKU preview */}
        <div className="card d-flex align-items-center gap-4 mb-4" style={{ flexWrap: 'wrap', padding: '1.25rem 1.375rem' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 260, margin: 0 }}>
            <label>Parent Item <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select required disabled={isEdit} value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">-- Pilih Parent Item --</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>{p.parent_sku} — {p.base_name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', padding: '0.875rem 1.25rem', background: 'var(--success-light)', border: '1.5px solid var(--success-border)', borderRadius: 'var(--radius-lg)', flexShrink: 0 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
              {isEdit ? 'Variant SKU' : 'Starting SKU Preview'}
            </div>
            <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.375rem', color: 'var(--success)', letterSpacing: 2 }}>
              {previewSku}
            </div>
          </div>
        </div>

        {/* Variant rows */}
        <div className="card" style={{ padding: 0, overflowX: 'auto', marginBottom: '1.25rem' }}>
          <table style={{ width: '100%', minWidth: '1300px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-2)', borderBottom: '1.5px solid var(--border)' }}>
                <th style={{ padding: '0.7rem 1rem',   width: 130 }}>Item ID (SKU)</th>
                <th style={{ padding: '0.7rem 0.75rem', minWidth: 200 }}>Generated Name</th>
                <th style={{ padding: '0.7rem 0.75rem', width: 130 }}>Model / Type</th>
                <th style={{ padding: '0.7rem 0.75rem', width: 120 }}>Color / Size</th>
                <th style={{ padding: '0.7rem 0.75rem', width: 120 }}>Size / Color</th>
                <th style={{ padding: '0.7rem 0.75rem', width: 80  }}>Unit *</th>
                <th style={{ padding: '0.7rem 0.75rem', width: 70  }}>Qty *</th>
                <th style={{ padding: '0.7rem 0.75rem', width: 90  }}>N.Wt(g)</th>
                <th style={{ padding: '0.7rem 0.75rem', width: 90  }}>G.Wt(g)</th>
                <th style={{ padding: '0.7rem 0.75rem', width: 160 }}>L × W × H (cm)</th>
                <th style={{ padding: '0.7rem 0.5rem',  width: 44  }}></th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, idx) => (
                <VariantRow
                  key={idx}
                  variant={v}
                  index={idx}
                  isEdit={isEdit}
                  previewSku={previewSku}
                  generatedName={generateName(v)}
                  canRemove={!isEdit && variants.length > 1}
                  onUpdate={(field, val) => updateField(idx, field, val)}
                  onRemove={() => removeRow(idx)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="d-flex justify-content-between align-items-center" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="d-flex gap-3">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/variants')}>
              Batal
            </button>
            {!isEdit && (
              <button type="button" className="btn btn-outline" onClick={addRow} style={{ borderStyle: 'dashed' }}>
                <Plus size={16} /> Tambah Baris
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting
              ? <><span className="spinner" style={{ borderTopColor: '#fff', width: 14, height: 14 }} /> Menyimpan...</>
              : <><Save size={16} /> Simpan {variants.length > 1 ? `${variants.length} Variant` : 'Variant'}</>
            }
          </button>
        </div>
      </form>
    </div>
  );
}

// ── VariantRow sub-component ──────────────────────────────────────────────────
function VariantRow({ variant: v, index, isEdit, previewSku, generatedName, canRemove, onUpdate, onRemove }) {
  const inp = (field, extra = {}) => (
    <input
      style={{ ...INPUT_STYLE, ...extra }}
      value={v[field]}
      onChange={(e) => onUpdate(field, e.target.value)}
    />
  );

  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>

      {/* SKU preview */}
      <td style={{ padding: '0.625rem 1rem' }}>
        <span className="badge badge-success" style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
          {isEdit ? (v.variant_sku || previewSku) : estimateSku(previewSku, index)}
        </span>
      </td>

      {/* Generated name */}
      <td style={{ padding: '0.625rem 0.5rem', fontSize: '0.85rem', fontWeight: 500, maxWidth: 200, wordBreak: 'break-word' }}>
        {generatedName}
      </td>

      {/* Text fields */}
      <td style={{ padding: '0.5rem 0.375rem' }}>
        <input style={INPUT_STYLE} type="text" placeholder="Model" value={v.model_type} onChange={(e) => onUpdate('model_type', e.target.value)} />
      </td>
      <td style={{ padding: '0.5rem 0.375rem' }}>
        <input style={INPUT_STYLE} type="text" placeholder="Col/Sz" value={v.color_size} onChange={(e) => onUpdate('color_size', e.target.value)} />
      </td>
      <td style={{ padding: '0.5rem 0.375rem' }}>
        <input style={INPUT_STYLE} type="text" placeholder="Sz/Col" value={v.size_color} onChange={(e) => onUpdate('size_color', e.target.value)} />
      </td>

      {/* Unit */}
      <td style={{ padding: '0.5rem 0.375rem' }}>
        <select required style={INPUT_STYLE} value={v.unit} onChange={(e) => onUpdate('unit', e.target.value)}>
          {UNIT_OPTIONS.map((u) => <option key={u}>{u}</option>)}
        </select>
      </td>

      {/* Qty */}
      <td style={{ padding: '0.5rem 0.375rem' }}>
        <input style={{ ...INPUT_STYLE, textAlign: 'center' }} type="number" min="1" required value={v.qty_pack} onChange={(e) => onUpdate('qty_pack', e.target.value)} />
      </td>

      {/* Net weight */}
      <td style={{ padding: '0.5rem 0.375rem' }}>
        <input style={{ ...INPUT_STYLE, textAlign: 'right' }} type="number" step="0.01" placeholder="0" value={v.weight_gr} onChange={(e) => onUpdate('weight_gr', e.target.value)} />
      </td>

      {/* Gross weight */}
      <td style={{ padding: '0.5rem 0.375rem' }}>
        <input style={{ ...INPUT_STYLE, textAlign: 'right' }} type="number" step="0.01" placeholder="0" value={v.gross_weight_gr} onChange={(e) => onUpdate('gross_weight_gr', e.target.value)} />
      </td>

      {/* Dimensions L × W × H */}
      <td style={{ padding: '0.5rem 0.375rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
          {[['dimension_l', 'L'], ['dimension_w', 'W'], ['height_cm', 'H']].map(([field, ph]) => (
            <input
              key={field}
              style={{ ...INPUT_STYLE, textAlign: 'center', padding: '0.4rem 0.25rem' }}
              type="number" step="0.01" placeholder={ph}
              value={v[field]}
              onChange={(e) => onUpdate(field, e.target.value)}
            />
          ))}
        </div>
      </td>

      {/* Remove button */}
      <td style={{ padding: '0.5rem 0.375rem', textAlign: 'center' }}>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="btn-icon"
            style={{ width: 28, height: 28, color: 'var(--danger)', background: 'var(--danger-light)', border: '1px solid var(--danger-border)' }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </td>
    </tr>
  );
}
