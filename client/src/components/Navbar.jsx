import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';

export const Navbar = () => {
  const { user, isAuthenticated, logout, toggleUnit } = useAuth();
  const { activeSession } = useWorkout();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  const currentPath = location.pathname;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
            }}
          >
            🏋️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-white tracking-tight">
                Rep<span className="text-amber">Track</span>
              </span>
              <span className="badge badge-amber text-xs">MERN Engine</span>
            </div>
          </div>
        </Link>

        {/* Desktop Links */}
        <nav className="nav-links">
          <Link
            to="/"
            className={`nav-link ${currentPath === '/' ? 'active' : ''}`}
          >
            📊 Dashboard
          </Link>

          <Link
            to="/workout"
            className={`nav-link ${currentPath === '/workout' ? 'active' : ''}`}
            style={{ position: 'relative' }}
          >
            🏋️ Workout
            {activeSession && (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                  marginLeft: 4,
                }}
              />
            )}
          </Link>

          <Link
            to="/programs"
            className={`nav-link ${currentPath.startsWith('/programs') ? 'active' : ''}`}
          >
            📋 Programs
          </Link>

          <Link
            to="/calculators"
            className={`nav-link ${currentPath === '/calculators' ? 'active' : ''}`}
          >
            🧮 Plates & 1RM
          </Link>

          <Link
            to="/exercises"
            className={`nav-link ${currentPath === '/exercises' ? 'active' : ''}`}
          >
            📖 Exercises
          </Link>

          <Link
            to="/history"
            className={`nav-link ${currentPath === '/history' ? 'active' : ''}`}
          >
            📜 History
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Unit Toggle Button */}
          <button
            onClick={toggleUnit}
            className="btn btn-secondary btn-sm font-mono font-bold"
            title="Switch between KG and LBS"
          >
            <span style={{ color: user?.settings?.unit === 'kg' ? 'var(--amber)' : 'var(--text-muted)' }}>
              KG
            </span>
            <span style={{ color: 'var(--text-muted)', margin: '0 2px' }}>/</span>
            <span style={{ color: user?.settings?.unit === 'lbs' ? 'var(--amber)' : 'var(--text-muted)' }}>
              LBS
            </span>
          </button>

          {/* Active Workout Resume Pill */}
          {activeSession && currentPath !== '/workout' && (
            <button
              onClick={() => navigate('/workout')}
              className="btn btn-sm btn-success"
              style={{ animation: 'pulse 2s infinite' }}
            >
              ▶ Resume Live
            </button>
          )}

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-secondary font-medium hidden sm:inline">
              {user?.name}
            </span>
            <button
              onClick={logout}
              className="btn btn-secondary btn-sm text-xs"
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
