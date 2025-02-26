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

        const groupEnd = document.createElement("div");
        groupEnd.classList.add("group-end");

        const groupOwnerEl = document.createElement("span");
        groupOwnerEl.classList.add("group-owner");
        groupOwnerEl.textContent = groupInfo.owner || "Unknown Owner";

        const optionsBtn = document.createElement("button");
        optionsBtn.classList.add("options-btn");
        optionsBtn.addEventListener("click", (event) =>
          showGroupOptions(event, groupInfo)
        );
        optionsBtn.textContent = "...";

        groupEnd.appendChild(groupOwnerEl);
        groupEnd.appendChild(optionsBtn);
        groupItemEl.appendChild(groupNameEl);
        groupItemEl.appendChild(groupEnd);
        groupsContainer.appendChild(groupItemEl);
      });
    } else {
      groupsContainer.textContent = "No groups have been created yet.";
    }
  } catch (error) {
    console.error("Error fetching groups:", error);
  }
}

function generateAdminGroupOptions(dropdown) {
  const deleteGroupBtn = document.createElement("button");
  deleteGroupBtn.classList.add("delete-group-btn");
  deleteGroupBtn.textContent = "Delete Group";

  const addMemberBtn = document.createElement("button");
  addMemberBtn.classList.add("add-member-btn");
  addMemberBtn.textContent = "Add Member";

  const removeMemberBtn = document.createElement("button");
  removeMemberBtn.classList.add("remove-member-btn");
  removeMemberBtn.textContent = "Remove Member";

  dropdown.appendChild(deleteGroupBtn);
  dropdown.appendChild(addMemberBtn);
  dropdown.appendChild(removeMemberBtn);
}

function generateMemberGroupOptions(dropdown) {
  const messageAdminBtn = document.createElement("button");
  messageAdminBtn.classList.add("message-admin-btn");
  messageAdminBtn.textContent = "Message admin";

  dropdown.appendChild(messageAdminBtn);
}

function showGroupOptions(event, groupInfo) {
  // Remove any existing dropdown before creating a new one
  document.querySelectorAll(".group-options").forEach((el) => el.remove());

  // Create dropdown menu
  const dropdown = document.createElement("div");
  dropdown.classList.add("group-options");

  if (
    currentUserData.role === "admin" &&
    (currentUserData.email === groupInfo.owner ||
      currentUserData.name === groupInfo.owner)
  ) {
    generateAdminGroupOptions(dropdown);
  } else {
    generateMemberGroupOptions(dropdown);
  }

  // Position the dropdown near the button
  const rect = event.target.getBoundingClientRect();
  dropdown.style.position = "absolute";
  dropdown.style.top = `${window.scrollY + rect.bottom}px`;
  dropdown.style.left = `${window.scrollX + rect.left - 75}px`;

  document.body.appendChild(dropdown);

  // Close dropdown when clicking outside
  document.addEventListener("click", function closeDropdown(e) {
    if (!dropdown.contains(e.target) && e.target !== event.target) {
      dropdown.remove();
      document.removeEventListener("click", closeDropdown);
    }
  });
}
