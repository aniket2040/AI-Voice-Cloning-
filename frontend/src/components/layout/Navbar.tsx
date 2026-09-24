import React from 'react';
import { Mic2, Sparkles, PlusCircle, User, LogOut, LogIn, UserPlus, Shield } from 'lucide-react';
import { AIStatusIndicator } from '../ui/AIStatusIndicator';
import { useAuth } from '../../lib/auth/AuthContext';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleProtectedNavigate = (path: string) => {
    if (!isAuthenticated) {
      onNavigate('/login');
    } else {
      onNavigate(path);
    }
  };

  const displayName = user?.name || user?.username || user?.email?.split('@')[0] || 'User';

  return (
    <nav
      id="main-navbar"
      className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-xl transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo / Brand */}
        <button
          id="nav-logo-btn"
          type="button"
          onClick={() => onNavigate('/')}
          className="flex items-center gap-3 group text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-slate-950 font-bold shadow-[0_0_20px_rgba(6,182,212,0.35)] group-hover:scale-105 transition-all">
            <Mic2 className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-wider text-white font-sans">
                AI VOICE STUDIO
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                v1.2
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 -mt-0.5 tracking-wide hidden sm:block">
              Neural Flow Cloning Engine
            </p>
          </div>
        </button>

        {/* Center / Right Links */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Backend Status compact */}
          <AIStatusIndicator compact={true} />

          {isAuthenticated ? (
            <>
              {/* User Identity Chip */}
              <button
                id="nav-user-chip"
                type="button"
                onClick={() => onNavigate('/settings')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:border-slate-700 transition-colors cursor-pointer"
                title={`Signed in as ${user?.email || displayName}. Click to open Settings.`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span className="truncate max-w-[110px]">{displayName}</span>
              </button>

              {/* Quick Register CTA */}
              <button
                id="nav-register-voice-btn"
                type="button"
                onClick={() => handleProtectedNavigate('/voices/register')}
                className={`hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                  currentPath === '/voices/register'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Register Voice</span>
              </button>

              {/* Quick Studio CTA */}
              <button
                id="nav-studio-btn"
                type="button"
                onClick={() => handleProtectedNavigate('/studio')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  currentPath.startsWith('/studio') || currentPath.startsWith('/generate')
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-gradient-to-r from-cyan-500/90 to-blue-600/90 hover:from-cyan-400 hover:to-blue-500 text-slate-950'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open Studio</span>
              </button>

              {/* Sign Out Button */}
              <button
                id="nav-logout-btn"
                type="button"
                onClick={() => {
                  logout();
                  onNavigate('/login');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-300 border border-slate-800 hover:border-red-500/30 text-xs transition-colors cursor-pointer"
                title="Sign out of this session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </>
          ) : (
            <>
              {/* Not Logged In: Sign In & Register Buttons */}
              <button
                id="nav-signin-btn"
                type="button"
                onClick={() => onNavigate('/login')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                  currentPath === '/login'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sign In</span>
              </button>

              <button
                id="nav-signup-btn"
                type="button"
                onClick={() => onNavigate('/register')}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
