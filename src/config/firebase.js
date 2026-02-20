// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCMac4bWb_NkmOvguuEyi4-6xJ84zVYCT8",
    authDomain: "drishtiai-2ea73.firebaseapp.com",
    projectId: "drishtiai-2ea73",
    storageBucket: "drishtiai-2ea73.firebasestorage.app",
    messagingSenderId: "775228607462",
    appId: "1:775228607462:web:56b217cde59a6d1066e427",
    measurementId: "G-MCCY8WTQQT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };