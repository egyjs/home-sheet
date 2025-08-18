// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCb8epf_gT0rSXRqKNxfvpJqmKk1VHDKdE",
  authDomain: "fr1endly-chat.firebaseapp.com",
  databaseURL: "https://fr1endly-chat.firebaseio.com",
  projectId: "fr1endly-chat",
  storageBucket: "fr1endly-chat.appspot.com",
  messagingSenderId: "1038789332255",
  appId: "1:1038789332255:web:8ade5e56a3003b57a7b42a",
  measurementId: "G-KXH4HF2H7R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
export default app;
