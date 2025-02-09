import { auth, database } from "../js/firebaseConfig.js";
import {
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

document.getElementById("email_login").addEventListener("input", function () {
  this.style.color = "white"; // Change text color while typing
});
document
  .getElementById("password_login")
  .addEventListener("input", function () {
    this.style.color = "white"; // Change text color while typing
  });

document.getElementById("email").addEventListener("input", function () {
  this.style.color = "white"; // Change text color while typing
});
document.getElementById("password").addEventListener("input", function () {
  this.style.color = "white"; // Change text color while typing
});

// Add event listener to the register button
document
  .getElementById("submit_register")
  .addEventListener("click", async function (e) {
    e.preventDefault(); // Prevent form submission

    // Get email and password values
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;

    // Check if a valid role is selected
    if (role === "") {
      // Default option has an empty value (""), not "--Choose Role--"
      alert("Please select a role!"); // Display error message
      return; // Stop execution
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Save user data to Realtime Database
      await set(ref(database, "users/" + email.replace(".", ",")), {
        name: name,
        email: email,
        id: user.uid,
        role: role,
        profilePicture: "", // Default empty
      });

      alert("Registration successful!");
      setTimeout(function () {
        window.location.href = "../html/loginPage.html";
      }, 100);
    } catch (error) {
      console.error("Registration Error:", error.message);
      alert("Error: " + error.message);
    }
  });

// Event listener for login button
document
  .getElementById("submit_login")
  .addEventListener("click", async function (e) {
    e.preventDefault(); // Prevent form submission (if using a form)

    // Get email and password values from input fields
    const email_login = document.getElementById("email_login").value.trim();
    const password_login = document
      .getElementById("password_login")
      .value.trim();

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email_login,
        password_login
      );
      const user = userCredential.user;

      sessionStorage.setItem("email", user.email);

      console.log("Login successful:", user.displayName);
      alert("Welcome, " + user.email + "!");

      // Redirect to HomePage.html
      setTimeout(function () {
        window.location.href = "../html/HomePage.html";
      }, 100);
    } catch (error) {
      console.error("Error during login: ", error.message);
      alert("Error: " + error.message);
    }
  });
