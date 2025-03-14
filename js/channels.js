import { auth, database } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import {
  ref,
  get,
  set,
  push,
  onChildAdded,
  onChildRemoved,
  query,
  limitToLast,
  onValue,
  off,
  update,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

import { fetchProfileData } from "./pageLoading.js";
import { openChannelChat } from "./chatUI.js";

let currentUserData = {};

listenChannelsRemoved();
listenChannelsAdded();

/**
 * Listens for the authentication state to change and fetches the user's data.
 */
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

/**
 * Fetches the name of a user by their UID.
 * @param {string} uid - The UID of the user.
 * @returns {Promise<string|null>} The name of the user or null if not found.
 */
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

/**
 * Creates a new channel with the specified name.
 */
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
    const channelsRef = ref(database, "channels");
    const newChannelRef = push(channelsRef);
    const channelData = {
      id: newChannelRef.key,
      members: [channelOwnerId],
      name: channelName,
      ownerId: channelOwnerId,
    };
    if (channelNameInput) channelNameInput.value = "";
    await set(newChannelRef, channelData);
    addChannelToUser(channelData.id, currentUserData.email);
    alert("Channel created successfully!");
  } catch (e) {
    alert(e);
  }
}

/**
 * Adds a channel to the current user's list of channels.
 * @param {string} channelId - The ID of the channel to add.
 * @param {string} userEmail - The email of the user.
 */
function addChannelToUser(channelId, userEmail) {
  const userRef = ref(database, "users/" + userEmail.replace(/\./g, ","));
  get(userRef).then((snapshot) => {
    if (!snapshot.exists()) {
      alert("User not found.");
      return;
    }
    const userData = snapshot.val();
    const userChannels = userData.channels || [];
    userChannels.push(channelId);
    update(userRef, { channels: userChannels });
  });
}

/**
 * Removes a channel from the current user's list of channels.
 * @param {string} channelId - The ID of the channel to remove.
 * @param {string} userEmail - The email of the user.
 */
function removeChannelFromUser(channelId, userEmail) {
  const userRef = ref(database, "users/" + userEmail.replace(/\./g, ","));
  get(userRef).then((snapshot) => {
    if (!snapshot.exists()) {
      alert("User not found.");
      return;
    }
    const userData = snapshot.val();
    const userChannels = userData.channels || [];
    const updatedChannels = userChannels.filter(
      (channel) => channel !== channelId
    );
    update(userRef, { channels: updatedChannels });
  });
}

/**
 * Fetches all channels from the database and updates the UI.
 */
async function fetchchannels() {
  console.log("Fetching channels...");
  const channelsRef = ref(database, "channels");
  try {
    const snapshot = await get(channelsRef);
    if (!snapshot.exists()) {
      const myChannelsContainer = document.getElementById(
        "myChannelsContainer"
      );
      const allChannelsContainer = document.getElementById(
        "allChannelsContainer"
      );
      if (myChannelsContainer)
        myChannelsContainer.innerHTML = "No channels exist.";
      if (allChannelsContainer) allChannelsContainer.innerHTML = "";
      return;
    }
    const channelsData = snapshot.val();
    const myChannelsContainer = document.getElementById("myChannelsContainer");
    const allChannelsContainer = document.getElementById(
      "allChannelsContainer"
    );
    if (!myChannelsContainer || !allChannelsContainer) {
      return;
    }
    myChannelsContainer.innerHTML = "";
    allChannelsContainer.innerHTML = "";
    const userId = currentUserData.id;
    Object.keys(channelsData).forEach((channelId) => {
      const channelInfo = channelsData[channelId];
      addChannelItem(
        channelInfo,
        myChannelsContainer,
        allChannelsContainer,
        userId
      );
    });
  } catch (e) {
    console.error(e);
  }
}

/**
 * Adds a channel item to the appropriate container in the UI.
 * @param {Object} channelInfo - The information of the channel.
 * @param {HTMLElement} myChannelsContainer - The container for the user's channels.
 * @param {HTMLElement} allChannelsContainer - The container for all channels.
 * @param {string} userId - The ID of the current user.
 */
function addChannelItem(
  channelInfo,
  myChannelsContainer,
  allChannelsContainer,
  userId
) {
  const isMember = channelInfo.members && channelInfo.members.includes(userId);
  const channelItemEl = buildChannelItem(channelInfo, isMember);
  if (isMember) {
    myChannelsContainer.appendChild(channelItemEl);
  } else {
    allChannelsContainer.appendChild(channelItemEl);
  }
}

/**
 * Removes a channel item from the UI.
 * @param {string} channelId - The ID of the channel to remove.
 */
function removeChannelItem(channelId) {
  document
    .querySelectorAll(".channel-item")
    .forEach((el) => el.dataset.channelId === channelId && el.remove());
}

/**
 * Builds a channel item element for the UI.
 * @param {Object} channelInfo - The information of the channel.
 * @param {boolean} isMember - Whether the current user is a member of the channel.
 * @returns {HTMLElement} The channel item element.
 */
function buildChannelItem(channelInfo, isMember) {
  const channelItemEl = document.createElement("div");
  channelItemEl.classList.add("channel-item");
  channelItemEl.dataset.channelId = channelInfo.id;

  const channelNameEl = document.createElement("span");
  channelNameEl.classList.add("channel-name");
  channelNameEl.textContent = channelInfo.name || "Untitled channel";
  const channelEnd = document.createElement("div");
  channelEnd.classList.add("channel-end");
  const channelOwnerEl = document.createElement("span");
  channelOwnerEl.classList.add("channel-owner");
  getOwnerName(channelInfo.ownerId).then((ownerName) => {
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

/**
 * Fetches the name of the owner of a channel by their ID.
 * @param {string} ownerId - The ID of the owner.
 * @returns {Promise<string>} The name of the owner.
 */
async function getOwnerName(ownerId) {
  const usersSnapshot = await get(ref(database, "users"));
  if (!usersSnapshot.exists()) return "Unknown Owner";
  const usersData = usersSnapshot.val();
  const ownerEntry = Object.values(usersData).find(
    (user) => user.id === ownerId
  );
  return ownerEntry ? ownerEntry.name : "Unknown Owner";
}

/**
 * Fetches the names of users by their IDs.
 * @param {string[]} memberIDs - The IDs of the members.
 * @returns {Promise<string[]>} The names of the members.
 */
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

/**
 * Shows the options for a channel when the options button is clicked.
 * @param {Event} event - The click event.
 * @param {Object} channelInfo - The information of the channel.
 */
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

/**
 * Generates the options for a channel for an admin user.
 * @param {HTMLElement} dropdown - The dropdown element.
 * @param {Object} channelInfo - The information of the channel.
 */
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

/**
 * Generates the options for a channel for a member user.
 * @param {HTMLElement} dropdown - The dropdown element.
 * @param {Object} channelInfo - The information of the channel.
 */
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

/**
 * Deletes a channel from the database.
 * @param {string} channelId - The ID of the channel to delete.
 */
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
    const userRef = await get(ref(database, "users"));
    const userSnapshot = userRef.val();
    const channelMembers = snapshot.val().members || [];
    for (let i = 0; i < channelMembers.length; i++) {
      const member = Object.values(userSnapshot).find(
        (user) => user.id === channelMembers[i]
      );
      if (!member) continue;
      removeChannelFromUser(channelId, member.email);
    }
    alert("Channel deleted successfully!");

    const dropdown = document.querySelector(".channel-options");
    dropdown.remove();
  } catch (e) {
    alert("Failed to delete channel." + e);
  }
}

/**
 * Adds a member to a channel.
 * @param {string} channelId - The ID of the channel.
 */
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
    addChannelToUser(channelId, newMemberEmail);
    alert("Member added successfully!");

    const dropdown = document.querySelector(".channel-options");
    dropdown.remove();
  } catch {
    alert("Failed to add member.");
  }
}

/**
 * Removes a member from a channel.
 * @param {string} channelId - The ID of the channel.
 */
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
    removeChannelFromUser(channelId, memberEmail);
    alert("Member removed successfully!");
    const dropdown = document.querySelector(".channel-options");
    dropdown.remove();
  } catch {
    alert("Failed to remove member.");
  }
}

/**
 * Creates a new group chat with the specified members and last message.
 * @param {string[]} members - The IDs of the members.
 * @param {string} lastMessage - The last message in the chat.
 * @param {string} senderID - The ID of the sender.
 */
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

/**
 * Listens for new channels being added to the database and updates the UI accordingly.
 */
function listenChannelsAdded() {
  console.log("Listening for new channels...");
  const channelsRef = ref(database, "channels");
  const channelsQuery = query(channelsRef, limitToLast(1));

  onChildAdded(channelsQuery, (snapshot) => {
    console.log("New channel detected:", snapshot.val());

    const channelInfo = snapshot.val();
    const myChannelsContainer = document.getElementById("myChannelsContainer");
    const allChannelsContainer = document.getElementById(
      "allChannelsContainer"
    );

    addChannelItem(
      channelInfo,
      myChannelsContainer,
      allChannelsContainer,
      currentUserData.id
    );

    listenForMemberChanges(channelInfo ? channelInfo.id : null);
  });
}

/**
 * Listens for channels being removed from the database and updates the UI accordingly.
 */
function listenChannelsRemoved() {
  console.log("Listening for deleted channels...");
  const channelsRef = ref(database, "channels");

  onChildRemoved(channelsRef, (snapshot) => {
    console.log("Channel removed:", snapshot.val());
    const channelId = snapshot.key;
    removeChannelItem(channelId);
  });
}

/**
 * Listens for changes in the members of a channel and updates the UI accordingly.
 * @param {string} channelID - The ID of the channel.
 */
function listenForMemberChanges(channelID) {
  const channelMembersRef = ref(database, `channels/${channelID}/members`);
  off(channelMembersRef);
  onValue(channelMembersRef, (snapshot) => {
    console.log("Channel's members change:", snapshot.val());
    fetchchannels();
  });
}
