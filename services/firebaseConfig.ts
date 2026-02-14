import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your actual Firebase config from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAK58kOY2XPiCW0FNBYc9CPoz-FtMXJTsc",
  authDomain: "savvysave-4f9cc.firebaseapp.com",
  projectId: "savvysave-4f9cc",
  storageBucket: "savvysave-4f9cc.firebasestorage.app",
  messagingSenderId: "692117625129",
  appId: "1:692117625129:web:0b24172a735d9f3c83ff38",
  measurementId: "G-B8WXRM3SVP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
