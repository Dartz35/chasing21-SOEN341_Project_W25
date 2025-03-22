import { auth } from "./firebaseConfig.js";
import { sendPasswordResetEmail } from "firebase/auth";

document
  .getElementById("submit_forgot")
  .addEventListener("click", async function (e) {
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
