import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';
import ClayTabBar from '../components/ClayTabBar';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import ShopScreen from '../screens/ShopScreen';
import NewTaskScreen from '../screens/NewTaskScreen';
import EventScreen from '../screens/EventScreen';
import BossEventScreen from '../screens/BossEventScreen';
// @ts-ignore - Temporary fix for TS Server caching issue
import GachaEventScreen from '../screens/GachaEventScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import CollectionScreen from '../screens/CollectionScreen';

// Stack Navigator types
export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

export type MainTabParamList = {
    Home: undefined;
    Shop: undefined;
    New: undefined;
    Event: undefined;
    Settings: undefined;
};

export type RootStackParamList = {
    MainTabs: undefined;
    BossEvent: undefined;
    GachaEvent: undefined;
    Collection: undefined;
    EditProfile: undefined;
    Notifications: undefined;
};

const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

// Auth Stack (Login/Register)
const AuthNavigator = () => (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
);

// Main App Tabs – ClayTabBar custom
const TabNavigator = () => (
    <MainTab.Navigator
        tabBar={(props) => <ClayTabBar {...props} />}
        screenOptions={{
            headerShown: false,
        }}
    >
        <MainTab.Screen name="Home" component={HomeScreen} options={{ title: 'Hôm nay' }} />
        <MainTab.Screen name="Shop" component={ShopScreen} options={{ title: 'Cửa hàng' }} />
        <MainTab.Screen name="New" component={NewTaskScreen} options={{ title: 'Thêm mới' }} />
        <MainTab.Screen name="Event" component={EventScreen} options={{ title: 'Sự kiện' }} />
        <MainTab.Screen name="Settings" component={ProfileScreen} options={{ title: 'Cài đặt' }} />
    </MainTab.Navigator>
);

import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../services/api';

// Global Notification for Unread Vouchers
const GlobalNotification = () => {
    const [unreadVoucher, setUnreadVoucher] = React.useState<any>(null);

    React.useEffect(() => {
        const checkUnread = async () => {
            try {
                const data = await apiService.getUnreadVouchers();
                if (data.vouchers && data.vouchers.length > 0) {
                    setUnreadVoucher(data.vouchers[0]);
                }
            } catch (e) {
                // ignore
            }
        };

        checkUnread();
        const interval = setInterval(checkUnread, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    const handleAcknowledge = async () => {
        if (!unreadVoucher) return;
        try {
            await apiService.markVoucherAsRead(unreadVoucher.code);
            setUnreadVoucher(null);
        } catch (e) {
            setUnreadVoucher(null); // dismiss anyway
        }
    };

    if (!unreadVoucher) return null;

    return (
        <Modal visible={true} animationType="slide" transparent>
            <View style={styles.notifOverlay}>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleAcknowledge} />
                <View style={styles.notifBox}>
                    <MaterialIcons name="local-shipping" size={48} color="#F57799" style={{ marginBottom: 16 }} />
                    <Text style={styles.notifTitle}>Đang chuẩn bị giao hàng</Text>
                    <Text style={styles.notifDesc}>
                        Quà tặng "{unreadVoucher.reward?.title || unreadVoucher.rewardTitleSnapshot}" đã được phê duyệt.
                        Chúng tôi đang chuẩn bị và sẽ gửi cho bạn thông qua Zalo hoặc Messenger trong thời gian sớm nhất!
                    </Text>
                    <TouchableOpacity style={styles.notifBtn} onPress={handleAcknowledge}>
                        <Text style={styles.notifBtnText}>Tuyệt vời!</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleAcknowledge} />
            </View>
        </Modal>
    );
};

// Root Stack (Tabs + modal screens)
const MainNavigator = () => (
    <>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
            <RootStack.Screen name="MainTabs" component={TabNavigator} />
            <RootStack.Screen name="BossEvent" component={BossEventScreen} />
            <RootStack.Screen name="GachaEvent" component={GachaEventScreen} />
            <RootStack.Screen name="Collection" component={CollectionScreen} />
            <RootStack.Screen
                name="EditProfile"
                component={EditProfileScreen}
                options={{ presentation: 'modal' }}
            />
            <RootStack.Screen name="Notifications" component={NotificationsScreen} />
        </RootStack.Navigator>
        <GlobalNotification />
    </>
);

// 🔧 Set to true to skip login and preview UI directly
const DEV_SKIP_AUTH = false;

// Root Navigator
export const AppNavigator = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading && !DEV_SKIP_AUTH) {
        return <SplashScreen />;
    }

    return (
        <NavigationContainer>
            {(isAuthenticated || DEV_SKIP_AUTH) ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    notifOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center',
    },
    notifBox: {
        backgroundColor: '#FFF', width: '85%', borderRadius: 24, padding: 24,
        alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3, shadowRadius: 20, elevation: 15,
    },
    notifTitle: {
        fontSize: 18, fontWeight: 'bold', color: '#5D4037',
        textAlign: 'center', marginBottom: 8,
    },
    notifDesc: {
        fontSize: 14, color: 'rgba(93,64,55,0.7)',
        textAlign: 'center', lineHeight: 20, marginBottom: 24,
    },
    notifBtn: {
        backgroundColor: '#F57799', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12,
    },
    notifBtnText: {
        color: '#FFF', fontWeight: 'bold', fontSize: 16,
    }
});
