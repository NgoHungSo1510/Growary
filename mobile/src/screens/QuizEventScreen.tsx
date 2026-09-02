import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  ScrollView, StatusBar, ActivityIndicator, Dimensions, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONT_SIZES, SHADOWS } from '../theme';
import { quizService } from '../services/quizService';
import { useAuth } from '../context/AuthContext';
import ClayHeader from '../components/ClayHeader';

const { width } = Dimensions.get('window');

// ── Màu quiz ──
const QB = '#2563EB';   // quiz blue primary
const QB2 = '#1D4ED8';  // quiz blue dark
const CORRECT = '#22C55E';
const WRONG   = '#EF4444';
const TIMER_COLOR = '#F97316';

// ── Circular countdown timer ──
// Dùng Animated.Value 30→0, vẽ stroke-dashoffset style
const QuizTimer = ({ seconds, totalSeconds }: { seconds: number; totalSeconds: number }) => {
  const radius = 38; const circumference = 2 * Math.PI * radius;
  const progress = seconds / totalSeconds;
  const color = seconds <= 10 ? WRONG : seconds <= 20 ? TIMER_COLOR : QB;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 90, height: 90 }}>
      {/* SVG-like dùng border trick */}
      <View style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 6,
        borderColor: color, alignItems: 'center', justifyContent: 'center',
        // Trick: borderTopColor transparent tạo hiệu ứng cung tròn không hoàn toàn
        // Nếu muốn chính xác hơn, dùng react-native-svg
      }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color }}>{seconds}</Text>
      </View>
    </View>
  );
};

type Phase = 'lobby' | 'countdown' | 'question' | 'answer_reveal' | 'result';

export default function QuizEventScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  // Status data
  const [status, setStatus]   = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Attempt data
  const [attempt, setAttempt] = useState<{ attemptId: string; topic: any; questions: any[] } | null>(null);
  const [phase, setPhase]     = useState<Phase>('lobby');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timer, setTimer]     = useState(30);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correctIndex, setCorrectIndex]   = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting]   = useState(false);

  // Countdown before start
  const [startCountdown, setStartCountdown] = useState(3);

  // Result
  const [result, setResult] = useState<{ totalCorrect: number; coinsEarned: number; totalQuestions: number } | null>(null);

  // Animations
  const shakeAnim  = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const s = await quizService.getStatus();
      setStatus(s);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Intercept back button during active quiz ──
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (phase === 'lobby' || phase === 'result') {
        return; // Allow back
      }

      // Prevent default behavior
      e.preventDefault();

      Alert.alert(
        'Thoát Quiz?',
        'Lượt này của bạn đang diễn ra. Nếu thoát, lượt này sẽ bị ghi nhận là thất bại và không thể quay lại. Bạn có chắc muốn thoát?',
        [
          { text: 'Tiếp tục Quiz', style: 'cancel', onPress: () => {} },
          {
            text: 'Thoát',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, phase]);

  // ── Phase: countdown ──
  useEffect(() => {
    if (phase !== 'countdown') return;
    setStartCountdown(3);
    const id = setInterval(() => {
      setStartCountdown(prev => {
        if (prev <= 1) { clearInterval(id); setPhase('question'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // ── Phase: question — chạy timer 30s ──
  useEffect(() => {
    if (phase !== 'question') return;
    setTimer(30);
    setSelectedIndex(null);
    setCorrectIndex(null);
    const id = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) { clearInterval(id); handleTimeout(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, currentQIndex]);

  const handleTimeout = () => {
    // Timeout: submit selectedIndex = -1
    handleAnswer(-1);
  };

  const handleAnswer = async (idx: number) => {
    if (isSubmitting || phase === 'answer_reveal') return;
    if (!attempt) return;
    setIsSubmitting(true);
    setSelectedIndex(idx);

    const q = attempt.questions[currentQIndex];
    const startedAt = Date.now();

    try {
      const res = await quizService.submitAnswer(
        attempt.attemptId, q._id, idx, 30 - timer
      );
      setCorrectIndex(res.correctIndex);
      setPhase('answer_reveal');

      // Animation: shake nếu sai
      if (!res.isCorrect && idx !== -1) {
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 6, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
        ]).start();
      }

      // Sau 3s → câu tiếp hoặc kết thúc
      setTimeout(async () => {
        if (currentQIndex + 1 < attempt.questions.length) {
          setCurrentQIndex(i => i + 1);
          setPhase('question');
        } else {
          // Hoàn thành
          const finalRes = await quizService.completeAttempt(attempt.attemptId);
          setResult(finalRes);
          setPhase('result');
        }
      }, 3000);
    } catch {
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const data = await quizService.startAttempt();
      setAttempt({ attemptId: data.attemptId, topic: data.topic, questions: data.questions });
      setCurrentQIndex(0);
      setPhase('countdown');
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Không thể bắt đầu lượt chơi');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render helpers ──

  const renderLobby = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Banner card — giống BossEventScreen */}
      <View style={[styles.bannerCard, { borderColor: '#60A5FA' }]}>
        <LinearGradient colors={[QB, QB2]} style={styles.bannerGradient}>
          <View style={styles.bannerGlare} />
          <MaterialIcons name={status?.event?.iconName || 'quiz'} size={120} color="rgba(255,255,255,0.15)"
            style={{ position: 'absolute', right: -10, bottom: -10, transform: [{ rotate: '-10deg' }] }} />
          <View style={{ marginTop: 20, zIndex: 2 }}>
            <View style={styles.seasonTag}>
              <Text style={styles.seasonText}>SỰ KIỆN ĐẶC BIỆT</Text>
            </View>
            <Text style={styles.bannerTitle}>{status?.event?.title}</Text>
            <Text style={styles.bannerSubtitle}>{status?.event?.description}</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Thông tin lượt */}
      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <MaterialIcons name="refresh" size={28} color={QB} />
          <Text style={styles.infoValue}>{status?.attemptsLeft ?? 0}</Text>
          <Text style={styles.infoLabel}>Lượt còn lại</Text>
        </View>
        <View style={styles.infoCard}>
          <MaterialIcons name="toll" size={28} color="#EAB308" />
          <Text style={styles.infoValue}>{status?.event?.rewardPerCorrect ?? 50}</Text>
          <Text style={styles.infoLabel}>Xu / câu đúng</Text>
        </View>
        <View style={styles.infoCard}>
          <MaterialIcons name="quiz" size={28} color={QB} />
          <Text style={styles.infoValue}>{status?.event?.questionsPerAttempt ?? 5}</Text>
          <Text style={styles.infoLabel}>Câu hỏi</Text>
        </View>
      </View>

      {/* Luật */}
      <View style={styles.ruleBox}>
        <MaterialIcons name="info" size={20} color={QB} style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.ruleTitle, { color: QB2 }]}>Cách chơi</Text>
          <Text style={[styles.ruleText, { color: QB2 }]}>
            • Chủ đề ngẫu nhiên (không trùng giữa các lượt){'\n'}
            • Mỗi câu có 30 giây để trả lời{'\n'}
            • Chọn xong → hiện kết quả 3s → câu tiếp{'\n'}
            • Hết lượt → hồi sau {status?.event?.attemptCooldownHours ?? 6} tiếng
          </Text>
        </View>
      </View>

      {/* Nút bắt đầu */}
      {(status?.attemptsLeft ?? 0) > 0 ? (
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <LinearGradient colors={[QB, QB2]} style={styles.startBtnGradient}>
            <MaterialIcons name="play-arrow" size={28} color="#FFF" />
            <Text style={styles.startBtnText}>Bắt Đầu</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <View style={[styles.startBtn, { opacity: 0.5 }]}>
          <LinearGradient colors={['#94A3B8', '#64748B']} style={styles.startBtnGradient}>
            <MaterialIcons name="hourglass-empty" size={24} color="#FFF" />
            <Text style={styles.startBtnText}>Hết lượt — đang hồi</Text>
          </LinearGradient>
        </View>
      )}
    </ScrollView>
  );

  const renderCountdown = () => (
    <View style={styles.centeredFull}>
      <Text style={{ fontSize: 24, color: COLORS.clayText, fontWeight: 'bold', marginBottom: 16 }}>Chuẩn bị!</Text>
      <Text style={{ fontSize: 100, fontWeight: '900', color: QB }}>{startCountdown}</Text>
    </View>
  );

  const renderQuestion = () => {
    if (!attempt) return null;
    const q = attempt.questions[currentQIndex];
    return (
      <Animated.View style={[styles.scrollContent, { transform: [{ translateX: shakeAnim }] }]}>
        {/* Header chủ đề + số câu */}
        <View style={styles.questionHeader}>
          <View style={[styles.topicBadge, { backgroundColor: attempt.topic?.colorAccent || QB }]}>
            <Text style={styles.topicBadgeText}>{attempt.topic?.name}</Text>
          </View>
          <Text style={styles.questionCounter}>Câu {currentQIndex + 1}/{attempt.questions.length}</Text>
        </View>

        {/* Timer + câu hỏi */}
        <View style={styles.questionCard}>
          <QuizTimer seconds={timer} totalSeconds={30} />
          <Text style={styles.questionText}>{q.question}</Text>
        </View>

        {/* 4 đáp án */}
        {q.options.map((opt: string, idx: number) => (
          <TouchableOpacity
            key={idx}
            style={[styles.optionBtn, phase === 'answer_reveal' && {
              backgroundColor:
                idx === correctIndex ? CORRECT :
                idx === selectedIndex && idx !== correctIndex ? WRONG :
                undefined,
              borderColor:
                idx === correctIndex ? CORRECT :
                idx === selectedIndex && idx !== correctIndex ? WRONG :
                undefined,
            }]}
            onPress={() => phase === 'question' && handleAnswer(idx)}
            activeOpacity={phase === 'question' ? 0.8 : 1}
            disabled={phase !== 'question'}
          >
            <View style={[styles.optionLabel, {
              backgroundColor:
                idx === correctIndex ? CORRECT :
                idx === selectedIndex && idx !== correctIndex ? WRONG :
                QB
            }]}>
              <Text style={styles.optionLabelText}>{['A','B','C','D'][idx]}</Text>
            </View>
            <Text style={[styles.optionText, {
              color: (idx === correctIndex || (idx === selectedIndex && idx !== correctIndex))
                ? '#FFF' : COLORS.clayText
            }]}>{opt}</Text>
            {/* Icon kết quả */}
            {phase === 'answer_reveal' && idx === correctIndex && (
              <MaterialIcons name="check-circle" size={20} color="#FFF" />
            )}
            {phase === 'answer_reveal' && idx === selectedIndex && idx !== correctIndex && (
              <MaterialIcons name="cancel" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        ))}
      </Animated.View>
    );
  };

  const renderResult = () => (
    <View style={styles.centeredFull}>
      <LinearGradient colors={[QB, QB2]} style={styles.resultCard}>
        <MaterialIcons name="emoji-events" size={64} color="#FFD54F" />
        <Text style={styles.resultTitle}>🎉 Kết Quả!</Text>
        <Text style={styles.resultCorrect}>
          Đúng {result?.totalCorrect ?? 0} / {result?.totalQuestions ?? 0} câu
        </Text>
        <View style={styles.resultCoinsRow}>
          <MaterialIcons name="toll" size={32} color="#FFD54F" />
          <Text style={styles.resultCoins}>+{result?.coinsEarned ?? 0} xu</Text>
        </View>
        <Text style={styles.resultSub}>Còn {(status?.attemptsLeft ?? 1) - 1} lượt trong sự kiện này</Text>
      </LinearGradient>
      <TouchableOpacity
        style={[styles.startBtn, { marginTop: 24 }]}
        onPress={() => { loadStatus(); setPhase('lobby'); }}
        activeOpacity={0.85}
      >
        <LinearGradient colors={[QB, QB2]} style={styles.startBtnGradient}>
          <Text style={styles.startBtnText}>Về Sự Kiện</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color={QB} />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.warmBg} />
      {/* Background blobs — màu xanh thay đỏ */}
      <View style={[styles.blob, { top: -60, left: -40, backgroundColor: 'rgba(37,99,235,0.12)' }]} />
      <View style={[styles.blob, { bottom: -80, right: -40, backgroundColor: 'rgba(29,78,216,0.1)' }]} />

      <ClayHeader user={user} />

      {/* Sub-header */}
      <View style={styles.subHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back-ios" size={20} color="rgba(93,64,55,0.6)" />
        </TouchableOpacity>
        {phase === 'question' || phase === 'answer_reveal' ? (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentQIndex) / (attempt?.questions.length || 5)) * 100}%`, backgroundColor: QB }]} />
          </View>
        ) : (
          <Text style={styles.screenTitle}>Quiz Trắc Nghiệm</Text>
        )}
      </View>

      {phase === 'lobby'           && renderLobby()}
      {phase === 'countdown'       && renderCountdown()}
      {(phase === 'question' || phase === 'answer_reveal') && renderQuestion()}
      {phase === 'result'          && renderResult()}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.warmBg },
  scrollContent: { padding: 24, paddingBottom: 100 },
  centeredFull:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  blob: { position: 'absolute', width: 220, height: 220, borderRadius: 110 },
  subHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 10, gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.warmBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', ...SHADOWS.clayLight,
  },
  screenTitle: { fontSize: FONT_SIZES.subtitle, fontWeight: 'bold', color: COLORS.clayText },
  progressBar: { flex: 1, height: 8, backgroundColor: 'rgba(37,99,235,0.15)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  // Banner
  bannerCard: {
    borderRadius: 32, marginBottom: 20, height: 200,
    borderWidth: 3, ...SHADOWS.clay,
    shadowColor: QB2,
  },
  bannerGradient: { flex: 1, borderRadius: 29, padding: 20, overflow: 'hidden', position: 'relative' },
  bannerGlare:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 29 },
  seasonTag: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'flex-start', marginBottom: 8,
  },
  seasonText:     { fontSize: FONT_SIZES.caption, fontWeight: '900', color: '#BFDBFE', textTransform: 'uppercase' },
  bannerTitle:    { fontSize: 22, fontWeight: '900', color: '#FFF', marginBottom: 6, lineHeight: 28 },
  bannerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },

  // Info row
  infoRow:  { flexDirection: 'row', gap: 12, marginBottom: 16 },
  infoCard: {
    flex: 1, backgroundColor: COLORS.clayCard, borderRadius: 20, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', ...SHADOWS.clayLight,
  },
  infoValue: { fontSize: 22, fontWeight: '900', color: COLORS.clayText, marginTop: 4 },
  infoLabel: { fontSize: 11, color: 'rgba(93,64,55,0.7)', fontWeight: 'bold', marginTop: 2 },

  // Rule box
  ruleBox: {
    flexDirection: 'row', gap: 12, padding: 16, borderRadius: 16, marginBottom: 20,
    backgroundColor: 'rgba(37,99,235,0.08)', borderWidth: 1, borderColor: 'rgba(37,99,235,0.2)',
  },
  ruleTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 6 },
  ruleText:  { fontSize: 12, lineHeight: 20, opacity: 0.85 },

  // Start button
  startBtn: { borderRadius: 20, overflow: 'hidden', ...SHADOWS.clay, shadowColor: QB2 },
  startBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 8,
  },
  startBtnText: { fontSize: 18, fontWeight: '900', color: '#FFF' },

  // Question
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  topicBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  topicBadgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  questionCounter: { fontSize: 14, fontWeight: 'bold', color: 'rgba(93,64,55,0.6)' },
  questionCard: {
    backgroundColor: COLORS.clayCard, borderRadius: 24, padding: 20,
    alignItems: 'center', marginBottom: 20, ...SHADOWS.clayLight,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
  },
  questionText: { fontSize: 18, fontWeight: '700', color: COLORS.clayText, textAlign: 'center', marginTop: 12, lineHeight: 26 },

  // Options
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.clayCard, borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', ...SHADOWS.clayLight,
  },
  optionLabel: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  optionLabelText: { color: '#FFF', fontWeight: '900', fontSize: 13 },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600' },

  // Result
  resultCard: { borderRadius: 32, padding: 32, alignItems: 'center', width: '100%' },
  resultTitle: { fontSize: 28, fontWeight: '900', color: '#FFF', marginTop: 12 },
  resultCorrect: { fontSize: 20, color: 'rgba(255,255,255,0.9)', fontWeight: 'bold', marginTop: 8 },
  resultCoinsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  resultCoins: { fontSize: 36, fontWeight: '900', color: '#FFD54F' },
  resultSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 12 },
});
