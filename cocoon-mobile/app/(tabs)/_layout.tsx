import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  useDerivedValue,
} from 'react-native-reanimated';
import { colors, typography, radii } from '../../src/theme/colors';

const TAB_CONFIG = [
  { name: 'index', label: 'SEARCH', icon: 'search' as const },
  { name: 'documents', label: 'DOCS', icon: 'folder' as const },
  { name: 'settings', label: 'SETTINGS', icon: 'settings' as const },
];

// Uniform inset between the pill border and the bubble on all 4 sides
const INSET = 4;
const TAB_COUNT = TAB_CONFIG.length;

// Spring config: crisp snap with a tiny overshoot — feels alive, not bouncy
const SPRING = { damping: 20, stiffness: 260, mass: 0.75 };

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const pillWidth = screenWidth - 21 * 2;
  // Inner track = pill minus border (2px) minus margin on each side (INSET*2)
  const innerWidth = pillWidth - 2 - INSET * 2;
  const tabWidth = innerWidth / TAB_COUNT;

  // Animated position (0, 1, 2) — drives the bubble
  const position = useSharedValue(state.index);
  // targetIndex as a shared value so the worklet can read it reactively
  const targetIndex = useSharedValue(state.index);
  const prevIndex = useRef(state.index);

  useEffect(() => {
    if (state.index !== prevIndex.current) {
      prevIndex.current = state.index;
      targetIndex.value = state.index;
      position.value = withSpring(state.index, SPRING);
    }
  }, [state.index]);

  // How far the bubble is currently from its resting spot (0 = settled, 1 = mid-travel)
  const travel = useDerivedValue(() => {
    'worklet';
    const delta = Math.abs(position.value - targetIndex.value);
    // Ramp up to 1 at 0.5 travel, back to 0 at 1.0
    return delta < 0.5 ? delta * 2 : (1 - delta) * 2;
  });

  // Animated bubble style: slides + stretches horizontally during travel
  const bubbleStyle = useAnimatedStyle(() => {
    'worklet';
    // Inner container already provides the inset — x=0 is flush with the left tab edge
    const bubbleWidth = tabWidth;
    const x = position.value * tabWidth;
    // Stretch up to 1.45× mid-flight; compensate translateX so it stays centered
    const scaleX = interpolate(travel.value, [0, 1], [1, 1.45]);
    const stretchOffset = ((scaleX - 1) * bubbleWidth) / 2;
    return {
      transform: [
        { translateX: x - stretchOffset },
        { scaleX },
      ],
    };
  });

  // BUBBLE_H is the height of the bubble — pill inner height minus top+bottom inset
  const PILL_INNER_H = 62 - 2; // subtract borderWidth*2
  const bubbleH = PILL_INNER_H - INSET * 2;

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* Glass pill — BlurView is the base layer */}
      <BlurView intensity={80} tint="dark" style={styles.pillBlur}>
        {/*
          Inner container with explicit margin — gives us a clean coordinate
          space where top:0 / left:0 is exactly INSET pixels from the pill edge.
        */}
        <View style={[styles.pillInner, { margin: INSET }]}>
          {/* Animated gold bubble */}
          <Animated.View style={[styles.bubble, { width: tabWidth, height: bubbleH }, bubbleStyle]} />

          {/* Tabs — only render routes that match TAB_CONFIG */}
          {state.routes.map((route: any, index: number) => {
            const tab = TAB_CONFIG.find((t) => t.name === route.name);
            if (!tab) return null;
            const isActive = state.index === index;

            return (
              <TouchableOpacity
                key={route.key}
                style={styles.tab}
                onPress={() => navigation.navigate(route.name)}
                activeOpacity={0.75}
              >
                <Feather
                  name={tab.icon}
                  size={18}
                  color={isActive ? colors.bgPrimary : colors.textSecondary}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false, href: null }}
    >
      <Tabs.Screen name="index" options={{ href: '/(tabs)' }} />
      <Tabs.Screen name="documents" options={{ href: '/(tabs)/documents' }} />
      <Tabs.Screen name="settings" options={{ href: '/(tabs)/settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 21,
    paddingTop: 12,
  },
  pillBlur: {
    flexDirection: 'row',
    borderRadius: 34,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    height: 62,
    overflow: 'hidden',
    backgroundColor: 'rgba(10,10,12,0.85)',
  },
  pillInner: {
    flex: 1,
    flexDirection: 'row',
  },
  bubble: {
    position: 'absolute',
    top: 0,
    borderRadius: radii.pill,
    backgroundColor: `${colors.accentPrimary}E6`,
    borderWidth: 1,
    borderColor: `${colors.accentPrimary}88`,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    zIndex: 1,
  },
  tabLabel: {
    ...typography.tabLabel,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.bgPrimary,
  },
});
