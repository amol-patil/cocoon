import React, { useState, useEffect } from "react";

interface AppSettings {
  globalShortcut: string;
  defaultBrowser: string;
  biometricEnabled: boolean;
  clipboardAutoClearSeconds: number;
}

interface SettingsViewProps {
  onBack: () => void;
}

const BROWSER_OPTIONS = [
  { value: "system", label: "System Default" },
  { value: "chrome", label: "Google Chrome" },
  { value: "firefox", label: "Firefox" },
  { value: "safari", label: "Safari" },
  { value: "edge", label: "Microsoft Edge" },
  { value: "brave", label: "Brave Browser" },
];

const CLEAR_DELAY_OPTIONS = [
  { value: 0, label: "Disabled" },
  { value: 15, label: "15 seconds" },
  { value: 30, label: "30 seconds" },
  { value: 60, label: "60 seconds" },
  { value: 120, label: "2 minutes" },
];

// Shared style tokens
const S = {
  sectionLabel: {
    color: "#6E6E70",
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
  } as React.CSSProperties,
  fieldLabel: {
    color: "#9A9A9E",
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    fontWeight: 500,
  } as React.CSSProperties,
  fieldSub: {
    color: "#6E6E70",
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
  } as React.CSSProperties,
  bodyText: {
    color: "#F5F5F0",
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
  } as React.CSSProperties,
  divider: { height: 1, background: "#3A3A3C" } as React.CSSProperties,
};

export default function SettingsView({ onBack }: SettingsViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>({
    globalShortcut: "CommandOrControl+Option+Space",
    defaultBrowser: "chrome",
    biometricEnabled: true,
    clipboardAutoClearSeconds: 30,
  });
  const [shortcutInput, setShortcutInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordAction, setPasswordAction] = useState<"export" | "import">("export");
  const [importFilePath, setImportFilePath] = useState<string | null>(null);

  // Inline confirmations (replaces window.confirm)
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const loaded = (await window.ipc.invoke("get-settings")) as AppSettings;
        setSettings(loaded);
        setShortcutInput(loaded.globalShortcut);
      } catch {
        setError("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!shortcutInput.trim()) {
      setError("Global shortcut cannot be empty");
      return;
    }
    try {
      setIsSaving(true);
      setError(null);
      const updated = { ...settings, globalShortcut: shortcutInput };
      const result = (await window.ipc.invoke("save-settings", updated)) as {
        success: boolean;
        error?: string;
      };
      if (result.success) {
        setSettings(updated);
        setSuccessMessage("Settings saved");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || "Failed to save settings");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    setPasswordInput("");
    setPasswordConfirm("");
    setPasswordAction("export");
    setImportFilePath(null);
    setShowPasswordModal(true);
  };

  const executeExport = async (password: string) => {
    try {
      setIsSaving(true);
      const result = (await window.ipc.invoke("export-data", password)) as {
        success: boolean;
        error?: string;
      };
      if (result.success) {
        setSuccessMessage("Data exported successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (result.error !== "Export cancelled") {
        setError(result.error || "Failed to export");
      }
    } catch (err: any) {
      setError("Error exporting: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportConfirmed = async () => {
    setShowImportConfirm(false);
    try {
      setIsSaving(true);
      const result = (await window.ipc.invoke("import-data")) as {
        success: boolean;
        needsPassword?: boolean;
        filePath?: string;
        error?: string;
        message?: string;
      };
      if (result.needsPassword) {
        setPasswordInput("");
        setPasswordConfirm("");
        setPasswordAction("import");
        setImportFilePath(result.filePath ?? null);
        setShowPasswordModal(true);
      } else if (result.success) {
        setSuccessMessage(result.message || "Data imported successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (result.error !== "Import cancelled") {
        setError(result.error || "Failed to import");
      }
    } catch (err: any) {
      setError("Error importing: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const executeImport = async (password: string) => {
    try {
      setIsSaving(true);
      const result = (await window.ipc.invoke("import-data", {
        password,
        filePath: importFilePath,
      })) as { success: boolean; error?: string; message?: string };
      if (result.success) {
        setSuccessMessage(result.message || "Data imported successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (result.error !== "Import cancelled") {
        setError(result.error || "Failed to import");
      }
    } catch (err: any) {
      setError("Error importing: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAllData = async () => {
    setShowClearAllConfirm(false);
    try {
      setIsSaving(true);
      const result = (await window.ipc.invoke("save-documents", [])) as {
        success: boolean;
        error?: string;
      };
      if (result.success) {
        setSuccessMessage("All data cleared");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || "Failed to clear data");
      }
    } catch (err: any) {
      setError("Error clearing data: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

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
    if (passwordAction === "export") await executeExport(pwd);
    else await executeImport(pwd);
  };

  const dismissPasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordInput("");
    setPasswordConfirm("");
    setError(null);
  };

  const clearDelayLabel =
    CLEAR_DELAY_OPTIONS.find(o => o.value === settings.clipboardAutoClearSeconds)?.label ?? "30 seconds";
  const browserLabel =
    BROWSER_OPTIONS.find(o => o.value === settings.defaultBrowser)?.label ?? "System Default";

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ color: "#6E6E70", fontFamily: "'Inter', sans-serif", fontSize: 13 }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full [-webkit-app-region:no-drag]">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 flex-shrink-0"
        style={{ height: 62, borderBottom: "1px solid #3A3A3C" }}
      >
        <div className="flex flex-col gap-0.5">
          <span
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 22,
              fontWeight: 600,
              color: "#F5F5F0",
            }}
          >
            Settings
          </span>
          <span style={S.fieldSub}>Preferences &amp; security</span>
        </div>
        <button
          onClick={onBack}
          className="flex items-center justify-center focus:outline-none transition-colors border border-[#3A3A3C] hover:bg-[#2A2A2C] hover:border-[#9A9A9E]"
          style={{ width: 32, height: 32, borderRadius: 16, color: "#6E6E70" }}
          aria-label="Close settings"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Body — two columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left column: Security + Preferences */}
        <div
          className="flex flex-col gap-4 overflow-y-auto py-5 px-6 flex-shrink-0"
          style={{ width: 320, borderRight: "1px solid #3A3A3C" }}
        >
          <span style={S.sectionLabel}>SECURITY</span>

          {/* Touch ID row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span style={{ ...S.bodyText, fontWeight: 500 }}>Touch ID / Face ID</span>
              <span style={S.fieldSub}>Require biometric auth to unlock</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.biometricEnabled}
              onClick={() => setSettings(s => ({ ...s, biometricEnabled: !s.biometricEnabled }))}
              className="flex-shrink-0 focus:outline-none"
              style={{
                width: 44,
                height: 26,
                borderRadius: 13,
                background: settings.biometricEnabled ? "#C9A962" : "#3A3A3C",
                position: "relative",
                transition: "background 0.15s ease",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: settings.biometricEnabled ? 21 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: settings.biometricEnabled ? "#1A1A1C" : "#6E6E70",
                  transition: "left 0.15s ease",
                }}
              />
            </button>
          </div>

          <div style={S.divider} />

          {/* Clipboard Auto-Clear */}
          <div className="flex flex-col gap-1.5">
            <span style={S.fieldLabel}>Clipboard Auto-Clear</span>
            <span style={S.fieldSub}>Clear copied values after a delay</span>
            <div
              className="flex items-center justify-between h-10 px-3.5 rounded-[10px] relative"
              style={{ background: "#242426", border: "1px solid #3A3A3C" }}
            >
              <select
                value={settings.clipboardAutoClearSeconds}
                onChange={e => setSettings(s => ({ ...s, clipboardAutoClearSeconds: Number(e.target.value) }))}
                className="absolute inset-0 opacity-0 w-full cursor-pointer"
              >
                {CLEAR_DELAY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <span style={S.bodyText}>{clearDelayLabel}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#9A9A9E", flexShrink: 0 }}>
                <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div style={S.divider} />

          <span style={S.sectionLabel}>PREFERENCES</span>

          {/* Global Shortcut */}
          <div className="flex flex-col gap-1.5">
            <span style={S.fieldLabel}>Global Shortcut</span>
            <span style={S.fieldSub}>Keyboard combo to show the app</span>
            <input
              type="text"
              value={shortcutInput}
              onChange={e => setShortcutInput(e.target.value)}
              placeholder="CommandOrControl+Option+Space"
              className="h-10 px-3.5 rounded-[10px] focus:outline-none"
              style={{
                background: "#242426",
                border: "1px solid #3A3A3C",
                color: "#F5F5F0",
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
              }}
            />
          </div>

          {/* Default Browser */}
          <div className="flex flex-col gap-1.5">
            <span style={S.fieldLabel}>Default Browser</span>
            <span style={S.fieldSub}>Used when opening links</span>
            <div
              className="flex items-center justify-between h-10 px-3.5 rounded-[10px] relative"
              style={{ background: "#242426", border: "1px solid #3A3A3C" }}
            >
              <select
                value={settings.defaultBrowser}
                onChange={e => setSettings(s => ({ ...s, defaultBrowser: e.target.value }))}
                className="absolute inset-0 opacity-0 w-full cursor-pointer"
              >
                {BROWSER_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <span style={S.bodyText}>{browserLabel}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#9A9A9E", flexShrink: 0 }}>
                <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right column: Data + Danger Zone */}
        <div className="flex flex-col gap-4 flex-1 overflow-y-auto py-5 px-6">
          <span style={S.sectionLabel}>DATA</span>
          <span style={{ ...S.fieldSub, lineHeight: 1.5 }}>
            Backup your data or restore from a file. Data is encrypted on this device.
          </span>

          <div className="flex gap-2.5 flex-wrap">
            <button
              onClick={handleExport}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 h-[38px] px-[18px] rounded-[10px] focus:outline-none transition-colors border border-[#3A3A3C] hover:bg-[#2A2A2C] hover:border-[#C9A962] disabled:opacity-50"
              style={{ background: "#242426" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "#C9A962", flexShrink: 0 }}>
                <path d="M7 9V1M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 10v1.5A1.5 1.5 0 0 0 3.5 13h7a1.5 1.5 0 0 0 1.5-1.5V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span style={{ ...S.bodyText, fontWeight: 500 }}>Export Backup</span>
            </button>
            <button
              onClick={() => { setShowImportConfirm(v => !v); }}
              disabled={isSaving}
              className="group flex items-center justify-center gap-2 h-[38px] px-[18px] rounded-[10px] focus:outline-none transition-colors border border-[#3A3A3C] hover:bg-[#2A2A2C] disabled:opacity-50"
              style={{ background: "#242426" }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#9A9A9E] group-hover:text-[#F5F5F0] transition-colors" style={{ flexShrink: 0 }}>
                <path d="M7 1v8M4 4l3-3 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 10v1.5A1.5 1.5 0 0 0 3.5 13h7a1.5 1.5 0 0 0 1.5-1.5V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span className="text-[#9A9A9E] group-hover:text-[#F5F5F0] transition-colors" style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500 }}>
                Import Backup
              </span>
            </button>
          </div>

          {/* Import inline confirmation */}
          {showImportConfirm && (
            <div
              className="flex flex-col gap-3 p-4 rounded-[10px]"
              style={{ background: "#2A2A2C", border: "1px solid #3A3A3C" }}
            >
              <span style={{ ...S.bodyText, fontWeight: 500 }}>Import and merge with existing data?</span>
              <span style={{ ...S.fieldSub, lineHeight: 1.5 }}>
                This will merge the backup with your current documents. Existing data will not be removed.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImportConfirm(false)}
                  className="flex items-center justify-center h-8 px-4 rounded-[8px] focus:outline-none transition-colors hover:border-[#6E6E70]"
                  style={{ border: "1px solid #3A3A3C", color: "#6E6E70", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportConfirmed}
                  className="flex items-center justify-center h-8 px-4 rounded-[8px] focus:outline-none transition-colors hover:opacity-90"
                  style={{ background: "#C9A962", color: "#1A1A1C", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600 }}
                >
                  Proceed
                </button>
              </div>
            </div>
          )}

          <div style={S.divider} />

          <span style={{ ...S.sectionLabel, color: "#D94A4A88" }}>DANGER ZONE</span>

          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span style={{ color: "#D94A4A", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500 }}>
                Clear All Data
              </span>
              <span style={{ ...S.fieldSub, lineHeight: 1.4 }}>
                Permanently delete all documents. This cannot be undone.
              </span>
            </div>
            <button
              onClick={() => setShowClearAllConfirm(v => !v)}
              disabled={isSaving}
              className="flex items-center justify-center gap-1.5 h-[34px] px-3.5 rounded-[8px] flex-shrink-0 focus:outline-none transition-colors border border-[#D94A4A44] hover:bg-[#2A1A1A] hover:border-[#D94A4A88] disabled:opacity-50"
              style={{ color: "#D94A4A" }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 3h8M4 3V2h4v1M3 3l.5 7h5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500 }}>Clear</span>
            </button>
          </div>

          {/* Clear All inline confirmation */}
          {showClearAllConfirm && (
            <div
              className="flex flex-col gap-3 p-4 rounded-[10px]"
              style={{ background: "#2A2A2C", border: "1px solid #D94A4A44" }}
            >
              <span style={{ ...S.bodyText, fontWeight: 500 }}>Delete all documents permanently?</span>
              <span style={{ ...S.fieldSub, lineHeight: 1.5 }}>
                This action cannot be undone. All your documents will be removed.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowClearAllConfirm(false)}
                  className="flex items-center justify-center h-8 px-4 rounded-[8px] focus:outline-none transition-colors hover:border-[#6E6E70]"
                  style={{ border: "1px solid #3A3A3C", color: "#6E6E70", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAllData}
                  className="flex items-center justify-center h-8 px-4 rounded-[8px] focus:outline-none transition-colors hover:opacity-90"
                  style={{ background: "#D94A4A", color: "#FFFFFF", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600 }}
                >
                  Delete All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-6 py-3.5 flex-shrink-0"
        style={{ borderTop: "1px solid #3A3A3C" }}
      >
        <div>
          {error && (
            <span style={{ color: "#D94A4A", fontFamily: "'Inter', sans-serif", fontSize: 12 }}>{error}</span>
          )}
          {successMessage && (
            <span style={{ color: "#6E9E6E", fontFamily: "'Inter', sans-serif", fontSize: 12 }}>{successMessage}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="flex items-center justify-center h-9 px-5 rounded-[10px] focus:outline-none transition-colors border border-[#3A3A3C] hover:bg-[#2A2A2C] hover:border-[#9A9A9E] hover:text-[#F5F5F0]"
            style={{ color: "#6E6E70", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center h-9 px-5 rounded-[10px] focus:outline-none transition-colors bg-[#C9A962] hover:bg-[#D4B870] disabled:opacity-50"
            style={{ color: "#1A1A1C", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600 }}
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 [-webkit-app-region:no-drag]">
          <div
            className="w-80 flex flex-col gap-4 p-6"
            style={{
              background: "#242426",
              border: "1px solid #3A3A3C",
              borderRadius: 16,
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            }}
          >
            <span style={{ color: "#F5F5F0", fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600 }}>
              {passwordAction === "export" ? "Set Backup Password" : "Enter Backup Password"}
            </span>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label style={S.fieldSub}>Password</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="Enter password"
                  className="h-10 px-3.5 rounded-[10px] focus:outline-none"
                  style={{
                    background: "#1A1A1C",
                    border: "1px solid #3A3A3C",
                    color: "#F5F5F0",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13,
                  }}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === "Enter") handlePasswordSubmit();
                    if (e.key === "Escape") dismissPasswordModal();
                  }}
                />
              </div>

              {passwordAction === "export" && (
                <div className="flex flex-col gap-1.5">
                  <label style={S.fieldSub}>Confirm Password</label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    placeholder="Confirm password"
                    className="h-10 px-3.5 rounded-[10px] focus:outline-none"
                    style={{
                      background: "#1A1A1C",
                      border: "1px solid #3A3A3C",
                      color: "#F5F5F0",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 13,
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter") handlePasswordSubmit();
                      if (e.key === "Escape") dismissPasswordModal();
                    }}
                  />
                </div>
              )}

              {passwordAction === "export" && (
                <span style={{ color: "#D4A847", fontFamily: "'Inter', sans-serif", fontSize: 11, lineHeight: 1.4 }}>
                  Store this password safely. If lost, this backup cannot be recovered.
                </span>
              )}

              {error && (
                <span style={{ color: "#D94A4A", fontFamily: "'Inter', sans-serif", fontSize: 11 }}>{error}</span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={dismissPasswordModal}
                className="flex-1 flex items-center justify-center h-9 rounded-[10px] focus:outline-none transition-colors hover:border-[#6E6E70]"
                style={{ border: "1px solid #3A3A3C", color: "#6E6E70", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePasswordSubmit}
                className="flex-1 flex items-center justify-center h-9 rounded-[10px] focus:outline-none transition-colors hover:opacity-90"
                style={{ background: "#C9A962", color: "#1A1A1C", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600 }}
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
