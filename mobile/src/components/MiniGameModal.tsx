import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface MiniGameModalProps {
    visible: boolean;
    type: 'tap' | 'quiz' | 'reflex';
    quizQuestion?: { questionIndex: number; question: string; options: string[] };
    onComplete: (result: 'critical' | 'normal', extraData?: { questionIndex?: number; answerIndex?: number }) => void;
    onSkip: () => void;
}

export default function MiniGameModal({ visible, type, quizQuestion, onComplete, onSkip }: MiniGameModalProps) {
    const [timeLeft, setTimeLeft] = useState(5);
    const [tapCount, setTapCount] = useState(0);
    const [reflexTargets, setReflexTargets] = useState<{ x: number, y: number, id: number }[]>([]);
    const [reflexHit, setReflexHit] = useState(0);

    const progressAnim = useRef(new Animated.Value(1)).current;
    
    // Setup when modal opens
    useEffect(() => {
        if (!visible) return;
        
        let initialTime = 5;
        if (type === 'quiz') initialTime = 10;
        if (type === 'reflex') {
            initialTime = 8;
            setReflexHit(0);
            generateReflexTargets();
        }
        
        setTimeLeft(initialTime);
        setTapCount(0);
        progressAnim.setValue(1);

        Animated.timing(progressAnim, {
            toValue: 0,
            duration: initialTime * 1000,
            easing: Easing.linear,
            useNativeDriver: false,
        }).start();

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [visible, type, quizQuestion]);

    const handleTimeUp = () => {
        if (type === 'tap') {
            onComplete(tapCount >= 20 ? 'critical' : 'normal');
        } else if (type === 'quiz') {
            // Random wrong answer or default normal since no answer picked
            onComplete('normal');
        } else if (type === 'reflex') {
            onComplete(reflexHit >= 3 ? 'critical' : 'normal');
        }
    };

    const generateReflexTargets = () => {
        const targets = [];
        // Define safe bounds for random targets
        const safeWidth = width * 0.8 - 60; // modal width - target size
        const safeHeight = height * 0.5 - 60; 
        
        for (let i = 0; i < 3; i++) {
            targets.push({
                id: i,
                x: Math.random() * safeWidth,
                y: Math.random() * safeHeight,
            });
        }
        setReflexTargets(targets);
    };

    const handleTapPress = () => {
        setTapCount(prev => prev + 1);
    };

    const handleQuizSelect = (index: number) => {
        if (!quizQuestion) return;
        // The backend determines if it's critical based on answerIndex
        onComplete('normal', { questionIndex: quizQuestion.questionIndex, answerIndex: index });
    };

    const handleReflexPress = (id: number) => {
        setReflexTargets(prev => prev.filter(t => t.id !== id));
        const newHit = reflexHit + 1;
        setReflexHit(newHit);
        if (newHit >= 3) {
            onComplete('critical');
        }
    };

    if (!visible) return null;

    const renderTapGame = () => (
        <View style={styles.gameArea}>
            <Text style={styles.gameTitle}>BÚA TẠ</Text>
            <Text style={styles.gameInstruction}>Nhấn liên tục để gây thêm sát thương! Cần 20 lần chạm.</Text>
            
            <View style={styles.counterBox}>
                <Text style={styles.counterText}>{tapCount} / 20</Text>
            </View>

            <TouchableOpacity style={styles.tapButton} onPress={handleTapPress} activeOpacity={0.7}>
                <MaterialIcons name="pan-tool" size={64} color="#FFF" />
                <Text style={styles.tapButtonText}>CHẠM NHANH</Text>
            </TouchableOpacity>
        </View>
    );

    const renderQuizGame = () => (
        <View style={styles.gameArea}>
            <Text style={styles.gameTitle}>GIẢI MÃ</Text>
            <Text style={styles.gameInstruction}>Trả lời đúng để chí mạng!</Text>
            
            <View style={styles.quizBox}>
                <Text style={styles.quizQuestion}>{quizQuestion?.question}</Text>
            </View>

            <View style={styles.quizOptions}>
                {quizQuestion?.options.map((opt, idx) => (
                    <TouchableOpacity 
                        key={idx} 
                        style={styles.quizOptionBtn} 
                        onPress={() => handleQuizSelect(idx)}
                    >
                        <Text style={styles.quizOptionText}>{['A', 'B', 'C', 'D'][idx]}. {opt}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderReflexGame = () => (
        <View style={styles.gameArea}>
            <Text style={styles.gameTitle}>ĐIỂM YẾU</Text>
            <Text style={styles.gameInstruction}>Chạm nhanh vào tất cả các điểm yếu xuất hiện!</Text>
            
            <View style={styles.reflexBox}>
                {reflexTargets.map(t => (
                    <TouchableOpacity 
                        key={t.id}
                        style={[styles.reflexTarget, { left: t.x, top: t.y }]}
                        onPress={() => handleReflexPress(t.id)}
                    >
                        <View style={styles.reflexTargetInner} />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header Timer */}
                    <View style={styles.header}>
                        <MaterialIcons name="timer" size={24} color="#ef4444" />
                        <Text style={styles.timerText}>{timeLeft}s</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <Animated.View style={[styles.progressBarFill, {
                            width: progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%']
                            })
                        }]} />
                    </View>

                    {type === 'tap' && renderTapGame()}
                    {type === 'quiz' && renderQuizGame()}
                    {type === 'reflex' && renderReflexGame()}

                    <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                        <Text style={styles.skipText}>Bỏ qua (Sát thương cơ bản)</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: width * 0.9,
        backgroundColor: '#1e293b',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    timerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ef4444',
    },
    progressBarBg: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        marginBottom: 24,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#ef4444',
    },
    gameArea: {
        width: '100%',
        alignItems: 'center',
    },
    gameTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 8,
        letterSpacing: 2,
    },
    gameInstruction: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 24,
    },
    // Tap
    counterBox: {
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 16,
        marginBottom: 24,
    },
    counterText: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fbbf24',
    },
    tapButton: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#ef4444',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#fca5a5',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    tapButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        marginTop: 8,
    },
    // Quiz
    quizBox: {
        width: '100%',
        padding: 20,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        marginBottom: 24,
    },
    quizQuestion: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
    },
    quizOptions: {
        width: '100%',
        gap: 12,
    },
    quizOptionBtn: {
        width: '100%',
        minHeight: 52, // Mobile UX >= 48dp
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    quizOptionText: {
        fontSize: 16,
        color: '#e2e8f0',
        fontWeight: '600',
    },
    // Reflex
    reflexBox: {
        width: '100%',
        height: height * 0.3,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        position: 'relative',
    },
    reflexTarget: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(239, 68, 68, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#ef4444',
    },
    reflexTargetInner: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#ef4444',
    },
    // Common
    skipButton: {
        marginTop: 32,
        padding: 12,
    },
    skipText: {
        color: '#64748b',
        fontSize: 14,
        textDecorationLine: 'underline',
    }
});
