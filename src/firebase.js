import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCbo-rYz1f5g-lyVGNj_54Qs-wKiGN3sG0",
  authDomain: "ai-mind-attendance.firebaseapp.com",
  projectId: "ai-mind-attendance",
  storageBucket: "ai-mind-attendance.firebasestorage.app",
  messagingSenderId: "302514772314",
  appId: "1:302514772314:web:fd961118311510383abb63",
  measurementId: "G-BS14MY0978"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export default app;