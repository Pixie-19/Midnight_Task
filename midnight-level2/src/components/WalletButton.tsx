import type { FC } from 'react';
import { useWallet } from '../hooks/useWallet';
import './WalletButton.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Shorten a bech32m address for display.
 * Shows the human-readable prefix and first 6 + last 6 characters.
 * E.g. "mn_addr_preprod1abcdef…xyz123"
 */
function shortenAddress(address: string): string {
  if (address.length <= 20) return address;
  return `${address.slice(0, 14)}…${address.slice(-6)}`;
}

// ── Error message mapping ─────────────────────────────────────────────────────

const ERROR_ICONS: Record<string, string> = {
  'not-installed': '🦊',
  'user-rejected': '🚫',
  'wrong-network': '🔗',
  'unavailable': '⚠️',
  'unknown': '❌',
};

// ── Component ─────────────────────────────────────────────────────────────────

const WalletButton: FC = () => {
  const { status, info, error, errorMessage, isLaceAvailable, connect, disconnect } = useWallet();

  // ── Connected state ──────────────────────────────────────────────────────────

  if (status === 'connected' && info) {
    return (
      <div className="wallet-panel">
        <div className="wallet-connected-row">
          <div className="wallet-indicator" aria-label="Connected">
            <span className="wallet-dot wallet-dot--connected" aria-hidden="true" />
            <span className="wallet-network-badge">{info.networkId}</span>
          </div>

          <div className="wallet-address-group">
            <div className="wallet-address-row">
              <span className="wallet-address-label">Shielded</span>
              <span
                className="wallet-address mono"
                title={info.shieldedAddress}
                aria-label={`Shielded address: ${info.shieldedAddress}`}
              >
                {shortenAddress(info.shieldedAddress)}
              </span>
            </div>
            <div className="wallet-address-row">
              <span className="wallet-address-label">Unshielded</span>
              <span
                className="wallet-address mono"
                title={info.unshieldedAddress}
                aria-label={`Unshielded address: ${info.unshieldedAddress}`}
              >
                {shortenAddress(info.unshieldedAddress)}
              </span>
            </div>
          </div>

          <button
            id="btn-disconnect"
            className="btn btn--ghost btn--sm"
            onClick={disconnect}
            aria-label="Disconnect wallet"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  // ── Connecting state ─────────────────────────────────────────────────────────

  if (status === 'connecting') {
    return (
      <div className="wallet-panel">
        <button
          id="btn-connecting"
          className="btn btn--primary btn--loading"
          disabled
          aria-busy="true"
          aria-label="Connecting to wallet"
        >
          <span className="btn-spinner" aria-hidden="true" />
          Connecting…
        </button>
      </div>
    );
  }

  // ── Error + idle states ──────────────────────────────────────────────────────

  return (
    <div className="wallet-panel">
      <button
        id="btn-connect"
        className="btn btn--primary"
        onClick={connect}
        aria-label={
          isLaceAvailable
            ? 'Connect Lace wallet to Midnight Preprod'
            : 'Install Lace wallet to connect'
        }
      >
        {isLaceAvailable ? 'Connect Lace' : 'Install Lace'}
      </button>

      {(status === 'error' || errorMessage) && (
        <div
          className="wallet-error"
          role="alert"
          aria-live="polite"
          id="wallet-error-msg"
        >
          <span className="wallet-error-icon" aria-hidden="true">
            {ERROR_ICONS[error ?? 'unknown']}
          </span>
          <span className="wallet-error-text">{errorMessage}</span>
          {error === 'not-installed' && (
            <a
              href="https://www.lace.io"
              target="_blank"
              rel="noopener noreferrer"
              className="wallet-error-link"
            >
              Get Lace →
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletButton;
