import { auth, database } from "../js/firebaseConfig.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Fetch user data from Realtime Database
    const userRef = ref(database, "users/" + user.email.replace(".", ","));
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const userData = snapshot.val();

      document.querySelectorAll(".name").forEach((name) => {
        name.textContent = userData.name || "User";
      });

      document.getElementById("editName").value = userData.name || "";

      document.querySelectorAll(".email").forEach((email) => {
        email.textContent = userData.email;
      });

      document.querySelectorAll(".role").forEach((role) => {
        role.textContent = userData.role || "Member";
      });

      if (userData.profilePicture) {
        document.querySelectorAll(".profilePic").forEach((img) => {
          img.src = userData.profilePicture;
        });
      }
    } else {
      console.log("No user data found.");
    }
  } else {
    if (!window.loggingOut) {
      alert("You must be logged in to view this page.");
      window.location.href = "../html/loginPage.html"; // Redirect if not logged in
    }
  }
});

// Toggle Sidebar Visibility
document.querySelectorAll(".sidebarToggle").forEach((btn) => {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".sidebar").forEach((sidebar) => {
      sidebar.classList.toggle("active");
    });
  });
});

// Edit profile picture function
document.getElementById("editBtn").addEventListener("click", function (e) {
  const newPic = prompt("Enter the URL of your new profile picture:");
  if (newPic) {
    const profilePics = document.getElementsByClassName("profilePic");
    for (let pic of profilePics) {
      pic.src = newPic;
    }
  }
});

// Logout function
document
  .getElementById("logoutBtn")
  .addEventListener("click", async function (e) {
    window.loggingOut = true;
    await signOut(auth);
    sessionStorage.clear();
    alert("You have been logged out.");
    window.location.href = "../html/loginPage.html";
  });
