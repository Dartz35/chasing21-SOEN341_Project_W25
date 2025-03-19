import { auth, database } from "../js/firebaseConfig.js";
import {
  ref,
  set,
  get,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

export const db = getFirestore(app);

// Function to add input color change (reused for clarity)
function addInputColorChangeListener(inputId) {
    const inputElement = document.getElementById(inputId);
    if (inputElement) {
        inputElement.addEventListener("input", function () {
            this.style.color = "white";
        });
    }
}

addInputColorChangeListener("email_login");
addInputColorChangeListener("password_login");
addInputColorChangeListener("email");
addInputColorChangeListener("password");
addInputColorChangeListener("name"); // Added for name field

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

        // Client-side validation
        if (name === "") {
            alert("Please enter your name.");
            return;
        }
        if (email === "") {
            alert("Please enter your email address.");
            return;
        }
        if (!isValidEmail(email)) {
            alert("Please enter a valid email address.");
            return;
        }
        if (password === "") {
            alert("Please enter a password.");
            return;
        }
        if (password.length < 6) {
            alert("Password must be at least 6 characters long.");
            return;
        }
        if (role === "") {
            alert("Please select a role!");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            const user = userCredential.user;

            // Save user data to Realtime Database
            try {
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
            } catch (dbError) {
                console.error("Database Error:", dbError);
                alert("Error saving user data: " + dbError.message);
                // Optionally, you might want to delete the Firebase user if database write fails
                // await user.delete();
            }

        } catch (error) {
            console.error("Registration Error:", error); // Log the entire error object
            let errorMessage = "Registration failed. Please try again.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "This email address is already in use.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Please enter a valid email address.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Password must be at least 6 characters long.";
            }
            alert("Error: " + errorMessage);
        }
    });

// Basic email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Event listener for login button (no changes made here as the issue is with registration)
document
    .getElementById("submit_login")
    .addEventListener("click", async function (e) {
        e.preventDefault(); // Prevent form submission (if using a form)

    // Get email and password values from input fields
    const email_login = document.getElementById("email_login").value.trim();
    const password_login = document
      .getElementById("password_login")
      .value.trim();
    const emailKey = email_login.replace(".", ",");

    // Get a reference to the user's data in the Realtime Database
    const userRef = ref(database, "users/" + emailKey);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email_login,
        password_login
      );
      const user = userCredential.user;

            sessionStorage.setItem("email", user.email);

      console.log("Login successful:", user.displayName);

      // get name of loged in user
      get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          // Check if password matches
          // document.getElementById("currentUser").innerHTML = "New Text Changed with JavaScript!";
          sessionStorage.setItem("username", userData.name);
          sessionStorage.setItem("currentID", userData.id); // store the id of the current user that is logged in
          console.log("Login successful:", userData.name);
          alert("Welcome, " + userData.name + "!");
          document.getElementById("currentUser").innerHTML =
            "New Text Changed with JavaScript!";
        } else {
          alert("Error: No user found with this email.");
        }
      });

            // Redirect to HomePage.html
            setTimeout(function () {
                window.location.href = "../html/HomePage.html";
            }, 100);
        } catch (error) {
            console.error("Error during login: ", error.message);
            alert("Error: " + error.message);
        }
    });