import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, DEFAULT_SETTINGS, TagItem } from '../shared/types';

const SETTINGS_KEY = 'cocoon_settings_v1';

const TAG_COLORS = ['#4A7FA5', '#C9A962', '#4AA56A', '#7A5AF8', '#E8833A', '#D94A4A', '#6E6E70'];

/** Migrate old string[] to TagItem[] if needed (backwards compat). */
function migrateTagArray(raw: unknown, idx = 0): TagItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) =>
    typeof item === 'string'
      ? { name: item, color: TAG_COLORS[(idx + i) % TAG_COLORS.length] }
      : item as TagItem
  );
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      categories: migrateTagArray(parsed.categories),
      owners: migrateTagArray(parsed.owners, 2),
    } as AppSettings;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<AppSettings> {
  const current = await loadSettings();
  const updated = { ...current, [key]: value };
  await saveSettings(updated);
  return updated;
}
