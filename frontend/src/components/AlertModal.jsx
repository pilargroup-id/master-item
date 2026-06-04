import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'

const CONFIG = {
  success: { icon: CheckCircle, color: 'var(--success, #16a34a)',  bg: 'var(--success-light, #f0fdf4)',  border: 'var(--success-border, #bbf7d0)', label: 'Berhasil' },
  error:   { icon: XCircle,     color: 'var(--danger)',             bg: 'var(--danger-light)',             border: 'var(--danger-border)',           label: 'Terjadi Kesalahan' },
  warning: { icon: AlertTriangle,color: 'var(--warning)',           bg: 'var(--warning-light)',            border: 'var(--warning-border)',          label: 'Peringatan' },
  info:    { icon: Info,        color: 'var(--accent)',             bg: 'var(--accent-light)',             border: 'var(--accent-border)',           label: 'Informasi' },
}

function AlertModal({ open = false, onClose, title, message, severity = 'info' }) {
  const cfg = CONFIG[severity] || CONFIG.info
  const Icon = cfg.icon

  useEffect(() => {
    if (!open) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg, 12px)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: 420, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            {title || cfg.label}
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md, 8px)', background: cfg.bg, border: `1.5px solid ${cfg.border}` }}>
            <Icon size={20} color={cfg.color} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{message}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ minWidth: 80 }}
          >
            Tutup
          </button>
        </div>

      </div>
    </div>,
    document.body
  )
}

export default AlertModal
