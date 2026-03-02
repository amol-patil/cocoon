import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

let clearTimer: ReturnType<typeof setTimeout> | null = null;

export async function copyToClipboard(
  text: string,
  autoClearSeconds = 30
): Promise<void> {
  await Clipboard.setStringAsync(text);
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

  // Cancel any previous auto-clear timer
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }

  // Schedule auto-clear
  if (autoClearSeconds > 0) {
    clearTimer = setTimeout(async () => {
      await Clipboard.setStringAsync('');
      clearTimer = null;
    }, autoClearSeconds * 1000);
  }
}

export function cancelAutoClear(): void {
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }
}
