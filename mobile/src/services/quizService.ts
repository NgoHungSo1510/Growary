import { apiService } from './api';

export const quizService = {
  getActive:       () => apiService.get('/quiz/active'),
  getStatus:       () => apiService.get('/quiz/status'),
  startAttempt:    () => apiService.post('/quiz/start'),
  submitAnswer:    (attemptId: string, questionId: string, selectedIndex: number, timeSpent: number) =>
    apiService.post('/quiz/submit', { attemptId, questionId, selectedIndex, timeSpent }),
  completeAttempt: (attemptId: string) => apiService.post('/quiz/complete', { attemptId }),
  getHistory:      () => apiService.get('/quiz/history'),
};
