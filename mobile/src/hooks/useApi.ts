import { useState, useCallback, useEffect } from 'react';
import { getErrorMessage } from '../utils/errorHandler';

export interface UseApiOptions {
    autoFetch?: boolean;
    initialData?: any;
}

/**
 * Generic custom hook quản lý state fetch API (data, loading, error, refetch)
 */
export function useApi<T>(fetcher: () => Promise<T>, options: UseApiOptions = { autoFetch: true }) {
    const [data, setData] = useState<T | null>(options.initialData ?? null);
    const [loading, setLoading] = useState(options.autoFetch ?? true);
    const [error, setError] = useState<string | null>(null);

    const execute = useCallback(async (): Promise<T | null> => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetcher();
            setData(result);
            return result;
        } catch (err: unknown) {
            const errMsg = getErrorMessage(err);
            setError(errMsg);
            return null;
        } finally {
            setLoading(false);
        }
    }, [fetcher]);

    useEffect(() => {
        if (options.autoFetch) {
            execute();
        }
    }, [execute, options.autoFetch]);

    return {
        data,
        loading,
        error,
        refetch: execute,
        setData,
    };
}
