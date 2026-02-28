import React, { useState, useEffect } from "react";

// Define Settings interface to match the main process type
interface AppSettings {
  globalShortcut: string;
  defaultBrowser: string;
  owners: string[];
  categories: string[];
  biometricEnabled: boolean;
  clipboardAutoClearSeconds: number;
  theme?: string;
  launchAtStartup?: boolean;
  showInDock?: boolean;
}

interface SettingsViewProps {
  onBack: () => void;
}

export default function SettingsView({ onBack }: SettingsViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>({
    globalShortcut: "CommandOrControl+Option+Space",
    defaultBrowser: "chrome",
    owners: [],
    categories: [],
    biometricEnabled: true,
    clipboardAutoClearSeconds: 30,
  });
  const [shortcutInput, setShortcutInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newOwner, setNewOwner] = useState("");
  const [newCategory, setNewCategory] = useState("");

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordAction, setPasswordAction] = useState<"export" | "import">("export");
  const [importFilePath, setImportFilePath] = useState<string | null>(null);

  // Available browser options
  const browserOptions = [
    { value: "system", label: "System Default" },
    { value: "chrome", label: "Google Chrome" },
    { value: "firefox", label: "Firefox" },
    { value: "safari", label: "Safari" },
    { value: "edge", label: "Microsoft Edge" },
    { value: "brave", label: "Brave Browser" },
  ];

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const loadedSettings = (await window.ipc.invoke(
          "get-settings",
        )) as AppSettings;
        setSettings(loadedSettings);
        setShortcutInput(loadedSettings.globalShortcut);
        setIsLoading(false);
      } catch (err) {
        setError("Failed to load settings");
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
        setError("Global shortcut cannot be empty");
        setIsSaving(false);
        return;
      }

      // Update settings
      const updatedSettings = {
        ...settings,
        globalShortcut: shortcutInput,
      };

      // Send to main process
      const result = (await window.ipc.invoke(
        "save-settings",
        updatedSettings,
      )) as { success: boolean; error?: string };

      if (result.success) {
        setSettings(updatedSettings);
        setSuccessMessage("Settings saved successfully");

        // Clear success message after a delay
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError(result.error || "Failed to save settings");
      }

      setIsSaving(false);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsSaving(false);
    }
  };

  // Handle browser selection
  const handleBrowserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings({
      ...settings,
      defaultBrowser: e.target.value,
    });
  };

  // Handle Export — show password modal first
  const handleExport = () => {
    setPasswordInput("");
    setPasswordConfirm("");
    setPasswordAction("export");
    setImportFilePath(null);
    setShowPasswordModal(true);
  };

  // Execute export after password is entered
  const executeExport = async (password: string) => {
    try {
      setIsSaving(true);
      setError(null);
      const result = (await window.ipc.invoke("export-data", password)) as {
        success: boolean;
        error?: string;
      };
      if (result.success) {
        setSuccessMessage("Data exported successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (result.error !== "Export cancelled") {
        setError(result.error || "Failed to export data");
      }
    } catch (err: any) {
      setError("Error exporting data: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Import — check if password is needed
  const handleImport = async () => {
    if (
      !window.confirm(
        "Importing data will merge with your existing documents. Are you sure you want to proceed?",
      )
    ) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const result = (await window.ipc.invoke("import-data")) as {
        success: boolean;
        needsPassword?: boolean;
        filePath?: string;
        error?: string;
        message?: string;
      };

      if (result.needsPassword) {
        // Encrypted backup — show password modal
        setPasswordInput("");
        setPasswordConfirm("");
        setPasswordAction("import");
        setImportFilePath(result.filePath ?? null);
        setShowPasswordModal(true);
      } else if (result.success) {
        setSuccessMessage(result.message || "Data imported successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (result.error !== "Import cancelled") {
        setError(result.error || "Failed to import data");
      }
    } catch (err: any) {
      setError("Error importing data: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Execute import after password is entered
  const executeImport = async (password: string) => {
    try {
      setIsSaving(true);
      setError(null);
      const result = (await window.ipc.invoke("import-data", {
        password,
        filePath: importFilePath,
      })) as {
        success: boolean;
        error?: string;
        message?: string;
      };
      if (result.success) {
        setSuccessMessage(result.message || "Data imported successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (result.error !== "Import cancelled") {
        setError(result.error || "Failed to import data");
      }
    } catch (err: any) {
      setError("Error importing data: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password modal submit
  const handlePasswordSubmit = async () => {
    if (!passwordInput) {
      setError("Password cannot be empty");
      return;
    }
    if (passwordAction === "export" && passwordInput !== passwordConfirm) {
      setError("Passwords do not match");
      return;
    }
    setShowPasswordModal(false);
    const pwd = passwordInput;
    setPasswordInput("");
    setPasswordConfirm("");
    if (passwordAction === "export") {
      await executeExport(pwd);
    } else {
      await executeImport(pwd);
    }
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
        {/* Security Section */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-200">Security</h3>

          {/* Biometric toggle */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col space-y-1 mr-4">
              <span className="text-sm text-gray-200">Face ID / Touch ID</span>
              <span className="text-xs text-gray-400">
                Require biometric authentication to unlock the app
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.biometricEnabled}
              onClick={() =>
                setSettings({ ...settings, biometricEnabled: !settings.biometricEnabled })
              }
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.biometricEnabled ? "bg-blue-600" : "bg-white/20"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.biometricEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Clipboard auto-clear */}
          <div className="space-y-1">
            <label className="text-sm text-gray-200">Clipboard Auto-Clear</label>
            <p className="text-xs text-gray-400">
              Automatically clear copied values from the clipboard after a delay
            </p>
            <select
              value={settings.clipboardAutoClearSeconds}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  clipboardAutoClearSeconds: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: `right 0.5rem center`,
                backgroundRepeat: `no-repeat`,
                backgroundSize: `1.5em 1.5em`,
              }}
            >
              <option value={0}>Disabled</option>
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>60 seconds</option>
              <option value={120}>120 seconds</option>
            </select>
          </div>
        </div>

        {/* Global shortcut setting */}
        <div className="space-y-2 pt-4 border-t border-white/10">
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
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: `right 0.5rem center`,
              backgroundRepeat: `no-repeat`,
              backgroundSize: `1.5em 1.5em`,
            }}
          >
            {browserOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Owners Management Section */}
        <div className="space-y-2 pt-4 border-t border-white/10">
          <h3 className="text-md font-medium text-gray-200">Owners</h3>
          <p className="text-sm text-gray-400">
            Predefined owner names for quick selection.
          </p>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
              placeholder="Add new owner..."
              className="flex-1 px-3 py-2 text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newOwner.trim()) {
                  if (!settings.owners.includes(newOwner.trim())) {
                    setSettings({ ...settings, owners: [...settings.owners, newOwner.trim()] });
                  }
                  setNewOwner("");
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (newOwner.trim() && !settings.owners.includes(newOwner.trim())) {
                  setSettings({ ...settings, owners: [...settings.owners, newOwner.trim()] });
                }
                setNewOwner("");
              }}
              className="px-3 py-2 text-sm bg-blue-600/20 hover:bg-blue-600/40 text-blue-200 rounded-md"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {settings.owners.map((owner) => (
              <span key={owner} className="inline-flex items-center px-2 py-1 bg-emerald-600/30 text-emerald-200 rounded-full text-sm">
                {owner}
                <button
                  onClick={() => setSettings({ ...settings, owners: settings.owners.filter(o => o !== owner) })}
                  className="ml-1 text-emerald-300 hover:text-red-400"
                >×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Categories Management Section */}
        <div className="space-y-2 pt-4 border-t border-white/10">
          <h3 className="text-md font-medium text-gray-200">Categories</h3>
          <p className="text-sm text-gray-400">
            Predefined category names for organizing documents.
          </p>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Add new category..."
              className="flex-1 px-3 py-2 text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newCategory.trim()) {
                  if (!settings.categories.includes(newCategory.trim())) {
                    setSettings({ ...settings, categories: [...settings.categories, newCategory.trim()] });
                  }
                  setNewCategory("");
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (newCategory.trim() && !settings.categories.includes(newCategory.trim())) {
                  setSettings({ ...settings, categories: [...settings.categories, newCategory.trim()] });
                }
                setNewCategory("");
              }}
              className="px-3 py-2 text-sm bg-blue-600/20 hover:bg-blue-600/40 text-blue-200 rounded-md"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {settings.categories.map((cat) => (
              <span key={cat} className="inline-flex items-center px-2 py-1 bg-indigo-600/30 text-indigo-200 rounded-full text-sm">
                {cat}
                <button
                  onClick={() => setSettings({ ...settings, categories: settings.categories.filter(c => c !== cat) })}
                  className="ml-1 text-indigo-300 hover:text-red-400"
                >×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Data Management Section */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <h3 className="text-md font-medium text-gray-200">Data Management</h3>
          <p className="text-sm text-gray-400">
            Backup your data or restore from a file.
            <br />
            <span className="text-xs text-yellow-500">
              Note: Database is encrypted on this machine. Use Export to transfer
              data to another device.
            </span>
          </p>
          <div className="flex space-x-3">
            <button
              onClick={handleExport}
              disabled={isSaving}
              className="px-3 py-2 text-sm bg-blue-600/20 hover:bg-blue-600/40 text-blue-200 border border-blue-600/50 rounded-md focus:outline-none transition-colors"
            >
              📤 Export Backup
            </button>
            <button
              onClick={handleImport}
              disabled={isSaving}
              className="px-3 py-2 text-sm bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-600/50 rounded-md focus:outline-none transition-colors"
            >
              📥 Import Backup
            </button>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-4 flex justify-between border-t border-gray-700 mt-4">
        {/* Error or success message */}
        <div className="flex-grow">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {successMessage && (
            <p className="text-green-400 text-sm">{successMessage}</p>
          )}
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
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-80 bg-gray-900 border border-white/10 rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-md font-semibold text-gray-100">
              {passwordAction === "export" ? "Set Backup Password" : "Enter Backup Password"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePasswordSubmit();
                    if (e.key === "Escape") {
                      setShowPasswordModal(false);
                      setPasswordInput("");
                      setPasswordConfirm("");
                    }
                  }}
                />
              </div>

              {passwordAction === "export" && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full px-3 py-2 text-white bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handlePasswordSubmit();
                      if (e.key === "Escape") {
                        setShowPasswordModal(false);
                        setPasswordInput("");
                        setPasswordConfirm("");
                      }
                    }}
                  />
                </div>
              )}

              {passwordAction === "export" && (
                <p className="text-xs text-yellow-400">
                  Store this password safely. If lost, this backup cannot be recovered.
                </p>
              )}
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordInput("");
                  setPasswordConfirm("");
                }}
                className="flex-1 px-3 py-2 text-sm bg-white/10 hover:bg-white/20 text-gray-300 rounded-md focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePasswordSubmit}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md focus:outline-none"
              >
                {passwordAction === "export" ? "Export" : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
