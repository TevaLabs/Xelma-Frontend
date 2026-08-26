import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Route-level error boundary with retry (remount) and go-home recovery actions.
 * Wrap routed content in App.tsx so every route gets a contained fallback UI
 * instead of a full white screen.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] uncaught error:', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="xelma-grid-bg min-h-screen flex items-center justify-center px-4"
        >
          <div className="glass-card rounded-2xl p-8 flex flex-col items-center gap-5 max-w-sm w-full text-center">
            <AlertTriangle className="h-10 w-10 text-rose-400" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-white">Something went wrong</h2>
              <p className="text-sm text-gray-400">
                An unexpected error occurred on this page. You can retry or go back home.
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={this.handleRetry}
                className="btn-primary flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Retry
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10 transition-colors"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
