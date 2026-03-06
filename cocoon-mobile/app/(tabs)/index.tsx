import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useDocuments } from '../../src/hooks/useDocuments';
import { useSearch } from '../../src/hooks/useSearch';
import { SearchBar } from '../../src/components/SearchBar';
import { DocumentCard } from '../../src/components/DocumentCard';
import { EmptyState } from '../../src/components/EmptyState';
import { resolveTagColor } from '../../src/shared/colors';
import { useSettings } from '../../src/hooks/useSettings';
import { colors, typography } from '../../src/theme/colors';

export default function SearchTab() {
  const { documents, isLoading } = useDocuments();
  const { settings } = useSettings();
  const { query, setQuery, categoryTab, setCategoryTab, results, categories } = useSearch(documents);

  const allTabs = ['All', ...categories];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcome}>Welcome back</Text>
            <Text style={styles.appName}>Cocoon</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
            <Feather name="bell" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <SearchBar value={query} onChangeText={setQuery} autoFocus={false} />

        {/* Category chips */}
        {allTabs.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {allTabs.map((tab) => {
              const isActive = tab === categoryTab;
              const color = tab === 'All' ? colors.accentPrimary : resolveTagColor(tab, settings.categories);
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.chip,
                    isActive
                      ? { backgroundColor: color, borderColor: color }
                      : { borderColor: colors.borderPrimary },
                  ]}
                  onPress={() => setCategoryTab(tab)}
                  activeOpacity={0.7}
                >
                  {tab !== 'All' && (
                    <View style={[styles.chipDot, { backgroundColor: isActive ? colors.bgPrimary : color }]} />
                  )}
                  <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>{tab}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Results */}
      {isLoading ? null : results.length === 0 ? (
        <EmptyState
          title={query ? 'No results' : 'No documents yet'}
          subtitle={query ? `No documents matching "${query}"` : 'Add your first document in the Docs tab'}
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(r) => r.item.id}
          renderItem={({ item: result }) => (
            <DocumentCard
              doc={result.item}
              matches={result.matches}
              onPress={() => router.push(`/document/${result.item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listLabel}>
                {query ? `${results.length} result${results.length !== 1 ? 's' : ''}` : 'Recent Documents'}
              </Text>
              <Text style={styles.listCount}>{results.length} items</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    paddingHorizontal: 28,
    paddingTop: 0,
    gap: 32,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  welcome: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  appName: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 42,
    lineHeight: 42,
    color: colors.textPrimary,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  chipScroll: { marginHorizontal: -28, paddingHorizontal: 28 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  chipLabelActive: {
    color: colors.bgPrimary,
  },
  list: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 120,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  listLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  listCount: {
    fontSize: 14,
    color: colors.textTertiary,
  },
});
