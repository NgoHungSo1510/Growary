import { useState, useEffect, useRef, useCallback } from 'react';
import {
    QuizStatusResponse,
    QuizSessionDTO,
    QuizAnswerResult,
    QuizCompleteResult,
    QuizLeaderboardResponse,
} from '@shared';
import { quizService } from '../services/quizService';
import { showApiError } from '../utils/errorHandler';

export type QuizPhase = 'loading' | 'lobby' | 'countdown' | 'question' | 'answer_reveal' | 'result';

export interface UseQuizReturn {
    phase: QuizPhase;
    status: QuizStatusResponse | null;
    session: QuizSessionDTO | null;
    currentIndex: number;
    timeLeft: number;
    countdown: number;
    selectedIndex: number | null;
    lastAnswer: QuizAnswerResult | null;
    streakCount: number;
    result: QuizCompleteResult | null;
    leaderboard: QuizLeaderboardResponse | null;
    isBusy: boolean;
    start: () => Promise<void>;
    answer: (index: number) => Promise<void>;
    backToLobby: () => Promise<void>;
    loadLeaderboard: () => Promise<void>;
}

// Countdown 3s + Reveal 3s = 6s transition. Server grace is 5s.
const COUNTDOWN_SECONDS = 3;
const ANSWER_REVEAL_MS = 3000;
const DEFAULT_QUESTION_TIME_SEC = 30;

/**
 * Custom React Hook managing Quiz state machine, timing, and API orchestration.
 */
export function useQuiz(): UseQuizReturn {
    const [phase, setPhase] = useState<QuizPhase>('loading');
    const [status, setStatus] = useState<QuizStatusResponse | null>(null);
    const [session, setSession] = useState<QuizSessionDTO | null>(null);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_QUESTION_TIME_SEC);
    const [countdown, setCountdown] = useState<number>(COUNTDOWN_SECONDS);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [lastAnswer, setLastAnswer] = useState<QuizAnswerResult | null>(null);
    const [streakCount, setStreakCount] = useState<number>(0);
    const [result, setResult] = useState<QuizCompleteResult | null>(null);
    const [leaderboard, setLeaderboard] = useState<QuizLeaderboardResponse | null>(null);
    const [isBusy, setIsBusy] = useState<boolean>(false);

    const isSubmittingRef = useRef<boolean>(false);
    const questionShownAtRef = useRef<number>(Date.now());
    const questionDeadlineRef = useRef<number>(0);
    const sessionRef = useRef<QuizSessionDTO | null>(null);
    const currentIndexRef = useRef<number>(0);
    const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMountedRef = useRef<boolean>(true);

    const clearTimers = useCallback(() => {
        if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
        if (transitionTimeoutRef.current) { clearTimeout(transitionTimeoutRef.current); transitionTimeoutRef.current = null; }
    }, []);

    const fetchStatus = useCallback(async () => {
        try {
            setIsBusy(true);
            const res = await quizService.getStatus();
            if (isMountedRef.current) { setStatus(res); setPhase('lobby'); }
        } catch (error) {
            if (isMountedRef.current) { showApiError(error, 'Không thể tải trạng thái trắc nghiệm'); setPhase('lobby'); }
        } finally {
            if (isMountedRef.current) setIsBusy(false);
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        fetchStatus();
        return () => { isMountedRef.current = false; clearTimers(); };
    }, [fetchStatus, clearTimers]);

    sessionRef.current = session;
    currentIndexRef.current = currentIndex;

    const startQuestion = useCallback((idx: number) => {
        clearTimers();
        const activeSession = sessionRef.current;
        const totalSec = activeSession?.questionTimeSec || DEFAULT_QUESTION_TIME_SEC;
        setCurrentIndex(idx);
        setSelectedIndex(null);
        setLastAnswer(null);
        setTimeLeft(totalSec);
        isSubmittingRef.current = false;

        const now = Date.now();
        questionShownAtRef.current = now;
        questionDeadlineRef.current = now + totalSec * 1000;
        setPhase('question');

        timerIntervalRef.current = setInterval(() => {
            const sec = Math.max(0, Math.ceil((questionDeadlineRef.current - Date.now()) / 1000));
            setTimeLeft(sec);
            if (sec <= 0) {
                if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
                submitAnswerInternal(-1);
            }
        }, 1000);
    }, [clearTimers]);

    const submitAnswerInternal = useCallback(async (optionIndex: number) => {
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        clearTimers();
        setSelectedIndex(optionIndex);

        const currentSession = sessionRef.current;
        if (!currentSession) { isSubmittingRef.current = false; return; }
        const currentQuestion = currentSession.questions[currentIndexRef.current];
        if (!currentQuestion) { isSubmittingRef.current = false; return; }

        const rawElapsed = Math.round((Date.now() - questionShownAtRef.current) / 1000);
        const timeSpent = Math.max(0, Math.min(DEFAULT_QUESTION_TIME_SEC, rawElapsed));

        try {
            const res = await quizService.submitAnswer({
                attemptId: currentSession.attemptId,
                questionId: currentQuestion._id,
                selectedIndex: optionIndex,
                timeSpent,
            });
            if (!isMountedRef.current) return;
            setLastAnswer(res);
            setStreakCount(res.streakCount);
            setPhase('answer_reveal');

            transitionTimeoutRef.current = setTimeout(async () => {
                if (!isMountedRef.current) return;
                const nextIdx = currentIndexRef.current + 1;
                if (nextIdx < currentSession.questions.length) {
                    startQuestion(nextIdx);
                } else {
                    try {
                        setIsBusy(true);
                        const completeRes = await quizService.completeAttempt(currentSession.attemptId);
                        if (isMountedRef.current) {
                            setResult(completeRes);
                            setPhase('result');
                            quizService.getStatus().then((st) => { if (isMountedRef.current) setStatus(st); }).catch(() => undefined);
                        }
                    } catch (err) {
                        if (isMountedRef.current) showApiError(err, 'Không thể hoàn thành lượt chơi');
                    } finally {
                        if (isMountedRef.current) { setIsBusy(false); isSubmittingRef.current = false; }
                    }
                }
            }, ANSWER_REVEAL_MS);
        } catch (error) {
            if (isMountedRef.current) { showApiError(error, 'Không thể gửi đáp án'); isSubmittingRef.current = false; }
        }
    }, [clearTimers, startQuestion]);

    const answer = useCallback(async (index: number) => {
        await submitAnswerInternal(index);
    }, [submitAnswerInternal]);

    const start = useCallback(async () => {
        if (isBusy) return;
        try {
            setIsBusy(true);
            const newSession = await quizService.startAttempt();
            sessionRef.current = newSession;
            setSession(newSession);
            setCurrentIndex(newSession.currentIndex);
            setStreakCount(newSession.streakCount);
            setLastAnswer(null);
            setResult(null);

            if (newSession.currentIndex >= newSession.questions.length) {
                const completeRes = await quizService.completeAttempt(newSession.attemptId);
                if (isMountedRef.current) { setResult(completeRes); setPhase('result'); }
                return;
            }

            setCountdown(COUNTDOWN_SECONDS);
            setPhase('countdown');
            let cd = COUNTDOWN_SECONDS;
            timerIntervalRef.current = setInterval(() => {
                cd -= 1;
                if (isMountedRef.current) setCountdown(cd);
                if (cd <= 0) {
                    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
                    if (isMountedRef.current) startQuestion(newSession.currentIndex);
                }
            }, 1000);
        } catch (error) {
            if (isMountedRef.current) showApiError(error, 'Không thể bắt đầu lượt chơi');
        } finally {
            if (isMountedRef.current) setIsBusy(false);
        }
    }, [isBusy, startQuestion]);

    const backToLobby = useCallback(async () => {
        clearTimers();
        isSubmittingRef.current = false;
        setSession(null);
        setResult(null);
        setLastAnswer(null);
        setSelectedIndex(null);
        await fetchStatus();
    }, [clearTimers, fetchStatus]);

    const loadLeaderboard = useCallback(async () => {
        try {
            setIsBusy(true);
            const data = await quizService.getLeaderboard(status?.event?._id);
            if (isMountedRef.current) setLeaderboard(data);
        } catch (error) {
            if (isMountedRef.current) showApiError(error, 'Không thể tải Bảng Vàng');
        } finally {
            if (isMountedRef.current) setIsBusy(false);
        }
    }, [status?.event?._id]);

    return {
        phase, status, session, currentIndex, timeLeft, countdown,
        selectedIndex, lastAnswer, streakCount, result, leaderboard,
        isBusy, start, answer, backToLobby, loadLeaderboard,
    };
}
