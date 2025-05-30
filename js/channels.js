import { auth, database } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
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
} from "firebase/database";

import { fetchProfileData } from "./pageLoading.js";
import { openChannelChat } from "./chatUI.js";

let currentUserData = {};

const modal = document.getElementById("memberModal");
const closeModalBtn = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

let currentMode = null;
let activeChannelId = null;

if (
  window.location.pathname.endsWith("channels.html") ||
  process.env.NODE_ENV === "test"
) {
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
}

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
  createchannelBtn.addEventListener("click", createChannel);
}

/**
 * Creates a new channel with the specified name.
 */
async function createChannel() {
  const channelNameInput = document.getElementById("channelName");
  const channelTypeInput = document.getElementById("channelType");
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

    // Fetch all users only if the user is admin
    let memberIDs = [channelOwnerId];
    let channelType = "private";

    if (
      currentUserData.role === "admin" &&
      channelTypeInput.value === "public"
    ) {
      channelType = "public";
      const usersSnap = await get(ref(database, "users"));
      if (usersSnap.exists()) {
        const usersData = usersSnap.val();
        memberIDs = Object.values(usersData).map((user) => user.id);
      }
    }

    const channelData = {
      id: newChannelRef.key,
      members: memberIDs,
      name: channelName,
      ownerId: channelOwnerId,
      channelType: channelType,
      joinRequests: [],
    };

    if (channelNameInput) channelNameInput.value = "";

    await set(newChannelRef, channelData);

    // Add channel to each member’s user data
    const usersSnap = await get(ref(database, "users"));
    const usersData = usersSnap.exists() ? usersSnap.val() : {};

    for (const [emailKey, userData] of Object.entries(usersData)) {
      if (memberIDs.includes(userData.id)) {
        const cleanedEmail = emailKey.replace(/\./g, ",");
        const userRef = ref(database, `users/${cleanedEmail}`);
        const userChannels = userData.channels || [];
        if (!userChannels.includes(channelData.id)) {
          userChannels.push(channelData.id);
          await update(userRef, { channels: userChannels });
          // After Create Channnel Send NOtifications

          // Send A push Notification
          const noticeRef = ref(database, `notices/${emailKey}`);
          const newNotice = {
            from: userData.email,
            message: "New Channel Created " + channelData.name,
            timestamp: Date.now(),
          };
          const newNoticeRef = push(noticeRef, newNotice);
          console.log("New notice sent:", newNotice);
        }
      }
    }

    alert("Channel created successfully!");
  } catch (e) {
    //alert(e);
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
      const publicChannelsContainer = document.getElementById(
        "publicChannelsContainer"
      );
      const privateChannelsContainer = document.getElementById(
        "privateChannelsContainer"
      );
      const allChannelsContainer = document.getElementById(
        "allChannelsContainer"
      );
      if (publicChannelsContainer) publicChannelsContainer.innerHTML = "";
      if (privateChannelsContainer) privateChannelsContainer.innerHTML = "";
      if (allChannelsContainer)
        allChannelsContainer.innerHTML = "No channels exist.";
      return;
    }
    const channelsData = snapshot.val();
    const publicChannelsContainer = document.getElementById(
      "publicChannelsContainer"
    );
    const privateChannelsContainer = document.getElementById(
      "privateChannelsContainer"
    );
    const allChannelsContainer = document.getElementById(
      "allChannelsContainer"
    );
    if (
      !publicChannelsContainer ||
      !privateChannelsContainer ||
      !allChannelsContainer
    ) {
      return;
    }
    publicChannelsContainer.innerHTML = "";
    privateChannelsContainer.innerHTML = "";
    allChannelsContainer.innerHTML = "";
    const userId = currentUserData.id;
    Object.keys(channelsData).forEach((channelId) => {
      const channelInfo = channelsData[channelId];
      addChannelItem(
        channelInfo,
        publicChannelsContainer,
        privateChannelsContainer,
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
 * @param {HTMLElement} publicChannelsContainer - The container for the user's channels.
 * @param {HTMLElement} privateChannelsContainer - The container for the user's channels.
 * @param {HTMLElement} allChannelsContainer - The container for all channels.
 * @param {string} userId - The ID of the current user.
 */
function addChannelItem(
  channelInfo,
  publicChannelsContainer,
  privateChannelsContainer,
  allChannelsContainer,
  userId
) {
  const isMember = channelInfo.members && channelInfo.members.includes(userId);
  const channelItemEl = buildChannelItem(channelInfo, isMember);
  if (isMember) {
    channelInfo.channelType === "public"
      ? publicChannelsContainer.appendChild(channelItemEl)
      : privateChannelsContainer.appendChild(channelItemEl);
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

/**
 * Shows the options for a channel when the options button is clicked.
 * @param {Event} event - The click event.
 * @param {Object} channelInfo - The information of the channel.
 */
function showchannelOptions(event, channelInfo) {
  document.querySelectorAll(".channel-options").forEach((el) => el.remove());
  const dropdown = document.createElement("div");
  dropdown.classList.add("channel-options");
  const userId = currentUserData.id || "";
  if (channelInfo.ownerId === userId) {
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
      if (dropdown) {
        dropdown.remove();
      }
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
  viewMembersBtn.addEventListener("click", () =>
    openMemberModal("view", channelInfo.id)
  );
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
  addMemberBtn.addEventListener("click", () =>
    openMemberModal("add", channelInfo.id)
  );
  dropdown.appendChild(addMemberBtn);
  const removeMemberBtn = document.createElement("button");
  removeMemberBtn.classList.add("remove-member-btn");
  removeMemberBtn.textContent = "Remove Member";
  removeMemberBtn.addEventListener("click", () =>
    openMemberModal("remove", channelInfo.id)
  );
  dropdown.appendChild(removeMemberBtn);

  const channelRequestBtn = document.createElement("button");
  channelRequestBtn.classList.add("view-requests-btn");
  channelRequestBtn.textContent = "View Join Requests";
  channelRequestBtn.addEventListener("click", async () => {
    openMemberModal("requests", channelInfo.id);
  });
  dropdown.appendChild(channelRequestBtn);
}

/**
 * Generates the options for a channel for a member user.
 * @param {HTMLElement} dropdown - The dropdown element.
 * @param {Object} channelInfo - The information of the channel.
 */
function generateMemberchannelOptions(dropdown, channelInfo) {
  const viewMembersBtn = document.createElement("button");
  viewMembersBtn.textContent = "View Members";
  viewMembersBtn.addEventListener("click", () =>
    openMemberModal("view", channelInfo.id)
  );
  dropdown.appendChild(viewMembersBtn);
  const channelRequestBtn = document.createElement("button");
  channelRequestBtn.classList.add("channel-request-btn");

  if (channelInfo.members && channelInfo.members.includes(currentUserData.id)) {
    channelRequestBtn.textContent = "Leave Channel";
    channelRequestBtn.addEventListener("click", () => {
      removeMember(currentUserData.email, channelInfo.id);
      dropdown.remove();
    });
  } else {
    channelRequestBtn.textContent = "Join Channel";
    channelRequestBtn.addEventListener("click", async () => {
      try {
        const joinRequestsRef = ref(
          database,
          `channels/${channelInfo.id}/joinRequests`
        );
        const joinRequestsSnap = await get(joinRequestsRef);
        const joinRequests = joinRequestsSnap.exists()
          ? joinRequestsSnap.val()
          : [];

        if (joinRequests.includes(currentUserData.id)) {
          alert("You have already requested to join this channel.");
          return;
        }

        joinRequests.push(currentUserData.id);
        await set(joinRequestsRef, joinRequests);
        alert("Join request sent successfully!");
      } catch (e) {
        alert("Failed to send join request.");
      }
    });
  }

  dropdown.appendChild(channelRequestBtn);
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

async function searchUsers(query) {
  const usersSnapshot = await get(ref(database, "users"));
  if (!usersSnapshot.exists()) return [];

  const allUsers = usersSnapshot.val();
  return Object.entries(allUsers)
    .filter(([key, user]) => {
      const email = key.replace(/,/g, ".");
      if (!query) return true; // Return all users if query is empty
      return (
        email.toLowerCase().includes(query.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(query.toLowerCase()))
      );
    })
    .map(([key, user]) => ({
      id: user.id,
      email: key.replace(/,/g, "."),
      name: user.name,
    }));
}

/**
 * Adds a member to a channel.
 * @param {string} channelId - The ID of the channel.
 */
async function addMember(memberEmail, channelId) {
  const emailKey = memberEmail.replace(/\./g, ",");
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
    addChannelToUser(channelId, memberEmail);
    if (
      window.location.pathname.endsWith("channels.html") ||
      process.env.NODE_ENV === "test"
    ) {
      alert("Member added successfully!");
    }
  } catch {
    alert("Failed to add member.");
  }
}

async function searchChannelMembers(channelId, query, mode) {
  let membersRef;
  if (mode === "requests")
    membersRef = ref(database, `channels/${channelId}/joinRequests`);
  else membersRef = ref(database, `channels/${channelId}/members`);
  const membersSnap = await get(membersRef);
  if (!membersSnap.exists()) return [];

  const memberIds = membersSnap.val();
  const usersSnap = await get(ref(database, "users"));
  if (!usersSnap.exists()) return [];

  const usersData = usersSnap.val();

  return Object.entries(usersData)
    .filter(([key, user]) => {
      const email = key.replace(/,/g, ".");
      const isMember = memberIds.includes(user.id);
      if (!query) return isMember; // Return all members if query is empty
      return (
        isMember &&
        (email.toLowerCase().includes(query.toLowerCase()) ||
          (user.name && user.name.toLowerCase().includes(query.toLowerCase())))
      );
    })
    .map(([key, user]) => ({
      id: user.id,
      email: key.replace(/,/g, "."),
      name: user.name,
    }));
}

/**
 * Removes a member from a channel.
 * @param {string} channelId - The ID of the channel.
 */
async function removeMember(memberEmail, channelId) {
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
  } catch {
    alert("Failed to remove member.");
  }
}

// Opens the search modal
function openMemberModal(mode, channelId) {
  currentMode = mode; // 'add', 'remove', or 'view'
  activeChannelId = channelId;

  modalTitle.textContent =
    mode === "add"
      ? "Add Member"
      : mode === "remove"
      ? "Remove Member"
      : mode === "view"
      ? "Channel Members"
      : "Join Requests";

  modal.style.display = "flex";
  searchInput.value = "";
  searchResults.innerHTML = "";

  // Disable search input for view mode
  searchInput.style.display = mode === "view" ? "none" : "block";

  if (mode === "add") {
    searchInput.focus();
    searchUsers("").then(renderResults);
  } else {
    // Show all members immediately
    searchInput.focus();
    searchChannelMembers(channelId, "", mode).then(renderResults);
  }
}

// Close modal
if (closeModalBtn) {
  closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
    const dropdown = document.querySelector(".channel-options");
    dropdown.remove();
  });
}

// Realtime search listener
if (searchInput) {
  searchInput.addEventListener("input", async () => {
    const query = searchInput.value.trim();

    const results =
      currentMode === "add"
        ? await searchUsers(query)
        : await searchChannelMembers(activeChannelId, query, mode);

    renderResults(results);
  });
}

// Render result items
function renderResults(results) {
  searchResults.innerHTML = "";
  if (results.length === 0) {
    searchResults.innerHTML = "<p>No matching users found.</p>";
    return;
  }

  results.forEach((user) => {
    const div = document.createElement("div");
    div.textContent = `${user.name} (${user.email})`;

    if (currentMode === "add") {
      div.addEventListener("click", () => {
        addMember(user.email, activeChannelId);
        modal.style.display = "none";
      });
    } else if (currentMode === "remove") {
      div.addEventListener("click", () => {
        removeMember(user.email, activeChannelId);
        modal.style.display = "none";
      });
    } else if (currentMode === "requests") {
      div.addEventListener("click", async () => {
        addMember(user.email, activeChannelId);
        modal.style.display = "none";
        const joinRequestsRef = ref(
          database,
          `channels/${activeChannelId}/joinRequests`
        );
        const joinRequestsSnap = await get(joinRequestsRef);
        const joinRequests = joinRequestsSnap.exists()
          ? joinRequestsSnap.val()
          : [];
        const updatedRequests = joinRequests.filter((id) => id !== user.id);
        await set(joinRequestsRef, updatedRequests);
      });
    } else {
      div.style.opacity = 0.7;
      div.style.cursor = "default";
    }

    searchResults.appendChild(div);
  });
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
    const publicChannelsContainer = document.getElementById(
      "publicChannelsContainer"
    );
    const privateChannelsContainer = document.getElementById(
      "privateChannelsContainer"
    );
    const allChannelsContainer = document.getElementById(
      "allChannelsContainer"
    );

    addChannelItem(
      channelInfo,
      publicChannelsContainer,
      privateChannelsContainer,
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

export {
  createChannel,
  deletechannel,
  addMember,
  removeMember,
  searchUsers,
  searchChannelMembers,
};
