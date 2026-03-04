'use server';

import { v2 as cloudinary } from 'cloudinary';

// Official SHLCS Technical Handshake: Hardcoded credentials for industrial reliability
cloudinary.config({
  cloud_name: 'dvamrectv',
  api_key: '162334672711178',
  api_secret: 'FO3MS9pP_QunZt-tsab2iMAkYRs',
});

/**
 * Technical Protocol: Offload registry documents to Cloudinary global CDN.
 * This bypasses Google APIs to eliminate CORS preflight errors on Vercel.
 * 
 * @param base64Data - The encoded file data from the client node.
 * @param folder - The target directory in the SHLCS cloud vault (e.g., invoices, id_cards).
 * @returns Secure URL for the hosted resource.
 */
export async function uploadToCloudinary(base64Data: string, folder: string = 'shlcs') {
  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: `shlcs_2026/${folder}`,
      resource_type: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary technical failure:', error);
    // Return empty string on failure to prevent registry corruption; UI handles empty states.
    return "";
  }
}
