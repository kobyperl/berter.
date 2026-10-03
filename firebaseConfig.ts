
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC8b2B9twtEvjNW9W6yF8MriqAICyd0F64",
  authDomain: "barter-app-final.firebaseapp.com",
  projectId: "barter-app-final",
  storageBucket: "barter-app-final.firebasestorage.app",
  messagingSenderId: "376228645270",
  appId: "1:376228645270:web:d048f54c13a280051db5b7",
  measurementId: "G-7BB9BSYYRZ" // Updated to match your server value
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export const analytics = typeof window !== 'undefined' ? firebase.analytics() : null;

export default firebase;
