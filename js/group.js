// group.js

import { auth, database } from "../js/firebaseConfig.js";
import {
  onAuthStateChanged,
  EmailAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  ref,
  get,
  set,
  update,
  push,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/**
 * Replaces '.' in email to ',' because '.' is not allowed in Firebase keys.
 */
function getUserKey(email) {
  return email.replace(/\./g, ",");
}

/** GLOBAL variable to store user data, so we can refer to it when creating groups. */
let currentUserData = {};

/**
 * Check if user is logged in; if not, redirect to login page.
 * If logged in, fetch profile data and group data.
 */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Fetch user data
    await fetchProfileData(user);

    // Fetch and display existing groups for everyone (admin or not)
    await fetchGroups();
  } else {
    // No user is logged in; redirect to login page.
    if (!window.loggingOut) {
      alert("You must be logged in to view this page.");
      window.location.href = "../html/loginPage.html";
    }
  }
});

/**
 * Fetch user data from the Realtime Database
 */
async function fetchProfileData(user) {
  const userKey = getUserKey(user.email);
  const userRef = ref(database, "users/" + userKey);

  try {
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const userData = snapshot.val();
      currentUserData = userData; // Store for later use

      // Update UI with user data
      updateNameUI(userData.name);
      updateEmailUI(userData.email);
      updateRoleUI(userData.role);
      // If you have a function to display profile picture, call it here:
      // updateProfilePictureUI(userData.profilePicture);
    } else {
      updateNameUI("Profile not found");
      updateRoleUI(""); // default to "Member"
    }
  } catch (error) {
    console.error("Error fetching profile data: " + error);
  }
}

/**
 * Update the displayed name in the UI
 */
function updateNameUI(newName) {
  const userNameEl = document.getElementById("userName");
  if (userNameEl) {
    userNameEl.textContent = newName || "Unknown";
  }
}

/**
 * Update the displayed email in the UI
 */
function updateEmailUI(newEmail) {
  const userEmailEl = document.getElementById("userEmail");
  if (userEmailEl) {
    userEmailEl.textContent = newEmail || "";
  }
}

/**
 * Update the user's role in the UI and conditionally
 * show/hide the "Create Group" section if the user is an admin.
 */
function updateRoleUI(newRole) {
  const userRoleEl = document.getElementById("userRole");
  if (userRoleEl) {
    userRoleEl.textContent = newRole || "Member";
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

/**
 * Attach event listener to "Create Group" button (only needed if the section is visible)
 */
const createGroupBtn = document.getElementById("createGroupBtn");
if (createGroupBtn) {
  createGroupBtn.addEventListener("click", createGroup);
}

/**
 * Create a new group in the database.
 * Only an admin can see the "Create Group" section, so this is effectively admin-only.
 */
async function createGroup() {
  const groupNameInput = document.getElementById("groupName");
  const groupName = groupNameInput ? groupNameInput.value.trim() : "";

  if (!groupName) {
    alert("Please enter a group name.");
    return;
  }

  // Gather owner info from current user data; fallback to user email if no name is set
  const groupOwner = currentUserData.name || currentUserData.email || "Unknown";

  try {
    // Generate a new key for the group
    const newGroupRef = push(ref(database, "groups"));
    await set(newGroupRef, {
      name: groupName,
      owner: groupOwner,
    });

    // Clear input
    groupNameInput.value = "";

    // Refresh the group list to show the newly created group
    await fetchGroups();
  } catch (error) {
    console.error("Error creating group:", error);
    alert("Failed to create group. Check console for details.");
  }
}

/**
 * Fetch all groups from the database and display them.
 * Visible to everyone (admin or not).
 */
async function fetchGroups() {
  const groupsRef = ref(database, "groups");

  try {
    const snapshot = await get(groupsRef);
    const groupsContainer = document.getElementById("groupsContainer");
    if (!groupsContainer) return;

    // Clear existing content
    groupsContainer.innerHTML = "";

    if (snapshot.exists()) {
      const groupsData = snapshot.val();
      // groupsData is an object with keys = group IDs, values = { name, owner }

      // Convert groupsData to an array if desired, or just iterate over keys
      Object.keys(groupsData).forEach((groupId) => {
        const groupInfo = groupsData[groupId];

        // Create a group-item div
        const groupItemEl = document.createElement("div");
        groupItemEl.classList.add("group-item");

        // Left side: group name
        const groupNameEl = document.createElement("span");
        groupNameEl.classList.add("group-name");
        groupNameEl.textContent = groupInfo.name || "Untitled Group";

        // Right side: group owner
        const groupOwnerEl = document.createElement("span");
        groupOwnerEl.classList.add("group-owner");
        groupOwnerEl.textContent = groupInfo.owner || "Unknown Owner";

        // Append children
        groupItemEl.appendChild(groupNameEl);
        groupItemEl.appendChild(groupOwnerEl);

        groupsContainer.appendChild(groupItemEl);
      });
    } else {
      // If no groups exist
      groupsContainer.textContent = "No groups have been created yet.";
    }
  } catch (error) {
    console.error("Error fetching groups:", error);
  }
}
