import React, { useState, useEffect } from 'react';

// Define Settings interface to match the main process type
interface AppSettings {
  globalShortcut: string;
  defaultBrowser: string;
}

interface SettingsViewProps {
  onBack: () => void;
}

export default function SettingsView({ onBack }: SettingsViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>({
    globalShortcut: 'CommandOrControl+Option+Space',
    defaultBrowser: 'chrome'
  });
  const [shortcutInput, setShortcutInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Available browser options
  const browserOptions = [
    { value: 'system', label: 'System Default' },
    { value: 'chrome', label: 'Google Chrome' },
    { value: 'firefox', label: 'Firefox' },
    { value: 'safari', label: 'Safari' },
    { value: 'edge', label: 'Microsoft Edge' },
    { value: 'brave', label: 'Brave Browser' }
  ];

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const loadedSettings = await window.ipc.invoke('get-settings') as AppSettings;
        setSettings(loadedSettings);
        setShortcutInput(loadedSettings.globalShortcut);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load settings');
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Validate shortcut input before saving
      if (!shortcutInput.trim()) {
        setError('Global shortcut cannot be empty');
        setIsSaving(false);
        return;
      }
      
      // Update settings
      const updatedSettings = {
        ...settings,
        globalShortcut: shortcutInput
      };
      
      // Send to main process
      const result = await window.ipc.invoke('save-settings', updatedSettings) as { success: boolean; error?: string };
      
      if (result.success) {
        setSettings(updatedSettings);
        setSuccessMessage('Settings saved successfully');
        
        // Clear success message after a delay
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError(result.error || 'Failed to save settings');
      }
      
      setIsSaving(false);
    } catch (err) {
      setError('An unexpected error occurred');
      setIsSaving(false);
    }
  };

  // Handle browser selection
  const handleBrowserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings({
      ...settings,
      defaultBrowser: e.target.value
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-gray-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full [-webkit-app-region:no-drag]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Settings</h2>
        <button
          onClick={onBack}
          className="px-3 py-1 text-sm text-blue-400 hover:text-blue-300 focus:outline-none bg-white/10 rounded-md"
        >
          Back
        </button>
      </div>

      {/* Settings form */}
      <div className="flex-grow overflow-y-auto pr-2 space-y-6">
        {/* Global shortcut setting */}
        <div className="space-y-2">
          <h3 className="text-md font-medium text-gray-200">Global Shortcut</h3>
          <p className="text-sm text-gray-400">
            The keyboard combination to show the app
          </p>
          <input
            type="text"
            value={shortcutInput}
            onChange={(e) => setShortcutInput(e.target.value)}
            placeholder="CommandOrControl+Option+Space"
            className="w-full px-3 py-2 text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500">
            Examples: CommandOrControl+Option+Space, Control+Alt+C
          </p>
        </div>

        {/* Default browser setting */}
        <div className="space-y-2">
          <h3 className="text-md font-medium text-gray-200">Default Browser</h3>
          <p className="text-sm text-gray-400">
            The browser to use when opening links
          </p>
          <select
            value={settings.defaultBrowser}
            onChange={handleBrowserChange}
            className="w-full px-3 py-2 text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
          >
            {browserOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-4 flex justify-between border-t border-gray-700 mt-4">
        {/* Error or success message */}
        <div className="flex-grow">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {successMessage && <p className="text-green-400 text-sm">{successMessage}</p>}
        </div>
        
        {/* Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm bg-transparent hover:bg-white/5 text-gray-300 rounded-md focus:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
} 