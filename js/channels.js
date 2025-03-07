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
    currentUserData.id = user.uid;
    const fetchedName = await fetchNameById(currentUserData.id);
    currentUserData.name = fetchedName || "Unknown";
    await fetchchannels();
  } else {
    if (!window.loggingOut) {
      alert("You must be logged in to view this page.");
      window.location.href = "../html/loginPage.html";
    }
  }
});

async function fetchNameById(uid) {
  try {
    const snapshot = await get(ref(database, "users"));
    if (!snapshot.exists()) {
      return null;
    }
    const usersData = snapshot.val();
    for (const key in usersData) {
      if (usersData[key].id === uid) {
        return usersData[key].name;
      }
    }
    return null;
  } catch {
    return null;
  }
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
  const channelOwnerId = currentUserData.id;
  if (!channelOwnerId) {
    alert("Error: Could not find your user ID to create the channel.");
    return;
  }
  try {
    const newChannelRef = push(ref(database, "channels"));
    await set(newChannelRef, {
      id: newChannelRef.key,
      name: channelName,
      ownerId: channelOwnerId,
      members: [channelOwnerId],
    });
    if (channelNameInput) channelNameInput.value = "";
    await fetchchannels();
  } catch {
    alert("Failed to create Channel.");
  }
}

async function fetchchannels() {
  const channelsRef = ref(database, "channels");
  try {
    const snapshot = await get(channelsRef);
    if (!snapshot.exists()) {
      const myChannelsContainer = document.getElementById("myChannelsContainer");
      const allChannelsContainer = document.getElementById("allChannelsContainer");
      if (myChannelsContainer) myChannelsContainer.innerHTML = "No channels exist.";
      if (allChannelsContainer) allChannelsContainer.innerHTML = "";
      return;
    }
    const channelsData = snapshot.val();
    const myChannelsContainer = document.getElementById("myChannelsContainer");
    const allChannelsContainer = document.getElementById("allChannelsContainer");
    if (!myChannelsContainer || !allChannelsContainer) {
      return;
    }
    myChannelsContainer.innerHTML = "";
    allChannelsContainer.innerHTML = "";
    const userId = currentUserData.id;
    Object.keys(channelsData).forEach((channelId) => {
      const channelInfo = channelsData[channelId];
      const isMember = channelInfo.members && channelInfo.members.includes(userId);
      const channelItemEl = buildChannelItem(channelInfo, isMember);
      if (isMember) {
        myChannelsContainer.appendChild(channelItemEl);
      } else {
        allChannelsContainer.appendChild(channelItemEl);
      }
    });
  } catch {}
}

function buildChannelItem(channelInfo, isMember) {
  const channelItemEl = document.createElement("div");
  channelItemEl.classList.add("channel-item");
  const channelNameEl = document.createElement("span");
  channelNameEl.classList.add("channel-name");
  channelNameEl.textContent = channelInfo.name || "Untitled channel";
  const channelEnd = document.createElement("div");
  channelEnd.classList.add("channel-end");
  const channelOwnerEl = document.createElement("span");
  channelOwnerEl.classList.add("channel-owner");
  getOwnerName(channelInfo.ownerId).then(ownerName => {
    channelOwnerEl.textContent = `Owner: ${ownerName}`;
  });
  const optionsBtn = document.createElement("button");
  optionsBtn.classList.add("options-btn");
  optionsBtn.textContent = "...";
  optionsBtn.addEventListener("click", (event) =>
      showchannelOptions(event, channelInfo)
  );
  channelEnd.appendChild(channelOwnerEl);
  channelEnd.appendChild(optionsBtn);
  if (isMember) {
    const chatBtn = document.createElement("button");
    chatBtn.classList.add("chat-btn");
    chatBtn.textContent = "Chat";
    chatBtn.addEventListener("click", () => openChannelChat(channelInfo.id));
    channelEnd.appendChild(chatBtn);
  }
  channelItemEl.appendChild(channelNameEl);
  channelItemEl.appendChild(channelEnd);
  return channelItemEl;
}

async function getOwnerName(ownerId) {
  const usersSnapshot = await get(ref(database, "users"));
  if (!usersSnapshot.exists()) return "Unknown Owner";
  const usersData = usersSnapshot.val();
  const ownerEntry = Object.values(usersData).find(user => user.id === ownerId);
  return ownerEntry ? ownerEntry.name : "Unknown Owner";
}

async function fetchNamesForIDs(memberIDs) {
  if (!memberIDs || memberIDs.length === 0) return [];
  const usersSnapshot = await get(ref(database, "users"));
  if (!usersSnapshot.exists()) return [];
  const usersData = usersSnapshot.val();
  return memberIDs.map((uid) => {
    const foundKey = Object.keys(usersData).find(
        (key) => usersData[key].id === uid
    );
    if (!foundKey) {
      return `Unknown user (ID: ${uid})`;
    }
    return usersData[foundKey].name || `No name (ID: ${uid})`;
  });
}

function showchannelOptions(event, channelInfo) {
  document.querySelectorAll(".channel-options").forEach((el) => el.remove());
  const dropdown = document.createElement("div");
  dropdown.classList.add("channel-options");
  const userRole = currentUserData.role || "";
  const userId = currentUserData.id || "";
  if (userRole === "admin" && channelInfo.ownerId === userId) {
    generateAdminchannelOptions(dropdown, channelInfo);
  } else {
    generateMemberchannelOptions(dropdown, channelInfo);
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

function generateAdminchannelOptions(dropdown, channelInfo) {
  const viewMembersBtn = document.createElement("button");
  viewMembersBtn.textContent = "View Members";
  viewMembersBtn.addEventListener("click", async () => {
    if (!channelInfo.members || channelInfo.members.length === 0) {
      alert("No members in this channel.");
      return;
    }
    try {
      const nameList = await fetchNamesForIDs(channelInfo.members);
      alert("Channel Members:\n" + nameList.join("\n"));
    } catch {
      alert("Could not fetch member names.");
    }
  });
  dropdown.appendChild(viewMembersBtn);
  const deletechannelBtn = document.createElement("button");
  deletechannelBtn.classList.add("delete-channel-btn");
  deletechannelBtn.textContent = "Delete Channel";
  deletechannelBtn.addEventListener("click", () =>
      deletechannel(channelInfo.id)
  );
  dropdown.appendChild(deletechannelBtn);
  const addMemberBtn = document.createElement("button");
  addMemberBtn.classList.add("add-member-btn");
  addMemberBtn.textContent = "Add Member";
  addMemberBtn.addEventListener("click", () => addMember(channelInfo.id));
  dropdown.appendChild(addMemberBtn);
  const removeMemberBtn = document.createElement("button");
  removeMemberBtn.classList.add("remove-member-btn");
  removeMemberBtn.textContent = "Remove Member";
  removeMemberBtn.addEventListener("click", () => removeMember(channelInfo.id));
  dropdown.appendChild(removeMemberBtn);
}

function generateMemberchannelOptions(dropdown, channelInfo) {
  const viewMembersBtn = document.createElement("button");
  viewMembersBtn.textContent = "View Members";
  viewMembersBtn.addEventListener("click", async () => {
    if (!channelInfo.members || channelInfo.members.length === 0) {
      alert("No members in this channel.");
      return;
    }
    try {
      const nameList = await fetchNamesForIDs(channelInfo.members);
      alert("Channel Members:\n" + nameList.join("\n"));
    } catch {
      alert("Could not fetch member names.");
    }
  });
  dropdown.appendChild(viewMembersBtn);
  const messageAdminBtn = document.createElement("button");
  messageAdminBtn.classList.add("message-admin-btn");
  messageAdminBtn.textContent = "Message admin";
  dropdown.appendChild(messageAdminBtn);
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
    await set(channelRef, null);
    alert("Channel deleted successfully!");
    await fetchchannels();
  } catch {
    alert("Failed to delete channel.");
  }
}

async function addMember(channelId) {
  const newMemberEmail = prompt("Enter the email of the member to add:");
  if (!newMemberEmail) return;
  const emailKey = newMemberEmail.replace(/\./g, ",");
  const userRef = ref(database, "users/" + emailKey);
  try {
    const userSnap = await get(userRef);
    if (!userSnap.exists()) {
      alert("No user found with that email.");
      return;
    }
    const userData = userSnap.val();
    const newMemberId = userData.id;
    if (!newMemberId) {
      alert("No user ID found for this email.");
      return;
    }
    const channelMembersRef = ref(database, `channels/${channelId}/members`);
    const channelMembersSnap = await get(channelMembersRef);
    const channelMembers = channelMembersSnap.exists()
        ? channelMembersSnap.val()
        : [];
    if (channelMembers.includes(newMemberId)) {
      alert("This user is already a member.");
      return;
    }
    channelMembers.push(newMemberId);
    await set(channelMembersRef, channelMembers);
    alert("Member added successfully!");
  } catch {
    alert("Failed to add member.");
  }
}

async function removeMember(channelId) {
  const memberEmail = prompt("Enter the email of the member to remove:");
  if (!memberEmail) return;
  const emailKey = memberEmail.replace(/\./g, ",");
  const userRef = ref(database, "users/" + emailKey);
  try {
    const userSnap = await get(userRef);
    if (!userSnap.exists()) {
      alert("No user found with that email.");
      return;
    }
    const userData = userSnap.val();
    const memberId = userData.id;
    if (!memberId) {
      alert("No user ID found for this email.");
      return;
    }
    const channelMembersRef = ref(database, `channels/${channelId}/members`);
    const snapshot = await get(channelMembersRef);
    if (!snapshot.exists()) {
      alert("No members found in this channel.");
      return;
    }
    const members = snapshot.val();
    if (!members.includes(memberId)) {
      alert("That user is not in this channel.");
      return;
    }
    const updatedMembers = members.filter((m) => m !== memberId);
    await set(channelMembersRef, updatedMembers);
    alert("Member removed successfully!");
  } catch {
    alert("Failed to remove member.");
  }
}

export async function createGroupChat(members, lastMessage, senderID) {
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
