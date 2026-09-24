import React from 'react';
import {
  LayoutDashboard,
  Mic,
  PlusCircle,
  Wand2,
  History,
  Settings,
  Home,
  LogOut,
  Lock,
  User,
} from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthContext';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  className = '',
}) => {
  const { user, isAuthenticated, logout } = useAuth();

  const navItems = [
    {
      id: 'nav-item-landing',
      label: 'Home',
      path: '/',
      icon: Home,
      isPublic: true,
    },
    {
      id: 'nav-item-studio',
      label: 'Studio Dashboard',
      path: '/studio',
      icon: LayoutDashboard,
      isPublic: false,
    },
    {
      id: 'nav-item-voices',
      label: 'Voice Library',
      path: '/voices',
      icon: Mic,
      isPublic: false,
    },
    {
      id: 'nav-item-register',
      label: 'Register Voice',
      path: '/voices/register',
      icon: PlusCircle,
      isPublic: false,
    },
    {
      id: 'nav-item-generate',
      label: 'Text-to-Speech',
      path: '/generate',
      icon: Wand2,
      isPublic: false,
    },
    {
      id: 'nav-item-generations',
      label: 'Generation History',
      path: '/generations',
      icon: History,
      isPublic: false,
    },
    {
      id: 'nav-item-settings',
      label: 'Settings & Status',
      path: '/settings',
      icon: Settings,
      isPublic: false,
    },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (!item.isPublic && !isAuthenticated) {
      onNavigate('/login');
    } else {
      onNavigate(item.path);
    }
  };

  const displayName = user?.name || user?.username || user?.email?.split('@')[0] || 'User';

  return (
    <aside
      id="studio-sidebar"
      className={`w-64 border-r border-slate-800/80 bg-slate-950/60 backdrop-blur-xl flex flex-col justify-between p-4 ${className}`}
    >
      <div className="space-y-6">
        <div>
          <span className="px-3 text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400">
            Navigation
          </span>
          <div className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? currentPath === '/'
                  : currentPath === item.path || currentPath.startsWith(`${item.path}/`);

              const isLocked = !item.isPublic && !isAuthenticated;

              return (
                <button
                  key={item.id}
                  id={item.id}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer text-left ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? 'text-cyan-400' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {isLocked && <Lock className="w-3.5 h-3.5 text-slate-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Neural Architecture quick tip */}
        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs font-mono space-y-1.5">
          <div className="text-cyan-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>NeuTTS Zero-Shot</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Acoustic latent codes are generated with FastAPI backend zero-shot cloning.
          </p>
        </div>
      </div>

      {/* User Session & Footer Info */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        {isAuthenticated ? (
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{displayName}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{user?.email || 'Logged in'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                onNavigate('/login');
              }}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate('/login')}
            className="w-full py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sign In Required</span>
          </button>
        )}

        <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between px-1">
          <span>NeuTTS v1.2</span>
          <button
            type="button"
            onClick={() => onNavigate('/settings')}
            className="hover:text-cyan-300 transition-colors cursor-pointer"
          >
            Config
          </button>
        </div>
      </div>
    </aside>
  );
};
