import { setGlobalSyncState } from './offlineSnapshotStore';

let reachable = true;
let isWaking = false;

/**
 * Checks whether the server was recently reachable.
 */
export function isServerReachable(): boolean {
    return reachable;
}

/**
 * Updates reachability state.
 */
export function setServerReachable(state: boolean): void {
    reachable = state;
}

/**
 * Determines whether an error is caused by offline network or Render sleep timeout (502/503/504/timeout).
 */
export function isNetworkOrServerSleepError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const err = error as {
        code?: string;
        message?: string;
        response?: { status?: number };
    };

    if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') {
        return true;
    }

    if (err.message && (err.message.includes('timeout') || err.message.includes('Network Error'))) {
        return true;
    }

    const status = err.response?.status;
    if (status === 502 || status === 503 || status === 504 || status === 408) {
        return true;
    }

    return false;
}

/**
 * Triggers background wakeup ping to Render without blocking the user UI.
 * Single-flight: only one wakeup request runs at a time.
 */
export function wakeServerInBackground(
    heartbeatFn: () => Promise<unknown>,
    onAwake?: () => Promise<void> | void
): void {
    if (isWaking) return;
    isWaking = true;
    setGlobalSyncState({ serverWaking: true });

    heartbeatFn()
        .then(async () => {
            reachable = true;
            isWaking = false;
            setGlobalSyncState({
                isOffline: false,
                isSyncing: true,
                serverWaking: false,
            });
            if (onAwake) {
                try {
                    await onAwake();
                } catch {
                    // ignore awake callback error
                }
            }
        })
        .catch(() => {
            isWaking = false;
            setGlobalSyncState({
                isOffline: true,
                serverWaking: false,
            });
        });
}

