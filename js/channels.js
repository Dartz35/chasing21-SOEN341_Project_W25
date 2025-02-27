import { auth, database } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  ref,
  get,
  set,
  push,
  update,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { fetchProfileData } from "./pageLoading.js";

let currentUserData = {};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUserData = await fetchProfileData(user);
    await fetchchannels();
  } else {
    if (!window.loggingOut) {
      alert("You must be logged in to view this page.");
      window.location.href = "../html/loginPage.html";
    }
  }
});

const createchannelBtn = document.getElementById("createchannelBtn");
if (createchannelBtn) {
  createchannelBtn.addEventListener("click", createchannel);
}

async function createchannel() {
  const channelNameInput = document.getElementById("channelName");
  const channelName = channelNameInput ? channelNameInput.value.trim() : "";
  if (!channelName) {
    alert("Please enter a channel name.");
    return;
  }
  const channelOwner =
    currentUserData.name || currentUserData.email || "Unknown";
  try {
    const newchannelRef = push(ref(database, "channels"));
    await set(newchannelRef, {
      id: newchannelRef.key,
      name: channelName,
      owner: channelOwner,
    });
    channelNameInput.value = "";
    await fetchchannels();
  } catch (error) {
    alert("Failed to create Channel. Check console for details.");
  }
}

async function fetchchannels() {
  const channelsRef = ref(database, "channels");
  try {
    const snapshot = await get(channelsRef);
    const channelsContainer = document.getElementById("channelsContainer");
    if (!channelsContainer) return;
    channelsContainer.innerHTML = "";
    if (snapshot.exists()) {
      const channelsData = snapshot.val();
      Object.keys(channelsData).forEach((channelId) => {
        const channelInfo = channelsData[channelId];
        const channelItemEl = document.createElement("div");
        channelItemEl.classList.add("channel-item");
        const channelNameEl = document.createElement("span");
        channelNameEl.classList.add("channel-name");
        channelNameEl.textContent = channelInfo.name || "Untitled channel";
        const channelEnd = document.createElement("div");
        channelEnd.classList.add("channel-end");
        const channelOwnerEl = document.createElement("span");
        channelOwnerEl.classList.add("channel-owner");
        channelOwnerEl.textContent = channelInfo.owner || "Unknown Owner";
        const optionsBtn = document.createElement("button");
        optionsBtn.classList.add("options-btn");
        optionsBtn.addEventListener("click", (event) =>
          showchannelOptions(event, channelInfo)
        );
        optionsBtn.textContent = "...";
        channelEnd.appendChild(channelOwnerEl);
        channelEnd.appendChild(optionsBtn);
        channelItemEl.appendChild(channelNameEl);
        channelItemEl.appendChild(channelEnd);
        channelsContainer.appendChild(channelItemEl);
      });
    } else {
      channelsContainer.textContent = "No channels have been created yet.";
    }
  } catch (error) {}
}

function generateAdminchannelOptions(dropdown, channelInfo) {
  const deletechannelBtn = document.createElement("button");
  deletechannelBtn.classList.add("delete-channel-btn");
  deletechannelBtn.textContent = "Delete Channel";
  deletechannelBtn.addEventListener("click", () =>
    deletechannel(channelInfo.id)
  );
  const addMemberBtn = document.createElement("button");
  addMemberBtn.classList.add("add-member-btn");
  addMemberBtn.textContent = "Add Member";
  addMemberBtn.addEventListener("click", () => addMember(channelInfo.id));
  const removeMemberBtn = document.createElement("button");
  removeMemberBtn.classList.add("remove-member-btn");
  removeMemberBtn.textContent = "Remove Member";
  removeMemberBtn.addEventListener("click", () => removeMember(channelInfo.id));
  dropdown.appendChild(deletechannelBtn);
  dropdown.appendChild(addMemberBtn);
  dropdown.appendChild(removeMemberBtn);
}

function generateMemberchannelOptions(dropdown) {
  const messageAdminBtn = document.createElement("button");
  messageAdminBtn.classList.add("message-admin-btn");
  messageAdminBtn.textContent = "Message admin";
  dropdown.appendChild(messageAdminBtn);
}

function showchannelOptions(event, channelInfo) {
  document.querySelectorAll(".channel-options").forEach((el) => el.remove());
  const dropdown = document.createElement("div");
  dropdown.classList.add("channel-options");
  if (
    currentUserData.role === "admin" &&
    (currentUserData.email === channelInfo.owner ||
      currentUserData.name === channelInfo.owner)
  ) {
    generateAdminchannelOptions(dropdown, channelInfo);
  } else {
    generateMemberchannelOptions(dropdown);
  }
  const rect = event.target.getBoundingClientRect();
  dropdown.style.position = "absolute";
  dropdown.style.top = `${window.scrollY + rect.bottom}px`;
  dropdown.style.left = `${window.scrollX + rect.left - 75}px`;
  document.body.appendChild(dropdown);
  document.addEventListener("click", function closeDropdown(e) {
    if (!dropdown.contains(e.target) && e.target !== event.target) {
      dropdown.remove();
      document.removeEventListener("click", closeDropdown);
    }
  });
}

async function deletechannel(channelId) {
  if (!confirm("Are you sure you want to delete this channel?")) return;
  try {
    const channelRef = ref(database, `channels/${channelId}`);
    const channelSnapshot = await get(channelRef);
    if (!channelSnapshot.exists()) {
      alert("Channel not found.");
      return;
    }
    const channelMembers = channelSnapshot.val().members || [];
    for (const member of channelMembers) {
      const userRef = ref(database, "users/" + member.replace(".", ","));
      const userSnapshot = await get(userRef);
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        const updatedchannels = userData.channels.filter(
          (channel) => channel !== channelId
        );
        await update(userRef, { channels: updatedchannels });
      }
    }
    await set(channelRef, null);
    alert("channel deleted successfully!");
    await fetchchannels();
  } catch (error) {
    alert("Failed to delete channel.");
  }
}

async function addMember(channelId) {
  const newMemberEmail = prompt("Enter the email of the member to add:");
  if (!newMemberEmail) return;
  try {
    const channelMembersRef = ref(database, `channels/${channelId}/members`);
    const userRef = ref(database, "users/" + newMemberEmail.replace(".", ","));
    const userSnapshot = await get(userRef);
    if (!userSnapshot.exists()) {
      alert("User not found.");
      return;
    }
    let userData = userSnapshot.val();
    const channelMembersSnapshot = await get(channelMembersRef);
    const channelMembers = channelMembersSnapshot.exists()
      ? channelMembersSnapshot.val()
      : [];
    if (channelMembers.includes(newMemberEmail)) {
      alert("This user is already a member.");
      return;
    }
    channelMembers.push(newMemberEmail);
    await set(channelMembersRef, channelMembers);
    const updatedchannels = userData.channels
      ? [...userData.channels, channelId]
      : [channelId];
    await update(userRef, { channels: updatedchannels });
    alert("Member added successfully!");
  } catch (error) {
    alert("Failed to add member.");
  }
}

async function removeMember(channelId) {
  try {
    const channelMembersRef = ref(database, `channels/${channelId}/members`);
    const snapshot = await get(channelMembersRef);
    if (!snapshot.exists()) {
      alert("No members found in this channel.");
      return;
    }
    const members = snapshot.val();
    const memberToRemove = prompt(
      `Members: \n${members.join("\n")}\nEnter email to remove:`
    );
    if (!memberToRemove || !members.includes(memberToRemove)) {
      alert("Invalid member email.");
      return;
    }
    const updatedMembers = members.filter((email) => email !== memberToRemove);
    await set(channelMembersRef, updatedMembers);
    const userRef = ref(database, "users/" + memberToRemove.replace(".", ","));
    const userSnapshot = await get(userRef);
    if (!userSnapshot.exists()) {
      alert("User not found.");
      return;
    }
    const userData = userSnapshot.val();
    const updatedchannels = userData.channels.filter(
      (channel) => channel !== channelId
    );
    await update(userRef, { channels: updatedchannels });
    alert("Member removed successfully!");
  } catch (error) {
    alert("Failed to remove member.");
  }
}

async function createGroupChat(members, lastMessage, senderID) {
  const groupChatsRef = ref(database, "groupChats");
  const newChatRef = push(groupChatsRef);
  const chatId = newChatRef.key;
  const updatedDate = new Date().toISOString();
  await set(newChatRef, {
    chatId,
    lastMessage,
    members,
    senderID,
    updatedDate,
  });
}
