import { Alert } from 'react-native';

/**
 * Trích xuất thông điệp lỗi thân thiện với người dùng từ AxiosError hoặc Error thông thường
 */
export function getErrorMessage(error: unknown, fallbackMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.'): string {
    if (!error) return fallbackMessage;

    if (typeof error === 'string') return error;

    const anyErr = error as any;
    if (anyErr.response?.data?.error) {
        return anyErr.response.data.error;
    }
    if (anyErr.response?.data?.message) {
        return anyErr.response.data.message;
    }
    if (anyErr.message) {
        if (anyErr.message === 'Network Error') {
            return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.';
        }
        return anyErr.message;
    }

    return fallbackMessage;
}

/**
 * Hiển thị popup Alert cảnh báo lỗi đồng bộ trên toàn ứng dụng Mobile
 */
export function showApiError(error: unknown, title = 'Thông báo lỗi'): void {
    const message = getErrorMessage(error);
    Alert.alert(title, message, [{ text: 'Đóng', style: 'cancel' }]);
}
