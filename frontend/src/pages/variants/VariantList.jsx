import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Search,
  Box,
  Edit,
  Trash2,
  ChevronDown,
  FileSpreadsheet,
  X,
  BadgeCheck,
  Clock3,
  Info,
  Layers3,
  ListChecks,
  PackageCheck,
  Palette,
  SlidersHorizontal,
  Truck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import variantsService from '../../services/variantsService';
import useVariantList from './useVariantList';
import DialogDelete from '../../components/Dialog/DialogDelete';
import AlertModal from '../../components/AlertModal';
import DataTable, { DataTableStatus } from '../../components/table/DataTable';
import CreateButton from '../../components/button/CreateButton';
import VariantForm from './VariantForm';

const PAGE_SIZES     = [10, 25, 50, 100];
const STATUS_OPTIONS = ['ACTIVE', 'NON ACTIVE', 'DISCONTINUE', 'HOLD DEVELOPMENT', 'NEW DEVELOPMENT', 'FINANCE'];
const CHANNEL_OPTIONS = ['B2B', 'ECOM', 'FACTORY', 'GT', 'STORE'];

const STATUS_VARIANT = {
  'ACTIVE':           'active',
  'NON ACTIVE':       'inactive',
  'DISCONTINUE':      'inactive',
  'HOLD DEVELOPMENT': 'pending',
  'NEW DEVELOPMENT':  'app',
  'FINANCE':          'active',
};

const fmt = (dateStr) =>
  new Date(dateStr).toLocaleString('en-GB', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

function buildPaginationItems(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const items = [1];
  if (page > 3) items.push('...');
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) items.push(i);
  if (page < totalPages - 2) items.push('...');
  if (totalPages > 1) items.push(totalPages);
  return items;
}

function PageSizeDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
        height: 40, padding: '0 0.9rem',
        border: `1px solid ${open ? 'rgba(42,157,143,0.45)' : 'rgba(26,42,87,0.14)'}`,
        borderRadius: 999, background: open ? 'rgba(42,157,143,0.06)' : 'rgba(255,255,255,0.9)',
        color: '#5a6b88', fontSize: '0.875rem', fontWeight: 400,
        cursor: 'pointer', whiteSpace: 'nowrap', transition: 'border-color 0.2s, background 0.2s',
      }}>
        {value}
        <ChevronDown size={13} style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, zIndex: 50,
          background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(26,42,87,0.10)', borderRadius: 12,
          boxShadow: '0 12px 32px rgba(26,42,87,0.12)', overflow: 'hidden', minWidth: 72,
        }}>
          {options.map(n => (
            <button key={n} type="button" onClick={() => { onChange(n); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', minHeight: 36, padding: '8px 12px',
                background: n === value ? 'rgba(42,157,143,0.10)' : 'transparent',
                border: 'none', cursor: 'pointer', fontSize: '0.875rem',
                fontWeight: n === value ? 700 : 500,
                color: n === value ? '#18786e' : '#445674', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (n !== value) e.currentTarget.style.background = 'rgba(26,42,87,0.04)'; }}
              onMouseLeave={e => { if (n !== value) e.currentTarget.style.background = 'transparent'; }}
            >
              <span>{n}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function VariantFormModal({ modalId, onClose, onSaved }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div
      className="dashboard-popup-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: 'min(96vw, 1120px)',
        maxHeight: '92dvh',
        borderRadius: 24,
        background: '#fff',
        boxShadow: '0 28px 80px rgba(10,18,40,0.32)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div className="dashboard-popup__header">
          <div>
            <p className="dashboard-popup__eyebrow">
              {modalId ? 'Edit Data' : 'New Data'}
            </p>
            <h2 className="dashboard-popup__title">
              {modalId ? 'Edit Variant Item' : 'Add Variant Item'}
            </h2>
          </div>
          <button type="button" className="dashboard-popup__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
          <VariantForm modalId={modalId} onClose={onClose} onSaved={onSaved} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function VariantList() {
  const { isProductDivision } = useAuth();

  const {
    variants, loading, error,
    totalItems, totalPages, page, pageSize, search,
    setSearch, setPage, setPageSize, refetch,
  } = useVariantList();

  const [deleteTarget,    setDeleteTarget]    = useState(null);
  const [alert,           setAlert]           = useState(null);
  const [formModal,       setFormModal]       = useState(null);
  const [isSelecting,     setIsSelecting]     = useState(false);
  const [selectedIds,     setSelectedIds]     = useState([]);
  const [selectedStatus,  setSelectedStatus]  = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');

  const showAlert = (severity, message) => setAlert({ severity, message });
  const canEdit   = isProductDivision();

  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === variants.length ? [] : variants.map(v => v.id));
  const toggleSelect = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const cancelSelect = () => {
    setIsSelecting(false); setSelectedIds([]);
    setSelectedStatus(''); setSelectedChannel('');
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await variantsService.remove(deleteTarget.id);
      showAlert('success', res.data.message);
      refetch();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to delete item.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleBulkApply = async () => {
    try {
      const updates = [];

      if (selectedStatus) {
        updates.push(variantsService.bulkUpdateStatus(selectedIds, selectedStatus));
      }

      if (selectedChannel) {
        const channel = selectedChannel === 'CLEAR' ? '' : selectedChannel;
        updates.push(variantsService.bulkUpdateChannel(selectedIds, channel));
      }

      const results = await Promise.all(updates);
      const message = results.map(res => res.data.message).filter(Boolean).join(' ');

      showAlert('success', message || 'Bulk update applied.');
      cancelSelect(); refetch();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to apply bulk update.');
    }
  };

  const handleExport = () =>
    window.open(`/api/search/export?type=variant&format=excel&search=${search}`, '_blank');

  const hasValue = (v) => v !== null && v !== undefined && v !== '';

  const columns = [
    ...(isSelecting ? [{
      key: 'select',
      header: (
        <input type="checkbox"
          checked={selectedIds.length === variants.length && variants.length > 0}
          onChange={toggleSelectAll}
          style={{ cursor: 'pointer' }}
        />
      ),
      headerStyle: { width: 44, textAlign: 'center' },
      cellStyle: { textAlign: 'center' },
      render: (row) => (
        <div onClick={e => e.stopPropagation()}>
          <input type="checkbox"
            checked={selectedIds.includes(row.id)}
            onChange={() => toggleSelect(row.id)}
            style={{ cursor: 'pointer' }}
          />
        </div>
      ),
    }] : []),
    {
      key: 'variant_sku',
      header: 'Item ID',
      render: (row) => (
        <DataTableStatus variant="active" inline>{row.variant_sku}</DataTableStatus>
      ),
    },
    {
      key: 'item_name',
      header: 'Item Name',
      render: (row) => {
        const name = [row.parent_name, row.model_type, row.color_size, row.size_color]
          .filter(Boolean).join(' ');
        return <span style={{ fontWeight: 600 }}>{name || '-'}</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => row.status
        ? <DataTableStatus variant={STATUS_VARIANT[row.status] || 'app'} inline>{row.status}</DataTableStatus>
        : '-',
    },
    {
      key: 'business_unit',
      header: 'Business Unit',
      render: (row) => row.business_unit
        ? <DataTableStatus variant="app" inline>{row.business_unit}</DataTableStatus>
        : '-',
    },
    {
      key: 'channel',
      header: 'Channel',
      render: (row) => row.channel || '-',
    },
    {
      key: 'actions',
      header: 'Actions',
      headerStyle: { textAlign: 'center' },
      cellStyle:   { textAlign: 'center' },
      render: (row) => (
        <div className="d-flex gap-2" style={{ justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
          {canEdit && (
            <>
              <button className="users-table__icon-button" title="Edit"
                onClick={() => setFormModal(row.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Edit size={15} />
              </button>
              <CreateButton variant="icon" tone="danger" type="button" title="Delete"
                onClick={() => setDeleteTarget(row)}>
                <Trash2 size={15} />
              </CreateButton>
            </>
          )}
        </div>
      ),
    },
  ];

  const detail = {
    eyebrow:     'Variant Item',
    title:       (row) => [row.parent_name, row.model_type].filter(Boolean).join(' — '),
    description: (row) => row.variant_sku,
    buttonLabel: 'Details',
    buttonIcon: Info,
    sections: (row) => [
      {
        title: 'Identity',
        icon: BadgeCheck,
        tone: 'accent',
        fields: [
          { label: 'Variant SKU', value: row.variant_sku },
          { label: 'Parent SKU',  value: row.parent_sku  },
          { label: 'Parent Name', value: row.parent_name },
        ].filter(f => hasValue(f.value)),
      },
      {
        title: 'Variant',
        icon: Palette,
        tone: 'success',
        fields: [
          { label: 'Model / Type', value: row.model_type },
          { label: 'Color / Size', value: row.color_size },
          { label: 'Size / Color', value: row.size_color },
        ].filter(f => hasValue(f.value)),
      },
      {
        title: 'Logistics',
        icon: Truck,
        tone: 'warning',
        fields: [
          { label: 'Unit (UoM)',    value: row.unit                                  },
          { label: 'Qty / Pack',   value: row.qty_pack                              },
          { label: 'Net Weight',   value: row.weight_gr       ? `${row.weight_gr} g`       : null },
          { label: 'Gross Weight', value: row.gross_weight_gr ? `${row.gross_weight_gr} g` : null },
          { label: 'L (cm)',       value: row.dimension_l                           },
          { label: 'W (cm)',       value: row.dimension_w                           },
          { label: 'H (cm)',       value: row.height_cm                             },
        ].filter(f => hasValue(f.value)),
      },
      {
        title: 'Classification',
        icon: Layers3,
        tone: 'info',
        fields: [
          { label: 'Business Unit',   value: row.business_unit  },
          { label: 'Brand Category',  value: row.brand_category },
          { label: 'Channel',         value: row.channel        },
          { label: 'PIC',             value: row.pic            },
        ].filter(f => hasValue(f.value)),
      },
      {
        title: 'Timestamps',
        icon: Clock3,
        tone: 'warning',
        fields: [
          { label: 'Created',       value: row.created_at ? fmt(row.created_at) : '-' },
          ...(row.updated_at ? [{ label: 'Last Modified', value: fmt(row.updated_at) }] : []),
        ],
      },
      ...(row.notes ? [{
        title: 'Notes',
        icon: ListChecks,
        tone: 'accent',
        wide: true,
        fields: [{ label: 'Notes', value: row.notes }],
      }] : []),
    ].filter(s => s.fields.length > 0),
  };

  return (
    <div className="vl-root animate-fade-in">
      <style>{`
        .vl-root { height: 100%; display: flex; flex-direction: column; }
        .vl-panel {
          flex: 1; min-height: 0; display: flex; flex-direction: column;
          padding: 0 !important;
        }
        .vl-table-area {
          flex: 1; min-height: 0; display: flex; flex-direction: column;
          overflow: hidden; padding: 0 24px 20px;
        }
        .vl-root .users-table-wrapper { flex: 1; min-height: 0; max-height: none; margin-top: 10px; }
        .vl-root .users-table { min-width: 0 !important; width: 100%; }
        .vl-root .users-table th { background: rgba(246,248,250,0.98); backdrop-filter: blur(8px); }
        .vl-root .users-table-pagination { flex-shrink: 0; padding-top: 10px; }
        .vl-root td .users-table__status--app,
        .vl-root td .users-table__status--active { padding: 0.32rem 0.75rem; font-size: 0.78rem; font-weight: 700; border-radius: 8px; letter-spacing: 0.02em; }
        .vl-root .users-table-card__action {
          box-shadow: none;
          min-height: 40px;
          font-size: 0.875rem;
          padding: 0 1.1rem;
          color: #fff !important;
          text-decoration: none !important;
        }
        .vl-root .users-table-card__action:hover {
          transform: none;
          box-shadow: none;
          background: linear-gradient(135deg, #1f9b8e 0%, #136e65 100%);
          color: #fff !important;
        }
        .vl-root .search-wrapper input {
          height: 40px;
          border-radius: 999px;
          padding-left: 2.4rem;
          padding-right: 1rem;
          font-size: 0.875rem;
          border: 1px solid rgba(26,42,87,0.14);
          background: rgba(255,255,255,0.9);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .vl-root .search-wrapper input:hover {
          border-color: rgba(42,157,143,0.4);
          background: #fff;
        }
        .vl-root .search-wrapper input:focus {
          border-color: rgba(42,157,143,0.55);
          box-shadow: 0 0 0 3px rgba(42,157,143,0.12);
          outline: none;
          background: #fff;
        }
        .vl-root .users-table__detail-shell { max-height: none; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; }
        .vl-root .users-table__detail-section--wide { grid-column: 1 / -1; }
        .vl-root .users-table__accordion-row td { padding: 0 0 12px 0; }
        .vl-root .users-table__accordion { margin: 0; padding: 1.1rem 1.25rem 1.25rem; }
        .vl-root .users-table__detail-row { border-bottom: 1px solid rgba(26,42,87,0.05); padding: 0.4rem 0; }
        .vl-root .users-table__detail-label { font-size: 0.67rem; color: #8496b0; }
        .vl-root .users-table__detail-value { font-size: 0.85rem; }
        .vl-toolbar-button {
          height: 40px;
          padding: 0 1rem;
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
        }
        .vl-toolbar-button--select {
          border: 1px solid rgba(245,158,11,0.35);
          background: rgba(245,158,11,0.08);
          color: #b45309;
        }
        .vl-toolbar-button--select-active {
          border: 1px solid rgba(26,42,87,0.14);
          background: #fff;
          color: #5a6b88;
        }
        .vl-toolbar-button--export {
          border: 1px solid rgba(22,163,74,0.3);
          background: rgba(22,163,74,0.07);
          color: #15803d;
        }
        .vl-bulk {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          padding: 10px 24px; background: rgba(42,157,143,0.05);
          border-bottom: 1px solid rgba(42,157,143,0.15); flex-shrink: 0;
        }
        .vl-bulk select {
          height: 36px; padding: 0 0.75rem;
          border: 1px solid rgba(26,42,87,0.14); border-radius: 8px;
          background: #fff; color: #182b58; font-size: 0.82rem; cursor: pointer;
          appearance: none; -webkit-appearance: none;
        }
        .vl-bulk-btn {
          height: 36px; padding: 0 1rem;
          background: linear-gradient(135deg, var(--accent-teal,#2a9d8f) 0%, #1a7a72 100%);
          color: #fff; border: none; border-radius: 8px;
          font-size: 0.82rem; font-weight: 700; cursor: pointer;
          display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
        }
        .vl-bulk-btn:disabled { opacity: 0.45; cursor: not-allowed; }
      `}</style>

      <DialogDelete
        isOpen={!!deleteTarget}
        eyebrow="Delete Variant Item"
        title={`Delete ${deleteTarget?.variant_sku}?`}
        user={{ name: [deleteTarget?.parent_name, deleteTarget?.model_type].filter(Boolean).join(' — ') }}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
      <AlertModal open={!!alert} severity={alert?.severity} message={alert?.message} onClose={() => setAlert(null)} />

      {formModal !== null && (
        <VariantFormModal
          modalId={formModal === 'new' ? undefined : formModal}
          onClose={() => setFormModal(null)}
          onSaved={() => { refetch(); }}
        />
      )}

      <section className="dashboard-card vl-panel">

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '0.75rem', padding: '20px 24px 18px',
          borderBottom: '1px solid rgba(26,42,87,0.08)', flexShrink: 0, flexWrap: 'wrap',
        }}>
          <div style={{ minWidth: 0 }}>
            <p className="dashboard-panel__eyebrow" style={{ marginBottom: 5 }}>Master Data</p>
            <h2 className="dashboard-panel__title" style={{ marginBottom: 0 }}>Variant Items</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div className="search-wrapper" style={{ maxWidth: 280, flex: '1 1 200px' }}>
              <Search size={15} className="search-icon" />
              <input type="text" placeholder="Search SKU, parent, model..."
                value={search} onChange={e => setSearch(e.target.value)}
                disabled={isSelecting}
              />
            </div>

            {canEdit && (
              <button type="button"
                onClick={() => isSelecting ? cancelSelect() : setIsSelecting(true)}
                className={`vl-toolbar-button ${isSelecting ? 'vl-toolbar-button--select-active' : 'vl-toolbar-button--select'}`}>
                <SlidersHorizontal size={14} />
                {isSelecting ? 'Cancel' : 'Multi Select'}
              </button>
            )}

            <button type="button" onClick={handleExport}
              className="vl-toolbar-button vl-toolbar-button--export">
              <FileSpreadsheet size={14} /> Export
            </button>

            {canEdit && (
              <button type="button" className="users-table-card__action"
                onClick={() => setFormModal('new')}>
                <Plus size={16} aria-hidden="true" />
                Add Variant
              </button>
            )}
          </div>
        </div>

        {/* Bulk toolbar */}
        {isSelecting && (
          <div className="vl-bulk">
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#18786e', whiteSpace: 'nowrap' }}>
              {selectedIds.length} selected
            </span>
            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
              <option value="">Set Status...</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)}>
              <option value="">Set Channel...</option>
              <option value="CLEAR">Clear Channel</option>
              {CHANNEL_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="vl-bulk-btn" onClick={handleBulkApply}
              disabled={!selectedIds.length || (!selectedStatus && !selectedChannel)}>
              <PackageCheck size={14} /> Apply
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: '10px 24px', flexShrink: 0 }}>
            <div style={{ padding: '0.75rem 1rem', background: 'var(--danger-light)', border: '1.5px solid var(--danger-border)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.875rem' }}>
              {error}
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 10 }}>
            <span className="spinner" /> Loading data...
          </div>
        ) : (
          <div className="vl-table-area">
            <DataTable
              rows={variants}
              columns={columns}
              detail={isSelecting ? null : detail}
              getRowClassName={(row) => selectedIds.includes(row.id) ? 'users-table__row--expanded' : ''}
              emptyMessage={
                <div className="empty-state">
                  <Box size={36} style={{ opacity: 0.25 }} />
                  <p>No data found</p>
                </div>
              }
              tableLabel="Variant Items Table"
            />
          </div>
        )}

        {/* Pagination footer */}
        {!loading && totalItems > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '1rem', flexWrap: 'wrap', padding: '12px 24px 20px', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="users-table-pagination__summary">
                Showing {variants.length} of {totalItems.toLocaleString()} records
              </span>
              <PageSizeDropdown value={pageSize} options={PAGE_SIZES} onChange={setPageSize} />
            </div>
            <div className="users-table-pagination__controls">
              <button className="users-table-pagination__button" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                Previous
              </button>
              {buildPaginationItems(page, totalPages).map((item, idx) =>
                typeof item === 'number' ? (
                  <button key={item}
                    className={`users-table-pagination__button${item === page ? ' users-table-pagination__button--active' : ''}`}
                    onClick={() => setPage(item)} aria-current={item === page ? 'page' : undefined}>
                    {item}
                  </button>
                ) : (
                  <span key={`e${idx}`} className="users-table-pagination__ellipsis">…</span>
                )
              )}
              <button className="users-table-pagination__button" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                Next
              </button>
            </div>
          </div>
        )}

      </section>
    </div>
  );
}
