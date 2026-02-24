import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Alert,
    Modal,
    TextInput,
    FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DailyPlan, DailyTask, TaskTemplate } from '../types';
import { COLORS, FONT_SIZES } from '../theme';

const { width, height } = Dimensions.get('window');

const CATEGORY_MAP: Record<string, { bg: string; icon: keyof typeof MaterialIcons.glyphMap; label: string }> = {
    health: { bg: '#FDC3A1', icon: 'fitness-center', label: 'Sức khỏe' },
    study: { bg: '#FB9B8F', icon: 'school', label: 'Học tập' },
    work: { bg: '#F57799', icon: 'work', label: 'Công việc' },
    personal: { bg: '#FDC3A1', icon: 'person', label: 'Cá nhân' },
    household: { bg: '#FB9B8F', icon: 'home', label: 'Gia đình' },
    other: { bg: '#FDC3A1', icon: 'star', label: 'Khác' },
};

const CATEGORIES = Object.entries(CATEGORY_MAP);

export default function NewTaskScreen() {
    const { user } = useAuth();
    const [plan, setPlan] = useState<DailyPlan | null>(null);
    const [templates, setTemplates] = useState<TaskTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal state
    const [showPicker, setShowPicker] = useState(false);
    const [pickerTab, setPickerTab] = useState<'system' | 'custom'>('system');
    const [filterCat, setFilterCat] = useState<string | null>(null);

    // Action Modal state
    const [actionTask, setActionTask] = useState<{ task: DailyTask, index: number } | null>(null);

    // Time picker state
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [pendingTemplate, setPendingTemplate] = useState<TaskTemplate | null>(null);
    const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null); // For updating existing task
    const [pickedHour, setPickedHour] = useState(8);
    const [pickedMinute, setPickedMinute] = useState(0);

    // Custom task form
    const [customForm, setCustomForm] = useState({
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

    // Sort tasks by scheduledTime
    const sortedTasks = [...(plan?.tasks || [])].sort((a, b) => {
        if (!a.scheduledTime && !b.scheduledTime) return 0;
        if (!a.scheduledTime) return 1;
        if (!b.scheduledTime) return -1;
        return a.scheduledTime.localeCompare(b.scheduledTime);
    });

    // Add system template with time
    const handleSelectTemplate = (template: TaskTemplate) => {
        setPendingTemplate(template);
        const now = new Date();
        setPickedHour(now.getHours());
        setPickedMinute(0);
        setShowTimePicker(true);
    };

    const confirmAddTemplate = async () => {
        if (!plan) return;
        const timeStr = `${String(pickedHour).padStart(2, '0')}:${String(pickedMinute).padStart(2, '0')}`;

        try {
            if (editingTaskIndex !== null) {
                // Updating existing task
                const { plan: updated } = await apiService.updateTaskDetails(plan._id, editingTaskIndex, {
                    scheduledTime: timeStr,
                });
                setPlan(updated);
                Alert.alert('✅ Đã cập nhật!', `Thời gian: ${timeStr}`);
            } else if (pendingTemplate) {
                // Adding new task
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
        const realIndex = plan.tasks.findIndex(t => t._id === task._id);
        if (realIndex === -1) return;

        setEditingTaskIndex(realIndex);
        setPendingTemplate(null); // Ensure we are not adding new
        // Set time from task if exists, else current time
        const [h, m] = task.scheduledTime ? task.scheduledTime.split(':').map(Number) : [new Date().getHours(), 0];
        setPickedHour(h || 8);
        setPickedMinute(m || 0);
        setShowTimePicker(true);
    };

    // Add custom task
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

    const handleRemoveTask = async (taskIndex: number, task: DailyTask) => {
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
                        // Find actual index in plan.tasks (not sorted index)
                        const realIndex = plan.tasks.findIndex(t => t._id === task._id);
                        const { plan: updated } = await apiService.removeTaskFromPlan(plan._id, realIndex);
                        setPlan(updated);
                    } catch (error: any) {
                        Alert.alert('Lỗi', error.response?.data?.error || 'Không thể xoá');
                    }
                },
            },
        ]);
    };

    // Tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayNum = tomorrow.getDate();
    const monthStr = tomorrow.toLocaleString('en-US', { month: 'short' }).toUpperCase();

    const nonMandatoryTemplates = templates.filter(t => !t.isMandatory);
    const filteredTemplates = filterCat
        ? nonMandatoryTemplates.filter(t => t.category === filterCat)
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
            <View style={[styles.blob, styles.blobTop]} />
            <View style={[styles.blob, styles.blobBottom]} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* --- HEADER --- */}
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

                {/* --- AI ASSISTANT BAR --- */}
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

                {/* --- QUEST COUNT --- */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Timeline</Text>
                    <View style={styles.questCountBadge}>
                        <Text style={styles.questCountText}>
                            {sortedTasks.length} quest
                        </Text>
                    </View>
                </View>

                {/* --- VERTICAL TIMELINE --- */}
                <View style={styles.timelineWrap}>
                    {/* Vertical line */}
                    {sortedTasks.length > 0 && (
                        <View style={styles.timelineLine} />
                    )}

                    {sortedTasks.map((task, index) => {
                        const cat = CATEGORY_MAP[task.category || 'other'] || CATEGORY_MAP.other;
                        const isPending = task.adminApprovalStatus === 'pending';

                        return (
                            <View key={task._id || index} style={styles.timelineRow}>
                                {/* Time label */}
                                <View style={styles.timeColumn}>
                                    <Text style={styles.timeLabel}>
                                        {task.scheduledTime || '--:--'}
                                    </Text>
                                </View>

                                {/* Dot */}
                                <View style={styles.dotColumn}>
                                    <View style={[styles.timelineDot, { backgroundColor: cat.bg }]}>
                                        {task.isMandatory && (
                                            <Text style={{ fontSize: 8 }}>⭐</Text>
                                        )}
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.timelineCard,
                                        { backgroundColor: cat.bg },
                                        task.isMandatory && !task.scheduledTime && styles.mandatoryPulse
                                    ]}
                                    activeOpacity={0.8}
                                    onPress={() => setActionTask({ task, index })}
                                >
                                    <View style={styles.cardRow}>
                                        <View style={styles.cardIconBox}>
                                            <MaterialIcons name={cat.icon} size={22} color="#FFF" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.cardTitle} numberOfLines={1}>{task.title}</Text>
                                            <View style={styles.cardMeta}>
                                                <Text style={styles.cardXp}>+{task.pointsReward} XP</Text>
                                                {task.durationMinutes ? (
                                                    <Text style={styles.cardDuration}>{task.durationMinutes} phút</Text>
                                                ) : null}
                                            </View>
                                        </View>
                                        {task.isMandatory && (
                                            <View style={styles.mandatoryBadge}>
                                                <Text style={styles.mandatoryText}>Bắt buộc</Text>
                                            </View>
                                        )}
                                        {isPending && (
                                            <View style={[styles.mandatoryBadge, { backgroundColor: 'rgba(234,179,8,0.3)' }]}>
                                                <Text style={[styles.mandatoryText, { color: '#B45309' }]}>Chờ duyệt</Text>
                                            </View>
                                        )}
                                        {task.isMandatory && !task.scheduledTime && (
                                            <TouchableOpacity
                                                style={styles.setTimeBtn}
                                                onPress={() => handleEditTaskTime(task)}
                                            >
                                                <Text style={styles.setTimeText}>🕒 Chọn giờ</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            </View>
                        );
                    })}

                    {/* Empty state */}
                    {sortedTasks.length === 0 && (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="explore" size={48} color="rgba(93,64,55,0.2)" />
                            <Text style={styles.emptyText}>
                                Chưa có quest nào.{'\n'}Bấm nút bên dưới để thêm!
                            </Text>
                        </View>
                    )}

                    {/* Add quest button */}
                    <TouchableOpacity
                        style={styles.addSlotBtn}
                        activeOpacity={0.7}
                        onPress={() => { setShowPicker(true); setPickerTab('system'); }}
                    >
                        <MaterialIcons name="add" size={22} color="rgba(93, 64, 55, 0.5)" />
                        <Text style={styles.addSlotText}>Thêm quest</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ====== QUEST PICKER MODAL ====== */}
            <Modal visible={showPicker} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowPicker(false)} />
                    <View style={styles.modalSheet}>
                        {/* Drag Handle */}
                        <View style={{ alignItems: 'center', marginBottom: 8 }}>
                            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(93,64,55,0.15)' }} />
                        </View>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Thêm Quest</Text>
                            <TouchableOpacity onPress={() => setShowPicker(false)}>
                                <MaterialIcons name="close" size={24} color={COLORS.clayText} />
                            </TouchableOpacity>
                        </View>

                        {/* Tabs */}
                        <View style={styles.tabRow}>
                            <TouchableOpacity
                                style={[styles.tab, pickerTab === 'system' && styles.tabActive]}
                                onPress={() => setPickerTab('system')}
                            >
                                <Text style={[styles.tabText, pickerTab === 'system' && styles.tabTextActive]}>
                                    📋 Có sẵn
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, pickerTab === 'custom' && styles.tabActive]}
                                onPress={() => setPickerTab('custom')}
                            >
                                <Text style={[styles.tabText, pickerTab === 'custom' && styles.tabTextActive]}>
                                    ✏️ Tự tạo
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Tab: System tasks */}
                        {pickerTab === 'system' && (
                            <View style={{ flex: 1 }}>
                                {/* Category filter */}
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                                    <TouchableOpacity
                                        style={[styles.filterChip, !filterCat && styles.filterChipActive]}
                                        onPress={() => setFilterCat(null)}
                                    >
                                        <Text style={[styles.filterText, !filterCat && styles.filterTextActive]}>Tất cả</Text>
                                    </TouchableOpacity>
                                    {CATEGORIES.map(([key, val]) => (
                                        <TouchableOpacity
                                            key={key}
                                            style={[styles.filterChip, filterCat === key && styles.filterChipActive]}
                                            onPress={() => setFilterCat(key)}
                                        >
                                            <Text style={[styles.filterText, filterCat === key && styles.filterTextActive]}>
                                                {val.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <FlatList
                                    data={filteredTemplates}
                                    keyExtractor={item => item._id}
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                    renderItem={({ item }) => {
                                        const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP.other;
                                        return (
                                            <TouchableOpacity
                                                style={styles.templateItem}
                                                onPress={() => handleSelectTemplate(item)}
                                            >
                                                <View style={[styles.templateIcon, { backgroundColor: cat.bg }]}>
                                                    <MaterialIcons name={cat.icon} size={20} color="#FFF" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.templateTitle}>{item.title}</Text>
                                                    <Text style={styles.templateMeta}>
                                                        +{item.pointsReward} XP • {item.estimatedMinutes || '~'} phút
                                                    </Text>
                                                </View>
                                                <MaterialIcons name="add-circle-outline" size={20} color="rgba(93,64,55,0.3)" />
                                            </TouchableOpacity>
                                        );
                                    }}
                                    ListEmptyComponent={
                                        <Text style={styles.emptyText}>Không có nhiệm vụ nào trong thể loại này.</Text>
                                    }
                                />
                            </View>
                        )}

                        {/* Tab: Custom task */}
                        {pickerTab === 'custom' && (
                            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                                <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>Tên nhiệm vụ *</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        placeholder="VD: Học guitar 30 phút"
                                        placeholderTextColor="rgba(93,64,55,0.3)"
                                        value={customForm.title}
                                        onChangeText={v => setCustomForm({ ...customForm, title: v })}
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>Mô tả</Text>
                                    <TextInput
                                        style={[styles.formInput, { height: 72 }]}
                                        placeholder="Mô tả chi tiết..."
                                        placeholderTextColor="rgba(93,64,55,0.3)"
                                        value={customForm.description}
                                        onChangeText={v => setCustomForm({ ...customForm, description: v })}
                                        multiline
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>Thể loại</Text>
                                    <View style={styles.catGrid}>
                                        {CATEGORIES.map(([key, val]) => (
                                            <TouchableOpacity
                                                key={key}
                                                style={[styles.catChip, customForm.category === key && { backgroundColor: val.bg, borderColor: val.bg }]}
                                                onPress={() => setCustomForm({ ...customForm, category: key })}
                                            >
                                                <MaterialIcons name={val.icon} size={16} color={customForm.category === key ? '#FFF' : 'rgba(93,64,55,0.5)'} />
                                                <Text style={[styles.catChipText, customForm.category === key && { color: '#FFF' }]}>{val.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>Thời gian dự kiến</Text>
                                    <View style={styles.minuteRow}>
                                        {[10, 15, 30, 60, 120].map(m => (
                                            <TouchableOpacity
                                                key={m}
                                                style={[styles.minuteChip, customForm.estimatedMinutes === m && styles.minuteChipActive]}
                                                onPress={() => setCustomForm({ ...customForm, estimatedMinutes: m })}
                                            >
                                                <Text style={[styles.minuteText, customForm.estimatedMinutes === m && { color: '#FFF' }]}>
                                                    {m >= 60 ? `${m / 60}h` : `${m}p`}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.formGroup}>
                                    <Text style={styles.formLabel}>Giờ thực hiện</Text>
                                    <TouchableOpacity
                                        style={styles.formInput}
                                        onPress={() => setShowTimePicker(true)}
                                    >
                                        <Text style={{ color: COLORS.clayText, fontWeight: '600', fontSize: 16 }}>
                                            🕐 {String(pickedHour).padStart(2, '0')}:{String(pickedMinute).padStart(2, '0')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.customNote}>
                                    <MaterialIcons name="info-outline" size={16} color="#B45309" />
                                    <Text style={styles.customNoteText}>
                                        Nhiệm vụ tự tạo cần admin duyệt. XP sẽ được tính sau khi duyệt.
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={[styles.submitBtn, !customForm.title.trim() && { opacity: 0.5 }]}
                                    disabled={!customForm.title.trim()}
                                    onPress={handleAddCustom}
                                >
                                    <LinearGradient
                                        colors={[COLORS.clayAccent2, '#EC4899']}
                                        style={styles.submitBtnInner}
                                    >
                                        <Text style={styles.submitBtnText}>📨 Gửi duyệt</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* ====== TIME PICKER MODAL ====== */}
            {showTimePicker && (
                <Modal visible transparent animationType="fade">
                    <View style={styles.timePickerOverlay}>
                        <View style={styles.timePickerSheet}>
                            <Text style={styles.timePickerTitle}>
                                🕐 Chọn giờ{pendingTemplate ? ` cho "${pendingTemplate.title}"` : editingTaskIndex !== null ? ' cập nhật' : ''}
                            </Text>

                            {/* Hour picker */}
                            <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(93,64,55,0.5)', marginBottom: 8, alignSelf: 'flex-start' }}>Giờ</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                                {Array.from({ length: 24 }, (_, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.timeChip, pickedHour === i && styles.timeChipActive]}
                                        onPress={() => setPickedHour(i)}
                                    >
                                        <Text style={[styles.timeChipText, pickedHour === i && { color: '#FFF' }]}>
                                            {String(i).padStart(2, '0')}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Minute picker */}
                            <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(93,64,55,0.5)', marginBottom: 8, alignSelf: 'flex-start' }}>Phút</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                                    <TouchableOpacity
                                        key={m}
                                        style={[styles.timeChip, pickedMinute === m && styles.timeChipActive]}
                                        onPress={() => setPickedMinute(m)}
                                    >
                                        <Text style={[styles.timeChipText, pickedMinute === m && { color: '#FFF' }]}>
                                            {String(m).padStart(2, '0')}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Preview */}
                            <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.clayText, marginBottom: 16 }}>
                                {String(pickedHour).padStart(2, '0')}:{String(pickedMinute).padStart(2, '0')}
                            </Text>

                            <View style={styles.timePickerActions}>
                                <TouchableOpacity
                                    style={styles.timePickerCancel}
                                    onPress={() => { setShowTimePicker(false); setPendingTemplate(null); setEditingTaskIndex(null); }}
                                >
                                    <Text style={{ color: COLORS.clayText, fontWeight: '600' }}>Hủy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.timePickerConfirm}
                                    onPress={() => {
                                        if (pendingTemplate || editingTaskIndex !== null) {
                                            confirmAddTemplate();
                                        } else {
                                            setShowTimePicker(false);
                                        }
                                    }}
                                >
                                    <Text style={{ color: '#FFF', fontWeight: '700' }}>Xác nhận</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
            {/* ====== ACTION MODAL ====== */}
            <Modal visible={!!actionTask} transparent animationType="fade">
                <View style={styles.actionOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setActionTask(null)} />
                    <View style={styles.actionSheet}>
                        <View style={{ alignItems: 'center', marginBottom: 12 }}>
                            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(93,64,55,0.15)' }} />
                        </View>

                        <Text style={styles.actionTitle} numberOfLines={2}>
                            {actionTask?.task?.title}
                        </Text>

                        <View style={styles.actionBtnGroup}>
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => {
                                    if (actionTask) {
                                        handleEditTaskTime(actionTask.task);
                                        setActionTask(null);
                                    }
                                }}
                            >
                                <View style={[styles.actionIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                                    <MaterialIcons name="access-time" size={24} color="#3B82F6" />
                                </View>
                                <Text style={styles.actionBtnText}>Đổi giờ</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionBtn, actionTask?.task?.isMandatory && { opacity: 0.4 }]}
                                disabled={actionTask?.task?.isMandatory}
                                onPress={() => {
                                    if (actionTask && !actionTask.task.isMandatory) {
                                        // Silent remove then open picker
                                        const realIndex = plan?.tasks.findIndex(t => t._id === actionTask.task._id);
                                        if (realIndex !== undefined && realIndex !== -1 && plan) {
                                            apiService.removeTaskFromPlan(plan._id, realIndex).then(({ plan: updated }) => {
                                                setPlan(updated);
                                                setActionTask(null);
                                                setShowPicker(true);
                                                setPickerTab('system');
                                            }).catch(err => {
                                                Alert.alert('Lỗi', 'Không thể đổi nhiệm vụ');
                                            });
                                        }
                                    }
                                }}
                            >
                                <View style={[styles.actionIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                                    <MaterialIcons name="swap-horiz" size={24} color="#F59E0B" />
                                </View>
                                <Text style={styles.actionBtnText}>Đổi bài</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionBtn, actionTask?.task?.isMandatory && { opacity: 0.4 }]}
                                disabled={actionTask?.task?.isMandatory}
                                onPress={() => {
                                    if (actionTask && !actionTask.task.isMandatory) {
                                        handleRemoveTask(actionTask.index, actionTask.task);
                                        setActionTask(null);
                                    }
                                }}
                            >
                                <View style={[styles.actionIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                                    <MaterialIcons name="delete-outline" size={24} color="#EF4444" />
                                </View>
                                <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Xóa bỏ</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.warmBg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.warmBg },
    scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 120 },

    blob: { position: 'absolute', borderRadius: 999 },
    blobTop: { top: -height * 0.15, left: -width * 0.15, width: width * 0.7, height: width * 0.7, backgroundColor: 'rgba(251, 155, 143, 0.1)' },
    blobBottom: { bottom: -height * 0.1, right: -width * 0.1, width: width * 0.6, height: width * 0.6, backgroundColor: 'rgba(245, 119, 153, 0.1)' },

    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    titleText: { fontSize: 32, fontWeight: '900', color: COLORS.clayText, lineHeight: 36, letterSpacing: -1 },
    subtitleText: { fontSize: 14, fontWeight: 'bold', color: COLORS.clayText, opacity: 0.5, marginTop: 4 },
    dateBadge: { backgroundColor: 'rgba(255,255,255,0.4)', padding: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center' },
    dateNumberBox: { backgroundColor: COLORS.clayAccent2, width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    dateNumber: { fontSize: 20, fontWeight: '900', color: '#FFF' },
    dateMonth: { fontSize: FONT_SIZES.caption, fontWeight: 'bold', color: COLORS.clayAccent2, marginTop: 4 },

    // AI Bar
    aiBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glassWhite, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', gap: 12, marginBottom: 24, shadowColor: COLORS.clayAccent2, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 3 },
    aiIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    aiLabel: { fontSize: FONT_SIZES.caption, fontWeight: 'bold', color: COLORS.clayAccent2, marginBottom: 2, textTransform: 'uppercase' },
    aiMessage: { fontSize: 13, fontWeight: '600', color: COLORS.clayText, lineHeight: 18 },

    // Section
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.clayText },
    questCountBadge: { backgroundColor: 'rgba(255,255,255,0.4)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    questCountText: { fontSize: FONT_SIZES.caption, fontWeight: 'bold', color: 'rgba(93, 64, 55, 0.5)' },

    // Vertical Timeline
    timelineWrap: { position: 'relative', paddingLeft: 8 },
    timelineLine: { position: 'absolute', left: 56, top: 16, bottom: 80, width: 2, backgroundColor: 'rgba(93,64,55,0.1)', borderRadius: 1 },

    timelineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    timeColumn: { width: 44, marginRight: 4 },
    timeLabel: { fontSize: 13, fontWeight: '800', color: COLORS.clayText, opacity: 0.6, textAlign: 'right' },
    dotColumn: { width: 16, alignItems: 'center', marginRight: 8 },
    timelineDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },

    timelineCard: {
        flex: 1, padding: 14, borderRadius: 18,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
        shadowColor: '#A68A64', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 5,
    },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    cardIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#FFF' },
    cardMeta: { flexDirection: 'row', gap: 8, marginTop: 2 },
    cardXp: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
    cardDuration: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
    mandatoryBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    mandatoryText: { fontSize: 10, fontWeight: '700', color: '#FFF' },

    emptyState: { alignItems: 'center', paddingVertical: 32, gap: 12 },
    emptyText: { fontSize: 14, color: COLORS.clayText, opacity: 0.5, textAlign: 'center', lineHeight: 20 },

    addSlotBtn: { marginTop: 16, height: 54, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(93, 64, 55, 0.15)', borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.3)' },
    addSlotText: { fontSize: 14, fontWeight: 'bold', color: 'rgba(93, 64, 55, 0.5)' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: COLORS.warmBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: height * 0.75, paddingTop: 20, paddingHorizontal: 20, paddingBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, overflow: 'hidden' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.clayText },

    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    tab: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.4)', alignItems: 'center' },
    tabActive: { backgroundColor: COLORS.clayAccent2 },
    tabText: { fontSize: 14, fontWeight: '700', color: 'rgba(93,64,55,0.5)' },
    tabTextActive: { color: '#FFF' },

    // Filter row
    filterRow: { marginBottom: 12, maxHeight: 40 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.5)', marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
    filterChipActive: { backgroundColor: COLORS.clayAccent2, borderColor: COLORS.clayAccent2 },
    filterText: { fontSize: 12, fontWeight: '700', color: 'rgba(93,64,55,0.5)' },
    filterTextActive: { color: '#FFF' },

    // Template item
    templateItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(93,64,55,0.05)' },
    templateIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    templateTitle: { fontSize: 14, fontWeight: '700', color: COLORS.clayText },
    templateMeta: { fontSize: 12, fontWeight: '500', color: 'rgba(93,64,55,0.4)', marginTop: 2 },

    // Custom form
    formGroup: { marginBottom: 16 },
    formLabel: { fontSize: 13, fontWeight: '700', color: COLORS.clayText, opacity: 0.7, marginBottom: 8 },
    formInput: { backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', fontSize: 15, color: COLORS.clayText, fontWeight: '500' },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(93,64,55,0.15)', backgroundColor: 'rgba(255,255,255,0.4)' },
    catChipText: { fontSize: 12, fontWeight: '700', color: 'rgba(93,64,55,0.5)' },
    minuteRow: { flexDirection: 'row', gap: 8 },
    minuteChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
    minuteChipActive: { backgroundColor: COLORS.clayAccent2, borderColor: COLORS.clayAccent2 },
    minuteText: { fontSize: 13, fontWeight: '700', color: 'rgba(93,64,55,0.5)' },

    customNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFBEB', padding: 12, borderRadius: 12, marginBottom: 16 },
    customNoteText: { fontSize: 12, fontWeight: '500', color: '#B45309', flex: 1, lineHeight: 17 },

    submitBtn: { marginBottom: 30, borderRadius: 16 },
    submitBtnInner: { paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
    submitBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },

    // Time picker
    timePickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    timePickerSheet: { backgroundColor: COLORS.warmBg, borderRadius: 24, padding: 24, width: width * 0.85, alignItems: 'center' },
    timePickerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.clayText, marginBottom: 12, textAlign: 'center' },
    timePickerActions: { flexDirection: 'row', gap: 12, marginTop: 16, width: '100%' },
    timePickerCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.5)', alignItems: 'center' },
    timePickerConfirm: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.clayAccent2, alignItems: 'center' },

    // Time chips
    timeChip: { width: 42, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
    timeChipActive: { backgroundColor: COLORS.clayAccent2, borderColor: COLORS.clayAccent2 },
    timeChipText: { fontSize: 13, fontWeight: '700', color: 'rgba(93,64,55,0.5)' },

    mandatoryPulse: { borderWidth: 2, borderColor: COLORS.clayAccent2 },
    setTimeBtn: { backgroundColor: '#FFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 'auto' },
    setTimeText: { fontSize: 10, fontWeight: '800', color: COLORS.clayAccent2 },

    // Action Modal
    actionOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    actionSheet: {
        backgroundColor: COLORS.warmBg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingTop: 16, paddingHorizontal: 20, paddingBottom: 40,
        shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15,
    },
    actionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.clayText, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
    actionBtnGroup: { gap: 12 },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)',
        padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', gap: 12
    },
    actionIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    actionBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.clayText },
});
