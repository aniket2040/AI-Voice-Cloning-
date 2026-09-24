import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { AIStatusIndicator } from '../components/ui/AIStatusIndicator';
import { useAuth } from '../lib/auth/AuthContext';
import {
  getApiBaseUrl,
  setApiBaseUrl,
  resetMappedApiUrl,
  getRawEnvApiUrl,
  getMappedApiKey,
  setMappedApiKey,
  getMappedApiKeyHeader,
  setMappedApiKeyHeader,
  checkBackendHealth,
  API_ENDPOINTS,
} from '../lib/api/client';
import { BackendHealthResponse } from '../lib/types';
import {
  Settings,
  User,
  Server,
  Cpu,
  Save,
  CheckCircle2,
  AlertCircle,
  Radio,
  Code2,
  Key,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  LogOut,
  RefreshCw,
  Lock,
} from 'lucide-react';

interface SettingsPageProps {
  onNavigate: (path: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { user, token, isAuthenticated, logout, refreshUser } = useAuth();

  // API Base URL & Authentication Config (mapped from .env)
  const [apiUrlInput, setApiUrlInput] = useState(() => getApiBaseUrl());
  const [apiKeyInput, setApiKeyInput] = useState(() => getMappedApiKey());
  const [apiKeyHeaderInput, setApiKeyHeaderInput] = useState(() => getMappedApiKeyHeader());
  const [showApiKey, setShowApiKey] = useState(false);
  const [showJwtToken, setShowJwtToken] = useState(false);

  const [apiSaveMessage, setApiSaveMessage] = useState<string | null>(null);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<BackendHealthResponse | null>(null);
  const [isRefreshingMe, setIsRefreshingMe] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const handleSaveApiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setApiBaseUrl(apiUrlInput.trim());
    setMappedApiKey(apiKeyInput.trim());
    setMappedApiKeyHeader(apiKeyHeaderInput.trim());
    setApiSaveMessage('Backend API configuration and mapped values saved.');
    setTimeout(() => setApiSaveMessage(null), 3000);
  };

  const handleTestHealth = async () => {
    setIsTestingPing(true);
    setPingResult(null);
    try {
      const res = await checkBackendHealth();
      setPingResult(res);
    } catch {
      setPingResult({ status: 'offline', mode: 'simulation' });
    } finally {
      setIsTestingPing(false);
    }
  };

  const handleRefreshProfile = async () => {
    setIsRefreshingMe(true);
    try {
      await refreshUser();
      setRefreshMessage('Profile re-synced from GET /api/auth/me.');
    } catch {
      setRefreshMessage('Failed to refresh profile.');
    } finally {
      setIsRefreshingMe(false);
      setTimeout(() => setRefreshMessage(null), 3000);
    }
  };

  const isBackendLive =
    pingResult?.mode === 'live' &&
    (pingResult?.status === 'healthy' || pingResult?.status === 'ok');

  return (
    <div id="settings-page" className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Settings & API Configuration"
        subtitle="Manage your mapped environment variables, active JWT session, and backend connectivity."
        icon={Settings}
      />

      {/* Active JWT Authentication Session */}
      <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Active JWT Security Session
              </h3>
              <p className="text-xs text-slate-400">
                Managed via <code className="text-cyan-300 font-mono">Authorization: Bearer &lt;JWT&gt;</code> on every protected endpoint.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>JWT AUTHENTICATED</span>
            </span>
          </div>
        </div>

        {/* User Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono pt-2">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-500 block text-[11px]">User ID (UUID)</span>
            <span className="text-cyan-300 font-semibold truncate block mt-0.5" title={user?.id}>
              {user?.id || '—'}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-500 block text-[11px]">Name</span>
            <span className="text-slate-200 font-semibold truncate block mt-0.5">
              {user?.name || user?.username || '—'}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-500 block text-[11px]">Email</span>
            <span className="text-slate-200 font-semibold truncate block mt-0.5">
              {user?.email || '—'}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-slate-500 block text-[11px]">Registered Date</span>
            <span className="text-slate-300 font-semibold truncate block mt-0.5">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
            </span>
          </div>
        </div>

        {/* JWT Token Display */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Active Bearer JWT Token:</span>
            <button
              type="button"
              onClick={() => setShowJwtToken(!showJwtToken)}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              {showJwtToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showJwtToken ? 'Hide Token' : 'Reveal Token'}</span>
            </button>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-slate-300 break-all select-all">
            {showJwtToken
              ? token || '(No token active)'
              : token
              ? `${token.slice(0, 18)}••••••••••••••••••••••••••••••••••••••••••••••••${token.slice(-12)}`
              : '(No token active)'}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleRefreshProfile}
            disabled={isRefreshingMe}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors border border-slate-700 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshingMe ? 'animate-spin' : ''}`} />
            <span>Re-sync /api/auth/me</span>
          </button>

          <button
            type="button"
            onClick={() => {
              logout();
              onNavigate('/login');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-mono transition-colors border border-red-500/30 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out & Invalidate Session</span>
          </button>
        </div>

        {refreshMessage && (
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 pt-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>{refreshMessage}</span>
          </div>
        )}
      </section>

      {/* Backend API Configuration */}
      <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Environment Variables & Base URL
              </h3>
              <p className="text-xs text-slate-400">
                Mapped from <code className="text-cyan-300 font-mono">.env</code> (<code className="text-cyan-300 font-mono">VITE_API_URL</code>, <code className="text-cyan-300 font-mono">VITE_API_KEY</code>).
              </p>
            </div>
          </div>

          <AIStatusIndicator compact={true} />
        </div>

        <form onSubmit={handleSaveApiConfig} className="space-y-4 pt-2">
          {/* Base URL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="api-url-input"
                className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider block"
              >
                Backend API Base URL <span className="text-cyan-400 font-normal">(VITE_API_URL)</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const defaultUrl = resetMappedApiUrl();
                  setApiUrlInput(defaultUrl);
                  setApiSaveMessage(`Reset to .env configuration (${defaultUrl})`);
                  setTimeout(() => setApiSaveMessage(null), 3000);
                }}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1"
                title="Reset to .env file value"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset to .env default</span>
              </button>
            </div>
            <input
              id="api-url-input"
              type="text"
              value={apiUrlInput}
              onChange={(e) => setApiUrlInput(e.target.value)}
              placeholder="http://127.0.0.1:8000 or https://xxxx.ngrok-free.app"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50"
            />
          </div>

          {/* API Key & Header Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label
                htmlFor="api-key-input"
                className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider block"
              >
                Optional Static API Key <span className="text-cyan-400 font-normal">(VITE_API_KEY)</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-500 pointer-events-none">
                  <Key className="w-3.5 h-3.5" />
                </div>
                <input
                  id="api-key-input"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk_..."
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                  title={showApiKey ? 'Hide key' : 'Reveal key'}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="api-key-header-input"
                className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider block"
              >
                Header Name <span className="text-cyan-400 font-normal">(VITE_API_KEY_HEADER)</span>
              </label>
              <input
                id="api-key-header-input"
                type="text"
                value={apiKeyHeaderInput}
                onChange={(e) => setApiKeyHeaderInput(e.target.value)}
                placeholder="X-API-Key"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Mapped Config</span>
            </button>
            <button
              type="button"
              onClick={handleTestHealth}
              disabled={isTestingPing}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors border border-slate-700 cursor-pointer disabled:opacity-50"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isTestingPing ? 'Checking endpoint...' : 'Test Health Endpoint'}</span>
            </button>
          </div>

          {/* Test Health Result */}
          {pingResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-mono flex items-center gap-2.5 ${
                isBackendLive
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              {isBackendLive ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
              )}
              <span>
                {isBackendLive
                  ? `Backend connected successfully! Status: ${pingResult.status.toUpperCase()} • Latency: ${pingResult.latency_ms || 10}ms`
                  : `Backend unreachable at ${apiUrlInput}. See troubleshooting solutions below.`}
              </span>
            </div>
          )}

          {/* Local Backend Connection Guide (when using local http:// from https:// app) */}
          {apiUrlInput.startsWith('http://') && typeof window !== 'undefined' && window.location.protocol === 'https:' && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 space-y-3 font-mono">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 font-semibold block">
                    Browser Mixed-Content Notice (HTTPS ➔ HTTP):
                  </strong>
                  <p className="text-[11px] text-amber-200/80 mt-1 leading-relaxed">
                    This web app is accessed via secure HTTPS (<code className="text-white bg-slate-900 px-1 py-0.5 rounded">{window.location.origin}</code>).
                    By default, modern web browsers block web pages from directly calling insecure <code className="text-white bg-slate-900 px-1 py-0.5 rounded">http://127.0.0.1:8000</code>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px]">
                <div className="p-3 rounded-lg bg-slate-950/70 border border-amber-500/20 space-y-1.5">
                  <span className="font-semibold text-cyan-300 flex items-center gap-1">
                    Option 1 (Recommended): HTTPS Tunnel
                  </span>
                  <p className="text-slate-400">
                    Run an HTTPS tunnel on your computer to give your backend an HTTPS address:
                  </p>
                  <pre className="p-1.5 rounded bg-black/60 text-emerald-300 text-[10px] select-all overflow-x-auto">
                    npx localtunnel --port 8000
                  </pre>
                  <p className="text-slate-400 text-[10px]">
                    or <code className="text-slate-300">ngrok http 8000</code>, then paste the generated <code className="text-cyan-300">https://...</code> URL above.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/70 border border-amber-500/20 space-y-1.5">
                  <span className="font-semibold text-emerald-300 flex items-center gap-1">
                    Option 2: Allow Insecure Content in Browser
                  </span>
                  <p className="text-slate-400">
                    In Chrome: Click the icon next to the URL ➔ <strong>Site settings</strong> ➔ Set <strong>Insecure content</strong> to <strong>Allow</strong>, then reload this page.
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <span className="text-[11px] text-slate-400 block font-semibold mb-1">
                  FastAPI CORS Configuration (ensure this is enabled in your backend):
                </span>
                <pre className="p-2 rounded bg-black/70 text-slate-300 text-[10px] overflow-x-auto select-all">
{`from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)`}
                </pre>
              </div>
            </div>
          )}

          {apiSaveMessage && (
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>{apiSaveMessage}</span>
            </div>
          )}
        </form>
      </section>

      {/* Backend API Endpoints Contract & Mapping */}
      <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Backend API Route Specifications
            </h3>
            <p className="text-xs text-slate-400">
              All APIs implemented by this frontend client, secured with JWT Bearer authentication:
            </p>
          </div>
        </div>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Endpoint Path</th>
                <th className="py-2.5 px-3">Auth</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {/* Auth APIs */}
              <tr className="bg-slate-950/30">
                <td className="py-2.5 px-3 text-blue-400 font-semibold">POST</td>
                <td className="py-2.5 px-3 text-cyan-300">/api/auth/register</td>
                <td className="py-2.5 px-3 text-slate-500">Public</td>
                <td className="py-2.5 px-3 text-slate-400">User account registration</td>
              </tr>
              <tr className="bg-slate-950/30">
                <td className="py-2.5 px-3 text-blue-400 font-semibold">POST</td>
                <td className="py-2.5 px-3 text-cyan-300">/api/auth/login</td>
                <td className="py-2.5 px-3 text-slate-500">Public</td>
                <td className="py-2.5 px-3 text-slate-400">Authenticate user & issue JWT access token</td>
              </tr>
              <tr className="bg-slate-950/30">
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">GET</td>
                <td className="py-2.5 px-3 text-cyan-300">/api/auth/me</td>
                <td className="py-2.5 px-3 text-emerald-400">JWT Bearer</td>
                <td className="py-2.5 px-3 text-slate-400">Fetch authenticated user profile</td>
              </tr>

              {/* Voice APIs */}
              <tr>
                <td className="py-2.5 px-3 text-blue-400 font-semibold">POST</td>
                <td className="py-2.5 px-3 text-cyan-300">/api/voices/upload</td>
                <td className="py-2.5 px-3 text-emerald-400">JWT Bearer</td>
                <td className="py-2.5 px-3 text-slate-400">Upload sample audio (returns temp file token)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-blue-400 font-semibold">POST</td>
                <td className="py-2.5 px-3 text-cyan-300">/api/voices/register</td>
                <td className="py-2.5 px-3 text-emerald-400">JWT Bearer</td>
                <td className="py-2.5 px-3 text-slate-400">Register voice clone with name & transcript</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">GET</td>
                <td className="py-2.5 px-3 text-cyan-300">/api/voices</td>
                <td className="py-2.5 px-3 text-emerald-400">JWT Bearer</td>
                <td className="py-2.5 px-3 text-slate-400">List user's cloned voice library</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">GET</td>
                <td className="py-2.5 px-3 text-cyan-300">/api/voices/{'{voice_id}'}</td>
                <td className="py-2.5 px-3 text-emerald-400">JWT Bearer</td>
                <td className="py-2.5 px-3 text-slate-400">Get specific voice model details</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-red-400 font-semibold">DELETE</td>
                <td className="py-2.5 px-3 text-cyan-300">/api/voices/{'{voice_id}'}</td>
                <td className="py-2.5 px-3 text-emerald-400">JWT Bearer</td>
                <td className="py-2.5 px-3 text-slate-400">Delete voice profile</td>
              </tr>

              {/* Generation APIs */}
              <tr>
                <td className="py-2.5 px-3 text-blue-400 font-semibold">POST</td>
                <td className="py-2.5 px-3 text-cyan-300">/api/voices/{'{voice_id}'}/generate</td>
                <td className="py-2.5 px-3 text-emerald-400">JWT Bearer</td>
                <td className="py-2.5 px-3 text-slate-400">Generate speech from prompt text</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-emerald-400 font-semibold">GET</td>
                <td className="py-2.5 px-3 text-cyan-300">/api/voices/{'{voice_id}'}/generations/{'{generation_id}'}/audio</td>
                <td className="py-2.5 px-3 text-emerald-400">JWT Bearer</td>
                <td className="py-2.5 px-3 text-slate-400">Stream or play generated audio file</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Model Specifications */}
      <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              System Specifications
            </h3>
            <p className="text-xs text-slate-400">
              Client-side parameters and constraints.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-2">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850">
            <span className="text-slate-400 block text-[11px]">Supported Formats</span>
            <span className="text-slate-200 font-semibold">.wav, .mp3, .flac, .ogg, .m4a</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850">
            <span className="text-slate-400 block text-[11px]">Max Audio Upload</span>
            <span className="text-slate-200 font-semibold">25 MB per sample</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850">
            <span className="text-slate-400 block text-[11px]">Max Text Prompt</span>
            <span className="text-slate-200 font-semibold">5,000 Characters per inference</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850">
            <span className="text-slate-400 block text-[11px]">Authentication Protocol</span>
            <span className="text-emerald-400 font-semibold">RFC 7519 JSON Web Token (JWT)</span>
          </div>
        </div>
      </section>
    </div>
  );
};
