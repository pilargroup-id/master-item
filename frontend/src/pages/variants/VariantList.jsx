import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, FileSpreadsheet, Box } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import variantsService from '../../services/variantsService';
import useVariantList from './useVariantList';
import VariantDetailModal from './VariantDetailModal';
import DialogDelete from '../../components/Dialog/DialogDelete';
import AlertModal from '../../components/AlertModal';

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZES = [10, 25, 50, 100];

const STATUS_OPTIONS  = ['ACTIVE', 'NON ACTIVE', 'DISCONTINUE', 'HOLD DEVELOPMENT', 'NEW DEVELOPMENT', 'FINANCE'];
const CHANNEL_OPTIONS = ['B2B', 'ECOM', 'FACTORY', 'GT', 'STORE'];

const STATUS_BADGE = {
  'ACTIVE':           'badge-success',
  'NON ACTIVE':       'badge-danger',
  'DISCONTINUE':      'badge-danger',
  'HOLD DEVELOPMENT': 'badge-warning',
  'NEW DEVELOPMENT':  'badge-info',
  'FINANCE':          'badge-primary',
};

const fmt = (dateStr) =>
  new Date(dateStr).toLocaleString('id-ID', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

// ── Main Component ────────────────────────────────────────────────────────────
export default function VariantList() {
  const { isProductDivision } = useAuth();

  const {
    variants, loading, error,
    totalItems, totalPages, page, pageSize, search,
    setSearch, setPage, setPageSize, refetch,
  } = useVariantList();

  // Modal / alert state
  const [detailItem,   setDetailItem]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alert,        setAlert]        = useState(null);

  // Bulk select state
  const [isSelecting,     setIsSelecting]     = useState(false);
  const [selectedIds,     setSelectedIds]     = useState([]);
  const [selectedStatus,  setSelectedStatus]  = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');

  const showAlert = (severity, message) => setAlert({ severity, message });

  // ── Bulk helpers ────────────────────────────────────────────────────────────
  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === variants.length ? [] : variants.map((v) => v.id));

  const toggleSelect = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const cancelSelect = () => {
    setIsSelecting(false);
    setSelectedIds([]);
    setSelectedStatus('');
    setSelectedChannel('');
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    try {
      const res = await variantsService.remove(deleteTarget.id);
      showAlert('success', res.data.message);
      refetch();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Gagal menghapus item.');
    } finally {
      setDeleteTarget(null);
    }
  };

  // ── Bulk Update Status ──────────────────────────────────────────────────────
  const handleBulkStatus = async () => {
    try {
      const res = await variantsService.bulkUpdateStatus(selectedIds, selectedStatus);
      showAlert('success', res.data.message);
      cancelSelect();
      refetch();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Gagal update status.');
    }
  };

  // ── Bulk Update Channel ─────────────────────────────────────────────────────
  const handleBulkChannel = async () => {
    try {
      const channel = selectedChannel === 'KOSONG' ? '' : selectedChannel;
      const res = await variantsService.bulkUpdateChannel(selectedIds, channel);
      showAlert('success', res.data.message);
      cancelSelect();
      refetch();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Gagal update channel.');
    }
  };

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = () =>
    window.open(`/api/search/export?type=variant&format=excel&search=${search}`, '_blank');

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in">

      {/* Modals */}
      {detailItem && (
        <VariantDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
      )}
      <DialogDelete
        isOpen={!!deleteTarget}
        eyebrow="Hapus Variant Item"
        title={`Hapus ${deleteTarget?.variant_sku}?`}
        user={{ name: [deleteTarget?.parent_name, deleteTarget?.model_type].filter(Boolean).join(' – ') }}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
      <AlertModal
        open={!!alert}
        severity={alert?.severity}
        message={alert?.message}
        onClose={() => setAlert(null)}
      />

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Variant Items</h1>
          <p>Produk fisik dengan stok, dimensi, dan data logistik</p>
        </div>
        <div className="d-flex gap-2" style={{ flexWrap: 'wrap' }}>
          {isProductDivision() && (
            <button
              onClick={() => (isSelecting ? cancelSelect() : setIsSelecting(true))}
              className={`btn ${isSelecting ? 'btn-outline' : 'btn-warning'}`}
            >
              {isSelecting ? 'Batal Pilih' : 'Ubah Multi (Status/Channel)'}
            </button>
          )}
          <button onClick={handleExport} className="btn btn-success">
            <FileSpreadsheet size={16} /> Export Excel
          </button>
          {isProductDivision() && (
            <Link to="/variants/new" className="btn btn-primary">
              <Plus size={16} /> Tambah Variant
            </Link>
          )}
        </div>
      </div>

      {/* Card */}
      <div className="card" style={{ padding: '1.25rem' }}>

        {/* Toolbar */}
        <div className="d-flex gap-3 align-items-center mb-3" style={{ flexWrap: 'wrap' }}>
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari SKU, parent, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={isSelecting}
            />
          </div>

          {isSelecting ? (
            <BulkToolbar
              selectedCount={selectedIds.length}
              selectedStatus={selectedStatus}
              selectedChannel={selectedChannel}
              onStatusChange={setSelectedStatus}
              onChannelChange={setSelectedChannel}
              onApplyStatus={handleBulkStatus}
              onApplyChannel={handleBulkChannel}
            />
          ) : (
            !loading && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                {totalItems.toLocaleString('id-ID')} data
              </span>
            )
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: 'var(--danger-light)', border: '1.5px solid var(--danger-border)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Table */}
        <div className="table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <span className="spinner" /> Memuat data...
            </div>
          ) : (
            <table style={{ minWidth: '1440px' }}>
              <thead>
                <tr>
                  {isSelecting && (
                    <th style={{ width: 44, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.length === variants.length && variants.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                  )}
                  <th style={{ width: 140 }}>Timestamp</th>
                  <th style={{ minWidth: 120 }}>Item ID</th>
                  <th style={{ minWidth: 250 }}>Item Name</th>
                  <th style={{ width: 70,  textAlign: 'center' }}>UOM</th>
                  <th style={{ minWidth: 140 }}>Parent Name</th>
                  <th style={{ minWidth: 120 }}>Variant</th>
                  <th style={{ width: 115, textAlign: 'center' }}>Parent ID</th>
                  <th style={{ width: 80,  textAlign: 'center' }}>Qty/Pack</th>
                  <th style={{ width: 65,  textAlign: 'center' }}>H</th>
                  <th style={{ width: 65,  textAlign: 'center' }}>W</th>
                  <th style={{ width: 65,  textAlign: 'center' }}>D</th>
                  <th style={{ width: 85,  textAlign: 'center' }}>GW Pack</th>
                  <th style={{ width: 130, textAlign: 'center' }}>Status</th>
                  <th style={{ width: 110, textAlign: 'center' }}>Bisnis Unit</th>
                  <th style={{ width: 100, textAlign: 'center' }}>Channel</th>
                  <th style={{ width: 140, textAlign: 'center' }}>Brand Category</th>
                  <th style={{ width: 120, textAlign: 'center' }}>PIC</th>
                  {!isSelecting && <th style={{ width: 100, textAlign: 'center' }}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {variants.length === 0 ? (
                  <tr>
                    <td colSpan={isSelecting ? 18 : 19}>
                      <div className="empty-state">
                        <Box size={36} style={{ opacity: 0.2 }} />
                        <p>Tidak ada data ditemukan</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  variants.map((item) => (
                    <VariantRow
                      key={item.id}
                      item={item}
                      isSelecting={isSelecting}
                      isSelected={selectedIds.includes(item.id)}
                      canEdit={isProductDivision()}
                      onToggle={() => toggleSelect(item.id)}
                      onDetail={() => setDetailItem(item)}
                      onDelete={() => setDeleteTarget(item)}
                    />
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalItems > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            visibleCount={variants.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function VariantRow({ item, isSelecting, isSelected, canEdit, onToggle, onDetail, onDelete }) {
  const itemName = [item.parent_name, item.model_type, item.color_size, item.size_color]
    .filter(Boolean).join(' ') || '-';

  return (
    <tr style={{ background: isSelected ? 'var(--accent-light)' : undefined }}>
      {isSelecting && (
        <td style={{ textAlign: 'center' }}>
          <input type="checkbox" checked={isSelected} onChange={onToggle} />
        </td>
      )}
      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {fmt(item.created_at)}
      </td>
      <td>
        <span className="badge badge-success" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {item.variant_sku}
        </span>
      </td>
      <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{itemName}</td>
      <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>{item.unit || '-'}</td>
      <td style={{ whiteSpace: 'nowrap' }}>{item.parent_name || '-'}</td>
      <td>
        {item.model_type || item.color_size || item.size_color ? (
          <div style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
            {item.model_type && <div style={{ fontWeight: 500 }}>{item.model_type}</div>}
            {item.color_size && <div style={{ color: 'var(--text-muted)' }}>{item.color_size}</div>}
            {item.size_color && <div style={{ color: 'var(--text-muted)' }}>{item.size_color}</div>}
          </div>
        ) : '-'}
      </td>
      <td style={{ textAlign: 'center' }}>
        <span className="badge badge-primary" style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
          {item.parent_sku || '-'}
        </span>
      </td>
      <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>{item.qty_pack ?? '-'}</td>
      <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>{item.height_cm ?? '-'}</td>
      <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>{item.dimension_w ?? '-'}</td>
      <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>{item.dimension_l ?? '-'}</td>
      <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>{item.gross_weight_gr ?? '-'}</td>
      <td style={{ textAlign: 'center' }}>
        {item.status
          ? <span className={`badge ${STATUS_BADGE[item.status] || 'badge-default'}`} style={{ fontSize: '0.72rem' }}>{item.status}</span>
          : '-'}
      </td>
      <td style={{ textAlign: 'center', fontSize: '0.82rem' }}>{item.business_unit   || '-'}</td>
      <td style={{ textAlign: 'center', fontSize: '0.82rem' }}>{item.channel         || '-'}</td>
      <td style={{ textAlign: 'center', fontSize: '0.82rem' }}>{item.brand_category  || '-'}</td>
      <td style={{ textAlign: 'center', fontSize: '0.82rem', fontWeight: 600 }}>{item.pic || '-'}</td>
      {!isSelecting && (
        <td>
          <div className="d-flex gap-2" style={{ justifyContent: 'center' }}>
            <button
              onClick={onDetail}
              className="btn-icon"
              title="Lihat Detail"
              style={{ color: 'var(--accent)', background: 'var(--accent-light)', border: '1.5px solid var(--accent-border)' }}
            >
              <Eye size={14} />
            </button>
            {canEdit && (
              <>
                <Link
                  to={`/variants/edit/${item.id}`}
                  title="Edit"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 'var(--radius-md)', color: 'var(--warning)', background: 'var(--warning-light)', border: '1.5px solid var(--warning-border)', textDecoration: 'none', flexShrink: 0 }}
                >
                  <Edit size={14} />
                </Link>
                <button
                  onClick={onDelete}
                  className="btn-icon"
                  title="Hapus"
                  style={{ color: 'var(--danger)', background: 'var(--danger-light)', border: '1.5px solid var(--danger-border)' }}
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}

function BulkToolbar({ selectedCount, selectedStatus, selectedChannel, onStatusChange, onChannelChange, onApplyStatus, onApplyChannel }) {
  const selectStyle = {
    padding: '0.38rem 0.75rem', fontSize: '0.82rem',
    borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)',
    background: 'var(--bg-surface)', color: 'var(--text-primary)', fontFamily: 'inherit',
  };
  const btnStyle = { padding: '0.38rem 1rem', fontSize: '0.82rem' };
  const divider  = { width: 1, height: 24, background: 'var(--accent-border)', margin: '0 0.5rem' };

  return (
    <div className="d-flex align-items-center" style={{ marginLeft: 'auto', padding: '0.5rem 1rem', background: 'var(--accent-light)', border: '1.5px solid var(--accent-border)', borderRadius: 'var(--radius-lg)', flexWrap: 'wrap', gap: '0.625rem' }}>
      <span style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600 }}>
        {selectedCount} dipilih
      </span>

      {/* Status */}
      <select value={selectedStatus} onChange={(e) => onStatusChange(e.target.value)} style={selectStyle}>
        <option value="">-- Pilih Status --</option>
        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button
        className="btn btn-primary"
        style={btnStyle}
        onClick={onApplyStatus}
        disabled={!selectedCount || !selectedStatus}
      >
        Set Status
      </button>

      <div style={divider} />

      {/* Channel */}
      <select value={selectedChannel} onChange={(e) => onChannelChange(e.target.value)} style={selectStyle}>
        <option value="">-- Pilih Channel --</option>
        <option value="KOSONG">Kosongkan Channel</option>
        {CHANNEL_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <button
        className="btn btn-primary"
        style={btnStyle}
        onClick={onApplyChannel}
        disabled={!selectedCount || !selectedChannel}
      >
        Set Channel
      </button>
    </div>
  );
}

function Pagination({ page, totalPages, pageSize, totalItems, visibleCount, onPageChange, onPageSizeChange }) {
  return (
    <div className="pagination-bar">
      <div className="d-flex align-items-center gap-3">
        <span className="page-info">
          Menampilkan <span>{visibleCount}</span> dari <span>{totalItems.toLocaleString('id-ID')}</span> data
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          {PAGE_SIZES.map((n) => <option key={n} value={n}>{n} Baris</option>)}
        </select>
      </div>
      <div className="page-controls">
        <button className="btn-page" disabled={page <= 1}          onClick={() => onPageChange(page - 1)}>← Prev</button>
        <span className="page-num">Hal {page} / {totalPages}</span>
        <button className="btn-page" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next →</button>
      </div>
    </div>
  );
}
