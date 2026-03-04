'use server';

import { v2 as cloudinary } from 'cloudinary';

// ─── Environment Validation ───────────────────────────────────────────────────
// Credentials MUST come from environment variables — no hardcoded fallbacks.
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  throw new Error(
    '[Cloudinary] Missing required environment variables. ' +
    'Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in .env.local'
  );
}

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key:    API_KEY,
  api_secret: API_SECRET,
  secure:     true, // always use HTTPS URLs
});

// ─── Constants ────────────────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
]);
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Validates a file on the server — never trust client-side validation alone. */
function validateFile(file: File, fieldName: string): void {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`${fieldName}: File size exceeds the 5 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB received)`);
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(`${fieldName}: Invalid file type "${file.type}". Allowed types: JPG, PNG, PDF`);
  }
}

/**
 * Uploads a single File to Cloudinary using a stream — avoids loading the
 * entire file into memory as a string, which is far more efficient than base64.
 */
async function streamUpload(file: File, folder: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:           `shlcs_2026/${folder}`,
        resource_type:    'auto',
        allowed_formats:  ['jpg', 'jpeg', 'png', 'pdf'],
        use_filename:     false,   // sanitize original filename
        unique_filename:  true,    // prevent overwrites
        overwrite:        false,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary returned no result'));
          return;
        }
        resolve(result.secure_url);
      },
    );

    stream.end(buffer);
  });
}

// ─── Public Server Action ─────────────────────────────────────────────────────

export interface ManifestUploadResult {
  invoiceUrl:     string;
  idCardFrontUrl: string;
  idCardBackUrl:  string;
}

/**
 * Server Action — Upload all three manifest documents to Cloudinary in parallel.
 *
 * Why FormData instead of base64?
 *   • base64 inflates payload size by ~33 %
 *   • base64 strings must be held in JS heap on both client and server
 *   • FormData File objects are streamed directly — no string conversion needed
 *
 * Expected FormData fields:
 *   invoice     – Commercial Invoice (required)
 *   idCardFront – Ghana Card front face (required)
 *   idCardBack  – Ghana Card back face (required)
 */
export async function uploadManifestFiles(formData: FormData): Promise<ManifestUploadResult> {
  const invoice     = formData.get('invoice')     as File | null;
  const idCardFront = formData.get('idCardFront') as File | null;
  const idCardBack  = formData.get('idCardBack')  as File | null;

  // Presence check
  if (!invoice || !idCardFront || !idCardBack) {
    throw new Error(
      'All three documents are required: Commercial Invoice, ID Card Front, and ID Card Back'
    );
  }

  // Server-side type + size validation (do NOT rely solely on client validation)
  validateFile(invoice,     'Commercial Invoice');
  validateFile(idCardFront, 'ID Card (Front)');
  validateFile(idCardBack,  'ID Card (Back)');

  // Upload all three in parallel — reduces total wait time by ~66 % vs sequential
  const [invoiceUrl, idCardFrontUrl, idCardBackUrl] = await Promise.all([
    streamUpload(invoice,     'invoices'),
    streamUpload(idCardFront, 'id_cards'),
    streamUpload(idCardBack,  'id_cards'),
  ]);

  return { invoiceUrl, idCardFrontUrl, idCardBackUrl };
}
