import { Component, createRef, Fragment, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, AlertCircle, Home, RefreshCw, RotateCcw } from 'lucide-react';

const MAX_RETRIES = 3;

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  retryKey: number;
}

/**
 * Route-level error boundary with retry (remount) and go-home recovery actions.
 * Wrap routed content in App.tsx so every route gets a contained fallback UI
 * instead of a full white screen.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    retryCount: 0,
    retryKey: 0,
  };

  private containerRef = createRef<HTMLDivElement>();
  private retryButtonRef = createRef<HTMLButtonElement>();

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] uncaught error:', error, info.componentStack);
  }

  componentDidMount() {
    if (this.state.hasError) {
      this.focusAlert();
    }
  }

  componentDidUpdate(_prevProps: Props, prevState: State) {
    if (this.state.hasError && !prevState.hasError) {
      this.focusAlert();
    }
  }

  private focusAlert = () => {
    requestAnimationFrame(() => {
      if (this.retryButtonRef.current) {
        this.retryButtonRef.current.focus();
      } else if (this.containerRef.current) {
        this.containerRef.current.focus();
      }
    });
  };

  private handleRetry = () => {
    if (this.state.retryCount >= MAX_RETRIES) {
      return;
    }
    this.props.onReset?.();
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
      retryKey: prev.retryKey + 1,
    }));
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    this.props.onReset?.();
    this.setState({
      hasError: false,
      error: null,
      retryCount: 0,
    });
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      const isMaxRetriesReached = this.state.retryCount >= MAX_RETRIES;

      return (
        <div
          ref={this.containerRef}
          role="alert"
          aria-live="assertive"
          aria-labelledby="error-boundary-heading"
          aria-describedby="error-boundary-desc"
          tabIndex={-1}
          className="xelma-grid-bg relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8 outline-none"
        >
          {/* Ambient glows matching Xelma terminal theme */}
          <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-rose-500/5 blur-3xl" />
            <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-[#2C4BFD]/8 blur-3xl" />
          </div>

          <div className="glass-card relative flex w-full max-w-md flex-col items-center rounded-2xl border border-rose-500/20 bg-[#111827]/85 p-6 text-center shadow-2xl backdrop-blur-xl sm:p-8">
            {/* Status header badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-rose-300">
              <span className="status-dot status-dot-red motion-safe:animate-pulse" aria-hidden="true" />
              Terminal Fault Detected
            </div>

            {/* Branded Icon Container */}
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 shadow-[0_0_24px_rgba(244,63,94,0.15)]">
              <AlertTriangle className="h-10 w-10 text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]" aria-hidden="true" />
            </div>

            <div className="flex flex-col gap-2">
              <h2 id="error-boundary-heading" className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Something went wrong
              </h2>
              <p id="error-boundary-desc" className="text-sm leading-relaxed text-gray-300">
                An unexpected runtime error occurred on this page. You can retry mounting the terminal route or return home.
              </p>
            </div>

            {/* Diagnostic message snippet */}
            {this.state.error?.message && (
              <div className="mt-4 w-full rounded-xl border border-rose-500/15 bg-black/50 p-3 text-left">
                <span className="mb-1 block text-[10px] font-mono font-bold uppercase tracking-widest text-rose-400/80">
                  Diagnostic Message
                </span>
                <code className="block max-h-24 overflow-y-auto font-mono text-xs text-rose-200/90 break-words leading-relaxed">
                  {this.state.error.message}
                </code>
              </div>
            )}

            {/* Max retries alert if threshold hit */}
            {isMaxRetriesReached ? (
              <div className="mt-5 flex w-full items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-left text-xs text-amber-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                <div>
                  <span className="font-bold text-amber-300">Max retries exceeded ({MAX_RETRIES}/{MAX_RETRIES}).</span>
                  <p className="mt-0.5 text-amber-200/80">Automatic recovery attempts reached the safety threshold to prevent infinite retry loops.</p>
                </div>
              </div>
            ) : this.state.retryCount > 0 ? (
              <p className="mt-3 font-mono text-xs text-gray-400">
                Retry attempt {this.state.retryCount} of {MAX_RETRIES}
              </p>
            ) : null}

            {/* Action buttons */}
            <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
              {isMaxRetriesReached ? (
                <button
                  type="button"
                  ref={this.retryButtonRef}
                  onClick={this.handleReload}
                  className="btn-primary flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold active:scale-[0.98]"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Reload Page
                </button>
              ) : (
                <button
                  type="button"
                  ref={this.retryButtonRef}
                  onClick={this.handleRetry}
                  className="btn-primary flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold active:scale-[0.98]"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Retry
                </button>
              )}
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-colors active:scale-[0.98]"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <Fragment key={this.state.retryKey}>{this.props.children}</Fragment>;
  }
}

export default ErrorBoundary;
