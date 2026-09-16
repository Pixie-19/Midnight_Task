/**
 * useWallet — Lace / Midnight DApp Connector wallet hook
 *
 * API authority: the installed @midnight-ntwrk/dapp-connector-api@4.0.1
 * type declarations at node_modules/@midnight-ntwrk/dapp-connector-api/dist/
 *
 * Key facts from the declarations:
 *
 *   globals.d.ts  →  window.midnight is { [key: string]: InitialAPI }
 *                    Lace injects under the key "mnLace".
 *
 *   api.d.ts      →  InitialAPI.connect(networkId: string): Promise<ConnectedAPI>
 *                    ConnectedAPI = WalletConnectedAPI & HintUsage
 *                    WalletConnectedAPI.getShieldedAddresses() → { shieldedAddress, ... }
 *                    WalletConnectedAPI.getUnshieldedAddress() → { unshieldedAddress }
 *                    WalletConnectedAPI.getConnectionStatus()  → ConnectionStatus
 *                    WalletConnectedAPI.getConfiguration()     → Configuration
 *
 *   errors.d.ts   →  APIError.type === 'DAppConnectorAPIError'
 *                    ErrorCodes: Rejected | PermissionRejected | Disconnected |
 *                                InvalidRequest | InternalError
 *
 * PRIVACY: No private keys, seed phrases, or raw wallet objects are stored in
 * state or logged. Only the public address strings are retained.
 */
import { useState, useCallback } from 'react';
import type { ConnectedAPI, APIError } from '@midnight-ntwrk/dapp-connector-api';
import { ErrorCodes } from '@midnight-ntwrk/dapp-connector-api';

// ── Constants ──────────────────────────────────────────────────────────────────

/** The key under which Lace injects its InitialAPI into window.midnight.
 *  Source: globals.d.ts — window.midnight: { [key: string]: InitialAPI }
 *  The literal key "mnLace" is Lace's registered rdns-derived injection slot.
 */
const LACE_KEY = 'mnLace';

/** Network ID passed to InitialAPI.connect(). Must match Lace's active network. */
const NETWORK_ID = import.meta.env.VITE_NETWORK_ID ?? 'preprod';

// ── Types ──────────────────────────────────────────────────────────────────────

export type WalletError =
  | 'not-installed'
  | 'user-rejected'
  | 'wrong-network'
  | 'unavailable'
  | 'unknown';

export interface WalletInfo {
  /** Shielded bech32m address (from getShieldedAddresses). Shown in UI. */
  shieldedAddress: string;
  /** Unshielded bech32m address (from getUnshieldedAddress). Shown in UI. */
  unshieldedAddress: string;
  /** Network ID confirmed by the wallet's getConfiguration() response. */
  networkId: string;
}

export interface WalletState {
  /** Connected wallet API handle — needed by later circuit-call steps.
   *  Stored as ref value; not logged or exposed to UI. */
  connectedAPI: ConnectedAPI | null;
  info: WalletInfo | null;
  status: 'idle' | 'connecting' | 'connected' | 'error';
  error: WalletError | null;
  errorMessage: string | null;
}

export interface UseWalletReturn extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  isLaceAvailable: boolean;
}

// ── Helper: type-narrow an APIError ───────────────────────────────────────────

function isDAppError(err: unknown): err is APIError {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as APIError).type === 'DAppConnectorAPIError'
  );
}

function classifyError(err: unknown): { kind: WalletError; message: string } {
  if (isDAppError(err)) {
    switch (err.code) {
      case ErrorCodes.Rejected:
      case ErrorCodes.PermissionRejected:
        return { kind: 'user-rejected', message: 'Connection was rejected by the user.' };
      case ErrorCodes.Disconnected:
        return { kind: 'unavailable', message: 'Wallet connection lost.' };
      case ErrorCodes.InvalidRequest:
        return {
          kind: 'wrong-network',
          message: `The wallet is not configured for network "${NETWORK_ID}". Open Lace and switch to ${NETWORK_ID}.`,
        };
      case ErrorCodes.InternalError:
      default:
        return { kind: 'unknown', message: `Connector error: ${err.reason ?? err.message}` };
    }
  }
  if (err instanceof Error) {
    // Lace sometimes surfaces a plain Error whose message mentions the network
    const msg = err.message.toLowerCase();
    if (msg.includes('network') || msg.includes('not supported')) {
      return {
        kind: 'wrong-network',
        message: `The wallet is not configured for network "${NETWORK_ID}". Open Lace and switch to ${NETWORK_ID}.`,
      };
    }
    return { kind: 'unknown', message: err.message };
  }
  return { kind: 'unknown', message: 'An unexpected error occurred.' };
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useWallet(): UseWalletReturn {
  // Check whether Lace has injected itself at window.midnight.mnLace
  // (globals.d.ts: window.midnight?: { [key: string]: InitialAPI })
  const isLaceAvailable =
    typeof window !== 'undefined' &&
    typeof window.midnight !== 'undefined' &&
    LACE_KEY in (window.midnight ?? {});

  const [state, setState] = useState<WalletState>({
    connectedAPI: null,
    info: null,
    status: 'idle',
    error: null,
    errorMessage: null,
  });

  // ── connect ──────────────────────────────────────────────────────────────────

  const connect = useCallback(async () => {
    // Guard: Lace not installed
    if (!isLaceAvailable || !window.midnight?.[LACE_KEY]) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: 'not-installed',
        errorMessage:
          'Lace wallet extension not found. Install Lace from the Chrome Web Store and refresh the page.',
      }));
      return;
    }

    setState((s) => ({
      ...s,
      status: 'connecting',
      error: null,
      errorMessage: null,
    }));

    try {
      const initialAPI = window.midnight![LACE_KEY];

      // InitialAPI.connect(networkId: string): Promise<ConnectedAPI>
      // Source: api.d.ts line 37
      const connectedAPI: ConnectedAPI = await initialAPI.connect(NETWORK_ID);

      // Verify the wallet is actually connected to the expected network.
      // getConfiguration(): Promise<Configuration>   (api.d.ts line 181)
      // Configuration.networkId: string              (api.d.ts line 212)
      const config = await connectedAPI.getConfiguration();
      if (config.networkId !== NETWORK_ID) {
        setState((s) => ({
          ...s,
          status: 'error',
          connectedAPI: null,
          info: null,
          error: 'wrong-network',
          errorMessage: `Wallet is connected to "${config.networkId}" but this app requires "${NETWORK_ID}". Switch networks in Lace.`,
        }));
        return;
      }

      // Retrieve public address strings for display.
      // getShieldedAddresses():  { shieldedAddress: string; ... }  (api.d.ts line 77)
      // getUnshieldedAddress():  { unshieldedAddress: string }      (api.d.ts line 85)
      // These are bech32m public address strings — not private keys.
      const [shieldedResult, unshieldedResult] = await Promise.all([
        connectedAPI.getShieldedAddresses(),
        connectedAPI.getUnshieldedAddress(),
      ]);

      // PRIVACY: Only the public address strings enter state.
      // The connectedAPI handle is stored for later use by the circuit call
      // step, but is never logged or rendered.
      setState({
        connectedAPI,
        info: {
          shieldedAddress: shieldedResult.shieldedAddress,
          unshieldedAddress: unshieldedResult.unshieldedAddress,
          networkId: config.networkId,
        },
        status: 'connected',
        error: null,
        errorMessage: null,
      });
    } catch (err: unknown) {
      const { kind, message } = classifyError(err);
      setState((s) => ({
        ...s,
        status: 'error',
        connectedAPI: null,
        info: null,
        error: kind,
        errorMessage: message,
      }));
    }
  }, [isLaceAvailable]);

  // ── disconnect ───────────────────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    // There is no explicit "disconnect" call in the ConnectedAPI (v4.0.1).
    // Per the spec (api.d.ts), connection lifecycle is managed by the wallet.
    // Disconnecting from the dApp side means clearing local state.
    setState({
      connectedAPI: null,
      info: null,
      status: 'idle',
      error: null,
      errorMessage: null,
    });
  }, []);

  return { ...state, connect, disconnect, isLaceAvailable };
}
