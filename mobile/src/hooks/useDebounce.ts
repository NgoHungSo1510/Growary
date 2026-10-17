import { useState, useEffect } from 'react';

/**
 * Hook debounce giá trị sau một khoảng thời gian delay nhất định
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delayMs);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delayMs]);

    return debouncedValue;
}
