/**
 * Midnight Builder Challenge — Level 2
 *
 * App.tsx — root component.
 *
 * Step 1: Scaffold        ✅
 * Step 2: Lace connect    ✅  (this file)
 * Step 3: Circuit call    🔲  (next)
 *
 * PRIVACY: Private keys, seed phrases, and secretValue are NEVER rendered,
 * logged, or stored in component state.
 */

// Import the globals augmentation so window.midnight is typed everywhere.
import '@midnight-ntwrk/dapp-connector-api';

import type { FC } from 'react';
import WalletButton from './components/WalletButton';

const App: FC = () => {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="logo-mark">
          <span className="logo-dot" aria-hidden="true" />
          <span className="logo-dot" aria-hidden="true" />
          <span className="logo-dot" aria-hidden="true" />
        </div>
        <h1 className="app-title">Midnight Eligibility</h1>
        <p className="app-subtitle">
          Level 2 — Zero-Knowledge Proof on Preprod
        </p>
      </header>

      {/* Wallet card */}
      <section className="card wallet-card" aria-label="Wallet connection">
        <h2 className="card-heading">Wallet</h2>
        <WalletButton />
      </section>

      {/* Info card */}
      <section className="card status-card" aria-label="Application info">
        <dl className="info-grid">
          <div className="info-row">
            <dt>Network</dt>
            <dd>Midnight Preprod</dd>
          </div>
          <div className="info-row">
            <dt>Circuit</dt>
            <dd className="mono">proveEligibility(secretValue)</dd>
          </div>
          <div className="info-row">
            <dt>Privacy</dt>
            <dd>secretValue never leaves your device</dd>
          </div>
        </dl>
      </section>
    </main>
  );
};

export default App;
