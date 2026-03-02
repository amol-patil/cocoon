import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, typography, radii } from '../../src/theme/colors';

const TAB_CONFIG = [
  { name: 'index', label: 'SEARCH', icon: 'search' as const },
  { name: 'documents', label: 'DOCS', icon: 'folder' as const },
  { name: 'settings', label: 'SETTINGS', icon: 'settings' as const },
];

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.pill}>
        {state.routes.map((route: any, index: number) => {
          const isActive = state.index === index;
          const tab = TAB_CONFIG[index];

          return (
            <TouchableOpacity
              key={route.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => navigation.navigate(route.name)}
              activeOpacity={0.8}
            >
              <Feather
                name={tab?.icon}
                size={18}
                color={isActive ? colors.bgPrimary : colors.textSecondary}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab?.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="documents" />
      <Tabs.Screen name="settings" />
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
  pill: {
    flexDirection: 'row',
    backgroundColor: colors.bgSurface,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    height: 62,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    gap: 4,
  },
  tabActive: {
    backgroundColor: colors.accentPrimary,
  },
  tabLabel: {
    ...typography.tabLabel,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.bgPrimary,
  },
});
