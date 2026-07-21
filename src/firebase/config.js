import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  connectFirestoreEmulator,
} from 'firebase/firestore'
import {
  getAuth,
  connectAuthEmulator,
  signInAnonymously,
  onAuthStateChanged,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'

// A missing/blank .env is the expected state right after cloning the repo.
// `getAuth()` validates the API key's *format* synchronously and throws if
// it looks wrong (an empty string does) — since this module sits at the
// root of the import graph, an uncaught throw here would take the entire
// React app down to a blank screen before it ever mounts. Everything below
// degrades instead: `configured` stays false, `auth`/`db` requests will
// fail per-call (already handled by onSnapshot's error callbacks), and
// FirebaseSetupNotice tells the user what to do about it.
export const configured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

export let auth = null
try {
  auth = getAuth(app)
} catch (err) {
  console.error('Firebase Auth failed to initialize — check your .env (see .env.example).', err)
}

if (useEmulator) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  if (auth) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
}

// Every browser session gets a stable anonymous UID. This is only used by
// Firestore security rules to tell "my prediction" apart from everyone
// else's before a race locks — it is not a visible login. The "who am I"
// picker in the Players feature is what players actually interact with.
let authReadyResolve
export const authReady = new Promise((resolve) => {
  authReadyResolve = resolve
})

if (auth) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      authReadyResolve(user)
    } else {
      signInAnonymously(auth).catch((err) => {
        console.error('Anonymous sign-in failed', err)
      })
    }
  })
} else {
  authReadyResolve(null)
}
