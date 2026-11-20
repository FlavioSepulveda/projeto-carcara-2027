import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDtOJu2vTdr-0K9YLJzWREzn77e1DbpZzE",
  authDomain: "carcara-the.firebaseapp.com",
  projectId: "carcara-the",
  storageBucket: "carcara-the.firebasestorage.app",
  messagingSenderId: "520089971929",
  appId: "1:520089971929:web:e9f2ccc6cdc15aff62a2c8",
  measurementId: "G-WK5KJ7Z09S"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const firestore = getFirestore(app);
export const storage = getStorage(app);