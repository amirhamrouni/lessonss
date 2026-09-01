import React from 'react';

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
            <section className="mode-empty">
              <h1>English Twin needs to reload this screen.</h1>
              <p>Your saved learning progress is not deleted. Reload the app to continue.</p>
              <button type="button" onClick={() => window.location.reload()}>Reload English Twin</button>
            </section>
          </main>
        </div>
      </div>
    );
  }
}
