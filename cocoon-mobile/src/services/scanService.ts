/**
 * scanService.ts — Quick test of the hybrid OCR + LLM pipeline.
 *
 * Step 1: Apple Vision OCR via expo-text-extractor
 * Step 2: Qwen 2.5 0.5B via llama.rn parses OCR text into structured JSON
 */

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { extractTextFromImage } from 'expo-text-extractor';
import { initLlama, LlamaContext } from 'llama.rn';

const MODEL_FILENAME = 'qwen2.5-1.5b-instruct-q4_k_m.gguf';
const MODEL_URL =
  'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf';
const MODEL_DIR = FileSystem.documentDirectory + 'models/';
const MODEL_PATH = MODEL_DIR + MODEL_FILENAME;

// --- Model management ---

export async function isModelDownloaded(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(MODEL_PATH);
  return info.exists;
}

export async function downloadModel(
  onProgress: (pct: number) => void,
): Promise<void> {
  await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
  const callback = (dl: FileSystem.DownloadProgressData) => {
    if (dl.totalBytesExpectedToWrite > 0) {
      onProgress(dl.totalBytesWritten / dl.totalBytesExpectedToWrite);
    }
  };
  const download = FileSystem.createDownloadResumable(
    MODEL_URL,
    MODEL_PATH,
    {},
    callback,
  );
  const result = await download.downloadAsync();
  if (!result?.uri) throw new Error('Model download failed');
}

export async function deleteModel(): Promise<void> {
  const info = await FileSystem.getInfoAsync(MODEL_PATH);
  if (info.exists) await FileSystem.deleteAsync(MODEL_PATH);
}

// --- Pick image ---

export async function pickDocumentPhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0].uri;
}

// --- Capture from camera ---

export async function captureDocumentPhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Camera permission is required to scan documents.');
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 1,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0].uri;
}

// --- OCR ---

export async function runOcr(imageUri: string): Promise<string> {
  const blocks = await extractTextFromImage(imageUri);
  return blocks.join('\n');
}

// --- LLM parsing ---

const PROMPT_TEMPLATE = `You are a document parser. Extract fields from the OCR text below into JSON.

CRITICAL RULES:
- Use the EXACT values from the OCR text. Do NOT guess or swap values between fields.
- Match each label to the value immediately after it (e.g. "DL NO: 16481642" means license_number is "16481642").
- Common labels: DL/DL NO/LIC = license_number, DOB = date_of_birth, EXP/EXPIRY = expiry_date, ISS = issue_date, HT = height, SEX = sex, CLASS/CL = class.
- If a field is not found, omit it.
- Return ONLY valid JSON, no extra text.

Format: {"type": "<document type>", "fields": {"<field_name>": "<value>", ...}}

### Example 1
OCR Text:
ONTARIO DRIVER'S LICENCE
DL A1234 56789 01234
DOB 1990/05/15 EXPIRY 2027/05/15
SMITH, JOHN MICHAEL
123 MAIN ST APT 4 TORONTO ON M5V 2T6
CLASS G

Output:
{"type": "Driver's License", "fields": {"name": "John Michael Smith", "license_number": "A1234-56789-01234", "date_of_birth": "1990-05-15", "expiry_date": "2027-05-15", "address": "123 Main St Apt 4, Toronto, ON M5V 2T6", "class": "G"}}

### Example 2
OCR Text:
DRIVER LICENSE
DL NO: 16481642
CLASS: C
DOB: 03/15/1985
EXP: 03/15/2028
DOE, JANE
456 OAK AVE UNIT 7 LOS ANGELES CA 90001
SEX: F HT: 5-06

Output:
{"type": "Driver's License", "fields": {"name": "Jane Doe", "license_number": "16481642", "class": "C", "date_of_birth": "1985-03-15", "expiry_date": "2028-03-15", "address": "456 Oak Ave Unit 7, Los Angeles, CA 90001", "sex": "F", "height": "5-06"}}

### Document to parse
OCR Text:
{ocr_text}

Output:
`;

let llamaContext: LlamaContext | null = null;

async function getContext(): Promise<LlamaContext> {
  if (llamaContext) return llamaContext;
  llamaContext = await initLlama({
    model: MODEL_PATH,
    n_ctx: 1024,
    n_threads: 4,
    n_gpu_layers: 99, // Metal acceleration
  });
  return llamaContext;
}

export async function releaseContext(): Promise<void> {
  if (llamaContext) {
    await llamaContext.release();
    llamaContext = null;
  }
}

export interface ScanResult {
  ocrText: string;
  ocrTimeMs: number;
  llmResponse: string;
  llmTimeMs: number;
  parsed: Record<string, any> | null;
}

export async function runFullPipeline(imageUri: string): Promise<ScanResult> {
  // Step 1: OCR
  const ocrStart = Date.now();
  const ocrText = await runOcr(imageUri);
  const ocrTimeMs = Date.now() - ocrStart;

  // Step 2: LLM
  const ctx = await getContext();
  const prompt = PROMPT_TEMPLATE.replace('{ocr_text}', ocrText);
  const llmStart = Date.now();
  const result = await ctx.completion({
    prompt,
    n_predict: 512,
    stop: ['\n\n', '###'],
    temperature: 0.1,
  });
  const llmTimeMs = Date.now() - llmStart;

  // Try to parse JSON from response
  let parsed: Record<string, any> | null = null;
  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
  } catch { /* user will see raw response */ }

  return {
    ocrText,
    ocrTimeMs,
    llmResponse: result.text,
    llmTimeMs,
    parsed,
  };
}
