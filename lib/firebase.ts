import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase Web configuration.
// These identifiers are public by design for Firebase Web apps.
const firebaseConfig = {
  apiKey: "AIzaSyCBeMaPJaPl-J6wNGKIJadmUYntltpvfRI",
  authDomain: "nexfin---casal.firebaseapp.com",
  databaseURL: "https://nexfin---casal-default-rtdb.firebaseio.com",
  projectId: "nexfin---casal",
  storageBucket: "nexfin---casal.firebasestorage.app",
  messagingSenderId: "1083047179561",
  appId: "1:1083047179561:web:73e37e08030d6fe6a57338",
};

export const firebaseConfigured = true;

export function getFirebaseServices() {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
  };
}
