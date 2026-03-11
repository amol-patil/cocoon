/**
 * ShareCardView — The styled image card rendered as a React Native view.
 * Captured via react-native-view-shot and shared as an image.
 * Matches the Pencil design: dark gradient, gold accents, category badge, fields.
 */
import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { colors } from '../theme/colors';
import { resolveTagColor } from '../shared/colors';
import { TagItem } from '../shared/types';

export interface ShareCardField {
  label: string;
  value: string;
}

interface ShareCardViewProps {
  documentTitle: string;
  category: string;
  fields: ShareCardField[];
  categories: TagItem[];
}

export const ShareCardView = forwardRef<ViewShot, ShareCardViewProps>(
  ({ documentTitle, category, fields, categories }, ref) => {
    const catColor = resolveTagColor(category, categories);
    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <ViewShot ref={ref} options={{ format: 'png', quality: 1 }}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.badge, { backgroundColor: catColor + '33' }]}>
              <View style={[styles.badgeDot, { backgroundColor: catColor }]} />
              <Text style={[styles.badgeText, { color: catColor }]}>{category}</Text>
            </View>
            <View style={styles.logo}>
              <Image
                source={require('../../assets/cocoon-mini-icon.png')}
                style={styles.logoIcon}
              />
              <Text style={styles.logoText}>cocoon</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{documentTitle}</Text>

          {/* Gold divider */}
          <View style={styles.goldDivider} />

          {/* Fields */}
          <View style={styles.fields}>
            {fields.map((field, idx) => (
              <View key={idx} style={styles.field}>
                <Text style={styles.fieldLabel}>{field.label.toUpperCase()}</Text>
                <Text style={styles.fieldValue}>{field.value}</Text>
              </View>
            ))}
          </View>

          {/* Bottom divider */}
          <View style={styles.bottomDivider} />

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerDate}>Shared {dateStr}</Text>
          </View>
        </View>
      </ViewShot>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    width: 350,
    backgroundColor: '#1E1E22',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    padding: 28,
    paddingTop: 32,
    paddingBottom: 24,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.6,
  },
  logoIcon: {
    width: 18,
    height: 18,
  },
  logoText: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: colors.accentPrimary,
  },
  title: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 28,
    lineHeight: 28,
    color: colors.textPrimary,
  },
  goldDivider: {
    height: 1,
    backgroundColor: colors.accentPrimary,
    opacity: 0.5,
  },
  fields: {
    gap: 20,
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  fieldValue: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  bottomDivider: {
    height: 1,
    backgroundColor: '#3A3A3C',
    opacity: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerDate: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textTertiary,
  },
});
