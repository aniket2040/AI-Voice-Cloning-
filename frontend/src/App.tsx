import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { NeuralBackground } from './components/ui/NeuralBackground';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StudioPage } from './pages/StudioPage';
import { VoicesListPage } from './pages/VoicesListPage';
import { VoiceRegisterPage } from './pages/VoiceRegisterPage';
import { VoiceDetailsPage } from './pages/VoiceDetailsPage';
import { GeneratePage } from './pages/GeneratePage';
import { GenerationsPage } from './pages/GenerationsPage';
import { SettingsPage } from './pages/SettingsPage';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
      setIsMobileSidebarOpen(false);
    };

    const handleAuthExpired = () => {
      setRedirectNotice('Your session has expired. Please sign in again.');
      window.history.pushState({}, '', '/login');
      setCurrentPath('/login');
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('ai_voice_studio_auth_expired', handleAuthExpired);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('ai_voice_studio_auth_expired', handleAuthExpired);
    };
  }, []);

  const navigate = (path: string) => {
    if (path === currentPath) return;
    setRedirectNotice(null);
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Loading spinner while verifying token on boot
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080a0f] text-slate-100 flex flex-col items-center justify-center relative">
        <NeuralBackground />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(6,182,212,0.4)]">
            <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-xs font-mono text-cyan-300 tracking-wider">
            VERIFYING JWT AUTHENTICATION...
          </p>
        </div>
      </div>
    );
  }

  // Route matching & Authentication Guard
  const renderContent = () => {
    // 1. Authentication Pages (Public)
    if (currentPath === '/login') {
      return <LoginPage onNavigate={navigate} redirectMessage={redirectNotice} />;
    }
    if (currentPath === '/register') {
      return <RegisterPage onNavigate={navigate} />;
    }

    // 2. Landing Page (Public)
    if (currentPath === '/') {
      return (
        <div className="w-full">
          <LandingPage onNavigate={navigate} />
          <Footer onNavigate={navigate} />
        </div>
      );
    }

    // 3. Security Guard: All remaining routes require proper JWT authentication!
    if (!isAuthenticated) {
      return (
        <LoginPage
          onNavigate={navigate}
          redirectMessage="Security restriction: Please sign in with your JWT credentials to access this feature."
        />
      );
    }

    // 4. Studio Dashboard (Protected)
    if (currentPath === '/studio') {
      return <StudioPage onNavigate={navigate} />;
    }

    // 5. Register Voice (Protected)
    if (currentPath === '/voices/register') {
      return <VoiceRegisterPage onNavigate={navigate} />;
    }

    // 6. Voice-specific generate: /voices/:voiceId/generate (Protected)
    const voiceGenerateMatch = currentPath.match(/^\/voices\/([^/]+)\/generate$/);
    if (voiceGenerateMatch) {
      const voiceId = voiceGenerateMatch[1];
      return <GeneratePage preselectedVoiceId={voiceId} onNavigate={navigate} />;
    }

    // 7. Voice details: /voices/:voiceId (Protected)
    const voiceDetailsMatch = currentPath.match(/^\/voices\/([^/]+)$/);
    if (voiceDetailsMatch) {
      const voiceId = voiceDetailsMatch[1];
      return <VoiceDetailsPage voiceId={voiceId} onNavigate={navigate} />;
    }

    // 8. Voice Library list (Protected)
    if (currentPath === '/voices') {
      return <VoicesListPage onNavigate={navigate} />;
    }

    // 9. General Text-to-Speech (Protected)
    if (currentPath === '/generate') {
      return <GeneratePage onNavigate={navigate} />;
    }

    // 10. Generation History (Protected)
    if (currentPath === '/generations') {
      return <GenerationsPage onNavigate={navigate} />;
    }

    // 11. Settings (Protected)
    if (currentPath === '/settings') {
      return <SettingsPage onNavigate={navigate} />;
    }

    // Default fallback
    return <StudioPage onNavigate={navigate} />;
  };

  const isLanding = currentPath === '/';
  const isAuthPage = currentPath === '/login' || currentPath === '/register';

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 flex flex-col relative selection:bg-cyan-500/25 selection:text-cyan-200">
      {/* Dynamic neural canvas background */}
      <NeuralBackground />

      {/* Primary Sticky Navbar */}
      <Navbar currentPath={currentPath} onNavigate={navigate} />

      {/* Main Layout Area */}
      {isLanding || isAuthPage ? (
        <main className="flex-1 z-10">{renderContent()}</main>
      ) : (
        <div className="flex-1 flex w-full max-w-7xl mx-auto z-10">
          {/* Desktop Left Sidebar */}
          <Sidebar
            currentPath={currentPath}
            onNavigate={navigate}
            className="hidden md:flex flex-shrink-0 min-h-[calc(100vh-4rem)]"
          />

          {/* Mobile Navigation Header / Drawer toggle */}
          <div className="md:hidden fixed bottom-4 right-4 z-50">
            <button
              id="mobile-nav-toggle-btn"
              type="button"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="p-3.5 rounded-full bg-cyan-500 text-slate-950 font-bold shadow-[0_0_25px_rgba(6,182,212,0.6)] cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <span className="text-xs font-mono uppercase tracking-wider">Menu</span>
            </button>
          </div>

          {/* Mobile Navigation Drawer Modal */}
          {isMobileSidebarOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md md:hidden flex"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <div
                className="w-72 bg-slate-950 border-r border-slate-800 p-4 h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                  <span className="font-bold text-white text-sm">AI VOICE STUDIO</span>
                  <button
                    type="button"
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="text-xs text-slate-400 p-1"
                  >
                    Close
                  </button>
                </div>
                <Sidebar currentPath={currentPath} onNavigate={navigate} />
              </div>
            </div>
          )}

          {/* Content Area */}
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
            {renderContent()}
          </main>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
