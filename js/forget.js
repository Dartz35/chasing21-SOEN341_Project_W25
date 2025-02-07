import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDebF1-QZrTf6Ad3fycFQrjTq2W9MEpWRQ",
  authDomain: "chathaven-d181a.firebaseapp.com",
  projectId: "chathaven-d181a",
  storageBucket: "chathaven-d181a.firebasestorage.app",
  messagingSenderId: "885486697811",
  appId: "1:885486697811:web:b75ebfd796ed23a83675a6",
  measurementId: "G-D1W5TPK13Q"
};


// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);

document.getElementById("submit_forgot").addEventListener("click", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email_forgot").value;
    console.log(email);

    if (!email) {
        alert("Please enter a valid email address.");
        return;
    }

    sendPasswordResetEmail(auth, email)
    .then((result) => {
        console.log(result);
      alert("Password reset email sent! Check your inbox.");
    })
    .catch((error) => {
      console.error("Error sending reset email: ", error);
      alert("Error: " + error.message);
    });
});


