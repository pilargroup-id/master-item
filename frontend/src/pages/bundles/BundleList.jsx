import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
  Plus, Search, Trash2, FileSpreadsheet, PackageSearch,
  ChevronDown, BadgeCheck, Clock3, Info, X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DataTable, { DataTableStatus } from '../../components/table/DataTable';
import CreateButton from '../../components/button/CreateButton';
import DialogDelete from '../../components/Dialog/DialogDelete';
import AlertModal from '../../components/AlertModal';
import BundleComposer from './BundleComposer';

const PAGE_SIZES = [10, 25, 50, 100];

const fmt = (dateStr) =>
  new Date(dateStr).toLocaleString('en-GB', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

// ── Helpers ───────────────────────────────────────────────────────────────────

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
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
          height: 40, padding: '0 0.9rem',
          border: `1px solid ${open ? 'rgba(42,157,143,0.45)' : 'rgba(26,42,87,0.14)'}`,
          borderRadius: 999,
          background: open ? 'rgba(42,157,143,0.06)' : 'rgba(255,255,255,0.9)',
          color: '#5a6b88', fontSize: '0.875rem', fontWeight: 400,
          cursor: 'pointer', whiteSpace: 'nowrap',
          transition: 'border-color 0.2s, background 0.2s',
        }}
      >
        {value} / page
        <ChevronDown size={13} style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, zIndex: 50,
          background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(26,42,87,0.10)', borderRadius: 12,
          boxShadow: '0 12px 32px rgba(26,42,87,0.12)', overflow: 'hidden', minWidth: 80,
        }}>
          {options.map(n => (
            <button
              key={n}
              type="button"
              onClick={() => { onChange(n); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '100%', minHeight: 36, padding: '8px 12px',
                background: n === value ? 'rgba(42,157,143,0.10)' : 'transparent',
                border: 'none', cursor: 'pointer', fontSize: '0.875rem',
                fontWeight: n === value ? 700 : 500,
                color: n === value ? '#18786e' : '#445674',
              }}
              onMouseEnter={e => { if (n !== value) e.currentTarget.style.background = 'rgba(26,42,87,0.04)'; }}
              onMouseLeave={e => { if (n !== value) e.currentTarget.style.background = 'transparent'; }}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Bundle Composer Modal ─────────────────────────────────────────────────────

function BundleComposerModal({ onClose, onSaved }) {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return createPortal(
    <div
      className="dashboard-popup-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: 'min(96vw, 1060px)',
        maxHeight: '92dvh',
        borderRadius: 24,
        background: '#fff',
        boxShadow: '0 28px 80px rgba(10,18,40,0.32)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div className="dashboard-popup__header">
          <div>
            <p className="dashboard-popup__eyebrow">New Data</p>
            <h2 className="dashboard-popup__title">Bundle Composer</h2>
          </div>
          <button type="button" className="dashboard-popup__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '1.5rem' }}>
          <BundleComposer onSaved={onSaved} onSubmittingChange={setSubmitting} />
        </div>

        {/* Footer — sticky at bottom */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(26,42,87,0.08)',
          background: '#fff', flexShrink: 0,
        }}>
          <button
            type="button"
            className="dashboard-popup__button dashboard-popup__button--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="bundle-composer-form"
            className="dashboard-popup__button dashboard-popup__button--primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span style={{
                  width: 14, height: 14,
                  border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                  borderRadius: '50%', display: 'inline-block', marginRight: 6,
                  animation: 'spin 0.7s linear infinite',
                }} />
                Saving...
              </>
            ) : (
              'Save Bundle'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Composition section — lazy-loaded inside accordion ────────────────────────

function CompositionSection({ bundleId }) {
  const [items,   setItems]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/bundles/${bundleId}`)
      .then(res => { if (res.data.success) setItems(res.data.data.details || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [bundleId]);

  return (
    <div style={{ marginBottom: '0.75rem', borderRadius: 12, border: '1px solid rgba(26,42,87,0.08)', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.55rem 1rem',
        background: 'rgba(42,157,143,0.06)', borderBottom: '1px solid rgba(42,157,143,0.12)',
      }}>
        <PackageSearch size={13} style={{ color: '#18786e' }} />
        <span style={{
          fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: '#18786e',
        }}>
          Bundle Composition
        </span>
      </div>

      {loading ? (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#8496b0', fontSize: '0.82rem' }}>
          <span className="spinner" /> Loading...
        </div>
      ) : (
        <table className="users-table" style={{ minWidth: 0 }}>
          <thead>
            <tr>
              <th>Variant SKU</th>
              <th>Model / Type</th>
              <th style={{ textAlign: 'right' }}>Qty</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((d, i) => (
              <tr key={i}>
                <td><DataTableStatus variant="active" inline>{d.variant_sku}</DataTableStatus></td>
                <td style={{ fontSize: '0.875rem' }}>{d.model_type || '-'}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.875rem' }}>{d.qty}</td>
              </tr>
            ))}
            {(!items || items.length === 0) && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '1.5rem', color: '#8496b0' }}>
                  No variants found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── BundleList ────────────────────────────────────────────────────────────────

export default function BundleList() {
  const [bundles,      setBundles]      = useState([]);
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);
  const [pageSize,     setPageSize]     = useState(25);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalItems,   setTotalItems]   = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [alert,         setAlert]         = useState(null);
  const [showComposer,  setShowComposer]  = useState(false);
  const { isProductDivision } = useAuth();
  const canEdit = isProductDivision();

  const fetchBundles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/bundles', {
        params: { search, page, limit: pageSize },
      });
      if (res.data.success) {
        setBundles(res.data.data);
        const p = res.data.pagination;
        if (p) { setTotalPages(p.totalPages || 1); setTotalItems(p.total || 0); }
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, page, pageSize]);

  useEffect(() => { setPage(1); }, [search, pageSize]);
  useEffect(() => {
    const t = setTimeout(() => fetchBundles(), 300);
    return () => clearTimeout(t);
  }, [fetchBundles]);

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/bundles/${deleteTarget.id}`);
      setAlert({ severity: 'success', message: `Bundle ${deleteTarget.bundle_sku} deleted successfully.` });
      fetchBundles();
    } catch (err) {
      setAlert({ severity: 'error', message: err.response?.data?.message || 'Failed to delete bundle.' });
    } finally {
      setDeleteTarget(null);
    }
  };

  const fromRow = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow   = (page - 1) * pageSize + bundles.length;

  const columns = [
    {
      key: 'bundle_sku',
      header: 'Bundle SKU',
      render: r => <DataTableStatus variant="app" inline>{r.bundle_sku}</DataTableStatus>,
    },
    {
      key: 'bundle_name',
      header: 'Bundle Name',
      render: r => <span style={{ fontWeight: 600 }}>{r.bundle_name}</span>,
    },
    {
      key: 'composition',
      header: 'Composition',
      render: r => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <PackageSearch size={13} style={{ color: '#8496b0', flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{r.total_variants} Variant</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#8496b0', marginTop: 2 }}>Total Qty: {r.total_qty}</div>
        </div>
      ),
    },
    {
      key: 'created_by_div',
      header: 'Created By',
      render: r => (
        <DataTableStatus variant={r.created_by_div === 'product' ? 'active' : 'pending'} inline>
          {r.created_by_div === 'product' ? 'Product' : 'GoTo'}
        </DataTableStatus>
      ),
    },
    {
      key: 'created_at',
      header: 'Created At',
      render: r => (
        <span style={{ fontSize: '0.82rem', color: '#8496b0' }}>
          {new Date(r.created_at).toLocaleDateString('en-GB')}
        </span>
      ),
    },
    ...(canEdit ? [{
      key: '_actions',
      header: 'Actions',
      headerStyle: { textAlign: 'center', width: 60 },
      cellStyle:   { textAlign: 'center' },
      render: r => (
        <div onClick={e => e.stopPropagation()}>
          <CreateButton variant="icon" tone="danger" type="button" title="Delete"
            onClick={() => setDeleteTarget(r)}>
            <Trash2 size={14} />
          </CreateButton>
        </div>
      ),
    }] : []),
  ];

  const detail = {
    eyebrow:     'Bundle Detail',
    title:       (row) => row.bundle_name,
    description: (row) => row.bundle_sku,
    buttonLabel: 'Details',
    buttonIcon:  Info,
    render:      (row) => <CompositionSection bundleId={row.id} />,
    sections: (row) => [
      {
        title: 'Information',
        icon:  BadgeCheck,
        tone:  'accent',
        fields: [
          { label: 'Bundle SKU',     value: row.bundle_sku },
          { label: 'Created By',     value: row.created_by_div === 'product' ? 'Product Division' : 'GoTo Division' },
          { label: 'Total Variants', value: row.total_variants },
          { label: 'Total Qty',      value: row.total_qty },
        ],
      },
      {
        title: 'Timestamps',
        icon:  Clock3,
        tone:  'warning',
        fields: [
          { label: 'Created At',    value: fmt(row.created_at) },
          { label: 'Last Modified', value: row.updated_at ? fmt(row.updated_at) : '-' },
        ],
      },
    ],
  };

  return (
    <div className="bl-root animate-fade-in">
      <style>{`
        .bl-root { height: 100%; display: flex; flex-direction: column; }
        .bl-panel { flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 0 !important; }
        .bl-table-area { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; padding: 0 24px 20px; }
        .bl-root .users-table-wrapper { flex: 1; min-height: 0; max-height: none; margin-top: 10px; }
        .bl-root .users-table { min-width: 0 !important; width: 100%; }
        .bl-root .users-table th { background: rgba(246,248,250,0.98); backdrop-filter: blur(8px); }
        .bl-root td .users-table__status--app,
        .bl-root td .users-table__status--active,
        .bl-root td .users-table__status--pending { padding: 0.28rem 0.65rem; font-size: 0.76rem; font-weight: 700; border-radius: 8px; }
        .bl-root .users-table-card__action {
          box-shadow: none; min-height: 40px; font-size: 0.875rem; padding: 0 1.1rem;
          color: #fff !important; text-decoration: none !important;
        }
        .bl-root .users-table-card__action:hover {
          transform: none; box-shadow: none;
          background: linear-gradient(135deg, #1f9b8e 0%, #136e65 100%); color: #fff !important;
        }
        .bl-root .search-wrapper input {
          height: 40px; border-radius: 999px; padding-left: 2.4rem; padding-right: 1rem;
          font-size: 0.875rem; border: 1px solid rgba(26,42,87,0.14);
          background: rgba(255,255,255,0.9); transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .bl-root .search-wrapper input:hover { border-color: rgba(42,157,143,0.4); background: #fff; }
        .bl-root .search-wrapper input:focus {
          border-color: rgba(42,157,143,0.55); box-shadow: 0 0 0 3px rgba(42,157,143,0.12);
          outline: none; background: #fff;
        }
        .bl-toolbar-button {
          height: 40px; padding: 0 1rem; border-radius: 10px; font-size: 0.82rem;
          font-weight: 600; cursor: pointer; display: inline-flex; align-items: center;
          gap: 6px; white-space: nowrap; transition: background 0.2s, border-color 0.2s;
        }
        .bl-toolbar-button--export {
          border: 1px solid rgba(22,163,74,0.3); background: rgba(22,163,74,0.07); color: #15803d;
        }
        .bl-toolbar-button--export:hover { background: rgba(22,163,74,0.13); border-color: rgba(22,163,74,0.45); }
        .bl-root .users-table__detail-shell { max-height: none; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; }
        .bl-root .users-table__detail-section--wide { grid-column: 1 / -1; }
        .bl-root .users-table__accordion-row td { padding: 0 0 12px 0; }
        .bl-root .users-table__accordion { margin: 0; padding: 1.1rem 1.25rem 1.25rem; }
        .bl-root .users-table__detail-row { border-bottom: 1px solid rgba(26,42,87,0.05); padding: 0.4rem 0; }
        .bl-root .users-table__detail-label { font-size: 0.67rem; color: #8496b0; }
        .bl-root .users-table__detail-value { font-size: 0.85rem; }
      `}</style>

      {showComposer && (
        <BundleComposerModal
          onClose={() => setShowComposer(false)}
          onSaved={() => {
            setShowComposer(false);
            fetchBundles();
            setAlert({ severity: 'success', message: 'Bundle created successfully.' });
          }}
        />
      )}

      <DialogDelete
        isOpen={!!deleteTarget}
        eyebrow="Delete Bundle"
        title={`Delete ${deleteTarget?.bundle_sku}?`}
        user={{ name: deleteTarget?.bundle_name }}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
      <AlertModal
        open={!!alert}
        severity={alert?.severity}
        message={alert?.message}
        onClose={() => setAlert(null)}
      />

      <section className="dashboard-card bl-panel">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '0.75rem', padding: '20px 24px 18px',
          borderBottom: '1px solid rgba(26,42,87,0.08)', flexShrink: 0, flexWrap: 'wrap',
        }}>
          <div style={{ minWidth: 0 }}>
            <p className="dashboard-panel__eyebrow" style={{ marginBottom: 5 }}>Bundle Items</p>
            <h2 className="dashboard-panel__title" style={{ marginBottom: 0 }}>Bundling Items</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div className="search-wrapper" style={{ maxWidth: 280, flex: '1 1 200px' }}>
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Search SKU or bundle name..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            <button
              type="button"
              className="bl-toolbar-button bl-toolbar-button--export"
              onClick={() => window.open(`/api/search/export?type=bundle&format=excel&search=${search}`, '_blank')}
            >
              <FileSpreadsheet size={14} /> Export
            </button>

            {canEdit && (
              <button
                type="button"
                className="users-table-card__action"
                onClick={() => setShowComposer(true)}
              >
                <Plus size={16} aria-hidden="true" />
                Create Bundle
              </button>
            )}
          </div>
        </div>

        {/* ── Table ──────────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 10 }}>
            <span className="spinner" /> Loading data...
          </div>
        ) : (
          <div className="bl-table-area">
            <DataTable
              rows={bundles}
              columns={columns}
              detail={detail}
              emptyMessage={
                <div className="empty-state">
                  <PackageSearch size={36} style={{ opacity: 0.2 }} />
                  <p>No bundle data found</p>
                </div>
              }
              tableLabel="Bundle Items Table"
            />
          </div>
        )}

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        {!loading && totalItems > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '1rem', flexWrap: 'wrap', padding: '12px 24px 20px', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className="users-table-pagination__summary">
                {fromRow}–{toRow} of {totalItems.toLocaleString()} records
              </span>
              <PageSizeDropdown
                value={pageSize}
                options={PAGE_SIZES}
                onChange={v => { setPageSize(v); setPage(1); }}
              />
            </div>

            <div className="users-table-pagination__controls">
              <button
                className="users-table-pagination__button"
                onClick={() => setPage(p => p - 1)}
                disabled={page <= 1}
              >
                Prev
              </button>
              {buildPaginationItems(page, totalPages).map((item, idx) =>
                typeof item === 'number' ? (
                  <button
                    key={item}
                    className={`users-table-pagination__button${item === page ? ' users-table-pagination__button--active' : ''}`}
                    onClick={() => setPage(item)}
                  >
                    {item}
                  </button>
                ) : (
                  <span key={`e${idx}`} className="users-table-pagination__ellipsis">…</span>
                )
              )}
              <button
                className="users-table-pagination__button"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}

      </section>
    </div>
  );
}
