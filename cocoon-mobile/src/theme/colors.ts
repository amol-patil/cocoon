// Design tokens — sourced directly from cocoon-designs.pen variables
export const colors = {
  // Backgrounds
  bgPrimary: '#1A1A1C',
  bgSurface: '#242426',
  bgElevated: '#2A2A2C',

  // Accent
  accentPrimary: '#C9A962',
  accentSecondary: '#6E9E6E',

  // Text
  textPrimary: '#F5F5F0',
  textSecondary: '#6E6E70',
  textTertiary: '#4A4A4C',

  // Borders
  borderPrimary: '#3A3A3C',
  borderDivider: '#2A2A2C',
  borderAccent: '#C9A962',

  // Category colors
  catPassport: '#4A90D9',
  catLicense: '#D4A847',
  catInsurance: '#6E9E6E',
  catMedical: '#D94A4A',
  catFinancial: '#9B6ED9',
  catOther: '#6E6E70',

  // Semantic
  error: '#D94A4A',
  success: '#6E9E6E',

  // Transparent overlays
  accentAlpha10: '#C9A96219',
  accentAlpha14: '#C9A96222',
  accentAlpha20: '#C9A96233',
  errorAlpha10: '#D94A4A19',
} as const;

// Typography scale — serif for display, system sans for body
export const typography = {
  // Cormorant Garamond — display/serif text
  displayLarge: { fontFamily: 'CormorantGaramond-Regular', fontSize: 42, lineHeight: 42 },
  displayMedium: { fontFamily: 'CormorantGaramond-Regular', fontSize: 36, lineHeight: 36 },
  displaySmall: { fontFamily: 'CormorantGaramond-Regular', fontSize: 28, lineHeight: 28 },
  // Card titles, field values, setting labels — now system sans (Inter/SF Pro)
  serifMedium20: { fontSize: 16, fontWeight: '500' as const },
  serifSemiBold20: { fontSize: 16, fontWeight: '600' as const },
  serifMedium18: { fontSize: 16, fontWeight: '400' as const },
  serifSemiBold28: { fontSize: 28, fontWeight: '600' as const },
  // Inter — body/UI text (system font on iOS = SF Pro, very close to Inter)
  headingLarge: { fontSize: 20, fontWeight: '600' as const },
  headingMedium: { fontSize: 17, fontWeight: '600' as const },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const },
  bodySmall: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 11, fontWeight: '500' as const },
  captionSmall: { fontSize: 10, fontWeight: '500' as const },
  tabLabel: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.5 },
} as const;

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  huge: 32,
} as const;

// Border radii
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 26,
  circle: 9999,
} as const;
