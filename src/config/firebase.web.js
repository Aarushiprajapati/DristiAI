import { initializeApp, getApps, getApp } from "firebase/app";
import {
    browserLocalPersistence,
    getAuth,
    initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;
try {
    auth = initializeAuth(app, {
        persistence: browserLocalPersistence,
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
