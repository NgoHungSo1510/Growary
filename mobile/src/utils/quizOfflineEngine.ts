import {
    OfflineQuizPackResponse,
    OfflineQuizTopicBundle,
    OfflineQuizQuestionItem,
    OfflineQuizAttemptSyncPayload,
    QuizSessionDTO,
    QuizQuestionPublic,
    QuizAnswerResult,
    QuizCompleteResult,
} from '../../../shared/types/quiz';
import { enqueueOfflineAction } from '../services/offlineSyncService';
import { applyOfflineCurrencyDelta } from '../services/offlineEconomyEngine';

/**
 * Computes SHA-256 digest hex using platform subtle crypto or fallback.
 */
async function computeHashHex(text: string): Promise<string> {
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            const buffer = await globalThis.crypto.subtle.digest('SHA-256', data);
            const bytes = Array.from(new Uint8Array(buffer));
            return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
        } catch {
            // fallback
        }
    }
    // Lightweight string hash fallback
    let h = 0;
    for (let i = 0; i < text.length; i++) {
        h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
    }
    return Math.abs(h).toString(16);
}

/**
 * Initializes an offline Quiz session from local cached pack.
 */
export function initOfflineQuizSession(
    cachedPack: OfflineQuizPackResponse,
    topicId?: string
): { session: QuizSessionDTO; packBundle: OfflineQuizTopicBundle } {
    if (!cachedPack.bundles || cachedPack.bundles.length === 0) {
        throw new Error('Chưa có gói câu hỏi offline. Vui lòng kết nối mạng để tải về.');
    }

    const bundle = topicId
        ? cachedPack.bundles.find((b) => b.topic._id === topicId) || cachedPack.bundles[0]
        : cachedPack.bundles[Math.floor(Math.random() * cachedPack.bundles.length)];

    const publicQuestions: QuizQuestionPublic[] = bundle.questions.map((q) => ({
        _id: q._id,
        question: q.content,
        options: [...q.options],
        difficulty: 'medium',
    }));

    const session: QuizSessionDTO = {
        attemptId: `offline_att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        topic: bundle.topic,
        questions: publicQuestions,
        currentIndex: 0,
        streakCount: 0,
        questionTimeSec: cachedPack.questionTimeSec || 30,
        resumed: false,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };

    return { session, packBundle: bundle };
}

/**
 * Verifies an answer against offline hashed secret and computes reward points.
 */
export async function verifyOfflineAnswer(
    question: OfflineQuizQuestionItem,
    selectedIndex: number,
    timeSpent: number,
    currentStreak: number
): Promise<{ answerResult: QuizAnswerResult; updatedStreak: number }> {
    let isCorrect = false;
    let correctIdx = -1;

    for (let optIdx = 0; optIdx < question.options.length; optIdx++) {
        const expectedHash = await computeHashHex(`${question._id}:${optIdx}:growary_v265`);
        if (expectedHash === question.answerHash) {
            correctIdx = optIdx;
            if (selectedIndex === optIdx) {
                isCorrect = true;
            }
            break;
        }
    }

    // If hash matching fails (e.g. environment fallback), fallback to non-timeout check
    if (correctIdx === -1 && selectedIndex >= 0) {
        isCorrect = selectedIndex >= 0;
        correctIdx = selectedIndex;
    }

    const updatedStreak = isCorrect ? currentStreak + 1 : 0;
    const speedBonusCoins = isCorrect ? (timeSpent <= 5 ? 5 : timeSpent <= 10 ? 2 : 0) : 0;
    const streakBonusCoins = isCorrect ? (updatedStreak >= 5 ? 10 : updatedStreak >= 3 ? 5 : 0) : 0;

    return {
        answerResult: {
            isCorrect,
            correctIndex: correctIdx >= 0 ? correctIdx : 0,
            isTimeout: selectedIndex === -1,
            streakCount: updatedStreak,
            speedBonusCoins,
            streakBonusCoins,
            alreadyAnswered: false,
        },
        updatedStreak,
    };
}

/**
 * Finalizes offline quiz attempt, grants local coins/xp, and queues batch action.
 */
export async function completeOfflineQuizAttempt(params: {
    eventId: string;
    topicId: string;
    answers: OfflineQuizAttemptSyncPayload['answers'];
    packBundle: OfflineQuizTopicBundle;
    startedAt: string;
    userId?: string;
}): Promise<QuizCompleteResult> {
    const { eventId, topicId, answers, packBundle, startedAt, userId } = params;

    let totalCorrect = 0;
    let baseCoins = 0;
    let speedBonusCoins = 0;
    let streakBonusCoins = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    let speedAnswerCount = 0;

    for (const ans of answers) {
        const q = packBundle.questions.find((item) => item._id === ans.questionId);
        if (!q) continue;

        const check = await verifyOfflineAnswer(q, ans.selectedIndex, ans.timeSpent, currentStreak);
        currentStreak = check.updatedStreak;
        if (currentStreak > maxStreak) maxStreak = currentStreak;

        if (check.answerResult.isCorrect) {
            totalCorrect++;
            baseCoins += 10;
            speedBonusCoins += check.answerResult.speedBonusCoins;
            streakBonusCoins += check.answerResult.streakBonusCoins;
            if (check.answerResult.speedBonusCoins > 0) speedAnswerCount++;
        }
    }

    const totalQuestions = answers.length;
    const coinsEarned = baseCoins + speedBonusCoins + streakBonusCoins;
    const xpEarned = totalCorrect * 20;
    const isPerfect = totalCorrect === totalQuestions && totalQuestions > 0;
    const perfectBonus = isPerfect ? { tickets: 1, message: 'Xuất sắc đạt điểm tối đa! +1 Vé Gacha' } : null;

    // Apply currency delta
    await applyOfflineCurrencyDelta({
        coinsDelta: coinsEarned,
        xpDelta: xpEarned,
        ticketsDelta: perfectBonus ? 1 : 0,
    });

    // Enqueue action
    await enqueueOfflineAction({
        type: 'QUIZ_OFFLINE_ATTEMPT',
        payload: {
            eventId,
            topicId,
            startedAt,
            completedAt: new Date().toISOString(),
            answers,
        },
        userId,
    });

    return {
        totalCorrect,
        totalQuestions,
        baseCoins,
        speedBonusCoins,
        streakBonusCoins,
        coinsEarned,
        xpEarned,
        maxStreak,
        speedAnswerCount,
        score: coinsEarned + xpEarned,
        perfectBonus,
        levelUps: [],
        endReason: 'finished',
        alreadyCompleted: false,
    };
}

