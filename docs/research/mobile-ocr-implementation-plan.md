# Mobile OCR Implementation Plan

**Feature:** AI-powered document scanning with offline VLM  
**Target Platforms:** iOS, macOS  
**Timeline:** TBD

---

## Overview

Add the ability to scan documents (driver's licenses, passports, health cards) and automatically extract structured data using an on-device Vision Language Model (Moondream).

### User Flow

1. User taps "Scan Document" in Cocoon
2. Camera opens (or user selects photo)
3. Moondream processes image locally
4. Extracted fields shown for confirmation/editing
5. User saves to Cocoon database

---

## Phase 1: Foundation (Week 1-2)

### 1.1 Core ML Model Conversion

**Goal:** Convert Moondream 0.5B to Core ML format

**Tasks:**
- [ ] Set up Python environment with `coremltools`, `transformers`
- [ ] Download Moondream 0.5B from HuggingFace
- [ ] Convert vision encoder to Core ML
- [ ] Convert language model to Core ML
- [ ] Test conversion on Mac
- [ ] Validate output matches PyTorch reference

**Deliverable:** `moondream-0.5b.mlpackage` ready for iOS/macOS

### 1.2 Model Hosting

**Goal:** Host model for on-demand download

**Recommended: GitHub Releases** (start here)

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| **GitHub Releases** | Free | Simple, 2GB limit, CDN-backed, version with app | No download analytics |
| CloudFlare R2 | ~$0.015/GB | Fast global CDN, S3-compatible | Setup overhead |
| HuggingFace Hub | Free | Already hosts Moondream | Need to upload Core ML version |
| Apple On-Demand Resources | Free | Integrated with App Store, device targeting | App Store only, complex setup |

**URL Pattern:**
```
https://github.com/amol-patil/cocoon/releases/download/v{VERSION}/moondream-{SIZE}.mlpackage.zip
```

Example:
- `https://github.com/amol-patil/cocoon/releases/download/v1.0/moondream-0.5b.mlpackage.zip`
- `https://github.com/amol-patil/cocoon/releases/download/v1.0/moondream-2b.mlpackage.zip`

**Tasks:**
- [ ] Convert model and create `.mlpackage.zip`
- [ ] Create GitHub Release with model assets
- [ ] Document model versions in release notes
- [ ] Implement download progress UI in app
- [ ] Add checksum verification for integrity

---

## Phase 2: iOS Integration (Week 2-3)

### 2.1 Model Manager

**Goal:** Handle model download, caching, loading

```swift
class MoondreamModelManager {
    enum ModelTier: String { 
        case compact = "0.5b"   // ~500MB
        case enhanced = "2b"    // ~1.2GB
    }
    
    // Model URLs (GitHub Releases)
    private func modelURL(for tier: ModelTier) -> URL {
        let version = "v1.0"
        return URL(string: "https://github.com/amol-patil/cocoon/releases/download/\(version)/moondream-\(tier.rawValue).mlpackage.zip")!
    }
    
    // Download with progress
    func downloadModel(_ tier: ModelTier, progress: @escaping (Double) -> Void) async throws {
        let (localURL, _) = try await URLSession.shared.download(from: modelURL(for: tier))
        // Unzip to Documents/Models/
        try FileManager.default.unzipItem(at: localURL, to: modelsDirectory)
    }
    
    // Check if already downloaded
    func isModelAvailable(_ tier: ModelTier) -> Bool {
        return FileManager.default.fileExists(atPath: modelPath(for: tier))
    }
    
    // Load into memory
    func loadModel(_ tier: ModelTier) async throws -> MoondreamModel {
        let config = MLModelConfiguration()
        config.computeUnits = .cpuAndNeuralEngine  // Use Neural Engine when available
        return try MoondreamModel(contentsOf: modelPath(for: tier), configuration: config)
    }
    
    // Free memory
    func unloadModel() {
        currentModel = nil
    }
}
```

**Storage Location:**
```
~/Library/Application Support/Cocoon/Models/
├── moondream-0.5b.mlpackage/
└── moondream-2b.mlpackage/     (optional)
```

**Tasks:**
- [ ] Implement download with progress callback
- [ ] Show progress bar UI during download
- [ ] Store in app's Application Support directory
- [ ] Handle background download (iOS)
- [ ] Implement model loading with Neural Engine preference
- [ ] Add device capability check (check available RAM)
- [ ] Handle download resume on network failure
- [ ] Verify checksum after download

### 2.2 Inference Wrapper

**Goal:** Clean API for document extraction

```swift
struct DocumentExtractionResult {
    let rawText: String
    let fields: [String: String]  // e.g., ["license_number": "A1234567"]
    let confidence: Float
}

class DocumentExtractor {
    func extract(from image: UIImage, 
                 documentType: DocumentType) async throws -> DocumentExtractionResult
}
```

**Tasks:**
- [ ] Implement Core ML inference
- [ ] Design prompt templates per document type
- [ ] Parse JSON output from model
- [ ] Handle extraction failures gracefully
- [ ] Add confidence scoring

### 2.3 Camera/Photo UI

**Goal:** Document capture interface

**Tasks:**
- [ ] Add camera permission handling
- [ ] Implement camera view with guides
- [ ] Add photo library picker option
- [ ] Implement image preprocessing (crop, rotate)
- [ ] Show extraction progress indicator

---

## Phase 3: Results & Integration (Week 3-4)

### 3.1 Results Review UI

**Goal:** Let user verify/edit extracted data

**Tasks:**
- [ ] Display extracted fields in editable form
- [ ] Show original image for reference
- [ ] Highlight low-confidence fields
- [ ] Add "Re-scan" option
- [ ] Implement save to database

### 3.2 Document Type Templates

**Goal:** Optimize for common document types

**Supported types (initial):**
- [ ] Driver's License (Canadian)
- [ ] Health Card (Ontario)
- [ ] Passport (Canadian)
- [ ] Generic ID

**Tasks:**
- [ ] Create prompt templates per type
- [ ] Define expected fields per type
- [ ] Add document type selector in UI
- [ ] Test with sample documents

### 3.3 Cocoon Database Integration

**Goal:** Store extracted data with source link

**Tasks:**
- [ ] Extend data model for scan source
- [ ] Store original image reference
- [ ] Link to source PDF/image in Drive
- [ ] Update search to include scanned docs

---

## Phase 4: macOS Parity (Week 4-5)

### 4.1 Shared Framework

**Goal:** Share model + inference code between iOS/macOS

**Tasks:**
- [ ] Extract model code to shared Swift package
- [ ] Ensure Core ML model works on macOS
- [ ] Handle platform differences (camera vs file picker)

### 4.2 macOS UI

**Goal:** Document scanning in Mac app

**Tasks:**
- [ ] Add scan option to document creation flow
- [ ] Implement file picker for images/PDFs
- [ ] Port results review UI to macOS
- [ ] Test on Intel + Apple Silicon

---

## Phase 5: Enhanced Model (Week 5-6)

### 5.1 Moondream 2B Support

**Goal:** Optional download for better accuracy

**Tasks:**
- [ ] Convert Moondream 2B (4-bit) to Core ML
- [ ] Add model tier selection in settings
- [ ] Implement model switching
- [ ] Show comparison/benefits to user

### 5.2 Performance Optimization

**Tasks:**
- [ ] Profile memory usage
- [ ] Optimize model loading time
- [ ] Add model preloading option
- [ ] Implement inference caching

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Core ML conversion fails | Try ONNX intermediate format; contact Moondream team |
| Model too large for older devices | Stick with 0.5B; show device requirements |
| Poor extraction quality | Fall back to Apple Vision OCR + manual entry |
| Memory pressure on iOS | Aggressive model unloading; device checks |
| Model license issues | Review Moondream license; contact if needed |

---

## Success Metrics

- [ ] **Accuracy:** >90% correct field extraction on clean scans
- [ ] **Speed:** <3 seconds inference time on iPhone 13
- [ ] **Size:** <600MB model download (0.5B)
- [ ] **Adoption:** >50% of new documents use scan feature

---

## Future Enhancements

- [ ] Moondream 3 upgrade when smaller version available
- [ ] Fine-tune model on Canadian ID formats
- [ ] Batch scanning (multiple docs at once)
- [ ] Auto-detect document type
- [ ] Export/sync across devices

---

*Plan created by Pixel Pie 🥧*
