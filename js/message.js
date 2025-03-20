// message.js
import { database } from "./firebaseConfig.js";
import {
  ref,
  get,
  set,
  update,
  push,
  off,
  onChildChanged, // Import onChildChanged
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

import { onChildAdded } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

const sendBtn = document.getElementById("send-btn");
const chatInput = document.getElementById("chat-input");
const messagesContainer = document.getElementById("messages");

let currentChatID = null; // To store the ID of the currently open chat
let isListenerAttached = false; // Flag to prevent multiple listeners

// Function to detach the message listener
function detachMessageListener() {
  if (currentChatID && isListenerAttached) {
    const messagesRef = ref(database, `messages/${currentChatID}`);
    isListenerAttached = false;
    console.log(`Detached listener for chat ID: ${currentChatID}`);
  }
}

// Firebase References
const usersRef = ref(database, "users");
const userChatsRef = ref(database, "userChats");
const statusRef = ref(database, "status");

// Entry Point: Fetch Users & Populate UI
fetchUsers();
listenForStatusChanges(); // Call the function to start listening

/**
 * Fetches all users from the database and displays them
 */
async function fetchUsers() {
  try {
    const snapshot = await get(usersRef);
    const statusSnapshot = await get(statusRef);
    const statuses = statusSnapshot.val() || {};

    if (!snapshot.exists()) {
      alert("No users found in the database.");
      return;
    }

    const allUsers = snapshot.val();
    populateUserList(allUsers, statuses);
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

/**
 * Populates the user list UI with retrieved users
 */
function populateUserList(allUsers, statuses) {
  const userListContainer = document.querySelector(".listProfiles");
  userListContainer.innerHTML = "";

  let firstUser = null;

  for (const email in allUsers) {
    const user = allUsers[email];
    if (user.id === sessionStorage.getItem("currentID")) continue;

    const status = statuses[user.id]?.state || "offline";
    const userDiv = createUserElement(user, email, status);
    userListContainer.appendChild(userDiv);

    if (!firstUser) {
      firstUser = user;
    }
  }

  if (firstUser) {
    handleUserClick(firstUser);
  }
}

function createUserElement(user, email, status) {
  let userDiv = document.createElement("div");
  userDiv.classList.add("user-item");
  userDiv.dataset.id = user.id;

  const statusClass = status === "online" ? "online-status" : (status === "away" ? "away-status" : "offline-status");

  let src = user.profilePicture || "../images/defaultUserLogo.png";
  userDiv.innerHTML = `
    <img src=${src} alt="">
    <div id="item-profile" class="item-profile">
      <span>${user.name} <span class="status-indicator ${statusClass}"></span></span>
      <p>${email.replace(",", ".")}</p>
    </div>
  `;

  const statusIndicator = userDiv.querySelector(".status-indicator");
  statusIndicator.addEventListener("click", () => showLastOnlineTime(user.id));
  statusIndicator.style.cursor = "pointer"; // Indicate it's clickable

  userDiv.addEventListener("click", () => handleUserClick(user));
  return userDiv;
}

async function showLastOnlineTime(userId) {
  const statusRef = ref(database, `status/${userId}`);
  const snapshot = await get(statusRef);

  if (snapshot.exists()) {
    const userStatus = snapshot.val().state;

    if (userStatus === "offline") {
      const lastChanged = snapshot.val().lastChanged;
      const dateTime = new Date(lastChanged);
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
      alert(`Last Online: ${dateTime.toLocaleDateString('en-US', options)}`);
    } else {
      // Do nothing if the user is online or away
      console.log(`User is ${userStatus}, no need to show last online time.`);
    }
  } else {
    // If there's no status information (e.g., user never logged in)
    const defaultDate = new Date('2025-03-19T10:00:00'); // Default date for when there's no data
    alert(`Last Online: ${defaultDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' })} `);
  }
}


/**
 * Handles user click event (opens chat)
 */
function handleUserClick(user) {
  const userID = user.id;
  const currentUserID = sessionStorage.getItem("currentID");
  const chatID = push(userChatsRef).key;

  detachMessageListener();
  messagesContainer.innerHTML = "";

  checkExistingChat(userID, currentUserID)
      .then((existingChatID) => {
        if (existingChatID) {
          console.log("Found existing chat with ID: " + existingChatID);
          currentChatID = existingChatID;
          loadMessages(currentChatID);
        } else {
          createNewChat(userID, currentUserID, chatID);
        }
        document.getElementById("currentUser").textContent = user.name;
        document.getElementById("currentProfilePic").src =
            user.profilePicture || "../images/defaultUserLogo.png";
      })
      .catch((error) =>
          console.error("Error checking for existing chat:", error.message)
      );
}

/**
 * Checks if a chat already exists between two users
 */
async function checkExistingChat(userID, currentID) {
  try {
    const snapshot = await get(userChatsRef);
    let existingChatID = null;

    snapshot.forEach((childSnapshot) => {
      const chatData = childSnapshot.val();
      if (
          (chatData.ReceiverID === userID && chatData.SenderID === currentID) ||
          (chatData.ReceiverID === currentID && chatData.SenderID === userID)
      ) {
        existingChatID = chatData.ChatID;
      }
    });

    return existingChatID;
  } catch (error) {
    console.error("Error checking for existing chat:", error.message);
    return null;
  }
}

/**
 * Creates a new chat if no existing chat is found
 */
function createNewChat(userID, currentUserID, chatID) {
  console.log("No existing chat found, creating a new one...");

  const chatRefCurrent = push(userChatsRef);
  const chatRefUser = push(userChatsRef);

  const chatDataCurrent = {
    ChatID: chatID,
    LastMessage: "",
    ReceiverID: userID,
    SenderID: currentUserID,
    UpdatedDate: Date.now(),
  };

  const chatDataUser = {
    ChatID: chatID,
    LastMessage: "",
    ReceiverID: currentUserID,
    SenderID: userID,
    UpdatedDate: Date.now(),
  };

  Promise.all([
    set(chatRefCurrent, chatDataCurrent),
    set(chatRefUser, chatDataUser),
  ])
      .then(() => {
        console.log(`Chat created successfully with ID: ${chatID}`);
        currentChatID = chatID;
        loadMessages(currentChatID);
      })
      .catch((error) => console.error("Error creating chat:", error.message));
}

/**
 * Sends a message in the current chat
 */
function sendMessage() {
  const logedinUserID = sessionStorage.getItem("currentID");
  const messageText = chatInput.value.trim();

  if (messageText !== "" && currentChatID) {
    appendMessageToUI(messageText);
    storeMessageInDatabase(logedinUserID, messageText);
  } else if (!currentChatID) {
    alert("Please select a user to start chatting.");
  }
}

/**
 * Appends a sent message to the UI instantly
 */
function appendMessageToUI(messageText) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", "sent");
  messageDiv.textContent = messageText;
  messagesContainer.appendChild(messageDiv);
  chatInput.value = "";
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Stores the message in Firebase
 */
function storeMessageInDatabase(senderID, messageText) {
  const messagesRef = ref(database, `messages/${currentChatID}`);
  const newMessageRef = push(messagesRef);

  set(newMessageRef, {
    message: messageText,
    senderID: senderID,
    timestamp: Date.now(),
  })
      .then(() => console.log("Message sent to Firebase!"))
      .catch((error) => console.error("Error sending message:", error));
}

// ✅ Prevent multiple listeners from being attached - now managed with detach
function listenForNewMessages(currChatID) {
  if (isListenerAttached && currChatID === currentChatID) {
    return;
  }
  detachMessageListener();
  isListenerAttached = true;
  currentChatID = currChatID;
  messagesContainer.dataset.chatId = currentChatID;

  const messagesRef = ref(database, `messages/${currChatID}`);

  onChildAdded(messagesRef, (snapshot) => {
    const messageData = snapshot.val();
    if (!messageData) return;

    const messageText = messageData.message;
    const senderID = messageData.senderID;

    if (messagesContainer.dataset.chatId !== snapshot.ref.parent.key) {
      console.warn("Message ignored: Not from current chat");
      return;
    }

    if (
        senderID !== sessionStorage.getItem("currentID") &&
        !document.querySelector(`.message[data-id="${snapshot.key}"]`)
    ) {
      const messageDiv = document.createElement("div");
      messageDiv.classList.add("message", "received");
      messageDiv.setAttribute("data-id", snapshot.key);
      messageDiv.textContent = messageText;

      if (senderID === sessionStorage.getItem("currentID")) {
        messageDiv.classList.remove("received");
        messageDiv.classList.add("sent");
      }

      messagesContainer.appendChild(messageDiv);
      console.log("New message received:", messageText);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });
  console.log(`Attached listener for chat ID: ${currChatID}`);
}

// ✅ Load Messages on Page Load
function loadMessages(currChatID) {
  if (!currChatID) {
    console.error("No chat ID provided.");
    return;
  }

  messagesContainer.innerHTML = "";
  const messagesRef = ref(database, `messages/${currChatID}`);
  get(messagesRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const messageData = childSnapshot.val();
            const messageText = messageData?.message;
            const senderID = messageData?.senderID;

            if (messageText) {
              const messageDiv = document.createElement("div");
              messageDiv.classList.add("message");
              messageDiv.setAttribute("data-id", childSnapshot.key);
              messageDiv.textContent = messageText;

              if (senderID === sessionStorage.getItem("currentID")) {
                messageDiv.classList.add("sent");
              } else {
                messageDiv.classList.add("received");
              }

              messagesContainer.appendChild(messageDiv);
            }
          });
        } else {
          console.log("No messages found for this chat.");
        }
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        listenForNewMessages(currentChatID);
      })
      .catch((error) => {
        console.error("Error loading messages:", error);
      });
}

// Event listener for send button
sendBtn.addEventListener("click", sendMessage);

// Event listener for chat input "Enter" keypress
chatInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});

function listenForStatusChanges() {
  const statusRef = ref(database, "status");

  onChildChanged(statusRef, (snapshot) => {
    const statusData = snapshot.val();
    const userID = snapshot.key;
    const status = statusData?.state || "offline";

    updateUserStatusInUI(userID, status);
  });
}

function updateUserStatusInUI(userID, status) {
  const userDiv = document.querySelector(`.user-item[data-id="${userID}"]`);
  if (!userDiv) return;

  const statusClass = status === "online" ? "online-status" : (status === "away" ? "away-status" : "offline-status");

  const statusSpan = userDiv.querySelector(".item-profile .status-indicator");
  if (statusSpan) {
    statusSpan.className = `status-indicator ${statusClass}`;
  }
}