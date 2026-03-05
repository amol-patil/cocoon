# Local OCR & VLM Research for Cocoon

**Date:** March 4, 2026  
**Goal:** Enable offline document parsing (licenses, passports, health cards) on iOS and macOS without any internet dependency.

---

## Problem Statement

Cocoon currently requires manual entry of document details (license numbers, expiry dates, etc.). Users want to:
1. Scan/photograph a document
2. Automatically extract structured data (number, DOB, expiry, etc.)
3. Do this **entirely offline** — no cloud APIs

### Why not just OCR?

Apple Vision Framework provides excellent raw OCR, but:
- It only extracts **text**, not **structured fields**
- It doesn't understand document layouts
- "DL: 12345" needs interpretation as a license number

LLMs (GPT-4V, Claude) excel at document understanding but require internet. We need **on-device LLM-level understanding**.

---

## Solution: On-Device Vision Language Models

### Recommended: Moondream

[Moondream](https://moondream.ai/) is an open-source Vision Language Model designed for edge deployment.

| Model | Download Size | Runtime Memory | DocVQA Score |
|-------|--------------|----------------|--------------|
| **Moondream 0.5B** | ~479 MB | ~1 GB | Good |
| **Moondream 2B** (4-bit) | ~1.2 GB | ~2.5 GB | 75.86 |
| **Moondream 3** (preview) | ~larger | TBD | 88.3 |

**Comparison to cloud models:**
- GPT-5: 89*
- Claude 4 Sonnet: 89.5*
- Moondream 3: 88.3 ✅ (competitive!)

### Why Moondream?

1. **Built for edge** — explicitly optimized for mobile/embedded
2. **Small enough for iOS** — 0.5B fits comfortably, 2B works on iPhone 13+
3. **Good document understanding** — DocVQA benchmark shows strong performance
4. **Open source** — MIT-like license for the smaller models
5. **Active development** — Moondream 3 just released with major improvements

---

## Technical Approach

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Camera/Photo   │ ──▶ │  Moondream VLM  │ ──▶ │  Structured     │
│  (Image Input)  │     │  (Core ML)      │     │  JSON Output    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Prompt Strategy

```
"Extract all text fields from this driver's license as JSON:
{
  "name": "",
  "license_number": "",
  "date_of_birth": "",
  "expiry_date": "",
  "address": "",
  "class": ""
}"
```

### Model Delivery Strategy

| Tier | Model | Size | Bundled |
|------|-------|------|---------|
| Default | Moondream 0.5B | ~500MB | ❌ On-demand download |
| Enhanced | Moondream 2B | ~1.2GB | ❌ Optional download |

**Rationale:** Don't bloat the base app. Download models on first use of scan feature.

---

## Alternatives Considered

### Apple Vision Framework (OCR only)
- ✅ Built-in, zero dependencies
- ❌ No semantic understanding
- ❌ Can't extract structured fields reliably

### Template/Regex Parsing
- ✅ Fast, lightweight
- ❌ Breaks on document variations
- ❌ Doesn't handle wear, angles, different formats

### Cloud APIs (GPT-4V, Claude, AWS Textract)
- ✅ Best accuracy
- ❌ Requires internet (breaks offline requirement)
- ❌ Privacy concerns for personal documents

### Other Local VLMs
- **MobileVLM-3B** — Confirmed running on iOS, but larger
- **PaliGemma 3B** — Google model, similar size
- **SmolVLM** — HuggingFace, ~2GB

Moondream wins on size + edge optimization + document performance.

---

## Performance Expectations

Based on benchmarks and model characteristics:

| Scenario | 0.5B | 2B | Cloud LLM |
|----------|------|-----|-----------|
| Clean license scan | ✅ Good | ✅ Great | ✅ Perfect |
| Worn/faded card | ⚠️ Okay | ✅ Good | ✅ Great |
| Angled photo | ⚠️ Iffy | ⚠️ Okay | ✅ Good |
| Unfamiliar format | ❌ Weak | ⚠️ Okay | ✅ Great |
| Structured JSON output | ⚠️ Usually | ✅ Reliable | ✅ Reliable |

**Recommendation:** Default to 0.5B, prompt users to download 2B for better results.

---

## iOS/macOS Implementation Notes

### Core ML Conversion
- Moondream models need conversion from PyTorch → Core ML
- Use `coremltools` for conversion
- May need to handle vision encoder + language model separately

### Memory Management
- 0.5B: ~1GB runtime — fine on most devices
- 2B: ~2.5GB runtime — need to check device capability before loading
- Implement lazy loading — only load model when scan feature used

### Shared Code
- Same Core ML model works on iOS + macOS
- Abstract model loading into shared framework
- Platform-specific UI only

---

## References

- [Moondream GitHub](https://github.com/vikhyat/moondream)
- [Moondream Docs](https://docs.moondream.ai/)
- [Moondream 0.5B Announcement](https://moondream.ai/blog/introducing-moondream-0-5b)
- [Moondream on Ollama](https://ollama.com/library/moondream)
- [HuggingFace - Moondream 2B 4-bit](https://huggingface.co/moondream/moondream-2b-2025-04-14-4bit)

---

*Research conducted by Pixel Pie 🥧*
