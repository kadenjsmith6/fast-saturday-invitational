import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// The web config is a public identifier, not a secret: it ships in every page anyway.
// Environment variables can override it (e.g. to point at a test project).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyCBmVu0Wf_AeXropKA_wXncEFbEgYTFO5I",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "fast-saturday-invitational.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "fast-saturday-invitational",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "fast-saturday-invitational.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "550171767555",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:550171767555:web:e5ce4ba7ade3323d25ef36",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Offline cache: scores entered with no signal are saved on the phone and sync when it reconnects.
export const db =
  typeof window === "undefined"
    ? initializeFirestore(app, {})
    : initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });

export const auth = getAuth(app);

/** Silent sign-in so only our app can write. Players never see a login screen. */
export async function ensureSignedIn() {
  // Wait for a saved sign-in to load first, so a phone with no signal can still record scores.
  await auth.authStateReady();
  if (!auth.currentUser) await signInAnonymously(auth);
  return auth.currentUser;
}
