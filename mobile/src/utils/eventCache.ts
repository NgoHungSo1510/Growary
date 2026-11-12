import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cấu trúc một bản ghi dữ liệu trong bộ nhớ đệm sự kiện.
 */
export interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const STORAGE_PREFIX = '@growary:event_cache:';
export const DEFAULT_EVENT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút

const memoryCache = new Map<string, CacheEntry<unknown>>();

/**
 * Tạo khóa cache gắn kèm userId để tránh rò rỉ dữ liệu giữa các tài khoản trên cùng thiết bị.
 * @param baseKey - Tên định danh cache cơ sở (ví dụ: 'boss_active', 'boss_collections')
 * @param userId - ID của người dùng hiện tại (nếu có)
 * @returns Khóa cache đã được gắn tiền tố user
 */
export function buildEventCacheKey(baseKey: string, userId?: string): string {
    return userId ? `${userId}:${baseKey}` : `anon:${baseKey}`;
}

/**
 * Lấy dữ liệu sự kiện từ bộ nhớ đệm (L1 Memory Cache ưu tiên, fallback L2 AsyncStorage).
 * @param key - Khóa định danh cache
 * @param ttlMs - Thời gian sống tính bằng ms (mặc định 5 phút = 300_000ms)
 * @returns Object chứa data (hoặc null nếu chưa có) và cờ isStale
 */
export async function getEventCache<T>(
    key: string,
    ttlMs: number = DEFAULT_EVENT_CACHE_TTL_MS
): Promise<{ data: T | null; isStale: boolean }> {
    try {
        const memHit = memoryCache.get(key);
        if (memHit) {
            const isStale = Date.now() - memHit.timestamp > ttlMs;
            return { data: memHit.data as T, isStale };
        }

        const raw = await AsyncStorage.getItem(STORAGE_PREFIX + key);
        if (!raw) {
            return { data: null, isStale: false };
        }

        const parsed: CacheEntry<T> = JSON.parse(raw);
        if (!parsed || typeof parsed.timestamp !== 'number') {
            return { data: null, isStale: false };
        }

        memoryCache.set(key, parsed as CacheEntry<unknown>);
        const isStale = Date.now() - parsed.timestamp > ttlMs;
        return { data: parsed.data, isStale };
    } catch {
        return { data: null, isStale: false };
    }
}

/**
 * Lưu dữ liệu sự kiện vào cả Memory Cache và AsyncStorage kèm timestamp hiện tại.
 * @param key - Khóa định danh cache
 * @param data - Dữ liệu cần cache
 */
export async function setEventCache<T>(key: string, data: T): Promise<void> {
    const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
    };
    memoryCache.set(key, entry as CacheEntry<unknown>);
    try {
        await AsyncStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
    } catch {
        // Bỏ qua lỗi ghi disk nếu bộ nhớ đầy, L1 memory vẫn giữ dữ liệu
    }
}

/**
 * Xóa một khóa cache cụ thể hoặc toàn bộ cache sự kiện (ví dụ sau khi đánh Boss hoặc logout).
 * @param key - Khóa cần xóa (nếu để trống sẽ xóa sạch toàn bộ prefix '@growary:event_cache:')
 */
export async function clearEventCache(key?: string): Promise<void> {
    try {
        if (key) {
            memoryCache.delete(key);
            await AsyncStorage.removeItem(STORAGE_PREFIX + key);
            return;
        }

        memoryCache.clear();
        const allKeys = await AsyncStorage.getAllKeys();
        const eventKeys = allKeys.filter((k) => k.startsWith(STORAGE_PREFIX));
        if (eventKeys.length > 0) {
            await AsyncStorage.multiRemove(eventKeys);
        }
    } catch {
        // Xóa an toàn không ném exception
    }
}

