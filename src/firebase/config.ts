/**
 * Firebase client configuration.
 * All values are read from environment variables — no hardcoded credentials.
 * In development, set these in .env.local (never commit that file).
 * In production (Firebase App Hosting), they are injected automatically.
 *
 * NOTE: we no longer use Firebase Storage for uploads; Cloudinary handles
 * all file assets via a server action. Removing the `storageBucket` entry
 * helps avoid accidental client SDK initialization and CORS issues.
 */
export const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            ?? '',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? '',
  databaseURL:       process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL       ?? '',
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         ?? '',
  // storageBucket intentionally omitted
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             ?? '',
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID     ?? '',
};
