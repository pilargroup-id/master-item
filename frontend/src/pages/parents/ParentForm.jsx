import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Info, X } from 'lucide-react';
import parentsService from '../../services/parentsService';
import AlertModal from '../../components/AlertModal';
import CardBigBox from '../../components/cardbox/CardBigBox';
import CreateButton from '../../components/button/CreateButton';
import DataTable, { DataTableStatus } from '../../components/table/DataTable';

export default function ParentForm({ modalId, onClose, onSaved }) {
  const params   = useParams();
  const navigate = useNavigate();

  const id      = modalId ?? params.id;
  const isEdit  = !!id;
  const isModal = !!onClose;

  const [options,          setOptions]          = useState({ brands: [], categories: [], itemTypes: [], ports: [] });
  const [formData,         setFormData]         = useState({ brand_id: '', sub_brand: '', item_name: '', detail_category_id: '', item_type_id: '', port_id: '', description: '' });
  const [previewSKU,       setPreviewSKU]       = useState('P------');
  const [submitting,       setSubmitting]        = useState(false);
  const [similarSubBrands, setSimilarSubBrands]  = useState([]);
  const [showSimilarToast, setShowSimilarToast]  = useState(false);
  const [alert,            setAlert]             = useState(null);
  const toastTimer = useRef(null);

  const showAlert = (s, m) => setAlert({ severity: s, message: m });

  useEffect(() => {
    parentsService.getFormOptions()
      .then(r => { if (r.data.success) setOptions(r.data.data); })
      .catch(() => showAlert('error', 'Failed to load form options.'));
  }, []);

  useEffect(() => {
    if (isEdit) {
      parentsService.getById(id)
        .then(r => {
          if (!r.data.success) return;
          const d = r.data.data;
          setFormData({ brand_id: d.brand_id || '', sub_brand: d.sub_brand || '', item_name: d.item_name || '', detail_category_id: d.detail_category_id || '', item_type_id: d.item_type_id || '', port_id: d.port_id || '', description: d.description || '' });
          setPreviewSKU(d.parent_sku);
        })
        .catch(() => showAlert('error', 'Failed to load parent data.'));
    } else {
      parentsService.previewSku()
        .then(r => { if (r.data.success) setPreviewSKU(r.data.data.sku); })
        .catch(console.error);
    }
  }, [id, isEdit]);

  useEffect(() => {
    if (!formData.sub_brand || formData.sub_brand.length < 2) { setSimilarSubBrands([]); return; }
    const t = setTimeout(() => {
      parentsService.similarSubBrands(formData.sub_brand)
        .then(r => {
          if (r.data.success && r.data.data.length > 0) {
            setSimilarSubBrands(r.data.data);
            setShowSimilarToast(true);
            clearTimeout(toastTimer.current);
            toastTimer.current = setTimeout(() => setShowSimilarToast(false), 4000);
          } else {
            setSimilarSubBrands([]);
            setShowSimilarToast(false);
          }
        })
        .catch(console.error);
    }, 500);
    return () => clearTimeout(t);
  }, [formData.sub_brand]);

  const selectedBrand = useMemo(() => options.brands.find(b => b.id.toString() === formData.brand_id.toString()), [options.brands, formData.brand_id]);
  const businessUnit  = selectedBrand?.business_unit ?? '';
  const brandName     = selectedBrand?.brand_name    ?? '';
  const parentName    = useMemo(() => [brandName, formData.sub_brand, formData.item_name].map(s => s.trim()).filter(Boolean).join(' '), [brandName, formData.sub_brand, formData.item_name]);

  const set = (field) => (e) => setFormData(p => ({ ...p, [field]: e.target.value }));
  const handleCancel = () => isModal ? onClose() : navigate('/parents');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!parentName) { showAlert('warning', 'Parent Name is empty! Fill in Brand and Item Name first.'); return; }
    setSubmitting(true);
    try {
      // base_name & business_unit dihitung di backend dari brand_id + sub_brand + item_name
      const { brand_id, sub_brand, item_name, detail_category_id, item_type_id, port_id, description } = formData;
      const payload = { brand_id, sub_brand, item_name, detail_category_id, item_type_id, port_id, description };
      if (isEdit) { await parentsService.update(id, payload); showAlert('success', 'Parent Item updated!'); }
      else        { await parentsService.create(payload);     showAlert('success', 'Parent Item created!'); }
      if (isModal) { onSaved?.(); setTimeout(() => onClose(), 1200); }
      else         { setTimeout(() => navigate('/parents'), 1200); }
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Server error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Modal mode — clean layout without nested cards ─────────────────────────
  if (isModal) {
    return (
      <>
        <AlertModal open={!!alert} severity={alert?.severity} message={alert?.message} onClose={() => setAlert(null)} />

        <form onSubmit={handleSubmit}>

          {/* SKU Preview */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.85rem 1.1rem', marginBottom: '1.5rem',
            background: 'rgba(24,43,88,0.04)', borderRadius: 14,
            border: '1px solid rgba(24,43,88,0.08)',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8496b0', marginBottom: 3 }}>Auto-Generated Name</p>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#182b58' }}>
                {parentName || <span style={{ color: '#8496b0', fontStyle: 'italic', fontWeight: 400 }}>Will be filled automatically...</span>}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8496b0', marginBottom: 3 }}>SKU Preview</p>
              <div className="sku-code">{previewSKU}</div>
            </div>
          </div>

          {/* Form fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem 1rem', marginBottom: '1.25rem' }}>
            <Field label="Brand" required>
              <StyledSelect value={formData.brand_id} onChange={set('brand_id')} required>
                <option value="">Select Brand</option>
                {options.brands.map(b => <option key={b.id} value={b.id}>{b.brand_name}</option>)}
              </StyledSelect>
            </Field>

            <Field label="Sub Brand">
              <StyledInput type="text" placeholder="e.g. Pro, Eco, Lite" value={formData.sub_brand} onChange={set('sub_brand')} />
            </Field>

            <Field label="Item Name" required>
              <StyledInput type="text" required placeholder="e.g. Flannel Shirt" value={formData.item_name} onChange={set('item_name')} />
            </Field>

            <Field label="Detail Category">
              <StyledSelect value={formData.detail_category_id} onChange={set('detail_category_id')}>
                <option value="">Select Category</option>
                {options.categories.map(c => <option key={c.id} value={c.id}>{c.detail_category}</option>)}
              </StyledSelect>
            </Field>

            <Field label="Item Type">
              <StyledSelect value={formData.item_type_id} onChange={set('item_type_id')}>
                <option value="">Select Type</option>
                {options.itemTypes.map(t => <option key={t.id} value={t.id}>{t.type_name}</option>)}
              </StyledSelect>
            </Field>

            <Field label="Port">
              <StyledSelect value={formData.port_id} onChange={set('port_id')}>
                <option value="">Select Port</option>
                {options.ports.map(p => <option key={p.id} value={p.id}>{p.port_name}</option>)}
              </StyledSelect>
            </Field>

            <Field label="Business Unit" hint="auto from Brand">
              <StyledInput type="text" readOnly disabled value={businessUnit} placeholder="Select Brand first..." />
            </Field>
            <Field label="Description" hint="optional">
              <StyledTextarea rows={2} placeholder="Product details..." value={formData.description} onChange={set('description')} />
            </Field>
          </div>

          {/* Similar sub-brands — toast popup */}
          {showSimilarToast && similarSubBrands.length > 0 && (
            <div style={{
              position: 'fixed', top: 24, right: 24, zIndex: 9999,
              width: 'min(380px, calc(100vw - 32px))',
              borderRadius: 18,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%)',
              border: '1px solid rgba(244,169,64,0.34)',
              boxShadow: '0 18px 48px rgba(26,42,87,0.18)',
              overflow: 'hidden',
              backdropFilter: 'blur(14px)',
              animation: 'slideInRight 0.25s ease',
            }}>
              <style>{`@keyframes slideInRight { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, padding: '0.9rem 1rem', background: 'linear-gradient(135deg, rgba(244,169,64,0.16) 0%, rgba(42,157,143,0.08) 100%)', borderBottom: '1px solid rgba(26,42,87,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span style={{ width: 32, height: 32, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#b45309', background: 'rgba(244,169,64,0.16)', border: '1px solid rgba(244,169,64,0.34)', flexShrink: 0 }}>
                    <Info size={16} />
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#182b58', lineHeight: 1.25 }}>
                    Similar Sub Brand — "{formData.sub_brand}"
                  </span>
                </div>
                <button type="button" onClick={() => setShowSimilarToast(false)}
                  style={{ width: 28, height: 28, borderRadius: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(26,42,87,0.08)', cursor: 'pointer', color: '#8496b0', padding: 0, flexShrink: 0 }}>
                  <X size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0.85rem 1rem 1rem' }}>
                {similarSubBrands.slice(0, 4).map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '0.65rem 0.75rem', borderRadius: 12, background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(26,42,87,0.07)', overflow: 'hidden' }}>
                    <span style={{ color: '#445674' }}><strong>{s.sub_brand}</strong> · {s.parent_name}</span>
                    <span style={{ minWidth: 48, textAlign: 'center', padding: '0.24rem 0.55rem', borderRadius: 999, background: 'rgba(42,157,143,0.10)', color: '#18786e', border: '1px solid rgba(42,157,143,0.22)', fontWeight: 800, fontSize: '0.72rem', flexShrink: 0 }}>{s.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="dashboard-popup__button dashboard-popup__button--secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="dashboard-popup__button dashboard-popup__button--primary" disabled={submitting}>
              {submitting
                ? <><span className="dashboard-popup__spinner" style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', marginRight: 6 }} />Saving...</>
                : <><Save size={15} style={{ marginRight: 6 }} />{isEdit ? 'Update' : 'Create'}</>
              }
            </button>
          </div>

        </form>
      </>
    );
  }

  // ── Page mode — layout asli dengan CardBigBox ───────────────────────────────
  return (
    <div className="animate-fade-in">
      <AlertModal open={!!alert} severity={alert?.severity} message={alert?.message} onClose={() => setAlert(null)} />

      <div className="d-flex align-items-center gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
        <CreateButton variant="icon" type="button" title="Back" onClick={handleCancel} style={{ width: 38, height: 38 }}>
          <ArrowLeft size={18} />
        </CreateButton>
        <div>
          <h1 style={{ marginBottom: 0 }}>{isEdit ? 'Edit Parent Item' : 'Add Parent Item'}</h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Fill in the form below to create a P-series SKU</p>
        </div>
      </div>

      <div className="d-flex gap-4" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <CardBigBox eyebrow={isEdit ? 'Edit Data' : 'New Data'} title="Parent Item" style={{ flex: '1 1 0', minWidth: '380px' }}>
          <div className="sku-preview-banner">
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Auto-Generated Parent Name</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {parentName || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 400 }}>Will be filled automatically...</span>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>SKU Preview</div>
              <div className="sku-code">{previewSKU}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
            <div className="form-grid">
              <div className="form-group">
                <label>Brand <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select required value={formData.brand_id} onChange={set('brand_id')}>
                  <option value="">-- Select Brand --</option>
                  {options.brands.map(b => <option key={b.id} value={b.id}>{b.brand_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Sub Brand</label>
                <input type="text" placeholder="e.g. Pro, Eco, Lite" value={formData.sub_brand} onChange={set('sub_brand')} />
              </div>
              <div className="form-group">
                <label>Item Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input type="text" required placeholder="e.g. Flannel Shirt" value={formData.item_name} onChange={set('item_name')} />
              </div>
              <div className="form-group">
                <label>Detail Category</label>
                <select value={formData.detail_category_id} onChange={set('detail_category_id')}>
                  <option value="">-- Select Category --</option>
                  {options.categories.map(c => <option key={c.id} value={c.id}>{c.detail_category}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Item Type</label>
                <select value={formData.item_type_id} onChange={set('item_type_id')}>
                  <option value="">-- Select Type --</option>
                  {options.itemTypes.map(t => <option key={t.id} value={t.id}>{t.type_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Port</label>
                <select value={formData.port_id} onChange={set('port_id')}>
                  <option value="">-- Select Port --</option>
                  {options.ports.map(p => <option key={p.id} value={p.id}>{p.port_name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Business Unit <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>(auto from Brand)</span></label>
                <input type="text" readOnly disabled value={businessUnit} placeholder="Select Brand first..." />
              </div>
            </div>
            <div className="form-group">
              <label>Description <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <textarea rows={3} placeholder="Product details..." value={formData.description} onChange={set('description')} style={{ resize: 'vertical' }} />
            </div>
            <div className="d-flex justify-content-between gap-3" style={{ marginTop: '0.25rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-outline" onClick={handleCancel}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <><span className="spinner" style={{ borderTopColor: '#fff', width: 14, height: 14 }} /> Saving...</> : <><Save size={16} /> {isEdit ? 'Update' : 'Save Parent Item'}</>}
              </button>
            </div>
          </form>
        </CardBigBox>

        <div style={{ flex: '1 1 0', minWidth: '300px', maxWidth: '420px' }}>
          {similarSubBrands.length > 0 ? (
            <CardBigBox eyebrow="Warning" title="Similar Sub Brand Found" description={`Similar to "${formData.sub_brand}"`}
              style={{ borderColor: 'var(--warning-border)', background: 'var(--warning-light)' }}>
              <DataTable rows={similarSubBrands}
                columns={[
                  { key: 'sub_brand', header: 'Sub Brand', accessor: 'sub_brand' },
                  { key: 'parent_name', header: 'Parent Name', accessor: 'parent_name' },
                  { key: 'score', header: 'Match', headerStyle: { textAlign: 'center' }, cellStyle: { textAlign: 'center' }, render: (r) => <DataTableStatus variant="warning" inline>{r.score}%</DataTableStatus> },
                ]}
                tableLabel="Similar Sub Brands" />
            </CardBigBox>
          ) : (
            <CardBigBox style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, borderStyle: 'dashed', background: 'var(--bg-surface-2)', color: 'var(--text-muted)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', opacity: 0.2, marginBottom: '0.75rem' }}>✓</div>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.875rem' }}>Sub Brand Duplicate Check</div>
              <p style={{ margin: 0, fontSize: '0.8rem' }}>Type a <strong>Sub Brand</strong> to see similar name suggestions.</p>
            </CardBigBox>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Styled helpers untuk modal mode ──────────────────────────────────────────

function Field({ label, hint, required, children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#445674', display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        {required && <span style={{ color: '#e05252', lineHeight: 1 }}>*</span>}
        {hint && <span style={{ fontWeight: 400, color: '#8496b0', fontSize: '0.72rem' }}>({hint})</span>}
      </label>
      {children}
    </div>
  );
}

const inputBase = {
  width: '100%', padding: '0.6rem 0.85rem',
  border: '1px solid rgba(26,42,87,0.16)', borderRadius: 10,
  background: 'rgba(248,250,252,0.9)', color: '#182b58',
  fontSize: '0.875rem', fontFamily: 'inherit',
  outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
};

function StyledInput(props) {
  return (
    <input
      {...props}
      style={{ ...inputBase, ...(props.disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}), ...props.style }}
      onFocus={e => { e.target.style.borderColor = 'rgba(42,157,143,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(42,157,143,0.12)'; e.target.style.background = '#fff'; }}
      onBlur={e  => { e.target.style.borderColor = 'rgba(26,42,87,0.16)';   e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(248,250,252,0.9)'; }}
    />
  );
}

function StyledSelect({ children, ...props }) {
  return (
    <select
      {...props}
      style={{
        ...inputBase,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%232a9d8f' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem center',
        paddingRight: '2.2rem', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer',
        ...props.style,
      }}
      onFocus={e => { e.target.style.borderColor = 'rgba(42,157,143,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(42,157,143,0.12)'; e.target.style.background = '#fff'; }}
      onBlur={e  => { e.target.style.borderColor = 'rgba(26,42,87,0.16)';   e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(248,250,252,0.9)'; }}
    >
      {children}
    </select>
  );
}

function StyledTextarea(props) {
  return (
    <textarea
      {...props}
      style={{ ...inputBase, resize: 'vertical', lineHeight: 1.6, ...props.style }}
      onFocus={e => { e.target.style.borderColor = 'rgba(42,157,143,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(42,157,143,0.12)'; e.target.style.background = '#fff'; }}
      onBlur={e  => { e.target.style.borderColor = 'rgba(26,42,87,0.16)';   e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(248,250,252,0.9)'; }}
    />
  );
}
