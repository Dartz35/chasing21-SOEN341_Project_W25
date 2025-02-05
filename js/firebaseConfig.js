// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDebF1-QZrTf6Ad3fycFQrjTq2W9MEpWRQ",
  authDomain: "chathaven-d181a.firebaseapp.com",
  projectId: "chathaven-d181a",
  storageBucket: "chathaven-d181a.firebasestorage.app",
  messagingSenderId: "885486697811",
  appId: "1:885486697811:web:b75ebfd796ed23a83675a6",
  measurementId: "G-D1W5TPK13Q",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export { app, database, auth };
