

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getDatabase, ref, set , get} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

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
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);


document.getElementById("email_login").addEventListener("input", function () {
  this.style.color = "white"; // Change text color while typing
  
});
document.getElementById("password_login").addEventListener("input", function () {
  this.style.color = "white"; // Change text color while typing
  
});

document.getElementById("email").addEventListener("input", function () {
  this.style.color = "white"; // Change text color while typing
  
});
document.getElementById("password").addEventListener("input", function () {
  this.style.color = "white"; // Change text color while typing
  
});
// Add event listener to the register button
document.getElementById("submit_register").addEventListener('click', function (e) { 
  e.preventDefault(); // Prevent form submission

  // Get email, password, and role values
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const role = document.getElementById("role").value;

  // Check if a valid role is selected
  if (role === "") {  // Default option has an empty value (""), not "--Choose Role--"
    alert("Please select a role!"); // Display error message
    return; // Stop execution
  }

  // Proceed with Firebase data saving
  set(ref(database, 'users/' + email.replace('.', ',')), {
    email: email,
    password: password,
    role: role
  })
  .then(() => {
    alert("Registration successful!");
  })
  .catch((error) => {
    console.error("Error writing to Firebase Database: ", error);
    alert("Registration failed. Please try again.");
  });
});




// Event listener for login button
document.getElementById("submit_login").addEventListener("click", function (e) {
  e.preventDefault(); // Prevent form submission

    // Get email and password values from input fields
    const email_login = document.getElementById("email_login").value.trim();
    const password_login = document.getElementById("password_login").value.trim();
  
    // Replace dot in email for Realtime Database reference (since Firebase Realtime Database doesn't allow '.' in keys)
    const emailKey = email_login.replace('.', ',');
  
    // Get a reference to the user's data in the Realtime Database
    const userRef = ref(database, 'users/' + emailKey);
  
    // Fetch the data
    get(userRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          // Check if password matches
          if (userData.password === password_login) {
            console.log("Login successful:", userData);
            alert("Welcome, " + userData.email + "!");
          } else {
            alert("Error: Incorrect password.");
          }
        } else {
          alert("Error: No user found with this email.");
        }
      })
      .catch((error) => {
        console.error("Error during login: ", error);
        alert("Error: Could not log in. Please try again.");
      });
});

/*
const login=document.getElementById('submit_login');
login.addEventListener('click',(event)=>{
     event.preventDefault();
     const email=document.getElementById('email').value;
     const password = document.getElementById("password").value;
    const auth= getAuth();

    signInWithEmailAndPassword(auth,email,password)
    .then((userCredential)=>{
        showMessage('login successful','loginMessage');
        const user=userCredential.user;
        localStorage.setItem('loggedinUserID',user.uid);
        alert("I LOVE PAKISTAN!");
    })
    .catch((error)=>{
          const errorCode=error.code;
          if(errorCode=='auth/invalid-credential'){
            showMessage('Incorrect email or password','loginMessage');
          }else{
            showMessage('Account does not exist.','loginMessage');
          }

    })
})*/
