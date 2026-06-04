import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Trash2, Package, PackageSearch } from 'lucide-react';

const inputStyle = {
  width: '100%', padding: '0.6rem 0.85rem',
  border: '1px solid rgba(26,42,87,0.14)', borderRadius: 10,
  background: '#fff', color: '#182b58',
  fontSize: '0.875rem', fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const focusHandlers = {
  onFocus: e => {
    e.target.style.borderColor = 'rgba(42,157,143,0.55)';
    e.target.style.boxShadow  = '0 0 0 3px rgba(42,157,143,0.12)';
  },
  onBlur: e => {
    e.target.style.borderColor = 'rgba(26,42,87,0.14)';
    e.target.style.boxShadow  = 'none';
  },
};

const sectionStyle = {
  padding: '1.125rem',
  borderRadius: 14,
  border: '1px solid rgba(26,42,87,0.08)',
  background: 'rgba(248,250,252,0.6)',
};

function FieldLabel({ children, hint, required }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 4,
      fontSize: '0.8rem', fontWeight: 600, color: '#445674', marginBottom: 5,
    }}>
      {children}
      {required && <span style={{ color: '#e05252' }}>*</span>}
      {hint && <span style={{ fontWeight: 400, color: '#8496b0', fontSize: '0.72rem' }}>({hint})</span>}
    </label>
  );
}

export default function BundleComposer({ onSaved, onSubmittingChange }) {
  const [formData,         setFormData]         = useState({ bundle_name: '', description: '' });
  const [searchVariant,    setSearchVariant]    = useState('');
  const [variantResults,   setVariantResults]   = useState([]);
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [previewSKU,       setPreviewSKU]       = useState('68YY--------');

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
    if (!selectedVariants.length) return alert('Please select at least 1 Variant Item.');
    onSubmittingChange?.(true);
    try {
      await axios.post('/api/bundles', {
        bundle_name:  formData.bundle_name,
        description:  formData.description,
        variants: selectedVariants.map(v => ({ variant_id: v.variant.id, quantity: v.qty })),
      });
      onSaved?.();
    } catch (err) {
      alert(err.response?.data?.message || 'A server error occurred.');
    } finally {
      onSubmittingChange?.(false);
    }
  };

  const totalQty = selectedVariants.reduce((sum, v) => sum + v.qty, 0);

  return (
    <form
      id="bundle-composer-form"
      onSubmit={handleSubmit}
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'flex-start' }}
    >

      {/* ── LEFT ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* SKU Preview */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.875rem 1.125rem',
          background: 'rgba(233,196,106,0.08)', border: '1.5px dashed rgba(233,196,106,0.45)',
          borderRadius: 14,
        }}>
          <div>
            <div style={{
              fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: '#8496b0', marginBottom: 4,
            }}>
              Bundle SKU Preview
            </div>
            <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.3rem', color: '#b45309', letterSpacing: 2 }}>
              {previewSKU}
            </div>
          </div>
          <PackageSearch size={26} style={{ color: '#b45309', opacity: 0.3 }} />
        </div>

        {/* Form fields */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <FieldLabel required>Bundle Name</FieldLabel>
              <input
                type="text"
                required
                placeholder="e.g. Holiday Family Package"
                value={formData.bundle_name}
                onChange={e => setFormData({ ...formData, bundle_name: e.target.value })}
                style={inputStyle}
                {...focusHandlers}
              />
            </div>
            <div>
              <FieldLabel hint="optional">Promo Description</FieldLabel>
              <textarea
                rows={3}
                placeholder="Bundle notes..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={{ ...inputStyle, resize: 'vertical' }}
                {...focusHandlers}
              />
            </div>
          </div>
        </div>

        {/* Variant Search */}
        <div style={sectionStyle}>
          <h4 style={{
            margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: 700, color: '#182b58',
            display: 'flex', alignItems: 'center', gap: '0.45rem',
          }}>
            <Search size={14} style={{ color: '#2a9d8f' }} />
            Search &amp; Add Variant
          </h4>

          <div style={{ position: 'relative' }}>
            <Search size={14} style={{
              position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)',
              color: '#8496b0', pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="Type SKU or variant name..."
              value={searchVariant}
              onChange={e => setSearchVariant(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '2.3rem' }}
              {...focusHandlers}
            />

            {variantResults.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20,
                background: 'rgba(255,255,255,0.99)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(26,42,87,0.10)', borderRadius: 12,
                boxShadow: '0 12px 32px rgba(26,42,87,0.14)', overflow: 'hidden',
              }}>
                {variantResults.map(v => (
                  <div
                    key={v.id}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.65rem 1rem', borderBottom: '1px solid rgba(26,42,87,0.06)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,42,87,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{
                        display: 'inline-flex', padding: '0.18rem 0.55rem', borderRadius: 6,
                        background: 'rgba(42,157,143,0.10)', color: '#18786e',
                        fontSize: '0.73rem', fontWeight: 700, fontFamily: 'monospace',
                        marginRight: '0.45rem',
                      }}>
                        {v.variant_sku}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#445674' }}>
                        {v.parent_name}{v.model_type ? ` — ${v.model_type}` : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddVariant(v)}
                      style={{
                        height: 30, padding: '0 0.7rem', flexShrink: 0, marginLeft: '0.5rem',
                        border: 'none', borderRadius: 7, cursor: 'pointer',
                        background: 'linear-gradient(135deg, #2a9d8f 0%, #1f8b7e 100%)',
                        color: '#fff', fontSize: '0.76rem', fontWeight: 700,
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Composition ──────────────────────────────────────────── */}
      <div style={{ ...sectionStyle, display: 'flex', flexDirection: 'column', gap: '0.875rem', minHeight: 360 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h4 style={{
            margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#182b58',
            display: 'flex', alignItems: 'center', gap: '0.45rem',
          }}>
            <Package size={14} style={{ color: '#b45309' }} />
            Bundle Composition
          </h4>
          {selectedVariants.length > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '0.22rem 0.6rem',
              borderRadius: 8, background: 'rgba(233,196,106,0.15)', border: '1px solid rgba(233,196,106,0.3)',
              color: '#b45309', fontSize: '0.72rem', fontWeight: 700,
            }}>
              {selectedVariants.length} variant · {totalQty} qty
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {selectedVariants.map(item => (
            <div
              key={item.variant.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.875rem',
                padding: '0.75rem 0.875rem',
                border: '1px solid rgba(26,42,87,0.08)', borderRadius: 10,
                background: '#fff',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: 3 }}>
                  <span style={{
                    display: 'inline-flex', padding: '0.18rem 0.55rem', borderRadius: 6,
                    background: 'rgba(42,157,143,0.10)', color: '#18786e',
                    fontSize: '0.73rem', fontWeight: 700, fontFamily: 'monospace',
                  }}>
                    {item.variant.variant_sku}
                  </span>
                </div>
                <div style={{
                  fontSize: '0.82rem', fontWeight: 500, color: '#182b58',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.variant.parent_name}
                  {item.variant.color_size ? ` (${item.variant.color_size})` : ''}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#8496b0', marginTop: 1 }}>
                  Unit: {item.variant.unit} · Qty/Pack: {item.variant.qty_pack}
                </div>
              </div>

              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                <div style={{
                  fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: '#8496b0', marginBottom: 3,
                }}>
                  Qty
                </div>
                <input
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={e => handleQtyChange(item.variant.id, e.target.value)}
                  style={{
                    width: 58, padding: '0.3rem 0.4rem', textAlign: 'center',
                    fontSize: '0.88rem', fontWeight: 700,
                    border: '1px solid rgba(26,42,87,0.14)', borderRadius: 7,
                    background: '#fff', color: '#182b58', outline: 'none',
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => handleRemoveVariant(item.variant.id)}
                className="users-table__icon-button users-table__icon-button--danger"
                title="Remove"
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {selectedVariants.length === 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              flex: 1, minHeight: 140,
              border: '1.5px dashed rgba(26,42,87,0.10)', borderRadius: 10,
              color: '#8496b0', textAlign: 'center', padding: '2rem', gap: '0.5rem',
            }}>
              <Package size={26} style={{ opacity: 0.22 }} />
              <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.6 }}>
                No variants added yet.<br />Search and add from the left panel.
              </p>
            </div>
          )}
        </div>
      </div>

    </form>
  );
}
