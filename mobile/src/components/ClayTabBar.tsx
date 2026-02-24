import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { COLORS, FONT_SIZES } from '../theme';

const TAB_BG = 'rgba(255, 255, 255, 0.8)';

const ROUTE_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
    Home: 'home',
    Shop: 'storefront',
    New: 'add',
    Event: 'event-note',
    Settings: 'settings',
};

const FAB_ROUTE = 'New';

const ClayTabBar: React.FC<BottomTabBarProps> = ({
    state,
    descriptors,
    navigation,
}) => {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const fabIndex = state.routes.findIndex((r) => r.name === FAB_ROUTE);
    const leftRoutes = state.routes.filter((_, i) => i < fabIndex);
    const rightRoutes = state.routes.filter((_, i) => i > fabIndex);
    const fabRoute = state.routes[fabIndex];

    const renderTabItem = (
        route: (typeof state.routes)[number],
    ) => {
        const { options } = descriptors[route.key];
        const label = (options.title ?? route.name) as string;
        const realIndex = state.routes.indexOf(route);
        const isFocused = state.index === realIndex;
        const iconName = ROUTE_ICONS[route.name] ?? 'circle';

        const onPress = () => {
            const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
            }
        };

        return (
            <TouchableOpacity
                key={route.key}
                style={styles.tabItem}
                activeOpacity={0.7}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
            >
                <MaterialIcons
                    name={iconName}
                    size={28}
                    color={isFocused ? COLORS.clayAccent2 : 'rgba(93, 64, 55, 0.5)'}
                />
                <Text
                    style={[
                        styles.tabLabel,
                        {
                            color: isFocused
                                ? COLORS.clayAccent2
                                : 'rgba(93, 64, 55, 0.5)',
                        },
                    ]}
                >
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    const onFabPress = () => {
        const event = navigation.emit({
            type: 'tabPress',
            target: fabRoute.key,
            canPreventDefault: true,
        });
        if (state.index !== fabIndex && !event.defaultPrevented) {
            navigation.navigate(fabRoute.name);
        }
    };

    const isFabActive = state.index === fabIndex;

    return (
        <View style={[styles.container, { width }]}>
            <View style={[styles.tabBar, { height: 70 + insets.bottom, paddingBottom: insets.bottom }]}>
                {leftRoutes.map((route) => renderTabItem(route))}
                <View style={{ width: 70 }} />
                {rightRoutes.map((route) => renderTabItem(route))}
            </View>

            <View style={[styles.fabContainer, { bottom: 30 + insets.bottom }]}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                        styles.fabShadowWrapper,
                        isFabActive && styles.fabShadowWrapperActive,
                    ]}
                    onPress={onFabPress}
                >
                    <LinearGradient
                        colors={
                            isFabActive
                                ? [COLORS.pinkDark, COLORS.clayAccent2]
                                : [COLORS.clayAccent2, COLORS.pinkDark]
                        }
                        style={styles.fabGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <MaterialIcons name="add" size={32} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },

    tabBar: {
        width: '100%',
        height: 80,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: TAB_BG,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.4)',
        shadowColor: '#A68A64',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },

    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        width: 60,
    },
    tabLabel: {
        fontSize: FONT_SIZES.caption,
        fontWeight: '600',
        marginTop: 2,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 35,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabShadowWrapper: {
        borderRadius: 50,
        borderWidth: 6,
        borderColor: COLORS.warmBg,
        shadowColor: COLORS.clayAccent2,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    fabShadowWrapperActive: {
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 12,
    },
    fabGradient: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default ClayTabBar;
