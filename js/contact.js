import { auth, database } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  ref,
  get,
  set,
  push,
  onValue,
  query,
  orderByChild,
} from "firebase/database";

// DOM elements
const allUsersDiv = document.getElementById("allUsers");
const friendsListDiv = document.getElementById("friendsList");
const sentRequestsDiv = document.getElementById("sentRequests");
const receivedRequestsDiv = document.getElementById("receivedRequests");
const userSearchInput = document.getElementById("userSearch");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

let currentUser = null;
let allUsersData = [];
let friendsData = [];
let sentRequestsData = [];
let receivedRequestsData = [];

// Initialize the page
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = {
      id: user.uid,
      email: user.email,
    };

    await loadAllData();
    setupRealTimeListeners();
    setupTabNavigation();
    setupSearchFunctionality();
  } else {
    alert("You need to be logged in to view this page.");
    window.location.href = "../html/loginPage.html";
  }
});

async function loadAllData() {
  try {
    await Promise.all([loadAllUsers(), loadFriends(), loadFriendRequests()]);
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

async function loadAllUsers() {
  try {
    const snapshot = await get(ref(database, "users"));
    allUsersData = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const user = childSnapshot.val();
        if (user.id !== currentUser.id) {
          allUsersData.push({
            id: user.id,
            name: user.name || "No name",
            email: childSnapshot.key.replace(/,/g, "."),
            profilePicture:
              user.profilePicture || "../images/defaultUserLogo.png",
          });
        }
      });

      renderUserList(allUsersData, allUsersDiv, "all-users");
    } else {
      allUsersDiv.innerHTML = '<div class="loading">No users found</div>';
    }
  } catch (error) {
    console.error("Error loading users:", error);
    allUsersDiv.innerHTML = '<div class="error">Error loading users</div>';
  }
}

async function loadFriends() {
  try {
    const friendsQuery = query(
      ref(database, "Friends"),
      orderByChild("timestamp")
    );
    const snapshot = await get(friendsQuery);
    friendsData = [];

    if (snapshot.exists()) {
      const usersSnapshot = await get(ref(database, "users"));
      const usersData = usersSnapshot.exists() ? usersSnapshot.val() : {};

      snapshot.forEach((childSnapshot) => {
        const friendship = childSnapshot.val();

        if (
          friendship.user1 === currentUser.id ||
          friendship.user2 === currentUser.id
        ) {
          const friendId =
            friendship.user1 === currentUser.id
              ? friendship.user2
              : friendship.user1;
          const friend = findUserById(usersData, friendId);

          if (friend) {
            friendsData.push({
              id: friendId,
              name: friend.name || "No name",
              email: friend.email.replace(/,/g, "."),
              profilePicture:
                friend.profilePicture || "../images/defaultUserLogo.png",
              friendshipId: childSnapshot.key,
            });
          }
        }
      });

      renderUserList(friendsData, friendsListDiv, "friends");
    } else {
      friendsListDiv.innerHTML = '<div class="loading">No friends yet</div>';
    }
  } catch (error) {
    console.error("Error loading friends:", error);
    friendsListDiv.innerHTML = '<div class="error">Error loading friends</div>';
  }
}

async function loadFriendRequests() {
  try {
    const requestsSnapshot = await get(ref(database, "FriendRequests"));
    sentRequestsData = [];
    receivedRequestsData = [];

    if (requestsSnapshot.exists()) {
      const usersSnapshot = await get(ref(database, "users"));
      const usersData = usersSnapshot.exists() ? usersSnapshot.val() : {};

      requestsSnapshot.forEach((childSnapshot) => {
        const request = childSnapshot.val();
        const requestId = childSnapshot.key;

        if (request.status === "pending") {
          if (request.senderID === currentUser.id) {
            const receiver = findUserById(usersData, request.receiverID);
            if (receiver) {
              sentRequestsData.push({
                id: requestId,
                senderID: request.senderID,
                receiverID: request.receiverID,
                receiverName: receiver.name || "No name",
                receiverEmail: receiver.email.replace(/,/g, "."),
                receiverProfile:
                  receiver.profilePicture || "../images/defaultUserLogo.png",
                timestamp: request.timestamp,
                status: request.status,
              });
            }
          } else if (request.receiverID === currentUser.id) {
            const sender = findUserById(usersData, request.senderID);
            if (sender) {
              receivedRequestsData.push({
                id: requestId,
                senderID: request.senderID,
                senderName: sender.name || "No name",
                senderEmail: sender.email.replace(/,/g, "."),
                senderProfile:
                  sender.profilePicture || "../images/defaultUserLogo.png",
                receiverID: request.receiverID,
                timestamp: request.timestamp,
                status: request.status,
              });
            }
          }
        }
      });

      renderRequestList(sentRequestsData, sentRequestsDiv, "sent");
      renderRequestList(receivedRequestsData, receivedRequestsDiv, "received");
    } else {
      sentRequestsDiv.innerHTML = '<div class="loading">No sent requests</div>';
      receivedRequestsDiv.innerHTML =
        '<div class="loading">No received requests</div>';
    }
  } catch (error) {
    console.error("Error loading friend requests:", error);
    sentRequestsDiv.innerHTML =
      '<div class="error">Error loading sent requests</div>';
    receivedRequestsDiv.innerHTML =
      '<div class="error">Error loading received requests</div>';
  }
}

function renderUserList(users, container, type) {
  if (!users || users.length === 0) {
    container.innerHTML = `<div class="loading">No ${
      type === "friends" ? "friends" : "users"
    } found</div>`;
    return;
  }

  container.innerHTML = "";
  users.forEach((user) => {
    const userElement = document.createElement("div");
    userElement.className = "user-item";
    userElement.dataset.id = user.id;

    userElement.innerHTML = `
            <img src="${user.profilePicture}" alt="Profile Picture">
            <div class="user-main">
                <div class="user-name">${user.name}</div>
                <div class="user-email">${user.email}</div>
                ${
                  type === "friends"
                    ? `
                <div class="request-actions">
                    <button class="request-btn remove-friend-btn">Remove Friend</button>
                </div>
                `
                    : ""
                }
                ${
                  type === "all-users"
                    ? `
                <div class="request-actions">
                    <button class="request-btn add-friend-btn">Add Friend</button>
                </div>
                `
                    : ""
                }
            </div>
        `;

    if (type === "friends") {
      const removeBtn = userElement.querySelector(".remove-friend-btn");
      removeBtn.addEventListener("click", () =>
        removeFriend(user.friendshipId)
      );
    } else if (type === "all-users") {
      const addFriendBtn = userElement.querySelector(".add-friend-btn");
      addFriendBtn.addEventListener("click", () => sendFriendRequest(user));
    }

    container.appendChild(userElement);
  });
}

function renderRequestList(requests, container, type) {
  if (!requests || requests.length === 0) {
    container.innerHTML = `<div class="loading">No ${type} requests</div>`;
    return;
  }

  container.innerHTML = "";
  requests.forEach((request) => {
    const requestElement = document.createElement("div");
    requestElement.className = "user-item";
    requestElement.dataset.id = request.id;

    const user =
      type === "sent"
        ? {
            name: request.receiverName,
            email: request.receiverEmail,
            profilePicture: request.receiverProfile,
          }
        : {
            name: request.senderName,
            email: request.senderEmail,
            profilePicture: request.senderProfile,
          };

    requestElement.innerHTML = `
            <img src="${user.profilePicture}" alt="Profile Picture">
            <div class="user-main">
                <div class="user-name">${user.name}</div>
                <div class="user-email">${user.email}</div>
                <div class="request-status">Status: ${request.status}</div>
                ${
                  type === "received"
                    ? `
                <div class="request-actions">
                    <button class="request-btn accept-btn">Accept</button>
                    <button class="request-btn decline-btn">Decline</button>
                </div>
                `
                    : ""
                }
                ${
                  type === "sent"
                    ? `
                <div class="request-actions">
                    <button class="request-btn cancel-btn">Cancel Request</button>
                </div>
                `
                    : ""
                }
            </div>
        `;

    if (type === "received") {
      const acceptBtn = requestElement.querySelector(".accept-btn");
      const declineBtn = requestElement.querySelector(".decline-btn");

      acceptBtn.addEventListener("click", () =>
        acceptFriendRequest(request.id, request.senderID)
      );
      declineBtn.addEventListener("click", () =>
        declineFriendRequest(request.id)
      );
    } else if (type === "sent") {
      const cancelBtn = requestElement.querySelector(".cancel-btn");
      cancelBtn.addEventListener("click", () =>
        declineFriendRequest(request.id)
      );
    }

    container.appendChild(requestElement);
  });
}

async function sendFriendRequest(user) {
  try {
    // Check if request already exists
    const existingRequest =
      sentRequestsData.find((req) => req.receiverID === user.id) ||
      receivedRequestsData.find((req) => req.senderID === user.id);

    if (existingRequest) {
      alert(
        `You already have a ${existingRequest.status} request with this user`
      );
      return;
    }

    // Check if already friends
    const isFriend = friendsData.some((friend) => friend.id === user.id);
    if (isFriend) {
      alert("This user is already your friend");
      return;
    }

    // Create new request
    const newRequestRef = push(ref(database, "FriendRequests"));
    await set(newRequestRef, {
      senderID: currentUser.id,
      receiverID: user.id,
      timestamp: Date.now(),
      status: "pending",
    });

    alert("Friend request sent successfully!");
  } catch (error) {
    console.error("Error sending friend request:", error);
    alert("Failed to send friend request");
  }
}

async function acceptFriendRequest(requestId, senderId) {
  try {
    // 1. Create friendship
    if (!requestId || !senderId) {
      alert("Invalid friend request ID!");
      throw new Error("Invalid request ID");
    }
    const friendshipRef = push(ref(database, "Friends"));
    await set(friendshipRef, {
      user1: currentUser.id,
      user2: senderId,
      timestamp: Date.now(),
    });

    // 2. Delete the friend request
    await set(ref(database, `FriendRequests/${requestId}`), null);

    alert("Friend request accepted!");
  } catch (error) {
    console.error("Error accepting friend request:", error);
    alert("Failed to accept friend request");
  }
}

async function declineFriendRequest(requestId) {
  try {
    if (!requestId) {
      alert("Invalid friend request ID!");
      throw new Error("Invalid request ID");
    }
    await set(ref(database, `FriendRequests/${requestId}`), null);
    alert("Friend request declined");
  } catch (error) {
    console.error("Error declining friend request:", error);
    alert("Failed to decline friend request");
  }
}

async function removeFriend(friendshipId) {
  if (!confirm("Are you sure you want to remove this friend?")) return;

  try {
    await set(ref(database, `Friends/${friendshipId}`), null);
    alert("Friend removed successfully");
  } catch (error) {
    console.error("Error removing friend:", error);
    alert("Failed to remove friend");
  }
}

function setupRealTimeListeners() {
  // Listen for friend requests changes
  onValue(ref(database, "FriendRequests"), () => {
    loadFriendRequests();
  });

  // Listen for friends list changes
  onValue(ref(database, "Friends"), () => {
    loadFriends();
  });
}

function setupTabNavigation() {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Add active class to clicked button and corresponding content
      button.classList.add("active");
      const tabId = button.dataset.tab;
      document.getElementById(tabId).classList.add("active");
    });
  });
}

function setupSearchFunctionality() {
  if (userSearchInput) {
    userSearchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const activeTab = document.querySelector(".tab-content.active").id;

      if (activeTab === "all-users") {
        const filteredUsers = allUsersData.filter(
          (user) =>
            (user.name && user.name.toLowerCase().includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm))
        );
        renderUserList(filteredUsers, allUsersDiv, "all-users");
      } else if (activeTab === "friends") {
        const filteredFriends = friendsData.filter(
          (friend) =>
            (friend.name && friend.name.toLowerCase().includes(searchTerm)) ||
            (friend.email && friend.email.toLowerCase().includes(searchTerm))
        );
        renderUserList(filteredFriends, friendsListDiv, "friends");
      } else if (activeTab === "sent-requests") {
        const filteredRequests = sentRequestsData.filter(
          (request) =>
            (request.receiverName &&
              request.receiverName.toLowerCase().includes(searchTerm)) ||
            (request.receiverEmail &&
              request.receiverEmail.toLowerCase().includes(searchTerm))
        );
        renderRequestList(filteredRequests, sentRequestsDiv, "sent");
      } else if (activeTab === "received-requests") {
        const filteredRequests = receivedRequestsData.filter(
          (request) =>
            (request.senderName &&
              request.senderName.toLowerCase().includes(searchTerm)) ||
            (request.senderEmail &&
              request.senderEmail.toLowerCase().includes(searchTerm))
        );
        renderRequestList(filteredRequests, receivedRequestsDiv, "received");
      }
    });
  }
}

// Helper functions
function findUserById(usersData, userId) {
  for (const [email, user] of Object.entries(usersData)) {
    if (user.id === userId) {
      return {
        ...user,
        email: email.replace(/,/g, "."),
      };
    }
  }
  return null;
}

export {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  loadAllUsers,
  loadFriends,
  loadFriendRequests,
};
