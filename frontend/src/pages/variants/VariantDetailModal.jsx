import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Box } from 'lucide-react';

const Field = ({ label, value, full }) => (
  <div className={`detail-item${full ? ' full-width' : ''}`}>
    <span className="detail-item-label">{label}</span>
    <span className="detail-item-value">
      {value !== null && value !== undefined && value !== '' ? value : '-'}
    </span>
  </div>
);

const fmt = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleString('id-ID') : '-';

export default function VariantDetailModal({ item, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
    };
  }, [onClose]);

  const hasDimension = item.dimension_l || item.dimension_w || item.dimension_h;
  const dimensionStr = hasDimension
    ? `${item.dimension_l || '?'} × ${item.dimension_w || '?'} × ${item.height_cm || '?'}`
    : null;

  return createPortal(
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box variant-detail-modal">

        {/* Header */}
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
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="detail-grid">

            <span className="modal-section-label">Identitas</span>
            <Field label="Variant SKU"  value={item.variant_sku} />
            <Field label="Parent SKU"   value={item.parent_sku} />
            <Field label="Parent Name"  value={item.parent_name} full />
            <Field label="Model / Type" value={item.model_type}  full />

            <span className="modal-section-label">Varian</span>
            <Field label="Color / Size" value={item.color_size} />
            <Field label="Size / Color" value={item.size_color} />

            <span className="modal-section-label">Logistik</span>
            <Field label="Unit (UoM)"         value={item.unit} />
            <Field label="Qty per Pack"        value={item.qty_pack} />
            <Field label="Net Weight"          value={item.weight_gr       ? `${item.weight_gr} g`       : null} />
            <Field label="Gross Weight"        value={item.gross_weight_gr ? `${item.gross_weight_gr} g` : null} />
            <Field label="Dimensi (P×L×T cm)" value={dimensionStr} full />

            {item.notes && (
              <>
                <span className="modal-section-label">Catatan</span>
                <Field label="Notes" value={item.notes} full />
              </>
            )}

            <span className="modal-section-label">Waktu</span>
            <Field label="Dibuat"        value={fmt(item.created_at)} />
            <Field label="Terakhir Edit" value={fmt(item.updated_at)} />

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
