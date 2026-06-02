import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Boxes, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Login gagal. Periksa kembali username dan password Anda.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan pada server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F7FA 50%, #E0F2FE 100%)',
    }}>
      {/* Left decorative panel */}
      <div style={{
        display: 'none',
        flex: 1,
        background: 'var(--bg-sidebar)',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4rem',
        position: 'relative',
        overflow: 'hidden',
      }} className="login-panel-left">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'2.5rem' }}>
            <div style={{ width:40, height:40, background:'var(--accent)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Boxes size={22} color="#fff" />
            </div>
            <span style={{ color:'#fff', fontWeight:700, fontSize:'1.1rem' }}>SKU Generator</span>
          </div>
          <h2 style={{ color:'#fff', fontSize:'2rem', marginBottom:'1rem', lineHeight:1.3 }}>
            Portal Internal<br/>Pilar Group
          </h2>
          <p style={{ color:'rgba(255,255,255,0.55)', lineHeight:1.8, maxWidth:340 }}>
            Kelola data Master Item, generate SKU otomatis, dan pantau inventaris dengan mudah.
          </p>
        </div>
        {/* Decoration circles */}
        <div style={{ position:'absolute', width:320, height:320, borderRadius:'50%', background:'rgba(255,255,255,0.04)', bottom:-80, right:-80 }} />
        <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.04)', top:80, right:40 }} />
      </div>

      {/* Right: Login form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div className="animate-fade-in" style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-2xl)',
          border: '1.5px solid var(--border)',
          boxShadow: 'var(--shadow-xl)',
          padding: '2.5rem',
        }}>
          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:'2rem' }}>
            <div style={{
              width: 60, height: 60,
              background: 'var(--accent-light)',
              borderRadius: 'var(--radius-xl)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              border: '1.5px solid var(--accent-border)',
            }}>
              <Boxes size={28} color="var(--accent)" />
            </div>
            <h1 style={{ fontSize:'1.5rem', marginBottom:'0.25rem' }}>Selamat Datang</h1>
            <p style={{ color:'var(--text-muted)', fontSize:'0.875rem', margin:0 }}>
              Masuk ke portal internal Pilar Group
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error mb-3">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div className="form-group">
              <label htmlFor="login-username">Username</label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Masukkan username Anda"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div style={{ position:'relative' }}>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{ paddingRight:'2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)',
                    display:'flex', alignItems:'center', padding:0,
                  }}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={isLoading}
              style={{ marginTop:'0.5rem', padding:'0.7rem 1rem', fontSize:'0.9rem' }}
            >
              {isLoading
                ? <><span className="spinner" style={{ borderTopColor:'#fff' }}></span> Memverifikasi...</>
                : <><KeyRound size={17} /> Masuk ke Sistem</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
