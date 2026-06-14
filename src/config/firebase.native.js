import { initializeApp, getApps, getApp } from "firebase/app";
import {
    initializeAuth,
    getAuth,
    getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { firebaseConfig } from "./firebaseConfig";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;
try {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
    });
} catch (error) {
    if (error.code === "auth/already-initialized") {
        auth = getAuth(app);
    } else {
        throw error;
    }
}

const db = getFirestore(app);

export { auth, db, app };
