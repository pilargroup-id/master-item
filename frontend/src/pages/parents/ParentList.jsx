import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Search,
  FolderTree,
  Edit,
  Trash2,
  ChevronDown,
  BadgeCheck,
  Boxes,
  Building2,
  Clock3,
  Info,
} from 'lucide-react';
import CreateButton from '../../components/button/CreateButton';
import ParentForm from './ParentForm';
import { XClose } from '../../components/template/TemplateIcons.jsx';
import { useAuth } from '../../contexts/AuthContext';
import parentsService from '../../services/parentsService';
import useParentList from './useParentList';
import DialogDelete from '../../components/Dialog/DialogDelete';
import AlertModal from '../../components/AlertModal';
import DataTable, { DataTableStatus } from '../../components/table/DataTable';

const PAGE_SIZES = [10, 25, 50, 100];

function PageSizeDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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
        {value}
        <ChevronDown size={13} style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, zIndex: 50,
          background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(26,42,87,0.10)', borderRadius: 12,
          boxShadow: '0 12px 32px rgba(26,42,87,0.12)',
          overflow: 'hidden', minWidth: 72,
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
                transition: 'background 0.15s',
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

function ParentFormModal({ modalId, onClose, onSaved }) {
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
        width: 'min(96vw, 900px)',
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
            <p className="dashboard-popup__eyebrow">
              {modalId ? 'Edit Data' : 'New Data'}
            </p>
            <h2 className="dashboard-popup__title">
              {modalId ? 'Edit Parent Item' : 'Add Parent Item'}
            </h2>
          </div>
          <button type="button" className="dashboard-popup__close" onClick={onClose} aria-label="Close">
            <XClose size={18} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
          <ParentForm modalId={modalId} onClose={onClose} onSaved={onSaved} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

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

export default function ParentList() {
  const { isProductDivision } = useAuth();

  const {
    parents, loading, error,
    totalItems, totalPages, page, pageSize, search,
    setSearch, setPage, setPageSize, refetch,
  } = useParentList();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert,        setAlert]        = useState(null);
  const [formModal,    setFormModal]    = useState(null); // null | 'new' | id

  const showAlert = (severity, message) => setAlert({ severity, message });
  const canEdit   = isProductDivision();

  const handleDeleteConfirm = async () => {
    try {
      const res = await parentsService.remove(deleteTarget.id);
      showAlert('success', res.data.message);
      refetch();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to delete item.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns = [
    {
      key: 'parent_sku',
      header: 'Parent ID',
      render: (row) => (
        <DataTableStatus variant="active" inline>{row.parent_sku}</DataTableStatus>
      ),
    },
    {
      key: 'brand',
      header: 'Brand',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{row.linked_brand_name || row.brand_name || '-'}</span>
      ),
    },
    { key: 'item_name', header: 'Item Name', accessor: 'item_name' },
    {
      key: 'base_name',
      header: 'Parent Name',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{row.base_name || '-'}</span>
      ),
    },
    {
      key: 'business_unit',
      header: 'Business Unit',
      render: (row) => row.business_unit
        ? <DataTableStatus variant="app" inline>{row.business_unit}</DataTableStatus>
        : '-',
    },
    {
      key: 'actions',
      header: 'Actions',
      headerStyle: { textAlign: 'center' },
      cellStyle:   { textAlign: 'center' },
      render: (row) => (
        <div className="d-flex gap-2" style={{ justifyContent: 'center' }} onClick={(e) => e.stopPropagation()}>
          {canEdit && (
            <>
              <button
                className="users-table__icon-button"
                title="Edit"
                onClick={() => setFormModal(row.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
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

  const hasValue = (v) => v !== null && v !== undefined && v !== '';

  const detail = {
    eyebrow:     'Parent Item',
    title:       (row) => row.base_name,
    description: (row) => row.parent_sku,
    buttonLabel: 'Details',
    buttonIcon: Info,
    sections: (row) => [
      // Row 1: Identity | Brand & Product
      {
        title: 'Identity',
        icon: BadgeCheck,
        tone: 'accent',
        fields: [
          { label: 'Parent SKU', value: row.parent_sku },
          { label: 'Base Name',  value: row.base_name  },
          { label: 'Sub Brand',  value: row.sub_brand  },
        ].filter(f => hasValue(f.value)),
      },
      {
        title: 'Brand & Product',
        icon: Building2,
        tone: 'success',
        fields: [
          { label: 'Brand',         value: row.linked_brand_name || row.brand_name },
          { label: 'Item Name',     value: row.item_name    },
          { label: 'Business Unit', value: row.business_unit },
          { label: 'Description',   value: row.description },
          { label: 'PIC',           value: row.pic          },
        ].filter(f => hasValue(f.value)),
      },
      // Row 2: Classification | Timestamps
      {
        title: 'Classification',
        icon: Boxes,
        tone: 'info',
        fields: [
          { label: 'Detail Category', value: row.linked_category || row.category_name },
          { label: 'Item Type',       value: row.linked_item_type },
          { label: 'Port',            value: row.linked_port      },
          { label: 'Total Variants',  value: row.variant_count    },
        ].filter(f => hasValue(f.value)),
      },
      {
        title: 'Timestamps',
        icon: Clock3,
        tone: 'warning',
        fields: [
          { label: 'Created',       value: fmt(row.created_at) },
          ...(row.updated_at ? [{ label: 'Last Modified', value: fmt(row.updated_at) }] : []),
        ],
      },
    ].filter(s => s.fields.length > 0),
  };


  return (
    <div className="pl-root animate-fade-in">

      <style>{`
        .pl-root {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .pl-panel {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          padding: 0 !important;
        }
        .pl-table-area {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 0 24px 20px;
        }
        .pl-root .users-table-wrapper {
          flex: 1;
          min-height: 0;
          max-height: none;
          margin-top: 10px;
        }
        /* Override min-width:780px — table fills container, no horizontal scroll */
        .pl-root .users-table {
          min-width: 0 !important;
          width: 100%;
        }
        /* Sticky header — solid background so rows don't bleed through */
        .pl-root .users-table th {
          background: rgba(246, 248, 250, 0.98);
          backdrop-filter: blur(8px);
        }
        .pl-root .users-table-pagination {
          flex-shrink: 0;
          padding-top: 10px;
        }
        /* Business Unit & Parent ID badge — same teal, bigger */
        .pl-root td .users-table__status--app,
        .pl-root td .users-table__status--active {
          padding: 0.32rem 0.75rem;
          font-size: 0.78rem;
          font-weight: 700;
          border-radius: 8px;
          letter-spacing: 0.02em;
        }
        /* Add Parent button */
        .pl-root .users-table-card__action {
          box-shadow: none;
          min-height: 40px;
          font-size: 0.875rem;
          padding: 0 1.1rem;
          color: #fff !important;
          text-decoration: none !important;
        }
        .pl-root .users-table-card__action:hover {
          transform: none;
          box-shadow: none;
          background: linear-gradient(135deg, #1f9b8e 0%, #136e65 100%);
          color: #fff !important;
        }
        /* Search input — pill, consistent height, teal focus */
        .pl-root .search-wrapper input {
          height: 40px;
          border-radius: 999px;
          padding-left: 2.4rem;
          padding-right: 1rem;
          font-size: 0.875rem;
          border: 1px solid rgba(26, 42, 87, 0.14);
          background: rgba(255,255,255,0.9);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .pl-root .search-wrapper input:hover {
          border-color: rgba(42, 157, 143, 0.4);
          background: #fff;
        }
        .pl-root .search-wrapper input:focus {
          border-color: rgba(42, 157, 143, 0.55);
          box-shadow: 0 0 0 3px rgba(42, 157, 143, 0.12);
          outline: none;
          background: #fff;
        }
        /* Detail row lines — cleaner */
        .pl-root .users-table__detail-row {
          border-bottom: 1px solid rgba(26, 42, 87, 0.05);
          padding: 0.4rem 0;
          gap: 0.5rem;
        }
        .pl-root .users-table__detail-label {
          font-size: 0.67rem;
          color: #8496b0;
        }
        .pl-root .users-table__detail-value {
          font-size: 0.85rem;
        }
        /* Accordion — remove double padding from td */
        .pl-root .users-table__accordion-row td {
          padding: 0 0 12px 0;
        }
        .pl-root .users-table__accordion {
          margin: 0;
          padding: 1.1rem 1.25rem 1.25rem;
        }
        /* Sections: 2-column balanced grid, no inner scroll */
        .pl-root .users-table__detail-shell {
          max-height: none;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.65rem;
        }
        /* Wide sections span both columns */
        .pl-root .users-table__detail-section--wide {
          grid-column: 1 / -1;
        }
      `}</style>

      {formModal !== null && (
        <ParentFormModal
          modalId={formModal === 'new' ? undefined : formModal}
          onClose={() => setFormModal(null)}
          onSaved={() => { refetch(); }}
        />
      )}

      <DialogDelete
        isOpen={!!deleteTarget}
        eyebrow="Delete Parent Item"
        title={`Delete ${deleteTarget?.parent_sku}?`}
        user={{ name: deleteTarget?.base_name }}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
      <AlertModal
        open={!!alert}
        severity={alert?.severity}
        message={alert?.message}
        onClose={() => setAlert(null)}
      />

      <section className="dashboard-card pl-panel">

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', padding: '20px 24px 18px',
          borderBottom: '1px solid rgba(26,42,87,0.08)', flexShrink: 0,
          flexWrap: 'wrap',
        }}>
          <div style={{ minWidth: 0 }}>
            <p className="dashboard-panel__eyebrow" style={{ marginBottom: 5 }}>Master Data</p>
            <h2 className="dashboard-panel__title" style={{ marginBottom: 0 }}>Parent Items</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div className="search-wrapper" style={{ maxWidth: 280, flex: '1 1 200px' }}>
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Search SKU, name, brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {canEdit && (
              <button type="button" className="users-table-card__action" onClick={() => setFormModal('new')}>
                <Plus size={16} aria-hidden="true" />
                Add Parent
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '10px 24px', flexShrink: 0 }}>
            <div style={{
              padding: '0.75rem 1rem',
              background: 'var(--danger-light)', border: '1.5px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.875rem',
            }}>
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
          <>
          <div className="pl-table-area">
            <DataTable
              rows={parents}
              columns={columns}
              detail={detail}
              emptyMessage={
                <div className="empty-state">
                  <FolderTree size={36} style={{ opacity: 0.25 }} />
                  <p>No data found</p>
                </div>
              }
              tableLabel="Parent Items Table"
            />
          </div>

          {/* Pagination footer — di luar pl-table-area agar dropdown tidak terpotong */}
          {!loading && totalItems > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '1rem', flexWrap: 'wrap',
              padding: '12px 24px 20px', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="users-table-pagination__summary">
                  Showing {parents.length} of {totalItems.toLocaleString()} records
                </span>
                <PageSizeDropdown
                  value={pageSize}
                  options={PAGE_SIZES}
                  onChange={setPageSize}
                />
              </div>

              <div className="users-table-pagination__controls">
                <button className="users-table-pagination__button" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                  Previous
                </button>
                {buildPaginationItems(page, totalPages).map((item, idx) =>
                  typeof item === 'number' ? (
                    <button
                      key={item}
                      className={`users-table-pagination__button${item === page ? ' users-table-pagination__button--active' : ''}`}
                      onClick={() => setPage(item)}
                      aria-current={item === page ? 'page' : undefined}
                    >
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
          </>
        )}

      </section>
    </div>
  );
}
