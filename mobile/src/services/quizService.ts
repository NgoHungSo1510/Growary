import { apiService } from './api';
import {
    QuizStatusResponse,
    QuizSessionDTO,
    QuizAnswerPayload,
    QuizAnswerResult,
    QuizCompleteResult,
    QuizLeaderboardResponse,
    QuizHistoryItem,
    QuizEventDTO,
} from '@shared';

/**
 * Quiz minigame API service with strictly typed responses.
 */
export const quizService = {
    /**
     * Gets current active event or null
     */
    getActive: (): Promise<{ event: QuizEventDTO | null }> =>
        apiService.get<{ event: QuizEventDTO | null }>('/quiz/active'),

    /**
     * Gets user quiz status including cooldown, remaining attempts, and active session
     */
    getStatus: (): Promise<QuizStatusResponse> =>
        apiService.get<QuizStatusResponse>('/quiz/status'),

    /**
     * Starts a new attempt or resumes an ongoing attempt
     */
    startAttempt: (): Promise<QuizSessionDTO> =>
        apiService.post<QuizSessionDTO>('/quiz/start'),

    /**
     * Submits an answer for the current question
     */
    submitAnswer: (
        payloadOrAttemptId: QuizAnswerPayload | string,
        questionId?: string,
        selectedIndex?: number,
        timeSpent?: number
    ): Promise<QuizAnswerResult> => {
        const payload: QuizAnswerPayload =
            typeof payloadOrAttemptId === 'string'
                ? {
                      attemptId: payloadOrAttemptId,
                      questionId: questionId ?? '',
                      selectedIndex: selectedIndex ?? -1,
                      timeSpent: timeSpent ?? 0,
                  }
                : payloadOrAttemptId;
        return apiService.post<QuizAnswerResult>('/quiz/submit', payload);
    },


    /**
     * Completes and finalizes the attempt
     */
    completeAttempt: (attemptId: string): Promise<QuizCompleteResult> =>
        apiService.post<QuizCompleteResult>('/quiz/complete', { attemptId }),

    /**
     * Gets event leaderboard with rankings
     */
    getLeaderboard: (eventId?: string): Promise<QuizLeaderboardResponse> =>
        apiService.get<QuizLeaderboardResponse>(
            '/quiz/leaderboard',
            eventId ? { eventId } : undefined
        ),

    /**
     * Gets user's past completed attempts
     */
    getHistory: (): Promise<{ attempts: QuizHistoryItem[] }> =>
        apiService.get<{ attempts: QuizHistoryItem[] }>('/quiz/history'),
};
