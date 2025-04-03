# Product Requirements Document (PRD)

## 🧠 Product Idea
A Mac overlay tool (like Alfred or Raycast) that gives users fast, keyboard-accessible, secure access to personal document data (e.g. license numbers, expiration dates, etc.). It allows for structured search, copying, and linking to scanned documents in Google Drive.

---

## 🖼️ Wireframes (Flow Overview)

### Flow 1: Launch App (Running or Not)
- **State**: App running in background or not running
- **Trigger**: Global hotkey (e.g. ⌘ + Space)
- **Result**: Overlay appears at top of screen with search bar

### Flow 2: Search for Specific Document
- **Action**: Type e.g. `driver’s license`
- **Overlay Shows**:
  - `📄 Number: A1234-56789-01234    ⇧+1`
  - `📅 Expires: 2027-05-14         ⇧+2`
  - `📁 Open File                  ⏎`

### Flow 3: Copy Specific Info
- **Options**:
  - Press `⇧ + 1` → Copy number
  - Press `⇧ + 2` → Copy expiration
  - Press `⏎` → Default action: copy default field (e.g. number)
  - Press `⌘ + C` → Copy all fields in structured format

### Flow 4: View All Properties
- **Action**: Use arrow key or click to expand card
- **Result**: Full card view with all fields + clipboard icons

### Flow 5: Open Associated File
- **Action**: Click or press key on `📁 Open File`
- **Result**: App opens the Google Drive link in default browser

---

## 🔑 Features

### Core Features
- Global hotkey invocation
- Fuzzy search across document titles and field labels
- Copy specific fields via keyboard or mouse
- Open file in browser (Google Drive link)
- Expandable card view to show all related metadata
- Default field logic for one-hit copy

### Nice-to-Haves
- Auto-clear clipboard after X seconds
- Biometric unlock support (Touch ID)
- Quick field editing

---

## 🧱 Tech Stack

### Platform
- **Electron**: Cross-platform desktop app foundation
- **React**: For UI and overlay logic
- **Tailwind CSS**: For styling, lightweight and efficient

### Data Layer
- **Local storage**:
  - `lowdb` (file-based JSON DB)
  - OR `SQLite` via `better-sqlite3`
- **Fuzzy Search**: `Fuse.js` or `MiniSearch`

### Security
- Encrypted local data using `libsodium` or `crypto`
- No cloud storage or syncing unless Google Drive API used later

### Google Drive Integration
- MVP: Store shareable links only
- Later: Use Google Drive API for link validation and previews

---

## 📄 Example Schema
```json
{
  "type": "Driver's License",
  "defaultField": "number",
  "fields": {
    "number": "A1234-56789-01234",
    "expires": "2027-05-14"
  },
  "fileLink": "https://drive.google.com/..."
}
```

---

## 📌 Notes
- User expects dual experience: fast keyboard UX + friendly visual interface
- System should gracefully handle broken links (future enhancement)
- Security and local-first design is key
- Wireframes were generated to guide UI structure and user flow

