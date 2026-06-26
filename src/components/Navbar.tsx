// ISSUE: Integrate Freighter wallet connection (@stellar/freighter-api) — partial: uses useWalletStore
// ISSUE: Build Leaderboard page (/leaderboard)
// ISSUE: Build Tournament page (/tournament)
// ISSUE: Build User Profile page (/profile)

import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Menu, X } from 'lucide-react';
import { useWalletStore, selectIsWalletConnected } from '../store/useWalletStore';
import { mockUserStats } from '../data/mockData';
import Logo from '../assets/logo.svg';

interface NavLinkItem {
  label: string;
  to: string;
  disabled?: boolean;
  tooltip?: string;
}

const navLinks: NavLinkItem[] = [
  { label: 'Terminal', to: '/dashboard' },
  { label: 'Leaderboard', to: '/leaderboard', disabled: true, tooltip: 'Coming Soon' },
  { label: 'Learn', to: '/learn' },
  { label: 'Tournament', to: '/tournament' },
  { label: 'Profile', to: '/profile' },
];

function truncateAddress(key: string): string {
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export default function Navbar() {
  const location = useLocation();
  const isConnected = useWalletStore(selectIsWalletConnected);
  const publicKey = useWalletStore((s) => s.publicKey);
  const status = useWalletStore((s) => s.status);
  const connect = useWalletStore((s) => s.connect);
  const checkConnection = useWalletStore((s) => s.checkConnection);
  const isConnecting = status === 'connecting' || status === 'checking';

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void checkConnection();
  }, [checkConnection]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  // Handle click outside to close mobile menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node) && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Prevent scrolling when drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const closeMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#BEC7FE]/10 bg-[#0A0F1A]/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 shrink-0" onClick={closeMenu}>
            <img src={Logo} alt="Xelma" className="h-9 w-9" />
            <span className="text-xl font-bold tracking-tight text-white">Xelma</span>
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden items-center gap-1 md:flex">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.to;

              if (item.disabled) {
                return (
                  <li key={item.label}>
                    <span
                      className="cursor-not-allowed rounded-lg px-4 py-2 text-sm font-medium text-gray-600"
                      title={item.tooltip}
                    >
                      {item.label}
                    </span>
                  </li>
                );
              }

              return (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#2C4BFD]/20 text-[#BEC7FE]'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Desktop Wallet & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 md:flex">
              {isConnected && publicKey ? (
                <>
                  <span className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200">
                    {mockUserStats.balance.toLocaleString()} vXLM
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-gray-300">
                    {truncateAddress(publicKey)}
                  </span>
                </>
              ) : null}

              <button
                type="button"
                onClick={() => void connect()}
                disabled={isConnecting}
                className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {isConnecting ? 'Connecting…' : isConnected ? 'Connected' : 'Connect Wallet'}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="md:hidden rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={closeMenu}
            aria-hidden="true"
          />
          
          {/* Drawer */}
          <div 
            ref={drawerRef}
            className="relative ml-auto flex h-full w-full max-w-[280px] flex-col overflow-y-auto bg-[#0A0F1A] border-l border-[#BEC7FE]/10 p-6 shadow-2xl animate-in slide-in-from-right duration-200"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="text-xl font-bold tracking-tight text-white">Menu</span>
              <button
                type="button"
                onClick={closeMenu}
                className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex flex-col gap-4">
              {navLinks.map((item) => {
                const isActive = location.pathname === item.to;
                if (item.disabled) {
                  return (
                    <span
                      key={item.label}
                      className="cursor-not-allowed rounded-lg px-4 py-3 text-sm font-medium text-gray-600 bg-white/5"
                    >
                      {item.label} <span className="text-xs text-gray-500 ml-1">({item.tooltip})</span>
                    </span>
                  );
                }
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={closeMenu}
                    className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#2C4BFD]/20 text-[#BEC7FE]'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 pt-8 border-t border-[#BEC7FE]/10 flex flex-col gap-4">
              {isConnected && publicKey ? (
                <div className="flex flex-col gap-3 mb-2">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm text-gray-400">Balance</span>
                    <span className="text-sm font-semibold text-cyan-200">
                      {mockUserStats.balance.toLocaleString()} vXLM
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm text-gray-400">Address</span>
                    <span className="font-mono text-sm text-gray-300">
                      {truncateAddress(publicKey)}
                    </span>
                  </div>
                </div>
              ) : null}
              
              <button
                type="button"
                onClick={() => {
                  void connect();
                  if (isConnected) closeMenu(); // optional: keep open if starting connect flow
                }}
                disabled={isConnecting}
                className="btn-primary w-full rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-60"
              >
                {isConnecting ? 'Connecting…' : isConnected ? 'Connected' : 'Connect Wallet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
