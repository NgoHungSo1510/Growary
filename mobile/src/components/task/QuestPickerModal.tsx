import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    FlatList,
    TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { TaskTemplate } from '../../types';
import { COLORS } from '../../theme';

export const CATEGORY_MAP: Record<string, { bg: string; icon: keyof typeof MaterialIcons.glyphMap; label: string }> = {
    health: { bg: '#FDC3A1', icon: 'fitness-center', label: 'Sức khỏe' },
    study: { bg: '#FB9B8F', icon: 'school', label: 'Học tập' },
    work: { bg: '#F57799', icon: 'work', label: 'Công việc' },
    personal: { bg: '#FDC3A1', icon: 'person', label: 'Cá nhân' },
    household: { bg: '#FB9B8F', icon: 'home', label: 'Gia đình' },
    other: { bg: '#FDC3A1', icon: 'star', label: 'Khác' },
};

export const CATEGORIES = Object.entries(CATEGORY_MAP);

export interface CustomTaskFormData {
    title: string;
    description: string;
    category: string;
    estimatedMinutes: number;
}

interface QuestPickerModalProps {
    visible: boolean;
    pickerTab: 'system' | 'custom';
    filterCat: string | null;
    filteredTemplates: TaskTemplate[];
    customForm: CustomTaskFormData;
    pickedHour: number;
    pickedMinute: number;
    onChangeTab: (tab: 'system' | 'custom') => void;
    onChangeFilterCat: (cat: string | null) => void;
    onSelectTemplate: (template: TaskTemplate) => void;
    onChangeCustomForm: (form: CustomTaskFormData) => void;
    onOpenTimePicker: () => void;
    onSubmitCustom: () => void;
    onClose: () => void;
}

export const QuestPickerModal: React.FC<QuestPickerModalProps> = ({
    visible,
    pickerTab,
    filterCat,
    filteredTemplates,
    customForm,
    pickedHour,
    pickedMinute,
    onChangeTab,
    onChangeFilterCat,
    onSelectTemplate,
    onChangeCustomForm,
    onOpenTimePicker,
    onSubmitCustom,
    onClose,
}) => {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
                <View style={styles.modalSheet}>
                    <View style={styles.handleWrap}>
                        <View style={styles.handle} />
                    </View>

                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Thêm Quest</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialIcons name="close" size={24} color={COLORS.clayText} />
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabRow}>
                        <TouchableOpacity
                            style={[styles.tab, pickerTab === 'system' && styles.tabActive]}
                            onPress={() => onChangeTab('system')}
                        >
                            <Text style={[styles.tabText, pickerTab === 'system' && styles.tabTextActive]}>
                                📋 Có sẵn
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, pickerTab === 'custom' && styles.tabActive]}
                            onPress={() => onChangeTab('custom')}
                        >
                            <Text style={[styles.tabText, pickerTab === 'custom' && styles.tabTextActive]}>
                                ✏️ Tự tạo
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Tab 1: System templates */}
                    {pickerTab === 'system' && (
                        <View style={{ flex: 1 }}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                                <TouchableOpacity
                                    style={[styles.filterChip, !filterCat && styles.filterChipActive]}
                                    onPress={() => onChangeFilterCat(null)}
                                >
                                    <Text style={[styles.filterText, !filterCat && styles.filterTextActive]}>Tất cả</Text>
                                </TouchableOpacity>
                                {CATEGORIES.map(([key, val]) => (
                                    <TouchableOpacity
                                        key={key}
                                        style={[styles.filterChip, filterCat === key && styles.filterChipActive]}
                                        onPress={() => onChangeFilterCat(key)}
                                    >
                                        <Text style={[styles.filterText, filterCat === key && styles.filterTextActive]}>
                                            {val.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <FlatList
                                data={filteredTemplates}
                                keyExtractor={(item) => item._id}
                                contentContainerStyle={{ paddingBottom: 20 }}
                                renderItem={({ item }) => {
                                    const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP.other;
                                    return (
                                        <TouchableOpacity
                                            style={styles.templateItem}
                                            onPress={() => onSelectTemplate(item)}
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

                    {/* Tab 2: Custom task */}
                    {pickerTab === 'custom' && (
                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 40 }}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Tên nhiệm vụ *</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="VD: Học guitar 30 phút"
                                    placeholderTextColor="rgba(93,64,55,0.3)"
                                    value={customForm.title}
                                    onChangeText={(v) => onChangeCustomForm({ ...customForm, title: v })}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Mô tả</Text>
                                <TextInput
                                    style={[styles.formInput, { height: 72 }]}
                                    placeholder="Mô tả chi tiết..."
                                    placeholderTextColor="rgba(93,64,55,0.3)"
                                    value={customForm.description}
                                    onChangeText={(v) => onChangeCustomForm({ ...customForm, description: v })}
                                    multiline
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Thể loại</Text>
                                <View style={styles.catGrid}>
                                    {CATEGORIES.map(([key, val]) => (
                                        <TouchableOpacity
                                            key={key}
                                            style={[
                                                styles.catChip,
                                                customForm.category === key && { backgroundColor: val.bg, borderColor: val.bg },
                                            ]}
                                            onPress={() => onChangeCustomForm({ ...customForm, category: key })}
                                        >
                                            <MaterialIcons
                                                name={val.icon}
                                                size={16}
                                                color={customForm.category === key ? '#FFF' : 'rgba(93,64,55,0.5)'}
                                            />
                                            <Text
                                                style={[
                                                    styles.catChipText,
                                                    customForm.category === key && { color: '#FFF' },
                                                ]}
                                            >
                                                {val.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Thời gian dự kiến</Text>
                                <View style={styles.minuteRow}>
                                    {[10, 15, 30, 60, 120].map((m) => (
                                        <TouchableOpacity
                                            key={m}
                                            style={[
                                                styles.minuteChip,
                                                customForm.estimatedMinutes === m && styles.minuteChipActive,
                                            ]}
                                            onPress={() => onChangeCustomForm({ ...customForm, estimatedMinutes: m })}
                                        >
                                            <Text
                                                style={[
                                                    styles.minuteText,
                                                    customForm.estimatedMinutes === m && { color: '#FFF' },
                                                ]}
                                            >
                                                {m >= 60 ? `${m / 60}h` : `${m}p`}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Giờ thực hiện</Text>
                                <TouchableOpacity style={styles.formInput} onPress={onOpenTimePicker}>
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
                                onPress={onSubmitCustom}
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
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: COLORS.warmBg,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 12,
        paddingHorizontal: 20,
        height: '80%',
    },
    handleWrap: {
        alignItems: 'center',
        marginBottom: 8,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(93,64,55,0.15)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    tabRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(93,64,55,0.06)',
        borderRadius: 14,
        padding: 4,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    tabActive: {
        backgroundColor: '#FFF',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(93,64,55,0.5)',
    },
    tabTextActive: {
        color: COLORS.clayText,
        fontWeight: 'bold',
    },
    filterRow: {
        flexGrow: 0,
        marginBottom: 12,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(93,64,55,0.06)',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: COLORS.clayAccent1,
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(93,64,55,0.6)',
    },
    filterTextActive: {
        color: '#FFF',
    },
    templateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: COLORS.clayCard,
        borderRadius: 16,
        marginBottom: 8,
    },
    templateIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    templateTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    templateMeta: {
        fontSize: 12,
        color: 'rgba(93,64,55,0.5)',
        marginTop: 2,
    },
    emptyText: {
        textAlign: 'center',
        color: 'rgba(93,64,55,0.4)',
        marginTop: 32,
    },
    formGroup: {
        marginBottom: 16,
    },
    formLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.clayText,
        marginBottom: 6,
    },
    formInput: {
        backgroundColor: COLORS.clayCard,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        color: COLORS.clayText,
    },
    catGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    catChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: COLORS.clayCard,
        borderWidth: 1,
        borderColor: 'rgba(93,64,55,0.1)',
    },
    catChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.clayText,
    },
    minuteRow: {
        flexDirection: 'row',
        gap: 8,
    },
    minuteChip: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: COLORS.clayCard,
    },
    minuteChipActive: {
        backgroundColor: COLORS.clayAccent1,
    },
    minuteText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.clayText,
    },
    customNote: {
        flexDirection: 'row',
        gap: 8,
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 14,
        marginBottom: 16,
    },
    customNoteText: {
        flex: 1,
        fontSize: 12,
        color: '#B45309',
        lineHeight: 16,
    },
    submitBtn: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    submitBtnInner: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    submitBtnText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#FFF',
    },
});
