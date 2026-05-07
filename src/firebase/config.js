import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCqDNzaNqjMNY8QSyiHmgKSXvZ7DaR-KCg",
  authDomain: "cellfinder-17a3e.firebaseapp.com",
  databaseURL: "https://cellfinder-17a3e-default-rtdb.firebaseio.com",
  projectId: "cellfinder-17a3e",
  storageBucket: "cellfinder-17a3e.firebasestorage.app",
  messagingSenderId: "23857370822",
  appId: "1:23857370822:web:72810814129d3a496c69c7",
  measurementId: "G-N4853MMGF0"
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
