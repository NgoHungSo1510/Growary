import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { quizService } from '../services/quizService';
import { useNavigation } from '@react-navigation/native';

// Countdown HH:MM:SS từ Date
function useCountdown(endTime: string | null) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!endTime) return;
    const tick = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) { setText('00:00:00'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setText(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);
  return text;
}

export default function FloatingQuizButton() {
  const navigation = useNavigation<any>();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [quizData, setQuizData] = useState<{
    event: any; attemptsLeft: number; nextRechargeAt: string | null;
  } | null>(null);

  // Pulse animation loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Poll status mỗi 60s
  useEffect(() => {
    const poll = async () => {
      try {
        const status = await quizService.getStatus();
        if (status.hasActiveEvent) {
          setQuizData({ event: status.event, attemptsLeft: status.attemptsLeft, nextRechargeAt: status.nextRechargeAt });
        } else {
          setQuizData(null);
        }
      } catch { setQuizData(null); }
    };
    poll();
    const id = setInterval(poll, 60000);
    return () => clearInterval(id);
  }, []);

  // Countdown: nếu còn lượt → đếm ngược đến endTime; nếu hết → đếm ngược đến nextRechargeAt
  const countdownTarget = quizData
    ? (quizData.attemptsLeft > 0 ? quizData.event?.endTime : quizData.nextRechargeAt)
    : null;
  const countdown = useCountdown(countdownTarget);

  if (!quizData) return null;

  const { event, attemptsLeft } = quizData;
  const bgColor = event?.colorBg || '#2563EB';
  const iconColor = event?.colorIcon || '#FFFFFF';
  const isRecharging = attemptsLeft === 0;

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: pulseAnim }] }]}>
      <TouchableOpacity
        activeOpacity={isRecharging ? 0.7 : 0.85}
        onPress={() => !isRecharging && navigation.navigate('QuizEvent')}
      >
        <LinearGradient
          colors={[bgColor, bgColor + 'CC']}
          style={styles.button}
        >
          {/* Icon */}
          <MaterialIcons
            name={isRecharging ? 'hourglass-empty' : (event?.iconName || 'quiz')}
            size={28}
            color={iconColor}
          />
          {/* Countdown badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{countdown}</Text>
          </View>
          {/* Lượt còn */}
          {!isRecharging && (
            <View style={styles.attemptBadge}>
              <Text style={styles.attemptText}>{attemptsLeft}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 110,       // Trên TabBar (TabBar cao ~80, + 30 padding)
    right: 20,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  badge: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    transform: [{ translateX: -32 }],
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    width: 64,
    alignItems: 'center',
  },
  badgeText: { fontSize: 9, color: '#FFF', fontWeight: 'bold', letterSpacing: 0.5 },
  attemptBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  attemptText: { fontSize: 11, fontWeight: '900', color: '#FFF' },
});
