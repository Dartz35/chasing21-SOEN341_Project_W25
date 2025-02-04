

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getDatabase, ref, set,get } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

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

// const firebaseConfig = {
//   apiKey: "AIzaSyC6Xj8itEem-dRhCI0GtU9Jk5N-eG9_tc0",
//   authDomain: "test-application-b2f24.firebaseapp.com",
//   projectId: "test-application-b2f24",
//   storageBucket: "test-application-b2f24.firebasestorage.app",
//   messagingSenderId: "293642831142",
//   appId: "1:293642831142:web:64874b0278fb66eb85ade7"
// };


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Add event listener to the register button
document.getElementById("submit_register").addEventListener('click', function (e) {
  e.preventDefault(); // Prevent form submission

  // Get email and password values
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const roles = document.getElementById("role").value.trim();
  console.log(email, password, roles);

  createUserWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Signed up 
    console.log(userCredential)
    const user = userCredential.user;
    set(ref(database, 'users/' + email.replace('.', ',')), {
      email: email,
      role: roles,
      id:user.uid 
    })
      .then((res) => {
        console.log(res);
        alert("Registration successful!");
        
      })
      .catch((error) => {
        console.error("Error writing to Firebase Database: ", error);
        alert("Registration failed. Please try again.");
      });

    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    // ..
  });
  // Save user data to Firebase Realtime Database (excluding password)

});



// Event listener for login button
document.getElementById("submit_login").addEventListener("click", function (e) {
  e.preventDefault(); // Prevent form submission

    // Get email and password values from input fields
    const email_login = document.getElementById("email_login").value.trim();
    const password_login = document.getElementById("password_login").value.trim();
  
    // Replace dot in email for Realtime Database reference (since Firebase Realtime Database doesn't allow '.' in keys)
    const emailKey = email_login.replace('.', ',');

    signInWithEmailAndPassword(auth, email_login, password_login)
    .then((userCredential) => {
      // Signed in 
      const user = userCredential.user;
      console.log(user);
      // ...
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
    });

});


// /*
// const login=document.getElementById('submit_login');
// login.addEventListener('click',(event)=>{
//      event.preventDefault();
//      const email=document.getElementById('email').value;
//      const password = document.getElementById("password").value;
//     const auth= getAuth();

//     signInWithEmailAndPassword(auth,email,password)
//     .then((userCredential)=>{
//         alert('login successful','loginMessage');
//         const user=userCredential.user;
//         localStorage.setItem('loggedinUserID',user.uid);
//         alert("I LOVE PAKISTAN!");
//     })
//     .catch((error)=>{
//           const errorCode=error.code;
//           if(errorCode=='auth/invalid-credential'){
//             alert('Incorrect email or password','loginMessage');
//           }else{
//             alert('Account does not exist.','loginMessage');
//           }

//     })
// })
