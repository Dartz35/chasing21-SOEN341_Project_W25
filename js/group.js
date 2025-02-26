// group.js

import { auth, database } from "../js/firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  ref,
  get,
  set,
  push,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

import { fetchProfileData } from "./pageLoading.js";

let currentUserData = {};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUserData = await fetchProfileData(user);
    await fetchGroups();
  } else {
    if (!window.loggingOut) {
      alert("You must be logged in to view this page.");
      window.location.href = "../html/loginPage.html";
    }
  }
});

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
