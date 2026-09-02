import React from 'react';
import { Home, RefreshCw, ShieldCheck } from 'lucide-react';

type State = { failed: boolean };

export default class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('English Twin runtime error', error.message, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="app-shell">
        <div className="phone">
          <main className="page">
            <section className="mode-empty recovery-card" role="alert">
              <ShieldCheck aria-hidden="true" />
              <span className="eyebrow">SAFE RECOVERY</span>
              <h1>English Twin needs to reload this screen.</h1>
              <p>Your saved learning progress is not deleted. Reload the app to continue, or return to Home if this screen keeps failing.</p>
              <div className="builder-actions recovery-actions">
                <button type="button" onClick={() => window.location.assign('/')}><Home /> Home</button>
                <button className="solid" type="button" onClick={() => window.location.reload()}><RefreshCw /> Reload</button>
              </div>
            </section>
          </main>
        </div>
      </div>
    );
  }
}
