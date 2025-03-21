import { auth, database } from "./firebaseConfig.js";
import {
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// Check if user is logged in
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await fetchProfileData(user);
    const userStatusRef = ref(database, "status/" + user.uid);
    await update(userStatusRef, { state: "online", lastChanged: Date.now() });
    onDisconnect(userStatusRef).set({
      state: "offline",
      lastChanged: Date.now(),
    });
    trackUserInactivity(user);
  } else {
    if (!window.loggingOut) {
      alert("You must be logged in to view this page.");
      window.location.href = "../html/loginPage.html"; // Redirect if not logged in
    }
  }
});
let inactivityTimer;

function trackUserInactivity(user) {
  const userStatusRef = ref(database, "status/" + user.uid);

  function resetTimer() {
    clearTimeout(inactivityTimer);
    update(userStatusRef, { state: "online", lastChanged: Date.now() });

    inactivityTimer = setTimeout(() => {
      update(userStatusRef, { state: "away", lastChanged: Date.now() });
    }, 600000); // 1-minute inactivity threshold
  }

  document.addEventListener("mousemove", resetTimer);
  document.addEventListener("keydown", resetTimer);

  resetTimer(); // Initialize timer
}

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
      element.value = newRole || "user";
      continue;
    }
    element.textContent = newRole || "user";
  }

  // Show or hide sections
  const adminSections = document.getElementsByClassName("admin");
  for (let element of adminSections) {
    if (newRole === "admin") {
      element.style.display = "block";
    } else {
      element.style.display = "none";
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
