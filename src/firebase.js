// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyByFg8PbpHHd9M740VW3pQUNaPoiDORfrA",
  authDomain: "supoida-252d9.firebaseapp.com",
  projectId: "supoida-252d9",
  storageBucket: "supoida-252d9.firebasestorage.app",
  messagingSenderId: "786449604231",
  databaseURL: "https://supoida-252d9-default-rtdb.asia-southeast1.firebasedatabase.app",
  appId: "1:786449604231:web:b89ee9f9e5dd10d7e62222"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);