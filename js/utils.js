
// import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
// import { getDatabase } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
// import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyDebF1-QZrTf6Ad3fycFQrjTq2W9MEpWRQ",
//   authDomain: "chathaven-d181a.firebaseapp.com",
//   projectId: "chathaven-d181a",
//   storageBucket: "chathaven-d181a.firebasestorage.app",
//   messagingSenderId: "885486697811",
//   appId: "1:885486697811:web:b75ebfd796ed23a83675a6",
//   measurementId: "G-D1W5TPK13Q"
// };

// Initialize Firebase
// export const app = initializeApp(firebaseConfig);



import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyC6Xj8itEem-dRhCI0GtU9Jk5N-eG9_tc0",
//   authDomain: "test-application-b2f24.firebaseapp.com",
//   projectId: "test-application-b2f24",
//   storageBucket: "test-application-b2f24.firebasestorage.app",
//   messagingSenderId: "293642831142",
//   appId: "1:293642831142:web:64874b0278fb66eb85ade7"
// };

const firebaseConfig = {
  apiKey: "AIzaSyC6Xj8itEem-dRhCI0GtU9Jk5N-eG9_tc0",
  authDomain: "test-application-b2f24.firebaseapp.com",
  projectId: "test-application-b2f24",
  storageBucket: "test-application-b2f24.firebasestorage.app",
  messagingSenderId: "293642831142",
  appId: "1:293642831142:web:64874b0278fb66eb85ade7"
};


// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
export const forgetPassMailFunc =   sendPasswordResetEmail;
