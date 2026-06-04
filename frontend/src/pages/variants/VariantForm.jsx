import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import variantsService from '../../services/variantsService';
import parentsService from '../../services/parentsService';
import AlertModal from '../../components/AlertModal';
import CreateButton from '../../components/button/CreateButton';
import { DataTableStatus } from '../../components/table/DataTable';

const UNIT_OPTIONS = ['PCS', 'BOX', 'PACK', 'PAIR', 'SET'];

const DEFAULT_VARIANT = {
  model_type: '', color_size: '', size_color: '',
  unit: 'PCS', qty_pack: 1,
  height_cm: '', weight_gr: '',
  dimension_l: '', dimension_w: '', dimension_h: '',
  gross_weight_gr: '', notes: '',
};

const CELL = {
  padding: '0.4rem 0.5rem', fontSize: '0.82rem',
  borderRadius: 8, border: '1px solid rgba(26,42,87,0.14)',
  background: 'rgba(248,250,252,0.9)', color: '#182b58',
  width: '100%', fontFamily: 'inherit',
  transition: 'border-color 0.15s, box-shadow 0.15s', outline: 'none',
};

const CELL_FOCUS = {
  borderColor: 'rgba(42,157,143,0.55)',
  boxShadow: '0 0 0 3px rgba(42,157,143,0.12)',
  background: '#fff',
};

function estimateSku(baseSku, index) {
  if (!baseSku || baseSku.includes('-')) return '...';
  if (index === 0) return baseSku;
  const prefix = baseSku.slice(0, 4);
  const seqStr = baseSku.slice(4);
  const seq    = parseInt(seqStr, 10);
  return isNaN(seq) ? baseSku : prefix + String(seq + index).padStart(seqStr.length, '0');
}

function CellInput({ value, onChange, type = 'text', placeholder, align, step, min, required }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type} value={value} onChange={onChange}
      placeholder={placeholder} step={step} min={min} required={required}
      style={{ ...CELL, textAlign: align, ...(focused ? CELL_FOCUS : {}) }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function CellSelect({ value, onChange, options, required }) {
  const [focused, setFocused] = useState(false);
  return (
    <select value={value} onChange={onChange} required={required}
      style={{
        ...CELL,
        appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%232a9d8f' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center',
        paddingRight: '1.6rem',
        ...(focused ? CELL_FOCUS : {}),
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

export default function VariantForm({ modalId, onClose, onSaved }) {
  const params   = useParams();
  const navigate = useNavigate();
  const id       = modalId ?? params.id;
  const isEdit   = !!id;
  const isModal  = !!onClose;

  const [parentId,   setParentId]   = useState('');
  const [parents,    setParents]    = useState([]);
  const [variants,   setVariants]   = useState([{ ...DEFAULT_VARIANT }]);
  const [previewSku, setPreviewSku] = useState('68YY--------');
  const [submitting, setSubmitting] = useState(false);
  const [alert,      setAlert]      = useState(null);

  const showAlert = (s, m) => setAlert({ severity: s, message: m });

  useEffect(() => {
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
            model_type: v.model_type || '', color_size: v.color_size || '',
            size_color: v.size_color || '', unit: v.unit || 'PCS',
            qty_pack: v.qty_pack || 1, height_cm: v.height_cm || '',
            weight_gr: v.weight_gr || '', dimension_l: v.dimension_l || '',
            dimension_w: v.dimension_w || '', dimension_h: v.dimension_h || '',
            gross_weight_gr: v.gross_weight_gr || '', notes: v.notes || '',
          }]);
        })
        .catch(() => showAlert('error', 'Failed to load variant data.'));
    } else {
      variantsService.previewSku()
        .then(res => { if (res.data.success) setPreviewSku(res.data.data.sku); })
        .catch(console.error);
    }
  }, [id, isEdit]);

  const updateField = (index, field, value) =>
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));

  const addRow    = () => setVariants(prev => [...prev, { ...DEFAULT_VARIANT }]);
  const removeRow = (i) => setVariants(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit) {
        await variantsService.update(id, variants[0]);
        showAlert('success', 'Variant Item updated successfully!');
      } else {
        await variantsService.create({ parent_id: parentId, variants });
        showAlert('success', `${variants.length} Variant(s) created successfully!`);
      }
      if (isModal) {
        onSaved?.();
        setTimeout(() => onClose(), 1200);
      } else {
        setTimeout(() => navigate('/variants'), 1200);
      }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Server error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedParent = parents.find(p => String(p.id) === String(parentId));
  const parentName     = selectedParent?.base_name ?? '';

  const generateName = (v) => {
    if (!parentName) return <span style={{ color: '#8496b0', fontStyle: 'italic' }}>Select Parent first...</span>;
    return [parentName, v.model_type, v.color_size, v.size_color].filter(Boolean).join(' ');
  };

  const handleCancel = () => isModal ? onClose() : navigate('/variants');

  const TH = ({ children, style }) => (
    <th style={{
      padding: '0.65rem 0.75rem', fontSize: '0.72rem', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8496b0',
      background: 'rgba(246,248,250,0.98)', borderBottom: '1px solid rgba(26,42,87,0.08)',
      whiteSpace: 'nowrap', textAlign: 'left', ...style,
    }}>{children}</th>
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: isModal ? 0 : '2rem' }}>
      <AlertModal open={!!alert} severity={alert?.severity} message={alert?.message} onClose={() => setAlert(null)} />

      {/* Page header */}
      {!isModal && (
        <div className="d-flex align-items-center gap-3 mb-4">
          <CreateButton variant="icon" type="button" title="Back"
            onClick={handleCancel} style={{ width: 38, height: 38 }}>
            <ArrowLeft size={18} />
          </CreateButton>
          <div>
            <h1 style={{ marginBottom: 0 }}>{isEdit ? 'Edit Variant Item' : 'Add Variant Item'}</h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Fill in logistics characteristics to generate a 68-series SKU
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* Parent selector + SKU preview */}
        <section className={isModal ? '' : 'dashboard-card'} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.25rem', padding: isModal ? '0.85rem 1.1rem' : '1.25rem 1.375rem', flexWrap: 'wrap', background: isModal ? 'rgba(24,43,88,0.04)' : undefined, border: isModal ? '1px solid rgba(24,43,88,0.08)' : undefined, borderRadius: isModal ? 14 : undefined }}>
          <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#445674' }}>
              Parent Item <span style={{ color: '#e05252' }}>*</span>
            </label>
            <select required disabled={isEdit} value={parentId}
              onChange={e => setParentId(e.target.value)}
              style={{
                ...CELL, appearance: 'none', WebkitAppearance: 'none',
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%232a9d8f' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '2rem',
                padding: '0.6rem 2rem 0.6rem 0.85rem',
              }}>
              <option value="">Select Parent Item</option>
              {parents.map(p => <option key={p.id} value={p.id}>{p.parent_sku} — {p.base_name}</option>)}
            </select>
          </div>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
            padding: '0.875rem 1.25rem',
            background: 'rgba(42,157,143,0.07)', border: '1px solid rgba(42,157,143,0.2)',
            borderRadius: 14, flexShrink: 0,
          }}>
            <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8496b0', marginBottom: 3 }}>
              {isEdit ? 'Variant SKU' : 'Starting SKU Preview'}
            </p>
            <div className="sku-code" style={{ fontSize: '1.25rem', color: '#18786e' }}>{previewSku}</div>
          </div>
        </section>

        {/* Variant rows table */}
        <section className={isModal ? '' : 'dashboard-card'} style={{ padding: 0, overflowX: 'auto', marginBottom: '1.25rem', border: isModal ? '1px solid rgba(26,42,87,0.08)' : undefined, borderRadius: isModal ? 14 : undefined }}>
          <table style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <TH style={{ width: 130 }}>Item ID (SKU)</TH>
                <TH style={{ minWidth: 180 }}>Generated Name</TH>
                <TH style={{ width: 130 }}>Model / Type</TH>
                <TH style={{ width: 110 }}>Color / Size</TH>
                <TH style={{ width: 110 }}>Size / Color</TH>
                <TH style={{ width: 80 }}>Unit *</TH>
                <TH style={{ width: 65, textAlign: 'center' }}>Qty *</TH>
                <TH style={{ width: 85, textAlign: 'center' }}>N.Wt (g)</TH>
                <TH style={{ width: 85, textAlign: 'center' }}>G.Wt (g)</TH>
                <TH style={{ width: 155, textAlign: 'center' }}>L × W × H (cm)</TH>
                <TH style={{ width: 40 }}></TH>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(26,42,87,0.06)' }}>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <DataTableStatus variant="active" inline style={{ fontFamily: 'monospace' }}>
                      {isEdit ? (v.variant_sku || previewSku) : estimateSku(previewSku, idx)}
                    </DataTableStatus>
                  </td>
                  <td style={{ padding: '0.5rem 0.5rem', fontSize: '0.82rem', fontWeight: 500, maxWidth: 180, wordBreak: 'break-word', color: '#182b58' }}>
                    {generateName(v)}
                  </td>
                  <td style={{ padding: '0.4rem 0.375rem' }}>
                    <CellInput value={v.model_type} placeholder="Model" onChange={e => updateField(idx, 'model_type', e.target.value)} />
                  </td>
                  <td style={{ padding: '0.4rem 0.375rem' }}>
                    <CellInput value={v.color_size} placeholder="Col/Sz" onChange={e => updateField(idx, 'color_size', e.target.value)} />
                  </td>
                  <td style={{ padding: '0.4rem 0.375rem' }}>
                    <CellInput value={v.size_color} placeholder="Sz/Col" onChange={e => updateField(idx, 'size_color', e.target.value)} />
                  </td>
                  <td style={{ padding: '0.4rem 0.375rem' }}>
                    <CellSelect value={v.unit} options={UNIT_OPTIONS} required onChange={e => updateField(idx, 'unit', e.target.value)} />
                  </td>
                  <td style={{ padding: '0.4rem 0.375rem' }}>
                    <CellInput type="number" min="1" required align="center" value={v.qty_pack} onChange={e => updateField(idx, 'qty_pack', e.target.value)} />
                  </td>
                  <td style={{ padding: '0.4rem 0.375rem' }}>
                    <CellInput type="number" step="0.01" placeholder="0" align="right" value={v.weight_gr} onChange={e => updateField(idx, 'weight_gr', e.target.value)} />
                  </td>
                  <td style={{ padding: '0.4rem 0.375rem' }}>
                    <CellInput type="number" step="0.01" placeholder="0" align="right" value={v.gross_weight_gr} onChange={e => updateField(idx, 'gross_weight_gr', e.target.value)} />
                  </td>
                  <td style={{ padding: '0.4rem 0.375rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
                      {[['dimension_l','L'],['dimension_w','W'],['height_cm','H']].map(([field, ph]) => (
                        <CellInput key={field} type="number" step="0.01" placeholder={ph} align="center"
                          value={v[field]} onChange={e => updateField(idx, field, e.target.value)} />
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '0.4rem 0.375rem', textAlign: 'center' }}>
                    {!isEdit && variants.length > 1 && (
                      <CreateButton variant="icon" tone="danger" type="button" onClick={() => removeRow(idx)}
                        style={{ width: 28, height: 28 }}>
                        <Trash2 size={13} />
                      </CreateButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="dashboard-popup__button dashboard-popup__button--secondary"
              onClick={handleCancel}>
              Cancel
            </button>
            {!isEdit && (
              <button type="button" className="dashboard-popup__button dashboard-popup__button--secondary"
                onClick={addRow} style={{ borderStyle: 'dashed' }}>
                <Plus size={15} style={{ marginRight: 5 }} /> Add Row
              </button>
            )}
          </div>
          <button type="submit" className="dashboard-popup__button dashboard-popup__button--primary" disabled={submitting}>
            {submitting
              ? <><span className="dashboard-popup__spinner" style={{ width: 15, height: 15, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', marginRight: 6 }} />Saving...</>
              : <><Save size={15} style={{ marginRight: 6 }} />Save {variants.length > 1 ? `${variants.length} Variants` : 'Variant'}</>
            }
          </button>
        </div>

      </form>
    </div>
  );
}
