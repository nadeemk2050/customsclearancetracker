// Firebase SDK configuration for ccTracker (CustomsClearanceTracker)
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";

// Web app's Firebase configuration for ccTracker
const firebaseConfig = {
  apiKey: "AIzaSyCSGD0azTq-phfaLb1QdnxLdyTw2WxJS2U",
  authDomain: "proformatracker.firebaseapp.com",
  databaseURL: "https://proformatracker-default-rtdb.firebaseio.com",
  projectId: "proformatracker",
  storageBucket: "proformatracker.firebasestorage.app",
  messagingSenderId: "238786517300",
  appId: "1:238786517300:web:cfe522570deb85bd79ed61",
  measurementId: "G-1NVW6SQK4F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Analytics conditionally (safely handles environments where analytics isn't supported)
let analytics = null;
if (typeof window !== "undefined") {
  isAnalyticsSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics not supported in this environment
  });
}

// Dedicated collection name to guarantee 100% data isolation from other apps
export const CCT_COLLECTION = "cct_shipments";
export const CCT_SETTINGS_COLLECTION = "cct_settings";

export { 
  app, 
  db, 
  analytics, 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
};
