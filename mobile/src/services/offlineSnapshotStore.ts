import AsyncStorage from '@react-native-async-storage/async-storage';

export const SNAPSHOT_KEYS = {
    TODAY_PLAN: '@growary:cached_today_plan',
    LEVELS: '@growary:cached_levels',
    PENALTY_CONFIG: '@growary:cached_penalty_config',
    USER_PROFILE: '@growary:cached_user_profile',
    SHOP_DATA: '@growary:cached_shop_data',
    INVENTORY: '@growary:cached_inventory',
    BOSS_ACTIVE: '@growary:cached_boss_active',
    BOSS_COLLECTIONS: '@growary:cached_boss_collections',
    SEASON_PASS: '@growary:cached_season_pass',
    QUIZ_STATUS: '@growary:cached_quiz_status',
    QUIZ_OFFLINE_PACK: '@growary:cached_quiz_pack',
    GACHA_DATA: '@growary:cached_gacha_data',
} as const;

export type SnapshotKey = (typeof SNAPSHOT_KEYS)[keyof typeof SNAPSHOT_KEYS];

export interface GlobalSyncState {
    isSyncing: boolean;
    isOffline: boolean;
    pendingCount: number;
    lastSyncedAt?: string;
    serverWaking?: boolean;
}

const memoryStore = new Map<string, unknown>();
const listeners = new Set<(state: GlobalSyncState) => void>();

let globalSyncState: GlobalSyncState = {
    isSyncing: false,
    isOffline: false,
    pendingCount: 0,
    serverWaking: false,
};

/**
 * Returns current global synchronization state.
 */
export function getGlobalSyncState(): GlobalSyncState {
    return { ...globalSyncState };
}

/**
 * Updates global sync state and notifies all subscribed components (e.g. GlobalSyncStatusBar).
 */
export function setGlobalSyncState(patch: Partial<GlobalSyncState>): void {
    globalSyncState = {
        ...globalSyncState,
        ...patch,
    };
    listeners.forEach((listener) => {
        try {
            listener({ ...globalSyncState });
        } catch {
            // ignore subscriber errors
        }
    });
}

/**
 * Subscribes a listener to synchronization state changes.
 * @returns Cleanup function to unsubscribe
 */
export function subscribeSyncStatus(listener: (state: GlobalSyncState) => void): () => void {
    listeners.add(listener);
    listener({ ...globalSyncState });
    return () => {
        listeners.delete(listener);
    };
}

/**
 * Reads snapshot from in-memory L1 cache synchronously (< 1ms).
 */
export function getCachedSnapshotSync<T>(key: string): T | null {
    const mem = memoryStore.get(key);
    return mem !== undefined ? (mem as T) : null;
}

/**
 * Reads snapshot with two-tier strategy: L1 Memory (< 1ms) -> L2 AsyncStorage (< 30ms).
 */
export async function getCachedSnapshot<T>(key: string): Promise<T | null> {
    const cachedInMemory = memoryStore.get(key);
    if (cachedInMemory !== undefined) {
        return cachedInMemory as T;
    }

    try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
            const parsed = JSON.parse(raw) as T;
            memoryStore.set(key, parsed);
            return parsed;
        }
    } catch {
        // storage read fallback
    }

    return null;
}

/**
 * Sets snapshot in both L1 Memory and L2 AsyncStorage immediately.
 */
export async function setCachedSnapshot<T>(key: string, data: T): Promise<void> {
    memoryStore.set(key, data);
    try {
        await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch {
        // storage write fallback
    }
}

/**
 * Removes snapshot from both L1 and L2 caches.
 */
export async function removeCachedSnapshot(key: string): Promise<void> {
    memoryStore.delete(key);
    try {
        await AsyncStorage.removeItem(key);
    } catch {
        // storage remove fallback
    }
}

/**
 * Clears entire in-memory snapshot cache (useful on user logout).
 */
export function clearMemorySnapshotCache(): void {
    memoryStore.clear();
}

