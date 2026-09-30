import { Component, createRef, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class LazyBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  private retryButtonRef = createRef<HTMLButtonElement>();

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[LazyBoundary] chunk load error:', error, info.componentStack);
  }

  componentDidUpdate(_prevProps: Props, prevState: State) {
    if (!prevState.hasError && this.state.hasError) {
      this.retryButtonRef.current?.focus();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="xelma-grid-bg min-h-screen flex items-center justify-center">
          <div
            role="alert"
            aria-live="assertive"
            className="glass-card rounded-xl p-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4"
          >
            <p className="text-sm font-medium text-gray-400 text-center">
              This page failed to load. Check your connection and try again.
            </p>
            <button
              ref={this.retryButtonRef}
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="btn-primary rounded-lg px-6 py-2 text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LazyBoundary;
