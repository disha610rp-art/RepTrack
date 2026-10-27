import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, tryDemoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    const res = await tryDemoLogin();
    setLoading(false);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏋️</div>
          <h1 className="text-2xl font-black text-white">
            Rep<span className="text-amber">Track</span>
          </h1>
          <p className="text-sm text-secondary">
            Smart Workout Planner & Progressive Overload Engine
          </p>
        </div>

        {/* Demo Fast-Track Button */}
        <button
          onClick={handleDemoLogin}
          disabled={loading}
          className="btn btn-secondary"
          style={{
            width: '100%',
            marginBottom: '1.5rem',
            borderColor: 'var(--amber)',
            color: 'var(--amber)',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
          }}
        >
          ⚡ One-Click Evaluator Demo Login
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          <div style={{ height: 1, backgroundColor: 'var(--border-color)', flex: 1 }} />
          <span>or sign in with email</span>
          <div style={{ height: 1, backgroundColor: 'var(--border-color)', flex: 1 }} />
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 8,
              backgroundColor: 'var(--red-bg)',
              color: 'var(--red)',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-secondary font-semibold block mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. athlete@reptrack.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label className="text-xs text-secondary font-semibold block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          <span className="text-secondary">Don't have an account? </span>
          <Link to="/register" className="text-amber font-semibold">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};
