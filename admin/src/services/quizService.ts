import { httpClient } from './client';
import {
    QuizEventDTO,
    QuizTopicAdminDTO,
    QuizTopicDTO,
    QuizQuestionAdminDTO,
} from '@shared';

export interface QuizEventStatsDTO {
    totalPlayers: number;
    totalAttempts: number;
    avgCorrect: string;
    totalCoinsDistributed: number;
}

/**
 * Admin API service for quiz event, topic, and question management.
 */
export const quizService = {
    /**
     * Lists all quiz events
     */
    async getQuizEvents(): Promise<{ events: QuizEventDTO[] }> {
        return httpClient.get<{ events: QuizEventDTO[] }>('/admin/quiz/events');
    },

    /**
     * Creates a new quiz event
     */
    async createQuizEvent(data: Partial<QuizEventDTO>): Promise<{ event: QuizEventDTO }> {
        return httpClient.post<{ event: QuizEventDTO }>('/admin/quiz/events', data);
    },

    /**
     * Updates an existing quiz event
     */
    async updateQuizEvent(id: string, data: Partial<QuizEventDTO>): Promise<{ event: QuizEventDTO }> {
        return httpClient.put<{ event: QuizEventDTO }>(`/admin/quiz/events/${id}`, data);
    },

    /**
     * Deletes a quiz event by ID
     */
    async deleteQuizEvent(id: string): Promise<{ success: boolean }> {
        return httpClient.delete<{ success: boolean }>(`/admin/quiz/events/${id}`);
    },

    /**
     * Lists all quiz topics with their aggregated question counts
     */
    async getQuizTopics(): Promise<{ topics: QuizTopicAdminDTO[] }> {
        return httpClient.get<{ topics: QuizTopicAdminDTO[] }>('/admin/quiz/topics');
    },

    /**
     * Creates a new quiz topic
     */
    async createQuizTopic(data: Partial<QuizTopicDTO>): Promise<{ topic: QuizTopicDTO }> {
        return httpClient.post<{ topic: QuizTopicDTO }>('/admin/quiz/topics', data);
    },

    /**
     * Updates an existing quiz topic
     */
    async updateQuizTopic(id: string, data: Partial<QuizTopicDTO>): Promise<{ topic: QuizTopicDTO }> {
        return httpClient.put<{ topic: QuizTopicDTO }>(`/admin/quiz/topics/${id}`, data);
    },

    /**
     * Lists quiz questions, optionally filtered by topic ID
     */
    async getQuizQuestions(topicId?: string): Promise<{ questions: QuizQuestionAdminDTO[] }> {
        const query = topicId ? `?topicId=${encodeURIComponent(topicId)}` : '';
        return httpClient.get<{ questions: QuizQuestionAdminDTO[] }>(`/admin/quiz/questions${query}`);
    },

    /**
     * Creates a new quiz question
     */
    async createQuizQuestion(data: Partial<QuizQuestionAdminDTO>): Promise<{ question: QuizQuestionAdminDTO }> {
        return httpClient.post<{ question: QuizQuestionAdminDTO }>('/admin/quiz/questions', data);
    },

    /**
     * Updates an existing quiz question
     */
    async updateQuizQuestion(id: string, data: Partial<QuizQuestionAdminDTO>): Promise<{ question: QuizQuestionAdminDTO }> {
        return httpClient.put<{ question: QuizQuestionAdminDTO }>(`/admin/quiz/questions/${id}`, data);
    },

    /**
     * Deletes a quiz question by ID
     */
    async deleteQuizQuestion(id: string): Promise<{ success: boolean }> {
        return httpClient.delete<{ success: boolean }>(`/admin/quiz/questions/${id}`);
    },

    /**
     * Gets statistics for a quiz event
     */
    async getQuizEventStats(eventId: string): Promise<QuizEventStatsDTO> {
        return httpClient.get<QuizEventStatsDTO>(`/admin/quiz/events/${eventId}/stats`);
    },
};
