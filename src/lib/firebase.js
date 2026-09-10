import { getApp, getApps, initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDRYEynIyqJo_5hDvz8DKxH0DAAuhqeCD8",
  authDomain: "animationguilduganda-ef533.firebaseapp.com",
  projectId: "animationguilduganda-ef533",
  storageBucket: "animationguilduganda-ef533.firebasestorage.app",
  messagingSenderId: "282530143611",
  appId: "1:282530143611:web:dcb991618a2c0e3942f1de",
  measurementId: "G-DCS6Z1X74X"
};

// Reuse the existing app during Vite hot-module reloads.
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)
