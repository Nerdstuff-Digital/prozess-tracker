/* ============================================================
   FIREBASE – Initialisierung & Re-Exports
   Projekt: prozess-tracker-8a35d
   ============================================================ */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey:            "AIzaSyC4IMWh_Er7m0SkGTEaaQ4dEHdhGUzIqIU",
    authDomain:        "prozess-tracker-8a35d.firebaseapp.com",
    projectId:         "prozess-tracker-8a35d",
    storageBucket:     "prozess-tracker-8a35d.firebasestorage.app",
    messagingSenderId: "406909250219",
    appId:             "1:406909250219:web:786bf4614381d1c69225ee"
};

const app = initializeApp(firebaseConfig);

/** Firestore-Instanz */
export const db = getFirestore(app);

/* Firestore-Funktionen weiterexportieren,
   damit andere Module nur aus ./firebase.js importieren müssen */
export {
    collection,
    addDoc,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
};
