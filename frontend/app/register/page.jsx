'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('https://decision-ai-production-89e7.up.railway.app/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.message || 'Registration failed'); return; }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/');
    } catch { setError('Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, sans-serif', padding: '24px'}}>
      <div style={{width: '100%', maxWidth: '380px'}}>

        <div style={{textAlign: 'center', marginBottom: '40px'}}>
          <div style={{width: '40px', height: '40px', borderRadius: '10px', background: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'}}>
            <span style={{fontSize: '20px', fontWeight: '700', color: '#000'}}>d</span>
          </div>
          <h1 style={{fontSize: '22px', fontWeight: '600', color: '#F5F5F5', marginBottom: '6px'}}>Create account</h1>
          <p style={{fontSize: '14px', color: '#555'}}>Start making better decisions with AI</p>
        </div>

        {error && (
          <div style={{background: '#1A0A0A', border: '1px solid #3A1A1A', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px'}}>
            <p style={{fontSize: '13px', color: '#FF6B6B'}}>{error}</p>
          </div>
        )}

        <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px'}}>
          <div>
            <label style={{fontSize: '13px', color: '#888', display: 'block', marginBottom: '6px'}}>Full name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="John Doe"
              style={{width: '100%', padding: '11px 14px', background: '#111111', border: '1px solid #222222', borderRadius: '10px', fontSize: '14px', color: '#F5F5F5', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'}}
            />
          </div>
          <div>
            <label style={{fontSize: '13px', color: '#888', display: 'block', marginBottom: '6px'}}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{width: '100%', padding: '11px 14px', background: '#111111', border: '1px solid #222222', borderRadius: '10px', fontSize: '14px', color: '#F5F5F5', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'}}
            />
          </div>
          <div>
            <label style={{fontSize: '13px', color: '#888', display: 'block', marginBottom: '6px'}}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              placeholder="Min 6 characters"
              style={{width: '100%', padding: '11px 14px', background: '#111111', border: '1px solid #222222', borderRadius: '10px', fontSize: '14px', color: '#F5F5F5', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'}}
            />
          </div>
        </div>

        <button onClick={handleRegister} disabled={loading}
          style={{width: '100%', padding: '12px', background: '#38BDF8', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '500', color: '#000', cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, marginBottom: '16px'}}
        >{loading ? 'Creating account...' : 'Create account'}</button>

        <p style={{textAlign: 'center', fontSize: '13px', color: '#555'}}>
          Already have an account?{' '}
          <button onClick={() => router.push('/login')}
            style={{background: 'none', border: 'none', color: '#38BDF8', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit'}}
          >Sign in</button>
        </p>

      </div>
    </div>
  );
}