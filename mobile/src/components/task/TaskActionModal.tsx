import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DailyTask } from '../../types';
import { COLORS } from '../../theme';

interface TaskActionModalProps {
    visible: boolean;
    task: DailyTask | null;
    onEditTime: () => void;
    onRemove: () => void;
    onClose: () => void;
}

export const TaskActionModal: React.FC<TaskActionModalProps> = ({
    visible,
    task,
    onEditTime,
    onRemove,
    onClose,
}) => {
    if (!task) return null;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.actionOverlay}>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
                <View style={styles.actionSheet}>
                    <View style={styles.handleWrap}>
                        <View style={styles.handle} />
                    </View>

                    <Text style={styles.actionTitle} numberOfLines={2}>
                        {task.title}
                    </Text>

                    <View style={styles.actionBtnGroup}>
                        <TouchableOpacity style={styles.actionBtn} onPress={onEditTime}>
                            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                                <MaterialIcons name="access-time" size={24} color="#3B82F6" />
                            </View>
                            <Text style={styles.actionBtnText}>Đổi giờ</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, task.isMandatory && { opacity: 0.4 }]}
                            disabled={task.isMandatory}
                            onPress={onRemove}
                        >
                            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                                <MaterialIcons name="delete-outline" size={24} color="#EF4444" />
                            </View>
                            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>
                                {task.isMandatory ? 'Bắt buộc' : 'Xoá quest'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    actionOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    actionSheet: {
        backgroundColor: COLORS.warmBg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    handleWrap: {
        alignItems: 'center',
        marginBottom: 12,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(93,64,55,0.15)',
    },
    actionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.clayText,
        textAlign: 'center',
        marginBottom: 20,
    },
    actionBtnGroup: {
        flexDirection: 'row',
        gap: 16,
    },
    actionBtn: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.clayCard,
        borderRadius: 16,
    },
    actionIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    actionBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
});
