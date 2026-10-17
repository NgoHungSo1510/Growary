import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../services/api';
import { DailyPlan, DailyTask, TaskTemplate } from '../types';
import { COLORS } from '../theme';
import {
    TimePickerModal,
    TaskActionModal,
    QuestPickerModal,
    TimelineTaskCard,
    CustomTaskFormData,
} from '../components/task';

export default function NewTaskScreen() {
    const [plan, setPlan] = useState<DailyPlan | null>(null);
    const [templates, setTemplates] = useState<TaskTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [showPicker, setShowPicker] = useState(false);
    const [pickerTab, setPickerTab] = useState<'system' | 'custom'>('system');
    const [filterCat, setFilterCat] = useState<string | null>(null);

    // Action Modal state
    const [actionTask, setActionTask] = useState<{ task: DailyTask; index: number } | null>(null);

    // Time picker state
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [pendingTemplate, setPendingTemplate] = useState<TaskTemplate | null>(null);
    const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
    const [pickedHour, setPickedHour] = useState(8);
    const [pickedMinute, setPickedMinute] = useState(0);

    // Custom task form
    const [customForm, setCustomForm] = useState<CustomTaskFormData>({
        title: '',
        description: '',
        category: 'other',
        estimatedMinutes: 15,
    });

    const fetchData = async () => {
        try {
            const planRes = await apiService.getTomorrowPlan();
            setPlan(planRes.plan);
        } catch (error) {
            console.error('Failed to fetch tomorrow plan:', error);
        }

        try {
            const templateRes = await apiService.getTaskTemplates();
            setTemplates(templateRes.tasks || []);
        } catch (error) {
            console.error('Failed to fetch task templates:', error);
        }

        setIsLoading(false);
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const sortedTasks = [...(plan?.tasks || [])].sort((a, b) => {
        if (!a.scheduledTime && !b.scheduledTime) return 0;
        if (!a.scheduledTime) return 1;
        if (!b.scheduledTime) return -1;
        return a.scheduledTime.localeCompare(b.scheduledTime);
    });

    const handleSelectTemplate = (template: TaskTemplate) => {
        setPendingTemplate(template);
        const now = new Date();
        setPickedHour(now.getHours());
        setPickedMinute(0);
        setShowTimePicker(true);
    };

    const confirmTimeSelection = async () => {
        if (!plan) return;
        const timeStr = `${String(pickedHour).padStart(2, '0')}:${String(pickedMinute).padStart(2, '0')}`;

        try {
            if (editingTaskIndex !== null) {
                const { plan: updated } = await apiService.updateTaskDetails(plan._id, editingTaskIndex, {
                    scheduledTime: timeStr,
                });
                setPlan(updated);
                Alert.alert('✅ Đã cập nhật!', `Thời gian: ${timeStr}`);
            } else if (pendingTemplate) {
                const { plan: updated } = await apiService.addTaskToPlan(plan._id, {
                    templateId: pendingTemplate._id,
                    scheduledTime: timeStr,
                    durationMinutes: pendingTemplate.estimatedMinutes,
                });
                setPlan(updated);
                Alert.alert('✅ Đã thêm!', `"${pendingTemplate.title}" lúc ${timeStr}`);
            }
            setShowTimePicker(false);
            setPendingTemplate(null);
            setEditingTaskIndex(null);
            setShowPicker(false);
        } catch (error: any) {
            Alert.alert('Lỗi', error.response?.data?.error || 'Không thể lưu');
        }
    };

    const handleEditTaskTime = (task: DailyTask) => {
        if (!plan) return;
        const realIndex = plan.tasks.findIndex((t) => t._id === task._id);
        if (realIndex === -1) return;

        setEditingTaskIndex(realIndex);
        setPendingTemplate(null);
        const [h, m] = task.scheduledTime ? task.scheduledTime.split(':').map(Number) : [new Date().getHours(), 0];
        setPickedHour(h || 8);
        setPickedMinute(m || 0);
        setShowTimePicker(true);
    };

    const handleAddCustom = async () => {
        if (!plan || !customForm.title.trim()) return;
        const timeStr = `${String(pickedHour).padStart(2, '0')}:${String(pickedMinute).padStart(2, '0')}`;
        try {
            const { plan: updated } = await apiService.addTaskToPlan(plan._id, {
                customTitle: customForm.title,
                scheduledTime: timeStr,
                durationMinutes: customForm.estimatedMinutes,
                description: customForm.description,
                category: customForm.category,
            });
            setPlan(updated);
            setShowPicker(false);
            setCustomForm({ title: '', description: '', category: 'other', estimatedMinutes: 15 });
            Alert.alert('📨 Đã gửi!', 'Nhiệm vụ đã gửi cho admin duyệt. XP sẽ được cộng sau khi duyệt.');
        } catch (error: any) {
            Alert.alert('Lỗi', error.response?.data?.error || 'Không thể thêm');
        }
    };

    const handleRemoveTask = async (task: DailyTask) => {
        if (!plan) return;
        if (task.isMandatory) {
            Alert.alert('⭐ Bắt buộc', 'Không thể xóa nhiệm vụ bắt buộc.');
            return;
        }
        Alert.alert('Xoá quest', `Xóa "${task.title}"?`, [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xoá',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const realIndex = plan.tasks.findIndex((t) => t._id === task._id);
                        const { plan: updated } = await apiService.removeTaskFromPlan(plan._id, realIndex);
                        setPlan(updated);
                    } catch (error: any) {
                        Alert.alert('Lỗi', error.response?.data?.error || 'Không thể xoá');
                    }
                },
            },
        ]);
    };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayNum = tomorrow.getDate();
    const monthStr = tomorrow.toLocaleString('en-US', { month: 'short' }).toUpperCase();

    const nonMandatoryTemplates = templates.filter((t) => !t.isMandatory);
    const filteredTemplates = filterCat
        ? nonMandatoryTemplates.filter((t) => t.category === filterCat)
        : nonMandatoryTemplates;

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <Text style={{ color: COLORS.clayText }}>Đang tải...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* HEADER */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.titleText}>Kế hoạch{'\n'}ngày mai</Text>
                        <Text style={styles.subtitleText}>Sắp xếp nhiệm vụ theo timeline</Text>
                    </View>
                    <View style={styles.dateBadge}>
                        <View style={styles.dateNumberBox}>
                            <Text style={styles.dateNumber}>{dayNum}</Text>
                        </View>
                        <Text style={styles.dateMonth}>{monthStr}</Text>
                    </View>
                </View>

                {/* AI ASSISTANT BAR */}
                <View style={styles.aiBar}>
                    <LinearGradient colors={[COLORS.clayAccent2, '#EC4899']} style={styles.aiIconBox}>
                        <MaterialIcons name="auto-awesome" size={20} color="#FFF" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.aiLabel}>AI Guild Master</Text>
                        <Text style={styles.aiMessage}>
                            {sortedTasks.length === 0
                                ? '"Thêm quest cho ngày mai! Bắt đầu từ việc quan trọng nhất."'
                                : `"${sortedTasks.length} quest đã lên lịch! Ngon lành. 💪"`}
                        </Text>
                    </View>
                </View>

                {/* TIMELINE */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Timeline</Text>
                    <View style={styles.questCountBadge}>
                        <Text style={styles.questCountText}>{sortedTasks.length} quest</Text>
                    </View>
                </View>

                <View style={styles.timelineWrap}>
                    {sortedTasks.length > 0 && <View style={styles.timelineLine} />}

                    {sortedTasks.map((task, index) => (
                        <TimelineTaskCard
                            key={task._id || index}
                            task={task}
                            index={index}
                            onPress={(t, i) => setActionTask({ task: t, index: i })}
                            onEditTime={handleEditTaskTime}
                        />
                    ))}

                    {sortedTasks.length === 0 && (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="explore" size={48} color="rgba(93,64,55,0.2)" />
                            <Text style={styles.emptyText}>Chưa có quest nào.{'\n'}Bấm nút bên dưới để thêm!</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.addSlotBtn}
                        activeOpacity={0.7}
                        onPress={() => {
                            setShowPicker(true);
                            setPickerTab('system');
                        }}
                    >
                        <MaterialIcons name="add" size={22} color="rgba(93, 64, 55, 0.5)" />
                        <Text style={styles.addSlotText}>Thêm quest</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Modals */}
            <QuestPickerModal
                visible={showPicker}
                pickerTab={pickerTab}
                filterCat={filterCat}
                filteredTemplates={filteredTemplates}
                customForm={customForm}
                pickedHour={pickedHour}
                pickedMinute={pickedMinute}
                onChangeTab={setPickerTab}
                onChangeFilterCat={setFilterCat}
                onSelectTemplate={handleSelectTemplate}
                onChangeCustomForm={setCustomForm}
                onOpenTimePicker={() => setShowTimePicker(true)}
                onSubmitCustom={handleAddCustom}
                onClose={() => setShowPicker(false)}
            />

            <TimePickerModal
                visible={showTimePicker}
                title={pendingTemplate ? `Chọn giờ cho "${pendingTemplate.title}"` : 'Chọn giờ'}
                pickedHour={pickedHour}
                pickedMinute={pickedMinute}
                onSelectHour={setPickedHour}
                onSelectMinute={setPickedMinute}
                onConfirm={() => {
                    if (pendingTemplate || editingTaskIndex !== null) {
                        confirmTimeSelection();
                    } else {
                        setShowTimePicker(false);
                    }
                }}
                onCancel={() => {
                    setShowTimePicker(false);
                    setPendingTemplate(null);
                    setEditingTaskIndex(null);
                }}
            />

            <TaskActionModal
                visible={!!actionTask}
                task={actionTask?.task || null}
                onEditTime={() => {
                    if (actionTask) {
                        handleEditTaskTime(actionTask.task);
                        setActionTask(null);
                    }
                }}
                onRemove={() => {
                    if (actionTask) {
                        handleRemoveTask(actionTask.task);
                        setActionTask(null);
                    }
                }}
                onClose={() => setActionTask(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.warmBg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.warmBg },
    scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    titleText: {
        fontSize: 28,
        fontWeight: '900',
        color: COLORS.clayText,
        lineHeight: 34,
    },
    subtitleText: {
        fontSize: 13,
        color: 'rgba(93,64,55,0.6)',
        marginTop: 4,
    },
    dateBadge: {
        alignItems: 'center',
        backgroundColor: COLORS.clayCard,
        borderRadius: 16,
        padding: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    dateNumberBox: {
        backgroundColor: COLORS.clayAccent1,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    dateNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
    dateMonth: {
        fontSize: 10,
        fontWeight: '800',
        color: COLORS.clayText,
        marginTop: 4,
    },
    aiBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 18,
        padding: 12,
        marginBottom: 24,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.9)',
    },
    aiIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    aiLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: COLORS.clayAccent2,
    },
    aiMessage: {
        fontSize: 12,
        color: COLORS.clayText,
        marginTop: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    questCountBadge: {
        backgroundColor: 'rgba(93,64,55,0.08)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    questCountText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    timelineWrap: {
        position: 'relative',
    },
    timelineLine: {
        position: 'absolute',
        top: 20,
        bottom: 20,
        left: 57,
        width: 2,
        backgroundColor: 'rgba(93,64,55,0.1)',
        zIndex: 0,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        fontSize: 13,
        color: 'rgba(93,64,55,0.5)',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 18,
    },
    addSlotBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: 'rgba(93, 64, 55, 0.15)',
        borderStyle: 'dashed',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        marginTop: 8,
    },
    addSlotText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'rgba(93, 64, 55, 0.6)',
    },
});
