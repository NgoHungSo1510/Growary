/**
 * Shared design tokens for Growary claymorphism theme.
 * Single source of truth — import from here, never redeclare.
 */

export const COLORS = {
    warmBg: '#FFF7CD',
    clayCard: '#FDC3A1',
    clayAccent1: '#FB9B8F',
    clayAccent2: '#F57799',
    clayText: '#5D4037',
    clayInset: '#F8E8B4',
    clayInsetCard: '#EBB090',
    pinkDark: '#E91E63',
    whiteOp: 'rgba(255, 255, 255, 0.4)',
    glassWhite: 'rgba(255, 255, 255, 0.5)',
    gold: '#FFD54F',
    goldDark: '#713F12',
    yellowBadge: '#FACC15',
    yellowGradientStart: '#FFD54F',
    yellowGradientEnd: '#FFA726',
    inputBg: '#F3EAC0',
    inputBorder: 'rgba(253, 195, 161, 0.5)',
    tileBg: '#FFFDF5',
    tileShadow: 'rgba(210, 150, 100, 0.25)',
} as const;

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
} as const;

export const FONT_SIZES = {
    caption: 11,
    body: 14,
    subtitle: 16,
    title: 20,
    heading: 28,
    hero: 32,
} as const;

export const SHADOWS = {
    clay: {
        shadowColor: '#A68A64',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    clayLight: {
        shadowColor: '#A68A64',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    pink: {
        shadowColor: '#F57799',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
} as const;
