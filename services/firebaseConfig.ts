import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC8b2B9twtEvjNW9W6yF8MriqAICyd0F64",
  authDomain: "barter-app-final.firebaseapp.com",
  projectId: "barter-app-final",
  storageBucket: "barter-app-final.firebasestorage.app",
  messagingSenderId: "376228645270",
  appId: "1:376228645270:web:d048f54c13a280051db5b7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);