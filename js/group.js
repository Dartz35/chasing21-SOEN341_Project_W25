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


function getUserKey(email) {
  return email.replace(/\./g, ",");
}

let currentUserData = {};


onAuthStateChanged(auth, async (user) => {
  if (user) {
    await fetchProfileData(user);

    await fetchGroups();
  } else {
    if (!window.loggingOut) {
      alert("You must be logged in to view this page.");
      window.location.href = "../html/loginPage.html";
    }
  }
});

async function fetchProfileData(user) {
  const userKey = getUserKey(user.email);
  const userRef = ref(database, "users/" + userKey);

  try {
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const userData = snapshot.val();
      currentUserData = userData; // Store for later use

      updateNameUI(userData.name);
      updateEmailUI(userData.email);
      updateRoleUI(userData.role);
    } else {
      updateNameUI("Profile not found");
      updateRoleUI(""); // default to "Member"
    }
  } catch (error) {
    console.error("Error fetching profile data: " + error);
  }
}

function updateNameUI(newName) {
  const userNameEl = document.getElementById("userName");
  if (userNameEl) {
    userNameEl.textContent = newName || "Unknown";
  }
}

function updateEmailUI(newEmail) {
  const userEmailEl = document.getElementById("userEmail");
  if (userEmailEl) {
    userEmailEl.textContent = newEmail || "";
  }
}

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

const createGroupBtn = document.getElementById("createGroupBtn");
if (createGroupBtn) {
  createGroupBtn.addEventListener("click", createGroup);
}

async function createGroup() {
  const groupNameInput = document.getElementById("groupName");
  const groupName = groupNameInput ? groupNameInput.value.trim() : "";

  if (!groupName) {
    alert("Please enter a group name.");
    return;
  }

  const groupOwner = currentUserData.name || currentUserData.email || "Unknown";

  try {
    const newGroupRef = push(ref(database, "groups"));
    await set(newGroupRef, {
      name: groupName,
      owner: groupOwner,
    });

    groupNameInput.value = "";

    await fetchGroups();
  } catch (error) {
    console.error("Error creating group:", error);
    alert("Failed to create group. Check console for details.");
  }
}

async function fetchGroups() {
  const groupsRef = ref(database, "groups");

  try {
    const snapshot = await get(groupsRef);
    const groupsContainer = document.getElementById("groupsContainer");
    if (!groupsContainer) return;

    groupsContainer.innerHTML = "";

    if (snapshot.exists()) {
      const groupsData = snapshot.val();

      Object.keys(groupsData).forEach((groupId) => {
        const groupInfo = groupsData[groupId];

        const groupItemEl = document.createElement("div");
        groupItemEl.classList.add("group-item");

        const groupNameEl = document.createElement("span");
        groupNameEl.classList.add("group-name");
        groupNameEl.textContent = groupInfo.name || "Untitled Group";

        const groupOwnerEl = document.createElement("span");
        groupOwnerEl.classList.add("group-owner");
        groupOwnerEl.textContent = groupInfo.owner || "Unknown Owner";

        groupItemEl.appendChild(groupNameEl);
        groupItemEl.appendChild(groupOwnerEl);

        groupsContainer.appendChild(groupItemEl);
      });
    } else {
      groupsContainer.textContent = "No groups have been created yet.";
    }
  } catch (error) {
    console.error("Error fetching groups:", error);
  }
}
