import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { ShopEvent } from '@shared';

// In-memory session flag: popup is shown at most once per session
let hasShownModalThisSession = false;

export interface EventCountdown {
    hours: number;
    minutes: number;
    seconds: number;
    formatted: string;
    isEnded: boolean;
}

export function calculateEventCountdown(endDateStr?: string): EventCountdown {
    if (!endDateStr) {
        return { hours: 0, minutes: 0, seconds: 0, formatted: '00:00:00', isEnded: true };
    }

    const end = new Date(endDateStr).getTime();
    const now = Date.now();
    const diff = Math.max(0, end - now);

    if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, formatted: '00:00:00', isEnded: true };
    }

    const totalSec = Math.floor(diff / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const pad = (n: number) => String(n).padStart(2, '0');
    const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    return { hours, minutes, seconds, formatted, isEnded: false };
}

export function useShopEvent() {
    const [event, setEvent] = useState<ShopEvent | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [showPopup, setShowPopup] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<EventCountdown>({
        hours: 0,
        minutes: 0,
        seconds: 0,
        formatted: '00:00:00',
        isEnded: true,
    });

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchActiveEvent = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiService.getActiveShopEvent();
            const activeEvent = res?.event;

            if (activeEvent && activeEvent.type === 'flash_sale') {
                const initialCd = calculateEventCountdown(activeEvent.endDate);
                if (!initialCd.isEnded) {
                    setEvent(activeEvent);
                    setCountdown(initialCd);

                    if (!hasShownModalThisSession) {
                        setShowPopup(true);
                        hasShownModalThisSession = true;
                    }
                    return;
                }
            }
            setEvent(null);
        } catch (error) {
            console.error('Error fetching active shop event:', error);
            setEvent(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActiveEvent();
    }, [fetchActiveEvent]);

    // Countdown interval
    useEffect(() => {
        if (!event || !event.endDate) return;

        timerRef.current = setInterval(() => {
            const cd = calculateEventCountdown(event.endDate);
            setCountdown(cd);
            if (cd.isEnded) {
                setEvent(null);
                if (timerRef.current) clearInterval(timerRef.current);
            }
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [event]);

    const dismissPopup = () => {
        setShowPopup(false);
    };

    return {
        event,
        loading,
        showPopup,
        countdown,
        dismissPopup,
        refreshEvent: fetchActiveEvent,
    };
}
