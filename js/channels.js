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

/**
 * Splits channels into two lists:
 * 1. My Channels (where user is owner or in members)
 * 2. All Channels (where user is NOT in members and not owner)
 */
async function fetchchannels() {
  const channelsRef = ref(database, "channels");
  try {
    const snapshot = await get(channelsRef);
    const myChannelsContainer = document.getElementById("myChannelsContainer");
    const allChannelsContainer = document.getElementById("allChannelsContainer");
    if (!myChannelsContainer || !allChannelsContainer) return;

    myChannelsContainer.innerHTML = "";
    allChannelsContainer.innerHTML = "";

    if (!snapshot.exists()) {
      myChannelsContainer.textContent = "You have no channels.";
      allChannelsContainer.textContent = "No other channels exist.";
      return;
    }

    const channelsData = snapshot.val();
    Object.keys(channelsData).forEach((channelId) => {
      const channelInfo = channelsData[channelId];
      const { owner, members } = channelInfo;
      const userEmail = currentUserData.email || "";
      const userName = currentUserData.name || "";

      // If user is the owner or a member, they're "in" the channel
      const inChannel =
          owner === userEmail ||
          owner === userName ||
          (members && members.includes(userEmail)) ||
          (members && members.includes(userName));

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
      optionsBtn.textContent = "...";
      optionsBtn.addEventListener("click", (event) =>
          showchannelOptions(event, channelInfo)
      );

      channelEnd.appendChild(channelOwnerEl);
      channelEnd.appendChild(optionsBtn);

      channelItemEl.appendChild(channelNameEl);
      channelItemEl.appendChild(channelEnd);

      // If user is in channel => goes to "My Channels" + Chat button
      // Otherwise => goes to "All Channels"
      if (inChannel) {
        const chatBtn = document.createElement("button");
        chatBtn.textContent = "Chat";
        chatBtn.classList.add("chat-btn");
        chatBtn.addEventListener("click", () =>
            openChannelChat(channelInfo.id)
        );
        channelEnd.appendChild(chatBtn);
        myChannelsContainer.appendChild(channelItemEl);
      } else {
        allChannelsContainer.appendChild(channelItemEl);
      }
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
    const channelMembersRef = ref(database, `channels/${channelId}/members`);
    const userRef = ref(database, "users/" + newMemberEmail.replace(".", ","));
    const userSnapshot = await get(userRef);
    if (!userSnapshot.exists()) {
      alert("User not found.");
      return;
    }
    let userData = userSnapshot.val();
    const channelMembersSnap = await get(channelMembersRef);
    const channelMembers = channelMembersSnap.exists()
        ? channelMembersSnap.val()
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
    const updatedMembers = members.filter((m) => m !== memberToRemove);
    await set(channelMembersRef, updatedMembers);

    const userRef = ref(database, "users/" + memberToRemove.replace(".", ","));
    const userSnapshot = await get(userRef);
    if (!userSnapshot.exists()) {
      alert("User not found.");
      return;
    }
    const userData = userSnapshot.val();
    const updatedchannels = userData.channels.filter(
        (ch) => ch !== channelId
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
