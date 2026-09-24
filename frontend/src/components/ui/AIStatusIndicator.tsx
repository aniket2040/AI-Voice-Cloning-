import React, { useEffect, useState } from 'react';
import {
  Activity,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  X,
  Radio,
  ArrowRight,
} from 'lucide-react';
import {
  checkBackendHealth,
  getApiBaseUrl,
  setApiBaseUrl,
  resetMappedApiUrl,
} from '../../lib/api/client';
import { BackendHealthResponse } from '../../lib/types';

interface AIStatusIndicatorProps {
  compact?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export const AIStatusIndicator: React.FC<AIStatusIndicatorProps> = ({
  compact = false,
  className = '',
}) => {
  const [health, setHealth] = useState<BackendHealthResponse | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [currentBaseUrl, setCurrentBaseUrl] = useState(() => getApiBaseUrl());

  const runHealthCheck = async (targetUrl?: string) => {
    setIsChecking(true);
    setStatusMessage(null);
    try {
      if (targetUrl) {
        setApiBaseUrl(targetUrl);
        setCurrentBaseUrl(targetUrl);
      }
      const res = await checkBackendHealth();
      setHealth(res);
      if (res.mode === 'live' && (res.status === 'healthy' || res.status === 'ok')) {
        setStatusMessage('Backend connected successfully!');
      } else {
        setStatusMessage('Backend unreachable at this address.');
      }
    } catch {
      setHealth({ status: 'offline', mode: 'simulation' });
      setStatusMessage('Backend unreachable.');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
    const interval = setInterval(() => runHealthCheck(), 30000); // every 30s
    return () => clearInterval(interval);
  }, []);

  const isLive = health?.mode === 'live' && (health?.status === 'healthy' || health?.status === 'ok');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    runHealthCheck(customUrl.trim());
  };

  const handleResetDefault = () => {
    const defaultUrl = resetMappedApiUrl();
    setCurrentBaseUrl(defaultUrl);
    setCustomUrl(defaultUrl);
    runHealthCheck(defaultUrl);
  };

  const isClientHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isTargetHttp = currentBaseUrl.startsWith('http://');
  const isMixedContentIssue = isClientHttps && isTargetHttp;

  return (
    <>
      {compact ? (
        <button
          type="button"
          id="backend-status-badge-compact"
          onClick={() => setIsModalOpen(true)}
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border backdrop-blur-md transition-all cursor-pointer hover:ring-1 hover:ring-cyan-500/50 ${
            isLive
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
          } ${className}`}
          title={`Backend: ${currentBaseUrl} - Click to configure / troubleshoot`}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isLive ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isLive ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="tracking-wider">
            {isLive ? 'API CONNECTED' : 'BACKEND OFFLINE'}
          </span>
          {isLive && health?.latency_ms !== undefined ? (
            <span className="text-[10px] text-slate-400">{health.latency_ms}ms</span>
          ) : (
            <span className="text-[10px] underline text-amber-300/80">Fix</span>
          )}
        </button>
      ) : (
        <div
          id="backend-status-card"
          className={`p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col gap-3 ${className}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-1.5 rounded-lg ${
                  isLive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {isLive ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-white uppercase tracking-wider">
                    {isLive ? 'Backend API Connected' : 'Backend API Offline'}
                  </span>
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
                  {currentBaseUrl}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-2 py-1 rounded text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors cursor-pointer"
              >
                Troubleshoot
              </button>
              <button
                type="button"
                id="refresh-backend-status-btn"
                onClick={() => runHealthCheck()}
                disabled={isChecking}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh backend status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
            <div className="text-slate-400">
              Status:{' '}
              <span className={isLive ? 'text-emerald-300' : 'text-amber-300'}>
                {isLive ? 'Connected' : 'Offline / Waiting for server'}
              </span>
            </div>
            <div className="text-slate-400 text-right">
              Endpoint: <span className="text-cyan-300">{currentBaseUrl}</span>
            </div>
          </div>
        </div>
      )}

      {/* Troubleshooting & Connection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl p-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${isLive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Backend Connection & Diagnostics</h3>
                  <p className="text-xs text-slate-400 font-mono">Current target: <span className="text-cyan-300">{currentBaseUrl}</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Why It's Offline Notice */}
            {isMixedContentIssue && !isLive && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-mono space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Why is http://127.0.0.1:8000 blocked?</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  This app is loaded on secure <strong>HTTPS</strong>. Web browsers block web pages from directly calling insecure <strong>http://</strong> on localhost (Mixed Content & Private Network security).
                </p>
              </div>
            )}

            {/* Quick URL Switcher & Test */}
            <form onSubmit={handleApplyUrl} className="space-y-2">
              <label className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider block">
                Target Backend URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customUrl || currentBaseUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://xxxx.ngrok-free.app or http://127.0.0.1:8000"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={isChecking}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>Test & Save</span>
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-0.5">
                <span>Default: <code className="text-cyan-400">http://127.0.0.1:8000</code></span>
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="text-cyan-400 hover:underline cursor-pointer"
                >
                  Reset to default
                </button>
              </div>
            </form>

            {statusMessage && (
              <div className={`p-2.5 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                isLive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                {isLive ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Recommended Solutions */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-mono font-semibold text-white uppercase tracking-wider">
                How To Connect (2 Easy Options)
              </h4>

              {/* Option 1: localtunnel / ngrok */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-300 flex items-center gap-1">
                    Option 1 (Recommended): Expose with HTTPS Tunnel
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400">
                    Works 100%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Run this in your terminal on your computer where port 8000 is running:
                </p>
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-slate-800 text-[11px] text-cyan-300">
                  <code>npx localtunnel --port 8000</code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('npx localtunnel --port 8000', 'localtunnel')}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    title="Copy command"
                  >
                    {copiedKey === 'localtunnel' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-slate-800 text-[11px] text-cyan-300">
                  <code>ngrok http 8000</code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('ngrok http 8000', 'ngrok')}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    title="Copy command"
                  >
                    {copiedKey === 'ngrok' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Then copy the <code className="text-cyan-300">https://...</code> URL output, paste it into the box above, and click <strong>Test & Save</strong>!
                </p>
              </div>

              {/* Option 2: Browser Insecure Content Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs font-mono">
                <span className="font-semibold text-cyan-300 block">
                  Option 2: Allow Insecure Content in Chrome
                </span>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
                  <li>In Chrome's address bar, click the <strong>Site settings / Tune icon</strong> (left of URL).</li>
                  <li>Click <strong>Site settings</strong>.</li>
                  <li>Find <strong>Insecure content</strong> and change it to <strong>Allow</strong>.</li>
                  <li>Reload this page and click <strong>Test & Save</strong>.</li>
                </ol>
              </div>

              {/* FastAPI CORS Snippet */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">FastAPI CORS Requirement:</span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        `from fastapi.middleware.cors import CORSMiddleware\n\napp.add_middleware(\n    CORSMiddleware,\n    allow_origins=["*"],\n    allow_credentials=True,\n    allow_methods=["*"],\n    allow_headers=["*"],\n)`,
                        'cors'
                      )
                    }
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'cors' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'cors' ? 'Copied' : 'Copy code'}</span>
                  </button>
                </div>
                <pre className="p-2 rounded bg-black/60 text-[10px] text-slate-300 overflow-x-auto">
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

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
