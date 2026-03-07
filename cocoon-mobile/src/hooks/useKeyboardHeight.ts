import { useState, useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';

export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const showSub = Keyboard.addListener('keyboardWillShow', (e) => setHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener('keyboardWillHide', () => setHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  return height;
}
