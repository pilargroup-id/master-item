/**
 * Generic master data page — used by all master pages.
 * Pass title, columns, apiPath, ModalForm, deleteLabel, canEdit.
 * Pagination and search are handled server-side via ?page=&limit=&search=
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, Edit, Trash2, Database, ChevronDown, Check } from 'lucide-react';
import axios from 'axios';
import { XClose } from '../../components/template/TemplateIcons.jsx';
import DataTable, { DataTableStatus } from '../../components/table/DataTable';
import CreateButton from '../../components/button/CreateButton';
import DialogDelete from '../../components/Dialog/DialogDelete';
import AlertModal from '../../components/AlertModal';

export { DataTableStatus };

const PAGE_SIZES = [10, 25, 50, 100];

// ── Pagination helpers ────────────────────────────────────────────────────────

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
        <ChevronDown
          size={13}
          style={{
            opacity: 0.5,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        />
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

// ── Modal wrapper ─────────────────────────────────────────────────────────────

export function MasterModal({ open, isEdit, title, onClose, onSubmit, saving, children, width = 480 }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="dashboard-popup-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: `min(96vw, ${width}px)`, borderRadius: 24, background: '#fff',
        boxShadow: '0 28px 80px rgba(10,18,40,0.32)', overflow: 'hidden',
      }}>
        <div className="dashboard-popup__header">
          <div>
            <p className="dashboard-popup__eyebrow">{isEdit ? 'Edit Data' : 'New Data'}</p>
            <h2 className="dashboard-popup__title">{isEdit ? `Edit ${title}` : `Add ${title}`}</h2>
          </div>
          <button type="button" className="dashboard-popup__close" onClick={onClose} aria-label="Close">
            <XClose size={18} />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {children}
          </div>
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
            padding: '1rem 1.5rem', borderTop: '1px solid rgba(26,42,87,0.08)',
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
              className="dashboard-popup__button dashboard-popup__button--primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span style={{
                    width: 15, height: 15,
                    border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                    borderRadius: '50%', display: 'inline-block', marginRight: 6,
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Saving...
                </>
              ) : isEdit ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── Field helpers ─────────────────────────────────────────────────────────────

export function MField({ label, required, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{
        fontSize: '0.8rem', fontWeight: 600, color: '#445674',
        display: 'flex', gap: 4, alignItems: 'center',
      }}>
        {label}
        {required && <span style={{ color: '#e05252' }}>*</span>}
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
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

export function MInput({ ...props }) {
  return (
    <input
      {...props}
      style={{ ...inputBase, ...props.style }}
      onFocus={e => {
        e.target.style.borderColor = 'rgba(42,157,143,0.55)';
        e.target.style.boxShadow  = '0 0 0 3px rgba(42,157,143,0.12)';
        e.target.style.background = '#fff';
      }}
      onBlur={e => {
        e.target.style.borderColor = 'rgba(26,42,87,0.16)';
        e.target.style.boxShadow  = 'none';
        e.target.style.background = 'rgba(248,250,252,0.9)';
      }}
    />
  );
}

export function MSelect({ children, ...props }) {
  return (
    <select
      {...props}
      style={{
        ...inputBase,
        appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%232a9d8f' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem center',
        paddingRight: '2.2rem', ...props.style,
      }}
      onFocus={e => {
        e.target.style.borderColor = 'rgba(42,157,143,0.55)';
        e.target.style.boxShadow  = '0 0 0 3px rgba(42,157,143,0.12)';
        e.target.style.background = '#fff';
      }}
      onBlur={e => {
        e.target.style.borderColor = 'rgba(26,42,87,0.16)';
        e.target.style.boxShadow  = 'none';
        e.target.style.background = 'rgba(248,250,252,0.9)';
      }}
    >
      {children}
    </select>
  );
}

// ── SearchableSelect ──────────────────────────────────────────────────────────

export function SearchableSelect({ value, options = [], onChange, placeholder = 'Select...' }) {
  const [open,      setOpen]      = useState(false);
  const [query,     setQuery]     = useState('');
  const [dropStyle, setDropStyle] = useState({});
  const triggerRef = useRef(null);
  const searchRef  = useRef(null);
  const dropRef    = useRef(null);

  const filtered      = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;
  const selectedLabel = options.find(o => String(o.id) === String(value))?.label;

  const openDrop = () => {
    if (!triggerRef.current) return;
    const rect       = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp     = spaceBelow < 230;
    setDropStyle({
      position: 'fixed',
      left:  rect.left,
      width: Math.max(rect.width, 200),
      zIndex: 9999,
      ...(openUp ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
    });
    setOpen(true);
    setQuery('');
    setTimeout(() => searchRef.current?.focus(), 40);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!dropRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target))
        setOpen(false);
    };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const isActive = (id) => String(id) === String(value);

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={open ? () => setOpen(false) : openDrop}
        style={{
          ...inputBase,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', textAlign: 'left',
          borderColor: open ? 'rgba(42,157,143,0.55)' : 'rgba(26,42,87,0.16)',
          boxShadow:   open ? '0 0 0 3px rgba(42,157,143,0.12)' : 'none',
          background:  open ? '#fff' : 'rgba(248,250,252,0.9)',
        }}
      >
        <span style={{
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: selectedLabel ? '#182b58' : '#8496b0',
        }}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          size={14}
          style={{
            flexShrink: 0, opacity: 0.5, marginLeft: 6,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {open && createPortal(
        <div ref={dropRef} style={{
          ...dropStyle,
          background: 'rgba(255,255,255,0.99)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(26,42,87,0.10)', borderRadius: 12,
          boxShadow: '0 12px 32px rgba(26,42,87,0.14)', overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px',
            borderBottom: '1px solid rgba(26,42,87,0.07)',
          }}>
            <Search size={13} style={{ opacity: 0.35, flexShrink: 0 }} />
            <input
              ref={searchRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search..."
              style={{
                border: 'none', outline: 'none', background: 'transparent',
                fontSize: '0.82rem', color: '#182b58', flex: 1, minWidth: 0,
              }}
            />
          </div>
          <div style={{ maxHeight: 160, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '10px 14px', fontSize: '0.8rem', color: '#8496b0', textAlign: 'center' }}>
                No results
              </div>
            ) : filtered.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onChange(opt.id); setOpen(false); setQuery(''); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '9px 14px',
                  background: isActive(opt.id) ? 'rgba(42,157,143,0.09)' : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontSize: '0.865rem',
                  fontWeight: isActive(opt.id) ? 600 : 400,
                  color: isActive(opt.id) ? '#18786e' : '#2d3f58',
                }}
                onMouseEnter={e => { if (!isActive(opt.id)) e.currentTarget.style.background = 'rgba(26,42,87,0.04)'; }}
                onMouseLeave={e => { if (!isActive(opt.id)) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {opt.label}
                </span>
                {isActive(opt.id) && <Check size={13} style={{ flexShrink: 0, marginLeft: 6 }} />}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ── MasterPage ────────────────────────────────────────────────────────────────

export default function MasterPage({
  title,
  description,
  eyebrow = 'Master Data',
  apiPath,
  columns,
  ModalForm,
  deleteLabel,
  canEdit,
}) {
  const [data,         setData]         = useState([]);
  const [search,       setSearch]       = useState('');
  const [debSearch,    setDebSearch]    = useState('');
  const [page,         setPage]         = useState(1);
  const [pageSize,     setPageSize]     = useState(25);
  const [total,        setTotal]        = useState(0);
  const [totalPages,   setTotalPages]   = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [editItem,     setEditItem]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert,        setAlert]        = useState(null);

  // Debounce search 350 ms
  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when search or page size changes
  useEffect(() => { setPage(1); }, [debSearch, pageSize]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(apiPath, {
        params: {
          page,
          limit: pageSize,
          ...(debSearch ? { search: debSearch } : {}),
        },
      });
      if (res.data.success) {
        setData(res.data.data);
        const p = res.data.pagination;
        setTotal(p.total);
        setTotalPages(p.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [apiPath, page, pageSize, debSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd  = ()     => { setEditItem(null);  setShowModal(true); };
  const openEdit = (item) => { setEditItem(item);  setShowModal(true); };

  const afterSave = () => {
    const wasEditing = !!editItem;
    setShowModal(false);
    setEditItem(null);
    fetchData();
    setAlert({ severity: 'success', message: wasEditing ? `${title} updated.` : `${title} added.` });
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${apiPath}/${deleteTarget.id}`);
      setAlert({ severity: 'success', message: `${title} deleted.` });
      fetchData();
    } catch (err) {
      setAlert({ severity: 'error', message: err.response?.data?.message || 'Failed to delete.' });
    } finally {
      setDeleteTarget(null);
    }
  };

  // Showing X–Y of Z
  const fromRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow   = (page - 1) * pageSize + data.length;

  const allColumns = [
    ...columns,
    ...(canEdit ? [{
      key: '_actions',
      header: 'Actions',
      headerStyle: { textAlign: 'center', width: 90 },
      cellStyle:   { textAlign: 'center' },
      render: (row) => (
        <div className="d-flex gap-2" style={{ justifyContent: 'center' }}>
          <button
            className="users-table__icon-button"
            title="Edit"
            onClick={() => openEdit(row)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Edit size={14} />
          </button>
          <CreateButton variant="icon" tone="danger" type="button" title="Delete"
            onClick={() => setDeleteTarget(row)}>
            <Trash2 size={14} />
          </CreateButton>
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="mp-root animate-fade-in">
      <style>{`
        .mp-root { height: 100%; display: flex; flex-direction: column; }
        .mp-panel { flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 0 !important; }
        .mp-table-area { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; padding: 0 24px 20px; }
        .mp-root .users-table-wrapper { flex: 1; min-height: 0; max-height: none; margin-top: 10px; }
        .mp-root .users-table { min-width: 0 !important; width: 100%; }
        .mp-root .users-table th { background: rgba(246,248,250,0.98); backdrop-filter: blur(8px); }
        .mp-root .users-table-pagination { flex-shrink: 0; padding-top: 10px; }
        .mp-root td .users-table__status--app,
        .mp-root td .users-table__status--active,
        .mp-root td .users-table__status--inactive { padding: 0.28rem 0.65rem; font-size: 0.76rem; font-weight: 700; border-radius: 8px; }
        .mp-root .users-table-card__action {
          box-shadow: none; min-height: 40px;
          font-size: 0.875rem; padding: 0 1.1rem;
          color: #fff !important; text-decoration: none !important;
        }
        .mp-root .users-table-card__action:hover {
          transform: none; box-shadow: none;
          background: linear-gradient(135deg, #1f9b8e 0%, #136e65 100%);
          color: #fff !important;
        }
        .mp-root .search-wrapper input {
          height: 40px; border-radius: 999px;
          padding-left: 2.4rem; padding-right: 1rem;
          font-size: 0.875rem; border: 1px solid rgba(26,42,87,0.14);
          background: rgba(255,255,255,0.9);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .mp-root .search-wrapper input:hover { border-color: rgba(42,157,143,0.4); background: #fff; }
        .mp-root .search-wrapper input:focus {
          border-color: rgba(42,157,143,0.55);
          box-shadow: 0 0 0 3px rgba(42,157,143,0.12);
          outline: none; background: #fff;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {deleteTarget && (
        <DialogDelete
          isOpen
          eyebrow={`Delete ${title}`}
          title={`Delete ${deleteLabel(deleteTarget)}?`}
          user={{ name: deleteLabel(deleteTarget) }}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
      <AlertModal open={!!alert} severity={alert?.severity} message={alert?.message} onClose={() => setAlert(null)} />

      {showModal && (
        <ModalForm
          item={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={afterSave}
        />
      )}

      <section className="dashboard-card mp-panel">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', padding: '20px 24px 18px',
          borderBottom: '1px solid rgba(26,42,87,0.08)', flexShrink: 0, flexWrap: 'wrap',
        }}>
          <div style={{ minWidth: 0 }}>
            <p className="dashboard-panel__eyebrow" style={{ marginBottom: 5 }}>{eyebrow}</p>
            <h2 className="dashboard-panel__title" style={{ marginBottom: 0 }}>{title}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div className="search-wrapper" style={{ maxWidth: 260, flex: '1 1 180px' }}>
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder={`Search ${title.toLowerCase()}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {canEdit && (
              <button type="button" className="users-table-card__action" onClick={openAdd}>
                <Plus size={16} aria-hidden="true" />
                Add {title.replace(/s$/, '')}
              </button>
            )}
          </div>
        </div>

        {/* ── Table ──────────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', gap: 10,
          }}>
            <span className="spinner" /> Loading data...
          </div>
        ) : (
          <div className="mp-table-area">
            <DataTable
              rows={data}
              columns={allColumns}
              emptyMessage={
                <div className="empty-state">
                  <Database size={36} style={{ opacity: 0.2 }} />
                  <p>No data found</p>
                </div>
              }
              tableLabel={`${title} Table`}
            />
          </div>
        )}

        {/* ── Pagination footer ───────────────────────────────────────────── */}
        {!loading && total > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '1rem', flexWrap: 'wrap', padding: '12px 24px 20px', flexShrink: 0,
          }}>
            {/* Left: record count + page size */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className="users-table-pagination__summary">
                {fromRow}–{toRow} of {total.toLocaleString()} records
              </span>
              <PageSizeDropdown
                value={pageSize}
                options={PAGE_SIZES}
                onChange={v => { setPageSize(v); setPage(1); }}
              />
            </div>

            {/* Right: page buttons */}
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
