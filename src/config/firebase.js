import { initializeApp, getApps, getApp } from "firebase/app";
import {
    initializeAuth,
    getAuth,
    getReactNativePersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCMac4bWb_NkmOvguuEyi4-6xJ84zVYCT8",
    authDomain: "drishtiai-2ea73.firebaseapp.com",
    projectId: "drishtiai-2ea73",
    storageBucket: "drishtiai-2ea73.appspot.com",
    messagingSenderId: "775228607462",
    appId: "1:775228607462:web:56b217cde59a6d1066e427",
    measurementId: "G-MCCY8WTQQT"
};

// Initialize Firebase — prevent double-init on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with persistence for React Native
// Use try/catch to handle hot-reload where auth is already initialized
let auth;
try {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
} catch (error) {
    // If auth was already initialized (hot reload), fall back to getAuth
    if (error.code === 'auth/already-initialized') {
        auth = getAuth(app);
    } else {
        // Re-throw unexpected errors
        throw error;
    }
}

// Initialize Firestore
const db = getFirestore(app);

export { auth, db, app };