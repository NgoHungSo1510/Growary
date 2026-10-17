import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface SubmitPhotoModalProps {
    visible: boolean;
    slotIndex: number;
    title: string;
    description: string;
    imageUrl: string;
    uploadingImage: boolean;
    submitting: boolean;
    onChangeTitle: (title: string) => void;
    onChangeDescription: (desc: string) => void;
    onPickImage: () => void;
    onSubmit: () => void;
    onClose: () => void;
}

export const SubmitPhotoModal: React.FC<SubmitPhotoModalProps> = ({
    visible,
    slotIndex,
    title,
    description,
    imageUrl,
    uploadingImage,
    submitting,
    onChangeTitle,
    onChangeDescription,
    onPickImage,
    onSubmit,
    onClose,
}) => {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>📸 Gửi Ảnh Vào Ô #{slotIndex + 1}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialIcons name="close" size={24} color="#332f13" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.inputLabel}>Tên ảnh *</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={onChangeTitle}
                        placeholder="VD: Nhành dương xỉ..."
                        placeholderTextColor="rgba(93,64,55,0.4)"
                    />

                    <Text style={styles.inputLabel}>Ghi chú thêm</Text>
                    <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        value={description}
                        onChangeText={onChangeDescription}
                        placeholder="Chia sẻ một chút thông tin..."
                        placeholderTextColor="rgba(93,64,55,0.4)"
                        multiline
                    />

                    <Text style={styles.inputLabel}>Ảnh tải lên *</Text>
                    <TouchableOpacity style={styles.imagePickerBtn} onPress={onPickImage} disabled={uploadingImage}>
                        {uploadingImage ? (
                            <View style={styles.imagePickerPlaceholder}>
                                <ActivityIndicator size="small" color="#9f3456" />
                                <Text style={{ color: '#9f3456', fontSize: 13, marginTop: 4, fontWeight: 'bold' }}>
                                    Đang tải ảnh...
                                </Text>
                            </View>
                        ) : imageUrl ? (
                            <Image source={{ uri: imageUrl }} style={styles.previewImage} />
                        ) : (
                            <View style={styles.imagePickerPlaceholder}>
                                <MaterialIcons name="add-a-photo" size={32} color="rgba(93,64,55,0.3)" />
                                <Text style={{ color: 'rgba(93,64,55,0.5)', fontSize: 13, marginTop: 4 }}>
                                    📷 Chụp ảnh / 🖼️ Chọn từ thư viện
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                        onPress={onSubmit}
                        disabled={submitting}
                    >
                        <LinearGradient colors={['#9f3456', '#fd7d9f']} style={styles.submitGradient}>
                            {submitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.submitText}>Xác nhận gửi</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

interface ImageSourcePickerModalProps {
    visible: boolean;
    onSelectSource: (source: 'camera' | 'library') => void;
    onClose: () => void;
}

export const ImageSourcePickerModal: React.FC<ImageSourcePickerModalProps> = ({
    visible,
    onSelectSource,
    onClose,
}) => {
    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.pickerOverlay}>
                <View style={styles.pickerBox}>
                    <Text style={styles.pickerTitle}>Chọn phương thức tải ảnh</Text>
                    <TouchableOpacity style={styles.pickerOption} onPress={() => onSelectSource('camera')}>
                        <MaterialIcons name="photo-camera" size={24} color="#9f3456" />
                        <Text style={styles.pickerOptionText}>📷 Chụp ảnh bằng Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.pickerOption} onPress={() => onSelectSource('library')}>
                        <MaterialIcons name="photo-library" size={24} color="#9f3456" />
                        <Text style={styles.pickerOptionText}>🖼️ Chọn ảnh từ Thư viện</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.pickerCancel} onPress={onClose}>
                        <Text style={styles.pickerCancelText}>Hủy</Text>
                    </TouchableOpacity>
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
    modalBox: {
        backgroundColor: '#fff7cf',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#332f13',
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#615c3c',
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#faf2c4',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        color: '#332f13',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2dabc',
    },
    imagePickerBtn: {
        height: 140,
        backgroundColor: '#faf2c4',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#e2dabc',
        borderStyle: 'dashed',
        overflow: 'hidden',
        marginBottom: 24,
    },
    imagePickerPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    submitBtn: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
    },
    submitGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    submitText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    pickerBox: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: '#fff7cf',
        borderRadius: 24,
        padding: 24,
    },
    pickerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#332f13',
        textAlign: 'center',
        marginBottom: 20,
    },
    pickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 14,
        backgroundColor: '#faf2c4',
        marginBottom: 10,
    },
    pickerOptionText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#332f13',
    },
    pickerCancel: {
        alignItems: 'center',
        paddingVertical: 12,
        marginTop: 6,
    },
    pickerCancelText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'rgba(93,64,55,0.6)',
    },
});
