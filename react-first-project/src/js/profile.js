// Contains the code for all profile-related functions

import { auth, database } from "../js/firebaseConfig.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  ref,
  get,
  update,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import {
  fetchProfileData,
  updateNameUI,
  updateProfilePictureUI,
} from "../js/pageLoadingUtils.js";

// Check if user is logged in
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await fetchProfileData(user); // Fetch user data if logged in
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
    document.getElementById("sidebar").classList.toggle("active");
  });
});

// Toggle Edit Profile Visibility
document.querySelectorAll(".toggleEditProfile").forEach((btn) => {
  btn.addEventListener("click", function (e) {
    const editProfile = document.getElementById("editProfile");
    const sidebar = document.getElementById("sidebar").classList;

    sidebar.toggle("active");
    editProfile.hidden = !editProfile.hidden;
  });
});

/*
//Setting function
document.querySelectorAll(".toggleSettings").forEach((btn) => {
  btn.addEventListener("click", function (e) {
    const settings = document.getElementById("settings");
    const sidebar = document.getElementById("sidebar").classList;
    sidebar.toggle("active");
    settings.hidden = !settings.hidden;
  });
});*/

// Validates the new name of the user
document
  .getElementById("confirmName")
  .addEventListener("click", async function (e) {
    e.preventDefault();
    const newName = document.getElementById("editName").value.trim();
    const user = auth.currentUser;

    if (user) {
      const userRef = ref(database, "users/" + user.email.replace(".", ","));
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val();

        if (newName) {
          // Check if the new name is different from the old name
          // If it is, update database and UI
          if (newName != userData.name) {
            await update(userRef, {
              name: newName,
            });
            updateNameUI(newName);
            alert("Name updated successfully!");
          }
        } else {
          alert("Name cannot be empty.");
          document.getElementById("editName").value = userData.name; // Reset to previous name
        }
      }
    } else {
      alert("Please log in to change your name");
      window.location.href = "../html/loginPage.html"; // Redirect if not logged in
    }
  });

// Confirm email change function
/*
document
  .getElementById("confirmEmail")
  .addEventListener("click", async function () {
    const newEmail = document.getElementById("editEmail").value.trim();
    const user = auth.currentUser;

    if (user) {
      const userRef = ref(database, "users/" + user.email.replace(".", ","));
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();

        if (newEmail) {
          if (newEmail != userData.email) {
            await update(userRef, {
              email: newEmail,
            });
            updateEmailUI(newEmail);
            alert("Email updated successfully!");
          }
        } else {
          alert("Email cannot be empty.");
        }
      }
    } else {
      alert("Please log in to change your email");
      window.location.href = "../html/loginPage.html";
    }
  });
*/

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

// Delete the current profile picture
document
  .getElementById("deletePic")
  .addEventListener("click", async function () {
    const user = auth.currentUser;
    const userRef = ref(database, "users/" + user.email.replace(".", ","));

    // Update database with empty profile picture
    await update(userRef, {
      profilePicture: "",
    });

    // Update UI with default profile picture
    updateProfilePictureUI("../images/defaultUserLogo.png");
    document.getElementById("newProfilePic").value = null;

    alert("Profile picture deleted successfully!");
    console.log("Profile picture deleted successfully!");
  });

// Change profile picture
document
  .getElementById("newProfilePic")
  .addEventListener("change", function (event) {
    console.log("Triggering change event...");
    const newPic = event.target.files[0]; // Get the first selected file
    const user = auth.currentUser;

    if (user) {
      if (newPic) {
        console.log("File selected: ", newPic.name);

        // Read the file and update the database
        const reader = new FileReader();
        reader.onload = async function (e) {
          const userRef = ref(
            database,
            "users/" + user.email.replace(".", ",")
          );
          await update(userRef, {
            profilePicture: e.target.result,
          });

          // Update UI with new profile picture
          updateProfilePictureUI(e.target.result);
          console.log("Profile picture updated successfully!");
          console.log(e.target.result);
          alert("Profile picture updated successfully!");
        };

        // Read the file as a data URL (convert to base64)
        reader.readAsDataURL(newPic);
      } else {
        alert("No file selected.");
        console.log("No file selected.");
      }
    } else {
      alert("Please log in to change your profile picture");
      window.location.href = "../html/loginPage.html"; // Redirect if not logged in
    }
  });
