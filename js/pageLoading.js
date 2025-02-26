import { auth, database } from "./firebaseConfig.js";
import {
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

// Fetch user data from Realtime Database
async function fetchProfileData(user) {
  const userRef = ref(database, "users/" + user.email.replace(".", ","));
  const snapshot = await get(userRef);
  let userData = {};

  if (snapshot.exists()) {
    userData = snapshot.val();

    // Update UI with user data
    updateNameUI(userData.name);
    updateEmailUI(userData.email);
    updateRoleUI(userData.role);
    updateProfilePictureUI(userData.profilePicture);
  } else {
    console.log("No user data found.");
  }
  return userData;
}

// Updates the name
function updateNameUI(newName) {
  const names = document.getElementsByClassName("name");

  for (let element of names) {
    if (element.tagName === "INPUT") {
      element.value = newName;
      continue;
    }
    element.textContent = newName;
  }
}

// Updates the email
function updateEmailUI(newEmail) {
  const emails = document.getElementsByClassName("email");

  for (let element of emails) {
    if (element.tagName === "INPUT") {
      element.value = newEmail;
      continue;
    }
    element.textContent = newEmail;
  }
}

// Updates the role
function updateRoleUI(newRole) {
  const roles = document.getElementsByClassName("role");

  for (let element of roles) {
    if (element.tagName === "INPUT") {
      element.value = newRole || "Member";
      continue;
    }
    element.textContent = newRole || "Member";
  }

  // Show or hide create group section based on role
  const createGroupSection = document.getElementById("createGroupSection");
  if (createGroupSection) {
    if (newRole === "admin") {
      createGroupSection.style.display = "block";
    } else {
      createGroupSection.style.display = "none";
    }
  }
}

// Updates the profile picture
function updateProfilePictureUI(newProfilePicture) {
  const profilePictures = document.getElementsByClassName("profilePic");
  for (let element of profilePictures) {
    element.src = newProfilePicture || "../images/defaultUserLogo.png";
  }
}

export {
  fetchProfileData,
  updateNameUI,
  updateEmailUI,
  updateRoleUI,
  updateProfilePictureUI,
};
