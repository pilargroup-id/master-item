import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, FolderTree, Box, PackageSearch, Activity, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/stats');
        if (res.data.success) setStats(res.data.data);
      } catch (err) {
        console.error('Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'40vh', color:'var(--text-muted)', gap:'0.75rem' }}>
      <span className="spinner" />
      Memuat dashboard...
    </div>
  );

  const statCards = [
    {
      title: 'Total Parent Items',
      count: stats?.counts.total_parents ?? 0,
      icon: <FolderTree size={22} color="var(--accent)" />,
      bg: 'var(--accent-light)',
      border: 'var(--accent-border)',
      textColor: 'var(--accent)',
    },
    {
      title: 'Total Variant Items',
      count: stats?.counts.total_variants ?? 0,
      icon: <Box size={22} color="var(--success)" />,
      bg: 'var(--success-light)',
      border: 'var(--success-border)',
      textColor: 'var(--success)',
    },
    {
      title: 'Total Bundles',
      count: stats?.counts.total_bundles ?? 0,
      icon: <PackageSearch size={22} color="var(--warning)" />,
      bg: 'var(--warning-light)',
      border: 'var(--warning-border)',
      textColor: 'var(--warning)',
    },
    {
      title: 'Kategori Produk',
      count: stats?.counts.total_categories ?? 0,
      icon: <BarChart3 size={22} color="var(--danger)" />,
      bg: 'var(--danger-light)',
      border: 'var(--danger-border)',
      textColor: 'var(--danger)',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>Selamat datang kembali, <strong>{user?.name}</strong></p>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(210px, 1fr))', gap:'1rem', marginBottom:'1.75rem' }}>
        {statCards.map((s, i) => (
          <div key={i} className="card animate-fade-in" style={{ animationDelay:`${i * 0.06}s`, display:'flex', alignItems:'center', gap:'1rem', padding:'1.25rem 1.375rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-lg)',
              background: s.bg, border: `1.5px solid ${s.border}`,
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.15rem' }}>
                {s.title}
              </div>
              <div style={{ fontSize:'1.75rem', fontWeight:800, color:s.textColor, lineHeight:1.1 }}>
                {s.count.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Tables */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(400px, 1fr))', gap:'1.25rem' }}>
        
        {/* Recent Variants */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', padding:'1rem 1.25rem', borderBottom:'1.5px solid var(--border)', background:'var(--bg-surface-2)' }}>
            <div style={{ width:30, height:30, borderRadius:'var(--radius-md)', background:'var(--accent-light)', border:'1px solid var(--accent-border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Activity size={15} color="var(--accent)" />
            </div>
            <h3 style={{ margin:0, fontSize:'0.9rem' }}>Variant Terbaru</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Parent</th>
                <th>Model / Warna</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent?.recent_variants?.map(v => (
                <tr key={v.variant_sku}>
                  <td><span className="badge badge-success">{v.variant_sku}</span></td>
                  <td style={{ maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.parent_name}</td>
                  <td style={{ color:'var(--text-secondary)' }}>{v.model_type}</td>
                  <td><span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{new Date(v.created_at).toLocaleDateString('id-ID')}</span></td>
                </tr>
              ))}
              {!stats?.recent?.recent_variants?.length && (
                <tr><td colSpan="4" style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)', fontSize:'0.875rem' }}>Belum ada data</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Bundles */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', padding:'1rem 1.25rem', borderBottom:'1.5px solid var(--border)', background:'var(--bg-surface-2)' }}>
            <div style={{ width:30, height:30, borderRadius:'var(--radius-md)', background:'var(--warning-light)', border:'1px solid var(--warning-border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <TrendingUp size={15} color="var(--warning)" />
            </div>
            <h3 style={{ margin:0, fontSize:'0.9rem' }}>Bundle Terbaru</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Nama Bundle</th>
                <th>Divisi</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent?.recent_bundles?.map(b => (
                <tr key={b.bundle_sku}>
                  <td><span className="badge badge-warning">{b.bundle_sku}</span></td>
                  <td style={{ maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.bundle_name}</td>
                  <td>
                    <span className={`badge ${b.created_by_div === 'product' ? 'badge-primary' : 'badge-warning'}`}>
                      {b.created_by_div}
                    </span>
                  </td>
                  <td><span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{new Date(b.created_at).toLocaleDateString('id-ID')}</span></td>
                </tr>
              ))}
              {!stats?.recent?.recent_bundles?.length && (
                <tr><td colSpan="4" style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)', fontSize:'0.875rem' }}>Belum ada data</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
