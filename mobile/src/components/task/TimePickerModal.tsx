import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { COLORS } from '../../theme';

interface TimePickerModalProps {
    visible: boolean;
    title?: string;
    pickedHour: number;
    pickedMinute: number;
    onSelectHour: (hour: number) => void;
    onSelectMinute: (minute: number) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
    visible,
    title = 'Chọn giờ',
    pickedHour,
    pickedMinute,
    onSelectHour,
    onSelectMinute,
    onConfirm,
    onCancel,
}) => {
    if (!visible) return null;

    return (
        <Modal visible transparent animationType="fade">
            <View style={styles.timePickerOverlay}>
                <View style={styles.timePickerSheet}>
                    <Text style={styles.timePickerTitle}>🕐 {title}</Text>

                    {/* Hour picker */}
                    <Text style={styles.subHeading}>Giờ</Text>
                    <View style={styles.chipRow}>
                        {Array.from({ length: 24 }, (_, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.timeChip, pickedHour === i && styles.timeChipActive]}
                                onPress={() => onSelectHour(i)}
                            >
                                <Text style={[styles.timeChipText, pickedHour === i && { color: '#FFF' }]}>
                                    {String(i).padStart(2, '0')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Minute picker */}
                    <Text style={styles.subHeading}>Phút</Text>
                    <View style={styles.chipRow}>
                        {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                            <TouchableOpacity
                                key={m}
                                style={[styles.timeChip, pickedMinute === m && styles.timeChipActive]}
                                onPress={() => onSelectMinute(m)}
                            >
                                <Text style={[styles.timeChipText, pickedMinute === m && { color: '#FFF' }]}>
                                    {String(m).padStart(2, '0')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Preview */}
                    <Text style={styles.previewText}>
                        {String(pickedHour).padStart(2, '0')}:{String(pickedMinute).padStart(2, '0')}
                    </Text>

                    <View style={styles.timePickerActions}>
                        <TouchableOpacity style={styles.timePickerCancel} onPress={onCancel}>
                            <Text style={{ color: COLORS.clayText, fontWeight: '600' }}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.timePickerConfirm} onPress={onConfirm}>
                            <Text style={{ color: '#FFF', fontWeight: '700' }}>Xác nhận</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    timePickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    timePickerSheet: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: COLORS.clayCard,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    timePickerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginBottom: 16,
        textAlign: 'center',
    },
    subHeading: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(93,64,55,0.5)',
        marginBottom: 8,
        alignSelf: 'flex-start',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 16,
    },
    timeChip: {
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: 'rgba(93,64,55,0.06)',
    },
    timeChipActive: {
        backgroundColor: COLORS.clayAccent1,
    },
    timeChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.clayText,
    },
    previewText: {
        fontSize: 28,
        fontWeight: '900',
        color: COLORS.clayText,
        marginBottom: 16,
    },
    timePickerActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    timePickerCancel: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
        backgroundColor: 'rgba(93,64,55,0.08)',
    },
    timePickerConfirm: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
        backgroundColor: COLORS.clayAccent1,
    },
});
