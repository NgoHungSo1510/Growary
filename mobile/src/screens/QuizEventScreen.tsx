import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    Alert,
    SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS } from '../theme';
import { useQuiz } from '../hooks';
import {
    QuizQuestionCard,
    QuizStreakBadge,
    QuizLobbyView,
    QuizResultView,
    QuizLeaderboardModal,
} from '../components/quiz';

/**
 * QuizEventScreen orchestrating the minigame views through useQuiz hook.
 */
export default function QuizEventScreen() {
    const navigation = useNavigation<any>();
    const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

    const {
        phase,
        status,
        session,
        currentIndex,
        timeLeft,
        countdown,
        selectedIndex,
        lastAnswer,
        streakCount,
        result,
        leaderboard,
        isBusy,
        start,
        answer,
        backToLobby,
        loadLeaderboard,
    } = useQuiz();

    // Intercept back navigation during active question/countdown phases
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e: { preventDefault: () => void; data: { action: any } }) => {
            if (
                phase !== 'countdown' &&
                phase !== 'question' &&
                phase !== 'answer_reveal'
            ) {
                return;
            }

            e.preventDefault();
            Alert.alert(
                'Tạm dừng thử thách?',
                'Lượt chơi sẽ được giữ lại. Bạn có thể quay lại tiếp tục trước khi hết hạn.',
                [
                    { text: 'Ở lại chơi tiếp', style: 'cancel' },
                    {
                        text: 'Rời đi',
                        style: 'destructive',
                        onPress: () => navigation.dispatch(e.data.action),
                    },
                ]
            );
        });

        return unsubscribe;
    }, [navigation, phase]);

    const handleOpenLeaderboard = useCallback(() => {
        setShowLeaderboard(true);
        loadLeaderboard();
    }, [loadLeaderboard]);

    const handleCloseLeaderboard = useCallback(() => {
        setShowLeaderboard(false);
    }, []);

    const isGaming = phase === 'question' || phase === 'answer_reveal';
    const headerTitle = isGaming && session?.topic?.name
        ? session.topic.name
        : 'Tri Thức Đấu Trí';

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* Custom Screen Header */}
            <View style={styles.topBar}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.goBack()}
                    style={styles.iconButton}
                >
                    <MaterialIcons name="arrow-back-ios" size={20} color={COLORS.clayText} />
                </TouchableOpacity>

                <Text style={styles.topBarTitle} numberOfLines={1}>
                    {headerTitle}
                </Text>

                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleOpenLeaderboard}
                    style={styles.iconButton}
                >
                    <MaterialIcons name="leaderboard" size={24} color={COLORS.quizPrimary} />
                </TouchableOpacity>
            </View>

            {/* Content View Switcher */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {phase === 'loading' && (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={COLORS.quizPrimary} />
                        <Text style={styles.loadingText}>Đang tải dữ liệu sự kiện...</Text>
                    </View>
                )}

                {phase === 'lobby' && status && (
                    <QuizLobbyView
                        status={status}
                        isBusy={isBusy}
                        onStart={start}
                        onOpenLeaderboard={handleOpenLeaderboard}
                    />
                )}

                {phase === 'countdown' && (
                    <View style={styles.countdownContainer}>
                        <View style={styles.countdownCircle}>
                            <Text style={styles.countdownNumber}>{countdown}</Text>
                        </View>
                        <Text style={styles.countdownTitle}>SẴN SÀNG!</Text>
                        <Text style={styles.countdownSubtitle}>
                            Trả lời nhanh và chính xác để nhận thưởng tối đa!
                        </Text>
                    </View>
                )}

                {isGaming && session && session.questions[currentIndex] && (
                    <View style={styles.gamingContainer}>
                        <QuizStreakBadge streak={streakCount} />
                        <QuizQuestionCard
                            question={session.questions[currentIndex]}
                            index={currentIndex}
                            total={session.questions.length}
                            secondsLeft={timeLeft}
                            totalSeconds={session.questionTimeSec || 30}
                            selectedIndex={selectedIndex}
                            correctIndex={lastAnswer?.correctIndex ?? null}
                            locked={phase === 'answer_reveal'}
                            onSelect={answer}
                        />
                    </View>
                )}

                {phase === 'result' && result && (
                    <QuizResultView
                        result={result}
                        attemptsLeft={status?.attemptsLeft ?? 0}
                        onPlayAgain={start}
                        onExit={backToLobby}
                    />
                )}
            </ScrollView>

            {/* Leaderboard Modal */}
            <QuizLeaderboardModal
                visible={showLeaderboard}
                data={leaderboard}
                onClose={handleCloseLeaderboard}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    topBarTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.clayText,
        textAlign: 'center',
        flex: 1,
        marginHorizontal: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 24,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 15,
        fontWeight: '600',
        color: '#6B7280',
    },
    countdownContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 20,
    },
    countdownCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.quizPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        ...SHADOWS.clay,
    },
    countdownNumber: {
        fontSize: 64,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    countdownTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: COLORS.clayText,
        marginBottom: 8,
        letterSpacing: 1,
    },
    countdownSubtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
    },
    gamingContainer: {
        paddingVertical: 8,
    },
});
