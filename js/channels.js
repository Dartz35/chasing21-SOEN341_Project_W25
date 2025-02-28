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
import { openChannelChat } from "./chatUI.js";

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
function sanitizeEmail(email) {
  return email.replace(/\./g, ",");
}

function unsanitizeEmail(email) {
  return email.replace(/,/g, ".");
}

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

  const channelOwner = currentUserData.name || currentUserData.email || "Unknown";

  try {
    const newchannelRef = push(ref(database, "channels"));
    await set(newchannelRef, {
      id: newchannelRef.key,
      name: channelName,
      owner: channelOwner,
      members: [sanitizeEmail(channelOwner)], // Sanitize the owner's email
    });

    channelNameInput.value = "";
    await fetchchannels();
  } catch (error) {
    console.error("Failed to create Channel:", error);
    alert("Failed to create Channel.");
  }
}

/**
 * Splits channels into two lists:
 * 1. My Channels (where user is owner or in members)
 * 2. All Channels (where user is NOT in members and not owner)
 */
async function fetchchannels() {
  const channelsRef = ref(database, "channels");
  try {
    const snapshot = await get(channelsRef);
    const allChannelsContainer = document.getElementById("allChannelsContainer");
    if (!allChannelsContainer) return;
    allChannelsContainer.innerHTML = "";

    if (!snapshot.exists()) {
      allChannelsContainer.textContent = "No channels exist.";
      return;
    }

    const channelsData = snapshot.val();
    Object.keys(channelsData).forEach((channelId) => {
      const channelInfo = channelsData[channelId];

      // Create channel container
      const channelItemEl = document.createElement("div");
      channelItemEl.classList.add("channel-item");

      // Create and set channel name element
      const channelNameEl = document.createElement("span");
      channelNameEl.classList.add("channel-name");
      channelNameEl.textContent = channelInfo.name || "Untitled channel";

      // Create channel info container
      const channelEnd = document.createElement("div");
      channelEnd.classList.add("channel-end");

      // Create and set channel owner element
      const channelOwnerEl = document.createElement("span");
      channelOwnerEl.classList.add("channel-owner");
      channelOwnerEl.textContent = channelInfo.owner || "Unknown Owner";

      // Create options button (for channel actions)
      const optionsBtn = document.createElement("button");
      optionsBtn.classList.add("options-btn");
      optionsBtn.textContent = "...";
      optionsBtn.addEventListener("click", (event) =>
          showchannelOptions(event, channelInfo)
      );

      // Append owner and options button
      channelEnd.appendChild(channelOwnerEl);
      channelEnd.appendChild(optionsBtn);

      // Always add chat button on every channel
      const chatBtn = document.createElement("button");
      chatBtn.classList.add("chat-btn");
      chatBtn.textContent = "Chat";
      chatBtn.addEventListener("click", () =>
          openChannelChat(channelInfo.id)
      );
      channelEnd.appendChild(chatBtn);

      // Build the channel element
      channelItemEl.appendChild(channelNameEl);
      channelItemEl.appendChild(channelEnd);

      // Append to the single channels container
      allChannelsContainer.appendChild(channelItemEl);
    });
  } catch (error) {
    console.error("Error fetching channels:", error);
  }
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

  const userEmail = currentUserData.email || "";
  const userName = currentUserData.name || "";

  if (
      currentUserData.role === "admin" &&
      (channelInfo.owner === userEmail || channelInfo.owner === userName)
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
    const channelRef = ref(database, "channels/" + channelId);
    const snapshot = await get(channelRef);
    if (!snapshot.exists()) {
      alert("Channel not found.");
      return;
    }
    const channelMembers = snapshot.val().members || [];
    for (const member of channelMembers) {
      const userRef = ref(database, "users/" + member.replace(".", ","));
      const userSnapshot = await get(userRef);
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        const updatedchannels = userData.channels.filter(
            (ch) => ch !== channelId
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
    // Sanitize the email
    const sanitizedEmail = sanitizeEmail(newMemberEmail);

    // Reference to the members array in the channel
    const channelMembersRef = ref(database, `channels/${channelId}/members`);

    // Fetch the current members
    const channelMembersSnap = await get(channelMembersRef);
    const channelMembers = channelMembersSnap.exists() ? channelMembersSnap.val() : [];

    // Check if the user is already a member
    if (channelMembers.includes(sanitizedEmail)) {
      alert("This user is already a member.");
      return;
    }

    // Add the new member to the array
    channelMembers.push(sanitizedEmail);

    // Update the members array in Firebase
    await set(channelMembersRef, channelMembers);

    alert("Member added successfully!");
  } catch (error) {
    console.error("Failed to add member:", error);
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
        `Members: \n${members.map(unsanitizeEmail).join("\n")}\nEnter email to remove:`
    );

    if (!memberToRemove || !members.includes(sanitizeEmail(memberToRemove))) {
      alert("Invalid member email.");
      return;
    }

    const updatedMembers = members.filter((m) => m !== sanitizeEmail(memberToRemove));
    await set(channelMembersRef, updatedMembers);

    alert("Member removed successfully!");
  } catch (error) {
    console.error("Failed to remove member:", error);
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
