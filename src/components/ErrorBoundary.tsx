import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props  { children: ReactNode }
interface State  { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[NexSwap] Uncaught error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: '#0a0a1a' }}
      >
        <div className="max-w-md w-full text-center space-y-6">
          {/* Icon */}
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-4xl"
            style={{ background: 'rgba(255,45,120,0.15)', border: '1px solid rgba(255,45,120,0.3)' }}
          >
            ⚡
          </div>

          <div>
            <h1 className="text-2xl font-black text-white mb-2">Something went wrong</h1>
            <p className="text-sm text-white/40">
              An unexpected error occurred. Your funds are safe — this is a UI issue only.
            </p>
          </div>

          {/* Error detail (collapsed) */}
          {this.state.error && (
            <details className="text-left rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <summary
                className="px-4 py-3 text-xs font-medium cursor-pointer text-white/40 hover:text-white/70 transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                Error details
              </summary>
              <pre
                className="px-4 py-3 text-xs text-red-400 overflow-x-auto"
                style={{ background: 'rgba(255,45,120,0.05)' }}
              >
                {this.state.error.message}
              </pre>
            </details>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #7B2FFF, #00D4FF)' }}
            >
              Reload App
            </button>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/5"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
            >
              Try to recover
            </button>
          </div>

          <p className="text-xs text-white/20">
            If this keeps happening, clear your browser cache or open a new tab.
          </p>
        </div>
      </div>
    );
  }
}
